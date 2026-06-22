import { describe, expect, it } from "vitest";
import {
  buildCreateAchievementPayload,
  buildUpdateAchievementPayload,
  isEditableAchievementStatus,
  toAchievementFormInitialValues,
  type AchievementFormValues,
} from "./AchievementForm";
import type { AchievementDetail } from "./types";

describe("buildCreateAchievementPayload", () => {
  it("builds PAPER payload with only paper detail", () => {
    const values: AchievementFormValues = {
      type: "PAPER",
      title: "  Paper draft  ",
      secretLevel: "INTERNAL",
      paperDetail: {
        doi: " 10.1000/example ",
        impactFactor: "3.126",
        abstract: "",
      },
      patentDetail: {
        applicationNo: "should-not-submit",
      },
      contributors: [
        {
          name: " Alice ",
          organization: "",
          contributorType: "AUTHOR",
          contributorRole: "FIRST_AUTHOR",
          sortOrder: 1,
        },
      ],
    };

    expect(buildCreateAchievementPayload(values)).toEqual({
      type: "PAPER",
      title: "Paper draft",
      secretLevel: "INTERNAL",
      paperDetail: {
        doi: "10.1000/example",
        impactFactor: 3.126,
      },
      contributors: [
        {
          name: "Alice",
          contributorType: "AUTHOR",
          contributorRole: "FIRST_AUTHOR",
          sortOrder: 1,
        },
      ],
    });
  });

  it("builds PATENT payload with only patent detail", () => {
    expect(
      buildCreateAchievementPayload({
        type: "PATENT",
        title: "Patent draft",
        patentDetail: {
          applicationNo: " A-001 ",
          filingDate: "2026-06-19T12:00:00.000Z",
          feeAmount: "1200.50",
        },
        contributors: [
          {
            name: "Bob",
            contributorType: "INVENTOR",
            sortOrder: 1,
          },
        ],
      }),
    ).toEqual({
      type: "PATENT",
      title: "Patent draft",
      secretLevel: "INTERNAL",
      patentDetail: {
        applicationNo: "A-001",
        filingDate: "2026-06-19",
        feeAmount: 1200.5,
      },
      contributors: [
        {
          name: "Bob",
          contributorType: "INVENTOR",
          sortOrder: 1,
        },
      ],
    });
  });

  it("builds SOFTWARE_COPYRIGHT payload with only software detail", () => {
    expect(
      buildCreateAchievementPayload({
        type: "SOFTWARE_COPYRIGHT",
        title: "Software draft",
        softwareCopyrightDetail: {
          registrationNo: " SW-001 ",
          publishDate: "2026-01-02",
        },
        contributors: [
          {
            name: "Carol",
            contributorType: "COPYRIGHT_OWNER",
            sortOrder: 1,
          },
        ],
      }),
    ).toMatchObject({
      type: "SOFTWARE_COPYRIGHT",
      title: "Software draft",
      softwareCopyrightDetail: {
        registrationNo: "SW-001",
        publishDate: "2026-01-02",
      },
    });
  });
});

describe("buildUpdateAchievementPayload", () => {
  it("does not submit contributors when updating", () => {
    expect(
      buildUpdateAchievementPayload(
        {
          type: "PAPER",
          title: " Updated ",
          contributors: [
            {
              name: "Ignored",
              contributorType: "AUTHOR",
              sortOrder: 1,
            },
          ],
          paperDetail: {
            journal: " Journal ",
          },
        },
        "PAPER",
      ),
    ).toEqual({
      title: "Updated",
      paperDetail: {
        journal: "Journal",
      },
    });
  });
});

describe("toAchievementFormInitialValues", () => {
  it("sorts contributors and normalizes dates for edit mode", () => {
    const detail: AchievementDetail = {
      id: "id",
      type: "PATENT",
      status: "DRAFT",
      secretLevel: "SECRET",
      departmentId: "department-id",
      ownerUserId: "owner-id",
      title: "Patent",
      createdAt: "2026-06-19T00:00:00.000Z",
      updatedAt: "2026-06-19T00:00:00.000Z",
      submittedAt: null,
      archivedAt: null,
      voidedAt: null,
      isRestricted: true,
      isRedacted: false,
      patentDetail: {
        filingDate: "2026-05-01T12:00:00.000Z",
      },
      contributors: [
        {
          name: "Second",
          contributorType: "INVENTOR",
          sortOrder: 2,
        },
        {
          name: "First",
          contributorType: "INVENTOR",
          sortOrder: 1,
        },
      ],
    };

    expect(toAchievementFormInitialValues(detail)).toMatchObject({
      type: "PATENT",
      title: "Patent",
      secretLevel: "SECRET",
      patentDetail: {
        filingDate: "2026-05-01",
      },
      contributors: [
        {
          name: "First",
          sortOrder: 1,
        },
        {
          name: "Second",
          sortOrder: 2,
        },
      ],
    });
  });
});

describe("isEditableAchievementStatus", () => {
  it("only allows DRAFT editing under the current backend contract", () => {
    expect(isEditableAchievementStatus("DRAFT")).toBe(true);
    expect(isEditableAchievementStatus("DEPARTMENT_REJECTED")).toBe(false);
    expect(isEditableAchievementStatus("PENDING_ARCHIVE")).toBe(false);
  });
});
