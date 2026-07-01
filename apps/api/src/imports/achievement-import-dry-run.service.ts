import { Inject, Injectable } from "@nestjs/common";
import { UserStatus } from "@prisma/client";
import {
  AchievementStatusCode,
  AchievementTypeCode,
  ContributorRoleCode,
  ContributorTypeCode,
  PatentLegalStatusCode,
  PatentTypeCode,
  SecretLevelCode,
  SoftwareTypeCode,
} from "../achievements/domain/achievement-domain.types";
import {
  normalizeDoi,
  normalizePatentApplicationNo,
  normalizePatentGrantNo,
  normalizeSoftwareRegistrationNo,
} from "../achievements/domain/achievement-normalizer";
import { UserContext } from "../identity/user-context";
import {
  AchievementImportDepartmentLookup,
  AchievementImportDryRunRepository,
  AchievementImportNormalizedConflict,
  AchievementImportUserLookup,
} from "./achievement-import-dry-run.repository";

export const achievementImportType = "ACHIEVEMENT" as const;

const requiredColumns = ["type", "title", "departmentCode", "contributors"] as const;
const optionalColumns = [
  "ownerEmail",
  "ownerEmployeeNo",
  "secretLevel",
  "status",
  "doi",
  "DOI",
  "journal",
  "issnCn",
  "publishYear",
  "includedType",
  "impactFactor",
  "partition",
  "abstract",
  "applicationNo",
  "patentNo",
  "grantNo",
  "patentType",
  "filingDate",
  "grantDate",
  "nextFeeDate",
  "feeAmount",
  "legalStatus",
  "registrationNo",
  "softwareRegistrationNo",
  "softwareVersion",
  "softwareType",
  "publishDate",
  "registerDate",
  "runEnv",
] as const;
const allowedColumns = new Set<string>([...requiredColumns, ...optionalColumns]);
const sensitiveColumns = new Set([
  "password",
  "initialpassword",
  "passwordhash",
  "credentialstatus",
  "token",
  "invitelink",
  "resetlink",
  "session",
  "cookie",
  "secret",
  "accesskey",
  "privatekey",
  "connectionstring",
  "storagekey",
  "objectkey",
  "checksum",
  "rawpayload",
  "payload",
]);
const forbiddenColumns = new Set([
  "id",
  "achievementid",
  "owneruserid",
  "departmentid",
  "createdbyid",
  "updatedbyid",
  "submittedbyid",
  "workflowid",
  "attachmentid",
  "feerecordid",
]);
const paperFields = new Set([
  "doi",
  "DOI",
  "journal",
  "issnCn",
  "publishYear",
  "includedType",
  "impactFactor",
  "partition",
  "abstract",
]);
const patentFields = new Set([
  "applicationNo",
  "patentNo",
  "grantNo",
  "patentType",
  "filingDate",
  "grantDate",
  "nextFeeDate",
  "feeAmount",
  "legalStatus",
]);
const softwareFields = new Set([
  "registrationNo",
  "softwareRegistrationNo",
  "softwareVersion",
  "softwareType",
  "publishDate",
  "registerDate",
  "runEnv",
]);
const departmentCodePattern = /^[A-Z0-9_]+$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const maxRows = 500;
const formulaLikePattern = /^[=+\-@]/;
const defaultStatus = AchievementStatusCode.draft;
const defaultSecretLevel = SecretLevelCode.internal;
const allowedAchievementTypes = new Set<string>(Object.values(AchievementTypeCode));
const allowedAchievementStatuses = new Set<string>(Object.values(AchievementStatusCode));
const allowedSecretLevels = new Set<string>(Object.values(SecretLevelCode));
const allowedContributorTypes = new Set<string>(Object.values(ContributorTypeCode));
const allowedContributorRoles = new Set<string>(Object.values(ContributorRoleCode));
const allowedPatentTypes = new Set<string>(Object.values(PatentTypeCode));
const allowedPatentLegalStatuses = new Set<string>(Object.values(PatentLegalStatusCode));
const allowedSoftwareTypes = new Set<string>(Object.values(SoftwareTypeCode));

export type AchievementImportDryRunFile = {
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
};

