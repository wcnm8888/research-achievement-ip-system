import { Inject, Injectable } from "@nestjs/common";
import { DepartmentStatus, RoleStatus, UserStatus } from "@prisma/client";
import { AuditTransactionClient } from "../audit/audit.repository";
import { AuditService } from "../audit/audit.service";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { CreateAuditEventInput } from "../audit/domain/audit-event.types";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { PrismaService } from "../database/prisma.service";
import { UserContext } from "../identity/user-context";
import {
  UserAccountImportApplyDepartmentLookup,
  UserAccountImportApplyRoleLookup,
  UserAccountImportApplyTransactionClient,
  UserAccountImportApplyUserLookup,
  UserAccountImportCreatedUser,
  UserAccountImportDepartmentLookup,
  UserAccountImportDryRunRepository,
  UserAccountImportEmployeeNoLookup,
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
  | "EXISTING_EMPLOYEE_NO"
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
  existingEmployeeNoRows: number;
  existingRoleAssignmentRows: number;
  reactivationCandidateRows: number;
  employeeNoDbConflictCheck: "AVAILABLE";
};

export type UserAccountImportDryRunResult = ImportDryRunResult<
  typeof userAccountImportType,
  UserAccountImportDryRunSummary,
  UserAccountImportDryRunRow
>;

export type UserAccountImportApplyMode = "CREATE_ONLY_PENDING_NO_CREDENTIAL";

export type UserAccountImportApplyErrorSummary = {
  rowNumber: number | null;
  field: string;
  code: string;
  message: string;
};

export type UserAccountImportApplyRow = {
  rowNumber: number;
  emailMasked: string;
  status: "CREATED";
  createdUserId: string;
  createdUserRoleIds: string[];
  roleCode: string;
  scopeType: "DEPARTMENT";
};

export type UserAccountImportApplySummary = {
  totalRows: number;
  createdUsersCount: number;
  createdRolesCount: number;
  skippedRows: number;
  failedRows: number;
  errorCount: number;
  warningCount: number;
  auditOperation: "USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL";
};

export type UserAccountImportApplyResult = {
  importType: typeof userAccountImportType;
  dryRun: false;
  mode: UserAccountImportApplyMode;
  file: ReturnType<typeof buildImportDryRunFileMetadata>;
  summary: UserAccountImportApplySummary;
  errors: UserAccountImportApplyErrorSummary[];
  rows: UserAccountImportApplyRow[];
};

type UserAccountImportPlan = {
  file: UserAccountImportDryRunResult["file"];
  columns: UserAccountImportDryRunResult["columns"];
  summary: UserAccountImportDryRunSummary;
  rows: UserAccountImportDryRunRow[];
  resolvedRows: UserAccountImportResolvedPlanRow[];
};

type UserAccountImportResolvedPlanRow = {
  rowNumber: number;
  parsed: UserAccountImportDryRunParsedRow;
  resolved: {
    departmentId: string | null;
    roleId: string | null;
    scopeDepartmentId: string | null;
    employeeNoNormalized: string | null;
  };
};

