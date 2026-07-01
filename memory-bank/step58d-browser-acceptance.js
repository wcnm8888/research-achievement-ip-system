/*
 * Step 58D local Docker production-like browser acceptance.
 * Transient session cookies are injected by the invoking shell and must never be
 * written into this file or evidence.
 */
/* eslint-disable-next-line @typescript-eslint/no-unused-expressions */
async page => {
  const baseUrl = "http://127.0.0.1:18081/";
  const mode = await page.evaluate(() => window.localStorage.getItem("step58dMode") || "reviewer");
  const ids = {
    pendingAchievement: "58000000-0000-4000-8000-000000000401",
    completedAchievement: "58000000-0000-4000-8000-000000000402",
    pendingFee: "58000000-0000-4000-8000-000000000501",
    completedFee: "58000000-0000-4000-8000-000000000502",
    pendingTask: "58000000-0000-4000-8000-000000000701",
    approvedTask: "58000000-0000-4000-8000-000000000702",
    cancelledTask: "58000000-0000-4000-8000-000000000703",
  };

  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", message => {
    const text = message.text();
    if (
      message.type() === "error" &&
      !text.includes("status of 403 (Forbidden)")
    ) {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", error => pageErrors.push(error.message));

  const authCheck = page.waitForResponse(response =>
    response.url().includes("/api/auth/me") && response.status() === 200,
  );
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await authCheck;
  await page.locator(".ant-menu-item").nth(3).click();
  await page.waitForSelector(".fee-table");

  const filterByAchievement = async achievementId => {
    await page.locator(".fee-achievement-input input").fill(achievementId);
    await Promise.all([
      page.waitForResponse(response =>
        response.url().includes("/api/fees") && response.request().method() === "GET",
      ),
      page.locator(".fee-filter-bar button.ant-btn-primary").first().click(),
    ]);
    await page.waitForTimeout(300);
  };

  const openDetailForFee = async (feeId, achievementId) => {
    await filterByAchievement(achievementId);
    const row = page.locator(`.fee-table tr:has-text("${feeId}")`).first();
    await row.waitFor({ state: "visible", timeout: 10000 });
    await Promise.all([
      page.waitForResponse(response =>
        response.url().includes(`/api/fees/${feeId}`) &&
        response.request().method() === "GET" &&
        response.status() === 200,
      ),
      row.locator("button").first().click(),
    ]);
    await page.waitForSelector(".fee-detail-drawer");
    await page.waitForTimeout(1200);
  };

  const countReviewButtons = async () => ({
    approve: await page.getByRole("button", { name: "Approve fee review" }).count(),
    reject: await page.getByRole("button", { name: "Reject fee review" }).count(),
  });

  const assertNoReviewButtons = async label => {
    const buttons = await countReviewButtons();
    if (buttons.approve !== 0 || buttons.reject !== 0) {
      throw new Error(`${label}: expected no executable fee review buttons.`);
    }
  };

  const assertTaskListSafe = async () => {
    const taskText = await page.locator(".fee-review-workflow-task-list").innerText();
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
    const taskButtons = await page.locator(".fee-review-workflow-task-list button").count();
    if (taskButtons !== 0) {
      throw new Error("Workflow task cards must remain readonly.");
    }
  };

  if (mode === "reviewer") {
    await openDetailForFee(ids.pendingFee, ids.pendingAchievement);
    await page.getByText(ids.pendingTask).waitFor({ timeout: 10000 });
    const buttons = await countReviewButtons();
    if (buttons.approve !== 1 || buttons.reject !== 1) {
      throw new Error("Reviewer with pending FEE_REVIEW task should see approve/reject buttons.");
    }
    await assertTaskListSafe();

    await page.getByRole("button", { name: "Approve fee review" }).click();
    await page.waitForSelector(".fee-form-drawer textarea");
    await page.locator(".fee-form-drawer textarea").fill("Step 58D browser approval");
    await Promise.all([
      page.waitForResponse(response =>
        response.url().includes(`/api/fees/${ids.pendingFee}/review/approve`) &&
        response.request().method() === "POST" &&
        response.status() === 200,
      ),
      page.locator(".fee-form-drawer .fee-form-actions .ant-btn-primary").click(),
    ]);
    await page.waitForResponse(response =>
      response.url().includes(`/api/fees/${ids.pendingFee}/review-history`) &&
      response.status() === 200,
    );
    await page.waitForTimeout(1500);
    await assertNoReviewButtons("approved pending fee");
    const historyRows = await page
      .locator(".fee-detail-drawer .fee-review-history-table tbody tr.ant-table-row")
      .count();
    if (historyRows < 1) {
      throw new Error("Expected review history row after browser approval.");
    }

    await page.locator(".fee-detail-drawer .ant-drawer-close").click({ force: true });
    await openDetailForFee(ids.completedFee, ids.completedAchievement);
    await page.getByText(ids.approvedTask).waitFor({ timeout: 10000 });
    await assertNoReviewButtons("completed fee approved task");
    await assertTaskListSafe();
  } else if (mode === "sibling") {
    await openDetailForFee(ids.completedFee, ids.completedAchievement);
    await page.getByText(ids.cancelledTask).waitFor({ timeout: 10000 });
    await assertNoReviewButtons("completed fee cancelled task");
    await assertTaskListSafe();
  } else if (mode === "manager" || mode === "reader") {
    await openDetailForFee(ids.pendingFee, ids.pendingAchievement);
    await assertNoReviewButtons(`${mode} pending fee`);
  } else {
    throw new Error(`Unknown Step 58D browser acceptance mode: ${mode}`);
  }

  if (consoleErrors.length > 0 || pageErrors.length > 0) {
    throw new Error(JSON.stringify({ consoleErrors, pageErrors }));
  }

  return { mode, status: "passed" };
}
