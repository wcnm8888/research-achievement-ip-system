import { describe, expect, it, vi } from "vitest";
import type { ApiClient } from "./api-client";
import {
  getSettingsBoundaryForDemoUser,
  getStep20BSettingsBoundary,
  settingsCapabilities,
} from "./SettingsBoundary";

const createClient = (): ApiClient => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
});

const forbiddenActionWords = ["创建", "编辑", "删除", "保存", "同步", "导入", "导出", "下载"];

describe("Step 20B settings boundary", () => {
  it("defines a readonly capability inventory without a settings/config API claim", () => {
    expect(getStep20BSettingsBoundary()).toEqual({
      title: "系统配置边界 / 只读能力盘点",
      apiStatus: "none",
      permissionSignal: "system:config is a permission-code signal, not a settings/config API.",
      requestPolicy: "NO_BUSINESS_API_REQUEST",
      unavailableActions: forbiddenActionWords,
      excludedRoutes: [
        "settings/config API",
        "角色/部门/字典/预警规则/接口配置 CRUD",
        "附件 upload/download/detail",
        "费用凭证附件",
        "warnings API",
        "search_logs 写入",
        "Meilisearch / 外部搜索引擎同步",
        "seed/migrate/data cleanup",
      ],
    });
  });

  it("does not call business API for no-demo-user or demo-user boundary display", () => {
    const client = createClient();

    expect(getSettingsBoundaryForDemoUser(null).requestPolicy).toBe("NO_BUSINESS_API_REQUEST");
    expect(getSettingsBoundaryForDemoUser("40000000-0000-4000-8000-000000000004").requestPolicy).toBe(
      "NO_BUSINESS_API_REQUEST",
    );

    expect(client.get).not.toHaveBeenCalled();
    expect(client.post).not.toHaveBeenCalled();
    expect(client.patch).not.toHaveBeenCalled();
  });

  it("covers the five phase-one configuration capability categories", () => {
    expect(settingsCapabilities.map((capability) => capability.title)).toEqual([
      "角色权限",
      "部门",
      "字典",
      "预警规则",
      "接口 adapter",
    ]);

    settingsCapabilities.forEach((capability) => {
      expect(capability.designGoal.length).toBeGreaterThan(0);
      expect(capability.currentSignal.length).toBeGreaterThan(0);
      expect(capability.missingContract).toMatch(/尚未/);
      expect(capability.futureConfirmation).toMatch(/单独|独立|显式/);
    });
  });

  it("keeps write/download/import/export entry words unavailable", () => {
    const boundary = getStep20BSettingsBoundary();

    forbiddenActionWords.forEach((word) => {
      expect(boundary.unavailableActions).toContain(word);
    });
    expect(boundary.excludedRoutes.join(" ")).toContain("CRUD");
    expect(boundary.excludedRoutes.join(" ")).toContain("upload/download/detail");
    expect(boundary.excludedRoutes.join(" ")).toContain("warnings API");
    expect(boundary.excludedRoutes.join(" ")).toContain("Meilisearch");
  });

  it("does not claim completed settings/config or secret-bearing configuration capability", () => {
    const serialized = JSON.stringify({
      boundary: getStep20BSettingsBoundary(),
      capabilities: settingsCapabilities,
    });

    expect(serialized).not.toContain("GET /settings");
    expect(serialized).not.toContain("GET /config");
    expect(serialized).not.toContain("已完成 settings/config");
    expect(serialized).not.toContain("真实配置管理已完成");
    expect(serialized).toContain("不读取 env");
    expect(serialized).toContain("密钥");
  });
});
