import { randomBytes, scrypt } from "node:crypto";
import { stdin as input } from "node:process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of input) {
    chunks.push(Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
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

const ensurePermission = (code) =>
  prisma.permission.upsert({
    where: { code },
    update: { status: "ACTIVE" },
    create: {
      code,
      resource: code.split(":")[0] ?? code,
      action: code.split(":")[1] ?? "read",
      name: code,
      status: "ACTIVE",
    },
  });

const createRole = (code, permissionIds) =>
  prisma.role.create({
    data: {
      code,
      name: code,
      status: "ACTIVE",
      rolePermissions:
        permissionIds.length > 0
          ? {
              create: permissionIds.map((permissionId) => ({ permissionId })),
            }
          : undefined,
    },
  });

const createUser = async ({ email, roleId, departmentId, password }) => {
  const passwordHash = await hashPassword(password);
  return prisma.user.create({
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
};

const prepare = async (payload) => {
  const baseDepartment = await prisma.department.create({
    data: {
      code: `S65F_BASE_${payload.suffix}`,
      name: "Step 65F Synthetic Base",
    },
  });
  const systemConfig = await ensurePermission("system:config");
  const auditRead = await ensurePermission("audit:read_masked");
  const adminRole = await createRole(`S65F_ADMIN_${payload.suffix}`, [
    systemConfig.id,
    auditRead.id,
  ]);
  const limitedRole = await createRole(`S65F_LIMITED_${payload.suffix}`, []);
  const admin = await createUser({
    email: `step65f-admin-${payload.suffix.toLowerCase()}@example.invalid`,
    roleId: adminRole.id,
    departmentId: baseDepartment.id,
    password: payload.adminPassword,
  });
  const limited = await createUser({
    email: `step65f-limited-${payload.suffix.toLowerCase()}@example.invalid`,
    roleId: limitedRole.id,
    departmentId: baseDepartment.id,
    password: payload.limitedPassword,
  });

  return {
    prepared: true,
    baseDepartmentCode: baseDepartment.code,
    adminEmail: admin.email,
    limitedEmail: limited.email,
    adminUserId: admin.id,
    limitedUserId: limited.id,
  };
};

const evidence = async (payload) => {
  const departmentCount = await prisma.department.count({
    where: {
      code: {
        in: payload.codes,
      },
    },
  });
  const auditRows = await prisma.auditLog.findMany({
    where: {
      actorUserId: payload.actorUserId,
      action: "CONFIG_UPDATE",
      targetType: "SYSTEM_CONFIG",
      createdAt: {
        gte: new Date(payload.since),
      },
    },
    select: {
      newValue: true,
    },
  });
  const auditOperationCount = auditRows.filter(
    (row) => row.newValue?.operation === "DEPARTMENT_IMPORT_CREATE",
  ).length;

  return {
    departmentCount,
    auditOperation: "DEPARTMENT_IMPORT_CREATE",
    auditOperationCount,
  };
};

try {
  const payload = await readStdin();
  const result =
    payload.action === "prepare"
      ? await prepare(payload)
      : payload.action === "evidence"
        ? await evidence(payload)
        : null;

  if (!result) {
    throw new Error("Unsupported Step 65F DB helper action.");
  }

  console.log(JSON.stringify(result));
} finally {
  await prisma.$disconnect();
}