type WorkingRow = {
  rowNumber: number;
  valuesByHeader: Map<string, string>;
  parsed: UserAccountImportDryRunParsedRow;
  resolved: {
    departmentId: string | null;
    roleId: string | null;
    scopeDepartmentId: string | null;
    employeeNoNormalized: string | null;
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

export class InvalidUserAccountImportApplyModeError extends Error {
  constructor(mode: string) {
    super(`Unsupported user account import apply mode: ${mode}.`);
    this.name = "InvalidUserAccountImportApplyModeError";
  }
}

export class UserAccountImportApplyRejectedError extends Error {
  constructor(
    message: string,
    readonly result: UserAccountImportApplyResult,
  ) {
    super(message);
    this.name = "UserAccountImportApplyRejectedError";
  }
}

@Injectable()
export class UserAccountImportDryRunService {
  constructor(
    @Inject(UserAccountImportDryRunRepository)
    private readonly repository: UserAccountImportDryRunRepository,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async dryRunUserAccountCsv(
    _context: UserContext,
    file: UserAccountImportDryRunFile,
  ): Promise<UserAccountImportDryRunResult> {
    const plan = await this.buildUserAccountImportPlan(file);

    return {
      importType: userAccountImportType,
      dryRun: true,
      file: plan.file,
      columns: plan.columns,
      summary: plan.summary,
      rows: plan.rows,
    };
  }

  async applyUserAccountCsv(
    context: UserContext,
    file: UserAccountImportDryRunFile,
    mode: string | undefined = "CREATE_ONLY_PENDING_NO_CREDENTIAL",
  ): Promise<UserAccountImportApplyResult> {
    if (mode !== "CREATE_ONLY_PENDING_NO_CREDENTIAL") {
      throw new InvalidUserAccountImportApplyModeError(mode ?? "(missing)");
    }

    const plan = await this.buildUserAccountImportPlan(file);
    assertPlanCanApply(plan);

    const rowsToCreate = plan.resolvedRows;

    try {
      const appliedRows = await this.prisma.$transaction(async (tx) => {
        const importClient = tx as UserAccountImportApplyTransactionClient;
        const auditClient = tx as AuditTransactionClient;

        const [departments, roles, users, employeeNoUsers] = await Promise.all([
          this.repository.findApplyDepartmentsByCodesInTransaction(
            importClient,
            collectDepartmentCodesFromResolvedRows(rowsToCreate),
          ),
          this.repository.findApplyRolesByCodesInTransaction(
            importClient,
            collectRoleCodesFromResolvedRows(rowsToCreate),
          ),
          this.repository.findApplyUsersByEmailsInTransaction(
            importClient,
            collectEmailsFromResolvedRows(rowsToCreate),
          ),
          this.repository.findApplyUsersByEmployeeNoNormalizedInTransaction(
            importClient,
            collectEmployeeNoNormalizedFromResolvedRows(rowsToCreate),
          ),
        ]);

        const blockingErrors = toTransactionRecheckErrors(
          rowsToCreate,
          departments,
          roles,
          users,
          employeeNoUsers,
        );
        if (blockingErrors.length > 0) {
          throw new UserAccountImportApplyRejectedError(
            "User account import apply failed transaction-time revalidation.",
            buildRejectedApplyResult(plan, blockingErrors),
          );
        }

        const departmentByCode = new Map(departments.map((department) => [department.code, department]));
        const roleByCode = new Map(roles.map((role) => [role.code, role]));
        const resultRows: UserAccountImportApplyRow[] = [];

        for (const row of rowsToCreate) {
          const department = departmentByCode.get(row.parsed.departmentCode!);
          const scopeDepartment = departmentByCode.get(row.parsed.scopeDepartmentCode!);
          const role = roleByCode.get(row.parsed.roleCode!);
          if (!department || !scopeDepartment || !role) {
            throw new Error("User account import apply invariant failed after revalidation.");
          }

          const created = await this.repository.createPendingNoCredentialUserInTransaction(
            importClient,
            {
              email: row.parsed.email!,
              employeeNo: row.parsed.employeeNo,
              employeeNoNormalized: row.resolved.employeeNoNormalized,
              name: row.parsed.displayName!,
              departmentId: department.id,
              role: {
                roleId: role.id,
                scopeType: ScopeType.department,
                scopeKey: scopeDepartment.id,
                departmentId: scopeDepartment.id,
              },
            },
          );

          assertCreatedUserIsNoCredentialPending(created);

          await this.auditService.recordEventInTransaction(
            auditClient,
            toUserAccountImportCreateAuditEvent(context, created, row, plan),
          );

          resultRows.push({
            rowNumber: row.rowNumber,
            emailMasked: maskEmail(created.email),
            status: "CREATED",
            createdUserId: created.id,
            createdUserRoleIds: created.userRoles.map((userRole) => userRole.id),
            roleCode: role.code,
            scopeType: ScopeType.department,
          });
        }

        return resultRows;
      });

      return buildSuccessfulApplyResult(plan, appliedRows);
    } catch (error) {
      if (error instanceof UserAccountImportApplyRejectedError) {
        throw error;
      }

      if (this.repository.isPrismaUniqueConflict(error)) {
        const target = this.repository.getPrismaUniqueConflictTarget(error);
        const conflictError = toUniqueConflictApplyError(target);
        throw new UserAccountImportApplyRejectedError(
          "User account import apply encountered a uniqueness conflict.",
          buildRejectedApplyResult(plan, [conflictError]),
        );
      }

      throw error instanceof Error
        ? error
        : new Error("Unknown user account import apply error.");
    }
  }

  private async buildUserAccountImportPlan(
    file: UserAccountImportDryRunFile,
  ): Promise<UserAccountImportPlan> {
    const csv = parseImportCsv(file.buffer, {
      maxRows,
      createError: (message) => new InvalidUserAccountImportCsvError(message),
    });
    const rows = toWorkingRows(csv);
    applyColumnValidation(rows, csv.headers);
    applyRowValidation(rows);
    applyDuplicateValidation(rows);

    const [departments, roles, users, employeeNoUsers] = await Promise.all([
      this.repository.findActiveDepartmentsByCodes(collectDepartmentCodes(rows)),
      this.repository.findActiveRolesByCodes(collectRoleCodes(rows)),
      this.repository.findUsersByEmails(collectEmails(rows)),
      this.repository.findUsersByEmployeeNoNormalized(collectEmployeeNoNormalized(rows)),
    ]);

    const departmentByCode = new Map(departments.map((department) => [department.code, department]));
    const roleByCode = new Map(roles.map((role) => [role.code, role]));
    const userByEmail = new Map(users.map((user) => [user.email, user]));
    const userByEmployeeNo = new Map(
      employeeNoUsers
        .filter((user) => user.employeeNoNormalized)
        .map((user) => [user.employeeNoNormalized!, user]),
    );

    applyReferenceValidation(rows, departmentByCode, roleByCode);
    applyExistingEmployeeNoErrors(rows, userByEmployeeNo);
    applyExistingUserWarnings(rows, userByEmail);
    applyRoleAssignmentWarnings(rows, userByEmail);

    const resultRows = rows.map(toResultRow);

    return {
      file: buildImportDryRunFileMetadata(file, "user-accounts.csv"),
      columns: {
        required: [...requiredColumns],
        optional: [...optionalColumns],
        received: csv.headers.map(sanitizeHeaderForOutput),
      },
      summary: summarizeRows(resultRows),
      rows: resultRows,
      resolvedRows: rows.map(toResolvedPlanRow),
    };
  }
}

const assertPlanCanApply = (plan: UserAccountImportPlan): void => {
  const blockingErrors = toApplyErrorSummaries(plan.rows);
  const applyOnlyErrors = plan.rows.flatMap((row) => {
    const errors: UserAccountImportApplyErrorSummary[] = [];

    if (
      row.status === "VALID" &&
      row.candidateAction === "CREATE_PENDING_USER" &&
      row.parsed.status !== UserStatus.PENDING_ACTIVATION
    ) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "status",
        code: "UNSUPPORTED_STATUS",
        message: "Apply supports only PENDING_ACTIVATION users.",
      });
    }

    if (
      row.status === "VALID" &&
      row.candidateAction === "CREATE_PENDING_USER" &&
      row.parsed.scopeType !== ScopeType.department
    ) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "scopeType",
        code: "INVALID_SCOPE",
        message: "Apply supports only DEPARTMENT role scope.",
      });
    }

    return errors;
  });

  if (blockingErrors.length > 0 || applyOnlyErrors.length > 0) {
    throw new UserAccountImportApplyRejectedError(
      "User account import apply requires only pending no-credential create candidates.",
      buildRejectedApplyResult(plan, [...blockingErrors, ...applyOnlyErrors]),
    );
  }
};

