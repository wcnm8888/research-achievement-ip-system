/* eslint-disable @typescript-eslint/no-require-imports */
/* global require, __dirname */
const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const {
  departments,
  permissions,
  rolePermissionMatrix,
  roles,
} = require("./seed-foundation.cjs");

const unique = (items) => new Set(items).size === items.length;
const accountLifecyclePermissionCodes = ["account:invite", "account:reset_password"];
const feeReviewPermissionCode = "fee:review_department";
const financeReviewerRoleCode = "FINANCE_REVIEWER";
const feeManagePermissionCode = "fee:manage_department";
const systemConfigPermissionCode = "system:config";

describe("foundation seed facts", () => {
  it("uses unique stable codes", () => {
    assert.equal(unique(departments.map((department) => department.code)), true);
    assert.equal(unique(roles.map((role) => role.code)), true);
    assert.equal(unique(permissions.map((permission) => permission.code)), true);
  });

  it("references existing roles and permissions in the role-permission matrix", () => {
    const roleCodes = new Set(roles.map((role) => role.code));
    const permissionCodes = new Set(permissions.map((permission) => permission.code));

    for (const [roleCode, matrixPermissionCodes] of Object.entries(rolePermissionMatrix)) {
      assert.equal(roleCodes.has(roleCode), true, `Missing role ${roleCode}`);
      for (const permissionCode of matrixPermissionCodes) {
        assert.equal(
          permissionCodes.has(permissionCode),
          true,
          `Missing permission ${permissionCode}`,
        );
      }
    }
  });

  it("grants SYSTEM_ADMIN all foundation permissions", () => {
    assert.deepEqual(
      new Set(rolePermissionMatrix.SYSTEM_ADMIN),
      new Set(permissions.map((permission) => permission.code)),
    );
  });

  it("grants account lifecycle permissions only to SYSTEM_ADMIN", () => {
    const permissionCodes = new Set(permissions.map((permission) => permission.code));
    for (const permissionCode of accountLifecyclePermissionCodes) {
      assert.equal(permissionCodes.has(permissionCode), true);
      assert.equal(rolePermissionMatrix.SYSTEM_ADMIN.includes(permissionCode), true);
    }

    for (const [roleCode, matrixPermissionCodes] of Object.entries(rolePermissionMatrix)) {
      if (roleCode === "SYSTEM_ADMIN") {
        continue;
      }

      for (const permissionCode of accountLifecyclePermissionCodes) {
        assert.equal(
          matrixPermissionCodes.includes(permissionCode),
          false,
          `${roleCode} must not receive ${permissionCode}`,
        );
      }
    }
  });

  it("grants finance reviewer the minimum fee review permissions", () => {
    const roleCodes = new Set(roles.map((role) => role.code));
    const permissionCodes = new Set(permissions.map((permission) => permission.code));
    assert.equal(roleCodes.has(financeReviewerRoleCode), true);
    assert.equal(permissionCodes.has(feeReviewPermissionCode), true);
    assert.equal(permissionCodes.has(feeManagePermissionCode), true);
    assert.equal(permissionCodes.has(systemConfigPermissionCode), true);

    const reviewerPermissions = rolePermissionMatrix[financeReviewerRoleCode];
    assert.equal(Array.isArray(reviewerPermissions), true);
    assert.equal(reviewerPermissions.includes("user_context:read"), true);
    assert.equal(reviewerPermissions.includes("fee:read_department"), true);
    assert.equal(reviewerPermissions.includes(feeReviewPermissionCode), true);
    assert.equal(reviewerPermissions.includes(feeManagePermissionCode), false);
    assert.equal(reviewerPermissions.includes(systemConfigPermissionCode), false);
  });

  it("keeps fee review out of operational department roles", () => {
    assert.equal(rolePermissionMatrix.SYSTEM_ADMIN.includes(feeReviewPermissionCode), true);
    assert.equal(rolePermissionMatrix[financeReviewerRoleCode].includes(feeReviewPermissionCode), true);

    for (const [roleCode, matrixPermissionCodes] of Object.entries(rolePermissionMatrix)) {
      if (roleCode === "SYSTEM_ADMIN" || roleCode === financeReviewerRoleCode) {
        continue;
      }
      assert.equal(
        matrixPermissionCodes.includes(feeReviewPermissionCode),
        false,
        `${roleCode} must not receive ${feeReviewPermissionCode}`,
      );
    }
  });

  it("does not contain obvious secret, token, cookie, or connection string material", () => {
    const seedPath = path.join(__dirname, "seed-foundation.cjs");
    const source = fs.readFileSync(seedPath, "utf8");
    const forbiddenPatterns = [
      /postgresql:\/\//i,
      /DATABASE_URL\\s*=/,
      /BEGIN [A-Z ]*PRIVATE KEY/,
      /token\\s*=/i,
      /cookie\\s*=/i,
      /research_ip_session\\s*=/i,
    ];

    for (const pattern of forbiddenPatterns) {
      assert.equal(pattern.test(source), false, `Forbidden pattern matched: ${pattern}`);
    }
  });
});
