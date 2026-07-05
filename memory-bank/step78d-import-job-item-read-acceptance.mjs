import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

process.env.NODE_ENV = "staging";

const step = "78D";
const syntheticPrefix = "S78D_";
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiDistMain = path.join(projectRoot, "apps", "api", "dist", "main.js");
const requiredDistFiles = [
  apiDistMain,
  path.join(projectRoot, "apps", "api", "dist", "app.module.js"),
  path.join(
    projectRoot,
    "apps",
    "api",
    "dist",
    "imports",
    "import-job-history-read.controller.js",
  ),
  path.join(
    projectRoot,
    "apps",
    "api",
    "dist",
    "imports",
    "import-job-history-read.service.js",
  ),
  path.join(
    projectRoot,
    "apps",
    "api",
    "dist",
    "imports",
    "import-job-history-read.repository.js",
  ),
];

if (!process.env.DATABASE_URL) {
  console.error(
    JSON.stringify({
      step,
      status: "BLOCKED",
      reason: "DATABASE_URL_NOT_SET",
      message:
        "Run this helper in a local API container or with a current-shell local non-production DATABASE_URL.",
      productionVpcAcceptance: false,
    }),
  );
  process.exit(1);
}

const ensureCompiledApiDist = () => {
  if (requiredDistFiles.every((filePath) => existsSync(filePath))) {
    return;
  }

  console.log("[step78d] Refreshing local API dist with project build script.");
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
    throw new Error("API build failed before Step 78D acceptance.");
  }
};

ensureCompiledApiDist();

const requireFromApi = createRequire(apiDistMain);
requireFromApi("reflect-metadata");
const { NestFactory } = requireFromApi("@nestjs/core");
const { AppModule } = requireFromApi("./app.module.js");

const prisma = new PrismaClient();
const suffix = Date.now().toString(36).toUpperCase();
const startedAt = new Date();

const codes = {
  department: `${syntheticPrefix}DEPT_${suffix}`,
  systemRole: `${syntheticPrefix}SYSTEM_ROLE_${suffix}`,
  limitedRole: `${syntheticPrefix}LIMITED_ROLE_${suffix}`,
};

const safeCodes = {
  applied: `${syntheticPrefix}APPLIED`,
  blocked: `${syntheticPrefix}BLOCKED`,
  skipped: `${syntheticPrefix}SKIPPED`,
  secondRun: `${syntheticPrefix}SECOND_RUN`,
};

const forbiddenKeys = [
  "targetId",
  "jobId",
  "runId",
  "rawCsv",
  "rowValues",
  "email",
  "employeeNo",
  "name",
  "departmentCode",
  "role",
  "title",
  "doi",
  "registrationNumber",
  "patentNumber",
  "contributors",
  "credentials",
  "invite",
  "password",
  "token",
  "cookie",
  "connectionString",
  "safeSummary",
  "auditLogIds",
  "idempotencyKeyHash",
  "scopeHash",
  "fileFingerprint",
  "requestFingerprint",
  "operatorUserId",
];

const allowedTopLevelKeys = ["items", "page", "pageSize", "total"];
const allowedItemKeys = [
  "plannedAction",
  "rowNumber",
  "safeCode",
  "status",
  "targetType",
];

const assertCondition = (condition, message, details = {}) => {
  if (!condition) {
    throw new Error(JSON.stringify({ message, details }));
  }
};

const createBlockedError = (reason, message) => {
  const error = new Error(message);
  error.step78dBlockedReason = reason;
  return error;
};

const safeHash = (value) => createHash("sha256").update(value).digest("hex");

