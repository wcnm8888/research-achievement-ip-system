/*
 * Step 60D local Docker production-like browser acceptance.
 *
 * Authentication is supplied by a transient local proxy outside this file. Do
 * not write raw auth material or connection material here.
 */
/* eslint-disable-next-line @typescript-eslint/no-unused-expressions */
async page => {
  const currentUrl = page.url();
  const baseUrl = currentUrl.startsWith("http")
    ? currentUrl.split("/").slice(0, 3).join("/")
    : "http://127.0.0.1:19101";
  const portMatch = baseUrl.match(/:(\d+)$/);
  const mode = portMatch?.[1] === "19102" ? "limited" : "admin";

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
      form.append("file", new File([text], "step60d-achievements.csv", { type: "text/csv" }));
      const response = await fetch("/api/achievements/import/dry-run", {
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
      "Create achievement",
      "Create achievements",
      "Upload attachment",
      "Create fee",
      "Start workflow",
    ].filter(label => text.includes(label));
    if (forbidden.length > 0) {
      throw new Error(`Unexpected achievement import write entry: ${forbidden.join(", ")}`);
    }
  };

  const csv = [
    "type,title,ownerEmail,departmentCode,contributors,status,DOI,patentNo,softwareRegistrationNo",
    "PAPER,Step60D Browser Paper DB Conflict,step60d.owner@example.test,STEP60D_DEPT,Step60D Contributor|AUTHOR|FIRST_AUTHOR|step60d.contributor@example.test|Step60D Lab,DRAFT,https://doi.org/10.6000/step60d-existing,,",
    "PATENT,Step60D Browser Patent Duplicate A,step60d.owner@example.test,STEP60D_DEPT,Step60D Inventor|INVENTOR|PRIMARY_INVENTOR|step60d.contributor@example.test|Step60D Lab,DRAFT,,STEP60D-PN-DUP,",
    "PATENT,Step60D Browser Patent Duplicate B,step60d.owner@example.test,STEP60D_DEPT,Step60D Inventor|INVENTOR|PRIMARY_INVENTOR|step60d.contributor@example.test|Step60D Lab,DRAFT,,step60d pn dup,",
    "SOFTWARE_COPYRIGHT,Step60D Browser Software,step60d.owner@example.test,STEP60D_DEPT,Step60D Owner|COPYRIGHT_OWNER|OWNER|step60d.contributor@example.test|Step60D Lab,DRAFT,,,STEP60D-SW-NEW",
    "PAPER,Step60D Browser Invalid,missing.owner@example.test,UNKNOWN_STEP60D,Missing Contributor|AUTHOR|FIRST_AUTHOR|missing.contributor@example.test|External,SUBMITTED,,STEP60D-MISMATCH,",
  ].join("\n");

  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".app-sider", { timeout: 15000 });
  await page.locator(".ant-menu-item").filter({ hasText: "成果管理" }).first().click();

  if (mode === "limited") {
    const bodyText = await page.locator("body").innerText();
    if (bodyText.includes("Achievement CSV dry-run")) {
      throw new Error("Limited user must not see the achievement import dry-run UI.");
    }
    const forbiddenResult = await postCsv(csv);
    if (forbiddenResult.status !== 403) {
      throw new Error(`Limited user dry-run API expected HTTP 403, got ${forbiddenResult.status}.`);
    }
    await assertNoWriteEntry();
  } else {
    await page.getByText("Achievement CSV dry-run").waitFor({ timeout: 15000 });
    await page.getByText("POST /achievements/import/dry-run").waitFor({ timeout: 15000 });
    await page.getByText("attachments, fees, workflow").waitFor({ timeout: 15000 });

    await page.evaluate(text => {
      const input = document.querySelector('input[aria-label="Achievement CSV file"]');
      if (!input) {
        throw new Error("Achievement CSV file input was not found.");
      }
      const transfer = new DataTransfer();
      transfer.items.add(new File([text], "step60d-achievements.csv", { type: "text/csv" }));
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, csv);
    await page.getByRole("button", { name: "Run dry-run" }).click();
    await page.getByText("Dry-run report ready").waitFor({ timeout: 15000 });
    await page.getByText("importType=ACHIEVEMENT").waitFor({ timeout: 15000 });
    await page.getByText("PAPER").first().waitFor({ timeout: 15000 });
    await page.getByText("PATENT").first().waitFor({ timeout: 15000 });
    await page.getByText("SOFTWARE_COPYRIGHT").first().waitFor({ timeout: 15000 });
    await page.getByText("Step60D Contributor").first().waitFor({ timeout: 15000 });
    await page.getByText("10.6000/step60d-existing").first().waitFor({ timeout: 15000 });
    await page.getByText("STEP60DPNDUP").first().waitFor({ timeout: 15000 });
    await page.getByText("STEP60DSWNEW").first().waitFor({ timeout: 15000 });
    await page.getByText("DB_CONFLICT").first().waitFor({ timeout: 15000 });
    await page.getByText("DUPLICATE_IN_FILE").first().waitFor({ timeout: 15000 });
    await page.getByText("UNKNOWN_DEPARTMENT").first().waitFor({ timeout: 15000 });
    await page.getByText("OWNER_NOT_FOUND").first().waitFor({ timeout: 15000 });
    await page.getByText("CONTRIBUTOR_USER_NOT_FOUND").first().waitFor({ timeout: 15000 });
    await page.getByText("INVALID_ENUM").first().waitFor({ timeout: 15000 });
    await page.getByText("DETAIL_TYPE_MISMATCH").first().waitFor({ timeout: 15000 });

    const apiResult = await postCsv(csv);
    if (apiResult.status !== 201) {
      throw new Error(`Admin dry-run API expected HTTP 201, got ${apiResult.status}.`);
    }
    const serialized = JSON.stringify(apiResult.body);
    for (const marker of [
      "ACHIEVEMENT",
      "DB_CONFLICT",
      "DUPLICATE_IN_FILE",
      "UNKNOWN_DEPARTMENT",
      "OWNER_NOT_FOUND",
      "CONTRIBUTOR_USER_NOT_FOUND",
      "INVALID_ENUM",
      "DETAIL_TYPE_MISMATCH",
    ]) {
      if (!serialized.includes(marker)) {
        throw new Error(`Dry-run API response missing marker ${marker}.`);
      }
    }
    await assertNoWriteEntry();
  }

  if (consoleErrors.length > 0 || pageErrors.length > 0) {
    throw new Error(JSON.stringify({ consoleErrors, pageErrors }));
  }

  return { mode, status: "passed" };
}
