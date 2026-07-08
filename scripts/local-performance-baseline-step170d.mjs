#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { join } from "node:path";

const baseUrl = process.env.LOCAL_PERF_BASE_URL ?? "http://127.0.0.1:18081";
const localPerfEmail = process.env.LOCAL_PERF_EMAIL?.trim();
const localPerfPassword = process.env.LOCAL_PERF_PASSWORD;
const shouldLogin = Boolean(localPerfEmail && localPerfPassword);
const demoUserId = "40000000-0000-4000-8000-000000000001";
const outputDir = ".local-step170d-performance";
const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, "-");
const outputPath = join(outputDir, `local-performance-baseline-${timestamp}.json`);
let sessionCookieHeader = "";

const endpoints = [
  {
    key: "web-entry",
    label: "普通页面入口",
    path: "/",
    targetMs: 2000,
    samples: 5,
    sendDemoUserHeader: false,
  },
  {
    key: "dashboard-summary",
    label: "统计看板接口",
    path: "/api/dashboard/summary?dueSoonDays=30",
    targetMs: 3000,
    samples: 8,
    sendDemoUserHeader: true,
  },
  {
    key: "search",
    label: "检索接口",
    path: "/api/search?keyword=%E6%88%90%E6%9E%9C&take=20",
    targetMs: 1000,
    samples: 8,
    sendDemoUserHeader: true,
  },
  {
    key: "achievements-list",
    label: "成果台账接口",
    path: "/api/achievements?page=1&pageSize=20",
    targetMs: 2000,
    samples: 8,
    sendDemoUserHeader: true,
  },
  {
    key: "custom-report-templates",
    label: "自定义报表模板接口",
    path: "/api/reports/templates",
    targetMs: 2000,
    samples: 8,
    sendDemoUserHeader: true,
  },
];

const concurrentProbe = {
  key: "search-50-concurrency-preview",
  label: "检索接口 50 并发轻量预演",
  path: "/api/search?keyword=%E6%88%90%E6%9E%9C&take=20",
  targetMs: 1000,
  concurrency: 50,
  sendDemoUserHeader: true,
};

const headersFor = (sendDemoUserHeader) => {
  const headers = { Accept: "application/json,text/html;q=0.9,*/*;q=0.8" };

  if (sessionCookieHeader) {
    headers.Cookie = sessionCookieHeader;
  }

  if (!sessionCookieHeader && sendDemoUserHeader) {
    headers["X-Demo-User-Id"] = demoUserId;
  }

  return headers;
};

const loginForLocalPerformance = async () => {
  if (!shouldLogin) {
    return { status: "SKIPPED" };
  }

  const response = await fetch(new URL("/api/auth/login", baseUrl), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: localPerfEmail,
      password: localPerfPassword,
    }),
  });

  if (!response.ok) {
    return {
      status: "FAILED",
      httpStatus: response.status,
    };
  }

  const setCookie = response.headers.getSetCookie?.() ?? [response.headers.get("set-cookie")];
  sessionCookieHeader = setCookie
    .filter(Boolean)
    .map((cookie) => cookie.split(";")[0])
    .join("; ");

  return {
    status: sessionCookieHeader ? "AUTHENTICATED" : "NO_COOKIE",
    httpStatus: response.status,
  };
};

const requestOnce = async (probe) => {
  const url = new URL(probe.path, baseUrl).toString();
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: headersFor(probe.sendDemoUserHeader),
    });
    await response.arrayBuffer();
    const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;

    return {
      status: response.status,
      ok: response.ok,
      durationMs,
    };
  } catch (error) {
    const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;

    return {
      status: 0,
      ok: false,
      durationMs,
      error: error instanceof Error ? error.message : "request failed",
    };
  }
};

const summarizeSamples = (samples, targetMs) => {
  const durations = samples.map((sample) => sample.durationMs).sort((a, b) => a - b);
  const statuses = samples.map((sample) => sample.status);
  const failed = samples.filter((sample) => !sample.ok);
  const p50 = percentile(durations, 50);
  const p95 = percentile(durations, 95);
  const max = durations.at(-1) ?? 0;

  return {
    count: samples.length,
    statusCodes: [...new Set(statuses)],
    p50,
    p95,
    max,
    targetMs,
    passed: failed.length === 0 && p95 <= targetMs,
    failedCount: failed.length,
  };
};

const percentile = (sortedValues, percentileValue) => {
  if (sortedValues.length === 0) {
    return 0;
  }

  const index = Math.ceil((percentileValue / 100) * sortedValues.length) - 1;
  return sortedValues[Math.min(Math.max(index, 0), sortedValues.length - 1)];
};

const runSequentialProbe = async (probe) => {
  await requestOnce(probe);
  const samples = [];

  for (let index = 0; index < probe.samples; index += 1) {
    samples.push(await requestOnce(probe));
  }

  return {
    key: probe.key,
    label: probe.label,
    path: probe.path,
    mode: "sequential",
    summary: summarizeSamples(samples, probe.targetMs),
    samples,
  };
};

const runConcurrentProbe = async (probe) => {
  const samples = await Promise.all(
    Array.from({ length: probe.concurrency }, () => requestOnce(probe)),
  );

  return {
    key: probe.key,
    label: probe.label,
    path: probe.path,
    mode: "concurrent",
    concurrency: probe.concurrency,
    summary: summarizeSamples(samples, probe.targetMs),
    samples,
  };
};

const main = async () => {
  const auth = await loginForLocalPerformance();
  const results = [];

  for (const endpoint of endpoints) {
    results.push(await runSequentialProbe(endpoint));
  }

  results.push(await runConcurrentProbe(concurrentProbe));

  const report = {
    generatedAt: now.toISOString(),
    source: "local Docker production-like performance baseline",
    baseUrl,
    authMode: auth.status === "AUTHENTICATED" ? "local session cookie" : "local demo header",
    authStatus: auth.status,
    destructive: false,
    writeRequests: false,
    caveats: [
      "本地短时 GET 基线，不代表生产性能验收",
      "50 并发为轻量预演，不代表生产压测完成",
      "十万级数据压测仍需生产专项验收",
    ],
    results,
    overallPassed: results.every((result) => result.summary.passed),
    overallStatus: results.every((result) => result.summary.passed) ? "PASS" : "CHECK",
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  for (const result of results) {
    const { summary } = result;
    console.log(
      [
        result.label,
        result.mode,
        `status=${summary.statusCodes.join(",") || "n/a"}`,
        `p50=${summary.p50}ms`,
        `p95=${summary.p95}ms`,
        `max=${summary.max}ms`,
        `target=${summary.targetMs}ms`,
        summary.passed ? "PASS" : "CHECK",
      ].join(" | "),
    );
  }

  console.log(`auth=${auth.status}`);
  console.log(`report=${outputPath}`);

  if (!report.overallPassed) {
    console.log("overall=CHECK");
  }
};

await main();
