export type DashboardBucket = {
  key: string;
  count: number;
};

export type DashboardMetric<Value> = {
  key: string;
  section: string;
  value: Value;
};

export type DashboardDistribution = {
  buckets: DashboardBucket[];
};

export type DashboardSummary = {
  generatedAt: string;
  scope: {
    userId: string;
    departmentId: string;
  };
  achievement: {
    total: DashboardMetric<{ count: number }>;
    byType: DashboardMetric<DashboardDistribution>;
    byStatus: DashboardMetric<DashboardDistribution>;
  };
  fee: {
    byPayStatus: DashboardMetric<DashboardDistribution>;
    deadline: DashboardMetric<{
      overdue: DashboardBucket;
      dueSoon: DashboardBucket;
    }>;
  };
  workflowTasks: {
    byStatus: DashboardMetric<DashboardDistribution>;
  };
  reminderTasks: {
    byStatus: DashboardMetric<DashboardDistribution>;
  };
};

export type WorkflowTaskStatusCode =
  | "PENDING"
  | "CLAIMED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type WorkflowInstanceStatusCode = "ACTIVE" | "COMPLETED" | "CANCELLED";

export type WorkflowTargetTypeCode = "ACHIEVEMENT";

export type WorkflowStepCode = "DEPARTMENT_REVIEW" | "ARCHIVE";

export type WorkflowActionKind = "approve" | "reject";

export type WorkflowTaskInstance = {
  targetType: WorkflowTargetTypeCode | string;
  targetId: string;
  status: WorkflowInstanceStatusCode | string;
  currentStep?: WorkflowStepCode | string | null;
};

export type WorkflowTask = {
  id: string;
  instanceId: string;
  assigneeId: string;
  stepCode: WorkflowStepCode | string;
  status: WorkflowTaskStatusCode | string;
  createdAt: string;
  updatedAt: string;
  claimedAt?: string | null;
  completedAt?: string | null;
  instance?: WorkflowTaskInstance;
};

export type WorkflowTaskListResult = {
  items: WorkflowTask[];
  total?: number;
};

export type WorkflowTaskQuery = {
  status?: WorkflowTaskStatusCode;
  achievementId?: string;
};

export type ApproveWorkflowTaskPayload = {
  comment?: string;
};

export type RejectWorkflowTaskPayload = {
  comment: string;
};

export type WorkflowTaskActionResult = {
  task: WorkflowTask;
  achievement?: {
    id: string;
    status: string;
    updatedAt?: string;
  };
};

export type AchievementTypeCode = "PAPER" | "PATENT" | "SOFTWARE_COPYRIGHT";

export type AchievementStatusCode =
  | "DRAFT"
  | "PENDING_DEPARTMENT_REVIEW"
  | "DEPARTMENT_REJECTED"
  | "PENDING_ARCHIVE"
  | "ARCHIVED"
  | "VOIDED";

export type SecretLevelCode = "PUBLIC" | "INTERNAL" | "SECRET" | "CONFIDENTIAL";

export type ContributorTypeCode = "AUTHOR" | "INVENTOR" | "COPYRIGHT_OWNER";

export type ContributorRoleCode =
  | "FIRST_AUTHOR"
  | "CORRESPONDING_AUTHOR"
  | "PRIMARY_INVENTOR"
  | "PARTICIPANT"
  | "OWNER"
  | "OTHER";

export type PatentTypeCode =
  | "INVENTION"
  | "UTILITY_MODEL"
  | "DESIGN"
  | "NATIONAL_DEFENSE"
  | "OTHER";

export type PatentLegalStatusCode =
  | "PENDING"
  | "GRANTED"
  | "REJECTED"
  | "EXPIRED"
  | "TERMINATED"
  | "TRANSFERRED"
  | "UNKNOWN";

export type SoftwareTypeCode = "APPLICATION" | "SYSTEM" | "TOOL" | "EMBEDDED" | "OTHER";

