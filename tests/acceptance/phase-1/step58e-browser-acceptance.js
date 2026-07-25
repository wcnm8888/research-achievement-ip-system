/*
 * Step 58E local Docker production-like browser acceptance.
 *
 * Authentication is supplied by a transient local proxy outside this file. Do
 * not write session cookies, passwords, tokens, or connection strings here.
 */
/* eslint-disable-next-line @typescript-eslint/no-unused-expressions */
async page => {
  const currentUrl = page.url();
  const baseUrl = currentUrl.startsWith("http")
    ? currentUrl.split("/").slice(0, 3).join("/")
    : "http://127.0.0.1:19081";
  const modeByPort = {
    19081: "reviewer",
    19082: "sibling",
    19083: "manager",
    19084: "reader",
  };
  const portMatch = baseUrl.match(/:(\d+)$/);
  let mode = modeByPort[portMatch?.[1]] || "reviewer";
  try {
    mode = await page.evaluate(
      fallbackMode => window.localStorage.getItem("step58eMode") || fallbackMode,
      mode,
    );
  } catch {
    // Some initial browser documents disallow localStorage. The proxy port is
    // the authoritative role boundary for this acceptance script.
  }
  const ids = {
    approveAchievement: "58e00000-0000-4000-8000-000000000401",
    rejectAchievement: "58e00000-0000-4000-8000-000000000402",
    readonlyAchievement: "58e00000-0000-4000-8000-000000000403",
    noTaskAchievement: "58e00000-0000-4000-8000-000000000404",
    gateAchievement: "58e00000-0000-4000-8000-000000000405",
    approveFee: "58e00000-0000-4000-8000-000000000501",
    rejectFee: "58e00000-0000-4000-8000-000000000502",
    readonlyFee: "58e00000-0000-4000-8000-000000000503",
    noTaskFee: "58e00000-0000-4000-8000-000000000504",
    gateFee: "58e00000-0000-4000-8000-000000000505",
    approveTask: "58e00000-0000-4000-8000-000000000701",
    rejectTask: "58e00000-0000-4000-8000-000000000703",
    readonlyCancelledTask: "58e00000-0000-4000-8000-000000000706",
  };

  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", message => {
    const text = message.text();
    if (message.type() === "error" && !text.includes("Failed to load resource")) {
      consoleErrors.push(text);
    }
  });
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".app-sider", { timeout: 15000 });
  await page.locator(".ant-menu-item").nth(3).click();
  await page.waitForSelector(".fee-table", { timeout: 15000 });

  const apiGet = async path =>
    page.evaluate(async inputPath => {
      const response = await fetch(inputPath, { credentials: "include" });
      const body = await response.text();
      return {
        status: response.status,
        ok: response.ok,
        body: body ? JSON.parse(body) : null,
      };
    }, path);

  const fetchTaskItems = async (feeId, status) => {
    const result = await apiGet(
      `/api/workflow/tasks/my?status=${status}&targetType=FEE_RECORD&feeRecordId=${feeId}`,
    );
    if (!result.ok) {
      throw new Error(`Task query failed for ${status}: HTTP ${result.status}`);
    }
    return result.body.items;
  };

  const waitForTaskStatus = async (feeId, status, taskId) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < 15000) {
      const items = await fetchTaskItems(feeId, status);
      if (items.some(task => task.id === taskId)) {
        return items;
      }
      await page.waitForTimeout(500);
    }
    throw new Error(`Task ${taskId} did not reach ${status} for fee ${feeId}.`);
  };

  const filterByAchievement = async achievementId => {
    await closeDetail();
    await page.locator(".fee-achievement-input input").fill(achievementId);
    await page.locator(".fee-filter-bar button.ant-btn-primary").first().click();
    await page.waitForTimeout(700);
  };

  const openDetailForFee = async (feeId, achievementId) => {
    await filterByAchievement(achievementId);
    const row = page.locator(`.fee-table tr:has-text("${feeId}")`).first();
    await row.waitFor({ state: "visible", timeout: 15000 });
    await row.locator("button").first().click();
    await page.waitForSelector(".fee-detail-drawer", { timeout: 15000 });
    await page.waitForTimeout(1200);
  };

  const closeDetail = async () => {
    const close = page.locator(".fee-detail-drawer .ant-drawer-close");
    if (await close.count()) {
      await close.click({ force: true });
      await page
        .locator(".fee-detail-drawer")
        .waitFor({ state: "hidden", timeout: 5000 })
        .catch(async () => {
          await page.keyboard.press("Escape");
          await page.waitForTimeout(500);
        });
    }
  };

  const countReviewButtons = async () => ({
    approve: await page.getByRole("button", { name: "Approve fee review" }).count(),
    reject: await page.getByRole("button", { name: "Reject fee review" }).count(),
  });

  const assertReviewButtons = async (label, expected) => {
    const buttons = await countReviewButtons();
    if (buttons.approve !== expected || buttons.reject !== expected) {
      throw new Error(
        `${label}: expected ${expected} approve/reject buttons, got ${JSON.stringify(buttons)}.`,
      );
    }
  };

  const assertTaskListSafe = async () => {
    const taskLists = page.locator(".fee-review-workflow-task-list");
    if ((await taskLists.count()) === 0) {
      return;
    }

    const taskText = await taskLists.first().innerText();
    const forbidden = [
      "storageKey",
      "checksum",
      "voucherNo",
      "rawPayload",
      "cookie",
      "token",
      "DATABASE_URL",
      "SESSION_SECRET",
    ].filter(value => taskText.includes(value));
    if (forbidden.length > 0) {
      throw new Error(`Workflow task section exposed forbidden metadata: ${forbidden.join(", ")}`);
    }

    const taskButtons = await taskLists.locator("button").count();
    if (taskButtons !== 0) {
      throw new Error("Workflow task cards must not expose create/edit/delete/complete buttons.");
    }
  };

  const assertNoTaskMutationEntrypoints = async () => {
    const drawerText = await page.locator(".fee-detail-drawer").innerText();
    const forbiddenLabels = [
      "Create workflow task",
      "Edit workflow task",
      "Delete workflow task",
      "Complete workflow task",
    ].filter(label => drawerText.includes(label));
    if (forbiddenLabels.length > 0) {
      throw new Error(`Unexpected workflow task mutation entrypoints: ${forbiddenLabels.join(", ")}`);
    }
  };

  const submitReview = async (feeId, kind) => {
    const buttonName = kind === "approve" ? "Approve fee review" : "Reject fee review";
    await page.getByRole("button", { name: buttonName }).click();
    await page.waitForSelector(".fee-form-drawer textarea", { timeout: 10000 });
    await page
      .locator(".fee-form-drawer textarea")
      .fill(`Step 58E browser ${kind}`);
    await page.locator(".fee-form-drawer .fee-form-actions .ant-btn-primary").click();
    await page.waitForTimeout(1500);
  };

  if (mode === "reviewer") {
    await openDetailForFee(ids.approveFee, ids.approveAchievement);
    await page.getByText(ids.approveTask).waitFor({ timeout: 15000 });
    await assertReviewButtons("reviewer approve fee", 1);
    await assertTaskListSafe();
    await assertNoTaskMutationEntrypoints();

    await submitReview(ids.approveFee, "approve");
    await assertReviewButtons("approved fee", 0);
    await waitForTaskStatus(ids.approveFee, "APPROVED", ids.approveTask);
    const approveHistory = await apiGet(`/api/fees/${ids.approveFee}/review-history`);
    if (!approveHistory.ok || approveHistory.body.length < 1) {
      throw new Error("Approved fee review history did not refresh.");
    }
    await closeDetail();

    await openDetailForFee(ids.rejectFee, ids.rejectAchievement);
    await page.getByText(ids.rejectTask).waitFor({ timeout: 15000 });
    await assertReviewButtons("reviewer reject fee", 1);
    await submitReview(ids.rejectFee, "reject");
    await assertReviewButtons("rejected fee", 0);
    await waitForTaskStatus(ids.rejectFee, "REJECTED", ids.rejectTask);
    const rejectHistory = await apiGet(`/api/fees/${ids.rejectFee}/review-history`);
    if (!rejectHistory.ok || rejectHistory.body.length < 1) {
      throw new Error("Rejected fee review history did not refresh.");
    }
    await closeDetail();

    await openDetailForFee(ids.noTaskFee, ids.noTaskAchievement);
    await assertReviewButtons("reviewer no pending task fee", 0);
    const noTaskPending = await fetchTaskItems(ids.noTaskFee, "PENDING");
    if (noTaskPending.length !== 0) {
      throw new Error("No-task fee unexpectedly has a pending task for reviewer.");
    }
    await assertNoTaskMutationEntrypoints();
  } else if (mode === "sibling") {
    await openDetailForFee(ids.readonlyFee, ids.readonlyAchievement);
    await page.getByText(ids.readonlyCancelledTask).waitFor({ timeout: 15000 });
    await assertReviewButtons("sibling cancelled task fee", 0);
    const cancelledTasks = await fetchTaskItems(ids.readonlyFee, "CANCELLED");
    if (!cancelledTasks.some(task => task.id === ids.readonlyCancelledTask)) {
      throw new Error("Sibling cancelled task was not returned as CANCELLED.");
    }
    await assertTaskListSafe();
    await assertNoTaskMutationEntrypoints();
  } else if (mode === "manager" || mode === "reader") {
    await openDetailForFee(ids.gateFee, ids.gateAchievement);
    await assertReviewButtons(`${mode} pending fee`, 0);
    if ((await page.locator(".fee-review-workflow-task-list").count()) !== 0) {
      throw new Error(`${mode} must not see fee review workflow task cards.`);
    }
    await assertNoTaskMutationEntrypoints();
  } else {
    throw new Error(`Unknown Step 58E browser acceptance mode: ${mode}`);
  }

  if (consoleErrors.length > 0 || pageErrors.length > 0) {
    throw new Error(JSON.stringify({ consoleErrors, pageErrors }));
  }

  return { mode, status: "passed" };
}