export type AchievementImportDryRunIssueCode =
  | "REQUIRED"
  | "INVALID_FORMAT"
  | "INVALID_ENUM"
  | "UNSUPPORTED_STATUS"
  | "UNKNOWN_COLUMN"
  | "FORBIDDEN_SENSITIVE_COLUMN"
  | "FORMULA_LIKE_VALUE"
  | "DETAIL_TYPE_MISMATCH"
  | "DUPLICATE_IN_FILE"
  | "DB_CONFLICT"
  | "UNKNOWN_DEPARTMENT"
  | "OWNER_NOT_FOUND"
  | "OWNER_DEPARTMENT_MISMATCH"
  | "CONTRIBUTOR_FORMAT_INVALID"
  | "CONTRIBUTOR_USER_NOT_FOUND"
  | "CONTRIBUTOR_TYPE_MISMATCH"
  | "OWNER_EMPLOYEE_NO_LOOKUP_NOT_AVAILABLE";

export type AchievementImportDryRunIssue = {
  field: string;
  code: AchievementImportDryRunIssueCode;
  message: string;
};

export type AchievementImportDryRunRowStatus = "VALID" | "WARNING" | "ERROR";
export type AchievementImportDryRunCandidateAction = "CREATE_DRAFT" | "SKIP";

export type AchievementImportContributorPreview = {
  name: string | null;
  contributorType: string | null;
  contributorRole: string | null;
  userEmail: string | null;
  organization: string | null;
  sortOrder: number;
};

export type AchievementImportDryRunRow = {
  rowNumber: number;
  parsed: {
    type: string | null;
    title: string | null;
    ownerEmail: string | null;
    ownerEmployeeNo: string | null;
    departmentCode: string | null;
    secretLevel: string | null;
    status: string | null;
    contributors: AchievementImportContributorPreview[];
    identifiers: {
      doi: string | null;
      applicationNo: string | null;
      patentNo: string | null;
      registrationNo: string | null;
    };
    normalizedIdentifiers: {
      doi: string | null;
      applicationNo: string | null;
      patentNo: string | null;
      registrationNo: string | null;
    };
  };
  status: AchievementImportDryRunRowStatus;
  candidateAction: AchievementImportDryRunCandidateAction;
  errors: AchievementImportDryRunIssue[];
  warnings: AchievementImportDryRunIssue[];
};

export type AchievementImportDryRunResult = {
  importType: typeof achievementImportType;
  dryRun: true;
  file: {
    name: string;
    size: number;
    mimeType: string;
    encoding: "utf-8";
  };
  columns: {
    required: string[];
    optional: string[];
    received: string[];
  };
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
    createDraftCandidates: number;
    duplicateIdentifierRows: number;
    dbConflictRows: number;
    ownerEmployeeNoLookup: "NOT_AVAILABLE";
  };
  rows: AchievementImportDryRunRow[];
};

type ParsedCsvRecord = {
  rowNumber: number;
  values: string[];
};

type CsvParseResult = {
  headers: string[];
  records: ParsedCsvRecord[];
};

type WorkingRow = {
  rowNumber: number;
  valuesByHeader: Map<string, string>;
  parsed: AchievementImportDryRunRow["parsed"];
  resolved: {
    departmentId: string | null;
    ownerUserId: string | null;
  };
  errors: AchievementImportDryRunIssue[];
  warnings: AchievementImportDryRunIssue[];
};

export class InvalidAchievementImportCsvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAchievementImportCsvError";
  }
}

@Injectable()
export class AchievementImportDryRunService {
  constructor(
    @Inject(AchievementImportDryRunRepository)
    private readonly repository: AchievementImportDryRunRepository,
  ) {}

