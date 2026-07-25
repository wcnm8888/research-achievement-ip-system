import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

process.env.NODE_ENV = "staging";

const requireFromApi = createRequire("/app/apps/api/dist/main.js");
requireFromApi("reflect-metadata");
const { NestFactory } = requireFromApi("@nestjs/core");
const { AppModule } = requireFromApi("./app.module.js");

const prisma = new PrismaClient();
const port = Number(process.env.STEP66C_PORT ?? "33166");
const apiBaseUrl = `http://127.0.0.1:${port}/api`;
const suffix = Date.now().toString(36).toUpperCase();
const operation = "USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL";

const csvFileName = "step66c-user-accounts.csv";

const codes = {
  baseDepartment: `S66C_BASE_${suffix}`,
  importDepartment: `S66C_DEPT_${suffix}`,
  inactiveDepartment: `S66C_ARCH_${suffix}`,
  importRole: `S66C_ROLE_${suffix}`,
  adminRole: `S66C_ADMIN_${suffix}`,
  limitedRole: `S66C_LIMITED_${suffix}`,
};

const emails = {
  successA: `step66c-success-a-${suffix.toLowerCase()}@example.invalid`,
  successB: `step66c-success-b-${suffix.toLowerCase()}@example.invalid`,
  duplicate: `step66c-duplicate-${suffix.toLowerCase()}@example.invalid`,
  duplicateEmployeeA: `step66c-employee-a-${suffix.toLowerCase()}@example.invalid`,
  duplicateEmployeeB: `step66c-employee-b-${suffix.toLowerCase()}@example.invalid`,
  missingDepartment: `step66c-missing-dept-${suffix.toLowerCase()}@example.invalid`,
  inactiveDepartment: `step66c-inactive-dept-${suffix.toLowerCase()}@example.invalid`,
  systemAdmin: `step66c-system-admin-${suffix.toLowerCase()}@example.invalid`,
  globalScope: `step66c-global-scope-${suffix.toLowerCase()}@example.invalid`,
  denied: `step66c-denied-${suffix.toLowerCase()}@example.invalid`,
  existing: `step66c-existing-${suffix.toLowerCase()}@example.invalid`,
};

const createCsvBlob = (csv) => new Blob([csv], { type: "text/csv" });

const uniqueCodes = (body) =>
  Array.isArray(body?.errors)
    ? [...new Set(body.errors.map((error) => error.code).filter(Boolean))]
    : [];

const postCsv = async (actorUserId, csv, mode = "CREATE_ONLY_PENDING_NO_CREDENTIAL") => {
  const form = new FormData();
  form.append("mode", mode);
  form.append("file", createCsvBlob(csv), csvFileName);

  const response = await fetch(`${apiBaseUrl}/users/import/apply`, {
    method: "POST",
    headers: {
      "x-demo-user-id": actorUserId,
    },
    body: form,
  });
  const body = await response.json().catch(() => ({}));

  return {
    status: response.status,
    createdUsersCount: body?.summary?.createdUsersCount ?? null,
    createdRolesCount: body?.summary?.createdRolesCount ?? null,
    failedRows: body?.summary?.failedRows ?? null,
    skippedRows: body?.summary?.skippedRows ?? null,
    auditOperation: body?.summary?.auditOperation ?? null,
    errorCodes: uniqueCodes(body),
  };
};

const countUsersByEmails = (targetEmails) =>
  prisma.user.count({
    where: {
      email: {
        in: targetEmails,
      },
    },
  });

const loadImportedUserFacts = async (targetEmails) => {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: targetEmails,
      },
    },
    select: {
      id: true,
      status: true,
      credential: {
        select: { id: true },
      },
      sessions: {
        select: { id: true },
      },
      accountLifecycleTokens: {
        select: { id: true },
      },
      userRoles: {
        where: { revokedAt: null },
        select: {
          id: true,
          scopeType: true,
          scopeKey: true,
          departmentId: true,
          role: {
            select: {
              code: true,
            },
          },
        },
      },
    },
  });

  return {
    userCount: users.length,
    pendingActivationCount: users.filter((user) => user.status === "PENDING_ACTIVATION").length,
    credentialCount: users.filter((user) => user.credential).length,
    sessionCount: users.reduce((count, user) => count + user.sessions.length, 0),
    lifecycleTokenCount: users.reduce(
      (count, user) => count + user.accountLifecycleTokens.length,
      0,
    ),
    departmentScopedRoleCount: users.reduce(
      (count, user) =>
        count +
        user.userRoles.filter(
          (role) =>
            role.scopeType === "DEPARTMENT" &&
            role.departmentId === role.scopeKey &&
            role.role.code === codes.importRole,
        ).length,
      0,
    ),
  };
};

