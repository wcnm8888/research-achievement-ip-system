import { describe, expect, it } from "vitest";
import { AttachmentStatusCode } from "./attachment-status-code";
import { GrantStatusCode } from "./grant-status-code";
import { GrantTypeCode } from "./grant-type-code";
import { GranteeTypeCode } from "./grantee-type-code";
import { PermissionCode } from "./permission-code";
import { RoleCode } from "./role-code";
import { SecretLevelCode } from "./secret-level-code";

describe("authorization constants", () => {
  it("includes the Step 4A department admin role", () => {
    expect(RoleCode.departmentAdmin).toBe("DEPARTMENT_ADMIN");
  });

  it("includes the confirmed Step 4A granular permissions", () => {
    expect(PermissionCode.userContextRead).toBe("user_context:read");
    expect(PermissionCode.attachmentReadMetadata).toBe("attachment:read_metadata");
    expect(PermissionCode.attachmentDownload).toBe("attachment:download");
    expect(PermissionCode.auditReadMasked).toBe("audit:read_masked");
    expect(PermissionCode.departmentReadDepartment).toBe("department:read_department");
    expect(PermissionCode.accountInvite).toBe("account:invite");
    expect(PermissionCode.accountResetPassword).toBe("account:reset_password");
    expect(PermissionCode.feeReadDepartment).toBe("fee:read_department");
    expect(PermissionCode.resourceGrantCreate).toBe("resource_grant:create");
    expect(PermissionCode.resourceGrantRevoke).toBe("resource_grant:revoke");
  });

  it("includes the Step 4C resource grant and sensitivity codes", () => {
    expect(GrantTypeCode.secretRead).toBe("SECRET_READ");
    expect(GrantTypeCode.attachmentDownload).toBe("ATTACHMENT_DOWNLOAD");
    expect(GranteeTypeCode.role).toBe("ROLE");
    expect(GrantStatusCode.active).toBe("ACTIVE");
    expect(SecretLevelCode.confidential).toBe("CONFIDENTIAL");
    expect(AttachmentStatusCode.active).toBe("ACTIVE");
  });
});
