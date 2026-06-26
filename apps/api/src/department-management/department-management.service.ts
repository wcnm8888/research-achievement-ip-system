import { Inject, Injectable } from "@nestjs/common";
import { DepartmentStatus } from "@prisma/client";
import { AuditTransactionClient } from "../audit/audit.repository";
import { AuditService } from "../audit/audit.service";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { CreateAuditEventInput } from "../audit/domain/audit-event.types";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RbacPolicyService } from "../authorization/policy/rbac-policy.service";
import { PrismaService } from "../database/prisma.service";
import { UserContext } from "../identity/user-context";
import {
  DepartmentManagementAccessDeniedError,
  DepartmentManagementConflictError,
  DepartmentManagementNotFoundError,
  DepartmentManagementPermissionDeniedError,
} from "./department-management.errors";
import {
  DepartmentImpactSummary,
  DepartmentManagementRepository,
  DepartmentManagementTransactionClient,
  DepartmentRecord,
} from "./department-management.repository";
import {
  CreateDepartmentDto,
  DepartmentTreeResponseDto,
  ListDepartmentsQueryDto,
  DepartmentManagementReasonDto,
  UpdateDepartmentDto,
} from "./dto/department-management.dto";

type DepartmentAuditOperation =
  | "DEPARTMENT_CREATE"
  | "DEPARTMENT_UPDATE"
  | "DEPARTMENT_DISABLE"
  | "DEPARTMENT_ENABLE";

type DisableDepartmentResult = {
  department: DepartmentRecord;
  impactSummary: DepartmentImpactSummary;
};

