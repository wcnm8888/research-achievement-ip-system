import { createRequire } from "node:module";

process.env.NODE_ENV = "staging";

const requireFromApi = createRequire("/app/apps/api/dist/main.js");
const { PrismaClient } = requireFromApi("@prisma/client");
requireFromApi("reflect-metadata");
const { NestFactory } = requireFromApi("@nestjs/core");
const { AppModule } = requireFromApi("./app.module.js");

const prisma = new PrismaClient();
const port = Number(process.env.STEP69C_PORT ?? "33169");
const localHttp = "http" + "://127.0.0.1";
const apiBaseUrl = `${localHttp}:${port}/api`;
const suffix = Date.now().toString(36).toUpperCase();
const titlePrefix = `Step 69C Synthetic ${suffix}`;
const operation = "ACHIEVEMENT_IMPORT_CREATE_DRAFT";
const csvFileName = "step69c-achievements.csv";

const codes = {
  baseDepartment: `S69C_BASE_${suffix}`,
  importDepartment: `S69C_DEPT_${suffix}`,
  adminRole: `S69C_ADMIN_${suffix}`,
  limitedRole: `S69C_LIMITED_${suffix}`,
};

const emails = {
  admin: `step69c-admin-${suffix.toLowerCase()}@example.invalid`,
  limited: `step69c-limited-${suffix.toLowerCase()}@example.invalid`,
  ownerA: `step69c-owner-a-${suffix.toLowerCase()}@example.invalid`,
  ownerB: `step69c-owner-b-${suffix.toLowerCase()}@example.invalid`,
  contributorA: `step69c-contributor-a-${suffix.toLowerCase()}@example.invalid`,
  contributorB: `step69c-contributor-b-${suffix.toLowerCase()}@example.invalid`,
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
    message: typeof body?.message === "string" ? body.message : null,
    createdAchievementsCount: body?.summary?.createdAchievementsCount ?? null,
    createdPaperDetailsCount: body?.summary?.createdPaperDetailsCount ?? null,
    createdSoftwareCopyrightDetailsCount:
      body?.summary?.createdSoftwareCopyrightDetailsCount ?? null,
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
      softwareCopyrightDetail: {
        select: {
          achievementId: true,
          registrationNoNormalized: true,
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

  return {
    achievementCount: achievements.length,
    softwareDraftCount: achievements.filter(
      (achievement) =>
        achievement.type === "SOFTWARE_COPYRIGHT" && achievement.status === "DRAFT",
    ).length,
    softwareDetailCount: achievements.filter(
      (achievement) => achievement.softwareCopyrightDetail,
    ).length,
    normalizedRegistrationPersistedCount: achievements.filter(
      (achievement) =>
        achievement.softwareCopyrightDetail?.registrationNoNormalized,
    ).length,
    contributorCount: achievements.reduce(
      (count, achievement) => count + achievement.contributors.length,
      0,
    ),
    stateChangeCount: achievements.filter(
      (achievement) =>
        achievement.submittedAt || achievement.archivedAt || achievement.voidedAt,
    ).length,
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

const registrationValue = (marker) => `S69C-SW-${suffix}-${marker}`;
const doiValue = (marker) => ["10", ["69C", suffix.toLowerCase(), marker].join(".")].join("/");

const successCsv = () =>
  [
    "type,title,ownerEmail,departmentCode,contributors,status,softwareRegistrationNo,softwareVersion,softwareType,publishDate,registerDate,runEnv",
    [
      "SOFTWARE_COPYRIGHT",
      `${titlePrefix} Software A`,
      emails.ownerA,
      codes.importDepartment,
      `Step 69C Owner A|COPYRIGHT_OWNER|OWNER|${emails.contributorA}|S69C Lab;Step 69C External A|COPYRIGHT_OWNER|OTHER||S69C External`,
      "DRAFT",
      registrationValue("A"),
      "1.0",
      "APPLICATION",
      "2026-01-02",
      "2026-02-03",
      "S69C Runtime",
    ].join(","),
    [
      "SOFTWARE_COPYRIGHT",
      `${titlePrefix} Software B`,
      emails.ownerB,
      codes.importDepartment,
      `Step 69C Owner B|COPYRIGHT_OWNER|OWNER|${emails.contributorB}|S69C Lab;Step 69C External B|COPYRIGHT_OWNER|OTHER||S69C External`,
      "DRAFT",
      registrationValue("B"),
      "2.0",
      "SYSTEM",
      "2026-01-04",
      "2026-02-05",
      "S69C Runtime",
    ].join(","),
  ].join("\n");

const missingRegistrationCsv = () =>
  [
    "type,title,ownerEmail,departmentCode,contributors,status",
    [
      "SOFTWARE_COPYRIGHT",
      `${titlePrefix} Missing Registration`,
      emails.ownerA,
      codes.importDepartment,
      `Step 69C Owner A|COPYRIGHT_OWNER|OWNER|${emails.contributorA}|S69C Lab`,
      "DRAFT",
    ].join(","),
  ].join("\n");

const mixedCsv = () =>
  [
    "type,title,ownerEmail,departmentCode,contributors,status,doi,softwareRegistrationNo",
    [
      "PAPER",
      `${titlePrefix} Mixed Paper`,
      emails.ownerA,
      codes.importDepartment,
      `Step 69C Author|AUTHOR|FIRST_AUTHOR|${emails.contributorA}|S69C Lab`,
      "DRAFT",
      doiValue("mixed"),
      "",
    ].join(","),
    [
      "SOFTWARE_COPYRIGHT",
      `${titlePrefix} Mixed Software`,
      emails.ownerB,
      codes.importDepartment,
      `Step 69C Owner|COPYRIGHT_OWNER|OWNER|${emails.contributorB}|S69C Lab`,
      "DRAFT",
      "",
      registrationValue("MIXED"),
    ].join(","),
  ].join("\n");

const patentCsv = () =>
  [
    "type,title,ownerEmail,departmentCode,contributors,status,patentNo",
    [
      "PATENT",
      `${titlePrefix} Patent Rejected`,
      emails.ownerA,
      codes.importDepartment,
      `Step 69C Inventor|INVENTOR|PRIMARY_INVENTOR|${emails.contributorA}|S69C Lab`,
      "DRAFT",
      `S69C-PAT-${suffix}`,
    ].join(","),
  ].join("\n");

const dryRunErrorCsv = () =>
  [
    "type,title,ownerEmail,departmentCode,contributors,status,softwareRegistrationNo",
    [
      "SOFTWARE_COPYRIGHT",
      `${titlePrefix} Dry Run Error`,
      `missing-${suffix.toLowerCase()}@example.invalid`,
      codes.importDepartment,
      "Step 69C Owner|COPYRIGHT_OWNER|OWNER||S69C Lab",
      "DRAFT",
      registrationValue("ERROR"),
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
      name: "Step 69C Synthetic Base",
    },
  });
  const importDepartment = await prisma.department.create({
    data: {
      code: codes.importDepartment,
      name: "Step 69C Synthetic Import Department",
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
  assertCondition(
    success.createdSoftwareCopyrightDetailsCount === 2,
    "success software detail summary mismatch",
    success,
  );
  assertCondition(success.createdContributorsCount === 4, "success contributor summary mismatch", success);
  assertCondition(
    successAfterFacts.achievementCount - successBeforeFacts.achievementCount === 2,
    "success achievement count delta mismatch",
    { before: successBeforeFacts.achievementCount, after: successAfterFacts.achievementCount },
  );
  assertCondition(successAfterFacts.softwareDetailCount === 2, "success software detail count mismatch", successAfterFacts);
  assertCondition(
    successAfterFacts.normalizedRegistrationPersistedCount === 2,
    "success normalized registration persistence count mismatch",
    successAfterFacts,
  );
  assertCondition(successAfterFacts.contributorCount === 4, "success contributor count mismatch", successAfterFacts);
  assertCondition(successAfterFacts.softwareDraftCount === 2, "success draft status count mismatch", successAfterFacts);
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
      repeatAfterFacts.softwareDetailCount === repeatBeforeFacts.softwareDetailCount &&
      repeatAfterFacts.contributorCount === repeatBeforeFacts.contributorCount,
    "repeat apply created extra data",
    { before: repeatBeforeFacts, after: repeatAfterFacts },
  );
  assertCondition(repeatAuditAfter === repeatAuditBefore, "repeat apply audit delta mismatch", {
    before: repeatAuditBefore,
    after: repeatAuditAfter,
  });

  const missingBeforeFacts = await loadImportedFacts();
  const missingRegistration = await postCsv(admin.id, missingRegistrationCsv());
  const missingAfterFacts = await loadImportedFacts();
  assertCondition(missingRegistration.status === 400, "missing registration status mismatch", missingRegistration);
  assertCondition(missingRegistration.errorCodes.includes("REQUIRED"), "missing registration code mismatch", missingRegistration);
  assertCondition(
    missingAfterFacts.achievementCount === missingBeforeFacts.achievementCount,
    "missing registration created data",
    { before: missingBeforeFacts, after: missingAfterFacts },
  );

  const mixedBeforeFacts = await loadImportedFacts();
  const mixed = await postCsv(admin.id, mixedCsv());
  const mixedAfterFacts = await loadImportedFacts();
  assertCondition(mixed.status === 400, "mixed batch status mismatch", mixed);
  assertCondition(mixed.errorCodes.includes("MIXED_TYPE_BATCH"), "mixed batch code mismatch", mixed);
  assertCondition(
    mixedAfterFacts.achievementCount === mixedBeforeFacts.achievementCount,
    "mixed batch created data",
    { before: mixedBeforeFacts, after: mixedAfterFacts },
  );

  const patentBeforeFacts = await loadImportedFacts();
  const patent = await postCsv(admin.id, patentCsv());
  const patentAfterFacts = await loadImportedFacts();
  assertCondition(patent.status === 400, "patent status mismatch", patent);
  assertCondition(patent.errorCodes.includes("UNSUPPORTED_TYPE"), "patent code mismatch", patent);
  assertCondition(
    patentAfterFacts.achievementCount === patentBeforeFacts.achievementCount,
    "patent created data",
    { before: patentBeforeFacts, after: patentAfterFacts },
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
    "type,title,ownerEmail,departmentCode,contributors,status,softwareRegistrationNo",
    [
      "SOFTWARE_COPYRIGHT",
      `${titlePrefix} Permission Denied`,
      emails.ownerA,
      codes.importDepartment,
      `Step 69C Owner A|COPYRIGHT_OWNER|OWNER|${emails.contributorA}|S69C Lab`,
      "DRAFT",
      registrationValue("DENIED"),
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
  assertNoForbiddenSideEffects(forbiddenDelta, "Step 69C");

  console.log(JSON.stringify({
    step: "69C",
    scope: "local-production-like-docker-db-api-harness",
    productionVpcAcceptance: false,
    runningApiHealthStatus: runningApiHealth?.status ?? null,
    tempApiHealthStatus: tempApiHealth.status,
    authHarness: "x-demo-user-id-without-cookie-or-session-output",
    success: {
      status: success.status,
      createdAchievementsCount: success.createdAchievementsCount,
      createdPaperDetailsCount: success.createdPaperDetailsCount,
      createdSoftwareCopyrightDetailsCount: success.createdSoftwareCopyrightDetailsCount,
      createdContributorsCount: success.createdContributorsCount,
      achievementCountBefore: successBeforeFacts.achievementCount,
      achievementCountAfter: successAfterFacts.achievementCount,
      softwareDraftCount: successAfterFacts.softwareDraftCount,
      softwareDetailCount: successAfterFacts.softwareDetailCount,
      normalizedRegistrationPersistedCount: successAfterFacts.normalizedRegistrationPersistedCount,
      contributorCount: successAfterFacts.contributorCount,
      stateChangeCount: successAfterFacts.stateChangeCount,
      auditOperationDelta: auditAfter - auditBefore,
      auditOperation: operation,
    },
    repeatRejected: {
      status: repeat.status,
      achievementCountBefore: repeatBeforeFacts.achievementCount,
      achievementCountAfter: repeatAfterFacts.achievementCount,
      softwareDetailCountAfter: repeatAfterFacts.softwareDetailCount,
      contributorCountAfter: repeatAfterFacts.contributorCount,
      auditOperationDelta: repeatAuditAfter - repeatAuditBefore,
      errorCodes: repeat.errorCodes,
    },
    missingRegistrationRejected: {
      status: missingRegistration.status,
      achievementCountBefore: missingBeforeFacts.achievementCount,
      achievementCountAfter: missingAfterFacts.achievementCount,
      errorCodes: missingRegistration.errorCodes,
    },
    mixedBatchRejected: {
      status: mixed.status,
      achievementCountBefore: mixedBeforeFacts.achievementCount,
      achievementCountAfter: mixedAfterFacts.achievementCount,
      errorCodes: mixed.errorCodes,
    },
    patentRejected: {
      status: patent.status,
      achievementCountBefore: patentBeforeFacts.achievementCount,
      achievementCountAfter: patentAfterFacts.achievementCount,
      errorCodes: patent.errorCodes,
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
