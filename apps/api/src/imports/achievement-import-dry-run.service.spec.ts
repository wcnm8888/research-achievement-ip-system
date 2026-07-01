import { UserStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { UserContext } from "../identity/user-context";
import { AchievementImportDryRunRepository } from "./achievement-import-dry-run.repository";
import {
  AchievementImportDryRunService,
  InvalidAchievementImportCsvError,
} from "./achievement-import-dry-run.service";

const ids = {
  admin: "40000000-0000-4000-8000-000000000001",
  owner: "40000000-0000-4000-8000-000000000002",
  contributor: "40000000-0000-4000-8000-000000000003",
  role: "50000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
};

const adminContext: UserContext = {
  userId: ids.admin,
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
  originalName: "achievements.csv",
  mimeType: "text/csv",
  size: Buffer.byteLength(content),
  buffer: Buffer.from(content, "utf8"),
});

const activeUser = (email: string, overrides: Partial<{
  id: string;
  departmentId: string;
  status: UserStatus;
  archivedAt: Date | null;
}> = {}) => ({
  id: overrides.id ?? ids.owner,
  email,
  departmentId: overrides.departmentId ?? ids.department,
  status: overrides.status ?? UserStatus.ACTIVE,
  archivedAt: overrides.archivedAt ?? null,
});

const createService = (input: {
  departments?: Array<{ id: string; code: string }>;
  users?: ReturnType<typeof activeUser>[];
  conflicts?: Array<{
    field: "doi" | "applicationNo" | "patentNo" | "grantNo" | "registrationNo";
    normalizedValue: string;
  }>;
} = {}) => {
  const repository = {
    findActiveDepartmentsByCodes: vi.fn().mockResolvedValue(input.departments ?? []),
    findUsersByEmails: vi.fn().mockResolvedValue(input.users ?? []),
    findNormalizedConflicts: vi.fn().mockResolvedValue(input.conflicts ?? []),
  };

  return {
    repository,
    service: new AchievementImportDryRunService(
      repository as unknown as AchievementImportDryRunRepository,
    ),
  };
};

