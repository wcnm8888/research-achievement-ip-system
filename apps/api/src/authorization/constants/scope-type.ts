export const ScopeType = {
  global: "GLOBAL",
  department: "DEPARTMENT",
} as const;

export type ScopeType = (typeof ScopeType)[keyof typeof ScopeType];
