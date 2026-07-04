/*
 * Step 70F local production-like Web acceptance.
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
    : [localHttp, "19581"].join(":");
  const portMatch = baseUrl.match(/:(\d+)$/);
  const mode = portMatch?.[1] === "19582" ? "limited" : "admin";
  const suffixMatch = currentUrl.match(/[?&]s=([^&]+)/);
  const suffix = suffixMatch ? suffixMatch[1] : "S70F_BROWSER";
  const lower = suffix.toLowerCase();
  const titlePrefix = `Step 70F Synthetic ${suffix}`;
  const departmentCode = `S70F_DEPT_${suffix}`;
  const ownerA = `step70f-owner-a-${lower}@example.invalid`;
  const ownerB = `step70f-owner-b-${lower}@example.invalid`;
  const contributorA = `step70f-contributor-a-${lower}@example.invalid`;
  const contributorB = `step70f-contributor-b-${lower}@example.invalid`;
  const applicationA = `S70F-APP-${suffix}-A`;
  const applicationB = `S70F-APP-${suffix}-B`;
  const grantA = `S70F-GRANT-${suffix}-A`;
  const normalizedApplicationA = `S70FAPP${suffix}A`;
  const normalizedApplicationB = `S70FAPP${suffix}B`;
  const normalizedGrantA = `S70FGRANT${suffix}A`;
  const titleA = `${titlePrefix} Patent A`;
  const titleB = `${titlePrefix} Patent B`;

  const successCsv = [
    "type,title,ownerEmail,departmentCode,contributors,status,applicationNo,grantNo,patentType,filingDate,grantDate,nextFeeDate,feeAmount,legalStatus",
    [
      "PATENT",
      titleA,
      ownerA,
      departmentCode,
      `Step 70F Inventor A|INVENTOR|PRIMARY_INVENTOR|${contributorA}|S70F Lab;Step 70F External A|INVENTOR|OTHER||S70F External`,
      "DRAFT",
      applicationA,
      grantA,
      "INVENTION",
      "2026-01-02",
      "2026-02-03",
      "2027-02-03",
      "1200.50",
      "GRANTED",
    ].join(","),
    [
      "PATENT",
      titleB,
      ownerB,
      departmentCode,
      `Step 70F Inventor B|INVENTOR|PRIMARY_INVENTOR|${contributorB}|S70F Lab;Step 70F External B|INVENTOR|OTHER||S70F External`,
      "DRAFT",
      applicationB,
      "",
      "UTILITY_MODEL",
      "2026-01-04",
      "",
      "2027-03-04",
      "990.00",
      "PENDING",
    ].join(","),
  ].join("\n");
  const missingApplicationCsv = [
    "type,title,ownerEmail,departmentCode,contributors,status,applicationNo",
    [
      "PATENT",
      `${titlePrefix} Missing Application`,
      ownerA,
      departmentCode,
      `Step 70F Inventor A|INVENTOR|PRIMARY_INVENTOR|${contributorA}|S70F Lab`,
      "DRAFT",
      "",
    ].join(","),
  ].join("\n");
  const grantOnlyCsv = [
    "type,title,ownerEmail,departmentCode,contributors,status,grantNo",
    [
      "PATENT",
      `${titlePrefix} Grant Only`,
      ownerA,
      departmentCode,
      `Step 70F Inventor A|INVENTOR|PRIMARY_INVENTOR|${contributorA}|S70F Lab`,
      "DRAFT",
      `S70F-GRANT-${suffix}-ONLY`,
    ].join(","),
  ].join("\n");
  const noIdentifierCsv = [
    "type,title,ownerEmail,departmentCode,contributors,status",
    [
      "PATENT",
      `${titlePrefix} No Identifier`,
      ownerA,
      departmentCode,
      `Step 70F Inventor A|INVENTOR|PRIMARY_INVENTOR|${contributorA}|S70F Lab`,
      "DRAFT",
    ].join(","),
  ].join("\n");
  const mixedCsv = [
    "type,title,ownerEmail,departmentCode,contributors,status,doi,softwareRegistrationNo,applicationNo",
    [
      "PAPER",
      `${titlePrefix} Mixed Paper`,
      ownerA,
      departmentCode,
      `Step 70F Author|AUTHOR|FIRST_AUTHOR|${contributorA}|S70F Lab`,
      "DRAFT",
      `10.70f/${lower}.mixed`,
      "",
      "",
    ].join(","),
    [
      "SOFTWARE_COPYRIGHT",
      `${titlePrefix} Mixed Software`,
      ownerB,
      departmentCode,
      `Step 70F Owner|COPYRIGHT_OWNER|OWNER|${contributorB}|S70F Lab`,
      "DRAFT",
      "",
      `S70F-SW-${suffix}-MIXED`,
      "",
    ].join(","),
    [
      "PATENT",
      `${titlePrefix} Mixed Patent`,
      ownerA,
      departmentCode,
      `Step 70F Inventor|INVENTOR|PRIMARY_INVENTOR|${contributorA}|S70F Lab`,
      "DRAFT",
      "",
      "",
      `S70F-APP-${suffix}-MIXED`,
    ].join(","),
  ].join("\n");
  const dryRunErrorCsv = [
    "type,title,ownerEmail,departmentCode,contributors,status,applicationNo",
    [
      "PATENT",
      `${titlePrefix} Dry Run Error`,
      `missing-${lower}@example.invalid`,
      departmentCode,
      "Step 70F Inventor|INVENTOR|PRIMARY_INVENTOR||S70F Lab",
      "DRAFT",
      `S70F-APP-${suffix}-ERROR`,
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
      transfer.items.add(new File([csvText], "step70f-achievements.csv", { type: "text/csv" }));
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
      const response = await fetch("/step70f/evidence", {
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
      form.append("file", new File([csvText], "step70f-achievements.csv", { type: "text/csv" }));
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
    await page.locator(".app-sider .ant-menu-item").filter({ hasText: "鎴愭灉绠＄悊" }).click();
  }
  await page.getByText("Achievement CSV dry-run").waitFor({ timeout: 30000 });
  await page.getByText("POST /achievements/import/dry-run").waitFor({ timeout: 30000 });

  const beforeEvidence = await collectEvidence();
  await runDryRun(successCsv);
  const applyButton = page.getByRole("button", { name: "Apply draft-only import" }).first();
  if (!(await applyButton.isEnabled())) {
    throw new Error("Eligible PATENT dry-run should enable achievement import apply.");
  }
  await page.getByText("Apply is ready").waitFor({ timeout: 30000 });
  await page.getByText("Ready to create DRAFT PATENT achievements.").waitFor({
    timeout: 30000,
  });
  await applyButton.click();
  const confirmationModal = page.locator(".ant-modal").last();
  await confirmationModal.getByText("DRAFT PATENT achievements").first().waitFor({ timeout: 30000 });
  await confirmationModal.getByText("PatentDetail rows").first().waitFor({ timeout: 30000 });
  await confirmationModal.getByText("CREATE_DRAFT_ONLY").first().waitFor({ timeout: 30000 });
  await confirmationModal.getByText("applicationNoNormalized").first().waitFor({ timeout: 30000 });
  await confirmationModal.getByText("grantNoNormalized").first().waitFor({ timeout: 30000 });
  await confirmationModal.getByText("nextFeeDate").first().waitFor({ timeout: 30000 });
  await confirmationModal.getByText("feeAmount").first().waitFor({ timeout: 30000 });
  await confirmationModal.getByText(/not imported/).first().waitFor({ timeout: 30000 });
  await confirmationModal.getByText(/workflow/).first().waitFor({ timeout: 30000 });
  await confirmationModal.getByText(/attachment\/storage/).first().waitFor({ timeout: 30000 });
  await confirmationModal.getByText(/fee/).first().waitFor({ timeout: 30000 });
  await confirmationModal.getByText(/reminder/).first().waitFor({ timeout: 30000 });
  await confirmationModal.getByText(/notification/).first().waitFor({ timeout: 30000 });
  await confirmationModal.getByText(/search/).first().waitFor({ timeout: 30000 });
  await confirmationModal.getByText(/resource grant/).first().waitFor({ timeout: 30000 });
  await confirmationModal.getByText(/import job/).first().waitFor({ timeout: 30000 });
  await page.getByRole("button", { name: "Create DRAFT patent achievements" }).click();
  await page.getByText("Draft-only PATENT import applied").waitFor({ timeout: 30000 });
  await page.getByText("Created achievements").waitFor({ timeout: 30000 });
  await page.getByText("Created patent details").waitFor({ timeout: 30000 });
  await page.getByText("Created contributors").waitFor({ timeout: 30000 });
  await page.getByText("Created audit events").waitFor({ timeout: 30000 });
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
    applicationA,
    applicationB,
    grantA,
    normalizedApplicationA,
    normalizedApplicationB,
    normalizedGrantA,
    ownerA,
    ownerB,
    contributorA,
    contributorB,
    "Step 70F Inventor A",
    "nextFeeDate",
    "feeAmount",
    successCsv,
  ]) {
    if (successPanelText.includes(rawValue)) {
      throw new Error("Apply success panel displayed raw row data.");
    }
  }

  const beforeRepeatEvidence = await collectEvidence();
  await page.getByRole("button", { name: "Apply draft-only import" }).first().click();
  await page.getByRole("button", { name: "Create DRAFT patent achievements" }).click();
  await page.getByText("Apply rejected").waitFor({ timeout: 30000 });
  await page.getByText("DB_CONFLICT").first().waitFor({ timeout: 30000 });
  const afterRepeatEvidence = await collectEvidence();
  const errorPanelText = await page.locator(".ant-alert-error").last().innerText();
  for (const rawValue of [
    applicationA,
    applicationB,
    grantA,
    normalizedApplicationA,
    normalizedApplicationB,
    normalizedGrantA,
    ownerA,
    ownerB,
    contributorA,
    contributorB,
    "Step 70F Inventor A",
    "nextFeeDate",
    "feeAmount",
    successCsv,
  ]) {
    if (errorPanelText.includes(rawValue)) {
      throw new Error("Apply rejection panel displayed raw row data.");
    }
  }

  await runDryRun(successCsv);
  await page.getByText("DB_CONFLICT").first().waitFor({ timeout: 30000 });
  await assertApplyDisabled("repeat warning dry-run");

  await runDryRun(missingApplicationCsv);
  await assertApplyDisabled("missing application dry-run");

  await runDryRun(grantOnlyCsv);
  await assertApplyDisabled("grant-only dry-run");

  await runDryRun(noIdentifierCsv);
  await assertApplyDisabled("no-identifier dry-run");

  await runDryRun(mixedCsv);
  await page.getByText("Mixed achievement type").waitFor({ timeout: 30000 });
  await assertApplyDisabled("mixed dry-run");

  await runDryRun(dryRunErrorCsv);
  await page.getByText("OWNER_NOT_FOUND").waitFor({ timeout: 30000 });
  await assertApplyDisabled("dry-run error");

  if (consoleErrors.length > 0 || pageErrors.length > 0) {
    throw new Error(JSON.stringify({ consoleErrors, pageErrors }));
  }

  return {
    mode,
    eligiblePatentApplyEnabled: true,
    confirmationCopySeen: true,
    successCreatedAchievementsDelta:
      afterSuccessEvidence.achievementCount - beforeEvidence.achievementCount,
    successCreatedPatentDetails: afterSuccessEvidence.patentDetailCount,
    normalizedApplicationPersistedCount:
      afterSuccessEvidence.normalizedApplicationPersistedCount,
    normalizedGrantPersistedCount: afterSuccessEvidence.normalizedGrantPersistedCount,
    nextFeeDatePersistedCount: afterSuccessEvidence.nextFeeDatePersistedCount,
    feeAmountPersistedCount: afterSuccessEvidence.feeAmountPersistedCount,
    successCreatedContributors: afterSuccessEvidence.contributorCount,
    successAuditOperation: afterSuccessEvidence.auditOperation,
    successAuditOperationCount: afterSuccessEvidence.auditOperationCount,
    listRefreshVerifiedByTitle: true,
    safeSuccessPanelRedacted: true,
    repeatErrorCodes: ["DB_CONFLICT"],
    repeatAchievementCountBefore: beforeRepeatEvidence.achievementCount,
    repeatAchievementCountAfter: afterRepeatEvidence.achievementCount,
    repeatAuditOperationCountBefore: beforeRepeatEvidence.auditOperationCount,
    repeatAuditOperationCountAfter: afterRepeatEvidence.auditOperationCount,
    safeErrorPanelRedacted: true,
    warningDryRunApplyDisabled: true,
    missingApplicationApplyDisabled: true,
    grantOnlyApplyDisabled: true,
    noIdentifierApplyDisabled: true,
    mixedApplyDisabled: true,
    dryRunErrorApplyDisabled: true,
    stateChangeCount: afterRepeatEvidence.stateChangeCount,
  };
}
