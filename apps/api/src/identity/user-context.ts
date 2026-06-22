import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";

export type RoleScope = {
  roleCode: RoleCode;
  scopeType: ScopeType;
  scopeKey: string;
  departmentId: string | null;
};

export type UserContext = {
  userId: string;
  departmentId: string;
  roleIds: readonly string[];
  roleCodes: readonly RoleCode[];
  permissionCodes: readonly PermissionCode[];
  roleScopes: readonly RoleScope[];
  scopedDepartmentIds: readonly string[];
};
