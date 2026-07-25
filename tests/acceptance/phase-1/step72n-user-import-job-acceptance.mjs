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
  "user-account-import-job.repository.js",
);

if (!process.env.DATABASE_URL) {
  console.error(
    JSON.stringify({
      step: "72N",
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

  console.log("[step72n] Refreshing local API dist with project build script.");
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
    throw new Error("API build failed before Step 72N acceptance.");
  }
};

ensureCompiledApiDist();

const requireFromApi = createRequire(apiDistMain);
requireFromApi("reflect-metadata");
const { NestFactory } = requireFromApi("@nestjs/core");
const { AppModule } = requireFromApi("./app.module.js");

const prisma = new PrismaClient();
const suffix = Date.now().toString(36).toUpperCase();
const operation = "USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL";
const csvFileName = "step72n-user-accounts.csv";

const codes = {
  baseDepartment: `S72N_BASE_${suffix}`,
  importDepartment: `S72N_DEPT_${suffix}`,
  adminRole: `S72N_ADMIN_${suffix}`,
  importRole: `S72N_ROLE_${suffix}`,
};

const names = {
  baseDepartment: `S72N_BASE_NAME_${suffix}`,
  importDepartment: `S72N_DEPT_NAME_${suffix}`,
  admin: `S72N_ADMIN_NAME_${suffix}`,
  successA: `S72N_SUCCESS_NAME_A_${suffix}`,
  successB: `S72N_SUCCESS_NAME_B_${suffix}`,
  rejected: `S72N_REJECTED_NAME_${suffix}`,
  running: `S72N_RUNNING_NAME_${suffix}`,
};

const emails = {
  admin: `step72n-admin-${suffix.toLowerCase()}@example.invalid`,
  successA: `step72n-success-a-${suffix.toLowerCase()}@example.invalid`,
  successB: `step72n-success-b-${suffix.toLowerCase()}@example.invalid`,
  rejected: `step72n-rejected-${suffix.toLowerCase()}@example.invalid`,
  running: `step72n-running-${suffix.toLowerCase()}@example.invalid`,
};

const employeeValues = {
  successA: `S72N-EMP-${suffix}-A`,
  successB: `S72N-EMP-${suffix}-B`,
  rejected: `S72N-EMP-${suffix}-REJECTED`,
  running: `S72N-EMP-${suffix}-RUNNING`,
};

const normalizedEmployeeValues = Object.fromEntries(
  Object.entries(employeeValues).map(([key, value]) => [key, value.replace(/[^A-Za-z0-9]/g, "").toUpperCase()]),
);

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
  form.append("mode", "CREATE_ONLY_PENDING_NO_CREDENTIAL");
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
    body,
    summary: body?.summary ?? null,
    job: body?.job ?? null,
    errorCodes: uniqueCodes(body),
  };
};

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

