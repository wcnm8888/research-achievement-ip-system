import { Inject, Injectable } from "@nestjs/common";
import { AchievementStatus } from "@prisma/client";
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
import { AchievementConversionRepository, AchievementConversionTransactionClient } from "./achievement-conversion.repository";
import {
  AchievementConversionStatusCode,
  AchievementConversionTypeCode,
} from "./domain/achievement-conversion-domain.types";
import {
  AchievementConversionAccessDeniedError,
  AchievementConversionInvalidPayloadError,
  AchievementConversionInvalidStateError,
  AchievementConversionNotFoundError,
  AchievementConversionPermissionDeniedError,
} from "./domain/achievement-conversion-service.errors";
import {
  AchievementConversionParentRecord,
  AchievementConversionRecord,
  UpdateAchievementConversionInput,
} from "./domain/achievement-conversion-repository.types";
import { CreateAchievementConversionDto } from "./dto/create-achievement-conversion.dto";
import { UpdateAchievementConversionDto } from "./dto/update-achievement-conversion.dto";

@Injectable()
export class AchievementConversionService {
  constructor(
    @Inject(AchievementConversionRepository)
    private readonly repository: AchievementConversionRepository,
    @Inject(RbacPolicyService)
    private readonly rbacPolicy: RbacPolicyService,
    @Inject(PolicyQueryFactory)
    private readonly policyQueryFactory: PolicyQueryFactory,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async listByAchievement(
    context: UserContext,
    achievementId: string,
  ): Promise<AchievementConversionRecord[]> {
    this.assertUserContext(context);
    this.assertPermission(context, PermissionCode.achievementReadDepartment);

    return this.repository.listByAchievementWhere({
      achievementId,
      achievementWhere: this.policyQueryFactory.achievementDepartmentWhere(
        context,
        PermissionCode.achievementReadDepartment,
      ),
    });
  }

  async createConversion(
    context: UserContext,
    achievementId: string,
    dto: CreateAchievementConversionDto,
  ): Promise<AchievementConversionRecord> {
    this.assertUserContext(context);
    this.assertPermission(context, PermissionCode.achievementReadDepartment);

    const parent = await this.repository.findAchievementParentByIdWhere(
      achievementId,
      this.policyQueryFactory.achievementDepartmentWhere(
        context,
        PermissionCode.achievementReadDepartment,
      ),
    );

    if (!parent) {
      throw new AchievementConversionNotFoundError("Related achievement was not found.");
    }

    this.assertArchivedParent(parent);

    const input = {
      achievementId,
      departmentId: parent.departmentId,
      conversionType: dto.conversionType,
      counterpartyName: dto.counterpartyName.trim(),
      contractAmount: normalizeNullableAmount(dto.contractAmount),
      revenueAmount: normalizeNullableAmount(dto.revenueAmount),
      status: dto.status,
      conversionDate: parseNullableDate(dto.conversionDate),
      benefitDistributionSummary: normalizeNullableText(dto.benefitDistributionSummary),
      remarks: normalizeNullableText(dto.remarks),
      createdById: context.userId,
      updatedById: context.userId,
    };

    this.assertConversionAmounts(input.contractAmount, input.revenueAmount);

    return this.prisma.$transaction(async (tx) => {
      const client = tx as AchievementConversionTransactionClient;
      const created = await this.repository.createInTransaction(client, input);

      await this.auditService.recordEventInTransaction(
        tx as AuditTransactionClient,
        this.toConversionAuditEvent(context, AuditActionCode.create, null, created, parent),
      );

      return created;
    });
  }

  async updateConversion(
    context: UserContext,
    conversionId: string,
    dto: UpdateAchievementConversionDto,
  ): Promise<AchievementConversionRecord> {
    this.assertUserContext(context);
    this.assertPermission(context, PermissionCode.achievementReadDepartment);

    const achievementWhere = this.policyQueryFactory.achievementDepartmentWhere(
      context,
      PermissionCode.achievementReadDepartment,
    );
    const current = await this.repository.findByIdWhere({
      conversionId,
      achievementWhere,
    });

    if (!current) {
      throw new AchievementConversionNotFoundError();
    }

    const input = this.toUpdateInput(context, conversionId, dto);
    this.assertConversionAmounts(
      input.contractAmount === undefined
        ? parseStoredAmount(current.contractAmount)
        : input.contractAmount,
      input.revenueAmount === undefined
        ? parseStoredAmount(current.revenueAmount)
        : input.revenueAmount,
    );

    const parent = {
      id: current.achievementId,
      status: current.achievement.status,
      departmentId: current.departmentId,
    };

    return this.prisma.$transaction(async (tx) => {
      const client = tx as AchievementConversionTransactionClient;
      const updated = await this.repository.updateInTransaction(client, input);

      await this.auditService.recordEventInTransaction(
        tx as AuditTransactionClient,
        this.toConversionAuditEvent(context, AuditActionCode.update, current, updated, parent),
      );

      return updated;
    });
  }

  private assertUserContext(context: UserContext | null | undefined): asserts context is UserContext {
    if (!context?.userId || !context.departmentId) {
      throw new AchievementConversionAccessDeniedError("User context with department is required.");
    }
  }

  private assertPermission(context: UserContext, permission: PermissionCode): void {
    const decision = this.rbacPolicy.hasPermission(context, permission);

    if (decision.effect === "DENY") {
      throw new AchievementConversionPermissionDeniedError(permission);
    }
  }

  private assertArchivedParent(parent: AchievementConversionParentRecord): void {
    if (parent.status !== AchievementStatus.ARCHIVED) {
      throw new AchievementConversionInvalidStateError(
        "Achievement conversion records can only be created for archived achievements in the MVP.",
      );
    }
  }

  private assertConversionAmounts(
    contractAmount: number | null,
    revenueAmount: number | null,
  ): void {
    if (
      contractAmount !== null &&
      revenueAmount !== null &&
      revenueAmount > contractAmount
    ) {
      throw new AchievementConversionInvalidPayloadError(
        "Revenue amount cannot exceed contract amount in the MVP ledger.",
      );
    }
  }

  private toUpdateInput(
    context: UserContext,
    conversionId: string,
    dto: UpdateAchievementConversionDto,
  ): UpdateAchievementConversionInput {
    return {
      conversionId,
      ...(dto.conversionType !== undefined ? { conversionType: dto.conversionType } : {}),
      ...(dto.counterpartyName !== undefined
        ? { counterpartyName: dto.counterpartyName.trim() }
        : {}),
      ...(dto.contractAmount !== undefined
        ? { contractAmount: normalizeNullableAmount(dto.contractAmount) }
        : {}),
      ...(dto.revenueAmount !== undefined
        ? { revenueAmount: normalizeNullableAmount(dto.revenueAmount) }
        : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.conversionDate !== undefined
        ? { conversionDate: parseNullableDate(dto.conversionDate) }
        : {}),
      ...(dto.benefitDistributionSummary !== undefined
        ? { benefitDistributionSummary: normalizeNullableText(dto.benefitDistributionSummary) }
        : {}),
      ...(dto.remarks !== undefined ? { remarks: normalizeNullableText(dto.remarks) } : {}),
      updatedById: context.userId,
    };
  }

  private toConversionAuditEvent(
    context: UserContext,
    action: AuditActionCode,
    oldRecord: AchievementConversionRecord | null,
    newRecord: AchievementConversionRecord,
    parent: ConversionAuditTarget,
  ): CreateAuditEventInput {
    return {
      actor: {
        userId: context.userId,
        departmentId: context.departmentId,
      },
      action,
      target: {
        type: AuditTargetTypeCode.achievementConversion,
        id: newRecord.id,
        departmentId: newRecord.departmentId,
        secretLevel: parent.secretLevel as SecretLevelCode | undefined,
      },
      oldValue: oldRecord ? toConversionAuditSummary(action, oldRecord) : null,
      newValue: toConversionAuditSummary(action, newRecord, oldRecord),
    };
  }
}

const normalizeNullableText = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeNullableAmount = (value: number | null | undefined): number | null =>
  value === undefined || value === null ? null : value;

const parseNullableDate = (value: string | null | undefined): Date | null =>
  value ? new Date(value) : null;

const parseStoredAmount = (value: string | null): number | null =>
  value === null ? null : Number(value);

const toConversionAuditSummary = (
  action: AuditActionCode,
  record: AchievementConversionRecord,
  oldRecord?: AchievementConversionRecord | null,
): AuditJsonValue =>
  ({
    achievementConversionId: record.id,
    achievementId: record.achievementId,
    action,
    conversionType: record.conversionType as AchievementConversionTypeCode,
    status: record.status as AchievementConversionStatusCode,
    ...(oldRecord
      ? {
          oldStatus: oldRecord.status,
          newStatus: record.status,
        }
      : {}),
    contractAmountProvided: record.contractAmount !== null,
    revenueAmountProvided: record.revenueAmount !== null,
    benefitDistributionSummaryProvided: Boolean(record.benefitDistributionSummary),
    remarksProvided: Boolean(record.remarks),
    conversionDate: record.conversionDate ? record.conversionDate.toISOString() : null,
  }) as AuditJsonValue;

type ConversionAuditTarget = Pick<
  AchievementConversionParentRecord,
  "departmentId" | "id" | "status"
> & {
  secretLevel?: SecretLevelCode;
};
