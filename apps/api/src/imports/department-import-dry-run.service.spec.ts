import { DepartmentStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { UserContext } from "../identity/user-context";
import { DepartmentImportDryRunRepository } from "./department-import-dry-run.repository";
import { DepartmentImportDryRunService } from "./department-import-dry-run.service";

const ids = {
  user: "40000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
};

const adminContext: UserContext = {
  userId: ids.user,
  departmentId: ids.department,
  roleIds: [ids.role],
  roleCodes: [RoleCode.systemAdmin],
  permissionCodes: [PermissionCode.systemConfig],
  roleScopes: [
    {
      roleCode: RoleCode.systemAdmin,
      scopeType: ScopeType.global,
      scopeKey: "GLOBAL",
      departmentId: null,
    },
  ],
  scopedDepartmentIds: [ids.department],
};

const makeFile = (content: string) => ({
  originalName: "departments.csv",
  mimeType: "text/csv",
  size: Buffer.byteLength(content),
  buffer: Buffer.from(content, "utf8"),
});

const createService = (
  existing: Array<{ code: string; status: DepartmentStatus }> = [],
) => {
  const repository = {
    findDepartmentsByCodes: vi.fn().mockResolvedValue(existing),
  };

  return {
    repository,
    service: new DepartmentImportDryRunService(
      repository as unknown as DepartmentImportDryRunRepository,
    ),
  };
};

describe("DepartmentImportDryRunService", () => {
  it("returns a valid department metadata report for CSV rows", async () => {
    const { service, repository } = createService([
      { code: "ROOT", status: DepartmentStatus.ACTIVE },
    ]);

    const result = await service.dryRunDepartmentCsv(
      adminContext,
      makeFile("code,name,parentCode\nAI_RESEARCH,AI Research,ROOT\n"),
    );

    expect(result).toMatchObject({
      importType: "DEPARTMENT_METADATA",
      dryRun: true,
      summary: {
        totalRows: 1,
        validRows: 1,
        errorRows: 0,
        warningRows: 0,
        createCandidates: 1,
        existingCodeRows: 0,
      },
    });
    expect(result.file).toMatchObject({
      name: "departments.csv",
      mimeType: "text/csv",
      encoding: "utf-8",
    });
    expect(result.columns.received).toEqual(["code", "name", "parentCode"]);
    expect(result.rows[0]!).toMatchObject({
      rowNumber: 2,
      parsed: {
        code: "AI_RESEARCH",
        name: "AI Research",
        parentCode: "ROOT",
      },
      status: "VALID",
      candidateAction: "CREATE",
      errors: [],
      warnings: [],
    });
    expect(repository.findDepartmentsByCodes).toHaveBeenCalledWith([
      "AI_RESEARCH",
      "ROOT",
    ]);
  });

  it("reports missing required field errors", async () => {
    const { service } = createService();

    const result = await service.dryRunDepartmentCsv(
      adminContext,
      makeFile("code,name\nAI_RESEARCH,\n"),
    );

    expect(result.summary.errorRows).toBe(1);
    expect(result.rows[0]!.errors).toContainEqual(
      expect.objectContaining({ field: "name", code: "REQUIRED" }),
    );
  });

  it("reports invalid department code format", async () => {
    const { service } = createService();

    const result = await service.dryRunDepartmentCsv(
      adminContext,
      makeFile("code,name\nbad-code,Bad Code\n"),
    );

    expect(result.rows[0]!.errors).toContainEqual(
      expect.objectContaining({ field: "code", code: "INVALID_FORMAT" }),
    );
  });

  it("reports duplicate codes inside the file", async () => {
    const { service } = createService();

    const result = await service.dryRunDepartmentCsv(
      adminContext,
      makeFile("code,name\nAI_RESEARCH,AI One\nAI_RESEARCH,AI Two\n"),
    );

    expect(result.summary.errorRows).toBe(2);
    expect(result.rows[0]!.errors).toContainEqual(
      expect.objectContaining({ code: "DUPLICATE_IN_FILE" }),
    );
    expect(result.rows[1]!.errors).toContainEqual(
      expect.objectContaining({ code: "DUPLICATE_IN_FILE" }),
    );
  });

  it("reports unknown parent codes", async () => {
    const { service } = createService();

    const result = await service.dryRunDepartmentCsv(
      adminContext,
      makeFile("code,name,parentCode\nAI_RESEARCH,AI Research,MISSING_PARENT\n"),
    );

    expect(result.rows[0]!.errors).toContainEqual(
      expect.objectContaining({ field: "parentCode", code: "UNKNOWN_PARENT" }),
    );
  });

  it("reports self parent and file-local parent cycles", async () => {
    const { service } = createService();

    const result = await service.dryRunDepartmentCsv(
      adminContext,
      makeFile(
        [
          "code,name,parentCode",
          "SELF,Self,SELF",
          "CYCLE_A,Cycle A,CYCLE_B",
          "CYCLE_B,Cycle B,CYCLE_A",
        ].join("\n"),
      ),
    );

    expect(result.rows[0]!.errors).toContainEqual(
      expect.objectContaining({ code: "PARENT_CYCLE" }),
    );
    expect(result.rows[1]!.errors).toContainEqual(
      expect.objectContaining({ code: "PARENT_CYCLE" }),
    );
    expect(result.rows[2]!.errors).toContainEqual(
      expect.objectContaining({ code: "PARENT_CYCLE" }),
    );
  });

  it("returns existing DB codes as warning review rows", async () => {
    const { service } = createService([
      { code: "AI_RESEARCH", status: DepartmentStatus.ACTIVE },
    ]);

    const result = await service.dryRunDepartmentCsv(
      adminContext,
      makeFile("code,name\nAI_RESEARCH,AI Research\n"),
    );

    expect(result.summary).toMatchObject({
      validRows: 1,
      warningRows: 1,
      createCandidates: 0,
      existingCodeRows: 1,
    });
    expect(result.rows[0]!).toMatchObject({
      status: "WARNING",
      candidateAction: "REVIEW_EXISTING",
    });
    expect(result.rows[0]!.warnings).toContainEqual(
      expect.objectContaining({ field: "code", code: "EXISTING_CODE" }),
    );
  });

  it("reports unknown columns strictly", async () => {
    const { service } = createService();

    const result = await service.dryRunDepartmentCsv(
      adminContext,
      makeFile("code,name,status\nAI_RESEARCH,AI Research,ACTIVE\n"),
    );

    expect(result.rows[0]!.errors).toContainEqual(
      expect.objectContaining({ field: "status", code: "UNKNOWN_COLUMN" }),
    );
  });

  it("rejects formula-like values", async () => {
    const { service } = createService();

    const result = await service.dryRunDepartmentCsv(
      adminContext,
      makeFile("code,name\nAI_RESEARCH,=cmd\n"),
    );

    expect(result.rows[0]!.errors).toContainEqual(
      expect.objectContaining({ field: "name", code: "FORMULA_LIKE_VALUE" }),
    );
  });
});
