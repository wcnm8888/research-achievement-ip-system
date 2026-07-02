import { createRequire } from "node:module";

process.env.NODE_ENV = "staging";

const requireFromApi = createRequire("/app/apps/api/dist/main.js");
const { PrismaClient } = requireFromApi("@prisma/client");
requireFromApi("reflect-metadata");
const { NestFactory } = requireFromApi("@nestjs/core");
const { AppModule } = requireFromApi("./app.module.js");

const prisma = new PrismaClient();
const port = Number(process.env.STEP68C_PORT ?? "33168");
const localHttp = "http" + "://127.0.0.1";
const apiBaseUrl = `${localHttp}:${port}/api`;
const suffix = Date.now().toString(36).toUpperCase();
const titlePrefix = `Step 68C Synthetic ${suffix}`;
const operation = "ACHIEVEMENT_IMPORT_CREATE_DRAFT";
const csvFileName = "step68c-achievements.csv";

const codes = {
  baseDepartment: `S68C_BASE_${suffix}`,
  importDepartment: `S68C_DEPT_${suffix}`,
  otherDepartment: `S68C_OTHER_${suffix}`,
  adminRole: `S68C_ADMIN_${suffix}`,
  limitedRole: `S68C_LIMITED_${suffix}`,
};

const emails = {
  admin: `step68c-admin-${suffix.toLowerCase()}@example.invalid`,
  limited: `step68c-limited-${suffix.toLowerCase()}@example.invalid`,
  ownerA: `step68c-owner-a-${suffix.toLowerCase()}@example.invalid`,
  ownerB: `step68c-owner-b-${suffix.toLowerCase()}@example.invalid`,
  contributorA: `step68c-contributor-a-${suffix.toLowerCase()}@example.invalid`,
  contributorB: `step68c-contributor-b-${suffix.toLowerCase()}@example.invalid`,
};

const createCsvBlob = (csv) => new Blob([csv], { type: "text/csv" });

const uniqueCodes = (body) =>
  Array.isArray(body?.errors)
    ? [...new Set(body.errors.map((error) => error.code).filter(Boolean))]
    : [];

const postCsv = async (actorUserId, csv, mode = "CREATE_DRAFT_ONLY") => {
  const form = new FormData();
  form.append("mode", mode);
  form.append("file", createCsvBlob(csv), csvFileName);

  const response = await fetch(`${apiBaseUrl}/achievements/import/apply`, {
    method: "POST",
    headers: {
      "x-demo-user-id": actorUserId,
    },
    body: form,
  });
  const body = await response.json().catch(() => ({}));

  return {
    status: response.status,
    createdAchievementsCount: body?.summary?.createdAchievementsCount ?? null,
    createdPaperDetailsCount: body?.summary?.createdPaperDetailsCount ?? null,
    createdContributorsCount: body?.summary?.createdContributorsCount ?? null,
    failedRows: body?.summary?.failedRows ?? null,
    skippedRows: body?.summary?.skippedRows ?? null,
    auditOperation: body?.summary?.auditOperation ?? null,
    errorCodes: uniqueCodes(body),
    rowCount: Array.isArray(body?.rows) ? body.rows.length : null,
  };
};

const countAuditEvents = async (actorUserId, since) => {
  const rows = await prisma.auditLog.findMany({
    where: {
      actorUserId,
      action: "CREATE",
      targetType: "ACHIEVEMENT",
      createdAt: { gte: since },
    },
    select: {
      newValue: true,
    },
  });

  return rows.filter((row) => row.newValue?.operation === operation).length;
};