  async dryRunAchievementCsv(
    _context: UserContext,
    file: AchievementImportDryRunFile,
  ): Promise<AchievementImportDryRunResult> {
    const csv = parseCsv(file.buffer);
    const rows = toWorkingRows(csv);
    applyColumnValidation(rows, csv.headers);
    applyRowValidation(rows);
    applyDuplicateValidation(rows);

    const [departments, users, conflicts] = await Promise.all([
      this.repository.findActiveDepartmentsByCodes(collectDepartmentCodes(rows)),
      this.repository.findUsersByEmails(collectEmails(rows)),
      this.repository.findNormalizedConflicts(collectNormalizedIdentifierInput(rows)),
    ]);

    const departmentByCode = new Map(departments.map((department) => [department.code, department]));
    const userByEmail = new Map(users.map((user) => [user.email, user]));
    const conflictKeys = toConflictKeySet(conflicts);

    applyReferenceValidation(rows, departmentByCode, userByEmail);
    applyDbConflictValidation(rows, conflictKeys);

    const resultRows = rows.map(toResultRow);

    return {
      importType: achievementImportType,
      dryRun: true,
      file: {
        name: sanitizeFileName(file.originalName),
        size: file.size,
        mimeType: file.mimeType,
        encoding: "utf-8",
      },
      columns: {
        required: [...requiredColumns],
        optional: [...optionalColumns],
        received: csv.headers.map(sanitizeHeaderForOutput),
      },
      summary: summarizeRows(resultRows),
      rows: resultRows,
    };
  }
}

const parseCsv = (buffer: Buffer): CsvParseResult => {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  if (text.includes("\uFFFD")) {
    throw new InvalidAchievementImportCsvError("CSV must be valid UTF-8.");
  }

  const records = parseCsvRecords(text);
  const nonEmptyRecords = records.filter((record) =>
    record.values.some((value) => value.trim() !== ""),
  );
  const headerRecord = nonEmptyRecords[0];
  if (!headerRecord) {
    throw new InvalidAchievementImportCsvError("CSV header row is required.");
  }

  const dataRecords = nonEmptyRecords.slice(1);
  if (dataRecords.length > maxRows) {
    throw new InvalidAchievementImportCsvError(`CSV data row limit exceeded: ${maxRows}.`);
  }

  return {
    headers: headerRecord.values.map((header) => header.trim()),
    records: dataRecords,
  };
};

// Same narrow CSV boundary as existing import dry-runs: UTF-8, comma delimiter,
// double-quote escaping, one header row, and no workbook parsing.
const parseCsvRecords = (text: string): ParsedCsvRecord[] => {
  const records: ParsedCsvRecord[] = [];
  let values: string[] = [];
  let value = "";
  let inQuotes = false;
  let rowNumber = 1;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (inQuotes) {
      if (character === "\"") {
        if (text[index + 1] === "\"") {
          value += "\"";
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        value += character;
      }
      continue;
    }

    if (character === "\"") {
      if (value.length === 0) {
        inQuotes = true;
      } else {
        value += character;
      }
      continue;
    }

    if (character === ",") {
      values.push(value);
      value = "";
      continue;
    }

    if (character === "\n" || character === "\r") {
      values.push(value);
      records.push({ rowNumber, values });
      values = [];
      value = "";
      if (character === "\r" && text[index + 1] === "\n") {
        index += 1;
      }
      rowNumber += 1;
      continue;
    }

    value += character;
  }

  if (inQuotes) {
    throw new InvalidAchievementImportCsvError("CSV contains an unclosed quoted field.");
  }

  if (value.length > 0 || values.length > 0) {
    values.push(value);
    records.push({ rowNumber, values });
  }

  return records;
};

const toWorkingRows = (csv: CsvParseResult): WorkingRow[] =>
  csv.records.map((record) => {
    const valuesByHeader = new Map<string, string>();
    csv.headers.forEach((header, index) => {
      valuesByHeader.set(header, record.values[index] ?? "");
    });

    const doi = normalizeCell(getCell(valuesByHeader, "doi") ?? getCell(valuesByHeader, "DOI"));
    const patentNo = normalizeCell(
      getCell(valuesByHeader, "patentNo") ?? getCell(valuesByHeader, "grantNo"),
    );
    const registrationNo = normalizeCell(
      getCell(valuesByHeader, "softwareRegistrationNo") ??
        getCell(valuesByHeader, "registrationNo"),
    );

    return {
      rowNumber: record.rowNumber,
      valuesByHeader,
      parsed: {
        type: normalizeEnumCell(valuesByHeader.get("type")),
        title: normalizeCell(valuesByHeader.get("title")),
        ownerEmail: normalizeEmailCell(valuesByHeader.get("ownerEmail")),
        ownerEmployeeNo: normalizeCell(valuesByHeader.get("ownerEmployeeNo")),
        departmentCode: normalizeCell(valuesByHeader.get("departmentCode")),
        secretLevel: normalizeEnumCell(valuesByHeader.get("secretLevel")) ?? defaultSecretLevel,
        status: normalizeEnumCell(valuesByHeader.get("status")) ?? defaultStatus,
        contributors: parseContributors(valuesByHeader.get("contributors")),
        identifiers: {
          doi,
          applicationNo: normalizeCell(valuesByHeader.get("applicationNo")),
          patentNo,
          registrationNo,
        },
        normalizedIdentifiers: {
          doi: normalizeDoi(doi),
          applicationNo: normalizePatentApplicationNo(valuesByHeader.get("applicationNo")),
          patentNo: normalizePatentGrantNo(patentNo),
          registrationNo: normalizeSoftwareRegistrationNo(registrationNo),
        },
      },
      resolved: {
        departmentId: null,
        ownerUserId: null,
      },
      errors: [],
      warnings: [],
    };
  });

