/* global document, fetch, window */
/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI consumes this top-level async function expression. */
async (page) => {
  const currentUrl = page.url();
  const readParam = (name) => {
    const match = currentUrl.match(new RegExp(`[?&;]${name}=([^&;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  };

  const mode = readParam("mode") ?? "desktop";
  const action = readParam("action") ?? "inspect";
  const viewports = {
    desktop: { width: 1440, height: 900 },
    tablet: { width: 1024, height: 768 },
    mobile: { width: 390, height: 844 },
  };
  const viewport = viewports[mode] ?? viewports.desktop;
  const reviewerId = readParam("reviewerId");
  const apiPort = readParam("apiPort") ?? "14002";
  if (!reviewerId) throw new Error("reviewerId is required for browser acceptance.");

  const evidence = {
    mode,
    action,
    viewport,
    consoleErrors: [],
    pageErrors: [],
    apiRequests: [],
    apiResponses: [],
    taskId: null,
    detailOpened: false,
    linkedAchievementOpened: false,
    actionCompleted: false,
    refreshedAfterAction: false,
    emptyRejectBlocked: false,
    overflow: null,
  };

  await page.setViewportSize(viewport);
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const requestUrl = request.url();
    if (requestUrl.endsWith("/api/auth/me") && request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: reviewerId,
            email: "synthetic.reviewer@example.invalid",
            name: "Synthetic Department Reviewer",
            departmentId: "synthetic",
            roleCodes: ["RESEARCH_SECRETARY"],
            permissionCodes: ["achievement:review_department", "user_context:read", "achievement:read_department"],
            scopedDepartmentIds: [],
          },
        }),
      });
      return;
    }

    const targetPath = requestUrl.replace(/^https?:\/\/[^/]+/, "");
    const upstream = await route.fetch({
      url: `http://127.0.0.1:${apiPort}${targetPath}`,
      headers: {
        ...request.headers(),
        "x-demo-user-id": reviewerId,
      },
    });
    const blockedHeaders = new Set(["content-encoding", "content-length", "transfer-encoding", "set-cookie"]);
    const headers = Object.fromEntries(
      Object.entries(upstream.headers()).filter(([key]) => !blockedHeaders.has(key.toLowerCase())),
    );
    await route.fulfill({ status: upstream.status(), headers, body: await upstream.body() });
  });

  page.on("console", (message) => {
    if (message.type() === "error") evidence.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => evidence.pageErrors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes("/api/")) {
      evidence.apiRequests.push({ method: request.method(), url: request.url() });
    }
  });
  page.on("response", (response) => {
    if (response.url().includes("/api/")) {
      evidence.apiResponses.push({ method: response.request().method(), url: response.url(), status: response.status() });
    }
  });

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.locator(".app-content").waitFor({ timeout: 30000 });

  const visibleMenuItems = page.locator("li.ant-menu-item:visible");
  if ((await visibleMenuItems.count()) < 3) {
    throw new Error(`Workflow navigation is unavailable. visibleMenuItems=${await visibleMenuItems.count()}`);
  }
  await visibleMenuItems.nth(2).click();

  const table = page.locator(".workflow-task-table");
  await table.waitFor({ timeout: 30000 });
  await page.waitForTimeout(2500);
  const rows = table.locator("tbody tr:not(.ant-table-measure-row):visible");
  if ((await rows.count()) === 0) {
    const bodyText = await page.locator("body").innerText();
    throw new Error(`Workflow task table has no visible rows. body=${bodyText.slice(0, 1200)} evidence=${JSON.stringify(evidence)}`);
  }
  evidence.taskId = await rows.first().getAttribute("data-row-key");
  await rows.first().click();
  await page.locator(".workflow-task-detail-drawer").waitFor({ state: "visible", timeout: 10000 });
  evidence.detailOpened = true;

  const linkedAchievementButton = page
    .locator(".workflow-task-detail-drawer .ant-drawer-body .ant-alert-action button.ant-btn-primary")
    .first();
  if (await linkedAchievementButton.count()) {
    await linkedAchievementButton.click();
    await page.locator(".achievement-detail-drawer").waitFor({ state: "visible", timeout: 10000 });
    evidence.linkedAchievementOpened = true;
    await page.locator(".achievement-detail-drawer .ant-drawer-close").click();
  }

  if (action === "approve" || action === "reject") {
    const actionButton = page
      .locator(
        action === "approve"
          ? ".workflow-task-detail-drawer .ant-drawer-extra button.ant-btn-primary"
          : ".workflow-task-detail-drawer .ant-drawer-extra button.ant-btn-dangerous",
      )
      .first();
    await actionButton.click();
    const modal = page.locator(".ant-modal");
    await modal.waitFor({ state: "visible", timeout: 10000 });
    const textArea = modal.locator("textarea");
    if (action === "reject") {
      await modal.locator(".ant-modal-footer button.ant-btn-primary").click();
      evidence.emptyRejectBlocked = await modal.isVisible();
      await textArea.fill("材料完整性已核验，审核驳回用于第二切片验收。");
    } else {
      await textArea.fill("部门审核通过，用于第二切片验收。");
    }
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/workflow/tasks/") && response.request().method() === "POST",
    );
    await modal.locator(".ant-modal-footer button.ant-btn-primary").click();
    const response = await responsePromise;
    evidence.actionCompleted = response.ok();
    await page.waitForTimeout(800);
    if (evidence.actionCompleted) {
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const refreshedTasks = await page.evaluate(async () => {
        const response = await fetch("/api/workflow/tasks/my?status=PENDING");
        return response.json();
      });
      evidence.refreshedAfterAction = !refreshedTasks.items?.some((task) => task.id === evidence.taskId);
    }
  }

  evidence.overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    hasHorizontalOverflow:
      document.body.scrollWidth > window.innerWidth || document.documentElement.scrollWidth > window.innerWidth,
  }));
  return evidence;
}
