/* global window, document */
/*
 * Step 21B Playwright/browser acceptance artifact.
 * The Playwright CLI consumes this top-level async arrow expression directly.
 */
/* eslint-disable-next-line @typescript-eslint/no-unused-expressions */
async page => {
  const baseUrl = "http://127.0.0.1:5173/";
  const demoUserId = "40000000-0000-4000-8000-000000000002";
  const achievementId = "20000000-0000-4000-8000-000000000021";
  const attachmentId = "30000000-0000-4000-8000-000000000021";
  let detailMode = "success";
  const requests = [];
  const consoleErrors = [];
  const pageErrors = [];

  const achievementListItem = {
    id: achievementId,
    type: "PAPER",
    status: "ARCHIVED",
    secretLevel: "INTERNAL",
    departmentId: "50000000-0000-4000-8000-000000000001",
    ownerUserId: demoUserId,
    title: "Step 21B 附件详情验收成果",
    createdAt: "2026-06-21T08:00:00.000Z",
    updatedAt: "2026-06-21T09:00:00.000Z",
    submittedAt: "2026-06-21T08:30:00.000Z",
    archivedAt: "2026-06-21T09:30:00.000Z",
    voidedAt: null,
    isRestricted: false,
    isRedacted: false,
  };
  const achievementDetail = {
    ...achievementListItem,
    submittedById: demoUserId,
    updatedById: demoUserId,
    archivedById: demoUserId,
    voidedById: null,
    version: 1,
    createdById: demoUserId,
    paperDetail: {
      doi: "10.21/step21b",
      journal: "Readonly Metadata Journal",
      issnCn: "ISSN-21B",
      publishYear: 2026,
      includedType: "SCI",
      impactFactor: "5.1",
      partition: "Q1",
      abstract: "Step 21B readonly detail acceptance.",
    },
    patentDetail: null,
    softwareCopyrightDetail: null,
    contributors: [],
  };
  const attachmentListItem = {
    id: attachmentId,
    relationType: "ACHIEVEMENT",
    relationId: achievementId,
    fileName: "step21b-detail-metadata.pdf",
    version: 4,
    uploaderId: demoUserId,
    secretLevel: "INTERNAL",
    status: "ACTIVE",
    createdAt: "2026-06-21T10:00:00.000Z",
    updatedAt: "2026-06-21T10:10:00.000Z",
    archivedAt: null,
  };
  const attachmentDetail = {
    ...attachmentListItem,
    fileName: "step21b-detail-success.pdf",
  };

  const json = (body, status = 200) => ({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });

  page.on("request", request => {
    requests.push({ method: request.method(), url: request.url() });
  });
  page.on("console", message => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.route("**/api/**", async route => {
    const request = route.request();
    const requestUrl = request.url();
    const path = requestUrl.split("?")[0].replace(/^https?:\/\/[^/]+/, "");
    if (request.method() !== "GET") {
      await route.fulfill(json({ message: "Step 21B unexpected non-GET request" }, 405));
      return;
    }
    if (path === "/api/achievements") {
      await route.fulfill(json({ items: [achievementListItem], total: 1, page: 1, pageSize: 20 }));
      return;
    }
    if (path === `/api/achievements/${achievementId}`) {
      await route.fulfill(json(achievementDetail));
      return;
    }
    if (path === `/api/achievements/${achievementId}/attachments`) {
      await route.fulfill(json([attachmentListItem]));
      return;
    }
    if (path === `/api/achievements/${achievementId}/attachments/${attachmentId}`) {
      if (detailMode === "403") {
        await route.fulfill(json({ message: "Forbidden detail metadata" }, 403));
        return;
      }
      if (detailMode === "404") {
        await route.fulfill(json({ message: "Missing detail metadata" }, 404));
        return;
      }
      if (detailMode === "500") {
        await route.fulfill(json({ message: "Server unavailable" }, 500));
        return;
      }
      await route.fulfill(json(attachmentDetail));
      return;
    }
    await route.fulfill(json({ message: `Unexpected API route ${path}` }, 404));
  });

  const resetRequests = () => {
    requests.length = 0;
  };
  const getApiRequests = () => requests.filter(request => request.url.includes("/api/"));
  const getDetailRequests = () =>
    getApiRequests().filter(request => request.url.includes(`/attachments/${attachmentId}`));
  const clickAchievements = async () => {
    await page.getByRole("menuitem", { name: "成果管理" }).click();
    await page.waitForTimeout(250);
  };
  const openDetail = async () => {
    await page.getByRole("button", { name: "查看详情" }).click();
    await page.getByText("附件 metadata", { exact: true }).waitFor({ timeout: 5000 });
    await page.getByText("step21b-detail-metadata.pdf").waitFor({ timeout: 5000 });
  };
  const closeMetadataDetailIfOpen = async () => {
    const button = page.getByRole("button", { name: "关闭详情" });
    if (await button.count()) {
      await button.first().click();
      await page.waitForTimeout(150);
    }
  };
  const openMetadataDetail = async () => {
    await page.getByRole("button", { name: "查看 metadata 详情" }).click();
  };

  await page.goto(baseUrl);
  await page.evaluate(() => window.localStorage.removeItem("research-ip.demo-user-id"));
  resetRequests();
  await page.reload({ waitUntil: "domcontentloaded" });
  await clickAchievements();
  await page.getByText("当前没有 X-Demo-User-Id").waitFor({ timeout: 5000 });
  await page.waitForTimeout(300);
  const noUserApiRequests = getApiRequests();

  resetRequests();
  const demoUserInput = page.getByPlaceholder("输入 X-Demo-User-Id");
  await demoUserInput.fill(demoUserId);
  await demoUserInput.press("Enter");
  await page.getByText("Step 21B 附件详情验收成果").waitFor({ timeout: 5000 });
  const listRequests = [...getApiRequests()];
  await openDetail();
  const beforeDetailClickRequests = getDetailRequests();

  detailMode = "success";
  resetRequests();
  await openMetadataDetail();
  await page.getByText("step21b-detail-success.pdf").waitFor({ timeout: 5000 });
  const successRequests = [...getApiRequests()];
  const successText = await page.locator("body").innerText();

  const assertErrorState = async (mode, expectedText) => {
    detailMode = mode;
    await closeMetadataDetailIfOpen();
    resetRequests();
    await openMetadataDetail();
    await page.getByText(expectedText).waitFor({ timeout: 5000 });
    return { mode, expectedText, requests: [...getApiRequests()] };
  };
  const forbiddenState = await assertErrorState("403", "当前角色无附件 detail metadata 读取权限");
  const missingState = await assertErrorState("404", "附件 detail metadata 不存在或不可用");
  const serverState = await assertErrorState("500", "附件 detail metadata 服务暂不可用");

  detailMode = "success";
  await closeMetadataDetailIfOpen();
  resetRequests();
  await page.setViewportSize({ width: 390, height: 900 });
  await openMetadataDetail();
  await page.getByText("step21b-detail-success.pdf").waitFor({ timeout: 5000 });
  const responsiveMetrics = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    doc: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
    inner: window.innerWidth,
    overflow:
      document.documentElement.scrollWidth > window.innerWidth ||
      document.body.scrollWidth > window.innerWidth,
  }));
  const mobileRequests = [...getApiRequests()];

  const allApiRequests = requests.filter(request => request.url.includes("/api/"));
  const allNetworkUrls = requests.map(request => request.url);
  const forbiddenRequestMatches = allNetworkUrls.filter(
    url =>
      url.includes("/download") ||
      url.includes("/fees/warnings") ||
      url.toLowerCase().includes("search_logs") ||
      url.toLowerCase().includes("meilisearch") ||
      url.toLowerCase().includes("settings/config"),
  );
  const nonGetApiRequests = allApiRequests.filter(request => request.method !== "GET");

  const actionEntries = await page.evaluate(() => {
    const forbidden = [
      "上传",
      "下载",
      "删除",
      "归档",
      "版本变更",
      "保存",
      "同步",
      "导入",
      "导出",
      "upload",
      "download",
      "delete",
      "archive",
      "version-change",
      "save",
      "sync",
      "import",
      "export",
    ];
    return [...document.querySelectorAll("button,a")]
      .map(element => (element.textContent || "").trim())
      .filter(Boolean)
      .filter(text => forbidden.some(word => text.toLowerCase().includes(word.toLowerCase())));
  });

  const safeFieldLeaks = [
    "storageKey",
    "checksum",
    "objectBody",
    "downloadUrl",
    "raw storage path",
    "attachments/ACHIEVEMENT",
  ].filter(token => successText.includes(token));

  const expectedMockConsoleErrors = consoleErrors.filter(
    text =>
      text.includes("403") ||
      text.includes("404") ||
      text.includes("500") ||
      text.includes("/attachments/"),
  );
  const unexpectedConsoleErrors = consoleErrors.filter(
    text => !expectedMockConsoleErrors.includes(text),
  );

  return {
    mockAcceptance: "frontend/API boundary only; not live backend/database smoke",
    noUser: {
      apiRequestCount: noUserApiRequests.length,
      attachmentRequestCount: noUserApiRequests.filter(request => request.url.includes("/attachments")).length,
      requests: noUserApiRequests,
    },
    demoSuccess: {
      listRequests,
      beforeDetailClickDetailRequestCount: beforeDetailClickRequests.length,
      successRequests,
      detailRequestCount: successRequests.filter(request => request.url.includes(`/attachments/${attachmentId}`)).length,
      hasSuccessFile: successText.includes("step21b-detail-success.pdf"),
      safeFieldLeaks,
    },
    errorStates: [forbiddenState, missingState, serverState],
    requestScan: {
      nonGetApiRequests,
      forbiddenRequestMatches,
      mobileRequests,
    },
    entryScan: { actionEntries },
    responsive390: responsiveMetrics,
    console: {
      consoleErrors,
      expectedMockConsoleErrors,
      unexpectedConsoleErrors,
      pageErrors,
    },
  };
}
