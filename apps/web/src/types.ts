export type DashboardBucket = {
  key: string;
  count: number;
};

export type DashboardDepartmentRankBucket = {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  count: number;
};

export type DashboardIntegrationCallBucket = {
  integrationCode: string;
  provider: string;
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
    departmentRanking: DashboardMetric<{
      buckets: DashboardDepartmentRankBucket[];
    }>;
  };
  conversion: {
    total: DashboardMetric<{ count: number }>;
    totals: DashboardMetric<{
      contractTotal: string;
      revenueTotal: string;
    }>;
    funnel: DashboardMetric<DashboardDistribution>;
    byContractStatus: DashboardMetric<DashboardDistribution>;
    byRevenueStatus: DashboardMetric<DashboardDistribution>;
    localRisk: DashboardMetric<{
      overdue: DashboardBucket;
    }>;
    byEvaluationEffect: DashboardMetric<DashboardDistribution>;
  };
  fee: {
    byPayStatus: DashboardMetric<DashboardDistribution>;
    deadline: DashboardMetric<{
      overdue: DashboardBucket;
      dueSoon: DashboardBucket;
    }>;
    risk: DashboardMetric<{
      overdue: DashboardBucket;
      dueSoon: DashboardBucket;
      pending: DashboardBucket;
      paid: DashboardBucket;
    }>;
  };
  workflowTasks: {
    byStatus: DashboardMetric<DashboardDistribution>;
    efficiency: DashboardMetric<{
      total: DashboardBucket;
      pending: DashboardBucket;
      approved: DashboardBucket;
      rejected: DashboardBucket;
      cancelled: DashboardBucket;
    }>;
  };
  reminderTasks: {
    byStatus: DashboardMetric<DashboardDistribution>;
  };
  integrationMock: {
    recentCalls: DashboardMetric<{
      count: number;
      windowDays: number;
    }>;
    byStatus: DashboardMetric<DashboardDistribution>;
    byIntegration: DashboardMetric<{
      buckets: DashboardIntegrationCallBucket[];
    }>;
  };
};

export type CustomReportTemplateId =
  | "achievement-distribution"
  | "achievement-trend"
  | "fee-risk-summary"
  | "workflow-efficiency"
  | "conversion-funnel";

export type CustomReportTemplate = {
  templateId: CustomReportTemplateId;
  name: string;
  description: string;
};

export type CustomReportColumnType = "text" | "number" | "money" | "date";

export type CustomReportColumn = {
  key: string;
  label: string;
  type: CustomReportColumnType;
};

export type CustomReportRowValue = string | number | null;

export type CustomReportRow = Record<string, CustomReportRowValue>;

export type CustomReportTotals = Record<string, CustomReportRowValue>;

export type CustomReportGroupBy = "year" | "month";

export type CustomReportRunQuery = {
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string;
  achievementType?: AchievementTypeCode;
  status?: string;
  groupBy?: CustomReportGroupBy;
  dueSoonDays?: number;
};

export type CustomReportScopeSummary = {
  userId: string;
  departmentId: string;
  departmentScope: {
    departmentIds: string[];
  };
  policy: "achievement-readable" | "fee-readable" | "current-assignee";
};

export type CustomReportRunResponse = {
  metadata: {
    templateId: CustomReportTemplateId;
    name: string;
    description: string;
    generatedAt: string;
    localDemoOnly: true;
    notProductionMonitoring: true;
  };
  filters: CustomReportRunQuery;
  scopeSummary: CustomReportScopeSummary;
  columns: CustomReportColumn[];
  rows: CustomReportRow[];
  totals: CustomReportTotals;
  caveats: string[];
};

export type WorkflowTaskStatusCode =
  | "PENDING"
  | "CLAIMED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type WorkflowInstanceStatusCode = "ACTIVE" | "COMPLETED" | "CANCELLED";

export type WorkflowTargetTypeCode = "ACHIEVEMENT" | "FEE_RECORD";

export type WorkflowStepCode = "DEPARTMENT_REVIEW" | "FEE_REVIEW" | "ARCHIVE";

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
  targetType?: WorkflowTargetTypeCode;
  achievementId?: string;
  feeRecordId?: string;
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

export type AchievementConversionTypeCode =
  | "LICENSE"
  | "TRANSFER"
  | "COOPERATION"
  | "INDUSTRIALIZATION"
  | "OTHER";

export type AchievementConversionStatusCode =
  | "LEAD_INTENT"
  | "CONTRACTING"
  | "SIGNED"
  | "PAID"
  | "COMPLETED"
  | "CANCELLED";

export type AchievementConversionContractStatusCode =
  | "DRAFT"
  | "SIGNED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED";

export type AchievementConversionRevenueStatusCode =
  | "UNPAID"
  | "PARTIAL"
  | "PAID"
  | "OVERDUE"
  | "WAIVED";