const countImportAuditEvents = async (actorUserId, since) => {
  const rows = await prisma.auditLog.findMany({
    where: {
      actorUserId,
      action: "CREATE",
      targetType: "USER",
      createdAt: { gte: since },
    },
    select: {
      newValue: true,
    },
  });

  return rows.filter((row) => row.newValue?.operation === operation).length;
};

const ensurePermission = () =>
  prisma.permission.upsert({
    where: { code: "system:config" },
    update: { status: "ACTIVE" },
    create: {
      code: "system:config",
      resource: "system",
      action: "config",
      name: "System config",
      status: "ACTIVE",
    },
  });

const createRole = (code, permissionId = null) =>
  prisma.role.create({
    data: {
      code,
      name: code,
      status: "ACTIVE",
      rolePermissions: permissionId
        ? {
            create: {
              permissionId,
            },
          }
        : undefined,
    },
  });

const createActorUser = ({ email, roleId, departmentId }) =>
  prisma.user.create({
    data: {
      email,
      name: email.split("@")[0],
      departmentId,
      status: "ACTIVE",
      userRoles: {
        create: {
          roleId,
          scopeType: "GLOBAL",
          scopeKey: "GLOBAL",
        },
      },
    },
  });

const createExistingUser = ({ email, departmentId, roleId }) =>
  prisma.user.create({
    data: {
      email,
      name: "Step 66C Existing",
      departmentId,
      status: "ACTIVE",
      userRoles: {
        create: {
          roleId,
          scopeType: "DEPARTMENT",
          scopeKey: departmentId,
          departmentId,
        },
      },
    },
  });

const assertCondition = (condition, message, details = {}) => {
  if (!condition) {
    throw new Error(JSON.stringify({ message, details }));
  }
};

let app = null;

