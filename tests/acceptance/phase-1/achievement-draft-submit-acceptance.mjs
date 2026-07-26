import { spawn, spawnSync } from "node:child_process";
import process from "node:process";

const composeFile = "docker-compose.production.yml";
const stagingApiPort = Number(process.env.VERTICAL_SLICE_API_PORT ?? 14002);
const apiRootUrl = `http://127.0.0.1:${stagingApiPort}`;
const apiBaseUrl = `${apiRootUrl}/api`;
const webBaseUrl = "http://127.0.0.1:18081";
const fixedResearcherId = "40000000-0000-4000-8000-000000000001";
const helperPath = "tests/acceptance/phase-1/achievement-draft-submit-db-helper.mjs";
const browserPath = "tests/acceptance/phase-1/achievement-draft-submit-browser.js";

const scrub = (value) =>
  String(value)
    .replace(/(password|cookie|token|session|authorization)([^,\n\r}]*)/gi, "$1[redacted]")
    .replace(/(postgres(?:ql)?:\/\/)[^\s"']+/gi, "$1[redacted]")
    .slice(0, 1600);

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    input: options.input,
    shell: process.platform === "win32",
    timeout: options.timeout ?? 120000,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${scrub(result.stderr)}`);
  }
  return result.stdout.trim();
};

const dockerCompose = (args, options = {}) =>
  run("docker", ["compose", "-f", composeFile, ...args], options);

const runHelper = (payload) => {
  const output = dockerCompose(
    ["exec", "-T", "api", "node", "/app/achievement-draft-submit-db-helper.mjs"],
    { input: JSON.stringify(payload), timeout: 120000 },
  );
  const result = JSON.parse(output);
  if (result.status !== 0) {
    throw new Error(`Database helper failed: ${scrub(result.error)}`);
  }
  return result.body;
};

const waitForStagingApi = (containerName) => {
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    const health = spawnSync("docker", ["inspect", "-f", "{{.State.Health.Status}}", containerName], {
      encoding: "utf8",
      shell: process.platform === "win32",
    });
    if (health.status === 0 && health.stdout.trim() === "healthy") {
      return;
    }
    spawnSync("powershell.exe", ["-NoProfile", "-Command", "Start-Sleep -Milliseconds 1500"], {
      encoding: "utf8",
      shell: process.platform === "win32",
    });
  }
  throw new Error(`Temporary staging API did not become healthy on port ${stagingApiPort}.`);
};

const startStagingApi = async (suffix) => {
  const containerName = `research-achievement-vertical-slice-api-${suffix.toLowerCase()}`;
  dockerCompose([
    "run",
    "-d",
    "--no-deps",
    "--name",
    containerName,
    "-e",
    "NODE_ENV=staging",
    "-p",
    `${stagingApiPort}:3000`,
    "api",
  ], { timeout: 120000 });
  waitForStagingApi(containerName);
  return containerName;
};

const requestJson = async (path, userId, options = {}) => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-demo-user-id": userId,
      ...(options.headers ?? {}),
    },
  });
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { status: response.status, ok: response.ok, body };
};

const runBrowser = async ({ mode, suffix }) => {
  const session = `achievement-draft-submit-${mode}-${suffix}`;
  const url = `${webBaseUrl}/?mode=${mode}`;
  const open = spawn("npx.cmd", ["--yes", "--package", "@playwright/cli", "playwright-cli", `-s=${session}`, "open", url], {
    cwd: process.cwd(),
    shell: true,
    stdio: "ignore",
  });
  await new Promise((resolve) => setTimeout(resolve, 5000));
  try {
    const output = run(
      "npx.cmd",
      [
        "--yes",
        "--package",
        "@playwright/cli",
        "playwright-cli",
        `-s=${session}`,
        "--raw",
        "run-code",
        `--filename=${browserPath}`,
      ],
      { timeout: 240000 },
    );
    let evidence;
    try {
      evidence = JSON.parse(output);
    } catch {
      throw new Error(`Browser acceptance returned non-JSON output: ${scrub(output)}`);
    }
    run("npx.cmd", ["--yes", "--package", "@playwright/cli", "playwright-cli", `-s=${session}`, "screenshot", `output/playwright/achievement-draft-submit-${mode}.png`], { timeout: 120000 });
    return evidence;
  } finally {
    try {
      run("npx.cmd", ["--yes", "--package", "@playwright/cli", "playwright-cli", `-s=${session}`, "close"], { timeout: 60000 });
    } catch {
      open.kill();
    }
  }
};

const main = async () => {
  const suffix = Date.now().toString(36).toUpperCase();
  const startedAt = new Date().toISOString();
  dockerCompose(["cp", helperPath, "api:/app/achievement-draft-submit-db-helper.mjs"]);
  const prepared = runHelper({ action: "prepare", suffix });
  const stagingApiContainer = await startStagingApi(suffix);

  try {
    const desktop = await runBrowser({ mode: "desktop", suffix });
    if (!desktop.achievementId || !desktop.created || !desktop.refreshed || !desktop.submitted) {
      throw new Error(`Desktop browser flow did not complete: ${JSON.stringify(desktop)}`);
    }

    const achievementId = desktop.achievementId;
    const persisted = await requestJson(`/achievements/${achievementId}`, fixedResearcherId);
    const outsiderRead = await requestJson(`/achievements/${achievementId}`, prepared.outsider.id);
    const outsiderUpdate = await requestJson(`/achievements/${achievementId}`, prepared.outsider.id, {
      method: "PATCH",
      body: JSON.stringify({ title: "forbidden update" }),
    });
    const duplicateSubmit = await requestJson(`/achievements/${achievementId}/submit`, fixedResearcherId, {
      method: "POST",
      body: JSON.stringify({}),
    });
    const dbEvidence = runHelper({ action: "evidence", achievementId, since: startedAt });
    const tablet = await runBrowser({ mode: "tablet", suffix });
    const mobile = await runBrowser({ mode: "mobile", suffix });

    const result = {
      step: "achievement-draft-submit",
      scope: "local-docker-api-web-postgres",
      productionAcceptance: false,
      synthetic: true,
      ids: { achievementId, departmentId: prepared.departmentId },
      business: {
        persistedAfterRefresh: persisted.status === 200 && persisted.body?.status === "PENDING_DEPARTMENT_REVIEW",
        duplicateSubmitRejected: duplicateSubmit.status >= 400,
        outsiderReadRejected: [403, 404].includes(outsiderRead.status),
        outsiderUpdateRejected: [403, 404].includes(outsiderUpdate.status),
      },
      database: dbEvidence,
      browser: { desktop, tablet, mobile },
      responseStatuses: {
        persisted: persisted.status,
        outsiderRead: outsiderRead.status,
        outsiderUpdate: outsiderUpdate.status,
        duplicateSubmit: duplicateSubmit.status,
      },
    };
    if (!result.business.persistedAfterRefresh || !result.business.duplicateSubmitRejected || !result.business.outsiderReadRejected || !result.business.outsiderUpdateRejected) {
      throw new Error(`Business acceptance failed: ${JSON.stringify(result)}`);
    }
    if (dbEvidence.counts.workflowInstances !== 1 || dbEvidence.counts.workflowTasks !== 1 || dbEvidence.counts.workflowSubmitActions !== 1 || dbEvidence.counts.submitAudits !== 1) {
      throw new Error(`Database consistency acceptance failed: ${JSON.stringify(dbEvidence)}`);
    }
    console.log(JSON.stringify(result));
  } finally {
    try {
      run("docker", ["stop", stagingApiContainer], { timeout: 60000 });
    } catch {
      // Keep failure reporting focused on the acceptance result.
    }
  }
};

await main().catch((error) => {
  console.error(scrub(error.stack ?? error.message));
  process.exitCode = 1;
});