const createUser = ({ email, name, departmentId, roleId = null, status = "ACTIVE" }) =>
  prisma.user.create({
    data: {
      email,
      name,
      departmentId,
      status,
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
    family: "USER_ACCOUNT",
    mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
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
        importFamily: "USER_ACCOUNT",
        mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
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

const countImportAuditEvents = async (actorUserId, since) => {
  const rows = await prisma.auditLog.findMany({
    where: {
      actorUserId,
      action: "CREATE",
      targetType: "USER",
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

const loadUserFacts = async (targetEmails) => {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: targetEmails,
      },
    },
    select: {
      id: true,
      status: true,
      employeeNoNormalized: true,
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
    employeeNoNormalizedPersistedCount: users.filter((user) => user.employeeNoNormalized).length,
    userRoleCount: users.reduce((count, user) => count + user.userRoles.length, 0),
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
    systemAdminRoleCount: users.reduce(
      (count, user) =>
        count + user.userRoles.filter((role) => role.role.code === "SYSTEM_ADMIN").length,
      0,
    ),
    credentialCount: users.filter((user) => user.credential).length,
    sessionCount: users.reduce((count, user) => count + user.sessions.length, 0),
    lifecycleTokenCount: users.reduce(
      (count, user) => count + user.accountLifecycleTokens.length,
      0,
    ),
    loginCapableCount: users.filter((user) => user.status === "ACTIVE" && user.credential).length,
  };
};

const snapshotSideEffectCounts = () =>
  Promise.all([
    prisma.userCredential.count(),
    prisma.userSession.count(),
    prisma.accountLifecycleToken.count(),
    prisma.resourceAccessGrant.count(),
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
    workflowInstance: counts[4],
    workflowTask: counts[5],
    workflowAction: counts[6],
    feeRecord: counts[7],
    feeReviewHistory: counts[8],
    reminderTask: counts[9],
    notification: counts[10],
    attachment: counts[11],
    searchLog: counts[12],
  }));

const countNonUserAccountImportJobsSince = (since) =>
  prisma.importJob.count({
    where: {
      importFamily: {
        not: "USER_ACCOUNT",
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
    /session|token|cookie|password|connection string|database_url|env|storage|mail payload|invite|reset|https?:\/\//i;
  assertCondition(!unsafeTermPattern.test(safePayload), `${label} summary leaked unsafe term`, {
    matched: safePayload.match(unsafeTermPattern)?.[0] ?? null,
  });

  const credentialMatches = safePayload.match(/credential/gi) ?? [];
  assertCondition(
    credentialMatches.length === 0 || safePayload.includes('"credentialMode":"NO_CREDENTIAL"'),
    `${label} summary leaked credential term outside allowed no-credential flag`,
  );
};

const successCsv = [
  "email,displayName,employeeNo,departmentCode,roleCode,scopeType,scopeDepartmentCode,status",
  [
    emails.successA,
    names.successA,
    employeeValues.successA,
    codes.importDepartment,
    codes.importRole,
    "DEPARTMENT",
    codes.importDepartment,
    "PENDING_ACTIVATION",
  ].join(","),
  [
    emails.successB,
    names.successB,
    employeeValues.successB,
    codes.importDepartment,
    codes.importRole,
    "DEPARTMENT",
    codes.importDepartment,
    "PENDING_ACTIVATION",
  ].join(","),
].join("\n");

const rejectedCsv = [
  "email,displayName,employeeNo,departmentCode,roleCode,scopeType,scopeDepartmentCode,status",
  [
    emails.rejected,
    names.rejected,
    employeeValues.rejected,
    codes.importDepartment,
    codes.importRole,
    "DEPARTMENT",
    codes.importDepartment,
    "PENDING_ACTIVATION",
  ].join(","),
].join("\n");

const runningCsv = [
  "email,displayName,employeeNo,departmentCode,roleCode,scopeType,scopeDepartmentCode,status",
  [
    emails.running,
    names.running,
    employeeValues.running,
    codes.importDepartment,
    codes.importRole,
    "DEPARTMENT",
    codes.importDepartment,
    "PENDING_ACTIVATION",
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
  await createRole(codes.importRole);
  const admin = await createUser({
    email: emails.admin,
    name: names.admin,
    roleId: adminRole.id,
    departmentId: baseDepartment.id,
  });
  await createUser({
    email: emails.rejected,
    name: names.rejected,
    departmentId: importDepartment.id,
    status: "PENDING_ACTIVATION",
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

  const successEmails = [emails.successA, emails.successB];
  const successIdempotency = buildIdempotency({
    actorUserId: admin.id,
    actorDepartmentId: baseDepartment.id,
    csv: successCsv,
  });
  const successFactsBefore = await loadUserFacts(successEmails);
  const successAuditBefore = await countImportAuditEvents(admin.id, startedAt);
  const successJobsBefore = await loadJobsByKey(successIdempotency);
  const success = await postCsv(apiBaseUrl, admin.id, successCsv);
  const successFactsAfter = await loadUserFacts(successEmails);
  const successAuditAfter = await countImportAuditEvents(admin.id, startedAt);
  const successJobsAfter = await loadJobsByKey(successIdempotency);

  assertCondition(success.status === 201, "success apply status mismatch", {
    status: success.status,
    body: success.body,
  });
  assertCondition(success.job?.disposition === "EXECUTED", "success job disposition mismatch", {
    job: success.job,
  });
  assertCondition(success.summary?.createdUsersCount === 2, "success created users count mismatch", {
    summary: success.summary,
  });
  assertCondition(success.summary?.createdRolesCount === 2, "success created roles count mismatch", {
    summary: success.summary,
  });
  assertCondition(successFactsBefore.userCount === 0, "success pre-existing user mismatch", {
    before: successFactsBefore,
  });
  assertCondition(successFactsAfter.userCount === 2, "success user delta mismatch", {
    after: successFactsAfter,
  });
  assertCondition(successFactsAfter.pendingActivationCount === 2, "success pending users mismatch", {
    after: successFactsAfter,
  });
  assertCondition(successFactsAfter.userRoleCount === 2, "success user role count mismatch", {
    after: successFactsAfter,
  });
  assertCondition(successFactsAfter.departmentScopedRoleCount === 2, "success department scoped role mismatch", {
    after: successFactsAfter,
  });
  assertCondition(successFactsAfter.systemAdminRoleCount === 0, "success system admin role was assigned", {
    after: successFactsAfter,
  });
  assertCondition(
    successFactsAfter.employeeNoNormalizedPersistedCount === 2,
    "success employeeNo normalized persisted mismatch",
    { after: successFactsAfter },
  );
  assertCondition(successFactsAfter.credentialCount === 0, "success created credential", {
    after: successFactsAfter,
  });
  assertCondition(successFactsAfter.sessionCount === 0, "success created session", {
    after: successFactsAfter,
  });
  assertCondition(successFactsAfter.lifecycleTokenCount === 0, "success created lifecycle token", {
    after: successFactsAfter,
  });
  assertCondition(successFactsAfter.loginCapableCount === 0, "success created login-capable state", {
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
  assertCondition(successJob.createdCompanionCount === 2, "success job companion count mismatch", {
    createdCompanionCount: successJob.createdCompanionCount,
  });
  assertCondition(successJob.auditCount === 2, "success job audit count mismatch", {
    auditCount: successJob.auditCount,
  });
  assertCondition(successRun?.applySummary?.createdUsersCount === 2, "success run user summary mismatch", {
    applySummary: successRun?.applySummary,
  });
  assertCondition(successRun?.applySummary?.createdUserRolesCount === 2, "success run role summary mismatch", {
    applySummary: successRun?.applySummary,
  });
  assertCondition(successRun?.applySummary?.credentialMode === "NO_CREDENTIAL", "success credential mode mismatch", {
    applySummary: successRun?.applySummary,
  });
  assertCondition(successRun?.applySummary?.targetStatus === "PENDING_ACTIVATION", "success target status mismatch", {
    applySummary: successRun?.applySummary,
  });
  assertCondition(successRun?.applySummary?.roleScope === "DEPARTMENT", "success role scope mismatch", {
    applySummary: successRun?.applySummary,
  });
  assertCondition(successRun?.auditLogIds?.length === 2, "success run audit ids mismatch", {
    auditLogIdsLength: successRun?.auditLogIds?.length ?? null,
  });

  const replayFactsBefore = await loadUserFacts(successEmails);
  const replayAuditBefore = await countImportAuditEvents(admin.id, startedAt);
  const replay = await postCsv(apiBaseUrl, admin.id, successCsv);
  const replayFactsAfter = await loadUserFacts(successEmails);
  const replayAuditAfter = await countImportAuditEvents(admin.id, startedAt);
  const successJobsAfterReplay = await loadJobsByKey(successIdempotency);

  assertCondition(replay.status === 201, "success replay status mismatch", {
    status: replay.status,
    body: replay.body,
  });
  assertCondition(replay.job?.disposition === "REPLAYED_SUCCESS", "success replay disposition mismatch", {
    job: replay.job,
  });
  assertCondition(replay.summary?.createdUsersCount === 2, "success replay created users count mismatch", {
    summary: replay.summary,
  });
  assertCondition(replay.summary?.createdRolesCount === 2, "success replay created roles count mismatch", {
    summary: replay.summary,
  });
  assertEqualObject(replayFactsAfter, replayFactsBefore, "success replay created user-side rows");
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
  const rejectedFactsBefore = await loadUserFacts([emails.rejected]);
  const rejectedAuditBefore = await countImportAuditEvents(admin.id, startedAt);
  const rejected = await postCsv(apiBaseUrl, admin.id, rejectedCsv);
  const rejectedFactsAfter = await loadUserFacts([emails.rejected]);
  const rejectedAuditAfter = await countImportAuditEvents(admin.id, startedAt);
  const rejectedJobsAfter = await loadJobsByKey(rejectedIdempotency);

  assertCondition(rejected.status === 400, "rejected apply status mismatch", {
    status: rejected.status,
    body: rejected.body,
  });
  assertCondition(rejected.errorCodes.includes("EXISTING_USER"), "rejected error code mismatch", {
    errorCodes: rejected.errorCodes,
  });
  assertEqualObject(rejectedFactsAfter, rejectedFactsBefore, "rejected apply created user-side rows");
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
  const rejectedFactsAfterReplay = await loadUserFacts([emails.rejected]);
  const rejectedAuditAfterReplay = await countImportAuditEvents(admin.id, startedAt);
  const rejectedJobsAfterReplay = await loadJobsByKey(rejectedIdempotency);

  assertCondition(rejectedReplay.status === 400, "rejected replay status mismatch", {
    status: rejectedReplay.status,
    body: rejectedReplay.body,
  });
  assertCondition(rejectedReplay.errorCodes.includes("EXISTING_USER"), "rejected replay error code mismatch", {
    errorCodes: rejectedReplay.errorCodes,
  });
  assertEqualObject(rejectedFactsAfterReplay, rejectedFactsAfter, "rejected replay created user-side rows");
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
  const runningFactsBefore = await loadUserFacts([emails.running]);
  const runningAuditBefore = await countImportAuditEvents(admin.id, startedAt);
  const running = await postCsv(apiBaseUrl, admin.id, runningCsv);
  const runningFactsAfter = await loadUserFacts([emails.running]);
  const runningAuditAfter = await countImportAuditEvents(admin.id, startedAt);
  const runningJobsAfter = await loadJobsByKey(runningIdempotency);

  assertCondition(running.status === 201, "running replay status mismatch", {
    status: running.status,
    body: running.body,
  });
  assertCondition(running.job?.disposition === "IMPORT_IN_PROGRESS", "running disposition mismatch", {
    job: running.job,
  });
  assertEqualObject(runningFactsAfter, runningFactsBefore, "running claim created user-side rows");
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
  const nonUserAccountImportJobCount = await countNonUserAccountImportJobsSince(startedAt);
  assertCondition(nonUserAccountImportJobCount === 0, "non-user-account import job was created", {
    nonUserAccountImportJobCount,
  });

  const forbiddenTokens = [
    successCsv,
    rejectedCsv,
    runningCsv,
    ...Object.values(names),
    ...Object.values(emails),
    ...Object.values(employeeValues),
    ...Object.values(normalizedEmployeeValues),
    codes.importDepartment,
    codes.importRole,
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
        step: "72N",
        scope: "local-production-like-api-db-only",
        productionVpcAcceptance: false,
        productionSessionCookieFullAcceptance: false,
        syntheticPrefix: "S72N_",
        tempApiHealthStatus: tempHealth.status,
        authHarness: "x-demo-user-id-without-credential-or-session",
        success: {
          status: success.status,
          disposition: success.job?.disposition,
          userCountBefore: successFactsBefore.userCount,
          userCountAfter: successFactsAfter.userCount,
          pendingActivationCountAfter: successFactsAfter.pendingActivationCount,
          departmentScopedRoleCountAfter: successFactsAfter.departmentScopedRoleCount,
          systemAdminRoleCountAfter: successFactsAfter.systemAdminRoleCount,
          auditOperationDelta: successAuditAfter - successAuditBefore,
          importJobStatus: successJobsAfterReplay[0].status,
          importRunStatus: successJobsAfterReplay[0].runs[0]?.status,
          createdUsersCount: successJobsAfterReplay[0].createdBusinessCount,
          createdUserRolesCount: successJobsAfterReplay[0].createdCompanionCount,
          auditCount: successJobsAfterReplay[0].auditCount,
        },
        successReplay: {
          status: replay.status,
          disposition: replay.job?.disposition,
          userCountBefore: replayFactsBefore.userCount,
          userCountAfter: replayFactsAfter.userCount,
          userRoleCountBefore: replayFactsBefore.userRoleCount,
          userRoleCountAfter: replayFactsAfter.userRoleCount,
          auditOperationDelta: replayAuditAfter - replayAuditBefore,
          importJobCount: successJobsAfterReplay.length,
          importRunCount: successJobsAfterReplay[0].runs.length,
        },
        rejectedReplay: {
          firstStatus: rejected.status,
          replayStatus: rejectedReplay.status,
          firstErrorCodes: rejected.errorCodes,
          replayErrorCodes: rejectedReplay.errorCodes,
          userCountAfter: rejectedFactsAfterReplay.userCount,
          userRoleCountAfter: rejectedFactsAfterReplay.userRoleCount,
          auditDeltaAfterReplay: rejectedAuditAfterReplay - rejectedAuditBefore,
          importJobStatus: rejectedJobsAfterReplay[0].status,
          importRunStatus: rejectedJobsAfterReplay[0].runs[0]?.status,
          importJobCount: rejectedJobsAfterReplay.length,
          importRunCount: rejectedJobsAfterReplay[0].runs.length,
        },
        runningInFlight: {
          status: running.status,
          disposition: running.job?.disposition,
          userCountAfter: runningFactsAfter.userCount,
          userRoleCountAfter: runningFactsAfter.userRoleCount,
          auditOperationDelta: runningAuditAfter - runningAuditBefore,
          importJobStatus: runningJobsAfter[0].status,
          importRunStatus: runningJobsAfter[0].runs[0]?.status,
          importJobCount: runningJobsAfter.length,
          importRunCount: runningJobsAfter[0].runs.length,
        },
        noCredentialSessionLifecycleEmailBoundary: {
          targetCredentialCount: successFactsAfter.credentialCount,
          targetSessionCount: successFactsAfter.sessionCount,
          targetLifecycleTokenCount: successFactsAfter.lifecycleTokenCount,
          targetLoginCapableCount: successFactsAfter.loginCapableCount,
          userCredentialDelta: sideEffectsAfter.userCredential - sideEffectsBefore.userCredential,
          userSessionDelta: sideEffectsAfter.userSession - sideEffectsBefore.userSession,
          accountLifecycleTokenDelta:
            sideEffectsAfter.accountLifecycleToken - sideEffectsBefore.accountLifecycleToken,
          notificationDelta: sideEffectsAfter.notification - sideEffectsBefore.notification,
          mailDeliveryEvidenceDelta: 0,
        },
        sideEffectBoundary: {
          nonUserAccountImportJobCount,
          resourceAccessGrantDelta:
            sideEffectsAfter.resourceAccessGrant - sideEffectsBefore.resourceAccessGrant,
          workflowInstanceDelta:
            sideEffectsAfter.workflowInstance - sideEffectsBefore.workflowInstance,
          workflowTaskDelta: sideEffectsAfter.workflowTask - sideEffectsBefore.workflowTask,
          workflowActionDelta: sideEffectsAfter.workflowAction - sideEffectsBefore.workflowAction,
          feeRecordDelta: sideEffectsAfter.feeRecord - sideEffectsBefore.feeRecord,
          feeReviewHistoryDelta:
            sideEffectsAfter.feeReviewHistory - sideEffectsBefore.feeReviewHistory,
          reminderTaskDelta: sideEffectsAfter.reminderTask - sideEffectsBefore.reminderTask,
          attachmentDelta: sideEffectsAfter.attachment - sideEffectsBefore.attachment,
          searchLogDelta: sideEffectsAfter.searchLog - sideEffectsBefore.searchLog,
        },
        safeSummaryScan: "PASS",
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(
    JSON.stringify(
      {
        step: "72N",
        status: "FAILED",
        message: error instanceof Error ? error.message : String(error),
        productionVpcAcceptance: false,
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  if (app) {
    await app.close();
  }
  await prisma.$disconnect();
}