describe("AchievementImportDryRunService", () => {
  it("returns safe no-write previews for paper, patent, and software copyright rows", async () => {
    const { service, repository } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      users: [
        activeUser("owner@example.org"),
        activeUser("contributor@example.org", { id: ids.contributor }),
      ],
    });

    const result = await service.dryRunAchievementCsv(
      adminContext,
      makeFile(
        [
          "type,title,ownerEmail,departmentCode,contributors,status,DOI,patentNo,softwareRegistrationNo",
          "PAPER,Paper A,owner@example.org,RD,Contributor|AUTHOR|FIRST_AUTHOR|contributor@example.org|Lab,DRAFT,https://doi.org/10.1000/Example,,",
          "PATENT,Patent A,owner@example.org,RD,Inventor|INVENTOR|PRIMARY_INVENTOR|contributor@example.org|Lab,DRAFT,, CN-001 ,",
          "SOFTWARE_COPYRIGHT,Software A,owner@example.org,RD,Owner|COPYRIGHT_OWNER|OWNER|contributor@example.org|Lab,DRAFT,,, SW-001 ",
        ].join("\n"),
      ),
    );

    expect(result).toMatchObject({
      importType: "ACHIEVEMENT",
      dryRun: true,
      summary: {
        totalRows: 3,
        validRows: 3,
        errorRows: 0,
        warningRows: 0,
        createDraftCandidates: 3,
        ownerEmployeeNoLookup: "NOT_AVAILABLE",
      },
    });
    expect(result.rows[0]!).toMatchObject({
      rowNumber: 2,
      status: "VALID",
      candidateAction: "CREATE_DRAFT",
      parsed: {
        type: "PAPER",
        title: "Paper A",
        ownerEmail: "owner@example.org",
        departmentCode: "RD",
        status: "DRAFT",
        normalizedIdentifiers: { doi: "10.1000/example" },
      },
      errors: [],
      warnings: [],
    });
    expect(result.rows[0]!.parsed.contributors[0]).toMatchObject({
      name: "Contributor",
      contributorType: "AUTHOR",
      contributorRole: "FIRST_AUTHOR",
      userEmail: "contributor@example.org",
      sortOrder: 1,
    });
    expect(repository.findActiveDepartmentsByCodes).toHaveBeenCalledWith(["RD"]);
    expect(repository.findUsersByEmails).toHaveBeenCalledWith([
      "owner@example.org",
      "contributor@example.org",
    ]);
    expect(repository.findNormalizedConflicts).toHaveBeenCalledWith({
      doiNormalizedValues: ["10.1000/example"],
      applicationNoNormalizedValues: [],
      patentNoNormalizedValues: ["CN001"],
      registrationNoNormalizedValues: ["SW001"],
    });
    expect(JSON.stringify(result)).not.toContain("storageKey");
    expect(JSON.stringify(result)).not.toContain("checksum");
  });

  it("reports required fields, invalid enums, unsupported status, and ownerEmployeeNo lookup boundary", async () => {
    const { service } = createService();

    const result = await service.dryRunAchievementCsv(
      adminContext,
      makeFile(
        [
          "type,title,ownerEmployeeNo,departmentCode,contributors,status,secretLevel",
          "BOOK,,E001,,Bad|AUTHOR|||,SUBMITTED,NOPE",
        ].join("\n"),
      ),
    );

    expect(result.rows[0]!.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "type", code: "INVALID_ENUM" }),
        expect.objectContaining({ field: "title", code: "REQUIRED" }),
        expect.objectContaining({ field: "departmentCode", code: "REQUIRED" }),
        expect.objectContaining({
          field: "ownerEmployeeNo",
          code: "OWNER_EMPLOYEE_NO_LOOKUP_NOT_AVAILABLE",
        }),
        expect.objectContaining({ field: "status", code: "INVALID_ENUM" }),
        expect.objectContaining({ field: "secretLevel", code: "INVALID_ENUM" }),
      ]),
    );
  });

  it("reports type/detail mismatches, malformed contributors, and unknown contributor users", async () => {
    const { service } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      users: [activeUser("owner@example.org")],
    });

    const result = await service.dryRunAchievementCsv(
      adminContext,
      makeFile(
        [
          "type,title,ownerEmail,departmentCode,contributors,patentNo",
          "PAPER,Paper,owner@example.org,RD,Inventor|INVENTOR|PRIMARY_INVENTOR|missing@example.org|Lab,CN-001",
        ].join("\n"),
      ),
    );

    expect(result.rows[0]!.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "patentNo", code: "DETAIL_TYPE_MISMATCH" }),
        expect.objectContaining({
          field: "contributors",
          code: "CONTRIBUTOR_USER_NOT_FOUND",
        }),
        expect.objectContaining({
          field: "contributors",
          code: "CONTRIBUTOR_TYPE_MISMATCH",
        }),
      ]),
    );
  });

  it("reports file duplicate normalized identifiers and DB normalized conflicts", async () => {
    const { service } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      users: [activeUser("owner@example.org")],
      conflicts: [{ field: "doi", normalizedValue: "10.1000/existing" }],
    });

    const result = await service.dryRunAchievementCsv(
      adminContext,
      makeFile(
        [
          "type,title,ownerEmail,departmentCode,contributors,doi",
          "PAPER,Existing,owner@example.org,RD,A|AUTHOR||owner@example.org|Lab,10.1000/existing",
          "PAPER,Dup One,owner@example.org,RD,A|AUTHOR||owner@example.org|Lab,10.1000/dup",
          "PAPER,Dup Two,owner@example.org,RD,A|AUTHOR||owner@example.org|Lab,https://doi.org/10.1000/DUP",
        ].join("\n"),
      ),
    );

    expect(result.summary).toMatchObject({
      errorRows: 2,
      warningRows: 1,
      duplicateIdentifierRows: 2,
      dbConflictRows: 1,
    });
    expect(result.rows[0]!.warnings).toContainEqual(
      expect.objectContaining({ field: "doi", code: "DB_CONFLICT" }),
    );
    expect(result.rows[1]!.errors).toContainEqual(
      expect.objectContaining({ field: "doi", code: "DUPLICATE_IN_FILE" }),
    );
    expect(result.rows[2]!.errors).toContainEqual(
      expect.objectContaining({ field: "doi", code: "DUPLICATE_IN_FILE" }),
    );
  });

  it("reports unknown department, owner not found, and owner department mismatch", async () => {
    const { service } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      users: [
        activeUser("other-dept@example.org", {
          id: "40000000-0000-4000-8000-000000000004",
          departmentId: "10000000-0000-4000-8000-000000000099",
        }),
      ],
    });

    const result = await service.dryRunAchievementCsv(
      adminContext,
      makeFile(
        [
          "type,title,ownerEmail,departmentCode,contributors,doi",
          "PAPER,Unknown Dept,missing@example.org,MISSING,A|AUTHOR|||Lab,10.1000/a",
          "PAPER,Owner Mismatch,other-dept@example.org,RD,A|AUTHOR|||Lab,10.1000/b",
        ].join("\n"),
      ),
    );

    expect(result.rows[0]!.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "departmentCode", code: "UNKNOWN_DEPARTMENT" }),
        expect.objectContaining({ field: "ownerEmail", code: "OWNER_NOT_FOUND" }),
      ]),
    );
    expect(result.rows[1]!.errors).toContainEqual(
      expect.objectContaining({ field: "ownerEmail", code: "OWNER_DEPARTMENT_MISMATCH" }),
    );
  });

  it("reports sensitive columns safely without echoing values", async () => {
    const { service } = createService();

    const result = await service.dryRunAchievementCsv(
      adminContext,
      makeFile(
        "type,title,ownerEmail,departmentCode,contributors,storageKey\nPAPER,Paper,owner@example.org,RD,A|AUTHOR|||Lab,hidden-storage-key\n",
      ),
    );

    expect(result.columns.received).toContain("(sensitive)");
    expect(result.columns.received).not.toContain("storageKey");
    expect(result.rows[0]!.errors).toContainEqual(
      expect.objectContaining({
        field: "(sensitive)",
        code: "FORBIDDEN_SENSITIVE_COLUMN",
      }),
    );
    expect(JSON.stringify(result)).not.toContain("hidden-storage-key");
  });

  it("rejects files over the row limit", async () => {
    const { service } = createService();
    const rows = Array.from({ length: 501 }, (_, index) =>
      `PAPER,Paper ${index},owner@example.org,RD,A|AUTHOR|||Lab,10.1000/${index}`,
    );

    await expect(
      service.dryRunAchievementCsv(
        adminContext,
        makeFile(["type,title,ownerEmail,departmentCode,contributors,doi", ...rows].join("\n")),
      ),
    ).rejects.toThrow(InvalidAchievementImportCsvError);
  });
});
