export const sanitizeBusinessTitle = (
  value: string | null | undefined,
  fallback = "业务记录",
): string => {
  const title = value?.trim();

  if (!title) {
    return fallback;
  }

  if (/^Step\d+[A-Z]?\s+Local Acceptance\b/i.test(title)) {
    return fallback;
  }

  if (/\bLocal Acceptance\b/i.test(title)) {
    return fallback;
  }

  return title;
};

export const formatSafeCountLabel = (key: string): string => {
  const labels: Record<string, string> = {
    acceptedRowCount: "受理行数",
    createdBusinessCount: "创建记录数",
    createdCompanionCount: "关联记录数",
    auditCount: "操作记录数",
    warningCount: "提醒行数",
    errorCount: "未通过行数",
    skippedRowCount: "跳过行数",
    createdAchievementsCount: "创建成果数",
    createdPaperDetailsCount: "论文明细数",
    createdPatentDetailsCount: "专利明细数",
    createdSoftwareCopyrightDetailsCount: "软著明细数",
    createdContributorsCount: "贡献人记录数",
  };
  const normalized = key.split(".").at(-1) ?? key;

  return labels[normalized] ?? normalized;
};
