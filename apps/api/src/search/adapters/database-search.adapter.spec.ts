import { describe, expect, it, vi } from "vitest";
import { ResourceTypeCode } from "../../authorization/constants/resource-type-code";
import { SearchTargetTypeCode } from "../domain/search-domain.types";
import { DatabaseSearchAdapter } from "./database-search.adapter";

const ids = {
  achievement: "30000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
};

const createRepository = () => ({
  searchAchievements: vi.fn().mockResolvedValue([{ id: ids.achievement }]),
  searchFees: vi.fn().mockResolvedValue([]),
  findAchievementGrants: vi.fn().mockResolvedValue([
    {
      resourceType: ResourceTypeCode.achievement,
      resourceId: ids.achievement,
    },
  ]),
});

describe("DatabaseSearchAdapter", () => {
  it("delegates database search to the repository and loads achievement grants", async () => {
    const repository = createRepository();
    const adapter = new DatabaseSearchAdapter(repository as never);

    const result = await adapter.search({
      query: { targetTypes: [SearchTargetTypeCode.achievement] },
      achievementWhere: { departmentId: { in: [ids.department] } },
    });

    expect(repository.searchAchievements).toHaveBeenCalledWith(
      { departmentId: { in: [ids.department] } },
      { targetTypes: [SearchTargetTypeCode.achievement] },
    );
    expect(repository.searchFees).not.toHaveBeenCalled();
    expect(repository.findAchievementGrants).toHaveBeenCalledWith([ids.achievement]);
    expect(result.achievementGrants).toEqual([{ resourceId: ids.achievement, resourceType: "ACHIEVEMENT" }]);
  });
});