try {
  const startedAt = new Date();
  const healthBefore = await fetch("http://127.0.0.1:3000/api/health").catch(() => null);

  const baseDepartment = await prisma.department.create({
    data: {
      code: codes.baseDepartment,
      name: "Step 66C Synthetic Base",
    },
  });
  const importDepartment = await prisma.department.create({
    data: {
      code: codes.importDepartment,
      name: "Step 66C Synthetic Import Department",
    },
  });
  await prisma.department.create({
    data: {
      code: codes.inactiveDepartment,
      name: "Step 66C Archived Department",
      status: "ARCHIVED",
      archivedAt: new Date(),
    },
  });

  const permission = await ensurePermission();
  const adminRole = await createRole(codes.adminRole, permission.id);
  const limitedRole = await createRole(codes.limitedRole);
  const importRole = await createRole(codes.importRole);
  const admin = await createActorUser({
    email: `step66c-admin-${suffix.toLowerCase()}@example.invalid`,
    roleId: adminRole.id,
    departmentId: baseDepartment.id,
  });
  const limited = await createActorUser({
    email: `step66c-limited-${suffix.toLowerCase()}@example.invalid`,
    roleId: limitedRole.id,
    departmentId: baseDepartment.id,
  });
  await createExistingUser({
    email: emails.existing,
    departmentId: importDepartment.id,
    roleId: importRole.id,
  });

  app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix("api");
  await app.listen(port, "127.0.0.1");

  const tempHealth = await fetch(`${apiBaseUrl}/health`);

  const successEmails = [emails.successA, emails.successB];
  const successBefore = await countUsersByEmails(successEmails);
  const auditBefore = await countImportAuditEvents(admin.id, startedAt);
  const success = await postCsv(
    admin.id,
    [
      "email,displayName,employeeNo,departmentCode,roleCode,scopeType,scopeDepartmentCode,status",
      `${emails.successA},Step 66C User A,S66C_E001,${codes.importDepartment},${codes.importRole},DEPARTMENT,${codes.importDepartment},PENDING_ACTIVATION`,
      `${emails.successB},Step 66C User B,S66C_E002,${codes.importDepartment},${codes.importRole},DEPARTMENT,${codes.importDepartment},PENDING_ACTIVATION`,
    ].join("\n"),
  );
  const successAfter = await countUsersByEmails(successEmails);
  const successFacts = await loadImportedUserFacts(successEmails);
  const auditAfter = await countImportAuditEvents(admin.id, startedAt);

  assertCondition(success.status === 201, "success apply status mismatch", { status: success.status });
  assertCondition(success.createdUsersCount === 2, "success created user count mismatch", success);
  assertCondition(success.createdRolesCount === 2, "success created role count mismatch", success);
  assertCondition(successBefore === 0 && successAfter === 2, "success user count delta mismatch", {
    before: successBefore,
    after: successAfter,
  });
  assertCondition(successFacts.pendingActivationCount === 2, "pending status count mismatch", successFacts);
  assertCondition(successFacts.departmentScopedRoleCount === 2, "department role count mismatch", successFacts);
  assertCondition(successFacts.credentialCount === 0, "credential side effect detected", successFacts);
  assertCondition(successFacts.sessionCount === 0, "session side effect detected", successFacts);
  assertCondition(successFacts.lifecycleTokenCount === 0, "lifecycle token side effect detected", successFacts);
  assertCondition(auditAfter - auditBefore === 2, "audit operation delta mismatch", {
    before: auditBefore,
    after: auditAfter,
  });

  const repeatBefore = await countUsersByEmails(successEmails);
  const repeat = await postCsv(
    admin.id,
    [
      "email,displayName,departmentCode,roleCode",
      `${emails.successA},Step 66C User A,${codes.importDepartment},${codes.importRole}`,
      `${emails.successB},Step 66C User B,${codes.importDepartment},${codes.importRole}`,
    ].join("\n"),
  );
  const repeatAfter = await countUsersByEmails(successEmails);
  assertCondition(repeat.status === 400, "repeat warning rejection status mismatch", repeat);
  assertCondition(repeat.errorCodes.includes("EXISTING_USER"), "repeat warning error code mismatch", repeat);
  assertCondition(repeatBefore === repeatAfter, "repeat warning created extra users", {
    before: repeatBefore,
    after: repeatAfter,
  });

  const duplicateTargets = [emails.duplicate, emails.duplicateEmployeeA, emails.duplicateEmployeeB];
  const duplicateBefore = await countUsersByEmails(duplicateTargets);
  const duplicate = await postCsv(
    admin.id,
    [
      "email,displayName,employeeNo,departmentCode,roleCode",
      `${emails.duplicate},Step 66C Duplicate One,S66C_DUP_EMP,${codes.importDepartment},${codes.importRole}`,
      `${emails.duplicate},Step 66C Duplicate Two,S66C_DUP_EMP,${codes.importDepartment},${codes.importRole}`,
      `${emails.duplicateEmployeeA},Step 66C Employee A,S66C_SHARED_EMP,${codes.importDepartment},${codes.importRole}`,
      `${emails.duplicateEmployeeB},Step 66C Employee B,S66C_SHARED_EMP,${codes.importDepartment},${codes.importRole}`,
    ].join("\n"),
  );
  const duplicateAfter = await countUsersByEmails(duplicateTargets);
  assertCondition(duplicate.status === 400, "duplicate file rejection status mismatch", duplicate);
  assertCondition(duplicate.errorCodes.includes("DUPLICATE_IN_FILE"), "duplicate file error code mismatch", duplicate);
  assertCondition(duplicateBefore === 0 && duplicateAfter === 0, "duplicate file created users", {
    before: duplicateBefore,
    after: duplicateAfter,
  });

  const departmentTargets = [emails.missingDepartment, emails.inactiveDepartment];
  const departmentBefore = await countUsersByEmails(departmentTargets);
  const departmentRejected = await postCsv(
    admin.id,
    [
      "email,displayName,departmentCode,roleCode",
      `${emails.missingDepartment},Step 66C Missing,DOES_NOT_EXIST_${suffix},${codes.importRole}`,
      `${emails.inactiveDepartment},Step 66C Inactive,${codes.inactiveDepartment},${codes.importRole}`,
    ].join("\n"),
  );
  const departmentAfter = await countUsersByEmails(departmentTargets);
  assertCondition(departmentRejected.status === 400, "department rejection status mismatch", departmentRejected);
  assertCondition(
    departmentRejected.errorCodes.includes("UNKNOWN_DEPARTMENT"),
    "department rejection code mismatch",
    departmentRejected,
  );
  assertCondition(departmentBefore === 0 && departmentAfter === 0, "department rejection created users", {
    before: departmentBefore,
    after: departmentAfter,
  });

  const scopeTargets = [emails.systemAdmin, emails.globalScope];
  const scopeBefore = await countUsersByEmails(scopeTargets);
  const highPrivilegeRejected = await postCsv(
    admin.id,
    [
      "email,displayName,departmentCode,roleCode,scopeType",
      `${emails.systemAdmin},Step 66C System Admin,${codes.importDepartment},SYSTEM_ADMIN,DEPARTMENT`,
      `${emails.globalScope},Step 66C Global,${codes.importDepartment},${codes.importRole},GLOBAL`,
    ].join("\n"),
  );
  const scopeAfter = await countUsersByEmails(scopeTargets);
  assertCondition(highPrivilegeRejected.status === 400, "high privilege rejection status mismatch", highPrivilegeRejected);
  assertCondition(
    highPrivilegeRejected.errorCodes.includes("ROLE_NOT_IMPORTABLE") &&
      highPrivilegeRejected.errorCodes.includes("GLOBAL_SCOPE_NOT_ALLOWED"),
    "high privilege rejection code mismatch",
    highPrivilegeRejected,
  );
  assertCondition(scopeBefore === 0 && scopeAfter === 0, "high privilege rejection created users", {
    before: scopeBefore,
    after: scopeAfter,
  });

  const warningBefore = await countUsersByEmails([emails.existing]);
  const warningRejected = await postCsv(
    admin.id,
    [
      "email,displayName,departmentCode,roleCode",
      `${emails.existing},Step 66C Existing,${codes.importDepartment},${codes.importRole}`,
    ].join("\n"),
  );
  const warningAfter = await countUsersByEmails([emails.existing]);
  assertCondition(warningRejected.status === 400, "dry-run warning rejection status mismatch", warningRejected);
  assertCondition(warningRejected.errorCodes.includes("EXISTING_USER"), "dry-run warning code mismatch", warningRejected);
  assertCondition(warningBefore === 1 && warningAfter === 1, "dry-run warning created users", {
    before: warningBefore,
    after: warningAfter,
  });

  const deniedBefore = await countUsersByEmails([emails.denied]);
  const permissionDenied = await postCsv(
    limited.id,
    [
      "email,displayName,departmentCode,roleCode",
      `${emails.denied},Step 66C Denied,${codes.importDepartment},${codes.importRole}`,
    ].join("\n"),
  );
  const deniedAfter = await countUsersByEmails([emails.denied]);
  assertCondition(permissionDenied.status === 403, "permission denied status mismatch", permissionDenied);
  assertCondition(deniedBefore === 0 && deniedAfter === 0, "permission denied created users", {
    before: deniedBefore,
    after: deniedAfter,
  });

  console.log(JSON.stringify({
    step: "66C",
    scope: "local-production-like-docker-db-api-harness",
    productionVpcAcceptance: false,
    runningApiHealthStatus: healthBefore?.status ?? null,
    tempApiHealthStatus: tempHealth.status,
    authHarness: "x-demo-user-id-without-credential-or-session",
    success: {
      status: success.status,
      createdUsersCount: success.createdUsersCount,
      createdRolesCount: success.createdRolesCount,
      userCountBefore: successBefore,
      userCountAfter: successAfter,
      pendingActivationCount: successFacts.pendingActivationCount,
      departmentScopedRoleCount: successFacts.departmentScopedRoleCount,
      credentialCount: successFacts.credentialCount,
      sessionCount: successFacts.sessionCount,
      lifecycleTokenCount: successFacts.lifecycleTokenCount,
      auditOperationDelta: auditAfter - auditBefore,
      auditOperation: operation,
    },
    repeatWarningRejected: {
      status: repeat.status,
      userCountBefore: repeatBefore,
      userCountAfter: repeatAfter,
      errorCodes: repeat.errorCodes,
    },
    duplicateFileRejected: {
      status: duplicate.status,
      userCountBefore: duplicateBefore,
      userCountAfter: duplicateAfter,
      errorCodes: duplicate.errorCodes,
    },
    departmentRejected: {
      status: departmentRejected.status,
      userCountBefore: departmentBefore,
      userCountAfter: departmentAfter,
      errorCodes: departmentRejected.errorCodes,
    },
    highPrivilegeRejected: {
      status: highPrivilegeRejected.status,
      userCountBefore: scopeBefore,
      userCountAfter: scopeAfter,
      errorCodes: highPrivilegeRejected.errorCodes,
    },
    dryRunWarningRejected: {
      status: warningRejected.status,
      userCountBefore: warningBefore,
      userCountAfter: warningAfter,
      errorCodes: warningRejected.errorCodes,
    },
    permissionDenied: {
      status: permissionDenied.status,
      userCountBefore: deniedBefore,
      userCountAfter: deniedAfter,
    },
    employeeNoBoundary: "file-local-duplicate-only",
  }));
} finally {
  if (app) {
    await app.close();
  }
  await prisma.$disconnect();
}