export type AchievementConversionEvaluationEffectCode =
  | "NOT_EVALUATED"
  | "POSITIVE"
  | "NEUTRAL"
  | "NEGATIVE"
  | "MIXED";

export type AchievementConversionBenefitCategoryCode =
  | "UNIT"
  | "TEAM"
  | "PERSON"
  | "PLATFORM"
  | "OTHER";

export type AchievementConversionBenefitDistributionItem = {
  category: AchievementConversionBenefitCategoryCode;
  label: string;
  amount?: number | null;
  ratio?: number | null;
  note?: string | null;
};

export type AchievementConversionBenefitDistributionJson =
  AchievementConversionBenefitDistributionItem[];

export type AchievementConversionRecord = {
  id: string;
  achievementId: string;
  departmentId: string;
  conversionType: AchievementConversionTypeCode;
  counterpartyName: string;
  contractAmount: string | null;
  revenueAmount: string | null;
  status: AchievementConversionStatusCode;
  conversionDate: string | null;
  contractStatus: AchievementConversionContractStatusCode;
  revenueStatus: AchievementConversionRevenueStatusCode;
  revenueDueDate: string | null;
  revenueReceivedDate: string | null;
  benefitDistributionJson: AchievementConversionBenefitDistributionJson | null;
  evaluationEffect: AchievementConversionEvaluationEffectCode;
  evaluationSummary: string | null;
  evaluationDate: string | null;
  benefitDistributionSummary: string | null;
  remarks: string | null;
  createdById: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
  achievement: {
    id: string;
    status: AchievementStatusCode | string;
  };
};

export type CreateAchievementConversionInput = {
  conversionType: AchievementConversionTypeCode;
  counterpartyName: string;
  contractAmount?: number | null;
  revenueAmount?: number | null;
  status: AchievementConversionStatusCode;
  conversionDate?: string | null;
  contractStatus?: AchievementConversionContractStatusCode;
  revenueStatus?: AchievementConversionRevenueStatusCode;
  revenueDueDate?: string | null;
  revenueReceivedDate?: string | null;
  benefitDistributionJson?: AchievementConversionBenefitDistributionJson | null;
  evaluationEffect?: AchievementConversionEvaluationEffectCode;
  evaluationSummary?: string | null;
  evaluationDate?: string | null;
  benefitDistributionSummary?: string | null;
  remarks?: string | null;
};

export type UpdateAchievementConversionInput = Partial<CreateAchievementConversionInput>;

export type UploadAchievementAttachmentInput = {
  file: File;
  secretLevel?: SecretLevelCode;
  displayName?: string;
};

export type UploadFeeVoucherAttachmentInput = UploadAchievementAttachmentInput;

export type FeeTypeCode =
  | "PATENT_APPLICATION"
  | "PATENT_ANNUAL"
  | "SOFTWARE_COPYRIGHT"
  | "AGENCY"
  | "OTHER";

export type FundSourceCode = "PROJECT" | "DEPARTMENT" | "INSTITUTE" | "OTHER";

export type PayStatusCode = "PENDING" | "PAID" | "OVERDUE" | "WAIVED" | "CANCELLED";

export type FeeReviewStatusCode = "PENDING" | "APPROVED" | "REJECTED";

export type FeeReviewHistoryActionCode = "APPROVE" | "REJECT";

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
  reviewStatus: FeeReviewStatusCode;
  reviewedById: string | null;
  reviewedAt: string | null;
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

export type ApproveFeeReviewInput = {
  reason?: string | null;
};

export type RejectFeeReviewInput = {
  reason: string;
};

