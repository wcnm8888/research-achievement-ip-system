import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import process from "node:process";

const composeFile = "docker-compose.production.yml";
const stagingApiPort = Number(process.env.VERTICAL_SLICE_API_PORT ?? 14002);
const apiBaseUrl = `http://127.0.0.1:${stagingApiPort}/api`;
const webBaseUrl = "http://127.0.0.1:18081";
const helperPath = "tests/acceptance/phase-1/department-review-achievement-db-helper.mjs";
const browserPath = "tests/acceptance/phase-1/department-review-achievement-browser.js";

const scrub = (value) =>
  String(value)
    .replace(/(password|cookie|token|session|authorization)([^,\n\r}]*)/gi, "$1[redacted]")
    .replace(/(postgres(?:ql)?:\/\/)[^\s"']+/gi, "$1[redacted]")
    .slice(0, 2000);

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
    ["exec", "-T", "api", "node", "/app/department-review-achievement-db-helper.mjs"],
    { input: JSON.stringify(payload), timeout: 120000 },
  );
  const result = JSON.parse(output);
  if (result.status !== 0) throw new Error(`Database helper failed: ${scrub(result.error)}`);
  return result.body;
};

const requestJson = async (path, userId, options = {}) => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      ...(userId ? { "x-demo-user-id": userId } : {}),
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

const createAndSubmit = async (researcherId, title) => {
  const created = await requestJson("/achievements", researcherId, {
    method: "POST",
    body: JSON.stringify({
      type: "PAPER",
      title,
      paperDetail: {
        journal: "Synthetic Journal",
        publishYear: 2026,
      },
      contributors: [
        {
          name: "Synthetic Researcher",
          contributorType: "AUTHOR",
          contributorRole: "FIRST_AUTHOR",
          sortOrder: 1,
        },
      ],
    }),
  });
  if (!created.ok || !created.body?.id) throw new Error(`Create achievement failed: ${JSON.stringify(created)}`);

  const submitted = await requestJson(`/achievements/${created.body.id}/submit`, researcherId, {
    method: "POST",
    body: JSON.stringify({}),
  });
  if (!submitted.ok) throw new Error(`Submit achievement failed: ${JSON.stringify(submitted)}`);
  return created.body.id;
};

const waitForHealth = (containerName) => {
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    const health = spawnSync("docker", ["inspect", "-f", "{{.State.Health.Status}}", containerName], {
      encoding: "utf8",
      shell: process.platform === "win32",
    });
    if (health.status === 0 && health.stdout.trim() === "healthy") return;
    spawnSync("powershell.exe", ["-NoProfile", "-Command", "Start-Sleep -Milliseconds 1500"], {
      encoding: "utf8",
      shell: process.platform === "win32",
    });
  }
  throw new Error(`Staging API did not become healthy on port ${stagingApiPort}.`);
};

const startStagingApi = (suffix) => {
  const containerName = `research-achievement-department-review-api-${suffix.toLowerCase()}`;
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
  waitForHealth(containerName);
  return containerName;
};

