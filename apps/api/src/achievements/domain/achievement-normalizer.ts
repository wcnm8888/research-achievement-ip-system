export type BusinessKeyNormalizer = (value: string | null | undefined) => string | null;

const emptyToNull = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export const normalizeNullableBusinessKey = (
  value: string | null | undefined,
  normalizer: (value: string) => string,
): string | null => {
  const normalizedInput = emptyToNull(value);

  if (normalizedInput === null) {
    return null;
  }

  const normalized = normalizer(normalizedInput);
  return normalized.length === 0 ? null : normalized;
};

export const normalizeDoi: BusinessKeyNormalizer = (value) =>
  normalizeNullableBusinessKey(value, (input) =>
    input
      .toLowerCase()
      .replace(/^(https?:\/\/(?:dx\.)?doi\.org\/)/i, "")
      .replace(/^doi:/i, "")
      .replace(/\s+/g, ""),
  );

const normalizeDocumentNumber = (value: string): string =>
  value
    .toUpperCase()
    .replace(/[\s\u3000]+/g, "")
    .replace(/[-－]+/g, "");

export const normalizePatentApplicationNo: BusinessKeyNormalizer = (value) =>
  normalizeNullableBusinessKey(value, normalizeDocumentNumber);

export const normalizePatentGrantNo: BusinessKeyNormalizer = (value) =>
  normalizeNullableBusinessKey(value, normalizeDocumentNumber);

export const normalizeSoftwareRegistrationNo: BusinessKeyNormalizer = (value) =>
  normalizeNullableBusinessKey(value, normalizeDocumentNumber);
