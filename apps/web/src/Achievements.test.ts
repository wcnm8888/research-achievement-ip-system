import { describe, expect, it } from "vitest";
import type { AuthUser } from "./api-client";
import {
  buildAchievementListQuery,
  canCreateAchievementDraft,
  canEditAchievementDraft,
  getAchievementDisplayTitle,
  isAchievementTitleRedacted,
} from "./Achievements";
import type { AchievementListItem } from "./types";

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
