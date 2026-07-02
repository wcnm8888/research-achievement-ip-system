/*
 * Step 67D local Web acceptance for employeeNo import conflicts.
 *
 * Authentication is supplied by a no-credential/no-session local harness outside
 * this file. Do not write raw session cookies, passwords, tokens, or connection
 * strings here.
 */
/* eslint-disable-next-line @typescript-eslint/no-unused-expressions */
async page => {
  const currentUrl = page.url();
  const baseUrl = currentUrl.startsWith("http")
    ? currentUrl.split("/").slice(0, 3).join("/")
    : "http://127.0.0.1:19371";
  const suffixMatch = currentUrl.match(/[?&]s=([^&]+)/);
  const suffix = suffixMatch ? suffixMatch[1] : "S67D_BROWSER";
  const suffixLower = suffix.toLowerCase();
  const departmentCode = `S67D_DEPT_${suffix}`;
  const roleCode = `S67D_ROLE_${suffix}`;
  const successEmail = `step67d-success-${suffixLower}@example.invalid`;
  const conflictEmail = `step67d-conflict-${suffixLower}@example.invalid`;
  const raceEmail = `step67d-race-${suffixLower}@example.invalid`;
  const successEmployeeNo = ` s67d_apply_${suffixLower} `;
  const conflictEmployeeNo = ` s67d_emp_${suffixLower} `;
  const raceEmployeeNo = `s67d_race_${suffixLower}`;
  const successCsv = [
    "email,displayName,employeeNo,departmentCode,roleCode,scopeType,scopeDepartmentCode,status",
    `${successEmail},Step 67D Success,${successEmployeeNo},${departmentCode},${roleCode},DEPARTMENT,${departmentCode},PENDING_ACTIVATION`,
  ].join("\n");
  const conflictCsv = [
    "email,displayName,employeeNo,departmentCode,roleCode,scopeType,scopeDepartmentCode,status",
    `${conflictEmail},Step 67D Conflict,${conflictEmployeeNo},${departmentCode},${roleCode},DEPARTMENT,${departmentCode},PENDING_ACTIVATION`,
  ].join("\n");
  const raceCsv = [
    "email,displayName,employeeNo,departmentCode,roleCode,scopeType,scopeDepartmentCode,status",
    `${raceEmail},Step 67D Race,${raceEmployeeNo},${departmentCode},${roleCode},DEPARTMENT,${departmentCode},PENDING_ACTIVATION`,
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
      const input = document.querySelector('input[aria-label="User account CSV file"]');
      if (!input) {
        throw new Error("User account CSV file input was not found.");
      }
      const transfer = new DataTransfer();
      transfer.items.add(new File([csvText], "step67d-user-accounts.csv", { type: "text/csv" }));
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, text);
  };

  const runDryRun = async text => {
    await uploadCsv(text);
    await page.getByRole("button", { name: "Run dry-run" }).click();
    await page.getByText("Dry-run report ready").waitFor({ timeout: 20000 });
  };

  const collectEvidence = async emails => {
    return page.evaluate(async targetEmails => {
      const response = await fetch("/step67d/evidence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ emails: targetEmails }),
      });
      return response.json();
    }, emails);
  };

  await page.goto(`${baseUrl}/?s=${suffix}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".app-sider", { timeout: 20000 });
  const accountMenuItem = page.locator('.app-sider [data-menu-id*="account-management"]').first();
  if (await accountMenuItem.count()) {
    await accountMenuItem.click();
  } else {
    await page.locator(".app-sider .ant-menu-item").filter({ hasText: "Step 36E-2" }).click();
  }
  await page.getByText("User account CSV dry-run").waitFor({ timeout: 20000 });
  await page.getByText("POST /users/import/dry-run").waitFor({ timeout: 20000 });

  await runDryRun(successCsv);
  await page.getByText("employeeNo DB conflict check: AVAILABLE").waitFor({ timeout: 20000 });
  await page.getByText(/optional business identifier/).waitFor({ timeout: 20000 });
  await page.getByText("Pending no-credential apply is available").waitFor({ timeout: 20000 });
  const successApplyButton = page.getByRole("button", { name: "Apply pending no-credential" }).first();
  if (!(await successApplyButton.isEnabled())) {
    throw new Error("Eligible employeeNo dry-run should enable pending no-credential apply.");
  }
  await successApplyButton.click();
  await page.getByText("This will create pending user account records.").waitFor({ timeout: 20000 });
  await page.getByText(/No UserCredential, password generation\/reset, session/).waitFor({ timeout: 20000 });
  await page.getByRole("button", { name: "Apply pending no-credential" }).last().click();
  await page.getByText("User account apply summary").waitFor({ timeout: 20000 });
  await page.getByText("USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL").first().waitFor({
    timeout: 20000,
  });
  const successEvidence = await collectEvidence([successEmail]);

  await runDryRun(conflictCsv);
  await page.getByText("employeeNo DB conflict check: AVAILABLE").waitFor({ timeout: 20000 });
  await page.getByText("EXISTING_EMPLOYEE_NO").waitFor({ timeout: 20000 });
  await page
    .getByText(/employeeNo is already registered as a business identifier/)
    .first()
    .waitFor({ timeout: 20000 });
  await page.getByText("Pending no-credential apply is disabled").waitFor({ timeout: 20000 });
  const conflictApplyButton = page.getByRole("button", { name: "Apply pending no-credential" }).first();
  if (await conflictApplyButton.isEnabled()) {
    throw new Error("employeeNo database conflict should disable pending apply.");
  }

  await runDryRun(raceCsv);
  await page.getByText("Pending no-credential apply is available").waitFor({ timeout: 20000 });
  const raceApplyButton = page.getByRole("button", { name: "Apply pending no-credential" }).first();
  if (!(await raceApplyButton.isEnabled())) {
    throw new Error("Race dry-run should be eligible before transaction-time conflict.");
  }
  await raceApplyButton.click();
  await page.getByText("This will create pending user account records.").waitFor({ timeout: 20000 });
  await page.getByRole("button", { name: "Apply pending no-credential" }).last().click();
  await page.getByText("User account import apply was rejected.").waitFor({ timeout: 20000 });
  await page.getByText("EXISTING_EMPLOYEE_NO").waitFor({ timeout: 20000 });
  await page.getByText(/business identifier already exists/).first().waitFor({ timeout: 20000 });
  const raceEvidence = await collectEvidence([raceEmail]);

  if (consoleErrors.length > 0 || pageErrors.length > 0) {
    throw new Error(JSON.stringify({ consoleErrors, pageErrors }));
  }

  return {
    dryRunEmployeeNoDbConflictCheck: "AVAILABLE",
    successApplyButtonEnabled: true,
    successCreatedUserCount: successEvidence.userCount,
    successPendingActivationCount: successEvidence.pendingActivationCount,
    successEmployeeNoPersistedCount: successEvidence.employeeNoPersistedCount,
    successEmployeeNoNormalizedPersistedCount: successEvidence.employeeNoNormalizedPersistedCount,
    successEmployeeNoNormalizationMatchedCount: successEvidence.employeeNoNormalizationMatchedCount,
    successCredentialCount: successEvidence.credentialCount,
    successSessionCount: successEvidence.sessionCount,
    successLifecycleTokenCount: successEvidence.lifecycleTokenCount,
    successMailDeliveryCount: successEvidence.mailDeliveryCount,
    successAuditOperation: successEvidence.auditOperation,
    successAuditOperationCount: successEvidence.auditOperationCount,
    dryRunConflictCode: "EXISTING_EMPLOYEE_NO",
    conflictApplyDisabled: true,
    applyRejectedCode: "EXISTING_EMPLOYEE_NO",
    raceUserCountAfterRejectedApply: raceEvidence.userCount,
  };
}
