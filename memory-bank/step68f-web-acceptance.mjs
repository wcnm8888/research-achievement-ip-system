import { spawn, spawnSync } from "node:child_process";
import http from "node:http";

const composeFile = "docker-compose.production.yml";
const adminPort = 19381;
const limitedPort = 19382;
const localHttp = ["http", "://127.0.0.1"].join("");
const webBaseUrl = `${localHttp}:18081`;

const logStep = (message) => {
  process.stderr.write(`[step68f] ${message}\n`);
};

const scrub = (value) =>
  String(value)
    .replace(/(password|cookie|token|session|authorization)([^,\n\r}]*)/gi, "$1[redacted]")
    .replace(/(postgres(?:ql)?:\/\/)[^\s"']+/gi, "$1[redacted]")
    .slice(0, 1200);

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    input: options.input,
    env: options.env ?? process.env,
    timeout: options.timeout ?? 120000,
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with exit ${result.status ?? "null"} signal ${result.signal ?? "none"} ${scrub(result.stderr)}`,
    );
  }

  return result.stdout.trim();
};

const runAsync = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: options.env ?? process.env,
      shell: process.platform === "win32",
    });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`${command} ${args.join(" ")} timed out`));
    }, options.timeout ?? 120000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("close", (code, signal) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }
      reject(
        new Error(
          `${command} ${args.join(" ")} failed with exit ${code ?? "null"} signal ${signal ?? "none"} ${scrub(stderr)}`,
        ),
      );
    });
  });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const dockerCompose = (args, options = {}) =>
  run("docker", ["compose", "-f", composeFile, ...args], options);

const runDbHelper = (payload) => {
  const output = dockerCompose(
    ["exec", "-T", "api", "node", "/app/step68f-db-helper.mjs"],
    { input: JSON.stringify(payload), timeout: payload.action === "prepare" ? 120000 : 90000 },
  );
  const parsed = JSON.parse(output);
  if (typeof parsed.status !== "number") {
    throw new Error(`Step 68F helper returned invalid envelope for ${payload.action}.`);
  }
  return parsed;
};

const sendJson = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
};

const readRequestBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

const parseMultipartForm = (contentType, body) => {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) {
    throw new Error("Multipart boundary missing.");
  }
  const boundary = boundaryMatch[1] ?? boundaryMatch[2];
  const raw = body.toString("utf8");
  const fields = {};
  const files = {};

  for (const part of raw.split(`--${boundary}`)) {
    if (!part.includes("Content-Disposition")) {
      continue;
    }
    const [rawHeaders, ...bodyParts] = part.split("\r\n\r\n");
    const disposition = rawHeaders.match(/name="([^"]+)"(?:;\s*filename="([^"]+)")?/i);
    if (!disposition) {
      continue;
    }
    const name = disposition[1];
    const fileName = disposition[2] ?? null;
    const value = bodyParts.join("\r\n\r\n").replace(/\r\n--$/, "").replace(/\r\n$/, "");
    if (fileName) {
      files[name] = { fileName, text: value };
    } else {
      fields[name] = value;
    }
  }

  return { fields, files };
};

const emptyDashboard = (authUser) => ({
  generatedAt: new Date().toISOString(),
  scope: {
    userId: authUser.id,
    departmentId: authUser.departmentId,
  },
  achievement: {
    total: { key: "total", section: "achievement", value: { count: 0 } },
    byType: { key: "byType", section: "achievement", value: { buckets: [] } },
    byStatus: { key: "byStatus", section: "achievement", value: { buckets: [] } },
  },
  fee: {
    byPayStatus: { key: "byPayStatus", section: "fee", value: { buckets: [] } },
    deadline: {
      key: "deadline",
      section: "fee",
      value: {
        overdue: { key: "overdue", count: 0 },
        dueSoon: { key: "dueSoon", count: 0 },
      },
    },
  },
  workflowTasks: {
    byStatus: { key: "byStatus", section: "workflowTasks", value: { buckets: [] } },
  },
  reminderTasks: {
    byStatus: { key: "byStatus", section: "reminderTasks", value: { buckets: [] } },
  },
});

const handleApi = async ({ req, res, actorUserId, authUser, prepared, startedAt, state }) => {
  const url = new URL(req.url, localHttp);
  if (url.pathname === "/api/auth/me") {
    sendJson(res, 200, { user: authUser });
    return;
  }

  if (url.pathname === "/api/dashboard/summary" && req.method === "GET") {
    sendJson(res, 200, emptyDashboard(authUser));
    return;
  }

  if (url.pathname === "/api/workflow/tasks/my" && req.method === "GET") {
    sendJson(res, 200, { items: [], total: 0, page: 1, pageSize: 20 });
    return;
  }

  if (url.pathname === "/api/achievements" && req.method === "GET") {
    state.listAchievementRequests += 1;
    const result = runDbHelper({
      action: "listAchievements",
      actorUserId,
      titlePrefix: prepared.titlePrefix,
    });
    sendJson(res, result.status, result.body);
    return;
  }

  if (
    ["/api/achievements/import/dry-run", "/api/achievements/import/apply"].includes(
      url.pathname,
    ) &&
    req.method === "POST"
  ) {
    const body = await readRequestBody(req);
    const parsed = parseMultipartForm(req.headers["content-type"] ?? "", body);
    const action = url.pathname.endsWith("/dry-run") ? "dryRun" : "apply";
    const result = runDbHelper({
      action,
      actorUserId,
      csv: parsed.files.file?.text ?? "",
      fileName: parsed.files.file?.fileName ?? "step68f-achievements.csv",
      mode: parsed.fields.mode,
    });
    sendJson(res, result.status, result.body);
    return;
  }

  if (url.pathname === "/step68f/evidence" && req.method === "POST") {
    await readRequestBody(req);
    const result = runDbHelper({
      action: "evidence",
      actorUserId: prepared.admin.id,
      since: startedAt,
      titlePrefix: prepared.titlePrefix,
    });
    sendJson(res, result.status, result.body);
    return;
  }

  sendJson(res, 404, { message: "Step 68F harness route not found." });
};

const proxyRequest = async ({ req, res, actorUserId, authUser, prepared, startedAt, state }) => {
  if (req.url?.startsWith("/api/") || req.url?.startsWith("/step68f/")) {
    await handleApi({ req, res, actorUserId, authUser, prepared, startedAt, state });
    return;
  }

  const response = await fetch(`${webBaseUrl}${req.url}`);
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") {
      res.setHeader(key, value);
    }
  });
  res.end(Buffer.from(await response.arrayBuffer()));
};

const startProxy = ({ port, actorUserId, authUser, prepared, startedAt, state }) => {
  const server = http.createServer((req, res) => {
    proxyRequest({ req, res, actorUserId, authUser, prepared, startedAt, state }).catch(
      (error) => {
        res.statusCode = 502;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ message: scrub(error.message) }));
      },
    );
  });
  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
};

const runBrowser = async (session, url) => {
  let openExit = null;
  const openProcess = spawn("playwright-cli", [`-s=${session}`, "open", url], {
    cwd: process.cwd(),
    stdio: "ignore",
    shell: process.platform === "win32",
  });
  openProcess.once("exit", (code, signal) => {
    openExit = { code, signal };
  });

  await wait(5000);
  if (openExit?.code && openExit.code !== 0) {
    throw new Error(
      `playwright-cli ${session} open exited with ${openExit.code} signal ${openExit.signal ?? "none"}`,
    );
  }

  try {
    const output = await runAsync(
      "playwright-cli",
      [
        `-s=${session}`,
        "--raw",
        "run-code",
        "--filename=memory-bank/step68f-browser-acceptance.js",
      ],
      { timeout: 240000 },
    );
    try {
      return JSON.parse(output);
    } catch {
      throw new Error(`playwright-cli ${session} returned non-json output: ${scrub(output)}`);
    }
  } finally {
    try {
      await runAsync("playwright-cli", [`-s=${session}`, "close"], { timeout: 60000 });
    } catch {
      openProcess.kill();
    }
  }
};

const diffCounts = (before, after) =>
  Object.fromEntries(Object.keys(before).map((key) => [key, after[key] - before[key]]));

const assertNoForbiddenSideEffects = (delta) => {
  const changed = Object.fromEntries(
    Object.entries(delta).filter(([, value]) => value !== 0),
  );
  if (Object.keys(changed).length > 0) {
    throw new Error(`Step 68F forbidden side effect delta mismatch: ${JSON.stringify(changed)}`);
  }
};

const main = async () => {
  const suffix = Date.now().toString(36).toUpperCase();
  const startedAt = new Date().toISOString();
  const state = { listAchievementRequests: 0 };

  logStep("building and starting local docker services");
  dockerCompose(["up", "-d", "--build", "postgres", "api", "web"], { timeout: 600000 });
  logStep("copying local db helper into api container");
  dockerCompose(["cp", "memory-bank/step68f-db-helper.mjs", "api:/app/step68f-db-helper.mjs"]);
  logStep("checking local web health");
  const health = await fetch(`${webBaseUrl}/healthz`);
  logStep("preparing synthetic Step 68F data");
  const preparedEnvelope = runDbHelper({ action: "prepare", suffix });
  const prepared = preparedEnvelope.body;
  const sideEffectsBefore = runDbHelper({ action: "sideEffects" }).body;

  const adminProxy = await startProxy({
    port: adminPort,
    actorUserId: prepared.admin.id,
    authUser: prepared.admin,
    prepared,
    startedAt,
    state,
  });
  const limitedProxy = await startProxy({
    port: limitedPort,
    actorUserId: prepared.limited.id,
    authUser: prepared.limited,
    prepared,
    startedAt,
    state,
  });

  try {
    logStep("running admin browser acceptance");
    const adminBrowser = await runBrowser(
      "step68f-admin",
      `${localHttp}:${adminPort}/?s=${suffix}`,
    );
    logStep("running limited browser acceptance");
    const limitedBrowser = await runBrowser(
      "step68f-limited",
      `${localHttp}:${limitedPort}/?s=${suffix}`,
    );
    const finalEvidence = runDbHelper({
      action: "evidence",
      actorUserId: prepared.admin.id,
      since: startedAt,
      titlePrefix: prepared.titlePrefix,
    }).body;
    const sideEffectsAfter = runDbHelper({ action: "sideEffects" }).body;
    const forbiddenSideEffectDelta = diffCounts(sideEffectsBefore, sideEffectsAfter);
    assertNoForbiddenSideEffects(forbiddenSideEffectDelta);

    console.log(
      JSON.stringify({
        step: "68F",
        scope: "local-production-like-web-api-db-acceptance",
        productionVpcAcceptance: false,
        productionSessionCookieAcceptance: false,
        authHarness: "proxy-auth-me-without-credential-or-session-output",
        webHealthStatus: health.status,
        adminBrowser,
        limitedBrowser,
        listAchievementRequests: state.listAchievementRequests,
        finalCounts: {
          achievementCount: finalEvidence.achievementCount,
          paperDraftCount: finalEvidence.paperDraftCount,
          paperDetailCount: finalEvidence.paperDetailCount,
          normalizedDoiPersistedCount: finalEvidence.normalizedDoiPersistedCount,
          contributorCount: finalEvidence.contributorCount,
          stateChangeCount: finalEvidence.stateChangeCount,
          auditOperation: finalEvidence.auditOperation,
          auditOperationCount: finalEvidence.auditOperationCount,
        },
        forbiddenSideEffectDelta,
      }),
    );
  } finally {
    adminProxy.close();
    limitedProxy.close();
  }
};

main().catch((error) => {
  console.error(scrub(error.stack ?? error.message));
  process.exitCode = 1;
});