const buildSuccessfulApplyResult = (
  plan: UserAccountImportPlan,
  rows: UserAccountImportApplyRow[],
): UserAccountImportApplyResult => ({
  importType: userAccountImportType,
  dryRun: false,
  mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
  file: plan.file,
  summary: {
    totalRows: plan.summary.totalRows,
    createdUsersCount: rows.length,
    createdRolesCount: rows.reduce(
      (count, row) => count + row.createdUserRoleIds.length,
      0,
    ),
    skippedRows: 0,
    failedRows: 0,
    errorCount: 0,
    warningCount: 0,
    auditOperation: "USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL",
  },
  errors: [],
  rows,
});

const buildRejectedApplyResult = (
  plan: UserAccountImportPlan,
  errors: UserAccountImportApplyErrorSummary[],
): UserAccountImportApplyResult => ({
  importType: userAccountImportType,
  dryRun: false,
  mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
  file: plan.file,
  summary: {
    totalRows: plan.summary.totalRows,
    createdUsersCount: 0,
    createdRolesCount: 0,
    skippedRows: plan.summary.warningRows,
    failedRows: plan.summary.errorRows || errors.length,
    errorCount: errors.length,
    warningCount: plan.summary.warningRows,
    auditOperation: "USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL",
  },
  errors,
  rows: [],
});

