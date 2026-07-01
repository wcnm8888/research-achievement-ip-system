import { Inject, Injectable } from "@nestjs/common";
import { UserStatus } from "@prisma/client";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { UserContext } from "../identity/user-context";
import {
  UserAccountImportDepartmentLookup,
  UserAccountImportDryRunRepository,
  UserAccountImportRoleLookup,
  UserAccountImportUserLookup,
} from "./user-account-import-dry-run.repository";
import {
  appendColumnValidationIssues,
  buildImportDryRunFileMetadata,
  buildValuesByHeader,
  ImportCsvParseResult,
  ImportDryRunFile,
  ImportDryRunIssue,
  ImportDryRunResult,
  ImportDryRunRow,
  ImportDryRunStatus,
  isFormulaLikeCell,
  normalizeImportHeaderToken,
  parseImportCsv,
  summarizeImportDryRunRows,
} from "./import-dry-run.shared";

export const userAccountImportType = "USER_ACCOUNT" as const;

const requiredColumns = ["email", "displayName", "departmentCode", "roleCode"] as const;
const optionalColumns = ["employeeNo", "scopeType", "scopeDepartmentCode", "status"] as const;
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
]);
const departmentCodePattern = /^[A-Z0-9_]+$/;
const roleCodePattern = /^[A-Z0-9_]+$/;
const employeeNoPattern = /^[A-Za-z0-9_-]+$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxRows = 500;
const importableStatuses = new Set<string>([
  UserStatus.PENDING_ACTIVATION,
  UserStatus.DISABLED,
]);
const knownUserStatuses = new Set<string>(Object.values(UserStatus));

export type UserAccountImportDryRunFile = ImportDryRunFile;

export type UserAccountImportDryRunIssueCode =
  | "REQUIRED"
  | "INVALID_FORMAT"
  | "DUPLICATE_IN_FILE"
  | "UNKNOWN_COLUMN"
  | "FORBIDDEN_SENSITIVE_COLUMN"
  | "FORMULA_LIKE_VALUE"
  | "UNKNOWN_DEPARTMENT"
  | "UNKNOWN_ROLE"
  | "UNKNOWN_SCOPE_DEPARTMENT"
  | "INVALID_SCOPE"
  | "GLOBAL_SCOPE_NOT_ALLOWED"
  | "ROLE_NOT_IMPORTABLE"
  | "INVALID_STATUS"
  | "UNSUPPORTED_STATUS"
  | "EXISTING_USER"
  | "EXISTING_ROLE_ASSIGNMENT"
  | "REVOKED_ROLE_ASSIGNMENT";

export type UserAccountImportDryRunIssue = ImportDryRunIssue<UserAccountImportDryRunIssueCode>;

export type UserAccountImportDryRunRowStatus = ImportDryRunStatus;
export type UserAccountImportDryRunCandidateAction =
  | "CREATE_PENDING_USER"
  | "REVIEW_EXISTING_USER"
  | "REACTIVATE_ROLE_REVIEW"
  | "SKIP";

export type UserAccountImportDryRunParsedRow = {
  email: string | null;
  displayName: string | null;
  employeeNo: string | null;
  departmentCode: string | null;
  roleCode: string | null;
  scopeType: string | null;
  scopeDepartmentCode: string | null;
  status: string | null;
  credentialAction: "NO_CREDENTIAL";
};

export type UserAccountImportDryRunRow = ImportDryRunRow<
  UserAccountImportDryRunParsedRow,
  UserAccountImportDryRunCandidateAction,
  UserAccountImportDryRunIssue
>;

export type UserAccountImportDryRunSummary = {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  createCandidates: number;
  existingUserRows: number;
  existingRoleAssignmentRows: number;
  reactivationCandidateRows: number;
  employeeNoDbConflictCheck: "NOT_AVAILABLE";
};

export type UserAccountImportDryRunResult = ImportDryRunResult<
  typeof userAccountImportType,
  UserAccountImportDryRunSummary,
  UserAccountImportDryRunRow
>;

type WorkingRow = {
  rowNumber: number;
  valuesByHeader: Map<string, string>;
  parsed: UserAccountImportDryRunParsedRow;
  resolved: {
    departmentId: string | null;
    roleId: string | null;
    scopeDepartmentId: string | null;
  };
  errors: UserAccountImportDryRunIssue[];
  warnings: UserAccountImportDryRunIssue[];
};

export class InvalidUserAccountImportCsvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUserAccountImportCsvError";
  }
}

@Injectable()
export class UserAccountImportDryRunService {
  constructor(
    @Inject(UserAccountImportDryRunRepository)
    private readonly repository: UserAccountImportDryRunRepository,
  ) {}

