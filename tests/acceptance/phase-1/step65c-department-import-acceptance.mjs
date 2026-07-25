import { randomBytes, scrypt } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apiBaseUrl = process.env.STEP65C_API_BASE_URL ?? "http://127.0.0.1:3000/api";
const suffix = Date.now().toString(36).toUpperCase();

const codes = {
  successParent: `S65C_PARENT_${suffix}`,
  successChild: `S65C_CHILD_${suffix}`,
  missingRoot: `S65C_ROLLBACK_${suffix}`,
  missingChild: `S65C_MISSING_${suffix}`,
  duplicate: `S65C_DUP_${suffix}`,
  unauthorized: `S65C_DENY_${suffix}`,
};

const deriveScryptKey = (value, salt, keyLength, options) =>
  new Promise((resolve, reject) => {
    scrypt(value, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });

const hashPassword = async (value) => {
  const salt = randomBytes(16);
  const derivedKey = await deriveScryptKey(value, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
  });

  return [
    "scrypt",
    16384,
    8,
    1,
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
};

const createCsvBlob = (csv) => new Blob([csv], { type: "text/csv" });

const postCsv = async (sessionCookie, csv) => {
  const form = new FormData();
  form.append("mode", "CREATE_ONLY");
  form.append("file", createCsvBlob(csv), "step65c-departments.csv");

  const response = await fetch(`${apiBaseUrl}/imports/departments/apply`, {
    method: "POST",
    headers: sessionCookie ? { cookie: sessionCookie } : {},
    body: form,
  });
  const body = await response.json().catch(() => ({}));

  return {
    status: response.status,
    createdRows: body?.summary?.createdRows ?? null,
    failedRows: body?.summary?.failedRows ?? null,
    errorCodes: Array.isArray(body?.errors)
      ? [...new Set(body.errors.map((error) => error.code).filter(Boolean))]
      : [],
  };
};

const countDepartments = (targetCodes) =>
  prisma.department.count({
    where: {
      code: {
        in: targetCodes,
      },
    },
  });

const countImportAuditEvents = async (actorUserId, since) => {
  const rows = await prisma.auditLog.findMany({
    where: {
      actorUserId,
      action: "CONFIG_UPDATE",
      targetType: "SYSTEM_CONFIG",
      createdAt: {
        gte: since,
      },
    },
    select: {
      newValue: true,
    },
  });

  return rows.filter((row) => row.newValue?.operation === "DEPARTMENT_IMPORT_CREATE").length;
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

const createRole = (code, permissionId) =>
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

const createUser = async ({ email, roleId, departmentId }) => {
  const generatedPassword = randomBytes(18).toString("base64url");
  const passwordHash = await hashPassword(generatedPassword);
  const user = await prisma.user.create({
    data: {
      email,
      name: email.split("@")[0],
      departmentId,
      status: "ACTIVE",
      credential: {
        create: {
          passwordHash,
          passwordUpdatedAt: new Date(),
          status: "ACTIVE",
        },
      },
      userRoles: {
        create: {
          roleId,
          scopeType: "GLOBAL",
          scopeKey: "GLOBAL",
        },
      },
    },
  });

  return { user, generatedPassword };
};

const login = async (email, generatedPassword) => {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password: generatedPassword }),
  });
  const setCookie = response.headers.get("set-cookie");

  return {
    status: response.status,
    sessionCookie: setCookie?.split(";")[0] ?? null,
  };
};

