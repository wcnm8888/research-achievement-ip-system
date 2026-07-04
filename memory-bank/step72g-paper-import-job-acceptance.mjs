import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

process.env.NODE_ENV = "staging";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiDistMain = path.join(projectRoot, "apps", "api", "dist", "main.js");
const apiDistAppModule = path.join(projectRoot, "apps", "api", "dist", "app.module.js");
const apiDistImportJobRepository = path.join(
  projectRoot,
  "apps",
  "api",
  "dist",
  "imports",
  "achievement-import-job.repository.js",
);

if (!process.env.DATABASE_URL) {
  console.error(
    JSON.stringify({
      step: "72G",
      status: "BLOCKED",
      reason: "DATABASE_URL_NOT_SET",
      message:
        "Run this helper in the local API container or set DATABASE_URL to a local non-production database in the current process.",
      productionVpcAcceptance: false,
    }),
  );
  process.exit(1);
}

const ensureCompiledApiDist = () => {
  if (
    existsSync(apiDistMain) &&
    existsSync(apiDistAppModule) &&
    existsSync(apiDistImportJobRepository)
  ) {
    return;
  }

  console.log("[step72g] Refreshing local API dist with project build script.");
  const result = spawnSync(
    "corepack",
    ["pnpm", "--filter", "@research-ip/api", "build"],
    {
      cwd: projectRoot,
      shell: process.platform === "win32",
      stdio: "inherit",
    },
  );
  if (result.status !== 0) {
    throw new Error("API build failed before Step 72G acceptance.");
  }
};

ensureCompiledApiDist();

const requireFromApi = createRequire(apiDistMain);
requireFromApi("reflect-metadata");
const { NestFactory } = requireFromApi("@nestjs/core");
const { AppModule } = requireFromApi("./app.module.js");

const prisma = new PrismaClient();
const suffix = Date.now().toString(36).toUpperCase();
const operation = "ACHIEVEMENT_IMPORT_CREATE_DRAFT";
const csvFileName = "step72g-paper-import.csv";

const codes = {
  baseDepartment: `S72G_BASE_${suffix}`,
  importDepartment: `S72G_DEPT_${suffix}`,
  adminRole: `S72G_ADMIN_${suffix}`,
};

const titles = {
  successA: `S72G_SUCCESS_TITLE_A_${suffix}`,
  successB: `S72G_SUCCESS_TITLE_B_${suffix}`,
  rejected: `S72G_REJECTED_TITLE_${suffix}`,
  running: `S72G_RUNNING_TITLE_${suffix}`,
};

const abstracts = {
  successA: `S72G_SUCCESS_ABSTRACT_A_${suffix}`,
  successB: `S72G_SUCCESS_ABSTRACT_B_${suffix}`,
};

const names = {
  baseDepartment: `S72G_BASE_NAME_${suffix}`,
  importDepartment: `S72G_DEPT_NAME_${suffix}`,
  admin: `S72G_ADMIN_NAME_${suffix}`,
  ownerA: `S72G_OWNER_A_NAME_${suffix}`,
  ownerB: `S72G_OWNER_B_NAME_${suffix}`,
  contributorA: `S72G_CONTRIBUTOR_A_NAME_${suffix}`,
  contributorB: `S72G_CONTRIBUTOR_B_NAME_${suffix}`,
};

const emails = {
  admin: `step72g-admin-${suffix.toLowerCase()}@example.invalid`,
  ownerA: `step72g-owner-a-${suffix.toLowerCase()}@example.invalid`,
  ownerB: `step72g-owner-b-${suffix.toLowerCase()}@example.invalid`,
  contributorA: `step72g-contributor-a-${suffix.toLowerCase()}@example.invalid`,
  contributorB: `step72g-contributor-b-${suffix.toLowerCase()}@example.invalid`,
};

const doiValues = {
  successA: `10.72g/${suffix.toLowerCase()}-a`,
  successB: `10.72g/${suffix.toLowerCase()}-b`,
  running: `10.72g/${suffix.toLowerCase()}-running`,
};

const normalizedDoiValues = {
  successA: doiValues.successA,
  successB: doiValues.successB,
  running: doiValues.running,
};

const assertCondition = (condition, message, details = {}) => {
  if (!condition) {
    throw new Error(JSON.stringify({ message, details }));
  }
};

const assertEqualObject = (actual, expected, message) => {
  assertCondition(JSON.stringify(actual) === JSON.stringify(expected), message, {
    actual,
    expected,
  });
};