const applyColumnValidation = (
  rows: WorkingRow[],
  headers: readonly string[],
): void => {
  const unknownHeaders = headers.filter(
    (header) => !allowedColumns.has(header) && !isForbiddenColumn(header),
  );
  const forbiddenHeaders = headers.filter(isForbiddenColumn);
  const missingRequiredHeaders = requiredColumns.filter(
    (column) => !headers.includes(column),
  );

  for (const row of rows) {
    for (const header of unknownHeaders) {
      row.errors.push({
        field: header || "(empty)",
        code: "UNKNOWN_COLUMN",
        message: `Column is not supported: ${header || "(empty)"}.`,
      });
    }

    for (const header of forbiddenHeaders) {
      void header;
      row.errors.push({
        field: "(sensitive)",
        code: "FORBIDDEN_SENSITIVE_COLUMN",
        message: "Sensitive, raw payload, storage, workflow, fee, and direct id columns are not supported.",
      });
    }

    for (const column of missingRequiredHeaders) {
      row.errors.push({
        field: column,
        code: "REQUIRED",
        message: `Required column is missing: ${column}.`,
      });
    }
  }
};

const applyRowValidation = (rows: WorkingRow[]): void => {
  for (const row of rows) {
    validateFormulaLikeValues(row);
    validateCommonFields(row);
    validateTypeSpecificFields(row);
    validateContributors(row);
  }
};

const validateFormulaLikeValues = (row: WorkingRow): void => {
  for (const field of allowedColumns) {
    const value = normalizeCell(row.valuesByHeader.get(field));
    if (value && formulaLikePattern.test(value)) {
      row.errors.push({
        field,
        code: "FORMULA_LIKE_VALUE",
        message: "Formula-like cell values are not allowed.",
      });
    }
  }
};

const validateCommonFields = (row: WorkingRow): void => {
  validateRequiredEnum(row, "type", row.parsed.type, allowedAchievementTypes);
  validateRequiredText(row, "title", row.parsed.title, 500);
  validateRequiredCode(row, "departmentCode", row.parsed.departmentCode, departmentCodePattern);

  if (!row.parsed.ownerEmail && !row.parsed.ownerEmployeeNo) {
    row.errors.push({
      field: "ownerEmail",
      code: "REQUIRED",
      message: "ownerEmail is required unless a supported ownerEmployeeNo lookup exists.",
    });
  }

  if (row.parsed.ownerEmail && !isValidEmail(row.parsed.ownerEmail)) {
    row.errors.push({
      field: "ownerEmail",
      code: "INVALID_FORMAT",
      message: "ownerEmail must be a valid address.",
    });
  }

  if (row.parsed.ownerEmployeeNo) {
    row.errors.push({
      field: "ownerEmployeeNo",
      code: "OWNER_EMPLOYEE_NO_LOOKUP_NOT_AVAILABLE",
      message: "ownerEmployeeNo lookup is not available in the current schema.",
    });
  }

  if (!row.parsed.secretLevel || !allowedSecretLevels.has(row.parsed.secretLevel)) {
    row.errors.push({
      field: "secretLevel",
      code: "INVALID_ENUM",
      message: "secretLevel must be a supported secret level.",
    });
  }

  if (!row.parsed.status || !allowedAchievementStatuses.has(row.parsed.status)) {
    row.errors.push({
      field: "status",
      code: "INVALID_ENUM",
      message: "status is not supported.",
    });
    return;
  }

  if (row.parsed.status !== AchievementStatusCode.draft) {
    row.errors.push({
      field: "status",
      code: "UNSUPPORTED_STATUS",
      message: "Only DRAFT status is supported by achievement import dry-run.",
    });
  }
};

