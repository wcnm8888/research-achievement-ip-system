/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI consumes this top-level async function expression. */
async (page) => {
  const evidence = {
    searchRequests: [],
    noDemoSearchRequests: [],
    invalidDepartmentSearchRequests: [],
    nonGetRequests: [],
    forbiddenRequests: [],
    consoleErrors: [],
    pageErrors: [],
    parsedTargetTypes: [],
    repeatedTargetTypesRequest: null,
    overflow390: null,
  };

  const forbiddenPatterns = [
    /search_logs/i,
    /meilisearch/i,
    /external[-_/]?sync/i,
    /settings\/config/i,
    /fees\/warnings/i,
    /attachments/i,
    /upload/i,
    /download/i,
    /fee[-_/]?write/i,
    /seed/i,
    /migrate/i,
    /import/i,
    /data[-_/]?(cleanup|clean-up)/i,
  ];

  const parseQueryValues = (url, key) => {
    const query = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
    return query
      .split("&")
      .filter(Boolean)
      .map((part) => part.split("="))
      .filter(([name]) => decodeURIComponent(name) === key)
      .map(([, value = ""]) => decodeURIComponent(value));
  };

  const recordRequest = (request) => {
    const url = request.url();
    const method = request.method();
    const entry = { method, url };

    if (url.includes("/api/search")) {
      evidence.searchRequests.push(entry);
    }

    if (url.includes("/api/") && method !== "GET") {
      evidence.nonGetRequests.push(entry);
    }

    if (url.includes("/api/") && forbiddenPatterns.some((pattern) => pattern.test(url))) {
      evidence.forbiddenRequests.push(entry);
    }
  };

  page.on("request", recordRequest);
  page.on("console", (message) => {
    if (message.type() === "error") {
      evidence.consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    evidence.pageErrors.push(error.message);
  });

  await page.context().addInitScript(() => {
    window.localStorage.removeItem("research-ip.demo-user-id");
  });

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method();

    if (method !== "GET") {
      await route.fulfill({
        status: 405,
        contentType: "application/json",
        body: JSON.stringify({ message: "mock rejects non-GET" }),
      });
      return;
    }

    if (url.includes("/api/search")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              targetType: "ACHIEVEMENT",
              id: "achievement-step24b",
              type: "PATENT",
              status: "ARCHIVED",
              departmentId: "10000000-0000-4000-8000-000000000002",
              secretLevel: "INTERNAL",
              title: "Step 24B route mock achievement",
              identifiers: { patentApplicationNo: "CN202624B" },
              redacted: false,
              createdAt: "2026-06-01T00:00:00.000Z",
              updatedAt: "2026-06-21T00:00:00.000Z",
            },
            {
              targetType: "FEE_RECORD",
              id: "fee-step24b",
              achievementId: "achievement-step24b",
              departmentId: "10000000-0000-4000-8000-000000000002",
              feeType: "PATENT_ANNUAL",
              payStatus: "PENDING",
              dueDate: "2026-07-01T00:00:00.000Z",
              paidDate: null,
              createdAt: "2026-06-01T00:00:00.000Z",
              updatedAt: "2026-06-21T00:00:00.000Z",
            },
          ],
          total: 2,
        }),
      });
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ message: "unexpected mocked API route" }),
    });
  });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });

  await page.locator(".ant-menu-item").nth(4).click();
  await page.waitForTimeout(300);
  evidence.noDemoSearchRequests = evidence.searchRequests.filter((request) =>
    request.url.includes("/api/search"),
  );

  await page.getByPlaceholder("输入 X-Demo-User-Id").fill("40000000-0000-4000-8000-000000000002");
  await Promise.all([
    page.waitForRequest((request) => request.url().includes("/api/search")),
    page.locator(".demo-user-input .ant-input-search-button").click({ force: true }),
  ]);

  const baselineSearchCount = evidence.searchRequests.length;

  const targetSelect = page.locator(".search-target-select .ant-select-selector");
  await targetSelect.click();
  await page
    .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option[title="成果"]')
    .click();
  await page
    .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option[title="费用"]')
    .click();
  await page.keyboard.press("Escape");
  await Promise.all([
    page.waitForRequest((request) => request.url().includes("/api/search")),
    page.locator(".search-filter-bar button.ant-btn-primary").last().click({ force: true }),
  ]);

  const multiTargetRequest = evidence.searchRequests
    .slice(baselineSearchCount)
    .find((request) => {
      const targetTypes = parseQueryValues(request.url, "targetTypes");
      return targetTypes.includes("ACHIEVEMENT") && targetTypes.includes("FEE_RECORD");
    });

  evidence.repeatedTargetTypesRequest = multiTargetRequest;
  evidence.parsedTargetTypes = multiTargetRequest
    ? parseQueryValues(multiTargetRequest.url, "targetTypes")
    : [];

  const invalidBaselineCount = evidence.searchRequests.length;
  await page.getByPlaceholder("部门 ID（UUID）").fill("not-a-uuid");
  await page.locator(".search-filter-bar button.ant-btn-primary").last().click();
  await page.waitForTimeout(300);
  evidence.invalidDepartmentSearchRequests = evidence.searchRequests.slice(invalidBaselineCount);

  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(300);
  evidence.overflow390 = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    doc: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
    inner: window.innerWidth,
    overflow:
      document.body.scrollWidth > window.innerWidth ||
      document.documentElement.scrollWidth > window.innerWidth,
  }));

  return evidence;
}
