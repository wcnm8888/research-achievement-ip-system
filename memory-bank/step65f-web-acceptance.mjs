import { randomBytes } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import http from "node:http";

const composeFile = "docker-compose.production.yml";
const adminPort = 19251;
const limitedPort = 19252;
const apiBaseUrl = "http://127.0.0.1:14001/api";
const webBaseUrl = "http://127.0.0.1:18081";

const logStep = (message) => {
  process.stderr.write(`[step65f] ${message}\n`);
};

const scrub = (value) =>
  String(value)
    .replace(/(password|cookie|token|session|authorization)([^,\n\r}]*)/gi, "$1[redacted]")
    .slice(0, 800);

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
      `${command} ${args.join(" ")} failed with exit ${result.status ?? "null"} signal ${result.signal ?? "none"}`,
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

const randomValue = () => randomBytes(18).toString("base64url");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const dockerCompose = (args, options = {}) =>
  run("docker", ["compose", "-f", composeFile, ...args], options);

const runDbHelper = (payload) => {
  const output = dockerCompose(
    ["exec", "-T", "api", "node", "/app/step65f-db-helper.mjs"],
    {
      input: JSON.stringify(payload),
    },
  );
  return JSON.parse(output);
};

const login = async (email, password) => {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = response.headers.get("set-cookie");

  return {
    status: response.status,
    cookie: setCookie?.split(";")[0] ?? null,
  };
};

const proxyRequest = async ({ req, res, apiCookie }) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  const body = Buffer.concat(chunks);
  const isApi = req.url?.startsWith("/api");
  const target = `${isApi ? apiBaseUrl.replace(/\/api$/, "") : webBaseUrl}${req.url}`;
  const headers = { ...req.headers };
  delete headers.host;
  if (isApi) {
    headers.cookie = apiCookie;
  }

  const response = await fetch(target, {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
    redirect: "manual",
  });
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") {
      res.setHeader(key, value);
    }
  });
  res.end(Buffer.from(await response.arrayBuffer()));
};

const startProxy = ({ port, apiCookie }) => {
  const server = http.createServer((req, res) => {
    proxyRequest({ req, res, apiCookie }).catch(() => {
      res.statusCode = 502;
      res.end("proxy error");
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
      [`-s=${session}`, "--raw", "run-code", "--filename=memory-bank/step65f-browser-acceptance.js"],
      { timeout: 120000 },
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
  const adminPassword = randomValue();
  const limitedPassword = randomValue();
  const startedAt = new Date().toISOString();
  const targetCodes = [`S65F_PARENT_${suffix}`, `S65F_CHILD_${suffix}`];

  logStep("copying local db helper into api container");
  dockerCompose(["cp", "memory-bank/step65f-db-helper.mjs", "api:/app/step65f-db-helper.mjs"]);
  logStep("building web static assets");
  run("corepack", ["pnpm", "--filter", "@research-ip/web", "build"], { timeout: 300000 });
  logStep("refreshing local web container assets");
  dockerCompose(["cp", "apps/web/dist/.", "web:/usr/share/nginx/html/"], { timeout: 120000 });
  dockerCompose(["restart", "web"], { timeout: 60000 });

  logStep("checking local web health");
  const health = await fetch(`${webBaseUrl}/healthz`);
  logStep("preparing synthetic local users and departments");
  const prepared = runDbHelper({
    action: "prepare",
    suffix,
    adminPassword,
    limitedPassword,
  });
  logStep("creating local browser sessions");
  const adminLogin = await login(prepared.adminEmail, adminPassword);
  const limitedLogin = await login(prepared.limitedEmail, limitedPassword);

  if (!adminLogin.cookie || !limitedLogin.cookie) {
    throw new Error("Step 65F synthetic login did not return local sessions.");
  }

  const adminProxy = await startProxy({ port: adminPort, apiCookie: adminLogin.cookie });
  const limitedProxy = await startProxy({ port: limitedPort, apiCookie: limitedLogin.cookie });

  try {
    logStep("running admin browser acceptance");
    const adminBrowser = await runBrowser(
      "step65f-admin",
      `http://127.0.0.1:${adminPort}/?s=${suffix}`,
    );
    logStep("running limited-permission browser acceptance");
    const limitedBrowser = await runBrowser(
      "step65f-limited",
      `http://127.0.0.1:${limitedPort}/?s=${suffix}`,
    );
    logStep("collecting sanitized database evidence");
    const dbEvidence = runDbHelper({
      action: "evidence",
      actorUserId: prepared.adminUserId,
      since: startedAt,
      codes: targetCodes,
    });

    console.log(
      JSON.stringify({
        step: "65F",
        scope: "local-production-like-web-only",
        webHealthStatus: health.status,
        loginStatuses: {
          admin: adminLogin.status,
          limited: limitedLogin.status,
        },
        adminBrowser,
        limitedBrowser,
        dbEvidence,
      }),
    );
  } finally {
    adminProxy.close();
    limitedProxy.close();
  }
};

await main();
