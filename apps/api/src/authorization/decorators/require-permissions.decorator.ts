import { SetMetadata } from "@nestjs/common";
import { PermissionCode } from "../constants/permission-code";
import { requiredPermissionsMetadataKey } from "./authorization-metadata";

export const RequirePermissions = (
  ...permissions: [PermissionCode, ...PermissionCode[]]
) => SetMetadata(requiredPermissionsMetadataKey, permissions);