export type AchievementContributor = {
  id?: string;
  name: string;
  userId?: string | null;
  organization?: string | null;
  contributorType: ContributorTypeCode;
  contributorRole?: ContributorRoleCode | null;
  sortOrder: number;
};

export type PaperDetail = {
  doi?: string | null;
  journal?: string | null;
  issnCn?: string | null;
  publishYear?: number | null;
  includedType?: string | null;
  impactFactor?: number | string | null;
  partition?: string | null;
  abstract?: string | null;
};

export type PatentDetail = {
  applicationNo?: string | null;
  grantNo?: string | null;
  patentType?: PatentTypeCode | null;
  filingDate?: string | null;
  grantDate?: string | null;
  nextFeeDate?: string | null;
  feeAmount?: number | string | null;
  legalStatus?: PatentLegalStatusCode | null;
};

export type SoftwareCopyrightDetail = {
  registrationNo?: string | null;
  softwareVersion?: string | null;
  softwareType?: SoftwareTypeCode | null;
  publishDate?: string | null;
  registerDate?: string | null;
  runEnv?: string | null;
};

export type AchievementListItem = {
  id: string;
  type: AchievementTypeCode;
  status: AchievementStatusCode;
  secretLevel: SecretLevelCode;
  departmentId: string;
  ownerUserId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  archivedAt: string | null;
  voidedAt: string | null;
  isRestricted: boolean;
  isRedacted: boolean;
};

