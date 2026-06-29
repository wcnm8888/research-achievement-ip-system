import { Inject, Injectable } from "@nestjs/common";
import { DepartmentStatus } from "@prisma/client";
import { AuditTransactionClient } from "../audit/audit.repository";
import { AuditService } from "../audit/audit.service";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { AuditJsonValue, CreateAuditEventInput } from "../audit/domain/audit-event.types";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { PermissionCode } from "../authorization/constants/permission-code";
import { SecretLevelCode } from "../authorization/constants/secret-level-code";
import { PolicyQueryFactory } from "../authorization/policy/policy-query.factory";
import { RbacPolicyService } from "../authorization/policy/rbac-policy.service";
import { PrismaService } from "../database/prisma.service";
import { UserContext } from "../identity/user-context";
import { FeeRepository, FeeTransactionClient } from "./fee.repository";
import { InvalidFeeTransitionError } from "./domain/fee-errors";
import { FeeStatusTransitionConflictError } from "./domain/fee-repository.errors";
import {
  FeeAchievementParentRecord,
  FeeRecordRecord,
  FeeStateRecord,
  FeeWarningRecord,
} from "./domain/fee-repository.types";
import {
  FeeConflictError,
  FeeDepartmentUnavailableError,
  FeeInvalidTransitionError,
  FeeNotFoundError,
  FeePermissionDeniedError,
  FeeAccessDeniedError,
} from "./domain/fee-service.errors";
import { assertFeeTransition } from "./domain/fee-state-machine";
import { FeeWarningTypeCode, PayStatusCode } from "./domain/fee-domain.types";
import { ChangeFeeStatusDto } from "./dto/change-fee-status.dto";
import { CreateFeeRecordDto } from "./dto/create-fee-record.dto";
import { FeeQueryDto } from "./dto/fee-query.dto";
import { FeeWarningQueryDto } from "./dto/fee-warning-query.dto";
import { MarkFeePaidDto } from "./dto/mark-fee-paid.dto";

export type FeeWarningSummary = {
  generatedAt: Date;
  today: string;
  dueSoonDays: number;
  total: number;
  overdueCount: number;
  dueSoonCount: number;
  items: FeeWarningRecord[];
};