const toUniqueConflictApplyError = (
  target: readonly string[],
): UserAccountImportApplyErrorSummary => {
  if (target.some((field) => field === "email" || field === "users_email_key")) {
    return {
      rowNumber: null,
      field: "email",
      code: "EXISTING_USER",
      message: "User email already exists.",
    };
  }

  if (
    target.some((field) =>
      ["employeeNoNormalized", "employee_no_normalized", "users_employee_no_normalized_key"].includes(field),
    )
  ) {
    return {
      rowNumber: null,
      field: "employeeNo",
      code: "EXISTING_EMPLOYEE_NO",
      message: "employeeNo already belongs to an existing user.",
    };
  }

  return {
    rowNumber: null,
    field: "identity",
    code: "IDENTITY_CONFLICT",
    message: "User identity already exists.",
  };
};

const toApplyErrorSummaries = (
  rows: readonly UserAccountImportDryRunRow[],
): UserAccountImportApplyErrorSummary[] =>
  rows.flatMap((row) => [
    ...row.errors.map((error) => ({
      rowNumber: row.rowNumber,
      field: error.field,
      code: error.code,
      message: error.message,
    })),
    ...row.warnings.map((warning) => ({
      rowNumber: row.rowNumber,
      field: warning.field,
      code: warning.code,
      message: warning.message,
    })),
  ]);

const toResolvedPlanRow = (row: WorkingRow): UserAccountImportResolvedPlanRow => ({
  rowNumber: row.rowNumber,
  parsed: row.parsed,
  resolved: row.resolved,
});

