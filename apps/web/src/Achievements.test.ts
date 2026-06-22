import { describe, expect, it } from "vitest";
import {
  buildAchievementListQuery,
  getAchievementDisplayTitle,
  isAchievementTitleRedacted,
} from "./Achievements";

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