const validateTypeSpecificFields = (row: WorkingRow): void => {
  const type = row.parsed.type;
  validateDetailFieldMismatch(row);

  if (type === AchievementTypeCode.paper) {
    validateIntegerRange(row, "publishYear", 1900, 2100);
    validateDecimal(row, "impactFactor", 3);
  }

  if (type === AchievementTypeCode.patent) {
    validateOptionalEnum(row, "patentType", allowedPatentTypes);
    validateOptionalEnum(row, "legalStatus", allowedPatentLegalStatuses);
    validateDate(row, "filingDate");
    validateDate(row, "grantDate");
    validateDate(row, "nextFeeDate");
    validateDecimal(row, "feeAmount", 2);
  }

  if (type === AchievementTypeCode.softwareCopyright) {
    validateOptionalEnum(row, "softwareType", allowedSoftwareTypes);
    validateDate(row, "publishDate");
    validateDate(row, "registerDate");
  }
};

const validateDetailFieldMismatch = (row: WorkingRow): void => {
  const type = row.parsed.type;
  if (!type || !allowedAchievementTypes.has(type)) {
    return;
  }

  const allowedForType =
    type === AchievementTypeCode.paper
      ? paperFields
      : type === AchievementTypeCode.patent
        ? patentFields
        : softwareFields;

  for (const field of [...paperFields, ...patentFields, ...softwareFields]) {
    if (!allowedForType.has(field) && normalizeCell(row.valuesByHeader.get(field))) {
      row.errors.push({
        field,
        code: "DETAIL_TYPE_MISMATCH",
        message: "Detail field does not match achievement type.",
      });
    }
  }
};

const validateContributors = (row: WorkingRow): void => {
  if (row.parsed.contributors.length === 0) {
    row.errors.push({
      field: "contributors",
      code: "REQUIRED",
      message: "At least one contributor is required.",
    });
    return;
  }

  const expectedType = expectedContributorType(row.parsed.type);
  for (const contributor of row.parsed.contributors) {
    if (!contributor.name || !contributor.contributorType) {
      row.errors.push({
        field: "contributors",
        code: "CONTRIBUTOR_FORMAT_INVALID",
        message: "Contributor entries must include name and contributorType.",
      });
    }

    if (contributor.organization === "__INVALID_EXTRA_SEGMENT__") {
      row.errors.push({
        field: "contributors",
        code: "CONTRIBUTOR_FORMAT_INVALID",
        message: "Contributor entries must use name|contributorType|contributorRole|userEmail|organization.",
      });
    }

    if (
      contributor.contributorType &&
      !allowedContributorTypes.has(contributor.contributorType)
    ) {
      row.errors.push({
        field: "contributors",
        code: "INVALID_ENUM",
        message: "Contributor type is not supported.",
      });
    }

    if (
      contributor.contributorRole &&
      !allowedContributorRoles.has(contributor.contributorRole)
    ) {
      row.errors.push({
        field: "contributors",
        code: "INVALID_ENUM",
        message: "Contributor role is not supported.",
      });
    }

    if (contributor.userEmail && !isValidEmail(contributor.userEmail)) {
      row.errors.push({
        field: "contributors",
        code: "INVALID_FORMAT",
        message: "Contributor userEmail must be a valid address.",
      });
    }

    if (
      expectedType &&
      contributor.contributorType &&
      allowedContributorTypes.has(contributor.contributorType) &&
      contributor.contributorType !== expectedType
    ) {
      row.errors.push({
        field: "contributors",
        code: "CONTRIBUTOR_TYPE_MISMATCH",
        message: "Contributor type does not match achievement type.",
      });
    }
  }
};

