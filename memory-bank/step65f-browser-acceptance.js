/*
 * Step 65F local production-like browser acceptance.
 *
 * Authentication is supplied by a transient local proxy outside this file. Do
 * not write raw session cookies, passwords, tokens, or connection strings here.
 */
/* eslint-disable-next-line @typescript-eslint/no-unused-expressions */
async page => {
  const currentUrl = page.url();
  const baseUrl = currentUrl.startsWith("http")
    ? currentUrl.split("/").slice(0, 3).join("/")
    : "http://127.0.0.1:19251";
  const portMatch = baseUrl.match(/:(\d+)$/);
  const mode = portMatch?.[1] === "19252" ? "limited" : "admin";
  const suffixMatch = currentUrl.match(/[?&]s=([^&]+)/);
  const suffix = suffixMatch ? suffixMatch[1] : "S65F_BROWSER";
  const parentCode = `S65F_PARENT_${suffix}`;
  const childCode = `S65F_CHILD_${suffix}`;
  const csv = [
    "code,name,parentCode",
    `${childCode},Step 65F Synthetic Child,${parentCode}`,
    `${parentCode},Step 65F Synthetic Parent,`,
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

  const countDepartments = async codes => {
    return page.evaluate(async targetCodes => {
      const counts = [];
      for (const code of targetCodes) {
        const response = await fetch(`/api/departments?keyword=${encodeURIComponent(code)}&includeArchived=true&page=1&pageSize=20`, {
          credentials: "include",
        });
        const body = await response.json();
        const exact = Array.isArray(body.items)
          ? body.items.filter(item => item.code === code).length
          : 0;
        counts.push(exact);
      }
      return counts.reduce((sum, value) => sum + value, 0);
    }, codes);
  };

  const postApply = async text => {
    return page.evaluate(async csvText => {
      const form = new FormData();
      form.append("mode", "CREATE_ONLY");
      form.append("file", new File([csvText], "step65f-departments.csv", { type: "text/csv" }));
      const response = await fetch("/api/imports/departments/apply", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const raw = await response.text();
      const body = raw ? JSON.parse(raw) : null;
      return {
        status: response.status,
        createdRows: body?.summary?.createdRows ?? null,
        errorCodes: Array.isArray(body?.errors)
          ? [...new Set(body.errors.map(error => error.code).filter(Boolean))]
          : [],
      };
    }, text);
  };

  await page.goto(`${baseUrl}/?s=${suffix}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".app-sider", { timeout: 20000 });

  if (mode === "limited") {
    const bodyText = await page.locator("body").innerText();
    if (bodyText.includes("Department CSV dry-run") || bodyText.includes("Apply create-only")) {
      throw new Error("Limited user must not see the department import apply UI.");
    }
    const forbidden = await postApply(csv);
    if (forbidden.status !== 403) {
      throw new Error(`Limited user apply expected HTTP 403, got ${forbidden.status}.`);
    }
    return {
      mode,
      permissionDeniedStatus: forbidden.status,
      permissionUiHidden: true,
    };
  }

  await page.getByText("部门维护").click();
  await page.getByText("Department CSV dry-run").waitFor({ timeout: 20000 });
  await page.getByText("POST /imports/departments/dry-run").waitFor({ timeout: 20000 });

  await page.evaluate(text => {
    const input = document.querySelector('input[aria-label="Department CSV file"]');
    if (!input) {
      throw new Error("Department CSV file input was not found.");
    }
    const transfer = new DataTransfer();
    transfer.items.add(new File([text], "step65f-departments.csv", { type: "text/csv" }));
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, csv);

  await page.getByRole("button", { name: "Run dry-run" }).click();
  await page.getByText("Dry-run report ready").waitFor({ timeout: 20000 });
  await page.getByText("CREATE_ONLY apply is available").waitFor({ timeout: 20000 });
  const applyButton = page.getByRole("button", { name: "Apply create-only" }).first();
  if (!(await applyButton.isEnabled())) {
    throw new Error("Apply create-only button should be enabled after eligible dry-run.");
  }

  const beforeApplyCount = await countDepartments([parentCode, childCode]);
  await applyButton.click();
  await page.getByText("This will create department metadata.").waitFor({ timeout: 20000 });
  await page.getByText("POST /imports/departments/apply").waitFor({ timeout: 20000 });
  await page.getByRole("button", { name: "Apply create-only" }).last().click();
  await page.getByText("Department apply summary").waitFor({ timeout: 20000 });
  await page.getByText("DEPARTMENT_IMPORT_CREATE").first().waitFor({ timeout: 20000 });
  await page.getByText("Created rows").waitFor({ timeout: 20000 });
  const afterApplyCount = await countDepartments([parentCode, childCode]);

  const beforeRepeatCount = afterApplyCount;
  await page.getByRole("button", { name: "Apply create-only" }).first().click();
  await page.getByText("This will create department metadata.").waitFor({ timeout: 20000 });
  await page.getByRole("button", { name: "Apply create-only" }).last().click();
  await page.getByText("Department import apply was rejected.").waitFor({ timeout: 20000 });
  await page.getByText("EXISTING_CODE").waitFor({ timeout: 20000 });
  const afterRepeatCount = await countDepartments([parentCode, childCode]);

  if (consoleErrors.length > 0 || pageErrors.length > 0) {
    throw new Error(JSON.stringify({ consoleErrors, pageErrors }));
  }

  return {
    mode,
    dryRunApplyButtonEnabled: true,
    confirmModalSeen: true,
    successCreatedRows: afterApplyCount - beforeApplyCount,
    repeatErrorCodes: ["EXISTING_CODE"],
    repeatDepartmentCountBefore: beforeRepeatCount,
    repeatDepartmentCountAfter: afterRepeatCount,
    auditOperationDisplayed: "DEPARTMENT_IMPORT_CREATE",
  };
}
