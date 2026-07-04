import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AccountManagementApiClient, AuthUser } from "./api-client";
import {
  AchievementImportApplyConfirmation,
  AchievementImportApplyErrorView,
  AchievementImportApplyResultView,
  AchievementImportDryRunPanel,
  AchievementImportDryRunResultView,
  Achievements,
  achievementImportHistoryFilters,
  applyAchievementImport,
  buildAchievementImportFileFingerprint,
  buildAchievementListQuery,
  canCreateAchievementDraft,
  canEditAchievementDraft,
  dryRunAchievementImport,
  getAchievementImportApplyEligibility,
  getAchievementDisplayTitle,
  hasAchievementImportDryRunPermission,
  isAchievementImportFileFingerprintMatch,
  isAchievementTitleRedacted,
  validateAchievementImportCsvFile,
} from "./Achievements";
import type {
  AchievementImportApplyResult,
  AchievementImportDryRunResult,
  AchievementListItem,
} from "./types";

const createAuthUser = (
  patch: Partial<Pick<AuthUser, "id" | "permissionCodes">> = {},
): Pick<AuthUser, "id" | "permissionCodes"> => ({
  id: "researcher-id",
  permissionCodes: ["achievement:create", "achievement:update_own"],
  ...patch,
});

const createAchievementItem = (
  patch: Partial<AchievementListItem> = {},
): AchievementListItem => ({
  id: "achievement-id",
  type: "PAPER",
  status: "DRAFT",
  secretLevel: "INTERNAL",
  departmentId: "department-id",
  ownerUserId: "researcher-id",
  title: "[LOCAL-SYNTHETIC-ROLE-ACCEPTANCE]",
  createdAt: "2026-06-25T00:00:00.000Z",
  updatedAt: "2026-06-25T00:00:00.000Z",
  submittedAt: null,
  archivedAt: null,
  voidedAt: null,
  isRestricted: false,
  isRedacted: false,
  ...patch,
});

const achievementImportDryRunResult: AchievementImportDryRunResult = {
  importType: "ACHIEVEMENT",
  dryRun: true,
  file: {
    name: "achievements.csv",
    size: 256,
    mimeType: "text/csv",
    encoding: "utf-8",
  },
  columns: {
    required: ["type", "title", "departmentCode", "contributors"],
    optional: ["ownerEmail", "ownerEmployeeNo", "status", "DOI", "patentNo", "softwareRegistrationNo"],
    received: ["type", "title", "ownerEmail", "departmentCode", "contributors", "DOI"],
  },
  summary: {
    totalRows: 3,
    validRows: 1,
    errorRows: 1,
    warningRows: 1,
    createDraftCandidates: 1,
    duplicateIdentifierRows: 1,
    dbConflictRows: 1,
    ownerEmployeeNoLookup: "NOT_AVAILABLE",
  },
  rows: [
    {
      rowNumber: 2,
      parsed: {
        type: "PAPER",
        title: "Paper A",
        ownerEmail: "owner@example.org",
        ownerEmployeeNo: null,
        departmentCode: "RD",
        secretLevel: "INTERNAL",
        status: "DRAFT",
        contributors: [
          {
            name: "Contributor",
            contributorType: "AUTHOR",
            contributorRole: "FIRST_AUTHOR",
            userEmail: "contributor@example.org",
            organization: "Lab",
            sortOrder: 1,
          },
        ],
        identifiers: {
          doi: "https://doi.org/10.1000/Existing",
          applicationNo: null,
          patentNo: null,
          registrationNo: null,
        },
        normalizedIdentifiers: {
          doi: "10.1000/existing",
          applicationNo: null,
          patentNo: null,
          registrationNo: null,
        },
      },
      status: "WARNING",
      candidateAction: "CREATE_DRAFT",
      errors: [],
      warnings: [
        {
          field: "doi",
          code: "DB_CONFLICT",
          message: "An achievement with this normalized DOI already exists.",
        },
      ],
    },
    {
      rowNumber: 3,
      parsed: {
        type: "PATENT",
        title: "Patent A",
        ownerEmail: "owner@example.org",
        ownerEmployeeNo: null,
        departmentCode: "UNKNOWN",
        secretLevel: "INTERNAL",
        status: "DRAFT",
        contributors: [],
        identifiers: {
          doi: null,
          applicationNo: null,
          patentNo: "CN-001",
          registrationNo: null,
        },
        normalizedIdentifiers: {
          doi: null,
          applicationNo: null,
          patentNo: "CN001",
          registrationNo: null,
        },
      },
      status: "ERROR",
      candidateAction: "SKIP",
      errors: [
        {
          field: "patentNo",
          code: "DUPLICATE_IN_FILE",
          message: "Duplicate normalized patent number in uploaded file.",
        },
        {
          field: "departmentCode",
          code: "UNKNOWN_DEPARTMENT",
          message: "Department code was not found.",
        },
      ],
      warnings: [],
    },
    {
      rowNumber: 4,
      parsed: {
        type: "SOFTWARE_COPYRIGHT",
        title: "Software A",
        ownerEmail: "owner@example.org",
        ownerEmployeeNo: null,
        departmentCode: "RD",
        secretLevel: "INTERNAL",
        status: "DRAFT",
        contributors: [],
        identifiers: {
          doi: null,
          applicationNo: null,
          patentNo: null,
          registrationNo: "SW-001",
        },
        normalizedIdentifiers: {
          doi: null,
          applicationNo: null,
          patentNo: null,
          registrationNo: "SW001",
        },
      },
      status: "VALID",
      candidateAction: "CREATE_DRAFT",
      errors: [],
      warnings: [],
    },
  ],
};

