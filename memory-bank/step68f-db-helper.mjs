import { stdin as input } from "node:process";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

process.env.NODE_ENV = "staging";

const requireFromApi = createRequire("/app/apps/api/dist/main.js");
requireFromApi("reflect-metadata");
const { NestFactory } = requireFromApi("@nestjs/core");
const { AppModule } = requireFromApi("./app.module.js");
const {
  AchievementImportApplyRejectedError,
  AchievementImportDryRunService,
  InvalidAchievementImportApplyModeError,
} = requireFromApi("./imports/achievement-import-dry-run.service.js");

const prisma = new PrismaClient();
const operation = "ACHIEVEMENT_IMPORT_CREATE_DRAFT";

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

const createUser = ({ email, name, roleId = null, departmentId }) =>
  prisma.user.create({
    data: {
      email,
      name,
      departmentId,
      status: "ACTIVE",
      userRoles: roleId
        ? {
            create: {
              roleId,
              scopeType: "GLOBAL",
              scopeKey: "GLOBAL",
            },
          }
        : undefined,
    },
  });

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

const prepare = async (payload) => {
  const suffix = payload.suffix;
  const lower = suffix.toLowerCase();
  const baseDepartment = await prisma.department.create({
    data: {
      code: `S68F_BASE_${suffix}`,
      name: "Step 68F Synthetic Base",
    },
  });
  const importDepartment = await prisma.department.create({
    data: {
      code: `S68F_DEPT_${suffix}`,
      name: "Step 68F Synthetic Import Department",
    },
  });
  const systemConfig = await ensurePermission("system:config");
  const adminRole = await createRole(`S68F_ADMIN_${suffix}`, [systemConfig.id]);
  const limitedRole = await createRole(`S68F_LIMITED_${suffix}`);
  const admin = await createUser({
    email: `step68f-admin-${lower}@example.invalid`,
    name: "Step 68F Admin",
    roleId: adminRole.id,
    departmentId: baseDepartment.id,
  });
  const limited = await createUser({
    email: `step68f-limited-${lower}@example.invalid`,
    name: "Step 68F Limited",
    roleId: limitedRole.id,
    departmentId: baseDepartment.id,
  });
  const ownerA = await createUser({
    email: `step68f-owner-a-${lower}@example.invalid`,
    name: "Step 68F Owner A",
    departmentId: importDepartment.id,
  });
  const ownerB = await createUser({
    email: `step68f-owner-b-${lower}@example.invalid`,
    name: "Step 68F Owner B",
    departmentId: importDepartment.id,
  });
  const contributorA = await createUser({
    email: `step68f-contributor-a-${lower}@example.invalid`,
    name: "Step 68F Contributor A",
    departmentId: importDepartment.id,
  });
  const contributorB = await createUser({
    email: `step68f-contributor-b-${lower}@example.invalid`,
    name: "Step 68F Contributor B",
    departmentId: importDepartment.id,
  });

  return {
    suffix,
    titlePrefix: `Step 68F Synthetic ${suffix}`,
    departmentCode: importDepartment.code,
    admin: await buildAuthUser(admin.id),
    limited: await buildAuthUser(limited.id),
    ownerEmails: [ownerA.email, ownerB.email],
    contributorEmails: [contributorA.email, contributorB.email],
  };
};

const makeImportFile = (payload) => {
  const buffer = Buffer.from(payload.csv, "utf8");
  return {
    originalName: payload.fileName ?? "step68f-achievements.csv",
    mimeType: "text/csv",
    size: buffer.length,
    buffer,
  };
};

