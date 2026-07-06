import { SetMetadata } from "@nestjs/common";
import { PermissionCode } from "../constants/permission-code";
import {
  requiredAnyPermissionsMetadataKey,
  requiredPermissionsMetadataKey,
} from "./authorization-metadata";

export const RequirePermissions = (
  ...permissions: [PermissionCode, ...PermissionCode[]]
) => SetMetadata(requiredPermissionsMetadataKey, permissions);

export const RequireAnyPermission = (
  ...permissions: [PermissionCode, ...PermissionCode[]]
) => SetMetadata(requiredAnyPermissionsMetadataKey, permissions);