const toTransactionRecheckErrors = (
  rows: readonly UserAccountImportResolvedPlanRow[],
  departments: readonly UserAccountImportApplyDepartmentLookup[],
  roles: readonly UserAccountImportApplyRoleLookup[],
  users: readonly UserAccountImportApplyUserLookup[],
  employeeNoUsers: readonly UserAccountImportApplyUserLookup[],
): UserAccountImportApplyErrorSummary[] => {
  const errors: UserAccountImportApplyErrorSummary[] = [];
  const departmentByCode = new Map(departments.map((department) => [department.code, department]));
  const roleByCode = new Map(roles.map((role) => [role.code, role]));
  const existingEmailSet = new Set(users.map((user) => user.email));
  const existingEmployeeNoSet = new Set(
    employeeNoUsers
      .map((user) => user.employeeNoNormalized)
      .filter((employeeNo): employeeNo is string => Boolean(employeeNo)),
  );

  for (const row of rows) {
    const department = row.parsed.departmentCode
      ? departmentByCode.get(row.parsed.departmentCode)
      : null;
    if (!isActiveApplyDepartment(department)) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "departmentCode",
        code: "UNKNOWN_DEPARTMENT",
        message: "departmentCode was not found as active data during apply.",
      });
    }

    const scopeDepartment = row.parsed.scopeDepartmentCode
      ? departmentByCode.get(row.parsed.scopeDepartmentCode)
      : null;
    if (!isActiveApplyDepartment(scopeDepartment)) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "scopeDepartmentCode",
        code: "UNKNOWN_SCOPE_DEPARTMENT",
        message: "scopeDepartmentCode was not found as active data during apply.",
      });
    }

    const role = row.parsed.roleCode ? roleByCode.get(row.parsed.roleCode) : null;
    if (!isActiveApplyRole(role)) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "roleCode",
        code: "UNKNOWN_ROLE",
        message: "roleCode was not found as active data during apply.",
      });
    } else if (role.code === RoleCode.systemAdmin) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "roleCode",
        code: "ROLE_NOT_IMPORTABLE",
        message: "SYSTEM_ADMIN role assignment is not supported by import apply.",
      });
    }

    if (row.parsed.email && existingEmailSet.has(row.parsed.email)) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "email",
        code: "EXISTING_USER",
        message: "email already belongs to an existing user.",
      });
    }

    if (
      row.resolved.employeeNoNormalized &&
      existingEmployeeNoSet.has(row.resolved.employeeNoNormalized)
    ) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "employeeNo",
        code: "EXISTING_EMPLOYEE_NO",
        message: "employeeNo already belongs to an existing user.",
      });
    }

    if (row.parsed.scopeType !== ScopeType.department) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "scopeType",
        code: "INVALID_SCOPE",
        message: "Apply supports only DEPARTMENT role scope.",
      });
    }

    if (row.parsed.status !== UserStatus.PENDING_ACTIVATION) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "status",
        code: "UNSUPPORTED_STATUS",
        message: "Apply supports only PENDING_ACTIVATION users.",
      });
    }
  }

  return errors;
};

const isActiveApplyDepartment = (
  department: UserAccountImportApplyDepartmentLookup | null | undefined,
): department is UserAccountImportApplyDepartmentLookup =>
  Boolean(
    department &&
      department.status === DepartmentStatus.ACTIVE &&
      !department.archivedAt,
  );

const isActiveApplyRole = (
  role: UserAccountImportApplyRoleLookup | null | undefined,
): role is UserAccountImportApplyRoleLookup =>
  Boolean(role && role.status === RoleStatus.ACTIVE && !role.archivedAt);

const assertCreatedUserIsNoCredentialPending = (
  user: UserAccountImportCreatedUser,
): void => {
  if (
    user.status !== UserStatus.PENDING_ACTIVATION ||
    user.credential !== null ||
    user.sessions.length !== 0 ||
    user.userRoles.some((role) => role.scopeType !== ScopeType.department)
  ) {
    throw new Error("User account import created a record outside the no-credential pending boundary.");
  }
};

const toUserAccountImportCreateAuditEvent = (
  context: UserContext,
  user: UserAccountImportCreatedUser,
  row: UserAccountImportResolvedPlanRow,
  plan: UserAccountImportPlan,
): CreateAuditEventInput => ({
  actor: {
    userId: context.userId,
    departmentId: context.departmentId,
  },
  action: AuditActionCode.create,
  target: {
    type: AuditTargetTypeCode.user,
    id: user.id,
    departmentId: user.departmentId,
  },
  oldValue: null,
  newValue: {
    operation: "USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL",
    importType: userAccountImportType,
    mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
    rowNumber: row.rowNumber,
    targetUserId: user.id,
    emailMasked: maskEmail(user.email),
    departmentId: user.departmentId,
    roleCodes: user.userRoles.map((userRole) => userRole.role.code),
    scopeType: ScopeType.department,
    scopeDepartmentId: row.resolved.scopeDepartmentId,
    credentialMode: "NO_CREDENTIAL",
    status: UserStatus.PENDING_ACTIVATION,
    totalRows: plan.summary.totalRows,
    createdUsersCount: plan.summary.createCandidates,
    createdRolesCount: plan.summary.createCandidates,
  },
});

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
        employeeNoNormalized: normalizeEmployeeNoNormalized(valuesByHeader.get("employeeNo")),
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
    if (row.resolved.employeeNoNormalized) {
      employeeNoCounts.set(
        row.resolved.employeeNoNormalized,
        (employeeNoCounts.get(row.resolved.employeeNoNormalized) ?? 0) + 1,
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

    if (
      row.resolved.employeeNoNormalized &&
      (employeeNoCounts.get(row.resolved.employeeNoNormalized) ?? 0) > 1
    ) {
      row.errors.push({
        field: "employeeNo",
        code: "DUPLICATE_IN_FILE",
        message: "employeeNo is duplicated in this file.",
      });
    }
  }
};