const sha256Hex = (value) => createHash("sha256").update(value).digest("hex");

const createCsvBlob = (csv) => new Blob([csv], { type: "text/csv" });

const uniqueCodes = (body) =>
  Array.isArray(body?.errors)
    ? [...new Set(body.errors.map((error) => error.code).filter(Boolean))]
    : [];

const postCsv = async (apiBaseUrl, actorUserId, csv) => {
  const form = new FormData();
  form.append("mode", "CREATE_DRAFT_ONLY");
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
    body,
    summary: body?.summary ?? null,
    job: body?.job ?? null,
    errorCodes: uniqueCodes(body),
  };
};

const createRole = (code, permissionId) =>
  prisma.role.create({
    data: {
      code,
      name: code,
      status: "ACTIVE",
      rolePermissions: {
        create: {
          permissionId,
        },
      },
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

const buildIdempotency = ({ actorUserId, actorDepartmentId, csv }) => {
  const targetEnvironment = "staging";
  const scopeType = "GLOBAL_OPERATOR_SCOPE";
  const scopeHash = sha256Hex(
    JSON.stringify({
      operatorUserId: actorUserId,
      operatorDepartmentId: actorDepartmentId,
      scopeType,
    }),
  );
  const fileFingerprint = sha256Hex(Buffer.from(csv));
  const keyMaterial = {
    family: "ACHIEVEMENT",
    mode: "CREATE_DRAFT_ONLY",
    achievementType: "PAPER",
    fileFingerprint,
    targetEnvironment,
    scopeType,
    scopeHash,
  };
  const requestFingerprint = sha256Hex(JSON.stringify(keyMaterial));

  return {
    targetEnvironment,
    scopeType,
    scopeHash,
    fileFingerprint,
    idempotencyKeyHash: requestFingerprint,
    requestFingerprint,
  };
};

const loadJobsByKey = (idempotency) =>
  prisma.importJob.findMany({
    where: {
      targetEnvironment: idempotency.targetEnvironment,
      scopeType: idempotency.scopeType,
      scopeHash: idempotency.scopeHash,
      idempotencyKeyHash: idempotency.idempotencyKeyHash,
    },
    include: {
      runs: {
        orderBy: {
          attemptNo: "asc",
        },
      },
    },
  });

const createRunningJob = async ({ actorUserId, csv, idempotency }) =>
  prisma.$transaction(async (tx) => {
    const job = await tx.importJob.create({
      data: {
        idempotencyKeyHash: idempotency.idempotencyKeyHash,
        importFamily: "ACHIEVEMENT",
        mode: "CREATE_DRAFT_ONLY",
        achievementType: "PAPER",
        targetEnvironment: idempotency.targetEnvironment,
        scopeType: idempotency.scopeType,
        scopeHash: idempotency.scopeHash,
        fileFingerprint: idempotency.fileFingerprint,
        fileSizeBytes: Buffer.byteLength(csv),
        operatorUserId: actorUserId,
        status: "RUNNING",
      },
      select: {
        id: true,
      },
    });
    const run = await tx.importRun.create({
      data: {
        jobId: job.id,
        attemptNo: 1,
        trigger: "INITIAL_SUBMIT",
        status: "RUNNING",
        operatorUserId: actorUserId,
        requestFingerprint: idempotency.requestFingerprint,
        startedAt: new Date(),
      },
      select: {
        id: true,
      },
    });
    await tx.importJob.update({
      where: {
        id: job.id,
      },
      data: {
        latestRunId: run.id,
      },
    });

    return { jobId: job.id, runId: run.id };
  });

const countImportAuditEvents = async (actorUserId, since) => {
  const rows = await prisma.auditLog.findMany({
    where: {
      actorUserId,
      action: "CREATE",
      targetType: "ACHIEVEMENT",
      createdAt: {
        gte: since,
      },
    },
    select: {
      newValue: true,
    },
  });

  return rows.filter((row) => row.newValue?.operation === operation).length;
};

const loadPaperFacts = async (targetTitles) => {
  const achievements = await prisma.achievement.findMany({
    where: {
      title: {
        in: targetTitles,
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
        },
      },
    },
  });

  return {
    achievementCount: achievements.length,
    draftPaperCount: achievements.filter(
      (achievement) => achievement.type === "PAPER" && achievement.status === "DRAFT",
    ).length,
    paperDetailCount: achievements.filter((achievement) => achievement.paperDetail).length,
    normalizedDoiPersistedCount: achievements.filter(
      (achievement) => achievement.paperDetail?.doiNormalized,
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

const snapshotSideEffectCounts = () =>
  Promise.all([
    prisma.userCredential.count(),
    prisma.userSession.count(),
    prisma.accountLifecycleToken.count(),
    prisma.resourceAccessGrant.count(),
    prisma.patentDetail.count(),
    prisma.softwareCopyrightDetail.count(),
    prisma.workflowInstance.count(),
    prisma.workflowTask.count(),
    prisma.workflowAction.count(),
    prisma.feeRecord.count(),
    prisma.feeReviewHistory.count(),
    prisma.reminderTask.count(),
    prisma.notification.count(),
    prisma.attachment.count(),
    prisma.searchLog.count(),
  ]).then((counts) => ({
    userCredential: counts[0],
    userSession: counts[1],
    accountLifecycleToken: counts[2],
    resourceAccessGrant: counts[3],
    patentDetail: counts[4],
    softwareCopyrightDetail: counts[5],
    workflowInstance: counts[6],
    workflowTask: counts[7],
    workflowAction: counts[8],
    feeRecord: counts[9],
    feeReviewHistory: counts[10],
    reminderTask: counts[11],
    notification: counts[12],
    attachment: counts[13],
    searchLog: counts[14],
  }));

const countNonPaperImportJobsSince = (since) =>
  prisma.importJob.count({
    where: {
      importFamily: "ACHIEVEMENT",
      mode: "CREATE_DRAFT_ONLY",
      achievementType: {
        in: ["SOFTWARE_COPYRIGHT", "PATENT"],
      },
      createdAt: {
        gte: since,
      },
    },
  });

const assertSafeSummary = ({ label, job, forbiddenTokens }) => {
  const runs = job.runs ?? [];
  const safePayload = JSON.stringify({
    jobSafeSummary: job.safeSummary,
    jobSafeErrorCodes: job.safeErrorCodes,
    runValidationSummaries: runs.map((run) => run.validationSummary),
    runApplySummaries: runs.map((run) => run.applySummary),
    runAuditLogIds: runs.map((run) => run.auditLogIds),
  });

  forbiddenTokens.forEach((token, index) => {
    assertCondition(
      typeof token !== "string" || token.length === 0 || !safePayload.includes(token),
      `${label} summary leaked forbidden token index ${index}`,
    );
  });

  const unsafeTermPattern =
    /credential|session|token|cookie|password|connection string|database_url|env|storage|mail payload|https?:\/\//i;
  assertCondition(!unsafeTermPattern.test(safePayload), `${label} summary leaked unsafe term`, {
    matched: safePayload.match(unsafeTermPattern)?.[0] ?? null,
  });
};

const successCsv = [
  "type,title,ownerEmail,departmentCode,contributors,status,doi,journal,publishYear,abstract",
  [
    "PAPER",
    titles.successA,
    emails.ownerA,
    codes.importDepartment,
    `${names.contributorA}|AUTHOR|FIRST_AUTHOR|${emails.contributorA}|S72G Lab`,
    "DRAFT",
    doiValues.successA,
    "S72G Journal",
    "2026",
    abstracts.successA,
  ].join(","),
  [
    "PAPER",
    titles.successB,
    emails.ownerB,
    codes.importDepartment,
    `${names.contributorB}|AUTHOR|CORRESPONDING_AUTHOR|${emails.contributorB}|S72G Lab`,
    "DRAFT",
    doiValues.successB,
    "S72G Journal",
    "2026",
    abstracts.successB,
  ].join(","),
].join("\n");

const rejectedCsv = [
  "type,title,ownerEmail,departmentCode,contributors,status",
  [
    "PAPER",
    titles.rejected,
    emails.ownerA,
    codes.importDepartment,
    `${names.contributorA}|AUTHOR|FIRST_AUTHOR|${emails.contributorA}|S72G Lab`,
    "DRAFT",
  ].join(","),
].join("\n");

const runningCsv = [
  "type,title,ownerEmail,departmentCode,contributors,status,doi",
  [
    "PAPER",
    titles.running,
    emails.ownerA,
    codes.importDepartment,
    `${names.contributorA}|AUTHOR|FIRST_AUTHOR|${emails.contributorA}|S72G Lab`,
    "DRAFT",
    doiValues.running,
  ].join(","),
].join("\n");

let app = null;

try {
  const startedAt = new Date();
  const permission = await prisma.permission.findUnique({
    where: {
      code: "system:config",
    },
    select: {
      id: true,
      status: true,
    },
  });
  assertCondition(
    permission?.status === "ACTIVE",
    "Local foundation permission system:config is required and must be ACTIVE.",
  );

  const baseDepartment = await prisma.department.create({
    data: {
      code: codes.baseDepartment,
      name: names.baseDepartment,
    },
  });
  const importDepartment = await prisma.department.create({
    data: {
      code: codes.importDepartment,
      name: names.importDepartment,
    },
  });
  const adminRole = await createRole(codes.adminRole, permission.id);
  const admin = await createUser({
    email: emails.admin,
    name: names.admin,
    roleId: adminRole.id,
    departmentId: baseDepartment.id,
  });
  await createUser({
    email: emails.ownerA,
    name: names.ownerA,
    departmentId: importDepartment.id,
  });
  await createUser({
    email: emails.ownerB,
    name: names.ownerB,
    departmentId: importDepartment.id,
  });
  await createUser({
    email: emails.contributorA,
    name: names.contributorA,
    departmentId: importDepartment.id,
  });
  await createUser({
    email: emails.contributorB,
    name: names.contributorB,
    departmentId: importDepartment.id,
  });

  app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix("api");
  await app.listen(0, "127.0.0.1");
  const apiBaseUrl = `${await app.getUrl()}/api`;
  const tempHealth = await fetch(`${apiBaseUrl}/health`);
  assertCondition(tempHealth.status === 200, "temporary API health check failed", {
    status: tempHealth.status,
  });

  const sideEffectsBefore = await snapshotSideEffectCounts();
  const successTitles = [titles.successA, titles.successB];
  const successIdempotency = buildIdempotency({
    actorUserId: admin.id,
    actorDepartmentId: baseDepartment.id,
    csv: successCsv,
  });
  const successFactsBefore = await loadPaperFacts(successTitles);
  const successAuditBefore = await countImportAuditEvents(admin.id, startedAt);
  const successJobsBefore = await loadJobsByKey(successIdempotency);
  const success = await postCsv(apiBaseUrl, admin.id, successCsv);
  const successFactsAfter = await loadPaperFacts(successTitles);
  const successAuditAfter = await countImportAuditEvents(admin.id, startedAt);
  const successJobsAfter = await loadJobsByKey(successIdempotency);

  assertCondition(success.status === 201, "success apply status mismatch", {
    status: success.status,
    body: success.body,
  });
  assertCondition(success.job?.disposition === "EXECUTED", "success job disposition mismatch", {
    job: success.job,
  });
  assertCondition(success.summary?.createdAchievementsCount === 2, "success achievement count mismatch", {
    summary: success.summary,
  });
  assertCondition(success.summary?.createdPaperDetailsCount === 2, "success paper detail count mismatch", {
    summary: success.summary,
  });
  assertCondition(success.summary?.createdContributorsCount === 2, "success contributor count mismatch", {
    summary: success.summary,
  });
  assertCondition(successFactsBefore.achievementCount === 0, "success pre-existing achievement mismatch", {
    before: successFactsBefore,
  });
  assertCondition(successFactsAfter.achievementCount === 2, "success achievement delta mismatch", {
    after: successFactsAfter,
  });
  assertCondition(successFactsAfter.draftPaperCount === 2, "success draft paper count mismatch", {
    after: successFactsAfter,
  });
  assertCondition(successFactsAfter.paperDetailCount === 2, "success paper detail persisted mismatch", {
    after: successFactsAfter,
  });
  assertCondition(successFactsAfter.normalizedDoiPersistedCount === 2, "success normalized DOI persisted mismatch", {
    after: successFactsAfter,
  });
  assertCondition(successFactsAfter.contributorCount === 2, "success contributor persisted mismatch", {
    after: successFactsAfter,
  });
  assertCondition(successFactsAfter.stateChangeCount === 0, "success state transition side effect mismatch", {
    after: successFactsAfter,
  });
  assertCondition(successAuditAfter - successAuditBefore === 2, "success audit delta mismatch", {
    before: successAuditBefore,
    after: successAuditAfter,
  });
  assertCondition(successJobsBefore.length === 0 && successJobsAfter.length === 1, "success job count mismatch", {
    before: successJobsBefore.length,
    after: successJobsAfter.length,
  });
  const successJob = successJobsAfter[0];
  const successRun = successJob.runs[0];
  assertCondition(successJob.status === "SUCCESS", "success ImportJob status mismatch", {
    status: successJob.status,
  });
  assertCondition(successRun?.status === "SUCCESS", "success ImportRun status mismatch", {
    status: successRun?.status,
  });
  assertCondition(successJob.createdBusinessCount === 2, "success job business count mismatch", {
    createdBusinessCount: successJob.createdBusinessCount,
  });
  assertCondition(successJob.createdCompanionCount === 4, "success job companion count mismatch", {
    createdCompanionCount: successJob.createdCompanionCount,
  });
  assertCondition(successJob.auditCount === 2, "success job audit count mismatch", {
    auditCount: successJob.auditCount,
  });
  assertCondition(successRun?.applySummary?.createdAchievementsCount === 2, "success run achievement summary mismatch", {
    applySummary: successRun?.applySummary,
  });
  assertCondition(successRun?.applySummary?.createdPaperDetailsCount === 2, "success run paper summary mismatch", {
    applySummary: successRun?.applySummary,
  });
  assertCondition(successRun?.applySummary?.createdContributorsCount === 2, "success run contributor summary mismatch", {
    applySummary: successRun?.applySummary,
  });
  assertCondition(successRun?.auditLogIds?.length === 2, "success run audit ids mismatch", {
    auditLogIdsLength: successRun?.auditLogIds?.length ?? null,
  });

  const replayFactsBefore = await loadPaperFacts(successTitles);
  const replayAuditBefore = await countImportAuditEvents(admin.id, startedAt);
  const replay = await postCsv(apiBaseUrl, admin.id, successCsv);
  const replayFactsAfter = await loadPaperFacts(successTitles);
  const replayAuditAfter = await countImportAuditEvents(admin.id, startedAt);
  const successJobsAfterReplay = await loadJobsByKey(successIdempotency);

  assertCondition(replay.status === 201, "success replay status mismatch", {
    status: replay.status,
    body: replay.body,
  });
  assertCondition(replay.job?.disposition === "REPLAYED_SUCCESS", "success replay disposition mismatch", {
    job: replay.job,
  });
  assertCondition(replay.summary?.createdAchievementsCount === 2, "success replay achievement count mismatch", {
    summary: replay.summary,
  });
  assertCondition(replay.summary?.createdPaperDetailsCount === 2, "success replay paper detail count mismatch", {
    summary: replay.summary,
  });
  assertCondition(replay.summary?.createdContributorsCount === 2, "success replay contributor count mismatch", {
    summary: replay.summary,
  });
  assertCondition(replayFactsBefore.achievementCount === replayFactsAfter.achievementCount, "success replay created achievements", {
    before: replayFactsBefore,
    after: replayFactsAfter,
  });
  assertCondition(replayFactsBefore.paperDetailCount === replayFactsAfter.paperDetailCount, "success replay created paper details", {
    before: replayFactsBefore,
    after: replayFactsAfter,
  });
  assertCondition(replayFactsBefore.contributorCount === replayFactsAfter.contributorCount, "success replay created contributors", {
    before: replayFactsBefore,
    after: replayFactsAfter,
  });
  assertCondition(replayAuditBefore === replayAuditAfter, "success replay created audit rows", {
    before: replayAuditBefore,
    after: replayAuditAfter,
  });
  assertCondition(successJobsAfterReplay.length === 1, "success replay created extra job", {
    jobCount: successJobsAfterReplay.length,
  });
  assertCondition(successJobsAfterReplay[0].runs.length === 1, "success replay created extra run", {
    runCount: successJobsAfterReplay[0].runs.length,
  });

  const rejectedIdempotency = buildIdempotency({
    actorUserId: admin.id,
    actorDepartmentId: baseDepartment.id,
    csv: rejectedCsv,
  });
  const rejectedFactsBefore = await loadPaperFacts([titles.rejected]);
  const rejectedAuditBefore = await countImportAuditEvents(admin.id, startedAt);
  const rejected = await postCsv(apiBaseUrl, admin.id, rejectedCsv);
  const rejectedFactsAfter = await loadPaperFacts([titles.rejected]);
  const rejectedAuditAfter = await countImportAuditEvents(admin.id, startedAt);
  const rejectedJobsAfter = await loadJobsByKey(rejectedIdempotency);

  assertCondition(rejected.status === 400, "rejected apply status mismatch", {
    status: rejected.status,
    body: rejected.body,
  });
  assertCondition(rejected.errorCodes.includes("REQUIRED"), "rejected error code mismatch", {
    errorCodes: rejected.errorCodes,
  });
  assertCondition(rejectedFactsBefore.achievementCount === 0 && rejectedFactsAfter.achievementCount === 0, "rejected apply created achievements", {
    before: rejectedFactsBefore,
    after: rejectedFactsAfter,
  });
  assertCondition(rejectedAuditBefore === rejectedAuditAfter, "rejected apply created audit rows", {
    before: rejectedAuditBefore,
    after: rejectedAuditAfter,
  });
  assertCondition(rejectedJobsAfter.length === 1, "rejected job count mismatch", {
    jobCount: rejectedJobsAfter.length,
  });
  assertCondition(rejectedJobsAfter[0].status === "REJECTED", "rejected job status mismatch", {
    status: rejectedJobsAfter[0].status,
  });
  assertCondition(rejectedJobsAfter[0].runs[0]?.status === "REJECTED", "rejected run status mismatch", {
    status: rejectedJobsAfter[0].runs[0]?.status,
  });

  const rejectedReplay = await postCsv(apiBaseUrl, admin.id, rejectedCsv);
  const rejectedFactsAfterReplay = await loadPaperFacts([titles.rejected]);
  const rejectedAuditAfterReplay = await countImportAuditEvents(admin.id, startedAt);
  const rejectedJobsAfterReplay = await loadJobsByKey(rejectedIdempotency);

  assertCondition(rejectedReplay.status === 400, "rejected replay status mismatch", {
    status: rejectedReplay.status,
    body: rejectedReplay.body,
  });
  assertCondition(rejectedReplay.errorCodes.includes("REQUIRED"), "rejected replay error code mismatch", {
    errorCodes: rejectedReplay.errorCodes,
  });
  assertCondition(rejectedFactsAfterReplay.achievementCount === 0, "rejected replay created achievements", {
    after: rejectedFactsAfterReplay,
  });
  assertCondition(rejectedAuditAfterReplay === rejectedAuditAfter, "rejected replay created audit rows", {
    before: rejectedAuditAfter,
    after: rejectedAuditAfterReplay,
  });
  assertCondition(rejectedJobsAfterReplay.length === 1, "rejected replay created extra job", {
    jobCount: rejectedJobsAfterReplay.length,
  });
  assertCondition(rejectedJobsAfterReplay[0].runs.length === 1, "rejected replay created extra run", {
    runCount: rejectedJobsAfterReplay[0].runs.length,
  });

  const runningIdempotency = buildIdempotency({
    actorUserId: admin.id,
    actorDepartmentId: baseDepartment.id,
    csv: runningCsv,
  });
  const runningSeed = await createRunningJob({
    actorUserId: admin.id,
    csv: runningCsv,
    idempotency: runningIdempotency,
  });
  const runningFactsBefore = await loadPaperFacts([titles.running]);
  const runningAuditBefore = await countImportAuditEvents(admin.id, startedAt);
  const running = await postCsv(apiBaseUrl, admin.id, runningCsv);
  const runningFactsAfter = await loadPaperFacts([titles.running]);
  const runningAuditAfter = await countImportAuditEvents(admin.id, startedAt);
  const runningJobsAfter = await loadJobsByKey(runningIdempotency);

  assertCondition(running.status === 201, "running replay status mismatch", {
    status: running.status,
    body: running.body,
  });
  assertCondition(running.job?.disposition === "IMPORT_IN_PROGRESS", "running disposition mismatch", {
    job: running.job,
  });
  assertCondition(runningFactsBefore.achievementCount === 0 && runningFactsAfter.achievementCount === 0, "running claim created achievements", {
    before: runningFactsBefore,
    after: runningFactsAfter,
  });
  assertCondition(runningAuditBefore === runningAuditAfter, "running claim created audit rows", {
    before: runningAuditBefore,
    after: runningAuditAfter,
  });
  assertCondition(runningJobsAfter.length === 1, "running claim created extra job", {
    jobCount: runningJobsAfter.length,
  });
  assertCondition(runningJobsAfter[0].runs.length === 1, "running claim created extra run", {
    runCount: runningJobsAfter[0].runs.length,
  });
  assertCondition(running.job?.jobId === runningSeed.jobId, "running claim returned unexpected job id", {
    expected: runningSeed.jobId,
    actual: running.job?.jobId,
  });

  const sideEffectsAfter = await snapshotSideEffectCounts();
  assertEqualObject(sideEffectsAfter, sideEffectsBefore, "unexpected non-target side-effect delta");
  const nonPaperImportJobCount = await countNonPaperImportJobsSince(startedAt);
  assertCondition(nonPaperImportJobCount === 0, "non-PAPER import job was created", {
    nonPaperImportJobCount,
  });

  const forbiddenTokens = [
    successCsv,
    rejectedCsv,
    runningCsv,
    ...Object.values(titles),
    ...Object.values(abstracts),
    ...Object.values(names),
    ...Object.values(emails),
    ...Object.values(doiValues),
    ...Object.values(normalizedDoiValues),
    projectRoot,
  ];
  assertSafeSummary({
    label: "success",
    job: successJobsAfterReplay[0],
    forbiddenTokens,
  });
  assertSafeSummary({
    label: "rejected",
    job: rejectedJobsAfterReplay[0],
    forbiddenTokens,
  });
  assertSafeSummary({
    label: "running",
    job: runningJobsAfter[0],
    forbiddenTokens,
  });

  console.log(
    JSON.stringify(
      {
        step: "72G",
        scope: "local-production-like-api-db-only",
        productionVpcAcceptance: false,
        syntheticPrefix: "S72G_",
        tempApiHealthStatus: tempHealth.status,
        authHarness: "x-demo-user-id-without-credential-or-session",
        success: {
          status: success.status,
          disposition: success.job?.disposition,
          achievementCountBefore: successFactsBefore.achievementCount,
          achievementCountAfter: successFactsAfter.achievementCount,
          paperDetailCountAfter: successFactsAfter.paperDetailCount,
          contributorCountAfter: successFactsAfter.contributorCount,
          stateChangeCountAfter: successFactsAfter.stateChangeCount,
          auditOperationDelta: successAuditAfter - successAuditBefore,
          importJobStatus: successJobsAfterReplay[0].status,
          importRunStatus: successJobsAfterReplay[0].runs[0]?.status,
          createdAchievementsCount: successJobsAfterReplay[0].createdBusinessCount,
          createdCompanionCount: successJobsAfterReplay[0].createdCompanionCount,
          auditCount: successJobsAfterReplay[0].auditCount,
        },
        successReplay: {
          status: replay.status,
          disposition: replay.job?.disposition,
          achievementCountBefore: replayFactsBefore.achievementCount,
          achievementCountAfter: replayFactsAfter.achievementCount,
          paperDetailCountBefore: replayFactsBefore.paperDetailCount,
          paperDetailCountAfter: replayFactsAfter.paperDetailCount,
          contributorCountBefore: replayFactsBefore.contributorCount,
          contributorCountAfter: replayFactsAfter.contributorCount,
          auditOperationDelta: replayAuditAfter - replayAuditBefore,
          importJobCount: successJobsAfterReplay.length,
          importRunCount: successJobsAfterReplay[0].runs.length,
        },
        rejectedReplay: {
          firstStatus: rejected.status,
          replayStatus: rejectedReplay.status,
          errorCodes: rejectedReplay.errorCodes,
          achievementCountAfter: rejectedFactsAfterReplay.achievementCount,
          auditOperationDelta: rejectedAuditAfterReplay - rejectedAuditBefore,
          importJobStatus: rejectedJobsAfterReplay[0].status,
          importRunStatus: rejectedJobsAfterReplay[0].runs[0]?.status,
          importJobCount: rejectedJobsAfterReplay.length,
          importRunCount: rejectedJobsAfterReplay[0].runs.length,
        },
        runningClaim: {
          status: running.status,
          disposition: running.job?.disposition,
          achievementCountBefore: runningFactsBefore.achievementCount,
          achievementCountAfter: runningFactsAfter.achievementCount,
          auditOperationDelta: runningAuditAfter - runningAuditBefore,
          importJobCount: runningJobsAfter.length,
          importRunCount: runningJobsAfter[0].runs.length,
        },
        safeSummaryScan: "PASS",
        sideEffectBoundary: "PASS",
        nonPaperImportJobCountSinceStart: nonPaperImportJobCount,
      },
      null,
      2,
    ),
  );
} finally {
  if (app) {
    await app.close();
  }
  await prisma.$disconnect();
}
