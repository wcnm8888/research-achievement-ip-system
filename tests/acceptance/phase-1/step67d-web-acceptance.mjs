import { spawn, spawnSync } from "node:child_process";
import http from "node:http";

const composeFile = "docker-compose.production.yml";
const adminPort = 19371;
const webBaseUrl = "http://127.0.0.1:18081";

const logStep = (message) => {
  process.stderr.write(`[step67d] ${message}\n`);
};

const scrub = (value) =>
  String(value)
    .replace(/(password|cookie|token|session|authorization)([^,\n\r}]*)/gi, "$1[redacted]")
    .replace(/(postgres(?:ql)?:\/\/)[^\s"']+/gi, "$1[redacted]")
    .slice(0, 1000);

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
    ["exec", "-T", "api", "node", "/app/step67d-db-helper.mjs"],
    { input: JSON.stringify(payload), timeout: payload.action === "prepare" ? 120000 : 90000 },
  );
  const parsed = JSON.parse(output);
  if (typeof parsed.status !== "number") {
    throw new Error(`Step 67D helper returned invalid envelope for ${payload.action}.`);
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

const extractSingleCsvValue = (csv, columnName) => {
  const [headerLine, firstDataLine] = csv.split(/\r?\n/);
  const headers = headerLine.split(",");
  const values = firstDataLine.split(",");
  const index = headers.indexOf(columnName);
  return index >= 0 ? values[index]?.trim() : "";
};

const handleApi = async ({ req, res, actorUserId, authUser, prepared, startedAt }) => {
  const url = new URL(req.url, "http://127.0.0.1");
  if (url.pathname === "/api/auth/me") {
    sendJson(res, 200, { user: authUser });
    return;
  }

  if (url.pathname === "/api/departments" && req.method === "GET") {
    const result = runDbHelper({ action: "listDepartments", actorUserId });
    sendJson(res, result.status, result.body);
    return;
  }

  if (url.pathname === "/api/account-management/users" && req.method === "GET") {
    const result = runDbHelper({ action: "listUsers", actorUserId });
    sendJson(res, result.status, result.body);
    return;
  }

  if (
    ["/api/users/import/dry-run", "/api/users/import/apply"].includes(url.pathname) &&
    req.method === "POST"
  ) {
    const body = await readRequestBody(req);
    const parsed = parseMultipartForm(req.headers["content-type"] ?? "", body);
    const csv = parsed.files.file?.text ?? "";
    const action = url.pathname.endsWith("/dry-run")
      ? "dryRun"
      : csv.includes("step67d-race-")
        ? "applyWithHiddenDryRunEmployeeNoConflict"
        : "apply";
    const result = runDbHelper({
      action,
      actorUserId,
      csv,
      fileName: parsed.files.file?.fileName ?? "step67d-user-accounts.csv",
      mode: parsed.fields.mode,
      suffix: prepared.suffix,
      importDepartmentCode: prepared.importDepartmentCode,
      targetEmail: extractSingleCsvValue(csv, "email"),
      employeeNo: extractSingleCsvValue(csv, "employeeNo"),
    });
    sendJson(res, result.status, result.body);
    return;
  }

  if (url.pathname === "/step67d/evidence" && req.method === "POST") {
    const body = JSON.parse((await readRequestBody(req)).toString("utf8"));
    const result = runDbHelper({
      action: "evidence",
      actorUserId: prepared.admin.id,
      since: startedAt,
      emails: body.emails,
      importRoleCode: prepared.importRoleCode,
    });
    sendJson(res, result.status, result.body);
    return;
  }

  sendJson(res, 404, { message: "Step 67D harness route not found." });
};

const proxyRequest = async ({ req, res, actorUserId, authUser, prepared, startedAt }) => {
  if (req.url?.startsWith("/api/") || req.url?.startsWith("/step67d/")) {
    await handleApi({ req, res, actorUserId, authUser, prepared, startedAt });
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

const startProxy = ({ port, actorUserId, authUser, prepared, startedAt }) => {
  const server = http.createServer((req, res) => {
    proxyRequest({ req, res, actorUserId, authUser, prepared, startedAt }).catch((error) => {
      res.statusCode = 502;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ message: scrub(error.message) }));
    });
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
      [`-s=${session}`, "--raw", "run-code", "--filename=tests/acceptance/phase-1/step67d-browser-acceptance.js"],
      { timeout: 180000 },
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

const main = async () => {
  const suffix = Date.now().toString(36).toUpperCase();
  const startedAt = new Date().toISOString();

  logStep("building and starting local docker services");
  dockerCompose(["up", "-d", "--build", "postgres", "api", "web"], { timeout: 600000 });
  logStep("copying local db helper into api container");
  dockerCompose(["cp", "tests/acceptance/phase-1/step67d-db-helper.mjs", "api:/app/step67d-db-helper.mjs"]);
  logStep("applying local Prisma migrations");
  dockerCompose(["exec", "-T", "api", "corepack", "pnpm", "prisma", "migrate", "deploy"], {
    timeout: 180000,
  });
  logStep("checking local migration evidence");
  const schema = runDbHelper({ action: "schemaEvidence" }).body;
  logStep("checking local web health");
  const health = await fetch(`${webBaseUrl}/healthz`);
  logStep("preparing synthetic local no-credential users and import references");
  const preparedEnvelope = runDbHelper({ action: "prepare", suffix });
  const prepared = preparedEnvelope.body;

  const adminProxy = await startProxy({
    port: adminPort,
    actorUserId: prepared.admin.id,
    authUser: prepared.admin,
    prepared,
    startedAt,
  });

  try {
    logStep("running admin browser acceptance");
    const adminBrowser = await runBrowser(
      "step67d-admin",
      `http://127.0.0.1:${adminPort}/?s=${suffix}`,
    );

    console.log(
      JSON.stringify({
        step: "67D",
        scope: "local-synthetic-migration-api-web-acceptance",
        productionMigration: false,
        productionVpcAcceptance: false,
        productionSessionCookieAcceptance: false,
        authHarness: "proxy-auth-me-without-credential-or-session",
        webHealthStatus: health.status,
        schema,
        adminBrowser,
      }),
    );
  } finally {
    adminProxy.close();
  }
};

main().catch((error) => {
  console.error(scrub(error.stack ?? error.message));
  process.exitCode = 1;
});
