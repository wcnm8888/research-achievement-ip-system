import { AchievementStatusCode, AchievementTypeCode } from "../../achievements/domain/achievement-domain.types";

export const CitationSourceCode = {
  localDerived: "LOCAL_DERIVED",
} as const;

export type CitationSourceCode =
  (typeof CitationSourceCode)[keyof typeof CitationSourceCode];

export type CitationPaperDetailInput = {
  doi?: string | null;
  publishYear?: number | null;
  includedType?: string | null;
  impactFactor?: { toString(): string } | number | string | null;
};

export type CitationAchievementInput = {
  id: string;
  type: AchievementTypeCode | string;
  status: AchievementStatusCode | string;
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  ownerUserId: string;
  ownerName: string;
  paperDetail?: CitationPaperDetailInput | null;
};

export type CitationOverview = {
  achievementCount: number;
  citableAchievementCount: number;
  totalCitations: number;
  averageCitations: number;
  hIndex: number;
};

export type CitationDepartmentImpact = CitationOverview & {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
};

export type CitationResearcherImpact = CitationOverview & {
  userId: string;
  researcherName: string;
  departmentId: string;
  departmentName: string;
};

export type CitationAchievementImpact = {
  achievementId: string;
  citationCount: number;
};

export type CitationImpactSummary = {
  source: CitationSourceCode;
  externalSourceStatus: "RESERVED_INTERFACE";
  overview: CitationOverview;
  byDepartment: CitationDepartmentImpact[];
  byResearcher: CitationResearcherImpact[];
  topAchievements: CitationAchievementImpact[];
  note: string;
};

export const buildCitationImpactSummary = (
  achievements: readonly CitationAchievementInput[],
  options: {
    currentYear?: number;
    departmentLimit?: number;
    researcherLimit?: number;
    achievementLimit?: number;
  } = {},
): CitationImpactSummary => {
  const currentYear = options.currentYear ?? new Date().getUTCFullYear();
  const impacts = achievements.map((achievement) => ({
    achievement,
    citationCount: estimateLocalCitationCount(achievement, currentYear),
  }));
  const citationCounts = impacts.map((impact) => impact.citationCount);

  return {
    source: CitationSourceCode.localDerived,
    externalSourceStatus: "RESERVED_INTERFACE",
    overview: buildCitationOverview(citationCounts),
    byDepartment: rankCitationGroups(
      impacts,
      (impact) => impact.achievement.departmentId,
      (impact, overview) => ({
        departmentId: impact.achievement.departmentId,
        departmentCode: impact.achievement.departmentCode,
        departmentName: impact.achievement.departmentName,
        ...overview,
      }),
      options.departmentLimit ?? 5,
    ),
    byResearcher: rankCitationGroups(
      impacts,
      (impact) => impact.achievement.ownerUserId,
      (impact, overview) => ({
        userId: impact.achievement.ownerUserId,
        researcherName: impact.achievement.ownerName,
        departmentId: impact.achievement.departmentId,
        departmentName: impact.achievement.departmentName,
        ...overview,
      }),
      options.researcherLimit ?? 5,
    ),
    topAchievements: impacts
      .map((impact) => ({
        achievementId: impact.achievement.id,
        citationCount: impact.citationCount,
      }))
      .sort(compareCitationImpact)
      .slice(0, options.achievementLimit ?? 5),
    note: "本地引文影响力基于成果台账字段派生；DOI/Crossref/Scopus/OpenAlex 为后续可接入能力。",
  };
};

export const buildCitationOverview = (
  citationCounts: readonly number[],
): CitationOverview => {
  const normalized = citationCounts.map((count) => Math.max(0, Math.floor(count)));
  const totalCitations = normalized.reduce((sum, count) => sum + count, 0);
  const citableAchievementCount = normalized.filter((count) => count > 0).length;

  return {
    achievementCount: normalized.length,
    citableAchievementCount,
    totalCitations,
    averageCitations:
      normalized.length > 0
        ? Math.round((totalCitations / normalized.length) * 100) / 100
        : 0,
    hIndex: calculateHIndex(normalized),
  };
};

