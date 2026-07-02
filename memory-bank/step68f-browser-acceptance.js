/*
 * Step 68F local production-like Web acceptance.
 *
 * Authentication is supplied by a local harness outside this file. Do not write
 * raw session cookies, passwords, tokens, or connection strings here.
 */
/* eslint-disable-next-line @typescript-eslint/no-unused-expressions */
async page => {
  const currentUrl = page.url();
  const baseUrl = currentUrl.startsWith("http")
    ? currentUrl.split("/").slice(0, 3).join("/")
    : [["http", "://127.0.0.1"].join(""), "19381"].join(":");
  const portMatch = baseUrl.match(/:(\d+)$/);
  const mode = portMatch?.[1] === "19382" ? "limited" : "admin";
  const suffixMatch = currentUrl.match(/[?&]s=([^&]+)/);
  const suffix = suffixMatch ? suffixMatch[1] : "S68F_BROWSER";
  const lower = suffix.toLowerCase();
  const titlePrefix = `Step 68F Synthetic ${suffix}`;
  const departmentCode = `S68F_DEPT_${suffix}`;
  const ownerA = `step68f-owner-a-${lower}@example.invalid`;
  const ownerB = `step68f-owner-b-${lower}@example.invalid`;
  const contributorA = `step68f-contributor-a-${lower}@example.invalid`;
  const contributorB = `step68f-contributor-b-${lower}@example.invalid`;
  const doiA = `10.68f/${lower}.a`;
  const doiB = `10.68f/${lower}.b`;
  const titleA = `${titlePrefix} Paper A`;
  const titleB = `${titlePrefix} Paper B`;
  const successCsv = [
    "type,title,ownerEmail,departmentCode,contributors,status,doi,journal,publishYear",
    [
      "PAPER",
      titleA,
      ownerA,
      departmentCode,
      `Step 68F Contributor A|AUTHOR|FIRST_AUTHOR|${contributorA}|S68F Lab`,
      "DRAFT",
      doiA,
      "S68F Journal",
      "2026",
    ].join(","),
    [
      "PAPER",
      titleB,
      ownerB,
      departmentCode,
      `Step 68F Contributor B|AUTHOR|CORRESPONDING_AUTHOR|${contributorB}|S68F Lab`,
      "DRAFT",
      doiB,
      "S68F Journal",
      "2026",
    ].join(","),
  ].join("\n");
  const missingDoiCsv = [
    "type,title,ownerEmail,departmentCode,contributors,status",
    [
      "PAPER",
      `${titlePrefix} Missing DOI`,
      ownerA,
      departmentCode,
      `Step 68F Contributor A|AUTHOR|FIRST_AUTHOR|${contributorA}|S68F Lab`,
      "DRAFT",
    ].join(","),
  ].join("\n");
  const nonPaperCsv = [
    "type,title,ownerEmail,departmentCode,contributors,status,patentNo,softwareRegistrationNo",
    [
      "PATENT",
      `${titlePrefix} Patent`,
      ownerA,
      departmentCode,
      `Step 68F Inventor|INVENTOR|PRIMARY_INVENTOR|${contributorA}|S68F Lab`,
      "DRAFT",
      `S68F-PAT-${suffix}`,
      "",
    ].join(","),
    [
      "SOFTWARE_COPYRIGHT",
      `${titlePrefix} Software`,
      ownerB,
      departmentCode,
      `Step 68F Owner|COPYRIGHT_OWNER|OWNER|${contributorB}|S68F Lab`,
      "DRAFT",
      "",
      `S68F-SW-${suffix}`,
    ].join(","),
  ].join("\n");
  const dryRunErrorCsv = [
    "type,title,ownerEmail,departmentCode,contributors,status,doi",
    [
      "PAPER",
      `${titlePrefix} Dry Run Error`,
      `missing-${lower}@example.invalid`,
      departmentCode,
      "Step 68F Contributor|AUTHOR|FIRST_AUTHOR||S68F Lab",
      "DRAFT",
      `10.68f/${lower}.error`,
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
      transfer.items.add(new File([csvText], "step68f-achievements.csv", { type: "text/csv" }));
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
      const response = await fetch("/step68f/evidence", {
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
      form.append("file", new File([csvText], "step68f-achievements.csv", { type: "text/csv" }));
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
    const button = page.getByRole("button", { name: "Apply draft-only PAPER import" }).first();
    if (await button.isEnabled()) {
      throw new Error(`${label} should disable achievement import apply.`);
    }
  };

  await page.goto(`${baseUrl}/?s=${suffix}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".app-sider", { timeout: 30000 });

  if (mode === "limited") {
    const bodyText = await page.locator("body").innerText();
    const forbidden = await directLimitedApply();
    if (bodyText.includes("Apply draft-only PAPER import")) {
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
  const applyButton = page.getByRole("button", { name: "Apply draft-only PAPER import" }).first();
  if (!(await applyButton.isEnabled())) {
    throw new Error("Eligible PAPER dry-run should enable achievement import apply.");
  }
  await applyButton.click();
  await page.getByText("This creates DRAFT PAPER achievements").waitFor({ timeout: 30000 });
  await page.getByText("CREATE_DRAFT_ONLY").waitFor({ timeout: 30000 });
  await page.getByText(/will not submit for approval/).waitFor({ timeout: 30000 });
  await page.getByText(/workflow/).first().waitFor({ timeout: 30000 });
  await page.getByText(/attachment\/storage/).first().waitFor({ timeout: 30000 });
  await page.getByText(/resource grant/).first().waitFor({ timeout: 30000 });
  await page.getByText(/PATENT and SOFTWARE_COPYRIGHT apply are not supported/).waitFor({
    timeout: 30000,
  });
  await page.getByRole("button", { name: "Create DRAFT PAPER achievements" }).click();
  await page.getByText("Draft-only PAPER import applied").waitFor({ timeout: 30000 });
  await page.getByText("Created achievements").waitFor({ timeout: 30000 });
  await page.getByText("Created paper details").waitFor({ timeout: 30000 });
  await page.getByText("Created contributors").waitFor({ timeout: 30000 });
  await page.getByText("ACHIEVEMENT_IMPORT_CREATE_DRAFT").waitFor({ timeout: 30000 });
  await page.getByText("No workflow").waitFor({ timeout: 30000 });
  await page.getByText("No attachment/storage").waitFor({ timeout: 30000 });
  await page.getByText("No fee").waitFor({ timeout: 30000 });
  await page.getByText("No search/resource grant").waitFor({ timeout: 30000 });
  await page.getByText(titleA).waitFor({ timeout: 30000 });
  const afterSuccessEvidence = await collectEvidence();
  const successPanelText = await page.locator(".ant-alert-success").last().innerText();
  for (const rawValue of [doiA, doiB, ownerA, ownerB, contributorA, contributorB, "Step 68F Contributor A"]) {
    if (successPanelText.includes(rawValue)) {
      throw new Error("Apply success panel displayed raw row data.");
    }
  }

  const beforeRepeatEvidence = await collectEvidence();
  await page.getByRole("button", { name: "Apply draft-only PAPER import" }).first().click();
  await page.getByRole("button", { name: "Create DRAFT PAPER achievements" }).click();
  await page.getByText("Apply rejected").waitFor({ timeout: 30000 });
  await page.getByText("DB_CONFLICT").first().waitFor({ timeout: 30000 });
  const afterRepeatEvidence = await collectEvidence();
  const errorPanelText = await page.locator(".ant-alert-error").last().innerText();
  for (const rawValue of [doiA, doiB, ownerA, ownerB, contributorA, contributorB, "Step 68F Contributor A"]) {
    if (errorPanelText.includes(rawValue)) {
      throw new Error("Apply rejection panel displayed raw row data.");
    }
  }

  await runDryRun(successCsv);
  await page.getByText("DB_CONFLICT").first().waitFor({ timeout: 30000 });
  await assertApplyDisabled("repeat warning dry-run");

  await runDryRun(missingDoiCsv);
  await page.getByText("REQUIRED").waitFor({ timeout: 30000 });
  await assertApplyDisabled("missing DOI dry-run");

  await runDryRun(nonPaperCsv);
  await page.getByText("PATENT").first().waitFor({ timeout: 30000 });
  await page.getByText("SOFTWARE_COPYRIGHT").first().waitFor({ timeout: 30000 });
  await assertApplyDisabled("non-PAPER dry-run");

  await runDryRun(dryRunErrorCsv);
  await page.getByText("OWNER_NOT_FOUND").waitFor({ timeout: 30000 });
  await assertApplyDisabled("dry-run error");

  if (consoleErrors.length > 0 || pageErrors.length > 0) {
    throw new Error(JSON.stringify({ consoleErrors, pageErrors }));
  }

  return {
    mode,
    eligiblePaperApplyEnabled: true,
    confirmationCopySeen: true,
    successCreatedAchievementsDelta:
      afterSuccessEvidence.achievementCount - beforeEvidence.achievementCount,
    successCreatedPaperDetails: afterSuccessEvidence.paperDetailCount,
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
    missingDoiApplyDisabled: true,
    nonPaperApplyDisabled: true,
    dryRunErrorApplyDisabled: true,
    stateChangeCount: afterRepeatEvidence.stateChangeCount,
  };
}