export type FeeReviewHistoryEntry = {
  id: string;
  feeRecordId: string;
  departmentId: string;
  reviewerId: string;
  action: FeeReviewHistoryActionCode;
  fromStatus: FeeReviewStatusCode;
  toStatus: FeeReviewStatusCode;
  reason: string | null;
  createdAt: string;
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
  | "reviewStatus"
  | "reviewedById"
  | "reviewedAt"
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

export type DepartmentImportApplyMode = "CREATE_ONLY";

export type DepartmentImportApplyInput = {
  file: File;
  mode: DepartmentImportApplyMode;
};

export type DepartmentImportApplyErrorSummary = {
  rowNumber: number | null;
  field: string;
  code: string;
  message: string;
};

export type DepartmentImportApplyRow = {
  rowNumber: number;
  code: string;
  status: "CREATED";
  createdDepartmentId: string;
};

export type DepartmentImportApplyResult = {
  importType: "DEPARTMENT_METADATA";
  dryRun: false;
  mode: DepartmentImportApplyMode;
  file: DepartmentImportDryRunResult["file"];
  summary: {
    totalRows: number;
    createdRows: number;
    skippedRows: number;
    failedRows: number;
    errorCount: number;
    warningCount: number;
  };
  errors: DepartmentImportApplyErrorSummary[];
  rows: DepartmentImportApplyRow[];
};

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

export type UserAccountImportDryRunIssue = {
  field: string;
  code: UserAccountImportDryRunIssueCode;
  message: string;
};

export type UserAccountImportDryRunRowStatus = "VALID" | "WARNING" | "ERROR";

export type UserAccountImportDryRunCandidateAction =
  | "CREATE_PENDING_USER"
  | "REVIEW_EXISTING_USER"
  | "REACTIVATE_ROLE_REVIEW"
  | "SKIP";

export type UserAccountImportDryRunRow = {
  rowNumber: number;
  parsed: {
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
  status: UserAccountImportDryRunRowStatus;
  candidateAction: UserAccountImportDryRunCandidateAction;
  errors: UserAccountImportDryRunIssue[];
  warnings: UserAccountImportDryRunIssue[];
};

export type UserAccountImportDryRunResult = {
  importType: "USER_ACCOUNT";
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
    existingUserRows: number;
    existingEmployeeNoRows: number;
    existingRoleAssignmentRows: number;
    reactivationCandidateRows: number;
    employeeNoDbConflictCheck: "NOT_AVAILABLE" | "AVAILABLE";
  };
  rows: UserAccountImportDryRunRow[];
};

export type UserAccountImportDryRunInput = {
  file: File;
};

export type UserAccountImportApplyMode = "CREATE_ONLY_PENDING_NO_CREDENTIAL";

export type UserAccountImportApplyInput = {
  file: File;
  mode: UserAccountImportApplyMode;
};

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

export type UserAccountImportApplyResult = {
  importType: "USER_ACCOUNT";
  dryRun: false;
  mode: UserAccountImportApplyMode;
  file: UserAccountImportDryRunResult["file"];
  summary: {
    totalRows: number;
    createdUsersCount: number;
    createdRolesCount: number;
    skippedRows: number;
    failedRows: number;
    errorCount: number;
    warningCount: number;
    auditOperation: "USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL";
  };
  errors: UserAccountImportApplyErrorSummary[];
  rows: UserAccountImportApplyRow[];
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

export type AchievementImportDryRunIdentifiers = {
  doi: string | null;
  applicationNo: string | null;
  patentNo: string | null;
  registrationNo: string | null;
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
    identifiers: AchievementImportDryRunIdentifiers;
    normalizedIdentifiers: AchievementImportDryRunIdentifiers;
  };
  status: AchievementImportDryRunRowStatus;
  candidateAction: AchievementImportDryRunCandidateAction;
  errors: AchievementImportDryRunIssue[];
  warnings: AchievementImportDryRunIssue[];
};

export type AchievementImportDryRunResult = {
  importType: "ACHIEVEMENT";
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

export type AchievementImportDryRunInput = {
  file: File;
};

export type AchievementImportApplyMode = "CREATE_DRAFT_ONLY";

export type AchievementImportApplyInput = {
  file: File;
  mode: AchievementImportApplyMode;
};

export type AchievementImportApplyErrorSummary = {
  rowNumber: number | null;
  field: string;
  code: string;
  message: string;
};

export type AchievementImportApplyRow = {
  rowNumber: number;
  status: "CREATED";
  createdAchievementId: string;
  type: "PAPER" | "SOFTWARE_COPYRIGHT" | "PATENT";
  achievementStatus: "DRAFT";
  departmentId: string;
  ownerUserId: string;
  contributorCount: number;
  auditOperation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT";
};

export type AchievementImportApplyResult = {
  importType: "ACHIEVEMENT";
  dryRun: false;
  mode: AchievementImportApplyMode;
  file: AchievementImportDryRunResult["file"];
  summary: {
    totalRows: number;
    createdAchievementsCount: number;
    createdPaperDetailsCount: number;
    createdPatentDetailsCount: number;
    createdSoftwareCopyrightDetailsCount: number;
    createdContributorsCount: number;
    createdAuditEventsCount?: number;
    skippedRows: number;
    failedRows: number;
    errorCount: number;
    warningCount: number;
    auditOperation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT";
  };
  errors: AchievementImportApplyErrorSummary[];
  rows: AchievementImportApplyRow[];
};

export type ImportJobHistoryFamily = "DEPARTMENT" | "USER_ACCOUNT" | "ACHIEVEMENT";

export type ImportJobHistoryMode =
  | DepartmentImportApplyMode
  | UserAccountImportApplyMode
  | AchievementImportApplyMode;

export type ImportJobHistoryStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "REJECTED";

export type ImportRunHistoryStatus = ImportJobHistoryStatus;

export type ImportRunHistoryTrigger = "INITIAL" | "REPLAY" | string;

export type ImportRunHistorySummary = {
  attemptNo: number;
  trigger: ImportRunHistoryTrigger;
  status: ImportRunHistoryStatus | string;
  failureCode?: string | null;
  failureStage?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  completedBusinessTransactionAt?: string | null;
  validationSummary?: unknown;
  applySummary?: unknown;
  auditCount: number;
};

export type ImportJobHistoryListItem = {
  id: string;
  family: ImportJobHistoryFamily;
  mode: ImportJobHistoryMode | string;
  achievementType?: AchievementTypeCode | null;
  status: ImportJobHistoryStatus | string;
  acceptedRowCount: number;
  createdBusinessCount: number;
  createdCompanionCount: number;
  auditCount: number;
  safeErrorCodes: string[];
  createdAt: string;
  completedAt?: string | null;
  latestRun?: ImportRunHistorySummary | null;
};

export type ImportJobHistoryListResponse = {
  items: ImportJobHistoryListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type ImportJobHistoryDetail = ImportJobHistoryListItem & {
  safeSummary?: unknown;
  runs: ImportRunHistorySummary[];
};

export type ImportJobHistoryListQuery = {
  family?: ImportJobHistoryFamily;
  mode?: ImportJobHistoryMode | string;
  achievementType?: AchievementTypeCode;
  status?: ImportJobHistoryStatus;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  pageSize?: number;
};

export type ImportJobItemHistoryRow = {
  rowNumber: number;
  plannedAction: string;
  status: string;
  safeCode?: string | null;
  targetType: string;
};

export type ImportJobItemHistoryListResponse = {
  items: ImportJobItemHistoryRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type ImportJobItemHistoryListQuery = {
  status?: string;
  plannedAction?: string;
  targetType?: string;
  safeCode?: string;
  page?: number;
  pageSize?: number;
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
  | "FINANCE_REVIEWER"
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
  recentLifecycleDelivery: AccountLifecycleDeliverySummary | null;
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

export type AccountLifecycleTokenPurpose =
  | "INVITE_ACCEPT"
  | "PASSWORD_RESET_SELF"
  | "PASSWORD_RESET_ADMIN";

export type AccountLifecycleTokenStatus = "ACTIVE" | "USED" | "REVOKED";

export type AccountLifecycleDeliveryChannel = "EMAIL";

export type AccountLifecycleDeliveryFailureCategory =
  | "CONFIGURATION"
  | "PERMANENT"
  | "RATE_LIMITED"
  | "SUPPRESSED"
  | "TEMPORARY";

export type AccountLifecycleDeliverySummary = {
  purpose: AccountLifecycleTokenPurpose;
  tokenStatus: AccountLifecycleTokenStatus;
  deliveryChannel: AccountLifecycleDeliveryChannel | null;
  deliveryStatus: AccountLifecycleDeliveryStatus | null;
  deliveryAdapter: string | null;
  failureCategory: AccountLifecycleDeliveryFailureCategory | null;
  targetUserId: string | null;
  maskedEmail: string;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

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

export type ApiIntegrationMockScenario =
  | "DOI_LOOKUP"
  | "PATENT_STATUS_SYNC"
  | "FINANCE_RECONCILE"
  | "HR_SYNC";

export type ApiIntegrationMockResultMode = "SUCCESS" | "FAILURE" | "DEGRADED";

export type ApiIntegrationMockRunStatus =
  | "SUCCESS"
  | "FAILED"
  | "DEGRADED"
  | "UNAVAILABLE";

export type ApiIntegrationMockRunInput = {
  provider: ApiIntegrationProvider;
  scenario: ApiIntegrationMockScenario;
  resultMode: ApiIntegrationMockResultMode;
};

export type ApiIntegrationMockIntegrationSummary = {
  code: string;
  provider: ApiIntegrationProvider;
  enabled: boolean;
  archivedAt: string | null;
};

export type ApiCallLogSummary = {
  integrationCode: string;
  requestId: string;
  status: "SUCCESS" | "FAILED" | "TIMEOUT" | "RETRIED" | "SKIPPED" | string;
  durationMs: number | null;
  errorSummary: string | null;
  createdAt: string;
};

export type ApiIntegrationMockRunResponse = {
  mockOnly: true;
  provider: ApiIntegrationProvider;
  scenario: ApiIntegrationMockScenario;
  requestedResultMode: ApiIntegrationMockResultMode;
  runStatus: ApiIntegrationMockRunStatus;
  integration: ApiIntegrationMockIntegrationSummary | null;
  summary: string;
  syntheticSubject: string;
  safeResult: Record<string, unknown>;
  safetyNotice: string;
  callLog: ApiCallLogSummary | null;
};

export type ApiCallLogListResponse = {
  items: ApiCallLogSummary[];
};

export type ListApiCallLogsQuery = {
  limit?: number;
};
