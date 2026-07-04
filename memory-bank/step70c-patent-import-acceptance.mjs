import { createRequire } from "node:module";

process.env.NODE_ENV = "staging";

const requireFromApi = createRequire("/app/apps/api/dist/main.js");
const { PrismaClient } = requireFromApi("@prisma/client");
requireFromApi("reflect-metadata");
const { NestFactory } = requireFromApi("@nestjs/core");
const { AppModule } = requireFromApi("./app.module.js");

const prisma = new PrismaClient();
const port = Number(process.env.STEP70C_PORT ?? "33170");
const localHttp = "http" + "://127.0.0.1";
const apiBaseUrl = `${localHttp}:${port}/api`;
const suffix = Date.now().toString(36).toUpperCase();
const titlePrefix = `Step 70C Synthetic ${suffix}`;
const operation = "ACHIEVEMENT_IMPORT_CREATE_DRAFT";
const csvFileName = "step70c-achievements.csv";

const codes = {
  baseDepartment: `S70C_BASE_${suffix}`,
  importDepartment: `S70C_DEPT_${suffix}`,
  adminRole: `S70C_ADMIN_${suffix}`,
  limitedRole: `S70C_LIMITED_${suffix}`,
};

const emails = {
  admin: `step70c-admin-${suffix.toLowerCase()}@example.invalid`,
  limited: `step70c-limited-${suffix.toLowerCase()}@example.invalid`,
  ownerA: `step70c-owner-a-${suffix.toLowerCase()}@example.invalid`,
  ownerB: `step70c-owner-b-${suffix.toLowerCase()}@example.invalid`,
  contributorA: `step70c-contributor-a-${suffix.toLowerCase()}@example.invalid`,
  contributorB: `step70c-contributor-b-${suffix.toLowerCase()}@example.invalid`,
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
    createdPatentDetailsCount: body?.summary?.createdPatentDetailsCount ?? null,
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
      patentDetail: {
        select: {
          achievementId: true,
          applicationNoNormalized: true,
          grantNoNormalized: true,
          nextFeeDate: true,
          feeAmount: true,
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
    patentDraftCount: achievements.filter(
      (achievement) => achievement.type === "PATENT" && achievement.status === "DRAFT",
    ).length,
    patentDetailCount: achievements.filter((achievement) => achievement.patentDetail).length,
    normalizedApplicationPersistedCount: achievements.filter(
      (achievement) => achievement.patentDetail?.applicationNoNormalized,
    ).length,
    normalizedGrantPersistedCount: achievements.filter(
      (achievement) => achievement.patentDetail?.grantNoNormalized,
    ).length,
    nextFeeDatePersistedCount: achievements.filter(
      (achievement) => achievement.patentDetail?.nextFeeDate,
    ).length,
    feeAmountPersistedCount: achievements.filter(
      (achievement) => achievement.patentDetail?.feeAmount,
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
  feeReviewHistoryCount: await prisma.feeReviewHistory.count(),
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

const applicationValue = (marker) => `S70C-APP-${suffix}-${marker}`;
const grantValue = (marker) => `S70C-GRANT-${suffix}-${marker}`;
const doiValue = (marker) => ["10", ["70C", suffix.toLowerCase(), marker].join(".")].join("/");

const successCsv = () =>
  [
    "type,title,ownerEmail,departmentCode,contributors,status,applicationNo,grantNo,patentType,filingDate,grantDate,nextFeeDate,feeAmount,legalStatus",
    [
      "PATENT",
      `${titlePrefix} Patent A`,
      emails.ownerA,
      codes.importDepartment,
      `Step 70C Inventor A|INVENTOR|PRIMARY_INVENTOR|${emails.contributorA}|S70C Lab;Step 70C External A|INVENTOR|OTHER||S70C External`,
      "DRAFT",
      applicationValue("A"),
      grantValue("A"),
      "INVENTION",
      "2026-01-02",
      "2026-02-03",
      "2027-02-03",
      "1200.50",
      "GRANTED",
    ].join(","),
    [
      "PATENT",
      `${titlePrefix} Patent B`,
      emails.ownerB,
      codes.importDepartment,
      `Step 70C Inventor B|INVENTOR|PRIMARY_INVENTOR|${emails.contributorB}|S70C Lab;Step 70C External B|INVENTOR|OTHER||S70C External`,
      "DRAFT",
      applicationValue("B"),
      "",
      "UTILITY_MODEL",
      "2026-01-04",
      "",
      "2027-03-04",
      "990.00",
      "PENDING",
    ].join(","),
  ].join("\n");

const missingApplicationCsv = () =>
  [
    "type,title,ownerEmail,departmentCode,contributors,status,applicationNo",
    [
      "PATENT",
      `${titlePrefix} Missing Application`,
      emails.ownerA,
      codes.importDepartment,
      `Step 70C Inventor A|INVENTOR|PRIMARY_INVENTOR|${emails.contributorA}|S70C Lab`,
      "DRAFT",
      "",
    ].join(","),
  ].join("\n");

const grantOnlyCsv = () =>
  [
    "type,title,ownerEmail,departmentCode,contributors,status,grantNo",
    [
      "PATENT",
      `${titlePrefix} Grant Only`,
      emails.ownerA,
      codes.importDepartment,
      `Step 70C Inventor A|INVENTOR|PRIMARY_INVENTOR|${emails.contributorA}|S70C Lab`,
      "DRAFT",
      grantValue("ONLY"),
    ].join(","),
  ].join("\n");

const noIdentifierCsv = () =>
  [
    "type,title,ownerEmail,departmentCode,contributors,status",
    [
      "PATENT",
      `${titlePrefix} No Identifier`,
      emails.ownerA,
      codes.importDepartment,
      `Step 70C Inventor A|INVENTOR|PRIMARY_INVENTOR|${emails.contributorA}|S70C Lab`,
      "DRAFT",
    ].join(","),
  ].join("\n");

const mixedCsv = () =>
  [
    "type,title,ownerEmail,departmentCode,contributors,status,doi,applicationNo",
    [
      "PAPER",
      `${titlePrefix} Mixed Paper`,
      emails.ownerA,
      codes.importDepartment,
      `Step 70C Author|AUTHOR|FIRST_AUTHOR|${emails.contributorA}|S70C Lab`,
      "DRAFT",
      doiValue("mixed"),
      "",
    ].join(","),
    [
      "PATENT",
      `${titlePrefix} Mixed Patent`,
      emails.ownerB,
      codes.importDepartment,
      `Step 70C Inventor|INVENTOR|PRIMARY_INVENTOR|${emails.contributorB}|S70C Lab`,
      "DRAFT",
      "",
      applicationValue("MIXED"),
    ].join(","),
  ].join("\n");

const dryRunErrorCsv = () =>
  [
    "type,title,ownerEmail,departmentCode,contributors,status,applicationNo",
    [
      "PATENT",
      `${titlePrefix} Dry Run Error`,
      `missing-${suffix.toLowerCase()}@example.invalid`,
      codes.importDepartment,
      "Step 70C Inventor|INVENTOR|PRIMARY_INVENTOR||S70C Lab",
      "DRAFT",
      applicationValue("ERROR"),
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
      name: "Step 70C Synthetic Base",
    },
  });
  const importDepartment = await prisma.department.create({
    data: {
      code: codes.importDepartment,
      name: "Step 70C Synthetic Import Department",
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
  assertCondition(success.createdPatentDetailsCount === 2, "success patent detail summary mismatch", success);
  assertCondition(success.createdContributorsCount === 4, "success contributor summary mismatch", success);
  assertCondition(
    successAfterFacts.achievementCount - successBeforeFacts.achievementCount === 2,
    "success achievement count delta mismatch",
    { before: successBeforeFacts.achievementCount, after: successAfterFacts.achievementCount },
  );
  assertCondition(successAfterFacts.patentDraftCount === 2, "success draft status count mismatch", successAfterFacts);
  assertCondition(successAfterFacts.patentDetailCount === 2, "success patent detail count mismatch", successAfterFacts);
  assertCondition(
    successAfterFacts.normalizedApplicationPersistedCount === 2,
    "success normalized application persistence count mismatch",
    successAfterFacts,
  );
  assertCondition(
    successAfterFacts.normalizedGrantPersistedCount === 1,
    "success normalized grant persistence count mismatch",
    successAfterFacts,
  );
  assertCondition(
    successAfterFacts.nextFeeDatePersistedCount === 0 &&
      successAfterFacts.feeAmountPersistedCount === 0,
    "success fee/reminder detail persistence mismatch",
    successAfterFacts,
  );
  assertCondition(successAfterFacts.contributorCount === 4, "success contributor count mismatch", successAfterFacts);
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
      repeatAfterFacts.patentDetailCount === repeatBeforeFacts.patentDetailCount &&
      repeatAfterFacts.contributorCount === repeatBeforeFacts.contributorCount,
    "repeat apply created extra data",
    { before: repeatBeforeFacts, after: repeatAfterFacts },
  );
  assertCondition(repeatAuditAfter === repeatAuditBefore, "repeat apply audit delta mismatch", {
    before: repeatAuditBefore,
    after: repeatAuditAfter,
  });

  const missingBeforeFacts = await loadImportedFacts();
  const missingApplication = await postCsv(admin.id, missingApplicationCsv());
  const missingAfterFacts = await loadImportedFacts();
  assertCondition(missingApplication.status === 400, "missing application status mismatch", missingApplication);
  assertCondition(missingApplication.errorCodes.includes("REQUIRED"), "missing application code mismatch", missingApplication);
  assertCondition(
    missingAfterFacts.achievementCount === missingBeforeFacts.achievementCount,
    "missing application created data",
    { before: missingBeforeFacts, after: missingAfterFacts },
  );

  const grantOnlyBeforeFacts = await loadImportedFacts();
  const grantOnly = await postCsv(admin.id, grantOnlyCsv());
  const grantOnlyAfterFacts = await loadImportedFacts();
  assertCondition(grantOnly.status === 400, "grant-only status mismatch", grantOnly);
  assertCondition(grantOnly.errorCodes.includes("REQUIRED"), "grant-only code mismatch", grantOnly);
  assertCondition(
    grantOnlyAfterFacts.achievementCount === grantOnlyBeforeFacts.achievementCount,
    "grant-only created data",
    { before: grantOnlyBeforeFacts, after: grantOnlyAfterFacts },
  );

  const noIdentifierBeforeFacts = await loadImportedFacts();
  const noIdentifier = await postCsv(admin.id, noIdentifierCsv());
  const noIdentifierAfterFacts = await loadImportedFacts();
  assertCondition(noIdentifier.status === 400, "no-identifier status mismatch", noIdentifier);
  assertCondition(noIdentifier.errorCodes.includes("REQUIRED"), "no-identifier code mismatch", noIdentifier);
  assertCondition(
    noIdentifierAfterFacts.achievementCount === noIdentifierBeforeFacts.achievementCount,
    "no-identifier created data",
    { before: noIdentifierBeforeFacts, after: noIdentifierAfterFacts },
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
    "type,title,ownerEmail,departmentCode,contributors,status,applicationNo",
    [
      "PATENT",
      `${titlePrefix} Permission Denied`,
      emails.ownerA,
      codes.importDepartment,
      `Step 70C Inventor A|INVENTOR|PRIMARY_INVENTOR|${emails.contributorA}|S70C Lab`,
      "DRAFT",
      applicationValue("DENIED"),
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
  assertNoForbiddenSideEffects(forbiddenDelta, "Step 70C");

  console.log(JSON.stringify({
    step: "70C",
    scope: "local-production-like-docker-db-api-harness",
    productionVpcAcceptance: false,
    runningApiHealthStatus: runningApiHealth?.status ?? null,
    tempApiHealthStatus: tempApiHealth.status,
    authHarness: "x-demo-user-id-without-cookie-or-session-output",
    success: {
      status: success.status,
      createdAchievementsCount: success.createdAchievementsCount,
      createdPaperDetailsCount: success.createdPaperDetailsCount,
      createdPatentDetailsCount: success.createdPatentDetailsCount,
      createdSoftwareCopyrightDetailsCount: success.createdSoftwareCopyrightDetailsCount,
      createdContributorsCount: success.createdContributorsCount,
      achievementCountBefore: successBeforeFacts.achievementCount,
      achievementCountAfter: successAfterFacts.achievementCount,
      patentDraftCount: successAfterFacts.patentDraftCount,
      patentDetailCount: successAfterFacts.patentDetailCount,
      normalizedApplicationPersistedCount: successAfterFacts.normalizedApplicationPersistedCount,
      normalizedGrantPersistedCount: successAfterFacts.normalizedGrantPersistedCount,
      nextFeeDatePersistedCount: successAfterFacts.nextFeeDatePersistedCount,
      feeAmountPersistedCount: successAfterFacts.feeAmountPersistedCount,
      contributorCount: successAfterFacts.contributorCount,
      stateChangeCount: successAfterFacts.stateChangeCount,
      auditOperationDelta: auditAfter - auditBefore,
      auditOperation: operation,
    },
    repeatRejected: {
      status: repeat.status,
      achievementCountBefore: repeatBeforeFacts.achievementCount,
      achievementCountAfter: repeatAfterFacts.achievementCount,
      patentDetailCountAfter: repeatAfterFacts.patentDetailCount,
      contributorCountAfter: repeatAfterFacts.contributorCount,
      auditOperationDelta: repeatAuditAfter - repeatAuditBefore,
      errorCodes: repeat.errorCodes,
    },
    missingApplicationRejected: {
      status: missingApplication.status,
      achievementCountBefore: missingBeforeFacts.achievementCount,
      achievementCountAfter: missingAfterFacts.achievementCount,
      errorCodes: missingApplication.errorCodes,
    },
    grantOnlyRejected: {
      status: grantOnly.status,
      achievementCountBefore: grantOnlyBeforeFacts.achievementCount,
      achievementCountAfter: grantOnlyAfterFacts.achievementCount,
      errorCodes: grantOnly.errorCodes,
    },
    noIdentifierRejected: {
      status: noIdentifier.status,
      achievementCountBefore: noIdentifierBeforeFacts.achievementCount,
      achievementCountAfter: noIdentifierAfterFacts.achievementCount,
      errorCodes: noIdentifier.errorCodes,
    },
    mixedBatchRejected: {
      status: mixed.status,
      achievementCountBefore: mixedBeforeFacts.achievementCount,
      achievementCountAfter: mixedAfterFacts.achievementCount,
      errorCodes: mixed.errorCodes,
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