const withImportService = async (callback) => {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();
  try {
    return await callback(app.get(AchievementImportDryRunService));
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
    service.dryRunAchievementCsv(context, makeImportFile(payload)),
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
      service.applyAchievementCsv(
        context,
        makeImportFile(payload),
        payload.mode ?? "CREATE_DRAFT_ONLY",
      ),
    );
    return {
      status: 201,
      body: result,
    };
  } catch (error) {
    if (error instanceof AchievementImportApplyRejectedError) {
      return {
        status: 400,
        body: {
          message: error.message,
          summary: error.result.summary,
          errors: error.result.errors,
        },
      };
    }

    if (error instanceof InvalidAchievementImportApplyModeError) {
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

const listAchievements = async (payload) => {
  const items = await prisma.achievement.findMany({
    where: {
      title: {
        startsWith: payload.titlePrefix ?? "Step 68F Synthetic",
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      type: true,
      status: true,
      secretLevel: true,
      departmentId: true,
      ownerUserId: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      submittedAt: true,
      archivedAt: true,
      voidedAt: true,
    },
  });

  return {
    status: 200,
    body: {
      items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        submittedAt: item.submittedAt?.toISOString() ?? null,
        archivedAt: item.archivedAt?.toISOString() ?? null,
        voidedAt: item.voidedAt?.toISOString() ?? null,
        isRestricted: false,
        isRedacted: false,
      })),
      total: items.length,
      page: 1,
      pageSize: 20,
    },
  };
};

const countForbiddenSideEffects = async () => ({
  workflowInstanceCount: await prisma.workflowInstance.count(),
  workflowTaskCount: await prisma.workflowTask.count(),
  workflowActionCount: await prisma.workflowAction.count(),
  attachmentCount: await prisma.attachment.count(),
  feeRecordCount: await prisma.feeRecord.count(),
  reminderTaskCount: await prisma.reminderTask.count(),
  notificationCount: await prisma.notification.count(),
  searchLogCount: await prisma.searchLog.count(),
  resourceAccessGrantCount: await prisma.resourceAccessGrant.count(),
});

const evidence = async (payload) => {
  const achievements = await prisma.achievement.findMany({
    where: {
      title: {
        startsWith: payload.titlePrefix,
      },
    },
    select: {
      id: true,
      type: true,
      status: true,
      submittedAt: true,
      archivedAt: true,
      voidedAt: true,
      paperDetail: { select: { achievementId: true, doiNormalized: true } },
      contributors: { select: { id: true } },
    },
  });
  const auditRows = await prisma.auditLog.findMany({
    where: {
      actorUserId: payload.actorUserId,
      action: "CREATE",
      targetType: "ACHIEVEMENT",
      createdAt: { gte: new Date(payload.since) },
    },
    select: { newValue: true },
  });

  return {
    status: 200,
    body: {
      achievementCount: achievements.length,
      paperDraftCount: achievements.filter(
        (item) => item.type === "PAPER" && item.status === "DRAFT",
      ).length,
      paperDetailCount: achievements.filter((item) => item.paperDetail).length,
      normalizedDoiPersistedCount: achievements.filter((item) =>
        Boolean(item.paperDetail?.doiNormalized),
      ).length,
      contributorCount: achievements.reduce(
        (count, item) => count + item.contributors.length,
        0,
      ),
      stateChangeCount: achievements.filter(
        (item) => item.submittedAt || item.archivedAt || item.voidedAt,
      ).length,
      auditOperation: operation,
      auditOperationCount: auditRows.filter((row) => row.newValue?.operation === operation)
        .length,
      forbiddenSideEffectCounts: await countForbiddenSideEffects(),
    },
  };
};

try {
  const payload = await readStdin();
  const result =
    payload.action === "prepare"
      ? { status: 200, body: await prepare(payload) }
      : payload.action === "dryRun"
        ? await dryRun(payload)
        : payload.action === "apply"
          ? await applyImport(payload)
          : payload.action === "listAchievements"
            ? await listAchievements(payload)
            : payload.action === "evidence"
              ? await evidence(payload)
              : payload.action === "sideEffects"
                ? { status: 200, body: await countForbiddenSideEffects() }
                : null;

  if (!result) {
    throw new Error("Unsupported Step 68F helper action.");
  }

  console.log(JSON.stringify(result));
} finally {
  await prisma.$disconnect();
}