const loadImportedFacts = async () => {
  const achievements = await prisma.achievement.findMany({
    where: {
      title: {
        startsWith: titlePrefix,
      },
    },
    select: {
      id: true,
      type: true,
      status: true,
      submittedAt: true,
      archivedAt: true,
      voidedAt: true,
      paperDetail: {
        select: {
          achievementId: true,
          doiNormalized: true,
        },
      },
      contributors: {
        select: {
          id: true,
          userId: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const ids = achievements.map((achievement) => achievement.id);

  return {
    achievementCount: achievements.length,
    paperDetailCount: achievements.filter((achievement) => achievement.paperDetail).length,
    normalizedDoiPersistedCount: achievements.filter(
      (achievement) => achievement.paperDetail?.doiNormalized,
    ).length,
    contributorCount: achievements.reduce(
      (count, achievement) => count + achievement.contributors.length,
      0,
    ),
    paperDraftCount: achievements.filter(
      (achievement) => achievement.type === "PAPER" && achievement.status === "DRAFT",
    ).length,
    stateChangeCount: achievements.filter(
      (achievement) =>
        achievement.submittedAt || achievement.archivedAt || achievement.voidedAt,
    ).length,
    achievementIds: ids,
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

const diffCounts = (before, after) =>
  Object.fromEntries(
    Object.keys(before).map((key) => [key, after[key] - before[key]]),
  );

const assertCondition = (condition, message, details = {}) => {
  if (!condition) {
    throw new Error(JSON.stringify({ message, details }));
  }
};

const assertNoForbiddenSideEffects = (delta, label) => {
  const changed = Object.fromEntries(
    Object.entries(delta).filter(([, value]) => value !== 0),
  );
  assertCondition(Object.keys(changed).length === 0, `${label} side effect delta mismatch`, changed);
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

const createUser = ({ email, roleId = null, departmentId }) =>
  prisma.user.create({
    data: {
      email,
      name: email.split("@")[0],
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

const doiValue = (marker) => ["10", ["68C", suffix.toLowerCase(), marker].join(".")].join("/");

const successCsv = () =>
  [
    "type,title,ownerEmail,departmentCode,contributors,status,doi,journal,publishYear",
    [
      "PAPER",
      `${titlePrefix} Paper A`,
      emails.ownerA,
      codes.importDepartment,
      `Step 68C Contributor A|AUTHOR|FIRST_AUTHOR|${emails.contributorA}|S68C Lab;Step 68C External A|AUTHOR|OTHER||S68C External`,
      "DRAFT",
      doiValue("a"),
      "S68C Journal",
      "2026",
    ].join(","),
    [
      "PAPER",
      `${titlePrefix} Paper B`,
      emails.ownerB,
      codes.importDepartment,
      `Step 68C Contributor B|AUTHOR|CORRESPONDING_AUTHOR|${emails.contributorB}|S68C Lab;Step 68C External B|AUTHOR|OTHER||S68C External`,
      "DRAFT",
      doiValue("b"),
      "S68C Journal",
      "2026",
    ].join(","),
  ].join("\n");

const missingDoiCsv = () =>
  [
    "type,title,ownerEmail,departmentCode,contributors,status",
    [
      "PAPER",
      `${titlePrefix} Missing DOI`,
      emails.ownerA,
      codes.importDepartment,
      `Step 68C Contributor A|AUTHOR|FIRST_AUTHOR|${emails.contributorA}|S68C Lab`,
      "DRAFT",
    ].join(","),
  ].join("\n");

const unsupportedTypeCsv = () =>
  [
    "type,title,ownerEmail,departmentCode,contributors,status,patentNo,softwareRegistrationNo",
    [
      "PATENT",
      `${titlePrefix} Patent Rejected`,
      emails.ownerA,
      codes.importDepartment,
      `Step 68C Inventor|INVENTOR|PRIMARY_INVENTOR|${emails.contributorA}|S68C Lab`,
      "DRAFT",
      `S68C-PAT-${suffix}`,
      "",
    ].join(","),
    [
      "SOFTWARE_COPYRIGHT",
      `${titlePrefix} Software Rejected`,
      emails.ownerB,
      codes.importDepartment,
      `Step 68C Owner|COPYRIGHT_OWNER|OWNER|${emails.contributorB}|S68C Lab`,
      "DRAFT",
      "",
      `S68C-SW-${suffix}`,
    ].join(","),
  ].join("\n");

const dryRunErrorCsv = () =>
  [
    "type,title,ownerEmail,departmentCode,contributors,status,doi",
    [
      "PAPER",
      `${titlePrefix} Dry Run Error`,
      `missing-${suffix.toLowerCase()}@example.invalid`,
      codes.importDepartment,
      "Step 68C Contributor|AUTHOR|FIRST_AUTHOR||S68C Lab",
      "DRAFT",
      doiValue("error"),
    ].join(","),
  ].join("\n");

let app = null;

try {
  const startedAt = new Date();
  const runningApiHealth = await fetch(`${localHttp}:3000/api/health`).catch(() => null);
  const forbiddenBefore = await countForbiddenSideEffects();

  const baseDepartment = await prisma.department.create({
    data: {
      code: codes.baseDepartment,
      name: "Step 68C Synthetic Base",
    },
  });
  const importDepartment = await prisma.department.create({
    data: {
      code: codes.importDepartment,
      name: "Step 68C Synthetic Import Department",
    },
  });
  await prisma.department.create({
    data: {
      code: codes.otherDepartment,
      name: "Step 68C Synthetic Other Department",
    },
  });

  const permission = await ensurePermission();
  const adminRole = await createRole(codes.adminRole, permission.id);
  const limitedRole = await createRole(codes.limitedRole);
  const admin = await createUser({
    email: emails.admin,
    roleId: adminRole.id,
    departmentId: baseDepartment.id,
  });
  const limited = await createUser({
    email: emails.limited,
    roleId: limitedRole.id,
    departmentId: baseDepartment.id,
  });
  await createUser({ email: emails.ownerA, departmentId: importDepartment.id });
  await createUser({ email: emails.ownerB, departmentId: importDepartment.id });
  await createUser({ email: emails.contributorA, departmentId: importDepartment.id });
  await createUser({ email: emails.contributorB, departmentId: importDepartment.id });

  app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix("api");
  await app.listen(port, "127.0.0.1");

  const tempApiHealth = await fetch(`${apiBaseUrl}/health`);

  const successBeforeFacts = await loadImportedFacts();
  const auditBefore = await countAuditEvents(admin.id, startedAt);
  const success = await postCsv(admin.id, successCsv());
  const successAfterFacts = await loadImportedFacts();
  const auditAfter = await countAuditEvents(admin.id, startedAt);

  assertCondition(success.status === 201, "success apply status mismatch", success);
  assertCondition(success.createdAchievementsCount === 2, "success achievement summary mismatch", success);
  assertCondition(success.createdPaperDetailsCount === 2, "success paper detail summary mismatch", success);
  assertCondition(success.createdContributorsCount === 4, "success contributor summary mismatch", success);
  assertCondition(
    successAfterFacts.achievementCount - successBeforeFacts.achievementCount === 2,
    "success achievement count delta mismatch",
    { before: successBeforeFacts.achievementCount, after: successAfterFacts.achievementCount },
  );
  assertCondition(successAfterFacts.paperDetailCount === 2, "success paper detail count mismatch", successAfterFacts);
  assertCondition(
    successAfterFacts.normalizedDoiPersistedCount === 2,
    "success normalized DOI persistence count mismatch",
    successAfterFacts,
  );
  assertCondition(successAfterFacts.contributorCount === 4, "success contributor count mismatch", successAfterFacts);
  assertCondition(successAfterFacts.paperDraftCount === 2, "success draft status count mismatch", successAfterFacts);
  assertCondition(successAfterFacts.stateChangeCount === 0, "success state side effect mismatch", successAfterFacts);
  assertCondition(auditAfter - auditBefore === 2, "success audit delta mismatch", {
    before: auditBefore,
    after: auditAfter,
  });

  const repeatBeforeFacts = await loadImportedFacts();
  const repeatAuditBefore = await countAuditEvents(admin.id, startedAt);
  const repeat = await postCsv(admin.id, successCsv());
  const repeatAfterFacts = await loadImportedFacts();
  const repeatAuditAfter = await countAuditEvents(admin.id, startedAt);
  assertCondition(repeat.status === 400, "repeat apply status mismatch", repeat);
  assertCondition(repeat.errorCodes.includes("DB_CONFLICT"), "repeat apply code mismatch", repeat);
  assertCondition(
    repeatAfterFacts.achievementCount === repeatBeforeFacts.achievementCount &&
      repeatAfterFacts.paperDetailCount === repeatBeforeFacts.paperDetailCount &&
      repeatAfterFacts.contributorCount === repeatBeforeFacts.contributorCount,
    "repeat apply created extra data",
    { before: repeatBeforeFacts, after: repeatAfterFacts },
  );
  assertCondition(repeatAuditAfter === repeatAuditBefore, "repeat apply audit delta mismatch", {
    before: repeatAuditBefore,
    after: repeatAuditAfter,
  });

  const missingBeforeFacts = await loadImportedFacts();
  const missingDoi = await postCsv(admin.id, missingDoiCsv());
  const missingAfterFacts = await loadImportedFacts();
  assertCondition(missingDoi.status === 400, "missing DOI status mismatch", missingDoi);
  assertCondition(missingDoi.errorCodes.includes("REQUIRED"), "missing DOI code mismatch", missingDoi);
  assertCondition(
    missingAfterFacts.achievementCount === missingBeforeFacts.achievementCount,
    "missing DOI created data",
    { before: missingBeforeFacts, after: missingAfterFacts },
  );

  const unsupportedBeforeFacts = await loadImportedFacts();
  const unsupportedType = await postCsv(admin.id, unsupportedTypeCsv());
  const unsupportedAfterFacts = await loadImportedFacts();
  assertCondition(unsupportedType.status === 400, "unsupported type status mismatch", unsupportedType);
  assertCondition(
    unsupportedType.errorCodes.includes("UNSUPPORTED_TYPE"),
    "unsupported type code mismatch",
    unsupportedType,
  );
  assertCondition(
    unsupportedAfterFacts.achievementCount === unsupportedBeforeFacts.achievementCount,
    "unsupported type created data",
    { before: unsupportedBeforeFacts, after: unsupportedAfterFacts },
  );

  const errorBeforeFacts = await loadImportedFacts();
  const dryRunError = await postCsv(admin.id, dryRunErrorCsv());
  const errorAfterFacts = await loadImportedFacts();
  assertCondition(dryRunError.status === 400, "dry-run error status mismatch", dryRunError);
  assertCondition(
    dryRunError.errorCodes.includes("OWNER_NOT_FOUND"),
    "dry-run error code mismatch",
    dryRunError,
  );
  assertCondition(
    errorAfterFacts.achievementCount === errorBeforeFacts.achievementCount,
    "dry-run error created data",
    { before: errorBeforeFacts, after: errorAfterFacts },
  );

  const deniedBeforeFacts = await loadImportedFacts();
  const permissionDenied = await postCsv(limited.id, [
    "type,title,ownerEmail,departmentCode,contributors,status,doi",
    [
      "PAPER",
      `${titlePrefix} Permission Denied`,
      emails.ownerA,
      codes.importDepartment,
      `Step 68C Contributor A|AUTHOR|FIRST_AUTHOR|${emails.contributorA}|S68C Lab`,
      "DRAFT",
      doiValue("denied"),
    ].join(","),
  ].join("\n"));
  const deniedAfterFacts = await loadImportedFacts();
  assertCondition(permissionDenied.status === 403, "permission denied status mismatch", permissionDenied);
  assertCondition(
    deniedAfterFacts.achievementCount === deniedBeforeFacts.achievementCount,
    "permission denied created data",
    { before: deniedBeforeFacts, after: deniedAfterFacts },
  );

  const forbiddenAfter = await countForbiddenSideEffects();
  const forbiddenDelta = diffCounts(forbiddenBefore, forbiddenAfter);
  assertNoForbiddenSideEffects(forbiddenDelta, "Step 68C");

  console.log(JSON.stringify({
    step: "68C",
    scope: "local-production-like-docker-db-api-harness",
    productionVpcAcceptance: false,
    runningApiHealthStatus: runningApiHealth?.status ?? null,
    tempApiHealthStatus: tempApiHealth.status,
    authHarness: "x-demo-user-id-without-cookie-or-session-output",
    success: {
      status: success.status,
      createdAchievementsCount: success.createdAchievementsCount,
      createdPaperDetailsCount: success.createdPaperDetailsCount,
      createdContributorsCount: success.createdContributorsCount,
      achievementCountBefore: successBeforeFacts.achievementCount,
      achievementCountAfter: successAfterFacts.achievementCount,
      paperDraftCount: successAfterFacts.paperDraftCount,
      paperDetailCount: successAfterFacts.paperDetailCount,
      normalizedDoiPersistedCount: successAfterFacts.normalizedDoiPersistedCount,
      contributorCount: successAfterFacts.contributorCount,
      stateChangeCount: successAfterFacts.stateChangeCount,
      auditOperationDelta: auditAfter - auditBefore,
      auditOperation: operation,
    },
    repeatRejected: {
      status: repeat.status,
      achievementCountBefore: repeatBeforeFacts.achievementCount,
      achievementCountAfter: repeatAfterFacts.achievementCount,
      paperDetailCountAfter: repeatAfterFacts.paperDetailCount,
      contributorCountAfter: repeatAfterFacts.contributorCount,
      auditOperationDelta: repeatAuditAfter - repeatAuditBefore,
      errorCodes: repeat.errorCodes,
    },
    missingDoiRejected: {
      status: missingDoi.status,
      achievementCountBefore: missingBeforeFacts.achievementCount,
      achievementCountAfter: missingAfterFacts.achievementCount,
      errorCodes: missingDoi.errorCodes,
    },
    unsupportedTypeRejected: {
      status: unsupportedType.status,
      achievementCountBefore: unsupportedBeforeFacts.achievementCount,
      achievementCountAfter: unsupportedAfterFacts.achievementCount,
      errorCodes: unsupportedType.errorCodes,
    },
    dryRunErrorRejected: {
      status: dryRunError.status,
      achievementCountBefore: errorBeforeFacts.achievementCount,
      achievementCountAfter: errorAfterFacts.achievementCount,
      errorCodes: dryRunError.errorCodes,
    },
    permissionDenied: {
      status: permissionDenied.status,
      achievementCountBefore: deniedBeforeFacts.achievementCount,
      achievementCountAfter: deniedAfterFacts.achievementCount,
    },
    forbiddenSideEffectDelta: forbiddenDelta,
  }));
} finally {
  if (app) {
    await app.close();
  }
  await prisma.$disconnect();
}
