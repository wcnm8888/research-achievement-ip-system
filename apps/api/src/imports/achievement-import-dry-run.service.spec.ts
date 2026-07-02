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
  applyDepartments?: Array<{
    id: string;
    code: string;
    status: "ACTIVE" | "ARCHIVED";
    archivedAt: Date | null;
  }>;
  applyUsers?: ReturnType<typeof activeUser>[];
  applyDoiConflicts?: Array<{ field: "doi"; normalizedValue: string }>;
  createError?: unknown;
  auditError?: unknown;
} = {}) => {
  const createdAchievement = {
    id: "30000000-0000-4000-8000-000000000001",
    type: "PAPER",
    status: "DRAFT",
    secretLevel: "INTERNAL",
    departmentId: ids.department,
    ownerUserId: ids.owner,
    createdById: ids.admin,
    updatedById: ids.admin,
    version: 1,
    paperDetail: {
      achievementId: "30000000-0000-4000-8000-000000000001",
      doiNormalized: "10.1000/example",
    },
    contributors: [{ id: "70000000-0000-4000-8000-000000000001" }],
  };
  const repository = {
    findActiveDepartmentsByCodes: vi.fn().mockResolvedValue(input.departments ?? []),
    findUsersByEmails: vi.fn().mockResolvedValue(input.users ?? []),
    findNormalizedConflicts: vi.fn().mockResolvedValue(input.conflicts ?? []),
    findApplyDepartmentsByCodesInTransaction: vi.fn().mockResolvedValue(
      input.applyDepartments ??
        (input.departments ?? []).map((department) => ({
          ...department,
          status: "ACTIVE",
          archivedAt: null,
        })),
    ),
    findApplyUsersByEmailsInTransaction: vi.fn().mockResolvedValue(
      input.applyUsers ?? input.users ?? [],
    ),
    findApplyPaperDoiConflictsInTransaction: vi.fn().mockResolvedValue(
      input.applyDoiConflicts ?? [],
    ),
    createPaperDraftInTransaction: vi.fn().mockImplementation(() => {
      if (input.createError) {
        throw input.createError;
      }
      return Promise.resolve(createdAchievement);
    }),
    isPrismaUniqueConflict: vi.fn((error: unknown) => Boolean((error as { code?: string })?.code === "P2002")),
    getPrismaUniqueConflictTarget: vi.fn((error: unknown) => (error as { meta?: { target?: string[] } })?.meta?.target ?? []),
  };
  const tx = {};
  const prisma = {
    $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  };
  const auditService = {
    recordEventInTransaction: vi.fn().mockImplementation(() => {
      if (input.auditError) {
        throw input.auditError;
      }
      return Promise.resolve({ id: "audit-log-id" });
    }),
  };

  return {
    auditService,
    prisma,
    repository,
    service: new AchievementImportDryRunService(
      repository as unknown as AchievementImportDryRunRepository,
      prisma as never,
      auditService as never,
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

  it("applies PAPER rows as draft achievements with detail, contributors, and safe audit", async () => {
    const { service, repository, prisma, auditService } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      users: [
        activeUser("owner@example.org"),
        activeUser("contributor@example.org", { id: ids.contributor }),
      ],
    });

    const result = await service.applyAchievementCsv(
      adminContext,
      makeFile(
        [
          "type,title,ownerEmail,departmentCode,contributors,status,doi,journal,abstract",
          "PAPER,Paper A,owner@example.org,RD,Contributor|AUTHOR|FIRST_AUTHOR|contributor@example.org|Lab,DRAFT,10.1000/Example,Journal,Hidden abstract",
        ].join("\n"),
      ),
      "CREATE_DRAFT_ONLY",
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(repository.createPaperDraftInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: "PAPER",
        title: "Paper A",
        departmentId: ids.department,
        ownerUserId: ids.owner,
        createdById: ids.admin,
        updatedById: ids.admin,
        paperDetail: expect.objectContaining({
          doi: "10.1000/Example",
          doiNormalized: "10.1000/example",
          journal: "Journal",
          abstract: "Hidden abstract",
        }),
        contributors: [
          expect.objectContaining({
            name: "Contributor",
            userId: ids.contributor,
            contributorType: "AUTHOR",
            contributorRole: "FIRST_AUTHOR",
            sortOrder: 1,
          }),
        ],
      }),
    );
    expect(result).toMatchObject({
      importType: "ACHIEVEMENT",
      dryRun: false,
      mode: "CREATE_DRAFT_ONLY",
      summary: {
        totalRows: 1,
        createdAchievementsCount: 1,
        createdPaperDetailsCount: 1,
        createdContributorsCount: 1,
        auditOperation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT",
      },
    });
    const auditInput = auditService.recordEventInTransaction.mock.calls[0]![1];
    const auditJson = JSON.stringify(auditInput);
    expect(auditInput).toMatchObject({
      action: "CREATE",
      target: {
        type: "ACHIEVEMENT",
        id: "30000000-0000-4000-8000-000000000001",
        departmentId: ids.department,
        secretLevel: "INTERNAL",
      },
      oldValue: null,
      newValue: expect.objectContaining({
        operation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT",
        mode: "CREATE_DRAFT_ONLY",
        rowNumber: 2,
        type: "PAPER",
        status: "DRAFT",
        identifierFieldsPresent: ["doi"],
      }),
    });
    expect(auditJson).not.toContain("Paper A");
    expect(auditJson).not.toContain("Hidden abstract");
    expect(auditJson).not.toContain("owner@example.org");
    expect(auditJson).not.toContain("contributor@example.org");
    expect(auditJson).not.toContain("Contributor");
    expect(auditJson).not.toContain("10.1000");
  });

  it("rejects unsupported apply mode before parsing or writing", async () => {
    const { service, repository, prisma } = createService();

    await expect(
      service.applyAchievementCsv(adminContext, makeFile("not,a,valid,csv\n"), "CREATE_ALL"),
    ).rejects.toMatchObject({
      name: "InvalidAchievementImportApplyModeError",
    });

    expect(repository.findActiveDepartmentsByCodes).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects PATENT and SOFTWARE_COPYRIGHT rows for the first apply slice", async () => {
    const { service, repository, prisma } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      users: [
        activeUser("owner@example.org"),
        activeUser("contributor@example.org", { id: ids.contributor }),
      ],
    });

    await expect(
      service.applyAchievementCsv(
        adminContext,
        makeFile(
          [
            "type,title,ownerEmail,departmentCode,contributors,patentNo,softwareRegistrationNo",
            "PATENT,Patent A,owner@example.org,RD,Inventor|INVENTOR|PRIMARY_INVENTOR|contributor@example.org|Lab,CN-001,",
            "SOFTWARE_COPYRIGHT,Software A,owner@example.org,RD,Owner|COPYRIGHT_OWNER|OWNER|contributor@example.org|Lab,,SW-001",
          ].join("\n"),
        ),
      ),
    ).rejects.toMatchObject({
      result: expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ field: "type", code: "UNSUPPORTED_TYPE" }),
        ]),
      }),
    });

    expect(repository.createPaperDraftInTransaction).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects missing DOI during apply even when dry-run can preview the row", async () => {
    const { service, prisma } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      users: [activeUser("owner@example.org")],
    });

    await expect(
      service.applyAchievementCsv(
        adminContext,
        makeFile(
          "type,title,ownerEmail,departmentCode,contributors\nPAPER,Paper,owner@example.org,RD,A|AUTHOR||owner@example.org|Lab\n",
        ),
      ),
    ).rejects.toMatchObject({
      result: expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ field: "doi", code: "REQUIRED" }),
        ]),
      }),
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("blocks apply when the dry-run plan has warnings or errors", async () => {
    const { service, prisma } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      users: [activeUser("owner@example.org")],
      conflicts: [{ field: "doi", normalizedValue: "10.1000/existing" }],
    });

    await expect(
      service.applyAchievementCsv(
        adminContext,
        makeFile(
          [
            "type,title,ownerEmail,departmentCode,contributors,doi",
            "PAPER,Existing,owner@example.org,RD,A|AUTHOR||owner@example.org|Lab,10.1000/existing",
            "PAPER,Missing Owner,missing@example.org,RD,A|AUTHOR|||Lab,10.1000/new",
          ].join("\n"),
        ),
      ),
    ).rejects.toMatchObject({
      result: expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ code: "DB_CONFLICT" }),
          expect.objectContaining({ code: "OWNER_NOT_FOUND" }),
        ]),
      }),
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects owner department mismatch found during transaction recheck", async () => {
    const { service, repository } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      users: [activeUser("owner@example.org")],
      applyUsers: [
        activeUser("owner@example.org", {
          departmentId: "10000000-0000-4000-8000-000000000099",
        }),
      ],
    });

    await expect(
      service.applyAchievementCsv(
        adminContext,
        makeFile(
          "type,title,ownerEmail,departmentCode,contributors,doi\nPAPER,Paper,owner@example.org,RD,A|AUTHOR|||Lab,10.1000/new\n",
        ),
      ),
    ).rejects.toMatchObject({
      result: expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ code: "OWNER_DEPARTMENT_MISMATCH" }),
        ]),
      }),
    });

    expect(repository.createPaperDraftInTransaction).not.toHaveBeenCalled();
  });

  it("rejects missing contributor user found during transaction recheck", async () => {
    const { service, repository } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      users: [
        activeUser("owner@example.org"),
        activeUser("contributor@example.org", { id: ids.contributor }),
      ],
      applyUsers: [activeUser("owner@example.org")],
    });

    await expect(
      service.applyAchievementCsv(
        adminContext,
        makeFile(
          "type,title,ownerEmail,departmentCode,contributors,doi\nPAPER,Paper,owner@example.org,RD,Contributor|AUTHOR||contributor@example.org|Lab,10.1000/new\n",
        ),
      ),
    ).rejects.toMatchObject({
      result: expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ code: "CONTRIBUTOR_USER_NOT_FOUND" }),
        ]),
      }),
    });

    expect(repository.createPaperDraftInTransaction).not.toHaveBeenCalled();
  });

  it("maps DOI race recheck and unique conflicts to safe conflicts", async () => {
    const race = createService({
      departments: [{ id: ids.department, code: "RD" }],
      users: [activeUser("owner@example.org")],
      applyDoiConflicts: [{ field: "doi", normalizedValue: "10.1000/new" }],
    });

    await expect(
      race.service.applyAchievementCsv(
        adminContext,
        makeFile(
          "type,title,ownerEmail,departmentCode,contributors,doi\nPAPER,Paper,owner@example.org,RD,A|AUTHOR||owner@example.org|Lab,10.1000/new\n",
        ),
      ),
    ).rejects.toMatchObject({
      result: expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ field: "doi", code: "DB_CONFLICT" }),
        ]),
      }),
    });

    expect(race.repository.createPaperDraftInTransaction).not.toHaveBeenCalled();

    const unique = createService({
      departments: [{ id: ids.department, code: "RD" }],
      users: [activeUser("owner@example.org")],
      createError: { code: "P2002", meta: { target: ["doi_normalized"] } },
    });

    await expect(
      unique.service.applyAchievementCsv(
        adminContext,
        makeFile(
          "type,title,ownerEmail,departmentCode,contributors,doi\nPAPER,Paper,owner@example.org,RD,A|AUTHOR||owner@example.org|Lab,10.1000/new\n",
        ),
      ),
    ).rejects.toMatchObject({
      result: expect.objectContaining({
        errors: [expect.objectContaining({ field: "doi", code: "DB_CONFLICT" })],
      }),
    });
  });

  it("rejects apply when audit writing fails inside the transaction boundary", async () => {
    const auditError = new Error("audit failed");
    const { service, repository, auditService } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      users: [activeUser("owner@example.org")],
      auditError,
    });

    await expect(
      service.applyAchievementCsv(
        adminContext,
        makeFile(
          "type,title,ownerEmail,departmentCode,contributors,doi\nPAPER,Paper,owner@example.org,RD,A|AUTHOR||owner@example.org|Lab,10.1000/new\n",
        ),
      ),
    ).rejects.toBe(auditError);

    expect(repository.createPaperDraftInTransaction).toHaveBeenCalledOnce();
    expect(auditService.recordEventInTransaction).toHaveBeenCalledOnce();
  });
});
