import { Inject, Injectable } from "@nestjs/common";
import { ResourceTypeCode } from "../authorization/constants/resource-type-code";
import { allowDecision } from "../authorization/policy/policy-decision";
import { PolicyQueryFactory } from "../authorization/policy/policy-query.factory";
import { ResourceAccessGrantRecord } from "../authorization/policy/resource-grant-policy.service";
import { SecretAccessPolicyService } from "../authorization/policy/secret-access-policy.service";
import { UserContext } from "../identity/user-context";
import { SEARCH_ADAPTER, SearchAdapter } from "./adapters/search-adapter";
import { SearchQueryDto } from "./dto/search-query.dto";
import {
  SearchAchievementRecord,
  SearchFeeRecord,
  SearchQueryInput,
  SearchResult,
  SearchResultItem,
  SearchTargetTypeCode,
} from "./domain/search-domain.types";
import { SearchAccessDeniedError } from "./domain/search-errors";

@Injectable()
export class SearchService {
  constructor(
    @Inject(SEARCH_ADAPTER)
    private readonly searchAdapter: SearchAdapter,
    @Inject(PolicyQueryFactory)
    private readonly policyQueryFactory: PolicyQueryFactory,
    @Inject(SecretAccessPolicyService)
    private readonly secretAccessPolicy: SecretAccessPolicyService,
  ) {}

  async search(context: UserContext, dto: SearchQueryDto = {}): Promise<SearchResult> {
    this.assertUserContext(context);

    const query = normalizeSearchQuery(dto);
    const targetTypes = resolveTargetTypes(query);
    const result = await this.searchAdapter.search({
      query,
      achievementWhere: targetTypes.has(SearchTargetTypeCode.achievement)
        ? this.policyQueryFactory.achievementReadableWhere(context)
        : undefined,
      feeWhere: targetTypes.has(SearchTargetTypeCode.feeRecord)
        ? this.policyQueryFactory.feeReadableWhere(context)
        : undefined,
    });

    const grantsByAchievementId = groupGrantsByAchievementId(result.achievementGrants);

    const achievementItems = result.achievements.map((achievement) =>
      this.toAchievementItem(context, achievement, grantsByAchievementId.get(achievement.id)),
    );
    const feeItems = result.fees.map(toFeeItem);
    const items = [...achievementItems, ...feeItems];

    return {
      items,
      total: items.length,
    };
  }

  private toAchievementItem(
    context: UserContext,
    record: SearchAchievementRecord,
    grants: readonly ResourceAccessGrantRecord[] | undefined,
  ): SearchResultItem {
    const decision = this.secretAccessPolicy.canReadResource(
      context,
      {
        resourceType: ResourceTypeCode.achievement,
        resourceId: record.id,
        secretLevel: record.secretLevel,
        ownerUserId: record.ownerUserId,
      },
      allowDecision("Achievement search base scope matched."),
      grants ?? [],
    );
    const redacted = decision.effect === "DENY";

    return {
      targetType: SearchTargetTypeCode.achievement,
      id: record.id,
      type: record.type,
      status: record.status,
      departmentId: record.departmentId,
      secretLevel: record.secretLevel,
      title: redacted ? null : record.title,
      identifiers: redacted ? {} : toAchievementIdentifiers(record),
      redacted,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private assertUserContext(context: UserContext | null | undefined): asserts context is UserContext {
    if (!context?.userId || !context.departmentId) {
      throw new SearchAccessDeniedError("User context with department is required.");
    }
  }
}

const normalizeSearchQuery = (dto: SearchQueryDto): SearchQueryInput => ({
  ...dto,
  keyword: dto.keyword?.trim() || undefined,
});

const resolveTargetTypes = (query: SearchQueryInput): Set<SearchTargetTypeCode> =>
  new Set(query.targetTypes?.length ? query.targetTypes : Object.values(SearchTargetTypeCode));

const groupGrantsByAchievementId = (
  grants: readonly ResourceAccessGrantRecord[],
): Map<string, ResourceAccessGrantRecord[]> => {
  const grouped = new Map<string, ResourceAccessGrantRecord[]>();

  for (const grant of grants) {
    grouped.set(grant.resourceId, [...(grouped.get(grant.resourceId) ?? []), grant]);
  }

  return grouped;
};

const toAchievementIdentifiers = (record: SearchAchievementRecord) => ({
  ...(record.paperDetail?.doi ? { doi: record.paperDetail.doi } : {}),
  ...(record.patentDetail?.applicationNo
    ? { patentApplicationNo: record.patentDetail.applicationNo }
    : {}),
  ...(record.patentDetail?.grantNo ? { patentGrantNo: record.patentDetail.grantNo } : {}),
  ...(record.softwareCopyrightDetail?.registrationNo
    ? { softwareRegistrationNo: record.softwareCopyrightDetail.registrationNo }
    : {}),
});

const toFeeItem = (record: SearchFeeRecord): SearchResultItem => ({
  targetType: SearchTargetTypeCode.feeRecord,
  id: record.id,
  achievementId: record.achievementId,
  departmentId: record.departmentId,
  feeType: record.feeType,
  payStatus: record.payStatus,
  dueDate: record.dueDate,
  paidDate: record.paidDate,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});
