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
  "department-import-job.repository.js",
);

if (!process.env.DATABASE_URL) {
  console.error(
    JSON.stringify({
      step: "72E",
      status: "BLOCKED",
      reason: "DATABASE_URL_NOT_SET",
      message:
        "Set DATABASE_URL in the current process to a local non-production database before running this acceptance helper.",
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

  console.log("[step72e] Refreshing local API dist with project build script.");
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
    throw new Error("API build failed before Step 72E acceptance.");
  }
};

ensureCompiledApiDist();

const requireFromApi = createRequire(apiDistMain);
requireFromApi("reflect-metadata");
const { NestFactory } = requireFromApi("@nestjs/core");
const { AppModule } = requireFromApi("./app.module.js");

const prisma = new PrismaClient();
const suffix = Date.now().toString(36).toUpperCase();
const operation = "DEPARTMENT_IMPORT_CREATE";
const csvFileName = "step72e-departments.csv";

const codes = {
  baseDepartment: `S72E_BASE_${suffix}`,
  successParent: `S72E_SUCCESS_PARENT_${suffix}`,
  successChild: `S72E_SUCCESS_CHILD_${suffix}`,
  rejectedExisting: `S72E_REJECT_EXISTING_${suffix}`,
  rejectedNew: `S72E_REJECT_NEW_${suffix}`,
  running: `S72E_RUNNING_${suffix}`,
  adminRole: `S72E_ADMIN_${suffix}`,
};

const names = {
  baseDepartment: `S72E_BASE_NAME_${suffix}`,
  successParent: `S72E_SUCCESS_PARENT_NAME_${suffix}`,
  successChild: `S72E_SUCCESS_CHILD_NAME_${suffix}`,
  rejectedExisting: `S72E_REJECT_EXISTING_NAME_${suffix}`,
  rejectedNew: `S72E_REJECT_NEW_NAME_${suffix}`,
  running: `S72E_RUNNING_NAME_${suffix}`,
};

const adminEmail = `step72e-admin-${suffix.toLowerCase()}@example.invalid`;

const assertCondition = (condition, message, details = {}) => {
  if (!condition) {
    throw new Error(JSON.stringify({ message, details }));
  }
};

const sha256Hex = (value) => createHash("sha256").update(value).digest("hex");

const createCsvBlob = (csv) => new Blob([csv], { type: "text/csv" });

const uniqueCodes = (body) =>
  Array.isArray(body?.errors)
    ? [...new Set(body.errors.map((error) => error.code).filter(Boolean))]
    : [];

const postCsv = async (apiBaseUrl, actorUserId, csv) => {
  const form = new FormData();
  form.append("mode", "CREATE_ONLY");
  form.append("file", createCsvBlob(csv), csvFileName);

  const response = await fetch(`${apiBaseUrl}/imports/departments/apply`, {
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

  return rows.filter((row) => row.newValue?.operation === operation).length;
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

const createActorUser = ({ email, roleId, departmentId }) =>
  prisma.user.create({
    data: {
      email,
      name: `S72E_ADMIN_NAME_${suffix}`,
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
    family: "DEPARTMENT",
    mode: "CREATE_ONLY",
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
        importFamily: "DEPARTMENT",
        mode: "CREATE_ONLY",
        achievementType: null,
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

const snapshotSideEffectCounts = () =>
  Promise.all([
    prisma.user.count(),
    prisma.userCredential.count(),
    prisma.userSession.count(),
    prisma.accountLifecycleToken.count(),
    prisma.userRole.count(),
    prisma.resourceAccessGrant.count(),
    prisma.achievement.count(),
    prisma.achievementContributor.count(),
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
    user: counts[0],
    userCredential: counts[1],
    userSession: counts[2],
    accountLifecycleToken: counts[3],
    userRole: counts[4],
    resourceAccessGrant: counts[5],
    achievement: counts[6],
    achievementContributor: counts[7],
    workflowInstance: counts[8],
    workflowTask: counts[9],
    workflowAction: counts[10],
    feeRecord: counts[11],
    feeReviewHistory: counts[12],
    reminderTask: counts[13],
    notification: counts[14],
    attachment: counts[15],
    searchLog: counts[16],
  }));

const assertEqualObject = (actual, expected, message) => {
  assertCondition(JSON.stringify(actual) === JSON.stringify(expected), message, {
    actual,
    expected,
  });
};

const assertSafeSummary = ({ label, job, forbiddenTokens }) => {
  const runs = job.runs ?? [];
  const safePayload = JSON.stringify({
    jobSafeSummary: job.safeSummary,
    jobSafeErrorCodes: job.safeErrorCodes,
    runValidationSummaries: runs.map((run) => run.validationSummary),
    runApplySummaries: runs.map((run) => run.applySummary),
    runAuditLogIds: runs.map((run) => run.auditLogIds),
  });

  for (const token of forbiddenTokens) {
    assertCondition(!safePayload.includes(token), `${label} summary leaked forbidden token`, {
      token,
    });
  }

  const unsafeTermPattern =
    /credential|session|token|cookie|password|connection string|database_url|env|storage|mail payload|127\.0\.0\.1|https?:\/\//i;
  assertCondition(!unsafeTermPattern.test(safePayload), `${label} summary leaked unsafe term`, {
    matched: safePayload.match(unsafeTermPattern)?.[0] ?? null,
  });
};

const successCsv = [
  "code,name,parentCode",
  `${codes.successChild},${names.successChild},${codes.successParent}`,
  `${codes.successParent},${names.successParent},`,
].join("\n");

const rejectedCsv = [
  "code,name,parentCode",
  `${codes.rejectedExisting},${names.rejectedExisting},`,
  `${codes.rejectedNew},${names.rejectedNew},`,
].join("\n");

const runningCsv = ["code,name", `${codes.running},${names.running}`].join("\n");

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
  await prisma.department.create({
    data: {
      code: codes.rejectedExisting,
      name: names.rejectedExisting,
    },
  });
  const adminRole = await createRole(codes.adminRole, permission.id);
  const admin = await createActorUser({
    email: adminEmail,
    roleId: adminRole.id,
    departmentId: baseDepartment.id,
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
  const successCodes = [codes.successParent, codes.successChild];
  const successIdempotency = buildIdempotency({
    actorUserId: admin.id,
    actorDepartmentId: baseDepartment.id,
    csv: successCsv,
  });
  const successDepartmentsBefore = await countDepartments(successCodes);
  const successAuditBefore = await countImportAuditEvents(admin.id, startedAt);
  const successJobsBefore = await loadJobsByKey(successIdempotency);
  const success = await postCsv(apiBaseUrl, admin.id, successCsv);
  const successDepartmentsAfter = await countDepartments(successCodes);
  const successAuditAfter = await countImportAuditEvents(admin.id, startedAt);
  const successJobsAfter = await loadJobsByKey(successIdempotency);

  assertCondition(success.status === 201, "success apply status mismatch", {
    status: success.status,
    body: success.body,
  });
  assertCondition(success.job?.disposition === "EXECUTED", "success job disposition mismatch", {
    job: success.job,
  });
  assertCondition(success.summary?.createdRows === 2, "success created row count mismatch", {
    summary: success.summary,
  });
  assertCondition(successDepartmentsBefore === 0 && successDepartmentsAfter === 2, "success department delta mismatch", {
    before: successDepartmentsBefore,
    after: successDepartmentsAfter,
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
  assertCondition(successJob.auditCount === 2, "success job audit count mismatch", {
    auditCount: successJob.auditCount,
  });
  assertCondition(successRun?.applySummary?.createdDepartmentsCount === 2, "success run summary count mismatch", {
    applySummary: successRun?.applySummary,
  });
  assertCondition(successRun?.auditLogIds?.length === 2, "success run audit ids mismatch", {
    auditLogIdsLength: successRun?.auditLogIds?.length ?? null,
  });

  const replayDepartmentsBefore = await countDepartments(successCodes);
  const replayAuditBefore = await countImportAuditEvents(admin.id, startedAt);
  const replay = await postCsv(apiBaseUrl, admin.id, successCsv);
  const replayDepartmentsAfter = await countDepartments(successCodes);
  const replayAuditAfter = await countImportAuditEvents(admin.id, startedAt);
  const successJobsAfterReplay = await loadJobsByKey(successIdempotency);

  assertCondition(replay.status === 201, "success replay status mismatch", {
    status: replay.status,
    body: replay.body,
  });
  assertCondition(replay.job?.disposition === "REPLAYED_SUCCESS", "success replay disposition mismatch", {
    job: replay.job,
  });
  assertCondition(replay.summary?.createdRows === 2, "success replay safe count mismatch", {
    summary: replay.summary,
  });
  assertCondition(replayDepartmentsBefore === replayDepartmentsAfter, "success replay created departments", {
    before: replayDepartmentsBefore,
    after: replayDepartmentsAfter,
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
  const rejectedNewBefore = await countDepartments([codes.rejectedNew]);
  const rejectedAuditBefore = await countImportAuditEvents(admin.id, startedAt);
  const rejected = await postCsv(apiBaseUrl, admin.id, rejectedCsv);
  const rejectedNewAfter = await countDepartments([codes.rejectedNew]);
  const rejectedAuditAfter = await countImportAuditEvents(admin.id, startedAt);
  const rejectedJobsAfter = await loadJobsByKey(rejectedIdempotency);

  assertCondition(rejected.status === 400, "rejected apply status mismatch", {
    status: rejected.status,
    body: rejected.body,
  });
  assertCondition(rejected.errorCodes.includes("EXISTING_CODE"), "rejected error code mismatch", {
    errorCodes: rejected.errorCodes,
  });
  assertCondition(rejectedNewBefore === 0 && rejectedNewAfter === 0, "rejected apply created partial department", {
    before: rejectedNewBefore,
    after: rejectedNewAfter,
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
  const rejectedNewAfterReplay = await countDepartments([codes.rejectedNew]);
  const rejectedAuditAfterReplay = await countImportAuditEvents(admin.id, startedAt);
  const rejectedJobsAfterReplay = await loadJobsByKey(rejectedIdempotency);

  assertCondition(rejectedReplay.status === 400, "rejected replay status mismatch", {
    status: rejectedReplay.status,
    body: rejectedReplay.body,
  });
  assertCondition(rejectedReplay.errorCodes.includes("EXISTING_CODE"), "rejected replay error code mismatch", {
    errorCodes: rejectedReplay.errorCodes,
  });
  assertCondition(rejectedNewAfterReplay === 0, "rejected replay created partial department", {
    after: rejectedNewAfterReplay,
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
  const runningBefore = await countDepartments([codes.running]);
  const runningAuditBefore = await countImportAuditEvents(admin.id, startedAt);
  const running = await postCsv(apiBaseUrl, admin.id, runningCsv);
  const runningAfter = await countDepartments([codes.running]);
  const runningAuditAfter = await countImportAuditEvents(admin.id, startedAt);
  const runningJobsAfter = await loadJobsByKey(runningIdempotency);

  assertCondition(running.status === 201, "running replay status mismatch", {
    status: running.status,
    body: running.body,
  });
  assertCondition(running.job?.disposition === "IMPORT_IN_PROGRESS", "running disposition mismatch", {
    job: running.job,
  });
  assertCondition(runningBefore === 0 && runningAfter === 0, "running claim created department", {
    before: runningBefore,
    after: runningAfter,
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
  assertEqualObject(sideEffectsAfter, sideEffectsBefore, "unexpected non-department/import side-effect delta");

  const forbiddenTokens = [
    successCsv,
    rejectedCsv,
    runningCsv,
    ...Object.values(names),
    ...Object.values(codes),
    adminEmail,
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
        step: "72E",
        scope: "local-production-like-api-db-only",
        productionVpcAcceptance: false,
        syntheticPrefix: "S72E_",
        tempApiHealthStatus: tempHealth.status,
        authHarness: "x-demo-user-id-without-credential-or-session",
        success: {
          status: success.status,
          disposition: success.job?.disposition,
          departmentCountBefore: successDepartmentsBefore,
          departmentCountAfter: successDepartmentsAfter,
          auditOperationDelta: successAuditAfter - successAuditBefore,
          importJobStatus: successJobsAfterReplay[0].status,
          importRunStatus: successJobsAfterReplay[0].runs[0]?.status,
          createdDepartmentsCount: successJobsAfterReplay[0].createdBusinessCount,
          auditCount: successJobsAfterReplay[0].auditCount,
        },
        successReplay: {
          status: replay.status,
          disposition: replay.job?.disposition,
          departmentCountBefore: replayDepartmentsBefore,
          departmentCountAfter: replayDepartmentsAfter,
          auditOperationDelta: replayAuditAfter - replayAuditBefore,
          importJobCount: successJobsAfterReplay.length,
          importRunCount: successJobsAfterReplay[0].runs.length,
        },
        rejectedReplay: {
          firstStatus: rejected.status,
          replayStatus: rejectedReplay.status,
          errorCodes: rejectedReplay.errorCodes,
          newDepartmentCountAfter: rejectedNewAfterReplay,
          importJobStatus: rejectedJobsAfterReplay[0].status,
          importRunStatus: rejectedJobsAfterReplay[0].runs[0]?.status,
          importJobCount: rejectedJobsAfterReplay.length,
          importRunCount: rejectedJobsAfterReplay[0].runs.length,
        },
        runningClaim: {
          status: running.status,
          disposition: running.job?.disposition,
          departmentCountBefore: runningBefore,
          departmentCountAfter: runningAfter,
          auditOperationDelta: runningAuditAfter - runningAuditBefore,
          importJobCount: runningJobsAfter.length,
          importRunCount: runningJobsAfter[0].runs.length,
        },
        safeSummaryScan: "PASS",
        sideEffectBoundary: "PASS",
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