export type AchievementListResult = {
  items: AchievementListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type AchievementListQuery = {
  status?: AchievementStatusCode;
  type?: AchievementTypeCode;
  keyword?: string;
  page: number;
  pageSize: number;
};

export type AchievementDetail = AchievementListItem & {
  submittedById?: string | null;
  updatedById?: string | null;
  archivedById?: string | null;
  voidedById?: string | null;
  version?: number;
  createdById?: string;
  paperDetail?: PaperDetail | null;
  patentDetail?: PatentDetail | null;
  softwareCopyrightDetail?: SoftwareCopyrightDetail | null;
  contributors: AchievementContributor[];
};

export type AttachmentStatusCode = "ACTIVE" | "ARCHIVED" | "BLOCKED";

export type AttachmentRelationTypeCode = "ACHIEVEMENT" | "FEE_RECORD" | "WORKFLOW_ACTION";

export type AttachmentMetadata = {
  id: string;
  relationType: AttachmentRelationTypeCode | string;
  relationId: string;
  fileName: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  storageProvider?: string | null;
  originalName?: string | null;
  storedName?: string | null;
  version: number;
  uploaderId: string;
  secretLevel: SecretLevelCode | string;
  status: AttachmentStatusCode | string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type AttachmentDetailMetadata = AttachmentMetadata;

export type AttachmentListQuery = {
  status?: AttachmentStatusCode;
  take?: number;
};

export type UploadAchievementAttachmentInput = {
  file: File;
  secretLevel?: SecretLevelCode;
  displayName?: string;
};

export type FeeTypeCode =
  | "PATENT_APPLICATION"
  | "PATENT_ANNUAL"
  | "SOFTWARE_COPYRIGHT"
  | "AGENCY"
  | "OTHER";

export type FundSourceCode = "PROJECT" | "DEPARTMENT" | "INSTITUTE" | "OTHER";

export type PayStatusCode = "PENDING" | "PAID" | "OVERDUE" | "WAIVED" | "CANCELLED";

export type FeeRecord = {
  id: string;
  achievementId: string;
  departmentId: string;
  feeType: FeeTypeCode;
  fundSource: FundSourceCode | null;
  amount: number | string;
  dueDate: string;
  paidDate: string | null;
  payStatus: PayStatusCode;
  voucherNo: string | null;
  createdById: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type FeeQuery = {
  achievementId?: string;
  feeType?: FeeTypeCode;
  payStatus?: PayStatusCode;
  take?: number;
};

export type CreateFeeRecordInput = {
  achievementId: string;
  feeType: FeeTypeCode;
  fundSource?: FundSourceCode;
  amount: number;
  dueDate: string;
  voucherNo?: string | null;
};

export type MarkFeePaidInput = {
  paidDate?: string;
  voucherNo?: string | null;
};

export type ChangeFeeStatusInput = {
  reason: string;
};

export type FeeStateRecord = Pick<
  FeeRecord,
  | "id"
  | "achievementId"
  | "departmentId"
  | "feeType"
  | "dueDate"
  | "paidDate"
  | "payStatus"
  | "voucherNo"
  | "updatedById"
  | "archivedAt"
>;

export type SearchTargetTypeCode = "ACHIEVEMENT" | "FEE_RECORD";

export type SearchQuery = {
  keyword?: string;
  targetTypes?: readonly SearchTargetTypeCode[];
  achievementType?: AchievementTypeCode;
  achievementStatus?: AchievementStatusCode;
  feeType?: FeeTypeCode;
  payStatus?: PayStatusCode;
  departmentId?: string;
  take?: number;
};

export type SearchAchievementIdentifiers = {
  doi?: string;
  patentApplicationNo?: string;
  patentGrantNo?: string;
  softwareRegistrationNo?: string;
};

export type SearchAchievementResultItem = {
  targetType: "ACHIEVEMENT";
  id: string;
  type: AchievementTypeCode;
  status: AchievementStatusCode;
  departmentId: string;
  secretLevel: SecretLevelCode;
  title: string | null;
  identifiers: SearchAchievementIdentifiers;
  redacted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SearchFeeResultItem = {
  targetType: "FEE_RECORD";
  id: string;
  achievementId: string;
  departmentId: string;
  feeType: FeeTypeCode;
  payStatus: PayStatusCode;
  dueDate: string;
  paidDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SearchResultItem = SearchAchievementResultItem | SearchFeeResultItem;

export type SearchResult = {
  items: SearchResultItem[];
  total: number;
};

export type AuditActionCode =
  | "CREATE"
  | "UPDATE"
  | "SUBMIT"
  | "APPROVE"
  | "REJECT"
  | "ARCHIVE"
  | "VOID"
  | "UPLOAD_ATTACHMENT"
  | "DOWNLOAD_ATTACHMENT"
  | "MARK_FEE_PAID"
  | "WAIVE_FEE"
  | "CANCEL_FEE"
  | "CONFIRM_REMINDER"
  | "CONFIG_UPDATE";

export type AuditTargetTypeCode =
  | "ACHIEVEMENT"
  | "WORKFLOW_INSTANCE"
  | "WORKFLOW_TASK"
  | "WORKFLOW_ACTION"
  | "ATTACHMENT"
  | "FEE_RECORD"
  | "REMINDER_TASK"
  | "NOTIFICATION"
  | "SYSTEM_CONFIG"
  | "AUDIT_LOG";

export type MaskedAuditLog = {
  id: string;
  actorUserId?: string | null;
  actorDepartmentId?: string | null;
  action: AuditActionCode | string;
  targetType: AuditTargetTypeCode | string;
  targetId?: string | null;
  targetDepartmentId?: string | null;
  targetSecretLevel?: SecretLevelCode | string | null;
  traceId?: string | null;
  createdAt: string;
  oldValueMasked?: unknown;
  newValueMasked?: unknown;
  ipAddressMasked?: string;
  userAgentMasked?: string;
};

export type AuditLogListResult = {
  items: MaskedAuditLog[];
};

export type AuditLogQuery = {
  actorUserId?: string;
  action?: AuditActionCode;
  targetType?: AuditTargetTypeCode;
  targetId?: string;
  traceId?: string;
  take?: number;
};

export type DepartmentStatus = "ACTIVE" | "ARCHIVED";

export type DepartmentSummary = {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  status: DepartmentStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type DepartmentDetail = DepartmentSummary;

export type DepartmentTreeNode = DepartmentSummary & {
  children: DepartmentTreeNode[];
};

export type DepartmentImpactSummary = {
  activeUsersCount: number;
  activeUserRoleScopesCount: number;
  pendingWorkflowTasksCount: number;
  activeOrUnarchivedAchievementsCount: number;
  feeRecordsCount: number;
};

export type DepartmentListResponse = {
  items: DepartmentSummary[];
  total: number;
  page: number;
  pageSize: number;
};

export type DepartmentTreeResponse = {
  items: DepartmentTreeNode[];
};

export type ListDepartmentsQuery = {
  keyword?: string;
  status?: DepartmentStatus;
  parentId?: string;
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
};

export type CreateDepartmentInput = {
  code: string;
  name: string;
  parentId?: string | null;
};

export type UpdateDepartmentInput = {
  code?: string;
  name?: string;
  parentId?: string | null;
};

export type DepartmentReasonInput = {
  reason?: string | null;
};

export type DisableDepartmentResponse = {
  department: DepartmentDetail;
  impactSummary: DepartmentImpactSummary;
};

export type DepartmentImportDryRunIssueCode =
  | "REQUIRED"
  | "INVALID_FORMAT"
  | "DUPLICATE_IN_FILE"
  | "UNKNOWN_PARENT"
  | "PARENT_CYCLE"
  | "EXISTING_CODE"
  | "UNKNOWN_COLUMN"
  | "FORMULA_LIKE_VALUE";

export type DepartmentImportDryRunIssue = {
  field: string;
  code: DepartmentImportDryRunIssueCode;
  message: string;
};

export type DepartmentImportDryRunRowStatus = "VALID" | "WARNING" | "ERROR";

export type DepartmentImportDryRunCandidateAction =
  | "CREATE"
  | "REVIEW_EXISTING"
  | "SKIP";

export type DepartmentImportDryRunRow = {
  rowNumber: number;
  parsed: {
    code: string | null;
    name: string | null;
    parentCode: string | null;
  };
  status: DepartmentImportDryRunRowStatus;
  candidateAction: DepartmentImportDryRunCandidateAction;
  errors: DepartmentImportDryRunIssue[];
  warnings: DepartmentImportDryRunIssue[];
};

export type DepartmentImportDryRunResult = {
  importType: "DEPARTMENT_METADATA";
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
    createCandidates: number;
    existingCodeRows: number;
  };
  rows: DepartmentImportDryRunRow[];
};

export type DepartmentImportDryRunInput = {
  file: File;
};

export type AccountUserStatus = "ACTIVE" | "DISABLED" | "ARCHIVED" | "PENDING_ACTIVATION";

export type AccountCredentialStatus = "ACTIVE" | "DISABLED";

export type AccountRoleStatus = "ACTIVE" | "ARCHIVED";

export type AccountRoleScopeType = "GLOBAL" | "DEPARTMENT";

export type AccountCredentialMode = "INITIAL_PASSWORD" | "NO_CREDENTIAL";

export type AccountRoleCode =
  | "RESEARCHER"
  | "RESEARCH_SECRETARY"
  | "DEPARTMENT_ADMIN"
  | "SYSTEM_ADMIN"
  | "AUDITOR"
  | "LEADER"
  | "SECRET_MANAGER";

export type AccountUserDepartmentSummary = {
  id: string;
  code: string;
  name: string;
  status: string;
};

export type AccountRoleSummary = {
  id: string;
  code: AccountRoleCode | string;
  name: string;
  status: AccountRoleStatus | string;
};

export type AccountUserRoleSummary = {
  id: string;
  role: AccountRoleSummary;
  scopeType: AccountRoleScopeType;
  scopeKey: string;
  departmentId: string | null;
  createdAt: string;
};

export type AccountUserCredentialSummary = {
  status: AccountCredentialStatus;
  passwordUpdatedAt: string | null;
  mustChangePassword?: boolean;
  disabledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AccountUserLastLoginSummary = {
  sessionId: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  lastSeenAt: string | null;
};

export type AccountUserSummary = {
  id: string;
  email: string;
  name: string;
  status: AccountUserStatus;
  department: AccountUserDepartmentSummary;
  roles: AccountUserRoleSummary[];
  credential: AccountUserCredentialSummary | null;
  lastLogin: AccountUserLastLoginSummary | null;
  createdAt: string;
  updatedAt: string;
};

export type AccountUserDetail = AccountUserSummary;

export type AccountUserListResponse = {
  items: AccountUserSummary[];
  total: number;
  page: number;
  pageSize: number;
};

export type ListAccountUsersQuery = {
  keyword?: string;
  status?: AccountUserStatus;
  departmentId?: string;
  roleCode?: AccountRoleCode;
  page?: number;
  pageSize?: number;
};

export type CreateAccountUserRoleInput = {
  roleCode: AccountRoleCode;
  scopeType: AccountRoleScopeType;
  departmentId?: string;
};

export type CreateAccountUserInput = {
  email: string;
  name: string;
  departmentId: string;
  roles: CreateAccountUserRoleInput[];
  initialPassword?: string;
};

export type AccountLifecycleRoleInput = CreateAccountUserRoleInput;

export type CreateInviteInput = {
  email: string;
  name: string;
  departmentId: string;
  roles: AccountLifecycleRoleInput[];
  reason?: string | null;
};

export type AccountLifecycleDeliveryStatus =
  | "PENDING"
  | "QUEUED"
  | "SENT"
  | "FAILED"
  | "SUPPRESSED";

export type InviteIssueResponse = {
  userId: string;
  deliveryStatus: AccountLifecycleDeliveryStatus;
};

export type PasswordResetIssueResponse = {
  userId: string;
  deliveryStatus: AccountLifecycleDeliveryStatus;
};

export type PasswordResetRevokeResponse = {
  revokedTokenCount: number;
};

export type PasswordResetRequestInput = {
  email: string;
};

export type PasswordResetRequestResponse = {
  accepted: true;
};

export type PasswordResetConfirmInput = {
  token: string;
  newPassword: string;
};

export type PasswordResetConfirmResponse = {
  reset: true;
};

export type InviteAcceptInput = {
  token: string;
  password: string;
};

export type InviteAcceptResponse = {
  accepted: true;
};

export type DisableAccountUserInput = {
  reason?: string | null;
};

export type EnableAccountUserInput = {
  reason?: string | null;
};

export type AssignAccountUserRoleInput = {
  roleCode: AccountRoleCode;
  scopeType: AccountRoleScopeType;
  departmentId?: string;
  reason?: string | null;
};

export type RevokeAccountUserRoleInput = {
  reason?: string | null;
};

export type ChangeAccountUserDepartmentInput = {
  departmentId: string;
  reason?: string | null;
};

export type DisableAccountUserResponse = {
  user: AccountUserDetail;
  revokedSessionCount: number;
};

export type AssignAccountUserRoleResponse = {
  user: AccountUserDetail;
  userRoleId: string;
};

export type ApiIntegrationProvider =
  | "DOI"
  | "EMAIL"
  | "HR"
  | "FINANCE"
  | "PATENT"
  | "STORAGE"
  | "SEARCH"
  | "OTHER";

export type ApiIntegrationMetadata = {
  id: string;
  code: string;
  provider: ApiIntegrationProvider;
  enabled: boolean;
  timeoutMs: number;
  configRef: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type ApiIntegrationListResponse = {
  items: ApiIntegrationMetadata[];
  total: number;
  page: number;
  pageSize: number;
};

export type ListApiIntegrationsQuery = {
  keyword?: string;
  provider?: ApiIntegrationProvider;
  enabled?: boolean;
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
};

export type CreateApiIntegrationInput = {
  code: string;
  provider: ApiIntegrationProvider;
  enabled?: boolean;
  timeoutMs?: number;
  configRef?: string | null;
};

export type UpdateApiIntegrationInput = {
  code?: string;
  provider?: ApiIntegrationProvider;
  enabled?: boolean;
  timeoutMs?: number;
  configRef?: string | null;
};

export type ApiIntegrationReasonInput = {
  reason?: string | null;
};
