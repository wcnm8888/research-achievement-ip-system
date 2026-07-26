/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI consumes this top-level async function expression. */
async (page) => {
  const currentUrl = page.url();
  const readParam = (name) => {
    const match = currentUrl.match(new RegExp(`[?&]${name}=([^&]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  };
  const mode = readParam("mode") ?? "desktop";
  const viewports = {
    desktop: { width: 1440, height: 900 },
    tablet: { width: 1024, height: 768 },
    mobile: { width: 390, height: 844 },
  };
  const viewport = viewports[mode] ?? viewports.desktop;
  const fixedResearcherId = "40000000-0000-4000-8000-000000000001";
  const authUser = {
    id: fixedResearcherId,
    email: "demo.researcher@example.invalid",
    name: "Demo Researcher",
    departmentId: "10000000-0000-4000-8000-000000000002",
    roleCodes: ["RESEARCHER"],
    permissionCodes: [
      "achievement:create",
      "achievement:read_own",
      "achievement:update_own",
      "achievement:submit",
      "user_context:read",
      "attachment:read_metadata",
    ],
    scopedDepartmentIds: ["10000000-0000-4000-8000-000000000002"],
  };
  const evidence = {
    mode,
    viewport,
    consoleErrors: [],
    pageErrors: [],
    apiRequests: [],
    achievementId: null,
    created: false,
    refreshed: false,
    submitted: false,
    statusAfterSubmit: null,
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
        body: JSON.stringify({ user: authUser }),
      });
      return;
    }

    const targetPath = requestUrl.replace(/^https?:\/\/[^/]+/, "");
    const upstream = await route.fetch({
      url: `http://127.0.0.1:14002${targetPath}`,
      headers: {
        ...request.headers(),
        "x-demo-user-id": fixedResearcherId,
      },
    });
    const blockedHeaders = new Set(["content-encoding", "content-length", "transfer-encoding", "set-cookie"]);
    const headers = Object.fromEntries(
      Object.entries(upstream.headers()).filter(([key]) => !blockedHeaders.has(key.toLowerCase())),
    );
    await route.fulfill({
      status: upstream.status(),
      headers,
      body: await upstream.body(),
    });
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      evidence.consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => evidence.pageErrors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes("/api/")) {
      evidence.apiRequests.push({ method: request.method(), url: request.url() });
    }
  });

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const menuCount = await page.getByRole("menuitem").count();
  if (menuCount < 2) {
    const bodyText = await page.locator("body").innerText();
    throw new Error(`Authenticated navigation is unavailable. menuCount=${menuCount}; body=${bodyText.slice(0, 800)}`);
  }
  await page.getByRole("menuitem").nth(1).click();
  await page.locator(".achievement-page").waitFor({ state: "visible", timeout: 30000 });

  if (mode === "desktop") {
    const title = `VS Achievement Draft Browser ${Date.now()}`;
    const createButton = page.locator(".achievement-page button.ant-btn-primary").first();
    await createButton.click();
    const drawer = page.locator(".achievement-form-drawer");
    await drawer.waitFor({ state: "visible", timeout: 10000 });

    await drawer.locator("input:not([readonly])").first().fill(title);
    await drawer.locator(".contributor-row input:not([readonly])").first().fill("VS Researcher");
    const createRequest = page.waitForResponse(
      (response) => response.url().endsWith("/api/achievements") && response.request().method() === "POST",
    );
    await drawer.locator("button").filter({ hasText: "创建草稿" }).click();
    const createResponse = await createRequest;
    const createBody = await createResponse.json();
    evidence.achievementId = createBody.id;
    evidence.created = createResponse.ok() && Boolean(evidence.achievementId);
    await page.waitForTimeout(500);

    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("menuitem").nth(1).click();
    await page.locator(".achievement-page").waitFor({ state: "visible", timeout: 30000 });
    await page.getByText(title, { exact: true }).waitFor({ timeout: 30000 });
    evidence.refreshed = true;

    const row = page.getByRole("row").filter({ hasText: title });
    await row.getByRole("button").last().click();
    const detailDrawer = page.locator(".achievement-detail-drawer");
    await detailDrawer.waitFor({ state: "visible", timeout: 10000 });
    const submitButton = detailDrawer.locator("button.ant-btn-primary").first();
    await submitButton.click();
    const submitRequest = page.waitForResponse(
      (response) => response.url().includes(`/api/achievements/${evidence.achievementId}/submit`) && response.request().method() === "POST",
    );
    await page.locator(".ant-modal-footer button.ant-btn-primary").click();
    const submitResponse = await submitRequest;
    evidence.submitted = submitResponse.ok();
    await page.waitForTimeout(500);
    const refreshedDetail = await page.evaluate(async (achievementId) => {
      const response = await fetch(`/api/achievements/${achievementId}`);
      return response.json();
    }, evidence.achievementId);
    evidence.statusAfterSubmit = refreshedDetail.status ?? null;
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
