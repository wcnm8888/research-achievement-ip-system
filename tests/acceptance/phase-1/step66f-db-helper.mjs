import { stdin as input } from "node:process";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

process.env.NODE_ENV = "staging";

const requireFromApi = createRequire("/app/apps/api/dist/main.js");
requireFromApi("reflect-metadata");
const { NestFactory } = requireFromApi("@nestjs/core");
const { AppModule } = requireFromApi("./app.module.js");
const {
  InvalidUserAccountImportApplyModeError,
  UserAccountImportApplyRejectedError,
  UserAccountImportDryRunService,
} = requireFromApi("./imports/user-account-import-dry-run.service.js");

const prisma = new PrismaClient();
const operation = "USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL";

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of input) {
    chunks.push(Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
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

const createRole = (code, permissionIds = []) =>
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

const prepare = async (payload) => {
  const suffix = payload.suffix;
  const baseDepartment = await prisma.department.create({
    data: {
      code: `S66F_BASE_${suffix}`,
      name: "Step 66F Synthetic Base",
    },
  });
  const importDepartment = await prisma.department.create({
    data: {
      code: `S66F_DEPT_${suffix}`,
      name: "Step 66F Synthetic Import Department",
    },
  });
  const systemConfig = await ensurePermission("system:config");
  const adminRole = await createRole(`S66F_ADMIN_${suffix}`, [systemConfig.id]);
  const limitedRole = await createRole(`S66F_LIMITED_${suffix}`, []);
  const importRole = await createRole(`S66F_ROLE_${suffix}`, []);
  const admin = await createActorUser({
    email: `step66f-admin-${suffix.toLowerCase()}@example.invalid`,
    roleId: adminRole.id,
    departmentId: baseDepartment.id,
  });
  const limited = await createActorUser({
    email: `step66f-limited-${suffix.toLowerCase()}@example.invalid`,
    roleId: limitedRole.id,
    departmentId: baseDepartment.id,
  });

  return {
    prepared: true,
    suffix,
    importDepartmentCode: importDepartment.code,
    importRoleCode: importRole.code,
    admin: await buildAuthUser(admin.id),
    limited: await buildAuthUser(limited.id),
  };
};

const buildUserContext = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        where: { revokedAt: null },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error("Synthetic actor was not found.");
  }

  const permissionCodes = [
    ...new Set(
      user.userRoles.flatMap((userRole) =>
        userRole.role.rolePermissions
          .filter((rolePermission) => rolePermission.permission.status === "ACTIVE")
          .map((rolePermission) => rolePermission.permission.code),
      ),
    ),
  ];
  const roleScopes = user.userRoles.map((userRole) => ({
    roleCode: userRole.role.code,
    scopeType: userRole.scopeType,
    scopeKey: userRole.scopeKey,
    departmentId: userRole.departmentId,
  }));

  return {
    userId: user.id,
    departmentId: user.departmentId,
    roleIds: user.userRoles.map((userRole) => userRole.roleId),
    roleCodes: user.userRoles.map((userRole) => userRole.role.code),
    permissionCodes,
    roleScopes,
    scopedDepartmentIds: [
      ...new Set(
        roleScopes
          .filter((scope) => scope.scopeType === "DEPARTMENT" && scope.departmentId)
          .map((scope) => scope.departmentId),
      ),
    ],
  };
};

const buildAuthUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      departmentId: true,
    },
  });
  const context = await buildUserContext(userId);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    departmentId: user.departmentId,
    roleCodes: context.roleCodes,
    permissionCodes: context.permissionCodes,
    scopedDepartmentIds: context.scopedDepartmentIds,
  };
};

const canApplyImport = async (actorUserId) => {
  const context = await buildUserContext(actorUserId);
  return context.permissionCodes.includes("system:config");
};

const forbidden = () => ({
  status: 403,
  body: {
    message: "Missing required permission: system:config.",
  },
});