const runBrowser = async ({ mode, action, reviewerId, suffix }) => {
  const session = `department-review-${mode}-${suffix}`;
  const url = `${webBaseUrl}/?mode=${mode};action=${action};reviewerId=${encodeURIComponent(reviewerId)};apiPort=${stagingApiPort}`;
  const open = spawn("npx.cmd", ["--yes", "--package", "@playwright/cli", "playwright-cli", `-s=${session}`, "open", url], {
    cwd: process.cwd(),
    shell: true,
    stdio: "ignore",
  });
  await new Promise((resolve) => setTimeout(resolve, 5000));
  try {
    const output = run(
      "npx.cmd",
      ["--yes", "--package", "@playwright/cli", "playwright-cli", `-s=${session}`, "--raw", "run-code", `--filename=${browserPath}`],
      { timeout: 240000 },
    );
    let evidence;
    try {
      evidence = JSON.parse(output);
    } catch {
      throw new Error(`Browser acceptance returned non-JSON output: ${scrub(output)}`);
    }
    const screenshotPath = `output/playwright/department-review-${mode}.png`;
    run(
      "npx.cmd",
      ["--yes", "--package", "@playwright/cli", "playwright-cli", `-s=${session}`, "screenshot", `--filename=${screenshotPath}`],
      { timeout: 120000 },
    );
    if (!existsSync(screenshotPath)) throw new Error(`Browser screenshot was not created: ${screenshotPath}`);
    evidence.screenshotPath = screenshotPath;
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
  dockerCompose(["cp", helperPath, "api:/app/department-review-achievement-db-helper.mjs"]);
  const prepared = runHelper({ action: "prepare", suffix });
  const stagingApiContainer = startStagingApi(suffix);

  try {
    const approveAchievementId = await createAndSubmit(
      prepared.researcher.id,
      `VS Department Review Approve ${suffix}`,
    );
    const rejectAchievementId = await createAndSubmit(
      prepared.researcher.id,
      `VS Department Review Reject ${suffix}`,
    );

    const pending = await requestJson(
      "/workflow/tasks/my?targetType=ACHIEVEMENT&status=PENDING",
      prepared.reviewer.id,
    );
    if (!pending.ok || pending.body?.items?.length < 2) {
      throw new Error(`Reviewer task listing failed: ${JSON.stringify(pending)}`);
    }

    const taskByTarget = new Map(
      pending.body.items.map((task) => [task.instance?.targetId, task]),
    );
    const approveTask = taskByTarget.get(approveAchievementId);
    const rejectTask = taskByTarget.get(rejectAchievementId);
    if (!approveTask || !rejectTask) throw new Error("Submitted achievements were not assigned to the reviewer.");

    const outsiderList = await requestJson(
      "/workflow/tasks/my?targetType=ACHIEVEMENT&status=PENDING",
      prepared.outsiderReviewer.id,
    );
    const peerDetail = await requestJson(`/workflow/tasks/${approveTask.id}`, prepared.sameDepartmentReviewer.id);
    const outsiderDetail = await requestJson(`/workflow/tasks/${approveTask.id}`, prepared.outsiderReviewer.id);
    const anonymousList = await requestJson("/workflow/tasks/my?targetType=ACHIEVEMENT&status=PENDING", null);

    const desktop = await runBrowser({ mode: "desktop", action: "approve", reviewerId: prepared.reviewer.id, suffix });
    const tablet = await runBrowser({ mode: "tablet", action: "inspect", reviewerId: prepared.reviewer.id, suffix });
    const mobile = await runBrowser({ mode: "mobile", action: "reject", reviewerId: prepared.reviewer.id, suffix });

    const duplicateApprove = await requestJson(`/workflow/tasks/${approveTask.id}/approve`, prepared.reviewer.id, {
      method: "POST",
      body: JSON.stringify({ comment: "duplicate" }),
    });
    const duplicateReject = await requestJson(`/workflow/tasks/${rejectTask.id}/reject`, prepared.reviewer.id, {
      method: "POST",
      body: JSON.stringify({ comment: "duplicate" }),
    });
    const emptyReject = await requestJson(`/workflow/tasks/${rejectTask.id}/reject`, prepared.reviewer.id, {
      method: "POST",
      body: JSON.stringify({ comment: "   " }),
    });

    const evidence = runHelper({
      action: "evidence",
      achievementIds: [approveAchievementId, rejectAchievementId],
      taskIds: [approveTask.id, rejectTask.id],
      since: startedAt,
    });

    const result = {
      step: "department-review-achievement",
      scope: "local-docker-api-web-postgres",
      productionAcceptance: false,
      synthetic: true,
      ids: { approveAchievementId, rejectAchievementId, approveTaskId: approveTask.id, rejectTaskId: rejectTask.id },
      authorization: {
        outsiderListStatus: outsiderList.status,
        sameDepartmentPeerDetailStatus: peerDetail.status,
        outsiderDetailStatus: outsiderDetail.status,
        anonymousListStatus: anonymousList.status,
      },
      duplicateAndValidation: {
        duplicateApproveStatus: duplicateApprove.status,
        duplicateRejectStatus: duplicateReject.status,
        emptyRejectStatus: emptyReject.status,
      },
      browser: { desktop, tablet, mobile },
      database: evidence,
    };

    const checks = [
      evidence.achievements.every((item) => ["PENDING_ARCHIVE", "DEPARTMENT_REJECTED"].includes(item.status)),
      evidence.counts.workflowInstances === 2,
      evidence.counts.reviewTasks === 2,
      evidence.counts.reviewActions === 2,
      evidence.counts.reviewAudits === 2,
      outsiderList.status === 200 && outsiderList.body?.items?.length === 0,
      [403, 404].includes(peerDetail.status),
      [403, 404].includes(outsiderDetail.status),
      [401, 403].includes(anonymousList.status),
      duplicateApprove.status >= 400,
      duplicateReject.status >= 400,
      emptyReject.status >= 400,
      desktop.detailOpened && desktop.actionCompleted,
      tablet.detailOpened && !tablet.actionCompleted,
      mobile.detailOpened && mobile.emptyRejectBlocked && mobile.actionCompleted,
      desktop.refreshedAfterAction && mobile.refreshedAfterAction,
      [desktop, tablet, mobile].every((item) => !item.overflow?.hasHorizontalOverflow),
    ];
    if (!checks.every(Boolean)) throw new Error(`Department review acceptance failed: ${JSON.stringify(result)}`);
    console.log(JSON.stringify(result));
  } finally {
    try {
      run("docker", ["stop", stagingApiContainer], { timeout: 60000 });
    } catch {
      // Keep the acceptance failure focused on the evidence result.
    }
  }
};

await main().catch((error) => {
  console.error(scrub(error.stack ?? error.message));
  process.exitCode = 1;
});