export const calculateHIndex = (citationCounts: readonly number[]): number => {
  const sorted = citationCounts
    .map((count) => Math.max(0, Math.floor(count)))
    .sort((left, right) => right - left);

  let hIndex = 0;

  for (const [index, citationCount] of sorted.entries()) {
    const threshold = index + 1;

    if (citationCount >= threshold) {
      hIndex = threshold;
    }
  }

  return hIndex;
};

export const estimateLocalCitationCount = (
  achievement: CitationAchievementInput,
  currentYear = new Date().getUTCFullYear(),
): number => {
  if (achievement.type !== AchievementTypeCode.paper || !achievement.paperDetail) {
    return 0;
  }

  const detail = achievement.paperDetail;
  const includedTypeScore = scoreIncludedType(detail.includedType);
  const impactScore = scoreImpactFactor(detail.impactFactor);
  const ageScore = scorePublishAge(detail.publishYear, currentYear);
  const doiScore = detail.doi?.trim() ? 6 : 0;
  const statusMultiplier =
    achievement.status === AchievementStatusCode.archived ? 1 : 0.65;

  return Math.max(
    0,
    Math.round((includedTypeScore + impactScore + ageScore + doiScore) * statusMultiplier),
  );
};

const scoreIncludedType = (includedType: string | null | undefined): number => {
  const value = includedType?.toUpperCase() ?? "";

  if (value.includes("CSSCI")) {
    return 14;
  }

  if (value.includes("SSCI")) {
    return 20;
  }

  if (value.includes("SCI")) {
    return 22;
  }

  if (value.includes("EI")) {
    return 16;
  }

  if (value.includes("CSCD")) {
    return 10;
  }

  return value ? 6 : 2;
};

const scoreImpactFactor = (
  impactFactor: CitationPaperDetailInput["impactFactor"],
): number => {
  const numeric =
    typeof impactFactor === "number"
      ? impactFactor
      : Number.parseFloat(impactFactor?.toString() ?? "");

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  return Math.min(30, Math.round(numeric * 4));
};

const scorePublishAge = (
  publishYear: number | null | undefined,
  currentYear: number,
): number => {
  if (!publishYear || publishYear > currentYear) {
    return 0;
  }

  return Math.min(16, Math.max(0, currentYear - publishYear) * 2);
};

const rankCitationGroups = <TGroup extends CitationOverview>(
  impacts: readonly {
    achievement: CitationAchievementInput;
    citationCount: number;
  }[],
  groupKey: (impact: { achievement: CitationAchievementInput; citationCount: number }) => string,
  buildGroup: (
    firstImpact: { achievement: CitationAchievementInput; citationCount: number },
    overview: CitationOverview,
  ) => TGroup,
  take: number,
): TGroup[] => {
  const groups = new Map<
    string,
    {
      firstImpact: { achievement: CitationAchievementInput; citationCount: number };
      citationCounts: number[];
    }
  >();

  for (const impact of impacts) {
    const key = groupKey(impact);
    const existing = groups.get(key);

    if (existing) {
      existing.citationCounts.push(impact.citationCount);
      continue;
    }

    groups.set(key, { firstImpact: impact, citationCounts: [impact.citationCount] });
  }

  return [...groups.values()]
    .map((group) => buildGroup(group.firstImpact, buildCitationOverview(group.citationCounts)))
    .sort(compareCitationGroup)
    .slice(0, take);
};

const compareCitationGroup = <TGroup extends CitationOverview>(
  left: TGroup,
  right: TGroup,
): number =>
  right.totalCitations - left.totalCitations ||
  right.hIndex - left.hIndex ||
  right.citableAchievementCount - left.citableAchievementCount;

const compareCitationImpact = (
  left: CitationAchievementImpact,
  right: CitationAchievementImpact,
): number => right.citationCount - left.citationCount;