const eligibleAchievementImportDryRunResult: AchievementImportDryRunResult = {
  importType: "ACHIEVEMENT",
  dryRun: true,
  file: {
    name: "paper-achievements.csv",
    size: 128,
    mimeType: "text/csv",
    encoding: "utf-8",
  },
  columns: {
    required: ["type", "title", "departmentCode", "contributors"],
    optional: ["ownerEmail", "ownerEmployeeNo", "status", "DOI"],
    received: ["type", "title", "departmentCode", "contributors", "DOI"],
  },
  summary: {
    totalRows: 1,
    validRows: 1,
    errorRows: 0,
    warningRows: 0,
    createDraftCandidates: 1,
    duplicateIdentifierRows: 0,
    dbConflictRows: 0,
    ownerEmployeeNoLookup: "NOT_AVAILABLE",
  },
  rows: [
    {
      rowNumber: 2,
      parsed: {
        type: "PAPER",
        title: "Eligible Paper",
        ownerEmail: null,
        ownerEmployeeNo: null,
        departmentCode: "RD",
        secretLevel: "INTERNAL",
        status: "DRAFT",
        contributors: [
          {
            name: null,
            contributorType: "AUTHOR",
            contributorRole: "FIRST_AUTHOR",
            userEmail: null,
            organization: "Synthetic Lab",
            sortOrder: 1,
          },
        ],
        identifiers: {
          doi: "10.2000/s68e",
          applicationNo: null,
          patentNo: null,
          registrationNo: null,
        },
        normalizedIdentifiers: {
          doi: "10.2000/s68e",
          applicationNo: null,
          patentNo: null,
          registrationNo: null,
        },
      },
      status: "VALID",
      candidateAction: "CREATE_DRAFT",
      errors: [],
      warnings: [],
    },
  ],
};

const eligibleSoftwareCopyrightImportDryRunResult: AchievementImportDryRunResult = {
  ...eligibleAchievementImportDryRunResult,
  file: {
    name: "software-achievements.csv",
    size: 160,
    mimeType: "text/csv",
    encoding: "utf-8",
  },
  columns: {
    required: ["type", "title", "departmentCode", "contributors"],
    optional: ["ownerEmail", "ownerEmployeeNo", "status", "softwareRegistrationNo"],
    received: [
      "type",
      "title",
      "departmentCode",
      "contributors",
      "softwareRegistrationNo",
    ],
  },
  rows: [
    {
      ...eligibleAchievementImportDryRunResult.rows[0]!,
      parsed: {
        ...eligibleAchievementImportDryRunResult.rows[0]!.parsed,
        type: "SOFTWARE_COPYRIGHT",
        title: "Eligible Software",
        contributors: [
          {
            name: null,
            contributorType: "COPYRIGHT_OWNER",
            contributorRole: "OWNER",
            userEmail: null,
            organization: "Synthetic Lab",
            sortOrder: 1,
          },
        ],
        identifiers: {
          doi: null,
          applicationNo: null,
          patentNo: null,
          registrationNo: "SW-69F-001",
        },
        normalizedIdentifiers: {
          doi: null,
          applicationNo: null,
          patentNo: null,
          registrationNo: "SW69F001",
        },
      },
    },
  ],
};

const eligiblePatentImportDryRunResult: AchievementImportDryRunResult = {
  ...eligibleAchievementImportDryRunResult,
  file: {
    name: "patent-achievements.csv",
    size: 192,
    mimeType: "text/csv",
    encoding: "utf-8",
  },
  columns: {
    required: ["type", "title", "departmentCode", "contributors"],
    optional: ["ownerEmail", "ownerEmployeeNo", "status", "applicationNo", "patentNo"],
    received: [
      "type",
      "title",
      "departmentCode",
      "contributors",
      "applicationNo",
      "patentNo",
    ],
  },
  rows: [
    {
      ...eligibleAchievementImportDryRunResult.rows[0]!,
      parsed: {
        ...eligibleAchievementImportDryRunResult.rows[0]!.parsed,
        type: "PATENT",
        title: "Eligible Patent",
        contributors: [
          {
            name: null,
            contributorType: "INVENTOR",
            contributorRole: "PRIMARY_INVENTOR",
            userEmail: null,
            organization: "Synthetic Lab",
            sortOrder: 1,
          },
        ],
        identifiers: {
          doi: null,
          applicationNo: "APP-S70E-001",
          patentNo: "GRANT-S70E-001",
          registrationNo: null,
        },
        normalizedIdentifiers: {
          doi: null,
          applicationNo: "APPS70E001",
          patentNo: "GRANTS70E001",
          registrationNo: null,
        },
      },
    },
  ],
};

