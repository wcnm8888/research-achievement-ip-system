import {
  AchievementType,
  ImportFamily,
  ImportJobStatus,
  ImportMode,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { UserContext } from "../identity/user-context";
import { ImportJobHistoryReadRepository } from "./import-job-history-read.repository";
import {
  ImportJobHistoryNotFoundError,
  ImportJobHistoryReadService,
  sanitizeSafeSummary,
} from "./import-job-history-read.service";

const ids = {
  user: "40000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  job: "70000000-0000-4000-8000-000000000001",
};

const context: UserContext = {
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

const createRepository = () => ({
  findById: vi.fn(),
  findMany: vi.fn(),
});

describe("ImportJobHistoryReadService", () => {
  it("lists import jobs with defaults and safe list DTO fields", async () => {
    const repository = createRepository();
    repository.findMany.mockResolvedValue({
      items: [
        {
          id: ids.job,
          family: ImportFamily.ACHIEVEMENT,
          mode: ImportMode.CREATE_DRAFT_ONLY,
          achievementType: AchievementType.PAPER,
          status: ImportJobStatus.SUCCESS,
          acceptedRowCount: 2,
          createdBusinessCount: 2,
          createdCompanionCount: 4,
          auditCount: 2,
          safeErrorCodes: ["VALIDATION_ERROR_BLOCKED", "unsafe code with spaces"],
          createdAt: new Date("2026-07-04T01:00:00.000Z"),
          completedAt: new Date("2026-07-04T01:01:00.000Z"),
          latestRun: {
            status: "SUCCESS",
            failureCode: null,
            failureStage: null,
            startedAt: new Date("2026-07-04T01:00:00.000Z"),
            finishedAt: new Date("2026-07-04T01:01:00.000Z"),
          },
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    const result = await new ImportJobHistoryReadService(
      repository as unknown as ImportJobHistoryReadRepository,
    ).listImportJobs(context, {});

    expect(repository.findMany).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    expect(result).toEqual({
      items: [
        {
          id: ids.job,
          family: "ACHIEVEMENT",
          mode: "CREATE_DRAFT_ONLY",
          achievementType: "PAPER",
          status: "SUCCESS",
          acceptedRowCount: 2,
          createdBusinessCount: 2,
          createdCompanionCount: 4,
          auditCount: 2,
          safeErrorCodes: ["VALIDATION_ERROR_BLOCKED"],
          createdAt: new Date("2026-07-04T01:00:00.000Z"),
          completedAt: new Date("2026-07-04T01:01:00.000Z"),
          latestRun: {
            status: "SUCCESS",
            failureCode: null,
            failureStage: null,
            startedAt: new Date("2026-07-04T01:00:00.000Z"),
            finishedAt: new Date("2026-07-04T01:01:00.000Z"),
          },
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });
  });

  it("returns detail runs with sanitized summaries and audit count only", async () => {
    const repository = createRepository();
    repository.findById.mockResolvedValue({
      id: ids.job,
      family: ImportFamily.USER_ACCOUNT,
      mode: ImportMode.CREATE_ONLY_PENDING_NO_CREDENTIAL,
      achievementType: null,
      status: ImportJobStatus.REJECTED,
      acceptedRowCount: 0,
      createdBusinessCount: 0,
      createdCompanionCount: 0,
      auditCount: 0,
      safeErrorCodes: ["EXISTING_USER"],
      createdAt: new Date("2026-07-04T01:00:00.000Z"),
      completedAt: new Date("2026-07-04T01:01:00.000Z"),
      latestRun: {
        status: "REJECTED",
        failureCode: "VALIDATION_BLOCKED",
        failureStage: "VALIDATION",
        startedAt: new Date("2026-07-04T01:00:00.000Z"),
        finishedAt: new Date("2026-07-04T01:01:00.000Z"),
      },
      safeSummary: {
        importType: "USER_ACCOUNT",
        mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
        operation: "USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL",
        totalRows: 1,
        acceptedRowCount: 0,
        createdUsersCount: 0,
        blockedIdentifier: "UNSAFE VALUE",
        blockedConnectionRef: "UNSAFE VALUE",
        errors: [
          {
            rowNumber: 2,
            field: "identity",
            code: "EXISTING_USER",
            message: "contains raw text that must be removed",
          },
        ],
      },
      runs: [
        {
          attemptNo: 1,
          trigger: "INITIAL_SUBMIT",
          status: "REJECTED",
          failureCode: "VALIDATION_BLOCKED",
          failureStage: "VALIDATION",
          startedAt: new Date("2026-07-04T01:00:00.000Z"),
          finishedAt: new Date("2026-07-04T01:01:00.000Z"),
          completedBusinessTransactionAt: null,
        validationSummary: {
          safeErrorCodes: ["EXISTING_USER"],
          blockedEmployeeRef: "UNSAFE VALUE",
          errors: [{ field: "identity", code: "EXISTING_USER" }],
        },
        applySummary: {
          credentialMode: "NO_CREDENTIAL",
          blockedCsvPayload: "UNSAFE VALUE",
        },
        auditCount: 3,
      },
      ],
    });

    const result = await new ImportJobHistoryReadService(
      repository as unknown as ImportJobHistoryReadRepository,
    ).getImportJob(context, ids.job);
    const serialized = JSON.stringify(result);

    expect(result.runs[0]?.auditCount).toBe(3);
    expect(serialized).toContain("EXISTING_USER");
    expect(serialized).not.toContain("auditLogIds");
    expect(serialized).not.toContain("blockedIdentifier");
    expect(serialized).not.toContain("blockedEmployeeRef");
    expect(serialized).not.toContain("blockedConnectionRef");
    expect(serialized).not.toContain("blockedCsvPayload");
    expect(serialized).not.toContain("message");
  });

  it("throws not found when repository returns no detail row", async () => {
    const repository = createRepository();
    repository.findById.mockResolvedValue(null);

    await expect(
      new ImportJobHistoryReadService(
        repository as unknown as ImportJobHistoryReadRepository,
      ).getImportJob(context, ids.job),
    ).rejects.toBeInstanceOf(ImportJobHistoryNotFoundError);
  });

  it("sanitizes non-allowlisted keys and unsafe string values", () => {
    expect(
      sanitizeSafeSummary({
        totalRows: 1,
        operation: "DEPARTMENT_IMPORT_CREATE",
        blockedTitle: "UNSAFE VALUE",
        blockedSensitiveRef: "UNSAFE VALUE",
        errors: [
          { rowNumber: 2, field: "departmentReference", code: "UNKNOWN_DEPARTMENT" },
          { rowNumber: 3, field: "UNSAFE VALUE", code: "BAD VALUE" },
        ],
      }),
    ).toEqual({
      totalRows: 1,
      operation: "DEPARTMENT_IMPORT_CREATE",
      errors: [
        { rowNumber: 2, field: "departmentReference", code: "UNKNOWN_DEPARTMENT" },
        { rowNumber: 3 },
      ],
    });
  });
});