const validateRequiredEnum = (
  row: WorkingRow,
  field: "type",
  value: string | null,
  allowed: ReadonlySet<string>,
): void => {
  if (!value) {
    row.errors.push({
      field,
      code: "REQUIRED",
      message: `${field} is required.`,
    });
    return;
  }

  if (!allowed.has(value)) {
    row.errors.push({
      field,
      code: "INVALID_ENUM",
      message: `${field} is not supported.`,
    });
  }
};

const validateRequiredText = (
  row: WorkingRow,
  field: "title",
  value: string | null,
  maxLength: number,
): void => {
  if (!value) {
    row.errors.push({
      field,
      code: "REQUIRED",
      message: `${field} is required.`,
    });
    return;
  }

  if (value.length > maxLength) {
    row.errors.push({
      field,
      code: "INVALID_FORMAT",
      message: `${field} is too long.`,
    });
  }
};

const validateRequiredCode = (
  row: WorkingRow,
  field: "departmentCode",
  value: string | null,
  pattern: RegExp,
): void => {
  if (!value) {
    row.errors.push({
      field,
      code: "REQUIRED",
      message: `${field} is required.`,
    });
    return;
  }

  if (value.length > 64 || !pattern.test(value)) {
    row.errors.push({
      field,
      code: "INVALID_FORMAT",
      message: `${field} must use uppercase letters, numbers, or underscore.`,
    });
  }
};

const validateOptionalEnum = (
  row: WorkingRow,
  field: string,
  allowed: ReadonlySet<string>,
): void => {
  const value = normalizeEnumCell(row.valuesByHeader.get(field));
  if (value && !allowed.has(value)) {
    row.errors.push({
      field,
      code: "INVALID_ENUM",
      message: `${field} is not supported.`,
    });
  }
};

const validateDate = (row: WorkingRow, field: string): void => {
  const value = normalizeCell(row.valuesByHeader.get(field));
  if (value && !isoDatePattern.test(value)) {
    row.errors.push({
      field,
      code: "INVALID_FORMAT",
      message: `${field} must be an ISO date string.`,
    });
  }
};

const validateIntegerRange = (
  row: WorkingRow,
  field: string,
  min: number,
  max: number,
): void => {
  const value = normalizeCell(row.valuesByHeader.get(field));
  if (!value) {
    return;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    row.errors.push({
      field,
      code: "INVALID_FORMAT",
      message: `${field} is outside the supported range.`,
    });
  }
};

const validateDecimal = (row: WorkingRow, field: string, maxDecimalPlaces: number): void => {
  const value = normalizeCell(row.valuesByHeader.get(field));
  if (!value) {
    return;
  }

  const parsed = Number(value);
  const decimals = value.includes(".") ? value.split(".")[1]!.length : 0;
  if (!Number.isFinite(parsed) || parsed < 0 || decimals > maxDecimalPlaces) {
    row.errors.push({
      field,
      code: "INVALID_FORMAT",
      message: `${field} must be a nonnegative decimal with supported precision.`,
    });
  }
};

