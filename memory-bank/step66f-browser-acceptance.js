/*
 * Step 66F local production-like Web acceptance.
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
    : "http://127.0.0.1:19361";
  const portMatch = baseUrl.match(/:(\d+)$/);
  const mode = portMatch?.[1] === "19362" ? "limited" : "admin";
  const suffixMatch = currentUrl.match(/[?&]s=([^&]+)/);
  const suffix = suffixMatch ? suffixMatch[1] : "S66F_BROWSER";
  const departmentCode = `S66F_DEPT_${suffix}`;
  const roleCode = `S66F_ROLE_${suffix}`;
  const successEmailA = `step66f-success-a-${suffix.toLowerCase()}@example.invalid`;
  const successEmailB = `step66f-success-b-${suffix.toLowerCase()}@example.invalid`;
  const deniedEmail = `step66f-denied-${suffix.toLowerCase()}@example.invalid`;
  const csv = [
    "email,displayName,employeeNo,departmentCode,roleCode,scopeType,scopeDepartmentCode,status",
    `${successEmailA},Step 66F User A,S66F_E001,${departmentCode},${roleCode},DEPARTMENT,${departmentCode},PENDING_ACTIVATION`,
    `${successEmailB},Step 66F User B,S66F_E002,${departmentCode},${roleCode},DEPARTMENT,${departmentCode},PENDING_ACTIVATION`,
  ].join("\n");
  const deniedCsv = [
    "email,displayName,departmentCode,roleCode",
    `${deniedEmail},Step 66F Denied,${departmentCode},${roleCode}`,
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

  const countUsers = async emails => {
    return page.evaluate(async targetEmails => {
      const response = await fetch("/step66f/evidence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ emails: targetEmails }),
      });
      const body = await response.json();
      return body.userCount;
    }, emails);
  };

  const postLimitedApply = async text => {
    return page.evaluate(async csvText => {
      const form = new FormData();
      form.append("mode", "CREATE_ONLY_PENDING_NO_CREDENTIAL");
      form.append("file", new File([csvText], "step66f-user-accounts.csv", { type: "text/csv" }));
      const response = await fetch("/api/users/import/apply", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const raw = await response.text();
      const body = raw ? JSON.parse(raw) : null;
      return {
        status: response.status,
        safeMessage: body?.message ?? null,
      };
    }, text);
  };

  await page.goto(`${baseUrl}/?s=${suffix}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".app-sider", { timeout: 20000 });

  if (mode === "limited") {
    const bodyText = await page.locator("body").innerText();
    if (bodyText.includes("账号管理") || bodyText.includes("Apply pending no-credential")) {
      throw new Error("Limited user must not see the user account import apply UI.");
    }
    const forbidden = await postLimitedApply(deniedCsv);
    if (forbidden.status !== 403) {
      throw new Error(`Limited user apply expected HTTP 403, got ${forbidden.status}.`);
    }
    return {
      mode,
      permissionDeniedStatus: forbidden.status,
      permissionUiHidden: true,
    };
  }

  await page.getByText("账号管理").click();
  await page.getByText("User account CSV dry-run").waitFor({ timeout: 20000 });
  await page.getByText("POST /users/import/dry-run").waitFor({ timeout: 20000 });

  await page.evaluate(text => {
    const input = document.querySelector('input[aria-label="User account CSV file"]');
    if (!input) {
      throw new Error("User account CSV file input was not found.");
    }
    const transfer = new DataTransfer();
    transfer.items.add(new File([text], "step66f-user-accounts.csv", { type: "text/csv" }));
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, csv);

  await page.getByRole("button", { name: "Run dry-run" }).click();
  await page.getByText("Dry-run report ready").waitFor({ timeout: 20000 });
  await page.getByText("Pending no-credential apply is available").waitFor({ timeout: 20000 });
  const applyButton = page.getByRole("button", { name: "Apply pending no-credential" }).first();
  if (!(await applyButton.isEnabled())) {
    throw new Error("Apply pending no-credential button should be enabled after eligible dry-run.");
  }

  const beforeApplyCount = await countUsers([successEmailA, successEmailB]);
  await applyButton.click();
  await page.getByText("This will create pending user account records.").waitFor({ timeout: 20000 });
  await page.getByText("POST /users/import/apply").waitFor({ timeout: 20000 });
  await page.getByText("Created user status").waitFor({ timeout: 20000 });
  await page.getByText(/No UserCredential/).waitFor({ timeout: 20000 });
  await page.getByText(/No UserCredential, password generation\/reset, session/).waitFor({ timeout: 20000 });
  await page.getByRole("button", { name: "Apply pending no-credential" }).last().click();
  await page.getByText("User account apply summary").waitFor({ timeout: 20000 });
  await page.getByText("Created users", { exact: true }).waitFor({ timeout: 20000 });
  await page.getByText("Created roles", { exact: true }).waitFor({ timeout: 20000 });
  await page.getByText("USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL").first().waitFor({ timeout: 20000 });
  await page.getByText(/Pending\/no-credential status/).waitFor({ timeout: 20000 });
  const afterApplyCount = await countUsers([successEmailA, successEmailB]);

  const beforeRepeatCount = afterApplyCount;
  await page.getByRole("button", { name: "Apply pending no-credential" }).first().click();
  await page.getByText("This will create pending user account records.").waitFor({ timeout: 20000 });
  await page.getByRole("button", { name: "Apply pending no-credential" }).last().click();
  await page.getByText("User account import apply was rejected.").waitFor({ timeout: 20000 });
  await page.getByText(/EXISTING_USER/).waitFor({ timeout: 20000 });
  const afterRepeatCount = await countUsers([successEmailA, successEmailB]);

  if (consoleErrors.length > 0 || pageErrors.length > 0) {
    throw new Error(JSON.stringify({ consoleErrors, pageErrors }));
  }

  return {
    mode,
    dryRunApplyButtonEnabled: true,
    confirmModalSeen: true,
    successCreatedUsersDelta: afterApplyCount - beforeApplyCount,
    repeatErrorCodes: ["EXISTING_USER"],
    repeatUserCountBefore: beforeRepeatCount,
    repeatUserCountAfter: afterRepeatCount,
    auditOperationDisplayed: "USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL",
    pendingNoCredentialSummaryDisplayed: true,
  };
}
