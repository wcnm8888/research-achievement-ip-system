import { describe, expect, it } from "vitest";
import { AchievementStatusCode, AchievementTypeCode } from "../../achievements/domain/achievement-domain.types";
import {
  buildCitationImpactSummary,
  buildCitationOverview,
  calculateHIndex,
  estimateLocalCitationCount,
} from "./citation-analytics";

const basePaper = {
  id: "paper-1",
  type: AchievementTypeCode.paper,
  status: AchievementStatusCode.archived,
  departmentId: "department-1",
  departmentCode: "BIO",
  departmentName: "生命科学学院",
  ownerUserId: "user-1",
  ownerName: "张三",
};

describe("calculateHIndex", () => {
  it("calculates H-index from unsorted citation counts", () => {
    expect(calculateHIndex([12, 8, 5, 3, 1])).toBe(3);
    expect(calculateHIndex([0, 0, 0])).toBe(0);
    expect(calculateHIndex([20, 4, 4, 4, 4])).toBe(4);
  });

  it("normalizes negative and decimal values before calculating H-index", () => {
    expect(calculateHIndex([3.8, 2.2, -1, 1])).toBe(2);
  });
});

describe("buildCitationOverview", () => {
  it("returns total citations, average citations, citable count and H-index", () => {
    expect(buildCitationOverview([12, 8, 5, 3, 1])).toEqual({
      achievementCount: 5,
      citableAchievementCount: 5,
      totalCitations: 29,
      averageCitations: 5.8,
      hIndex: 3,
    });
  });

  it("keeps empty citation sets stable", () => {
    expect(buildCitationOverview([])).toEqual({
      achievementCount: 0,
      citableAchievementCount: 0,
      totalCitations: 0,
      averageCitations: 0,
      hIndex: 0,
    });
  });
});

describe("estimateLocalCitationCount", () => {
  it("derives a local citation count from paper metadata only", () => {
    expect(
      estimateLocalCitationCount(
        {
          ...basePaper,
          paperDetail: {
            doi: "10.1234/example",
            publishYear: 2021,
            includedType: "SCI",
            impactFactor: "5.25",
          },
        },
        2026,
      ),
    ).toBe(59);
  });

  it("does not assign citation counts to patents or software copyrights", () => {
    expect(
      estimateLocalCitationCount({
        ...basePaper,
        type: AchievementTypeCode.patent,
        paperDetail: null,
      }),
    ).toBe(0);
  });
});

describe("buildCitationImpactSummary", () => {
  it("summarizes institute, department and researcher citation impact", () => {
    const summary = buildCitationImpactSummary(
      [
        {
          ...basePaper,
          id: "paper-1",
          ownerUserId: "user-1",
          ownerName: "张三",
          paperDetail: {
            doi: "10.1234/a",
            publishYear: 2021,
            includedType: "SCI",
            impactFactor: "5.25",
          },
        },
        {
          ...basePaper,
          id: "paper-2",
          departmentId: "department-2",
          departmentCode: "CHEM",
          departmentName: "化学学院",
          ownerUserId: "user-2",
          ownerName: "李四",
          paperDetail: {
            doi: "10.1234/b",
            publishYear: 2024,
            includedType: "CSSCI",
            impactFactor: "2.1",
          },
        },
        {
          ...basePaper,
          id: "patent-1",
          type: AchievementTypeCode.patent,
          paperDetail: null,
        },
      ],
      { currentYear: 2026, departmentLimit: 2, researcherLimit: 2 },
    );

    expect(summary.source).toBe("LOCAL_DERIVED");
    expect(summary.externalSourceStatus).toBe("RESERVED_INTERFACE");
    expect(summary.overview).toEqual({
      achievementCount: 3,
      citableAchievementCount: 2,
      totalCitations: 91,
      averageCitations: 30.33,
      hIndex: 2,
    });
    expect(summary.byDepartment.map((item) => item.departmentName)).toEqual([
      "生命科学学院",
      "化学学院",
    ]);
    expect(summary.byResearcher.map((item) => item.researcherName)).toEqual([
      "张三",
      "李四",
    ]);
    expect(summary.topAchievements[0]).toEqual({
      achievementId: "paper-1",
      citationCount: 59,
    });
    expect(summary.note).toContain("DOI/Crossref/Scopus/OpenAlex");
  });
});