const applyDuplicateValidation = (rows: WorkingRow[]): void => {
  const countsByField = new Map<string, Map<string, number>>();
  for (const field of ["doi", "applicationNo", "patentNo", "registrationNo"] as const) {
    countsByField.set(field, new Map<string, number>());
  }

  for (const row of rows) {
    for (const [field, value] of Object.entries(row.parsed.normalizedIdentifiers)) {
      if (!value) {
        continue;
      }
      const counts = countsByField.get(field)!;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  for (const row of rows) {
    for (const [field, value] of Object.entries(row.parsed.normalizedIdentifiers)) {
      if (value && (countsByField.get(field)?.get(value) ?? 0) > 1) {
        row.errors.push({
          field,
          code: "DUPLICATE_IN_FILE",
          message: `${field} is duplicated in this file.`,
        });
      }
    }
  }
};

const applyReferenceValidation = (
  rows: WorkingRow[],
  departmentByCode: ReadonlyMap<string, AchievementImportDepartmentLookup>,
  userByEmail: ReadonlyMap<string, AchievementImportUserLookup>,
): void => {
  for (const row of rows) {
    const department = row.parsed.departmentCode
      ? departmentByCode.get(row.parsed.departmentCode)
      : null;
    if (row.parsed.departmentCode && isValidDepartmentCode(row.parsed.departmentCode) && !department) {
      row.errors.push({
        field: "departmentCode",
        code: "UNKNOWN_DEPARTMENT",
        message: "departmentCode was not found as an active department.",
      });
    }
    row.resolved.departmentId = department?.id ?? null;

    validateOwner(row, userByEmail);
    validateContributorUsers(row, userByEmail);
  }
};

const validateOwner = (
  row: WorkingRow,
  userByEmail: ReadonlyMap<string, AchievementImportUserLookup>,
): void => {
  if (!row.parsed.ownerEmail || !isValidEmail(row.parsed.ownerEmail)) {
    return;
  }

  const owner = userByEmail.get(row.parsed.ownerEmail);
  if (!isActiveUser(owner)) {
    row.errors.push({
      field: "ownerEmail",
      code: "OWNER_NOT_FOUND",
      message: "ownerEmail was not found as an active user.",
    });
    return;
  }

  row.resolved.ownerUserId = owner.id;

  if (row.resolved.departmentId && owner.departmentId !== row.resolved.departmentId) {
    row.errors.push({
      field: "ownerEmail",
      code: "OWNER_DEPARTMENT_MISMATCH",
      message: "ownerEmail does not belong to the target department.",
    });
  }
};

const validateContributorUsers = (
  row: WorkingRow,
  userByEmail: ReadonlyMap<string, AchievementImportUserLookup>,
): void => {
  for (const contributor of row.parsed.contributors) {
    if (!contributor.userEmail || !isValidEmail(contributor.userEmail)) {
      continue;
    }

    if (!isActiveUser(userByEmail.get(contributor.userEmail))) {
      row.errors.push({
        field: "contributors",
        code: "CONTRIBUTOR_USER_NOT_FOUND",
        message: "Contributor userEmail was not found as an active user.",
      });
    }
  }
};

const applyDbConflictValidation = (
  rows: WorkingRow[],
  conflictKeys: ReadonlySet<string>,
): void => {
  for (const row of rows) {
    for (const [field, value] of Object.entries(row.parsed.normalizedIdentifiers)) {
      if (value && conflictKeys.has(toConflictKey(field, value))) {
        row.warnings.push({
          field,
          code: "DB_CONFLICT",
          message: `${field} already exists and requires review before real import.`,
        });
      }
    }
  }
};

const toResultRow = (row: WorkingRow): AchievementImportDryRunRow => {
  if (row.errors.length > 0) {
    return {
      rowNumber: row.rowNumber,
      parsed: row.parsed,
      status: "ERROR",
      candidateAction: "SKIP",
      errors: row.errors,
      warnings: row.warnings,
    };
  }

  if (row.warnings.length > 0) {
    return {
      rowNumber: row.rowNumber,
      parsed: row.parsed,
      status: "WARNING",
      candidateAction: "CREATE_DRAFT",
      errors: row.errors,
      warnings: row.warnings,
    };
  }

  return {
    rowNumber: row.rowNumber,
    parsed: row.parsed,
    status: "VALID",
    candidateAction: "CREATE_DRAFT",
    errors: row.errors,
    warnings: row.warnings,
  };
};

const summarizeRows = (rows: readonly AchievementImportDryRunRow[]) => ({
  totalRows: rows.length,
  validRows: rows.filter((row) => row.errors.length === 0).length,
  errorRows: rows.filter((row) => row.errors.length > 0).length,
  warningRows: rows.filter((row) => row.warnings.length > 0).length,
  createDraftCandidates: rows.filter((row) => row.candidateAction === "CREATE_DRAFT").length,
  duplicateIdentifierRows: rows.filter((row) =>
    row.errors.some((error) => error.code === "DUPLICATE_IN_FILE"),
  ).length,
  dbConflictRows: rows.filter((row) =>
    row.warnings.some((warning) => warning.code === "DB_CONFLICT"),
  ).length,
  ownerEmployeeNoLookup: "NOT_AVAILABLE" as const,
});

const parseContributors = (
  value: string | undefined,
): AchievementImportContributorPreview[] => {
  const normalized = normalizeCell(value);
  if (!normalized) {
    return [];
  }

  return normalized
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry, index) => {
      const [name, contributorType, contributorRole, userEmail, organization, extra] =
        entry.split("|").map((part) => part.trim());
      return {
        name: name || null,
        contributorType: normalizeEnumValue(contributorType),
        contributorRole: normalizeEnumValue(contributorRole),
        userEmail: normalizeEmailCell(userEmail),
        organization: organization || (extra ? "__INVALID_EXTRA_SEGMENT__" : null),
        sortOrder: index + 1,
      };
    });
};