  async dryRunUserAccountCsv(
    _context: UserContext,
    file: UserAccountImportDryRunFile,
  ): Promise<UserAccountImportDryRunResult> {
    const csv = parseImportCsv(file.buffer, {
      maxRows,
      createError: (message) => new InvalidUserAccountImportCsvError(message),
    });
    const rows = toWorkingRows(csv);
    applyColumnValidation(rows, csv.headers);
    applyRowValidation(rows);
    applyDuplicateValidation(rows);

    const [departments, roles, users] = await Promise.all([
      this.repository.findActiveDepartmentsByCodes(collectDepartmentCodes(rows)),
      this.repository.findActiveRolesByCodes(collectRoleCodes(rows)),
      this.repository.findUsersByEmails(collectEmails(rows)),
    ]);

    const departmentByCode = new Map(departments.map((department) => [department.code, department]));
    const roleByCode = new Map(roles.map((role) => [role.code, role]));
    const userByEmail = new Map(users.map((user) => [user.email, user]));

    applyReferenceValidation(rows, departmentByCode, roleByCode);
    applyExistingUserWarnings(rows, userByEmail);
    applyRoleAssignmentWarnings(rows, userByEmail);

    const resultRows = rows.map(toResultRow);

    return {
      importType: userAccountImportType,
      dryRun: true,
      file: buildImportDryRunFileMetadata(file, "user-accounts.csv"),
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

const toWorkingRows = (csv: ImportCsvParseResult): WorkingRow[] =>
  csv.records.map((record) => {
    const valuesByHeader = buildValuesByHeader(csv.headers, record.values);

    const departmentCode = normalizeCell(valuesByHeader.get("departmentCode"));
    const scopeDepartmentCode =
      normalizeCell(valuesByHeader.get("scopeDepartmentCode")) ?? departmentCode;

    return {
      rowNumber: record.rowNumber,
      valuesByHeader,
      parsed: {
        email: normalizeEmailCell(valuesByHeader.get("email")),
        displayName: normalizeCell(valuesByHeader.get("displayName")),
        employeeNo: normalizeCell(valuesByHeader.get("employeeNo")),
        departmentCode,
        roleCode: normalizeCell(valuesByHeader.get("roleCode")),
        scopeType: normalizeEnumCell(valuesByHeader.get("scopeType")) ?? ScopeType.department,
        scopeDepartmentCode,
        status: normalizeEnumCell(valuesByHeader.get("status")) ?? UserStatus.PENDING_ACTIVATION,
        credentialAction: "NO_CREDENTIAL",
      },
      resolved: {
        departmentId: null,
        roleId: null,
        scopeDepartmentId: null,
      },
      errors: [],
      warnings: [],
    };
  });

const applyColumnValidation = (
  rows: WorkingRow[],
  headers: readonly string[],
): void =>
  appendColumnValidationIssues(rows, headers, {
    allowedColumns,
    requiredColumns,
    isForbiddenColumn: isSensitiveColumn,
    unknownCode: "UNKNOWN_COLUMN",
    forbiddenCode: "FORBIDDEN_SENSITIVE_COLUMN",
    requiredCode: "REQUIRED",
    forbiddenMessage: "Credential, token, session, secret, and link columns are not supported.",
  });

const applyRowValidation = (rows: WorkingRow[]): void => {
  for (const row of rows) {
    validateFormulaLikeValues(row);
    validateEmail(row);
    validateRequiredText(row, "displayName", row.parsed.displayName, 120);
    validateRequiredCode(row, "departmentCode", row.parsed.departmentCode, departmentCodePattern);
    validateRequiredCode(row, "roleCode", row.parsed.roleCode, roleCodePattern);
    validateOptionalCode(row, "scopeDepartmentCode", row.parsed.scopeDepartmentCode, departmentCodePattern);
    validateEmployeeNo(row);
    validateScope(row);
    validateStatus(row);
    validateRoleImportBoundary(row);
  }
};

const validateFormulaLikeValues = (row: WorkingRow): void => {
  for (const field of allowedColumns) {
    const value = normalizeCell(row.valuesByHeader.get(field));
    if (isFormulaLikeCell(value)) {
      row.errors.push({
        field,
        code: "FORMULA_LIKE_VALUE",
        message: "Formula-like cell values are not allowed.",
      });
    }
  }
};

const validateEmail = (row: WorkingRow): void => {
  const email = row.parsed.email;
  if (!email) {
    row.errors.push({
      field: "email",
      code: "REQUIRED",
      message: "email is required.",
    });
    return;
  }

  if (email.length > 255 || !emailPattern.test(email)) {
    row.errors.push({
      field: "email",
      code: "INVALID_FORMAT",
      message: "email must be a valid address.",
    });
  }
};

const validateRequiredText = (
  row: WorkingRow,
  field: "displayName",
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
  field: "departmentCode" | "roleCode",
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

const validateOptionalCode = (
  row: WorkingRow,
  field: "scopeDepartmentCode",
  value: string | null,
  pattern: RegExp,
): void => {
  if (!value) {
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

const validateEmployeeNo = (row: WorkingRow): void => {
  const employeeNo = row.parsed.employeeNo;
  if (!employeeNo) {
    return;
  }

  if (employeeNo.length > 64 || !employeeNoPattern.test(employeeNo)) {
    row.errors.push({
      field: "employeeNo",
      code: "INVALID_FORMAT",
      message: "employeeNo must use letters, numbers, underscore, or hyphen.",
    });
  }
};

const validateScope = (row: WorkingRow): void => {
  const scopeType = row.parsed.scopeType;
  if (scopeType !== ScopeType.department && scopeType !== ScopeType.global) {
    row.errors.push({
      field: "scopeType",
      code: "INVALID_SCOPE",
      message: "scopeType must be DEPARTMENT for CSV import dry-run.",
    });
    return;
  }

  if (scopeType === ScopeType.global) {
    row.errors.push({
      field: "scopeType",
      code: "GLOBAL_SCOPE_NOT_ALLOWED",
      message: "GLOBAL role scope is not supported by CSV import dry-run.",
    });
  }
};

const validateStatus = (row: WorkingRow): void => {
  const status = row.parsed.status;
  if (!status || !knownUserStatuses.has(status)) {
    row.errors.push({
      field: "status",
      code: "INVALID_STATUS",
      message: "status must be PENDING_ACTIVATION or DISABLED.",
    });
    return;
  }

  if (!importableStatuses.has(status)) {
    row.errors.push({
      field: "status",
      code: "UNSUPPORTED_STATUS",
      message: "status must be PENDING_ACTIVATION or DISABLED.",
    });
  }
};

const validateRoleImportBoundary = (row: WorkingRow): void => {
  if (row.parsed.roleCode === RoleCode.systemAdmin) {
    row.errors.push({
      field: "roleCode",
      code: "ROLE_NOT_IMPORTABLE",
      message: "SYSTEM_ADMIN role assignment is not supported by CSV import dry-run.",
    });
  }
};

const applyDuplicateValidation = (rows: WorkingRow[]): void => {
  const emailCounts = new Map<string, number>();
  const employeeNoCounts = new Map<string, number>();

  for (const row of rows) {
    if (row.parsed.email) {
      emailCounts.set(row.parsed.email, (emailCounts.get(row.parsed.email) ?? 0) + 1);
    }
    if (row.parsed.employeeNo) {
      employeeNoCounts.set(
        row.parsed.employeeNo,
        (employeeNoCounts.get(row.parsed.employeeNo) ?? 0) + 1,
      );
    }
  }

  for (const row of rows) {
    if (row.parsed.email && (emailCounts.get(row.parsed.email) ?? 0) > 1) {
      row.errors.push({
        field: "email",
        code: "DUPLICATE_IN_FILE",
        message: "email is duplicated in this file.",
      });
    }

    if (row.parsed.employeeNo && (employeeNoCounts.get(row.parsed.employeeNo) ?? 0) > 1) {
      row.errors.push({
        field: "employeeNo",
        code: "DUPLICATE_IN_FILE",
        message: "employeeNo is duplicated in this file.",
      });
    }
  }
};

const applyReferenceValidation = (
  rows: WorkingRow[],
  departmentByCode: ReadonlyMap<string, UserAccountImportDepartmentLookup>,
  roleByCode: ReadonlyMap<string, UserAccountImportRoleLookup>,
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

    const scopeDepartment = row.parsed.scopeDepartmentCode
      ? departmentByCode.get(row.parsed.scopeDepartmentCode)
      : null;
    if (
      row.parsed.scopeDepartmentCode &&
      isValidDepartmentCode(row.parsed.scopeDepartmentCode) &&
      !scopeDepartment
    ) {
      row.errors.push({
        field: "scopeDepartmentCode",
        code: "UNKNOWN_SCOPE_DEPARTMENT",
        message: "scopeDepartmentCode was not found as an active department.",
      });
    }
    row.resolved.scopeDepartmentId = scopeDepartment?.id ?? null;

    const role = row.parsed.roleCode ? roleByCode.get(row.parsed.roleCode) : null;
    if (row.parsed.roleCode && isValidRoleCode(row.parsed.roleCode) && !role) {
      row.errors.push({
        field: "roleCode",
        code: "UNKNOWN_ROLE",
        message: "roleCode was not found as an active role.",
      });
    }
    row.resolved.roleId = role?.id ?? null;
  }
};

const applyExistingUserWarnings = (
  rows: WorkingRow[],
  userByEmail: ReadonlyMap<string, UserAccountImportUserLookup>,
): void => {
  for (const row of rows) {
    if (row.parsed.email && userByEmail.has(row.parsed.email)) {
      row.warnings.push({
        field: "email",
        code: "EXISTING_USER",
        message: "email already belongs to an existing user and requires review.",
      });
    }
  }
};

const applyRoleAssignmentWarnings = (
  rows: WorkingRow[],
  userByEmail: ReadonlyMap<string, UserAccountImportUserLookup>,
): void => {
  for (const row of rows) {
    const user = row.parsed.email ? userByEmail.get(row.parsed.email) : null;
    if (!user || !row.parsed.roleCode || !row.resolved.scopeDepartmentId) {
      continue;
    }

    const assignment = user.userRoles.find(
      (userRole) =>
        userRole.role.code === row.parsed.roleCode &&
        userRole.scopeType === ScopeType.department &&
        userRole.scopeKey === row.resolved.scopeDepartmentId,
    );
    if (!assignment) {
      continue;
    }

    row.warnings.push({
      field: "roleCode",
      code: assignment.revokedAt ? "REVOKED_ROLE_ASSIGNMENT" : "EXISTING_ROLE_ASSIGNMENT",
      message: assignment.revokedAt
        ? "matching revoked role assignment would require explicit reactivation review."
        : "matching active role assignment already exists.",
    });
  }
};

const toResultRow = (row: WorkingRow): UserAccountImportDryRunRow => {
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

  if (row.warnings.some((warning) => warning.code === "REVOKED_ROLE_ASSIGNMENT")) {
    return {
      rowNumber: row.rowNumber,
      parsed: row.parsed,
      status: "WARNING",
      candidateAction: "REACTIVATE_ROLE_REVIEW",
      errors: row.errors,
      warnings: row.warnings,
    };
  }

  if (row.warnings.length > 0) {
    return {
      rowNumber: row.rowNumber,
      parsed: row.parsed,
      status: "WARNING",
      candidateAction: "REVIEW_EXISTING_USER",
      errors: row.errors,
      warnings: row.warnings,
    };
  }

  return {
    rowNumber: row.rowNumber,
    parsed: row.parsed,
    status: "VALID",
    candidateAction: "CREATE_PENDING_USER",
    errors: row.errors,
    warnings: row.warnings,
  };
};

const summarizeRows = (rows: readonly UserAccountImportDryRunRow[]) => ({
  ...summarizeImportDryRunRows(rows),
  createCandidates: rows.filter((row) => row.candidateAction === "CREATE_PENDING_USER").length,
  existingUserRows: rows.filter((row) =>
    row.warnings.some((warning) => warning.code === "EXISTING_USER"),
  ).length,
  existingRoleAssignmentRows: rows.filter((row) =>
    row.warnings.some((warning) => warning.code === "EXISTING_ROLE_ASSIGNMENT"),
  ).length,
  reactivationCandidateRows: rows.filter((row) =>
    row.warnings.some((warning) => warning.code === "REVOKED_ROLE_ASSIGNMENT"),
  ).length,
  employeeNoDbConflictCheck: "NOT_AVAILABLE" as const,
});

const collectDepartmentCodes = (rows: readonly WorkingRow[]): string[] => {
  const codes: string[] = [];
  for (const row of rows) {
    if (row.parsed.departmentCode) {
      codes.push(row.parsed.departmentCode);
    }
    if (row.parsed.scopeDepartmentCode) {
      codes.push(row.parsed.scopeDepartmentCode);
    }
  }
  return [...new Set(codes)];
};

const collectRoleCodes = (rows: readonly WorkingRow[]): string[] =>
  [...new Set(rows.map((row) => row.parsed.roleCode).filter((code): code is string => Boolean(code)))];

const collectEmails = (rows: readonly WorkingRow[]): string[] =>
  [...new Set(rows.map((row) => row.parsed.email).filter((email): email is string => Boolean(email)))];

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

const isValidDepartmentCode = (code: string): boolean =>
  code.length <= 64 && departmentCodePattern.test(code);

const isValidRoleCode = (code: string): boolean =>
  code.length <= 64 && roleCodePattern.test(code);

const isSensitiveColumn = (header: string): boolean =>
  sensitiveColumns.has(normalizeImportHeaderToken(header));

const sanitizeHeaderForOutput = (header: string): string =>
  isSensitiveColumn(header) ? "(sensitive)" : header;
