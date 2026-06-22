export const RoleCode = {
  researcher: "RESEARCHER",
  researchSecretary: "RESEARCH_SECRETARY",
  departmentAdmin: "DEPARTMENT_ADMIN",
  systemAdmin: "SYSTEM_ADMIN",
  auditor: "AUDITOR",
  leader: "LEADER",
  secretManager: "SECRET_MANAGER",
} as const;

export type RoleCode = (typeof RoleCode)[keyof typeof RoleCode];