@Injectable()
export class FeeService {
  constructor(
    @Inject(FeeRepository)
    private readonly repository: FeeRepository,
    @Inject(RbacPolicyService)
    private readonly rbacPolicy: RbacPolicyService,
    @Inject(PolicyQueryFactory)
    private readonly policyQueryFactory: PolicyQueryFactory,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async listFees(
    context: UserContext,
    query: FeeQueryDto = {},
  ): Promise<FeeRecordRecord[]> {
    this.assertUserContext(context);
    this.assertAnyPermission(context, [
      PermissionCode.feeReadDepartment,
      PermissionCode.feeManageDepartment,
    ]);

    return this.repository.findMany({
      where: this.policyQueryFactory.feeReadableWhere(context),
      achievementId: query.achievementId,
      departmentId: query.departmentId,
      feeType: query.feeType,
      payStatus: query.payStatus,
      dueDateFrom: parseOptionalDate(query.dueDateFrom),
      dueDateTo: parseOptionalDate(query.dueDateTo),
      includeArchived: query.includeArchived,
      take: query.take,
    });
  }

  async getFee(context: UserContext, feeRecordId: string): Promise<FeeRecordRecord> {
    this.assertUserContext(context);
    this.assertAnyPermission(context, [
      PermissionCode.feeReadDepartment,
      PermissionCode.feeManageDepartment,
    ]);

    const record = await this.repository.findByIdWhere(
      feeRecordId,
      this.policyQueryFactory.feeReadableWhere(context),
    );

    if (!record) {
      throw new FeeNotFoundError();
    }

    return record;
  }

  async getFeeWarnings(
    context: UserContext,
    query: FeeWarningQueryDto = {},
  ): Promise<FeeWarningSummary> {
    this.assertUserContext(context);
    this.assertAnyPermission(context, [
      PermissionCode.feeReadDepartment,
      PermissionCode.feeManageDepartment,
    ]);

    const today = toUtcDateOnly(parseOptionalDate(query.today) ?? new Date());
    const dueSoonDays = query.dueSoonDays ?? 30;
    const items = await this.repository.findWarnings({
      where: this.policyQueryFactory.feeReadableWhere(context),
      today,
      dueSoonDays,
      take: query.take,
    });

    return {
      generatedAt: new Date(),
      today: toDateOnlyString(today),
      dueSoonDays,
      total: items.length,
      overdueCount: items.filter((item) => item.warningType === FeeWarningTypeCode.overdue).length,
      dueSoonCount: items.filter((item) => item.warningType === FeeWarningTypeCode.dueSoon).length,
      items,
    };
  }

  async createFee(
    context: UserContext,
    dto: CreateFeeRecordDto,
  ): Promise<FeeRecordRecord> {
    this.assertUserContext(context);
    this.assertPermission(context, PermissionCode.feeManageDepartment);

    const parent = await this.repository.findAchievementParentByIdWhere(
      dto.achievementId,
      this.policyQueryFactory.achievementDepartmentWhere(
        context,
        PermissionCode.feeManageDepartment,
      ),
    );

    if (!parent) {
      throw new FeeNotFoundError("Related achievement was not found.");
    }

    this.assertAchievementDepartmentActive(parent);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const feeClient = tx as FeeTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const record = await this.repository.createInTransaction(feeClient, {
          achievementId: dto.achievementId,
          departmentId: parent.departmentId,
          feeType: dto.feeType,
          fundSource: dto.fundSource ?? null,
          amount: dto.amount,
          dueDate: dto.dueDate,
          voucherNo: dto.voucherNo ?? null,
          createdById: context.userId,
          updatedById: context.userId,
        });

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toFeeAuditEvent(context, AuditActionCode.create, null, record, parent),
        );

        return record;
      });
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async markFeePaid(
    context: UserContext,
    feeRecordId: string,
    dto: MarkFeePaidDto = {},
  ): Promise<FeeStateRecord> {
    this.assertUserContext(context);
    this.assertPermission(context, PermissionCode.feeManageDepartment);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const feeClient = tx as FeeTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const current = await this.repository.findStateByIdWhereInTransaction(
          feeClient,
          feeRecordId,
          this.policyQueryFactory.feeDepartmentWhere(
            context,
            PermissionCode.feeManageDepartment,
          ),
        );

        if (!current) {
          throw new FeeNotFoundError();
        }

        try {
          assertFeeTransition(current.payStatus, PayStatusCode.paid);
        } catch (error) {
          if (error instanceof InvalidFeeTransitionError) {
            throw new FeeInvalidTransitionError(current.payStatus, PayStatusCode.paid);
          }

          throw error;
        }

        const next = await this.repository.transitionPayStatusInTransaction(feeClient, {
          feeRecordId,
          expectedStatus: current.payStatus,
          nextStatus: PayStatusCode.paid,
          paidDate: dto.paidDate ?? new Date(),
          voucherNo: dto.voucherNo ?? current.voucherNo,
          updatedById: context.userId,
        });

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toFeeAuditEvent(context, AuditActionCode.markFeePaid, current, next),
        );

        return next;
      });
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async waiveFee(
    context: UserContext,
    feeRecordId: string,
    dto: ChangeFeeStatusDto,
  ): Promise<FeeStateRecord> {
    return this.transitionFeeStatusWithReason(
      context,
      feeRecordId,
      PayStatusCode.waived,
      dto.reason,
      AuditActionCode.waiveFee,
    );
  }

  async cancelFee(
    context: UserContext,
    feeRecordId: string,
    dto: ChangeFeeStatusDto,
  ): Promise<FeeStateRecord> {
    return this.transitionFeeStatusWithReason(
      context,
      feeRecordId,
      PayStatusCode.cancelled,
      dto.reason,
      AuditActionCode.cancelFee,
    );
  }

  private async transitionFeeStatusWithReason(
    context: UserContext,
    feeRecordId: string,
    nextStatus: PayStatusCode,
    reason: string,
    action: AuditActionCode,
  ): Promise<FeeStateRecord> {
    this.assertUserContext(context);
    this.assertPermission(context, PermissionCode.feeManageDepartment);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const feeClient = tx as FeeTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const current = await this.repository.findStateByIdWhereInTransaction(
          feeClient,
          feeRecordId,
          this.policyQueryFactory.feeDepartmentWhere(
            context,
            PermissionCode.feeManageDepartment,
          ),
        );

        if (!current) {
          throw new FeeNotFoundError();
        }

        try {
          assertFeeTransition(current.payStatus, nextStatus);
        } catch (error) {
          if (error instanceof InvalidFeeTransitionError) {
            throw new FeeInvalidTransitionError(current.payStatus, nextStatus);
          }

          throw error;
        }

        const next = await this.repository.transitionPayStatusInTransaction(feeClient, {
          feeRecordId,
          expectedStatus: current.payStatus,
          nextStatus,
          updatedById: context.userId,
        });

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toFeeAuditEvent(context, action, current, next, undefined, reason),
        );

        return next;
      });
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  private assertUserContext(context: UserContext | null | undefined): asserts context is UserContext {
    if (!context?.userId || !context.departmentId) {
      throw new FeeAccessDeniedError("User context with department is required.");
    }
  }

  private assertPermission(context: UserContext, permission: PermissionCode): void {
    const decision = this.rbacPolicy.hasPermission(context, permission);

    if (decision.effect === "DENY") {
      throw new FeePermissionDeniedError(permission);
    }
  }

  private assertAnyPermission(
    context: UserContext,
    permissions: readonly PermissionCode[],
  ): void {
    const decision = this.rbacPolicy.hasAnyPermission(context, permissions);

    if (decision.effect === "DENY") {
      throw new FeePermissionDeniedError(permissions);
    }
  }

  private mapRepositoryError(error: unknown): Error {
    if (error instanceof FeeStatusTransitionConflictError) {
      return new FeeConflictError(error.message);
    }

    if (this.repository.isPrismaUniqueConflict(error)) {
      return new FeeConflictError("Fee record already exists for this achievement, fee type, and due date.");
    }

    return error instanceof Error ? error : new Error("Unknown fee service error.");
  }

  private assertAchievementDepartmentActive(parent: FeeAchievementParentRecord): void {
    if (
      parent.department.status !== DepartmentStatus.ACTIVE ||
      parent.department.archivedAt
    ) {
      throw new FeeDepartmentUnavailableError();
    }
  }

  private toFeeAuditEvent(
    context: UserContext,
    action: AuditActionCode,
    oldRecord: FeeAuditRecord | null,
    newRecord: FeeAuditRecord,
    parent?: FeeAchievementParentRecord,
    reason?: string,
  ): CreateAuditEventInput {
    return {
      actor: {
        userId: context.userId,
        departmentId: context.departmentId,
      },
      action,
      target: {
        type: AuditTargetTypeCode.feeRecord,
        id: newRecord.id,
        departmentId: newRecord.departmentId,
        secretLevel: parent?.secretLevel as SecretLevelCode | undefined,
      },
      oldValue: oldRecord ? toFeeAuditSummary(action, oldRecord) : null,
      newValue: toFeeAuditSummary(action, newRecord, oldRecord, reason),
    };
  }
}

type FeeAuditRecord = Pick<
  FeeRecordRecord | FeeStateRecord,
  "id" | "achievementId" | "departmentId" | "feeType" | "dueDate" | "paidDate" | "payStatus"
>;

const toFeeAuditSummary = (
  action: AuditActionCode,
  record: FeeAuditRecord,
  oldRecord?: FeeAuditRecord | null,
  reason?: string,
): AuditJsonValue =>
  ({
    feeRecordId: record.id,
    achievementId: record.achievementId,
    action,
    feeType: record.feeType,
    payStatus: record.payStatus,
    ...(oldRecord
      ? {
          oldStatus: oldRecord.payStatus,
          newStatus: record.payStatus,
        }
      : {}),
    ...(reason ? { reason } : {}),
    dueDate: toAuditDateString(record.dueDate),
    ...(record.paidDate ? { paidDate: toAuditDateString(record.paidDate) } : {}),
  }) as AuditJsonValue;

const parseOptionalDate = (value: string | undefined): Date | undefined =>
  value ? new Date(value) : undefined;

const toAuditDateString = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : value;

const toUtcDateOnly = (value: Date): Date =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

const toDateOnlyString = (value: Date): string => value.toISOString().slice(0, 10);
