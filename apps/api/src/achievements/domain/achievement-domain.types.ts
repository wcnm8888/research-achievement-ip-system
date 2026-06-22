export const AchievementTypeCode = {
  paper: "PAPER",
  patent: "PATENT",
  softwareCopyright: "SOFTWARE_COPYRIGHT",
} as const;

export type AchievementTypeCode =
  (typeof AchievementTypeCode)[keyof typeof AchievementTypeCode];

export const AchievementStatusCode = {
  draft: "DRAFT",
  pendingDepartmentReview: "PENDING_DEPARTMENT_REVIEW",
  departmentRejected: "DEPARTMENT_REJECTED",
  pendingArchive: "PENDING_ARCHIVE",
  archived: "ARCHIVED",
  voided: "VOIDED",
} as const;

export type AchievementStatusCode =
  (typeof AchievementStatusCode)[keyof typeof AchievementStatusCode];

export const AchievementActionCode = {
  saveDraft: "SAVE_DRAFT",
  submit: "SUBMIT",
  void: "VOID",
  archive: "ARCHIVE",
} as const;

export type AchievementActionCode =
  (typeof AchievementActionCode)[keyof typeof AchievementActionCode];

export const SecretLevelCode = {
  public: "PUBLIC",
  internal: "INTERNAL",
  secret: "SECRET",
  confidential: "CONFIDENTIAL",
} as const;

export type SecretLevelCode = (typeof SecretLevelCode)[keyof typeof SecretLevelCode];

export const ContributorTypeCode = {
  author: "AUTHOR",
  inventor: "INVENTOR",
  copyrightOwner: "COPYRIGHT_OWNER",
} as const;

export type ContributorTypeCode =
  (typeof ContributorTypeCode)[keyof typeof ContributorTypeCode];

export const ContributorRoleCode = {
  firstAuthor: "FIRST_AUTHOR",
  correspondingAuthor: "CORRESPONDING_AUTHOR",
  primaryInventor: "PRIMARY_INVENTOR",
  participant: "PARTICIPANT",
  owner: "OWNER",
  other: "OTHER",
} as const;

export type ContributorRoleCode =
  (typeof ContributorRoleCode)[keyof typeof ContributorRoleCode];

export const PatentTypeCode = {
  invention: "INVENTION",
  utilityModel: "UTILITY_MODEL",
  design: "DESIGN",
  nationalDefense: "NATIONAL_DEFENSE",
  other: "OTHER",
} as const;

export type PatentTypeCode = (typeof PatentTypeCode)[keyof typeof PatentTypeCode];

export const PatentLegalStatusCode = {
  pending: "PENDING",
  granted: "GRANTED",
  rejected: "REJECTED",
  expired: "EXPIRED",
  terminated: "TERMINATED",
  transferred: "TRANSFERRED",
  unknown: "UNKNOWN",
} as const;

export type PatentLegalStatusCode =
  (typeof PatentLegalStatusCode)[keyof typeof PatentLegalStatusCode];

export const SoftwareTypeCode = {
  application: "APPLICATION",
  system: "SYSTEM",
  tool: "TOOL",
  embedded: "EMBEDDED",
  other: "OTHER",
} as const;

export type SoftwareTypeCode = (typeof SoftwareTypeCode)[keyof typeof SoftwareTypeCode];