const listDepartments = async (payload) => {
  if (!(await canApplyImport(payload.actorUserId))) {
    return forbidden();
  }

  const items = await prisma.department.findMany({
    where: {
      status: "ACTIVE",
    },
    orderBy: { code: "asc" },
    take: 100,
  });

  return {
    status: 200,
    body: {
      items: items.map((department) => ({
        id: department.id,
        code: department.code,
        name: department.name,
        parentId: department.parentId,
        status: department.status,
        createdAt: department.createdAt.toISOString(),
        updatedAt: department.updatedAt.toISOString(),
        archivedAt: department.archivedAt?.toISOString() ?? null,
      })),
      total: items.length,
      page: 1,
      pageSize: 100,
    },
  };
};

const listUsers = async (payload) => {
  if (!(await canApplyImport(payload.actorUserId))) {
    return forbidden();
  }

  return {
    status: 200,
    body: {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    },
  };
};

const makeImportFile = (payload) => {
  const buffer = Buffer.from(payload.csv, "utf8");
  return {
    originalName: payload.fileName ?? "step66f-user-accounts.csv",
    mimeType: "text/csv",
    size: buffer.length,
    buffer,
  };
};

const withImportService = async (callback) => {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();
  try {
    return await callback(app.get(UserAccountImportDryRunService));
  } finally {
    await app.close();
  }
};

const dryRun = async (payload) => {
  if (!(await canApplyImport(payload.actorUserId))) {
    return forbidden();
  }

  const context = await buildUserContext(payload.actorUserId);
  const result = await withImportService((service) =>
    service.dryRunUserAccountCsv(context, makeImportFile(payload)),
  );

  return {
    status: 200,
    body: result,
  };
};

const applyImport = async (payload) => {
  if (!(await canApplyImport(payload.actorUserId))) {
    return forbidden();
  }

  const context = await buildUserContext(payload.actorUserId);
  try {
    const result = await withImportService((service) =>
      service.applyUserAccountCsv(
        context,
        makeImportFile(payload),
        payload.mode ?? "CREATE_ONLY_PENDING_NO_CREDENTIAL",
      ),
    );
    return {
      status: 201,
      body: result,
    };
  } catch (error) {
    if (error instanceof UserAccountImportApplyRejectedError) {
      return {
        status: 400,
        body: {
          message: error.message,
          summary: error.result.summary,
          errors: error.result.errors,
        },
      };
    }

    if (error instanceof InvalidUserAccountImportApplyModeError) {
      return {
        status: 400,
        body: {
          message: error.message,
        },
      };
    }

    throw error;
  }
};

const evidence = async (payload) => {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: payload.emails,
      },
    },
    select: {
      id: true,
      status: true,
      credential: { select: { id: true } },
      sessions: { select: { id: true } },
      accountLifecycleTokens: { select: { id: true } },
      userRoles: {
        where: { revokedAt: null },
        select: {
          id: true,
          scopeType: true,
          scopeKey: true,
          departmentId: true,
          role: { select: { code: true } },
        },
      },
    },
  });
  const auditRows = await prisma.auditLog.findMany({
    where: {
      actorUserId: payload.actorUserId,
      action: "CREATE",
      targetType: "USER",
      createdAt: { gte: new Date(payload.since) },
    },
    select: { newValue: true },
  });

  return {
    status: 200,
    body: {
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
              role.role.code === payload.importRoleCode,
          ).length,
        0,
      ),
      auditOperation: operation,
      auditOperationCount: auditRows.filter((row) => row.newValue?.operation === operation).length,
      mailDeliveryCount: 0,
    },
  };
};

try {
  const payload = await readStdin();
  const result =
    payload.action === "prepare"
      ? { status: 200, body: await prepare(payload) }
      : payload.action === "listDepartments"
        ? await listDepartments(payload)
        : payload.action === "listUsers"
          ? await listUsers(payload)
          : payload.action === "dryRun"
            ? await dryRun(payload)
            : payload.action === "apply"
              ? await applyImport(payload)
              : payload.action === "evidence"
                ? await evidence(payload)
                : null;

  if (!result) {
    throw new Error("Unsupported Step 66F helper action.");
  }

  console.log(JSON.stringify(result));
} finally {
  await prisma.$disconnect();
}