try {
  const health = await fetch(`${apiBaseUrl}/health`);
  const acceptedAt = new Date();
  const baseDepartment = await prisma.department.create({
    data: {
      code: `S65C_BASE_${suffix}`,
      name: "Step 65C Synthetic Base",
    },
  });
  const permission = await ensurePermission();
  const adminRole = await createRole(`S65C_ADMIN_${suffix}`, permission.id);
  const limitedRole = await createRole(`S65C_LIMITED_${suffix}`, null);
  const admin = await createUser({
    email: `step65c-admin-${suffix.toLowerCase()}@example.invalid`,
    roleId: adminRole.id,
    departmentId: baseDepartment.id,
  });
  const limited = await createUser({
    email: `step65c-limited-${suffix.toLowerCase()}@example.invalid`,
    roleId: limitedRole.id,
    departmentId: baseDepartment.id,
  });
  const adminLogin = await login(admin.user.email, admin.generatedPassword);
  const limitedLogin = await login(limited.user.email, limited.generatedPassword);

  const successCodes = [codes.successParent, codes.successChild];
  const successBefore = await countDepartments(successCodes);
  const auditBefore = await countImportAuditEvents(admin.user.id, acceptedAt);
  const success = await postCsv(
    adminLogin.sessionCookie,
    [
      "code,name,parentCode",
      `${codes.successChild},Step 65C Synthetic Child,${codes.successParent}`,
      `${codes.successParent},Step 65C Synthetic Parent,`,
    ].join("\n"),
  );
  const successAfter = await countDepartments(successCodes);
  const auditAfter = await countImportAuditEvents(admin.user.id, acceptedAt);

  const repeatBefore = await countDepartments(successCodes);
  const repeat = await postCsv(
    adminLogin.sessionCookie,
    [
      "code,name,parentCode",
      `${codes.successChild},Step 65C Synthetic Child,${codes.successParent}`,
      `${codes.successParent},Step 65C Synthetic Parent,`,
    ].join("\n"),
  );
  const repeatAfter = await countDepartments(successCodes);

  const rollbackCodes = [codes.missingRoot, codes.missingChild];
  const rollbackBefore = await countDepartments(rollbackCodes);
  const missingParent = await postCsv(
    adminLogin.sessionCookie,
    [
      "code,name,parentCode",
      `${codes.missingRoot},Step 65C Rollback Root,`,
      `${codes.missingChild},Step 65C Missing Parent,DOES_NOT_EXIST_${suffix}`,
    ].join("\n"),
  );
  const rollbackAfter = await countDepartments(rollbackCodes);

  const duplicateCodes = [codes.duplicate];
  const duplicateBefore = await countDepartments(duplicateCodes);
  const duplicate = await postCsv(
    adminLogin.sessionCookie,
    [
      "code,name",
      `${codes.duplicate},Step 65C Duplicate One`,
      `${codes.duplicate},Step 65C Duplicate Two`,
    ].join("\n"),
  );
  const duplicateAfter = await countDepartments(duplicateCodes);

  const deniedBefore = await countDepartments([codes.unauthorized]);
  const denied = await postCsv(
    limitedLogin.sessionCookie,
    ["code,name", `${codes.unauthorized},Step 65C Denied`].join("\n"),
  );
  const deniedAfter = await countDepartments([codes.unauthorized]);

  console.log(JSON.stringify({
    step: "65C",
    scope: "local-production-like-only",
    healthStatus: health.status,
    loginStatuses: {
      admin: adminLogin.status,
      limited: limitedLogin.status,
    },
    success: {
      status: success.status,
      createdRows: success.createdRows,
      departmentCountBefore: successBefore,
      departmentCountAfter: successAfter,
      auditOperationDelta: auditAfter - auditBefore,
    },
    repeatApply: {
      status: repeat.status,
      departmentCountBefore: repeatBefore,
      departmentCountAfter: repeatAfter,
      errorCodes: repeat.errorCodes,
    },
    missingParentRollback: {
      status: missingParent.status,
      departmentCountBefore: rollbackBefore,
      departmentCountAfter: rollbackAfter,
      errorCodes: missingParent.errorCodes,
    },
    duplicateFileRollback: {
      status: duplicate.status,
      departmentCountBefore: duplicateBefore,
      departmentCountAfter: duplicateAfter,
      errorCodes: duplicate.errorCodes,
    },
    permissionDenied: {
      status: denied.status,
      departmentCountBefore: deniedBefore,
      departmentCountAfter: deniedAfter,
    },
  }));
} finally {
  await prisma.$disconnect();
}
