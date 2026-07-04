/*
 * Step 69G local production-like Web acceptance.
 *
 * Authentication is supplied by a local harness outside this file. Do not write
 * raw session cookies, passwords, tokens, or connection strings here.
 */
/* eslint-disable-next-line @typescript-eslint/no-unused-expressions */
async page => {
  const currentUrl = page.url();
  const localHttp = ["http", "://127.0.0.1"].join("");
  const baseUrl = currentUrl.startsWith("http")
    ? currentUrl.split("/").slice(0, 3).join("/")
    : [localHttp, "19481"].join(":");
  const portMatch = baseUrl.match(/:(\d+)$/);
  const mode = portMatch?.[1] === "19482" ? "limited" : "admin";
  const suffixMatch = currentUrl.match(/[?&]s=([^&]+)/);
  const suffix = suffixMatch ? suffixMatch[1] : "S69G_BROWSER";
  const lower = suffix.toLowerCase();
  const titlePrefix = `Step 69G Synthetic ${suffix}`;
  const departmentCode = `S69G_DEPT_${suffix}`;
  const ownerA = `step69g-owner-a-${lower}@example.invalid`;
  const ownerB = `step69g-owner-b-${lower}@example.invalid`;
  const contributorA = `step69g-contributor-a-${lower}@example.invalid`;
  const contributorB = `step69g-contributor-b-${lower}@example.invalid`;
  const registrationA = `S69G-SW-${suffix}-A`;
  const registrationB = `S69G-SW-${suffix}-B`;
  const registrationMixed = `S69G-SW-${suffix}-MIXED`;
  const normalizedA = `S69GSW${suffix}A`;
  const normalizedB = `S69GSW${suffix}B`;
  const titleA = `${titlePrefix} Software A`;
  const titleB = `${titlePrefix} Software B`;

  const successCsv = [
    "type,title,ownerEmail,departmentCode,contributors,status,softwareRegistrationNo,softwareVersion,softwareType,publishDate,registerDate,runEnv",
    [
      "SOFTWARE_COPYRIGHT",
      titleA,
      ownerA,
      departmentCode,
      `Step 69G Owner A|COPYRIGHT_OWNER|OWNER|${contributorA}|S69G Lab`,
      "DRAFT",
      registrationA,
      "1.0",
      "APPLICATION",
      "2026-01-02",
      "2026-02-03",
      "S69G Runtime",
    ].join(","),
    [
      "SOFTWARE_COPYRIGHT",
      titleB,
      ownerB,
      departmentCode,
      `Step 69G Owner B|COPYRIGHT_OWNER|OWNER|${contributorB}|S69G Lab`,
      "DRAFT",
      registrationB,
      "2.0",
      "SYSTEM",
      "2026-01-04",
      "2026-02-05",
      "S69G Runtime",
    ].join(","),
  ].join("\n");
  const missingRegistrationCsv = [
    "type,title,ownerEmail,departmentCode,contributors,status",
    [
      "SOFTWARE_COPYRIGHT",
      `${titlePrefix} Missing Registration`,
      ownerA,
      departmentCode,
      `Step 69G Owner A|COPYRIGHT_OWNER|OWNER|${contributorA}|S69G Lab`,
      "DRAFT",
    ].join(","),
  ].join("\n");
  const mixedCsv = [
    "type,title,ownerEmail,departmentCode,contributors,status,doi,softwareRegistrationNo",
    [
      "PAPER",
      `${titlePrefix} Mixed Paper`,
      ownerA,
      departmentCode,
      `Step 69G Author|AUTHOR|FIRST_AUTHOR|${contributorA}|S69G Lab`,
      "DRAFT",
      `10.69g/${lower}.mixed`,
      "",
    ].join(","),
    [
      "SOFTWARE_COPYRIGHT",
      `${titlePrefix} Mixed Software`,
      ownerB,
      departmentCode,
      `Step 69G Owner|COPYRIGHT_OWNER|OWNER|${contributorB}|S69G Lab`,
      "DRAFT",
      "",
      registrationMixed,
    ].join(","),
  ].join("\n");
  const patentCsv = [
    "type,title,ownerEmail,departmentCode,contributors,status,patentNo",
    [
      "PATENT",
      `${titlePrefix} Patent`,
      ownerA,
      departmentCode,
      `Step 69G Inventor|INVENTOR|PRIMARY_INVENTOR|${contributorA}|S69G Lab`,
      "DRAFT",
      `S69G-PAT-${suffix}`,
    ].join(","),
  ].join("\n");
  const dryRunErrorCsv = [
    "type,title,ownerEmail,departmentCode,contributors,status,softwareRegistrationNo",
    [
      "SOFTWARE_COPYRIGHT",
      `${titlePrefix} Dry Run Error`,
      `missing-${lower}@example.invalid`,
      departmentCode,
      "Step 69G Owner|COPYRIGHT_OWNER|OWNER||S69G Lab",
      "DRAFT",
      `S69G-SW-${suffix}-ERROR`,
    ].join(","),
  ].join("\n");

  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", message => {
    const text = message.text();
    if (message.type() === "error" && !text.includes("Failed to load resource")) {
      consoleErrors.push(text);
    }
  });
  page.on("pageerror", error => pageErrors.push(error.message));

  const uploadCsv = async text => {
    await page.evaluate(csvText => {
      const input = document.querySelector('input[aria-label="Achievement CSV file"]');
      if (!input) {
        throw new Error("Achievement CSV file input was not found.");
      }
      const transfer = new DataTransfer();
      transfer.items.add(new File([csvText], "step69g-achievements.csv", { type: "text/csv" }));
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, text);
  };

  const runDryRun = async text => {
    await uploadCsv(text);
    await page.getByRole("button", { name: "Run dry-run" }).click();
    await page.getByText("Dry-run report ready").waitFor({ timeout: 30000 });
  };

  const collectEvidence = async () =>
    page.evaluate(async prefix => {
      const response = await fetch("/step69g/evidence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ titlePrefix: prefix }),
      });
      return response.json();
    }, titlePrefix);

  const directLimitedApply = async () =>
    page.evaluate(async csvText => {
      const form = new FormData();
      form.append("mode", "CREATE_DRAFT_ONLY");
      form.append("file", new File([csvText], "step69g-achievements.csv", { type: "text/csv" }));
      const response = await fetch("/api/achievements/import/apply", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const body = await response.json().catch(() => ({}));
      return {
        status: response.status,
        safeMessage: body?.message ?? null,
      };
    }, successCsv);

  const assertApplyDisabled = async label => {
    const button = page.getByRole("button", { name: "Apply draft-only import" }).first();
    if (await button.isEnabled()) {
      throw new Error(`${label} should disable achievement import apply.`);
    }
  };

  await page.goto(`${baseUrl}/?s=${suffix}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".app-sider", { timeout: 30000 });

  if (mode === "limited") {
    const bodyText = await page.locator("body").innerText();
    const forbidden = await directLimitedApply();
    if (bodyText.includes("Apply draft-only import")) {
      throw new Error("Limited user must not see the achievement import apply UI.");
    }
    if (forbidden.status !== 403) {
      throw new Error(`Limited user apply expected HTTP 403, got ${forbidden.status}.`);
    }
    return {
      mode,
      permissionDeniedStatus: forbidden.status,
      permissionUiHidden: true,
    };
  }

  const achievementMenuItem = page.locator('.app-sider [data-menu-id*="achievements"]').first();
  if (await achievementMenuItem.count()) {
    await achievementMenuItem.click();
  } else {
    await page.locator(".app-sider .ant-menu-item").filter({ hasText: "成果管理" }).click();
  }
  await page.getByText("Achievement CSV dry-run").waitFor({ timeout: 30000 });
  await page.getByText("POST /achievements/import/dry-run").waitFor({ timeout: 30000 });

  const beforeEvidence = await collectEvidence();
  await runDryRun(successCsv);
  const applyButton = page.getByRole("button", { name: "Apply draft-only import" }).first();
  if (!(await applyButton.isEnabled())) {
    throw new Error("Eligible SOFTWARE_COPYRIGHT dry-run should enable achievement import apply.");
  }
  await page.getByText("Apply is ready").waitFor({ timeout: 30000 });
  await page.getByText("Ready to create DRAFT SOFTWARE_COPYRIGHT achievements.").waitFor({
    timeout: 30000,
  });
  await applyButton.click();
  const confirmationModal = page.locator(".ant-modal").last();
  await confirmationModal
    .getByText("DRAFT SOFTWARE_COPYRIGHT achievements")
    .waitFor({ timeout: 30000 });
  await confirmationModal
    .getByText("software copyright detail rows")
    .waitFor({ timeout: 30000 });
  await confirmationModal.getByText("CREATE_DRAFT_ONLY").waitFor({ timeout: 30000 });
  await confirmationModal
    .getByText("normalized software registration number")
    .waitFor({ timeout: 30000 });
  await confirmationModal
    .getByText(/will not submit for approval/)
    .waitFor({ timeout: 30000 });
  await confirmationModal.getByText(/workflow/).first().waitFor({ timeout: 30000 });
  await confirmationModal
    .getByText(/attachment\/storage/)
    .first()
    .waitFor({ timeout: 30000 });
  await confirmationModal.getByText(/fee/).first().waitFor({ timeout: 30000 });
  await confirmationModal.getByText(/reminder/).first().waitFor({ timeout: 30000 });
  await confirmationModal.getByText(/notification/).first().waitFor({ timeout: 30000 });
  await confirmationModal.getByText(/search/).first().waitFor({ timeout: 30000 });
  await confirmationModal.getByText(/resource grant/).first().waitFor({ timeout: 30000 });
  await confirmationModal.getByText(/import job/).first().waitFor({ timeout: 30000 });
  await page.getByRole("button", { name: "Create DRAFT software copyright achievements" }).click();
  await page.getByText("Draft-only SOFTWARE_COPYRIGHT import applied").waitFor({
    timeout: 30000,
  });
  await page.getByText("Created achievements").waitFor({ timeout: 30000 });
  await page.getByText("Created software copyright details").waitFor({ timeout: 30000 });
  await page.getByText("Created contributors").waitFor({ timeout: 30000 });
  await page.getByText("ACHIEVEMENT_IMPORT_CREATE_DRAFT").waitFor({ timeout: 30000 });
  await page.getByText("No workflow").waitFor({ timeout: 30000 });
  await page.getByText("No attachment/storage").waitFor({ timeout: 30000 });
  await page.getByText("No fee/reminder").waitFor({ timeout: 30000 });
  await page.getByText("No notification/search/resource grant").waitFor({ timeout: 30000 });
  await page.getByText("No import job").waitFor({ timeout: 30000 });
  await page.getByText(titleA).waitFor({ timeout: 30000 });
  const afterSuccessEvidence = await collectEvidence();
  const successPanelText = await page.locator(".ant-alert-success").last().innerText();
  for (const rawValue of [
    registrationA,
    registrationB,
    normalizedA,
    normalizedB,
    ownerA,
    ownerB,
    contributorA,
    contributorB,
    "Step 69G Owner A",
    successCsv,
  ]) {
    if (successPanelText.includes(rawValue)) {
      throw new Error("Apply success panel displayed raw row data.");
    }
  }

  const beforeRepeatEvidence = await collectEvidence();
  await page.getByRole("button", { name: "Apply draft-only import" }).first().click();
  await page.getByRole("button", { name: "Create DRAFT software copyright achievements" }).click();
  await page.getByText("Apply rejected").waitFor({ timeout: 30000 });
  await page.getByText("DB_CONFLICT").first().waitFor({ timeout: 30000 });
  const afterRepeatEvidence = await collectEvidence();
  const errorPanelText = await page.locator(".ant-alert-error").last().innerText();
  for (const rawValue of [
    registrationA,
    registrationB,
    normalizedA,
    normalizedB,
    ownerA,
    ownerB,
    contributorA,
    contributorB,
    "Step 69G Owner A",
    successCsv,
  ]) {
    if (errorPanelText.includes(rawValue)) {
      throw new Error("Apply rejection panel displayed raw row data.");
    }
  }

  await runDryRun(successCsv);
  await page.getByText("DB_CONFLICT").first().waitFor({ timeout: 30000 });
  await assertApplyDisabled("repeat warning dry-run");

  await runDryRun(missingRegistrationCsv);
  await page
    .getByText("Every SOFTWARE_COPYRIGHT row must have a normalized software registration number.")
    .waitFor({ timeout: 30000 });
  await assertApplyDisabled("missing registration dry-run");

  await runDryRun(mixedCsv);
  await page.getByText("Mixed PAPER and SOFTWARE_COPYRIGHT").waitFor({ timeout: 30000 });
  await assertApplyDisabled("mixed dry-run");

  await runDryRun(patentCsv);
  await page.getByText("PATENT apply is not enabled yet.").waitFor({ timeout: 30000 });
  await assertApplyDisabled("PATENT dry-run");

  await runDryRun(dryRunErrorCsv);
  await page.getByText("OWNER_NOT_FOUND").waitFor({ timeout: 30000 });
  await assertApplyDisabled("dry-run error");

  if (consoleErrors.length > 0 || pageErrors.length > 0) {
    throw new Error(JSON.stringify({ consoleErrors, pageErrors }));
  }

  return {
    mode,
    eligibleSoftwareApplyEnabled: true,
    confirmationCopySeen: true,
    successCreatedAchievementsDelta:
      afterSuccessEvidence.achievementCount - beforeEvidence.achievementCount,
    successCreatedSoftwareDetails: afterSuccessEvidence.softwareDetailCount,
    normalizedRegistrationPersistedCount:
      afterSuccessEvidence.normalizedRegistrationPersistedCount,
    successCreatedContributors: afterSuccessEvidence.contributorCount,
    successAuditOperation: afterSuccessEvidence.auditOperation,
    successAuditOperationCount: afterSuccessEvidence.auditOperationCount,
    listRefreshVerifiedByTitle: true,
    safeSuccessPanelRedacted: true,
    repeatErrorCodes: ["DB_CONFLICT"],
    repeatAchievementCountBefore: beforeRepeatEvidence.achievementCount,
    repeatAchievementCountAfter: afterRepeatEvidence.achievementCount,
    safeErrorPanelRedacted: true,
    warningDryRunApplyDisabled: true,
    missingRegistrationApplyDisabled: true,
    mixedApplyDisabled: true,
    patentApplyDisabled: true,
    dryRunErrorApplyDisabled: true,
    stateChangeCount: afterRepeatEvidence.stateChangeCount,
  };
}
