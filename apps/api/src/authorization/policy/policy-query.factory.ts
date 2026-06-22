import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { UserContext } from "../../identity/user-context";
import { PermissionCode } from "../constants/permission-code";
import { DepartmentScopeService } from "./department-scope.service";
import { RbacPolicyService } from "./rbac-policy.service";

@Injectable()
export class PolicyQueryFactory {
  constructor(
    @Inject(RbacPolicyService)
    private readonly rbacPolicy: RbacPolicyService,
    @Inject(DepartmentScopeService)
    private readonly departmentScope: DepartmentScopeService,
  ) {}

  achievementReadableWhere(context: UserContext | null | undefined): Prisma.AchievementWhereInput {
    const branches: Prisma.AchievementWhereInput[] = [];

    if (context && this.hasPermission(context, PermissionCode.achievementReadOwn)) {
      branches.push({ ownerUserId: context.userId });
    }

    const scopedDepartmentIds = [...this.departmentScope.getScopedDepartmentIds(context)];

    if (
      scopedDepartmentIds.length > 0 &&
      this.hasPermission(context, PermissionCode.achievementReadDepartment)
    ) {
      branches.push({ departmentId: { in: scopedDepartmentIds } });
    }

    if (branches.length === 0) {
      return this.noAccessAchievementWhere();
    }

    return { OR: branches };
  }

  achievementOwnedWhere(
    context: UserContext | null | undefined,
    requiredPermission: PermissionCode = PermissionCode.achievementReadOwn,
  ): Prisma.AchievementWhereInput {
    if (!context || !this.hasPermission(context, requiredPermission)) {
      return this.noAccessAchievementWhere();
    }

    return { ownerUserId: context.userId };
  }

  achievementDepartmentWhere(
    context: UserContext | null | undefined,
    requiredPermission: PermissionCode = PermissionCode.achievementReadDepartment,
  ): Prisma.AchievementWhereInput {
    const scopedDepartmentIds = [...this.departmentScope.getScopedDepartmentIds(context)];

    if (scopedDepartmentIds.length === 0 || !this.hasPermission(context, requiredPermission)) {
      return this.noAccessAchievementWhere();
    }

    return { departmentId: { in: scopedDepartmentIds } };
  }

  feeReadableWhere(context: UserContext | null | undefined): Prisma.FeeRecordWhereInput {
    const scopedDepartmentIds = [...this.departmentScope.getScopedDepartmentIds(context)];

    if (
      scopedDepartmentIds.length === 0 ||
      this.rbacPolicy.hasAnyPermission(context, [
        PermissionCode.feeReadDepartment,
        PermissionCode.feeManageDepartment,
      ]).effect === "DENY"
    ) {
      return this.noAccessFeeWhere();
    }

    return { departmentId: { in: scopedDepartmentIds } };
  }

  feeDepartmentWhere(
    context: UserContext | null | undefined,
    requiredPermission: PermissionCode = PermissionCode.feeReadDepartment,
  ): Prisma.FeeRecordWhereInput {
    const scopedDepartmentIds = [...this.departmentScope.getScopedDepartmentIds(context)];

    if (scopedDepartmentIds.length === 0 || !this.hasPermission(context, requiredPermission)) {
      return this.noAccessFeeWhere();
    }

    return { departmentId: { in: scopedDepartmentIds } };
  }

  departmentReadableWhere(context: UserContext | null | undefined): Prisma.DepartmentWhereInput {
    const scopedDepartmentIds = [...this.departmentScope.getScopedDepartmentIds(context)];

    if (
      scopedDepartmentIds.length === 0 ||
      !this.hasPermission(context, PermissionCode.departmentReadDepartment)
    ) {
      return this.noAccessDepartmentWhere();
    }

    return { id: { in: scopedDepartmentIds } };
  }

  private hasPermission(
    context: UserContext | null | undefined,
    permission: PermissionCode,
  ): boolean {
    return this.rbacPolicy.hasPermission(context, permission).effect === "ALLOW";
  }

  private noAccessAchievementWhere(): Prisma.AchievementWhereInput {
    return { id: { in: [] } };
  }

  private noAccessFeeWhere(): Prisma.FeeRecordWhereInput {
    return { id: { in: [] } };
  }

  private noAccessDepartmentWhere(): Prisma.DepartmentWhereInput {
    return { id: { in: [] } };
  }
}
