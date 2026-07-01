/*
 * Step 57D local Docker production-like browser acceptance.
 * The transient session cookie is set by the invoking shell through
 * playwright-cli cookie-set and must never be written into this file or evidence.
 */
/* eslint-disable-next-line @typescript-eslint/no-unused-expressions */
async page => {
  const baseUrl = "http://127.0.0.1:18081/";
  const feeId = "57000000-0000-4000-8000-000000000510";
  const achievementId = "57000000-0000-4000-8000-000000000410";
  const emptyFeeId = "57000000-0000-4000-8000-000000000511";
  const emptyAchievementId = "57000000-0000-4000-8000-000000000411";

  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", message => {
    const text = message.text();
    if (
      message.type() === "error" &&
      !text.includes("/api/workflow/tasks/my?status=PENDING") &&
      !text.includes(`/api/fees/${emptyFeeId}/review-history`) &&
      !text.includes("status of 403 (Forbidden)") &&
      !text.includes("status of 500 (Internal Server Error)")
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

  const filterByAchievement = async id => {
    await page.locator(".fee-achievement-input input").fill(id);
    await Promise.all([
      page.waitForResponse(response =>
        response.url().includes("/api/fees") &&
        response.request().method() === "GET",
      ),
      page.locator(".fee-filter-bar button.ant-btn-primary").first().click(),
    ]);
    await page.waitForTimeout(300);
  };

  const openDetailForFee = async (targetFeeId, targetAchievementId) => {
    await filterByAchievement(targetAchievementId);
    const row = page.locator(`.fee-table tr:has-text("${targetFeeId}")`).first();
    await row.waitFor({ state: "visible", timeout: 10000 });
    const detailResponse = page.waitForResponse(response =>
      response.url().includes(`/api/fees/${targetFeeId}`) &&
      response.request().method() === "GET",
    );
    const historyResponse = page.waitForResponse(response =>
      response.url().includes(`/api/fees/${targetFeeId}/review-history`) &&
      response.request().method() === "GET",
    );
    await Promise.all([
      detailResponse,
      historyResponse,
      row.locator("button").first().click(),
    ]);
    await page.waitForSelector(".fee-detail-drawer");
    await page.waitForTimeout(500);
  };

  await openDetailForFee(feeId, achievementId);
  const emptyHistoryRows = await page
    .locator(".fee-detail-drawer .fee-review-history-table tbody tr.ant-table-row")
    .count();

  if (emptyHistoryRows !== 0) {
    throw new Error(`Expected empty review history before approval, got ${emptyHistoryRows}.`);
  }

  const reviewActionButtons = page.locator(".fee-detail-drawer .ant-alert-action button");
  if ((await reviewActionButtons.count()) < 2) {
    throw new Error("Expected approve/reject review action buttons in fee detail.");
  }
  await reviewActionButtons.first().click();
  await page.waitForSelector(".fee-form-drawer textarea");
  await page.locator(".fee-form-drawer textarea").fill("Step 57D browser approval history");
  await Promise.all([
    page.waitForResponse(response =>
      response.url().includes(`/api/fees/${feeId}/review/approve`) &&
      response.request().method() === "POST" &&
      response.status() === 200,
    ),
    page.locator(".fee-form-drawer .fee-form-actions .ant-btn-primary").click(),
  ]);
  await page.waitForResponse(response =>
    response.url().includes(`/api/fees/${feeId}/review-history`) &&
    response.request().method() === "GET" &&
    response.status() === 200,
  );
  await page.waitForTimeout(800);

  const readyHistoryRows = await page
    .locator(".fee-detail-drawer .fee-review-history-table tbody tr.ant-table-row")
    .count();
  if (readyHistoryRows < 1) {
    throw new Error("Expected review history row after approval.");
  }

  const historyText = await page.locator(".fee-detail-drawer .fee-review-history-table").innerText();
  const forbidden = [
    "amount",
    "voucherNo",
    "storageKey",
    "checksum",
    "payload",
    "cookie",
    "token",
    "DATABASE_URL",
    "SESSION_SECRET",
  ].filter(value => historyText.includes(value));
  if (forbidden.length > 0) {
    throw new Error(`Review history table exposed forbidden fields: ${forbidden.join(", ")}`);
  }

  const historyButtons = await page
    .locator(".fee-detail-drawer .fee-review-history-table button")
    .count();
  if (historyButtons !== 0) {
    throw new Error("Review history table must remain readonly.");
  }

  await page.locator(".fee-form-drawer .ant-drawer-close").click();
  await page.waitForSelector(".fee-form-drawer", { state: "detached", timeout: 10000 });
  await page.route(`**/api/fees/${emptyFeeId}/review-history`, route =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Step 57D mocked history error" }),
    }),
  );
  await page.locator(".fee-detail-drawer .ant-drawer-close").click();
  await openDetailForFee(emptyFeeId, emptyAchievementId);
  await page
    .locator(".fee-detail-drawer")
    .getByText("审核历史暂时不可用，可重试")
    .waitFor({ timeout: 10000 });
  const errorAlertCount = await page
    .locator(".fee-detail-drawer")
    .getByText("审核历史暂时不可用，可重试")
    .count();

  if (consoleErrors.length > 0 || pageErrors.length > 0) {
    throw new Error(
      JSON.stringify({
        consoleErrors,
        pageErrors,
      }),
    );
  }

  return {
    emptyHistoryRows,
    readyHistoryRows,
    historyButtons,
    errorAlertCount,
    forbiddenFieldLeak: forbidden,
  };
}