@Injectable()
export class DepartmentManagementService {
  constructor(
    @Inject(DepartmentManagementRepository)
    private readonly repository: DepartmentManagementRepository,
    @Inject(RbacPolicyService)
    private readonly rbacPolicy: RbacPolicyService,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async listDepartments(context: UserContext, query: ListDepartmentsQueryDto = {}) {
    this.assertCanManageDepartments(context);

    return this.repository.findMany({
      keyword: query.keyword?.trim(),
      status: query.status,
      parentId: query.parentId,
      includeArchived: query.includeArchived,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  async listDepartmentTree(
    context: UserContext,
    query: ListDepartmentsQueryDto = {},
  ): Promise<{ items: DepartmentTreeResponseDto[] }> {
    this.assertCanManageDepartments(context);

    const rows = await this.repository.findTreeRows({
      keyword: query.keyword?.trim(),
      status: query.status,
      parentId: query.parentId,
      includeArchived: query.includeArchived,
    });

    return { items: toDepartmentTree(rows) };
  }

  async getDepartment(
    context: UserContext,
    departmentId: string,
  ): Promise<DepartmentRecord> {
    this.assertCanManageDepartments(context);

    return this.requireDepartment(departmentId);
  }

  async createDepartment(
    context: UserContext,
    dto: CreateDepartmentDto,
  ): Promise<DepartmentRecord> {
    this.assertCanManageDepartments(context);
    const input = {
      code: dto.code.trim(),
      name: dto.name.trim(),
      parentId: normalizeParentId(dto.parentId),
    };
    await this.assertValidParent(input.parentId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const departmentClient = tx as DepartmentManagementTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const department = await this.repository.createInTransaction(
          departmentClient,
          input,
        );

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toDepartmentAuditEvent(context, department, "DEPARTMENT_CREATE", {
            oldValue: null,
            newValue: {
              code: department.code,
              name: department.name,
              parentId: department.parentId,
              status: department.status,
            },
          }),
        );

        return department;
      });
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async updateDepartment(
    context: UserContext,
    departmentId: string,
    dto: UpdateDepartmentDto,
  ): Promise<DepartmentRecord> {
    this.assertCanManageDepartments(context);
    const current = await this.requireDepartment(departmentId);
    const input = {
      ...(dto.code !== undefined ? { code: dto.code.trim() } : {}),
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.parentId !== undefined ? { parentId: normalizeParentId(dto.parentId) } : {}),
    };
    await this.assertValidParent(input.parentId, departmentId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const departmentClient = tx as DepartmentManagementTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const department = await this.repository.updateInTransaction(
          departmentClient,
          departmentId,
          input,
        );

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toDepartmentAuditEvent(context, department, "DEPARTMENT_UPDATE", {
            oldValue: {
              code: current.code,
              name: current.name,
              parentId: current.parentId,
              status: current.status,
            },
            newValue: {
              code: department.code,
              name: department.name,
              parentId: department.parentId,
              status: department.status,
            },
          }),
        );

        return department;
      });
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async disableDepartment(
    context: UserContext,
    departmentId: string,
    dto: DepartmentManagementReasonDto = {},
  ): Promise<DisableDepartmentResult> {
    this.assertCanManageDepartments(context);
    const current = await this.requireDepartment(departmentId);
    if (current.status === DepartmentStatus.ARCHIVED) {
      throw new DepartmentManagementConflictError("Department is already disabled.");
    }

    const impactSummary = await this.repository.getDisableImpactSummary(departmentId);
    this.assertCanDisableDepartment(impactSummary);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const departmentClient = tx as DepartmentManagementTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const department = await this.repository.disableInTransaction(
          departmentClient,
          departmentId,
          new Date(),
        );

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toDepartmentAuditEvent(context, department, "DEPARTMENT_DISABLE", {
            oldValue: {
              status: current.status,
              archivedAt: current.archivedAt,
            },
            newValue: {
              status: department.status,
              archivedAt: department.archivedAt,
              reason: normalizeReason(dto.reason),
              impactSummary,
            },
          }),
        );

        return { department, impactSummary };
      });
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async enableDepartment(
    context: UserContext,
    departmentId: string,
    dto: DepartmentManagementReasonDto = {},
  ): Promise<DepartmentRecord> {
    this.assertCanManageDepartments(context);
    const current = await this.requireDepartment(departmentId);
    if (current.status === DepartmentStatus.ACTIVE && current.archivedAt === null) {
      throw new DepartmentManagementConflictError("Department is already enabled.");
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const departmentClient = tx as DepartmentManagementTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const department = await this.repository.enableInTransaction(
          departmentClient,
          departmentId,
        );

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toDepartmentAuditEvent(context, department, "DEPARTMENT_ENABLE", {
            oldValue: {
              status: current.status,
              archivedAt: current.archivedAt,
            },
            newValue: {
              status: department.status,
              archivedAt: department.archivedAt,
              reason: normalizeReason(dto.reason),
            },
          }),
        );

        return department;
      });
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  private assertCanManageDepartments(context: UserContext | null | undefined): void {
    if (!context?.userId || !context.departmentId) {
      throw new DepartmentManagementAccessDeniedError();
    }

    const decision = this.rbacPolicy.hasPermission(context, PermissionCode.systemConfig);
    if (decision.effect === "DENY") {
      throw new DepartmentManagementPermissionDeniedError(PermissionCode.systemConfig);
    }
  }

  private async requireDepartment(departmentId: string): Promise<DepartmentRecord> {
    const department = await this.repository.findById(departmentId);
    if (!department) {
      throw new DepartmentManagementNotFoundError("Department was not found.");
    }

    return department;
  }

  private async assertValidParent(
    parentId: string | null | undefined,
    currentDepartmentId?: string,
  ): Promise<void> {
    if (parentId === undefined || parentId === null) {
      return;
    }

    if (parentId === currentDepartmentId) {
      throw new DepartmentManagementConflictError("Department cannot be its own parent.");
    }

    const parent = await this.repository.findById(parentId);
    if (!parent) {
      throw new DepartmentManagementNotFoundError("Parent department was not found.");
    }

    if (parent.status !== DepartmentStatus.ACTIVE || parent.archivedAt !== null) {
      throw new DepartmentManagementConflictError("Parent department must be active.");
    }

    if (currentDepartmentId) {
      await this.assertParentDoesNotCreateCycle(parentId, currentDepartmentId);
    }
  }

  private async assertParentDoesNotCreateCycle(
    parentId: string,
    currentDepartmentId: string,
  ): Promise<void> {
    const visitedDepartmentIds = new Set<string>();
    let nextParentId: string | null = parentId;

    while (nextParentId) {
      if (nextParentId === currentDepartmentId) {
        throw new DepartmentManagementConflictError(
          "Department parent hierarchy cannot contain a cycle.",
        );
      }

      if (visitedDepartmentIds.has(nextParentId)) {
        throw new DepartmentManagementConflictError(
          "Department parent hierarchy cannot contain a cycle.",
        );
      }
      visitedDepartmentIds.add(nextParentId);

      const parent = await this.repository.findById(nextParentId);
      nextParentId = parent?.parentId ?? null;
    }
  }

  private assertCanDisableDepartment(impactSummary: DepartmentImpactSummary): void {
    if (
      impactSummary.activeUsersCount > 0 ||
      impactSummary.activeUserRoleScopesCount > 0 ||
      impactSummary.pendingWorkflowTasksCount > 0
    ) {
      throw new DepartmentManagementConflictError(
        "Department cannot be disabled while active users, active role scopes, or pending workflow tasks exist.",
      );
    }
  }

  private mapRepositoryError(error: unknown): Error {
    if (this.repository.isPrismaUniqueConflict(error)) {
      return new DepartmentManagementConflictError("Department code already exists.");
    }

    if (this.repository.isPrismaRecordNotFound(error)) {
      return new DepartmentManagementNotFoundError("Department was not found.");
    }

    return error instanceof Error
      ? error
      : new Error("Unknown department management service error.");
  }

  private toDepartmentAuditEvent(
    context: UserContext,
    department: DepartmentRecord,
    operation: DepartmentAuditOperation,
    values: {
      oldValue: Record<string, unknown> | null;
      newValue: Record<string, unknown>;
    },
  ): CreateAuditEventInput {
    return {
      actor: {
        userId: context.userId,
        departmentId: context.departmentId,
      },
      action: AuditActionCode.configUpdate,
      target: {
        type: AuditTargetTypeCode.systemConfig,
        id: department.id,
        departmentId: department.id,
      },
      oldValue: values.oldValue
        ? {
            operation,
            departmentId: department.id,
            ...values.oldValue,
          }
        : null,
      newValue: {
        operation,
        departmentId: department.id,
        ...values.newValue,
      },
    };
  }
}

const normalizeParentId = (parentId: string | null | undefined): string | null => {
  const normalized = parentId?.trim();
  return normalized ? normalized : null;
};

const normalizeReason = (reason: string | null | undefined): string | null => {
  const normalized = reason?.trim();
  return normalized ? normalized : null;
};

const toDepartmentTree = (
  rows: readonly DepartmentRecord[],
): DepartmentTreeResponseDto[] => {
  const nodeById = new Map<string, DepartmentTreeResponseDto>();
  for (const row of rows) {
    nodeById.set(row.id, { ...row, children: [] });
  }

  const roots: DepartmentTreeResponseDto[] = [];
  for (const row of rows) {
    const node = nodeById.get(row.id);
    if (!node) {
      continue;
    }

    const parent = row.parentId ? nodeById.get(row.parentId) : null;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
};