const getJson = async (apiBaseUrl, actorUserId, pathName, query = {}) => {
  const url = new URL(`${apiBaseUrl}${pathName}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const headers = actorUserId ? { "x-demo-user-id": actorUserId } : {};
  const response = await fetch(url, { headers });
  const body = await response.json().catch(() => ({}));

  return {
    status: response.status,
    body,
  };
};

const assertAllowedResponseShape = (label, response) => {
  assertCondition(response.status === 200, `${label} did not return HTTP 200`, {
    status: response.status,
  });

  const topLevelKeys = Object.keys(response.body).sort();
  assertCondition(
    JSON.stringify(topLevelKeys) === JSON.stringify(allowedTopLevelKeys),
    `${label} top-level keys are not allowlisted`,
    { topLevelKeys },
  );

  assertCondition(Array.isArray(response.body.items), `${label} items is not an array`);
  for (const item of response.body.items) {
    const itemKeys = Object.keys(item).sort();
    assertCondition(
      JSON.stringify(itemKeys) === JSON.stringify(allowedItemKeys),
      `${label} item keys are not allowlisted`,
      { itemKeys },
    );
  }

  assertForbiddenKeysAbsent(label, response.body);
};

const assertForbiddenKeysAbsent = (label, value) => {
  const found = [];
  const visit = (node) => {
    if (Array.isArray(node)) {
      for (const item of node) {
        visit(item);
      }
      return;
    }

    if (!node || typeof node !== "object") {
      return;
    }

    for (const [key, item] of Object.entries(node)) {
      if (forbiddenKeys.includes(key)) {
        found.push(key);
      }
      visit(item);
    }
  };

  visit(value);
  assertCondition(found.length === 0, `${label} response contained forbidden keys`, {
    found,
  });
};

const assertRowNumbersNondecreasing = (items) => {
  for (let index = 1; index < items.length; index += 1) {
    assertCondition(
      items[index - 1].rowNumber <= items[index].rowNumber,
      "items are not ordered by nondecreasing rowNumber",
      {
        previous: items[index - 1].rowNumber,
        current: items[index].rowNumber,
      },
    );
  }
};

const ensurePermission = () =>
  prisma.permission.upsert({
    where: { code: "system:config" },
    update: {},
    create: {
      code: "system:config",
      resource: "system",
      action: "config",
      name: `${syntheticPrefix}system config`,
      status: "ACTIVE",
    },
  });

const createSyntheticUser = async ({ departmentId, roleCode, permissionId }) => {
  const role = await prisma.role.create({
    data: {
      code: roleCode,
      name: `${roleCode}_NAME`,
      status: "ACTIVE",
      ...(permissionId
        ? {
            rolePermissions: {
              create: {
                permissionId,
              },
            },
          }
        : {}),
    },
  });

  const user = await prisma.user.create({
    data: {
      email: `${roleCode.toLowerCase()}-${suffix.toLowerCase()}@example.invalid`,
      name: `${roleCode}_USER`,
      departmentId,
      status: "ACTIVE",
      userRoles: {
        create: {
          roleId: role.id,
          scopeType: "GLOBAL",
          scopeKey: "GLOBAL",
        },
      },
    },
  });

  return user;
};

const createSyntheticUsers = async () => {
  const department = await prisma.department.create({
    data: {
      code: codes.department,
      name: `${syntheticPrefix}DEPARTMENT_${suffix}`,
      status: "ACTIVE",
    },
  });

  const permission = await ensurePermission();
  const [systemUser, limitedUser] = await Promise.all([
    createSyntheticUser({
      departmentId: department.id,
      roleCode: codes.systemRole,
      permissionId: permission.id,
    }),
    createSyntheticUser({
      departmentId: department.id,
      roleCode: codes.limitedRole,
      permissionId: null,
    }),
  ]);

  return {
    systemUserId: systemUser.id,
    limitedUserId: limitedUser.id,
  };
};

const createImportJobWithItems = async ({ operatorUserId }) => {
  const job = await prisma.importJob.create({
    data: {
      idempotencyKeyHash: safeHash(`${syntheticPrefix}JOB_${suffix}`),
      importFamily: "DEPARTMENT",
      mode: "CREATE_ONLY",
      targetEnvironment: `${syntheticPrefix}LOCAL`,
      scopeType: `${syntheticPrefix}SCOPE`,
      scopeHash: safeHash(`${syntheticPrefix}SCOPE_${suffix}`),
      fileFingerprint: safeHash(`${syntheticPrefix}FILE_${suffix}`),
      fileSizeBytes: 0,
      operatorUserId,
      status: "SUCCESS",
      acceptedRowCount: 4,
      createdBusinessCount: 2,
      createdCompanionCount: 0,
      auditCount: 0,
      warningCount: 1,
      errorCount: 1,
      safeErrorCodes: [safeCodes.blocked],
      safeSummary: {
        acceptedRowCount: 4,
        createdBusinessCount: 2,
        safeErrorCodes: [safeCodes.blocked],
      },
      completedAt: startedAt,
    },
  });

  const runOne = await prisma.importRun.create({
    data: {
      jobId: job.id,
      attemptNo: 1,
      trigger: "INITIAL_SUBMIT",
      status: "SUCCESS",
      operatorUserId,
      requestFingerprint: safeHash(`${syntheticPrefix}REQUEST_ONE_${suffix}`),
      validationSummary: { acceptedRowCount: 3 },
      applySummary: { createdBusinessCount: 1 },
      auditLogIds: [],
      completedBusinessTransactionAt: startedAt,
      startedAt,
      finishedAt: startedAt,
    },
  });

  const runTwo = await prisma.importRun.create({
    data: {
      jobId: job.id,
      attemptNo: 2,
      trigger: "OPERATOR_REPLAY_CHECK",
      status: "SUCCESS",
      operatorUserId,
      requestFingerprint: safeHash(`${syntheticPrefix}REQUEST_TWO_${suffix}`),
      validationSummary: { acceptedRowCount: 1 },
      applySummary: { createdBusinessCount: 1 },
      auditLogIds: [],
      completedBusinessTransactionAt: startedAt,
      startedAt,
      finishedAt: startedAt,
    },
  });

  await prisma.importJobItem.createMany({
    data: [
      {
        jobId: job.id,
        runId: runOne.id,
        rowNumber: 1,
        plannedAction: "CREATE",
        status: "APPLIED",
        safeCode: safeCodes.applied,
        targetType: "DEPARTMENT",
        targetId: randomUUID(),
      },
      {
        jobId: job.id,
        runId: runOne.id,
        rowNumber: 2,
        plannedAction: "BLOCK",
        status: "BLOCKED",
        safeCode: safeCodes.blocked,
        targetType: "DEPARTMENT",
        targetId: randomUUID(),
      },
      {
        jobId: job.id,
        runId: runOne.id,
        rowNumber: 3,
        plannedAction: "SKIP",
        status: "SKIPPED",
        safeCode: safeCodes.skipped,
        targetType: "USER",
        targetId: randomUUID(),
      },
      {
        jobId: job.id,
        runId: runTwo.id,
        rowNumber: 1,
        plannedAction: "CREATE_DRAFT",
        status: "APPLIED",
        safeCode: safeCodes.secondRun,
        targetType: "ACHIEVEMENT",
        targetId: randomUUID(),
      },
    ],
  });

  await prisma.importJob.update({
    where: { id: job.id },
    data: {
      latestRunId: runTwo.id,
    },
  });

  return {
    jobId: job.id,
    runOneId: runOne.id,
  };
};

const createEmptyImportJob = async ({ operatorUserId }) => {
  const job = await prisma.importJob.create({
    data: {
      idempotencyKeyHash: safeHash(`${syntheticPrefix}EMPTY_JOB_${suffix}`),
      importFamily: "DEPARTMENT",
      mode: "CREATE_ONLY",
      targetEnvironment: `${syntheticPrefix}LOCAL`,
      scopeType: `${syntheticPrefix}EMPTY_SCOPE`,
      scopeHash: safeHash(`${syntheticPrefix}EMPTY_SCOPE_${suffix}`),
      fileFingerprint: safeHash(`${syntheticPrefix}EMPTY_FILE_${suffix}`),
      fileSizeBytes: 0,
      operatorUserId,
      status: "SUCCESS",
      acceptedRowCount: 0,
      createdBusinessCount: 0,
      createdCompanionCount: 0,
      auditCount: 0,
      warningCount: 0,
      errorCount: 0,
      safeErrorCodes: [],
      safeSummary: { acceptedRowCount: 0 },
      completedAt: startedAt,
    },
  });

  const run = await prisma.importRun.create({
    data: {
      jobId: job.id,
      attemptNo: 1,
      trigger: "INITIAL_SUBMIT",
      status: "SUCCESS",
      operatorUserId,
      requestFingerprint: safeHash(`${syntheticPrefix}EMPTY_REQUEST_${suffix}`),
      validationSummary: { acceptedRowCount: 0 },
      applySummary: { createdBusinessCount: 0 },
      auditLogIds: [],
      completedBusinessTransactionAt: startedAt,
      startedAt,
      finishedAt: startedAt,
    },
  });

  await prisma.importJob.update({
    where: { id: job.id },
    data: {
      latestRunId: run.id,
    },
  });

  return job.id;
};

const main = async () => {
  let app;

  try {
    const { systemUserId, limitedUserId } = await createSyntheticUsers();
    const { jobId, runOneId } = await createImportJobWithItems({
      operatorUserId: systemUserId,
    });
    const emptyJobId = await createEmptyImportJob({
      operatorUserId: systemUserId,
    });

    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix("api");
    await app.listen(0, "127.0.0.1");
    const apiBaseUrl = `${await app.getUrl()}/api`;

    const health = await fetch(`${apiBaseUrl}/health`);
    if (health.status !== 200) {
      throw createBlockedError(
        "LOCAL_API_NOT_READY",
        `Temporary API health check returned HTTP ${health.status}.`,
      );
    }

    const list = await getJson(apiBaseUrl, systemUserId, `/import-jobs/${jobId}/items`);
    assertAllowedResponseShape("list", list);
    assertCondition(list.body.total === 4, "list total mismatch", {
      total: list.body.total,
    });
    assertRowNumbersNondecreasing(list.body.items);

    const filtered = await getJson(apiBaseUrl, systemUserId, `/import-jobs/${jobId}/items`, {
      runId: runOneId,
      status: "BLOCKED",
      plannedAction: "BLOCK",
      targetType: "DEPARTMENT",
      safeCode: safeCodes.blocked,
      page: 1,
      pageSize: 1,
    });
    assertAllowedResponseShape("filtered", filtered);
    assertCondition(filtered.body.total === 1, "filtered total mismatch", {
      total: filtered.body.total,
    });
    assertCondition(filtered.body.items[0]?.rowNumber === 2, "filtered row mismatch", {
      rowNumber: filtered.body.items[0]?.rowNumber ?? null,
    });

    const pageTwo = await getJson(apiBaseUrl, systemUserId, `/import-jobs/${jobId}/items`, {
      page: 2,
      pageSize: 2,
    });
    assertAllowedResponseShape("pageTwo", pageTwo);
    assertCondition(pageTwo.body.page === 2 && pageTwo.body.pageSize === 2, "paging mismatch", {
      page: pageTwo.body.page,
      pageSize: pageTwo.body.pageSize,
    });
    assertCondition(pageTwo.body.items.length === 2, "page size response mismatch", {
      itemCount: pageTwo.body.items.length,
    });

    const empty = await getJson(apiBaseUrl, systemUserId, `/import-jobs/${emptyJobId}/items`);
    assertAllowedResponseShape("empty", empty);
    assertCondition(empty.body.total === 0 && empty.body.items.length === 0, "empty mismatch", {
      total: empty.body.total,
      itemCount: empty.body.items.length,
    });

    const forbidden = await getJson(apiBaseUrl, limitedUserId, `/import-jobs/${jobId}/items`);
    assertCondition(forbidden.status === 403, "limited user did not receive 403", {
      status: forbidden.status,
    });

    const missing = await getJson(apiBaseUrl, systemUserId, `/import-jobs/${randomUUID()}/items`);
    assertCondition(missing.status === 404, "missing parent did not receive 404", {
      status: missing.status,
    });

    const invalidUuid = await getJson(apiBaseUrl, systemUserId, `/import-jobs/not-a-uuid/items`);
    assertCondition(invalidUuid.status === 400, "invalid UUID did not receive 400", {
      status: invalidUuid.status,
    });

    const invalidEnum = await getJson(apiBaseUrl, systemUserId, `/import-jobs/${jobId}/items`, {
      status: "NOT_A_STATUS",
    });
    assertCondition(invalidEnum.status === 400, "invalid enum did not receive 400", {
      status: invalidEnum.status,
    });

    const extraQuery = await getJson(apiBaseUrl, systemUserId, `/import-jobs/${jobId}/items`, {
      extraQuery: "blocked",
    });
    assertCondition(extraQuery.status === 400, "extra query did not receive 400", {
      status: extraQuery.status,
    });

    console.log(
      JSON.stringify(
        {
          step,
          status: "PASS",
          scope: "local-synthetic-backend-only-api-db",
          productionVpcAcceptance: false,
          syntheticPrefix,
          tempApiHealthStatus: health.status,
          authHarness: "x-demo-user-id-without-credential-or-session",
          apiRoute: "GET /api/import-jobs/:id/items",
          webBoundary: "aggregate-only; no Web item route, client method, or UI started",
          allowlistResponseKeys: {
            topLevel: allowedTopLevelKeys,
            item: allowedItemKeys,
          },
          checks: {
            systemConfigGetStatus: list.status,
            forbiddenWithoutSystemConfigStatus: forbidden.status,
            missingParentStatus: missing.status,
            emptyListTotal: empty.body.total,
            filterTotal: filtered.body.total,
            pageTwoItemCount: pageTwo.body.items.length,
            invalidUuidStatus: invalidUuid.status,
            invalidEnumStatus: invalidEnum.status,
            extraQueryStatus: extraQuery.status,
            responseForbiddenKeysAbsent: true,
          },
          createdSyntheticFacts: {
            parentJobCount: 2,
            runCount: 3,
            itemRowCount: 4,
          },
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
};

const safeErrorMessage = (error) => {
  const message = error instanceof Error ? error.message : "Unknown Step 78D failure.";
  return message
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, "[REDACTED_DATABASE_URL]")
    .replace(/https?:\/\/[^\s"']+/gi, "[REDACTED_URL]")
    .replace(/password=[^&\s"']+/gi, "password=[REDACTED]")
    .slice(0, 500);
};

const classifyBlockedReason = (error) => {
  if (error && typeof error === "object" && "step78dBlockedReason" in error) {
    return error.step78dBlockedReason;
  }

  const message = safeErrorMessage(error);
  if (
    /database server|can't reach database|connection refused|connect econnrefused|p1001|p2021|does not exist/i.test(
      message,
    )
  ) {
    return "LOCAL_DB_NOT_READY";
  }

  return null;
};

main().catch(async (error) => {
  await prisma.$disconnect().catch(() => undefined);
  const blockedReason = classifyBlockedReason(error);
  console.error(
    JSON.stringify({
      step,
      status: blockedReason ? "BLOCKED" : "FAIL",
      ...(blockedReason ? { reason: blockedReason } : {}),
      productionVpcAcceptance: false,
      message: safeErrorMessage(error),
    }),
  );
  process.exit(1);
});
