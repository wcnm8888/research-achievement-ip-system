/*
 * Step 59D local Docker production-like browser acceptance.
 *
 * Authentication is supplied by a transient local proxy outside this file. Do
 * not write session cookies, passwords, tokens, or connection strings here.
 */
/* eslint-disable-next-line @typescript-eslint/no-unused-expressions */
async page => {
  const currentUrl = page.url();
  const baseUrl = currentUrl.startsWith("http")
    ? currentUrl.split("/").slice(0, 3).join("/")
    : "http://127.0.0.1:19091";
  const portMatch = baseUrl.match(/:(\d+)$/);
  const mode = portMatch?.[1] === "19092" ? "limited" : "admin";

  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", message => {
    const text = message.text();
    if (message.type() === "error" && !text.includes("Failed to load resource")) {
      consoleErrors.push(text);
    }
  });
  page.on("pageerror", error => pageErrors.push(error.message));

  const postCsv = async csvText => {
    return page.evaluate(async text => {
      const form = new FormData();
      form.append("file", new File([text], "step59d-users.csv", { type: "text/csv" }));
      const response = await fetch("/api/users/import/dry-run", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const body = await response.text();
      return {
        status: response.status,
        body: body ? JSON.parse(body) : null,
      };
    }, csvText);
  };

  const assertNoWriteEntry = async () => {
    const text = await page.locator("body").innerText();
    const forbidden = [
      "Execute import",
      "Confirm import",
      "Run import",
      "Create accounts",
    ].filter(label => text.includes(label));
    if (forbidden.length > 0) {
      throw new Error(`Unexpected import write entry: ${forbidden.join(", ")}`);
    }
  };

  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".app-sider", { timeout: 15000 });

  if (mode === "limited") {
    const bodyText = await page.locator("body").innerText();
    if (bodyText.includes("User account CSV dry-run")) {
      throw new Error("Limited user must not see the user account import dry-run UI.");
    }
    const forbiddenResult = await postCsv(
      "email,displayName,departmentCode,roleCode\nlimited.check@example.test,Limited,STEP59D_DEPT,RESEARCHER",
    );
    if (forbiddenResult.status !== 403) {
      throw new Error(`Limited user dry-run API expected HTTP 403, got ${forbiddenResult.status}.`);
    }
    await assertNoWriteEntry();
  } else {
    await page.locator(".ant-menu-item").nth(8).click();
    await page.getByText("User account CSV dry-run").waitFor({ timeout: 15000 });
    await page.getByText("POST /users/import/dry-run").waitFor({ timeout: 15000 });
    await page.getByText("Password, passwordHash, token, cookie, secret").waitFor({
      timeout: 15000,
    });

    const uploadCsv = async csvText => {
      await page.evaluate(text => {
        const input = document.querySelector('input[aria-label="User account CSV file"]');
        if (!input) {
          throw new Error("User account CSV file input was not found.");
        }
        const transfer = new DataTransfer();
        transfer.items.add(new File([text], "step59d-users.csv", { type: "text/csv" }));
        input.files = transfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }, csvText);
    };
    await uploadCsv(
      [
        "email,displayName,employeeNo,departmentCode,roleCode,scopeType,scopeDepartmentCode,status",
        "step59d.browser.new@example.test,Step59D Browser New,E59DB1,STEP59D_DEPT,RESEARCHER,DEPARTMENT,STEP59D_DEPT,PENDING_ACTIVATION",
        "step59d-existing@example.test,Step59D Existing,E59DB2,STEP59D_DEPT,RESEARCHER,DEPARTMENT,STEP59D_DEPT,DISABLED",
        "step59d.invalid@example.test,Step59D Invalid,E59DB1,UNKNOWN_D59,SYSTEM_ADMIN,GLOBAL,,ACTIVE",
      ].join("\n"),
    );
    await page.getByRole("button", { name: "Run dry-run" }).click();
    await page.getByText("Dry-run report ready").waitFor({ timeout: 15000 });
    await page.getByText("USER_ACCOUNT").waitFor({ timeout: 15000 });
    await page.getByText("NO_CREDENTIAL").first().waitFor({ timeout: 15000 });
    await page.getByText("EXISTING_USER").first().waitFor({ timeout: 15000 });
    await page.getByText("UNKNOWN_DEPARTMENT").first().waitFor({ timeout: 15000 });
    await page.getByText("GLOBAL_SCOPE_NOT_ALLOWED").first().waitFor({ timeout: 15000 });
    await page.getByText("UNSUPPORTED_STATUS").first().waitFor({ timeout: 15000 });
    await page.getByText("employeeNo DB conflict check: NOT_AVAILABLE").first().waitFor({
      timeout: 15000,
    });

    const sensitiveResult = await postCsv(
      [
        "email,displayName,departmentCode,roleCode,passwordHash",
        "step59d.browser.sensitive@example.test,Sensitive,STEP59D_DEPT,RESEARCHER,do-not-display",
      ].join("\n"),
    );
    if (sensitiveResult.status !== 201) {
      throw new Error(`Sensitive-column dry-run expected HTTP 201, got ${sensitiveResult.status}.`);
    }
    const serialized = JSON.stringify(sensitiveResult.body);
    if (!serialized.includes("FORBIDDEN_SENSITIVE_COLUMN") || !serialized.includes("(sensitive)")) {
      throw new Error("Sensitive-column dry-run did not return the sanitized issue marker.");
    }
    if (serialized.includes("passwordHash") || serialized.includes("do-not-display")) {
      throw new Error("Sensitive-column dry-run echoed a forbidden header or value.");
    }
    await assertNoWriteEntry();
  }

  if (consoleErrors.length > 0 || pageErrors.length > 0) {
    throw new Error(JSON.stringify({ consoleErrors, pageErrors }));
  }

  return { mode, status: "passed" };
}