const collectDepartmentCodes = (rows: readonly WorkingRow[]): string[] =>
  [...new Set(rows.map((row) => row.parsed.departmentCode).filter((code): code is string => Boolean(code)))];

const collectEmails = (rows: readonly WorkingRow[]): string[] => {
  const emails: string[] = [];
  for (const row of rows) {
    if (row.parsed.ownerEmail) {
      emails.push(row.parsed.ownerEmail);
    }
    for (const contributor of row.parsed.contributors) {
      if (contributor.userEmail) {
        emails.push(contributor.userEmail);
      }
    }
  }
  return [...new Set(emails)];
};

const collectNormalizedIdentifierInput = (rows: readonly WorkingRow[]) => ({
  doiNormalizedValues: collectNormalizedValues(rows, "doi"),
  applicationNoNormalizedValues: collectNormalizedValues(rows, "applicationNo"),
  patentNoNormalizedValues: collectNormalizedValues(rows, "patentNo"),
  registrationNoNormalizedValues: collectNormalizedValues(rows, "registrationNo"),
});

const collectNormalizedValues = (
  rows: readonly WorkingRow[],
  field: keyof AchievementImportDryRunRow["parsed"]["normalizedIdentifiers"],
): string[] =>
  [
    ...new Set(
      rows
        .map((row) => row.parsed.normalizedIdentifiers[field])
        .filter((value): value is string => Boolean(value)),
    ),
  ];

const toConflictKeySet = (
  conflicts: readonly AchievementImportNormalizedConflict[],
): Set<string> => {
  const keys = new Set<string>();
  for (const conflict of conflicts) {
    keys.add(toConflictKey(conflict.field, conflict.normalizedValue));
    if (conflict.field === "grantNo") {
      keys.add(toConflictKey("patentNo", conflict.normalizedValue));
    }
  }
  return keys;
};

const toConflictKey = (field: string, normalizedValue: string): string =>
  `${field}:${normalizedValue}`;

const expectedContributorType = (type: string | null): string | null => {
  if (type === AchievementTypeCode.paper) {
    return ContributorTypeCode.author;
  }
  if (type === AchievementTypeCode.patent) {
    return ContributorTypeCode.inventor;
  }
  if (type === AchievementTypeCode.softwareCopyright) {
    return ContributorTypeCode.copyrightOwner;
  }
  return null;
};

const isActiveUser = (user: AchievementImportUserLookup | undefined): user is AchievementImportUserLookup =>
  Boolean(user && user.status === UserStatus.ACTIVE && user.archivedAt === null);

const isValidDepartmentCode = (code: string): boolean =>
  code.length <= 64 && departmentCodePattern.test(code);

const isValidEmail = (email: string): boolean =>
  email.length <= 255 && emailPattern.test(email);

const getCell = (
  valuesByHeader: ReadonlyMap<string, string>,
  field: string,
): string | undefined => valuesByHeader.get(field);

const normalizeCell = (value: string | undefined): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const normalizeEmailCell = (value: string | undefined): string | null => {
  const normalized = normalizeCell(value);
  return normalized ? normalized.toLowerCase() : null;
};

const normalizeEnumCell = (value: string | undefined): string | null => {
  const normalized = normalizeCell(value);
  return normalized ? normalized.toUpperCase() : null;
};

const normalizeEnumValue = (value: string | undefined): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized.toUpperCase() : null;
};

const isForbiddenColumn = (header: string): boolean => {
  const normalized = header.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
  return sensitiveColumns.has(normalized) || forbiddenColumns.has(normalized);
};

const sanitizeHeaderForOutput = (header: string): string =>
  isForbiddenColumn(header) ? "(sensitive)" : header;

const sanitizeFileName = (name: string): string =>
  name.replace(/[\\/]/g, "-").slice(0, 255) || "achievements.csv";