const applyExistingEmployeeNoErrors = (
  rows: WorkingRow[],
  userByEmployeeNo: ReadonlyMap<string, UserAccountImportEmployeeNoLookup>,
): void => {
  for (const row of rows) {
    if (
      row.resolved.employeeNoNormalized &&
      isValidEmployeeNo(row.parsed.employeeNo) &&
      userByEmployeeNo.has(row.resolved.employeeNoNormalized)
    ) {
      row.errors.push({
        field: "employeeNo",
        code: "EXISTING_EMPLOYEE_NO",
        message: "employeeNo already belongs to an existing user.",
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
  existingEmployeeNoRows: rows.filter((row) =>
    row.errors.some((error) => error.code === "EXISTING_EMPLOYEE_NO"),
  ).length,
  existingRoleAssignmentRows: rows.filter((row) =>
    row.warnings.some((warning) => warning.code === "EXISTING_ROLE_ASSIGNMENT"),
  ).length,
  reactivationCandidateRows: rows.filter((row) =>
    row.warnings.some((warning) => warning.code === "REVOKED_ROLE_ASSIGNMENT"),
  ).length,
  employeeNoDbConflictCheck: "AVAILABLE" as const,
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

const collectEmployeeNoNormalized = (rows: readonly WorkingRow[]): string[] =>
  [
    ...new Set(
      rows
        .filter((row) => isValidEmployeeNo(row.parsed.employeeNo))
        .map((row) => row.resolved.employeeNoNormalized)
        .filter((employeeNo): employeeNo is string => Boolean(employeeNo)),
    ),
  ];

const collectDepartmentCodesFromResolvedRows = (
  rows: readonly UserAccountImportResolvedPlanRow[],
): string[] => {
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

const collectRoleCodesFromResolvedRows = (
  rows: readonly UserAccountImportResolvedPlanRow[],
): string[] =>
  [...new Set(rows.map((row) => row.parsed.roleCode).filter((code): code is string => Boolean(code)))];

const collectEmailsFromResolvedRows = (
  rows: readonly UserAccountImportResolvedPlanRow[],
): string[] =>
  [...new Set(rows.map((row) => row.parsed.email).filter((email): email is string => Boolean(email)))];

const collectEmployeeNoNormalizedFromResolvedRows = (
  rows: readonly UserAccountImportResolvedPlanRow[],
): string[] =>
  [
    ...new Set(
      rows
        .map((row) => row.resolved.employeeNoNormalized)
        .filter((employeeNo): employeeNo is string => Boolean(employeeNo)),
    ),
  ];

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

const normalizeEmployeeNoNormalized = (value: string | undefined): string | null => {
  const normalized = normalizeCell(value);
  return normalized ? normalized.toUpperCase() : null;
};

const isValidDepartmentCode = (code: string): boolean =>
  code.length <= 64 && departmentCodePattern.test(code);

const isValidRoleCode = (code: string): boolean =>
  code.length <= 64 && roleCodePattern.test(code);

const isValidEmployeeNo = (employeeNo: string | null): employeeNo is string =>
  Boolean(employeeNo && employeeNo.length <= 64 && employeeNoPattern.test(employeeNo));

const isSensitiveColumn = (header: string): boolean =>
  sensitiveColumns.has(normalizeImportHeaderToken(header));

const sanitizeHeaderForOutput = (header: string): string =>
  isSensitiveColumn(header) ? "(sensitive)" : header;

const maskEmail = (email: string): string => {
  const [localPart, domainPart] = email.split("@");
  if (!localPart || !domainPart) {
    return "[masked-email]";
  }

  return `${localPart.slice(0, 1)}***@${domainPart}`;
};
