export const SecretLevelCode = {
  public: "PUBLIC",
  internal: "INTERNAL",
  secret: "SECRET",
  confidential: "CONFIDENTIAL",
} as const;

export type SecretLevelCode = (typeof SecretLevelCode)[keyof typeof SecretLevelCode];