const achievementImportApplyResult: AchievementImportApplyResult = {
  importType: "ACHIEVEMENT",
  dryRun: false,
  mode: "CREATE_DRAFT_ONLY",
  file: {
    name: "paper-achievements.csv",
    size: 128,
    mimeType: "text/csv",
    encoding: "utf-8",
  },
  summary: {
    totalRows: 1,
    createdAchievementsCount: 1,
    createdPaperDetailsCount: 1,
    createdPatentDetailsCount: 0,
    createdSoftwareCopyrightDetailsCount: 0,
    createdContributorsCount: 1,
    skippedRows: 0,
    failedRows: 0,
    errorCount: 0,
    warningCount: 0,
    auditOperation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT",
  },
  errors: [],
  rows: [
    {
      rowNumber: 2,
      status: "CREATED",
      createdAchievementId: "70000000-0000-4000-8000-000000000001",
      type: "PAPER",
      achievementStatus: "DRAFT",
      departmentId: "20000000-0000-4000-8000-000000000001",
      ownerUserId: "30000000-0000-4000-8000-000000000001",
      contributorCount: 1,
      auditOperation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT",
    },
  ],
};

const softwareCopyrightImportApplyResult: AchievementImportApplyResult = {
  ...achievementImportApplyResult,
  file: {
    name: "software-achievements.csv",
    size: 160,
    mimeType: "text/csv",
    encoding: "utf-8",
  },
  summary: {
    ...achievementImportApplyResult.summary,
    createdPaperDetailsCount: 0,
    createdSoftwareCopyrightDetailsCount: 1,
  },
  rows: [
    {
      ...achievementImportApplyResult.rows[0]!,
      type: "SOFTWARE_COPYRIGHT",
    },
  ],
};

const patentImportApplyResult: AchievementImportApplyResult = {
  ...achievementImportApplyResult,
  file: {
    name: "patent-achievements.csv",
    size: 192,
    mimeType: "text/csv",
    encoding: "utf-8",
  },
  summary: {
    ...achievementImportApplyResult.summary,
    createdPaperDetailsCount: 0,
    createdPatentDetailsCount: 1,
    createdSoftwareCopyrightDetailsCount: 0,
    createdAuditEventsCount: 1,
  },
  rows: [
    {
      ...achievementImportApplyResult.rows[0]!,
      type: "PATENT",
    },
  ],
};

const createEligibleAchievementImportFile = () =>
  new File(["x".repeat(128)], "paper-achievements.csv", {
    type: "text/csv",
    lastModified: 68000,
  });

const createEligibleSoftwareCopyrightImportFile = () =>
  new File(["x".repeat(160)], "software-achievements.csv", {
    type: "text/csv",
    lastModified: 69000,
  });

const createEligiblePatentImportFile = () =>
  new File(["x".repeat(192)], "patent-achievements.csv", {
    type: "text/csv",
    lastModified: 70000,
  });

describe("buildAchievementListQuery", () => {
  it("trims keyword and keeps filters with pagination", () => {
    expect(
      buildAchievementListQuery(
        {
          keyword: "  neural interface  ",
          status: "ARCHIVED",
          type: "PATENT",
        },
        3,
        20,
      ),
    ).toEqual({
      keyword: "neural interface",
      status: "ARCHIVED",
      type: "PATENT",
      page: 3,
      pageSize: 20,
    });
  });

  it("omits blank keyword without dropping pagination", () => {
    expect(buildAchievementListQuery({ keyword: "   " }, 1, 20)).toEqual({
      keyword: undefined,
      status: undefined,
      type: undefined,
      page: 1,
      pageSize: 20,
    });
  });
});

describe("achievement title display", () => {
  it("does not invent a redacted title", () => {
    const redacted = { title: null, isRedacted: true };

    expect(getAchievementDisplayTitle(redacted)).toBe("已脱敏成果");
    expect(isAchievementTitleRedacted(redacted)).toBe(true);
  });

  it("keeps visible titles unchanged", () => {
    const visible = { title: "Paper A", isRedacted: false };

    expect(getAchievementDisplayTitle(visible)).toBe("Paper A");
    expect(isAchievementTitleRedacted(visible)).toBe(false);
  });
});

describe("achievement role-based UI permissions", () => {
  it("allows researcher create and own draft edit using real permission codes", () => {
    const researcher = createAuthUser();

    expect(canCreateAchievementDraft(researcher)).toBe(true);
    expect(canEditAchievementDraft(researcher, createAchievementItem())).toBe(true);
  });

  it("hides create and edit entries from auditor without achievement write permissions", () => {
    const auditor = createAuthUser({
      id: "auditor-id",
      permissionCodes: ["audit:read_masked"],
    });

    expect(canCreateAchievementDraft(auditor)).toBe(false);
    expect(canEditAchievementDraft(auditor, createAchievementItem())).toBe(false);
  });

  it("does not show own-draft edit for another user's draft or non-editable status", () => {
    const researcher = createAuthUser();

    expect(
      canEditAchievementDraft(
        researcher,
        createAchievementItem({ ownerUserId: "another-user-id" }),
      ),
    ).toBe(false);
    expect(
      canEditAchievementDraft(
        researcher,
        createAchievementItem({ status: "PENDING_DEPARTMENT_REVIEW" }),
      ),
    ).toBe(false);
  });
});

