import { Inject, Injectable } from "@nestjs/common";
import { SearchAdapter } from "./search-adapter";
import { SearchAdapterInput, SearchAdapterResult } from "../domain/search-domain.types";
import { SearchRepository } from "../search.repository";

@Injectable()
export class DatabaseSearchAdapter implements SearchAdapter {
  constructor(
    @Inject(SearchRepository)
    private readonly repository: SearchRepository,
  ) {}

  async search(input: SearchAdapterInput): Promise<SearchAdapterResult> {
    const [achievements, fees] = await Promise.all([
      input.achievementWhere
        ? this.repository.searchAchievements(input.achievementWhere, input.query)
        : Promise.resolve([]),
      input.feeWhere ? this.repository.searchFees(input.feeWhere, input.query) : Promise.resolve([]),
    ]);

    const achievementGrants =
      achievements.length > 0
        ? await this.repository.findAchievementGrants(achievements.map((achievement) => achievement.id))
        : [];

    return { achievements, fees, achievementGrants };
  }
}