describe("achievement import dry-run UI", () => {
  it("shows the achievement import dry-run entry only for system config users", () => {
    expect(
      hasAchievementImportDryRunPermission(
        createAuthUser({ permissionCodes: ["system:config"] }),
      ),
    ).toBe(true);
    expect(hasAchievementImportDryRunPermission(createAuthUser())).toBe(false);
    expect(hasAchievementImportDryRunPermission(undefined)).toBe(false);
  });

  it("shows achievement import history only inside the system config import boundary", () => {
    const adminHtml = renderToStaticMarkup(
      createElement(Achievements, {
        demoUserId: "admin-user-id",
        authUser: createAuthUser({ permissionCodes: ["system:config"] }),
      }),
    );
    const researcherHtml = renderToStaticMarkup(
      createElement(Achievements, {
        demoUserId: "researcher-id",
        authUser: createAuthUser(),
      }),
    );

    expect(adminHtml).toContain("Achievement CSV dry-run");
    expect(adminHtml).toContain("Achievement import history");
    expect(adminHtml).toContain("All achievement types");
    expect(achievementImportHistoryFilters).toEqual({
      family: "ACHIEVEMENT",
      mode: "CREATE_DRAFT_ONLY",
    });
    expect(researcherHtml).not.toContain("Achievement CSV dry-run");
    expect(researcherHtml).not.toContain("Achievement import history");
  });

  it("validates CSV-only file selection before dry-run submission", () => {
    expect(
      validateAchievementImportCsvFile({
        name: "achievements.csv",
        size: 1024,
        type: "text/csv",
      }),
    ).toBeNull();
    expect(
      validateAchievementImportCsvFile({
        name: "achievements.xlsx",
        size: 1024,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    ).toContain("Only .csv");
    expect(
      validateAchievementImportCsvFile({
        name: "achievements.csv",
        size: 1024 * 1024 + 1,
        type: "text/csv",
      }),
    ).toContain("1 MB");
  });

  it("runs achievement import dry-run through the client", async () => {
    const file = new File(
      ["type,title,ownerEmail,departmentCode,contributors\nPAPER,Paper A,owner@example.org,RD,A|AUTHOR||owner@example.org|Lab"],
      "achievements.csv",
      { type: "text/csv" },
    );
    const client = {
      dryRunAchievementImport: vi.fn(async () => achievementImportDryRunResult),
    } as unknown as Pick<AccountManagementApiClient, "dryRunAchievementImport">;

    await expect(dryRunAchievementImport(client, file)).resolves.toEqual(
      achievementImportDryRunResult,
    );
    expect(client.dryRunAchievementImport).toHaveBeenCalledWith({ file });
  });

  it("runs achievement PAPER apply through the client with CREATE_DRAFT_ONLY mode", async () => {
    const file = new File(["type,title\nPAPER,Paper"], "paper-achievements.csv", {
      type: "text/csv",
    });
    const client = {
      applyAchievementImport: vi.fn(async () => achievementImportApplyResult),
    } as unknown as Pick<AccountManagementApiClient, "applyAchievementImport">;

    await expect(applyAchievementImport(client, file)).resolves.toEqual(
      achievementImportApplyResult,
    );
    expect(client.applyAchievementImport).toHaveBeenCalledWith({
      file,
      mode: "CREATE_DRAFT_ONLY",
    });
  });

  it("renders summary, safe previews, type-specific conflicts, and unknown references", () => {
    const html = renderToStaticMarkup(
      createElement(AchievementImportDryRunResultView, {
        result: achievementImportDryRunResult,
      }),
    );

    expect(html).toContain("Dry-run report ready");
    expect(html).toContain("ACHIEVEMENT");
    expect(html).toContain("Total rows");
    expect(html).toContain("Draft candidates");
    expect(html).toContain("File duplicate conflicts");
    expect(html).toContain("DB conflicts");
    expect(html).toContain("NOT_AVAILABLE");
    expect(html).toContain("PAPER");
    expect(html).toContain("PATENT");
    expect(html).toContain("SOFTWARE_COPYRIGHT");
    expect(html).toContain("10.1000/existing");
    expect(html).toContain("CN001");
    expect(html).toContain("SW001");
    expect(html).toContain("DB_CONFLICT");
    expect(html).toContain("DUPLICATE_IN_FILE");
    expect(html).toContain("UNKNOWN_DEPARTMENT");
    expect(html).not.toContain(["storage", "Key"].join(""));
    expect(html).not.toContain(["check", "sum"].join(""));
  });

  it("renders backend dry-run errors as a front-end error state", () => {
    const html = renderToStaticMarkup(
      createElement(AchievementImportDryRunPanel, {
        file: new File(["type,title"], "achievements.csv", { type: "text/csv" }),
        loading: false,
        error: {
          kind: "bad-request",
          status: 400,
          message: "CSV validation failed.",
          detail: "Unknown department code.",
        },
        result: null,
        onFileChange: vi.fn(),
        onRunDryRun: vi.fn(),
      }),
    );

    expect(html).toContain("CSV validation failed.");
    expect(html).toContain("Unknown department code.");
  });

  it("does not render the apply entry unless the caller wires an apply action", () => {
    const html = renderToStaticMarkup(
      createElement(AchievementImportDryRunPanel, {
        file: null,
        loading: false,
        error: null,
        result: null,
        onFileChange: vi.fn(),
        onRunDryRun: vi.fn(),
      }),
    );

    expect(html).toContain("Run dry-run");
    expect(html).not.toContain("Confirm import");
    expect(html).not.toContain("Apply draft-only PAPER import");
    expect(html).not.toContain("Apply draft-only import");
  });

  it("computes apply eligibility from permission, dry-run result, and file fingerprint", () => {
    const file = createEligibleAchievementImportFile();
    const fingerprint = buildAchievementImportFileFingerprint(
      file,
      eligibleAchievementImportDryRunResult,
    );

    expect(
      isAchievementImportFileFingerprintMatch(
        file,
        eligibleAchievementImportDryRunResult,
        fingerprint,
      ),
    ).toBe(true);
    expect(
      getAchievementImportApplyEligibility({
        authUser: createAuthUser({ permissionCodes: ["system:config"] }),
        file,
        result: eligibleAchievementImportDryRunResult,
        fingerprint,
        dryRunLoading: false,
        applySubmitting: false,
      }),
    ).toEqual({
      eligible: true,
      reason: "Ready to create DRAFT PAPER achievements.",
      applyType: "PAPER",
    });

    const changedFile = new File(["x".repeat(128)], "paper-achievements.csv", {
      type: "text/csv",
      lastModified: 68001,
    });
    expect(
      getAchievementImportApplyEligibility({
        authUser: createAuthUser({ permissionCodes: ["system:config"] }),
        file: changedFile,
        result: eligibleAchievementImportDryRunResult,
        fingerprint,
        dryRunLoading: false,
        applySubmitting: false,
      }).reason,
    ).toContain("changed");
  });

  it("enables SOFTWARE_COPYRIGHT and PATENT apply while keeping PAPER eligibility unchanged", () => {
    const paperFile = createEligibleAchievementImportFile();
    const paperFingerprint = buildAchievementImportFileFingerprint(
      paperFile,
      eligibleAchievementImportDryRunResult,
    );
    const softwareFile = createEligibleSoftwareCopyrightImportFile();
    const softwareFingerprint = buildAchievementImportFileFingerprint(
      softwareFile,
      eligibleSoftwareCopyrightImportDryRunResult,
    );
    const patentFile = createEligiblePatentImportFile();
    const patentFingerprint = buildAchievementImportFileFingerprint(
      patentFile,
      eligiblePatentImportDryRunResult,
    );
    const authUser = createAuthUser({ permissionCodes: ["system:config"] });

    expect(
      getAchievementImportApplyEligibility({
        authUser,
        file: paperFile,
        result: eligibleAchievementImportDryRunResult,
        fingerprint: paperFingerprint,
        dryRunLoading: false,
        applySubmitting: false,
      }),
    ).toEqual({
      eligible: true,
      reason: "Ready to create DRAFT PAPER achievements.",
      applyType: "PAPER",
    });

    expect(
      getAchievementImportApplyEligibility({
        authUser,
        file: softwareFile,
        result: eligibleSoftwareCopyrightImportDryRunResult,
        fingerprint: softwareFingerprint,
        dryRunLoading: false,
        applySubmitting: false,
      }),
    ).toEqual({
      eligible: true,
      reason: "Ready to create DRAFT SOFTWARE_COPYRIGHT achievements.",
      applyType: "SOFTWARE_COPYRIGHT",
    });

    expect(
      getAchievementImportApplyEligibility({
        authUser,
        file: patentFile,
        result: eligiblePatentImportDryRunResult,
        fingerprint: patentFingerprint,
        dryRunLoading: false,
        applySubmitting: false,
      }),
    ).toEqual({
      eligible: true,
      reason: "Ready to create DRAFT PATENT achievements.",
      applyType: "PATENT",
    });
  });

  it("blocks apply for warnings, PATENT, mixed types, missing identifiers, and in-flight requests", () => {
    const file = createEligibleAchievementImportFile();
    const fingerprint = buildAchievementImportFileFingerprint(
      file,
      eligibleAchievementImportDryRunResult,
    );
    const authUser = createAuthUser({ permissionCodes: ["system:config"] });
    const eligibleRow = eligibleAchievementImportDryRunResult.rows[0]!;

    const warningResult: AchievementImportDryRunResult = {
      ...eligibleAchievementImportDryRunResult,
      summary: {
        ...eligibleAchievementImportDryRunResult.summary,
        warningRows: 1,
        dbConflictRows: 1,
      },
      rows: [
        {
          ...eligibleRow,
          status: "WARNING",
          warnings: [
            {
              field: "doi",
              code: "DB_CONFLICT",
              message: "Existing normalized DOI.",
            },
          ],
        },
      ],
    };
    const warningFingerprint = buildAchievementImportFileFingerprint(file, warningResult);
    expect(
      getAchievementImportApplyEligibility({
        authUser,
        file,
        result: warningResult,
        fingerprint: warningFingerprint,
        dryRunLoading: false,
        applySubmitting: false,
      }).reason,
    ).toContain("warnings");

    const patentResult: AchievementImportDryRunResult = {
      ...eligibleAchievementImportDryRunResult,
      rows: [
        {
          ...eligibleRow,
          parsed: {
            ...eligibleRow.parsed,
            type: "PATENT",
          },
        },
      ],
    };
    const patentFingerprint = buildAchievementImportFileFingerprint(file, patentResult);
    expect(
      getAchievementImportApplyEligibility({
        authUser,
        file,
        result: patentResult,
        fingerprint: patentFingerprint,
        dryRunLoading: false,
        applySubmitting: false,
      }).reason,
    ).toContain("PATENT");

    const grantOnlyPatentResult: AchievementImportDryRunResult = {
      ...eligiblePatentImportDryRunResult,
      rows: [
        {
          ...eligiblePatentImportDryRunResult.rows[0]!,
          parsed: {
            ...eligiblePatentImportDryRunResult.rows[0]!.parsed,
            normalizedIdentifiers: {
              ...eligiblePatentImportDryRunResult.rows[0]!.parsed.normalizedIdentifiers,
              applicationNo: null,
            },
          },
        },
      ],
    };
    const patentFile = createEligiblePatentImportFile();
    const grantOnlyFingerprint = buildAchievementImportFileFingerprint(
      patentFile,
      grantOnlyPatentResult,
    );
    expect(
      getAchievementImportApplyEligibility({
        authUser,
        file: patentFile,
        result: grantOnlyPatentResult,
        fingerprint: grantOnlyFingerprint,
        dryRunLoading: false,
        applySubmitting: false,
      }).reason,
    ).toContain("grant-only");

    const mixedResult: AchievementImportDryRunResult = {
      ...eligibleAchievementImportDryRunResult,
      summary: {
        ...eligibleAchievementImportDryRunResult.summary,
        totalRows: 2,
        validRows: 2,
        createDraftCandidates: 2,
      },
      rows: [
        eligibleRow,
        {
          ...eligibleSoftwareCopyrightImportDryRunResult.rows[0]!,
          rowNumber: 3,
        },
      ],
    };
    const mixedFingerprint = buildAchievementImportFileFingerprint(file, mixedResult);
    expect(
      getAchievementImportApplyEligibility({
        authUser,
        file,
        result: mixedResult,
        fingerprint: mixedFingerprint,
        dryRunLoading: false,
        applySubmitting: false,
      }).reason,
    ).toContain("Mixed achievement type");

    const paperPatentMixedResult: AchievementImportDryRunResult = {
      ...eligibleAchievementImportDryRunResult,
      summary: {
        ...eligibleAchievementImportDryRunResult.summary,
        totalRows: 2,
        validRows: 2,
        createDraftCandidates: 2,
      },
      rows: [
        eligibleRow,
        {
          ...eligiblePatentImportDryRunResult.rows[0]!,
          rowNumber: 3,
        },
      ],
    };
    const paperPatentFingerprint = buildAchievementImportFileFingerprint(
      file,
      paperPatentMixedResult,
    );
    expect(
      getAchievementImportApplyEligibility({
        authUser,
        file,
        result: paperPatentMixedResult,
        fingerprint: paperPatentFingerprint,
        dryRunLoading: false,
        applySubmitting: false,
      }).reason,
    ).toContain("Mixed achievement type");

    const missingDoiResult: AchievementImportDryRunResult = {
      ...eligibleAchievementImportDryRunResult,
      rows: [
        {
          ...eligibleRow,
          parsed: {
            ...eligibleRow.parsed,
            normalizedIdentifiers: {
              ...eligibleRow.parsed.normalizedIdentifiers,
              doi: null,
            },
          },
        },
      ],
    };
    const missingDoiFingerprint = buildAchievementImportFileFingerprint(
      file,
      missingDoiResult,
    );
    expect(
      getAchievementImportApplyEligibility({
        authUser,
        file,
        result: missingDoiResult,
        fingerprint: missingDoiFingerprint,
        dryRunLoading: false,
        applySubmitting: false,
      }).reason,
    ).toContain("normalized DOI");

    const missingRegistrationResult: AchievementImportDryRunResult = {
      ...eligibleSoftwareCopyrightImportDryRunResult,
      rows: [
        {
          ...eligibleSoftwareCopyrightImportDryRunResult.rows[0]!,
          parsed: {
            ...eligibleSoftwareCopyrightImportDryRunResult.rows[0]!.parsed,
            normalizedIdentifiers: {
              ...eligibleSoftwareCopyrightImportDryRunResult.rows[0]!.parsed.normalizedIdentifiers,
              registrationNo: null,
            },
          },
        },
      ],
    };
    const softwareFile = createEligibleSoftwareCopyrightImportFile();
    const missingRegistrationFingerprint = buildAchievementImportFileFingerprint(
      softwareFile,
      missingRegistrationResult,
    );
    expect(
      getAchievementImportApplyEligibility({
        authUser,
        file: softwareFile,
        result: missingRegistrationResult,
        fingerprint: missingRegistrationFingerprint,
        dryRunLoading: false,
        applySubmitting: false,
      }).reason,
    ).toContain("normalized software registration number");

    const missingApplicationResult: AchievementImportDryRunResult = {
      ...eligiblePatentImportDryRunResult,
      rows: [
        {
          ...eligiblePatentImportDryRunResult.rows[0]!,
          parsed: {
            ...eligiblePatentImportDryRunResult.rows[0]!.parsed,
            normalizedIdentifiers: {
              ...eligiblePatentImportDryRunResult.rows[0]!.parsed.normalizedIdentifiers,
              applicationNo: null,
              patentNo: null,
            },
          },
        },
      ],
    };
    const missingApplicationFingerprint = buildAchievementImportFileFingerprint(
      patentFile,
      missingApplicationResult,
    );
    expect(
      getAchievementImportApplyEligibility({
        authUser,
        file: patentFile,
        result: missingApplicationResult,
        fingerprint: missingApplicationFingerprint,
        dryRunLoading: false,
        applySubmitting: false,
      }).reason,
    ).toContain("normalized application number");

    expect(
      getAchievementImportApplyEligibility({
        authUser,
        file,
        result: eligibleAchievementImportDryRunResult,
        fingerprint,
        dryRunLoading: false,
        applySubmitting: true,
      }).reason,
    ).toContain("in progress");
  });

  it("renders the apply entry and PAPER confirmation copy only for an eligible action", () => {
    const file = createEligibleAchievementImportFile();
    const fingerprint = buildAchievementImportFileFingerprint(
      file,
      eligibleAchievementImportDryRunResult,
    );
    const eligibility = getAchievementImportApplyEligibility({
      authUser: createAuthUser({ permissionCodes: ["system:config"] }),
      file,
      result: eligibleAchievementImportDryRunResult,
      fingerprint,
      dryRunLoading: false,
      applySubmitting: false,
    });
    const panelHtml = renderToStaticMarkup(
      createElement(AchievementImportDryRunPanel, {
        file,
        loading: false,
        error: null,
        result: eligibleAchievementImportDryRunResult,
        applyEligibility: eligibility,
        onFileChange: vi.fn(),
        onRunDryRun: vi.fn(),
        onOpenApplyConfirm: vi.fn(),
      }),
    );
    const confirmationHtml = renderToStaticMarkup(
      createElement(AchievementImportApplyConfirmation, { applyType: "PAPER" }),
    );

    expect(panelHtml).toContain("Apply draft-only import");
    expect(panelHtml).not.toContain("disabled");
    expect(confirmationHtml).toContain("CREATE_DRAFT_ONLY");
    expect(confirmationHtml).toContain("DRAFT PAPER");
    expect(confirmationHtml).toContain("paper detail rows");
    expect(confirmationHtml).toContain("normalized DOI");
    expect(confirmationHtml).toContain("will not submit");
    expect(confirmationHtml).toContain("workflow");
    expect(confirmationHtml).toContain("attachment/storage");
    expect(confirmationHtml).toContain("resource grant");
    expect(confirmationHtml).toContain("re-read and validate");
  });

  it("renders SOFTWARE_COPYRIGHT confirmation copy with registration and side-effect boundaries", () => {
    const confirmationHtml = renderToStaticMarkup(
      createElement(AchievementImportApplyConfirmation, {
        applyType: "SOFTWARE_COPYRIGHT",
      }),
    );

    expect(confirmationHtml).toContain("CREATE_DRAFT_ONLY");
    expect(confirmationHtml).toContain("DRAFT SOFTWARE_COPYRIGHT");
    expect(confirmationHtml).toContain("software copyright detail rows");
    expect(confirmationHtml).toContain("normalized software registration number");
    expect(confirmationHtml).toContain("will not submit");
    expect(confirmationHtml).toContain("workflow");
    expect(confirmationHtml).toContain("attachment/storage");
    expect(confirmationHtml).toContain("fee");
    expect(confirmationHtml).toContain("reminder");
    expect(confirmationHtml).toContain("notification");
    expect(confirmationHtml).toContain("search");
    expect(confirmationHtml).toContain("resource grant");
    expect(confirmationHtml).toContain("import job");
    expect(confirmationHtml).toContain("re-read and validate");
  });

  it("renders PATENT confirmation copy with application boundary and fee reminder exclusions", () => {
    const confirmationHtml = renderToStaticMarkup(
      createElement(AchievementImportApplyConfirmation, {
        applyType: "PATENT",
      }),
    );

    expect(confirmationHtml).toContain("CREATE_DRAFT_ONLY");
    expect(confirmationHtml).toContain("DRAFT PATENT");
    expect(confirmationHtml).toContain("PatentDetail rows");
    expect(confirmationHtml).toContain("safe audit evidence");
    expect(confirmationHtml).toContain("applicationNoNormalized");
    expect(confirmationHtml).toContain("grantNoNormalized");
    expect(confirmationHtml).toContain("nextFeeDate");
    expect(confirmationHtml).toContain("feeAmount");
    expect(confirmationHtml).toContain("not imported");
    expect(confirmationHtml).toContain("workflow");
    expect(confirmationHtml).toContain("attachment/storage");
    expect(confirmationHtml).toContain("fee");
    expect(confirmationHtml).toContain("reminder");
    expect(confirmationHtml).toContain("notification");
    expect(confirmationHtml).toContain("search");
    expect(confirmationHtml).toContain("resource grant");
    expect(confirmationHtml).toContain("import job");
    expect(confirmationHtml).toContain("re-read and validate");
  });

  it("renders safe apply success and rejection summaries without raw row values", () => {
    const successHtml = renderToStaticMarkup(
      createElement(AchievementImportApplyResultView, {
        result: achievementImportApplyResult,
      }),
    );
    const ownerEmail = ["owner", "@example.org"].join("");
    const errorHtml = renderToStaticMarkup(
      createElement(AchievementImportApplyErrorView, {
        error: {
          kind: "bad-request",
          status: 409,
          message: "Rejected",
          detail: "raw row value should not render",
          body: {
            summary: {
              failedRows: 1,
              errorCount: 1,
              warningCount: 0,
            },
            errors: [
              {
                code: "DB_CONFLICT",
                message: `raw 10.2000/s68e ${ownerEmail} Contributor`,
              },
            ],
          },
        },
      }),
    );

    expect(successHtml).toContain("Created achievements");
    expect(successHtml).toContain("Created paper details");
    expect(successHtml).not.toContain("Created software copyright details");
    expect(successHtml).toContain("Created contributors");
    expect(successHtml).toContain("Created audit events");
    expect(successHtml).toContain("ACHIEVEMENT_IMPORT_CREATE_DRAFT");
    expect(successHtml).toContain("DRAFT only");
    expect(successHtml).toContain("No workflow");
    expect(successHtml).toContain("No attachment/storage");
    expect(successHtml).toContain("No fee/reminder");
    expect(successHtml).toContain("No notification/search/resource grant");
    expect(successHtml).toContain("No import job");
    expect(successHtml).not.toContain("10.2000/s68e");
    expect(successHtml).not.toContain("Eligible Paper");

    expect(errorHtml).toContain("Apply rejected");
    expect(errorHtml).toContain("DB_CONFLICT");
    expect(errorHtml).toContain("Rejected rows: 1");
    expect(errorHtml).toContain("warnings: 0");
    expect(errorHtml).not.toContain("10.2000/s68e");
    expect(errorHtml).not.toContain(ownerEmail);
    expect(errorHtml).not.toContain("Contributor");
  });

  it("renders safe SOFTWARE_COPYRIGHT apply success without registration or person fields", () => {
    const html = renderToStaticMarkup(
      createElement(AchievementImportApplyResultView, {
        result: softwareCopyrightImportApplyResult,
      }),
    );

    expect(html).toContain("Draft-only SOFTWARE_COPYRIGHT import applied");
    expect(html).toContain("Created achievements");
    expect(html).toContain("Created software copyright details");
    expect(html).not.toContain("Created paper details");
    expect(html).toContain("Created contributors");
    expect(html).toContain("ACHIEVEMENT_IMPORT_CREATE_DRAFT");
    expect(html).toContain("DRAFT only");
    expect(html).toContain("No workflow");
    expect(html).toContain("No attachment/storage");
    expect(html).toContain("No fee/reminder");
    expect(html).toContain("No notification/search/resource grant");
    expect(html).toContain("No import job");
    expect(html).not.toContain("SW-69F-001");
    expect(html).not.toContain("SW69F001");
    expect(html).not.toContain("Eligible Software");
    expect(html).not.toContain("owner@example.org");
    expect(html).not.toContain("Contributor");
    expect(html).not.toContain("70000000-0000-4000-8000-000000000001");
  });

  it("renders safe PATENT apply success without identifiers, fee fields, or person fields", () => {
    const html = renderToStaticMarkup(
      createElement(AchievementImportApplyResultView, {
        result: patentImportApplyResult,
      }),
    );

    expect(html).toContain("Draft-only PATENT import applied");
    expect(html).toContain("Created achievements");
    expect(html).toContain("Created patent details");
    expect(html).not.toContain("Created paper details");
    expect(html).not.toContain("Created software copyright details");
    expect(html).toContain("Created contributors");
    expect(html).toContain("Created audit events");
    expect(html).toContain("ACHIEVEMENT_IMPORT_CREATE_DRAFT");
    expect(html).toContain("DRAFT only");
    expect(html).toContain("No workflow");
    expect(html).toContain("No attachment/storage");
    expect(html).toContain("No fee/reminder");
    expect(html).toContain("No notification/search/resource grant");
    expect(html).toContain("No import job");
    expect(html).not.toContain("APP-S70E-001");
    expect(html).not.toContain("APPS70E001");
    expect(html).not.toContain("GRANT-S70E-001");
    expect(html).not.toContain("GRANTS70E001");
    expect(html).not.toContain("Eligible Patent");
    expect(html).not.toContain("owner@example.org");
    expect(html).not.toContain("Contributor");
    expect(html).not.toContain("nextFeeDate");
    expect(html).not.toContain("feeAmount");
    expect(html).not.toContain("70000000-0000-4000-8000-000000000001");
  });
});
