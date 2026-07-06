import { Inject, Injectable } from "@nestjs/common";
import { DepartmentStatus } from "@prisma/client";
import { AuditTransactionClient } from "../audit/audit.repository";
import { AuditService } from "../audit/audit.service";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { CreateAuditEventInput } from "../audit/domain/audit-event.types";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { PermissionCode } from "../authorization/constants/permission-code";
import { ResourceTypeCode } from "../authorization/constants/resource-type-code";
import { SecretLevelCode as AuthorizationSecretLevelCode } from "../authorization/constants/secret-level-code";
import { allowDecision } from "../authorization/policy/policy-decision";
import { PolicyQueryFactory } from "../authorization/policy/policy-query.factory";
import { RbacPolicyService } from "../authorization/policy/rbac-policy.service";
import {
  SecretAccessPolicyService,
  isRestrictedSecretLevel,
} from "../authorization/policy/secret-access-policy.service";
import { PrismaService } from "../database/prisma.service";
import { UserContext } from "../identity/user-context";
import {
  ActiveWorkflowInstanceAlreadyExistsError,
  DepartmentReviewerNotFoundError,
  WorkflowDepartmentUnavailableError,
  WorkflowInstanceTransitionConflictError,
  WorkflowInvalidStateError,
} from "../workflow/domain/workflow-errors";
import { WorkflowTransactionClient } from "../workflow/workflow.repository";
import { WorkflowService } from "../workflow/workflow.service";
import { AchievementRepository } from "./achievement.repository";
import { AchievementTransactionClient } from "./achievement.repository";
import {
  AchievementStatusCode,
  AchievementTypeCode,
  SecretLevelCode,
} from "./domain/achievement-domain.types";
import { assertAchievementTransition } from "./domain/achievement-state-machine";
import {
  normalizeDoi,
  normalizePatentApplicationNo,
  normalizePatentGrantNo,
  normalizeSoftwareRegistrationNo,
} from "./domain/achievement-normalizer";
import {
  AchievementAccessDeniedError,
  AchievementConflictError,
  AchievementInvalidPayloadError,
  AchievementInvalidStateError,
  AchievementNotFoundError,
  AchievementPermissionDeniedError,
  AchievementUnsupportedOperationError,
} from "./domain/achievement-service.errors";
import { AchievementStatusTransitionConflictError } from "./domain/achievement-repository.errors";
import {
  AchievementAggregate,
  AchievementListItem,
  AchievementListRecord,
  AchievementListResult,
  AchievementResourceGrant,
  CreateAchievementContributorDraftInput,
  CreateAchievementDraftInput,
  CreatePaperDetailDraftInput,
  CreatePatentDetailDraftInput,
  CreateSoftwareCopyrightDetailDraftInput,
  AchievementStateRecord,
  AchievementStateResult,
  NormalizedAchievementConflictInput,
  UpdateAchievementDraftInput,
} from "./domain/achievement-repository.types";
import { VoidAchievementDto } from "./dto/achievement-action.dto";
import { AchievementListQueryDto } from "./dto/achievement-list-query.dto";
import { CreateAchievementDto } from "./dto/create-achievement.dto";
import { PaperDetailDto } from "./dto/paper-detail.dto";
import { PatentDetailDto } from "./dto/patent-detail.dto";
import { SoftwareCopyrightDetailDto } from "./dto/software-copyright-detail.dto";
import { UpdateAchievementDto } from "./dto/update-achievement.dto";

@Injectable()
export class AchievementService {
  constructor(
    @Inject(AchievementRepository)
    private readonly repository: AchievementRepository,
    @Inject(RbacPolicyService)
    private readonly rbacPolicy: RbacPolicyService,
    @Inject(PolicyQueryFactory)
    private readonly policyQueryFactory: PolicyQueryFactory,
    @Inject(SecretAccessPolicyService)
    private readonly secretAccessPolicy: SecretAccessPolicyService,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(WorkflowService)
    private readonly workflowService: WorkflowService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async list(
    context: UserContext,
    query: AchievementListQueryDto,
  ): Promise<AchievementListResult> {
    this.assertUserContext(context);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.policyQueryFactory.achievementReadableWhere(context);
    const pageResult = await this.repository.list({
      where,
      filters: {
        status: query.status,
        type: query.type,
        keyword: query.keyword?.trim(),
      },
      page,
      pageSize,
    });
    const restrictedIds = pageResult.items
      .filter((item) =>
        isRestrictedSecretLevel(item.secretLevel as AuthorizationSecretLevelCode),
      )
      .map((item) => item.id);
    const grants = await this.repository.findResourceGrantsForAchievements(restrictedIds);

    return {
      items: pageResult.items.map((item) => this.toAchievementListItem(context, item, grants)),
      total: pageResult.total,
      page,
      pageSize,
    };
  }

  async createDraft(
    context: UserContext,
    dto: CreateAchievementDto,
  ): Promise<AchievementAggregate> {
    this.assertUserContext(context);
    this.assertPermission(context, PermissionCode.achievementCreate);
    this.assertDepartmentBoundary(context, dto.departmentId);
    await this.assertActiveDepartmentForWrite(context.departmentId);
    this.assertCreateDetailMatchesType(dto);

    const input = this.toCreateDraftInput(context, dto);
    await this.assertNoNormalizedConflict(this.toNormalizedConflictInput(input));

    try {
      return await this.prisma.$transaction(async (tx) => {
        const achievementClient = tx as AchievementTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const aggregate = await this.repository.createDraftInTransaction(
          achievementClient,
          input,
        );

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toAchievementAuditEvent(context, AuditActionCode.create, null, aggregate),
        );

        return aggregate;
      });
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async getDetail(
    context: UserContext,
    achievementId: string,
  ): Promise<AchievementAggregate> {
    this.assertUserContext(context);
    this.assertAnyPermission(context, [
      PermissionCode.achievementReadOwn,
      PermissionCode.achievementReadDepartment,
    ]);

    const where = this.policyQueryFactory.achievementReadableWhere(context);
    const aggregate = await this.repository.findDetailByIdWhere(achievementId, where);

    if (!aggregate) {
      throw new AchievementNotFoundError(achievementId);
    }

    if (isRestrictedSecretLevel(aggregate.secretLevel as AuthorizationSecretLevelCode)) {
      const grants = await this.repository.findResourceGrantsForAchievement(achievementId);
      const decision = this.secretAccessPolicy.canReadResource(
        context,
        {
          resourceType: ResourceTypeCode.achievement,
          resourceId: achievementId,
          secretLevel: aggregate.secretLevel as AuthorizationSecretLevelCode,
          ownerUserId: aggregate.ownerUserId,
        },
        allowDecision("Base achievement visibility is granted."),
        grants,
      );

      if (decision.effect === "DENY") {
        throw new AchievementAccessDeniedError(decision.reason);
      }
    }

    return aggregate;
  }

  async updateDraft(
    context: UserContext,
    achievementId: string,
    dto: UpdateAchievementDto,
  ): Promise<AchievementAggregate> {
    this.assertUserContext(context);
    this.assertPermission(context, PermissionCode.achievementUpdateOwn);
    this.assertContributorsAreNotUpdated(dto);

    const where = this.policyQueryFactory.achievementOwnedWhere(
      context,
      PermissionCode.achievementUpdateOwn,
    );
    const current = await this.repository.findDetailByIdWhere(achievementId, where);

    if (!current) {
      throw new AchievementNotFoundError(achievementId);
    }

    if (current.status !== AchievementStatusCode.draft) {
      throw new AchievementInvalidStateError(current.status, AchievementStatusCode.draft);
    }

    this.assertUpdateDetailMatchesType(current.type as AchievementTypeCode, dto);

    const input = this.toUpdateDraftInput(context, current, dto);
    await this.assertNoNormalizedConflict(
      this.toNormalizedConflictInput(input),
      achievementId,
    );

    try {
      return await this.prisma.$transaction(async (tx) => {
        const achievementClient = tx as AchievementTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const aggregate = await this.repository.updateDraftInTransaction(
          achievementClient,
          input,
        );

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toAchievementAuditEvent(
            context,
            AuditActionCode.update,
            current,
            aggregate,
          ),
        );

        return aggregate;
      });
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async submitDraft(
    context: UserContext,
    achievementId: string,
  ): Promise<AchievementStateResult> {
    this.assertUserContext(context);
    this.assertPermission(context, PermissionCode.achievementSubmit);

    const where = this.policyQueryFactory.achievementOwnedWhere(
      context,
      PermissionCode.achievementSubmit,
    );
    const submittedAt = new Date();

    try {
      return await this.prisma.$transaction(async (tx) => {
        const achievementClient = tx as AchievementTransactionClient;
        const workflowClient = tx as WorkflowTransactionClient;
        const current = await this.repository.findStateByIdWhereInTransaction(
          achievementClient,
          achievementId,
          where,
        );

        if (!current) {
          throw new AchievementNotFoundError(achievementId);
        }

        this.assertCurrentStatus(current, AchievementStatusCode.draft);
        assertAchievementTransition(
          AchievementStatusCode.draft,
          AchievementStatusCode.pendingDepartmentReview,
        );

        const { departmentReviewerId } =
          await this.workflowService.prepareAchievementReviewOnSubmitInTransaction(
            workflowClient,
            {
              achievementId,
              departmentId: current.departmentId,
            },
          );

        const state = await this.repository.transitionStatusInTransaction(
          achievementClient,
          {
            achievementId,
            expectedStatus: AchievementStatusCode.draft,
            nextStatus: AchievementStatusCode.pendingDepartmentReview,
            submittedById: context.userId,
            submittedAt,
            updatedById: context.userId,
          },
        );

        await this.workflowService.createAchievementReviewOnSubmitInTransaction(
          workflowClient,
          {
            achievementId,
            submittedById: context.userId,
            departmentReviewerId,
            submittedAt,
          },
        );

        await this.auditService.recordEventInTransaction(
          tx as AuditTransactionClient,
          this.toAchievementAuditEvent(context, AuditActionCode.submit, current, state),
        );

        return state;
      });
    } catch (error) {
      if (error instanceof AchievementStatusTransitionConflictError) {
        throw new AchievementInvalidStateError(
          error.expectedStatus,
          AchievementStatusCode.draft,
        );
      }

      if (error instanceof ActiveWorkflowInstanceAlreadyExistsError) {
        throw new AchievementConflictError("unknown");
      }

      if (error instanceof DepartmentReviewerNotFoundError) {
        throw new AchievementUnsupportedOperationError(
          "No active department research secretary is available for review assignment.",
        );
      }

      if (error instanceof WorkflowDepartmentUnavailableError) {
        throw new AchievementUnsupportedOperationError(
          "Achievement department is archived or unavailable.",
        );
      }

      throw this.mapRepositoryError(error);
    }
  }

  async voidAchievement(
    context: UserContext,
    achievementId: string,
    dto: VoidAchievementDto,
  ): Promise<AchievementStateResult> {
    this.assertUserContext(context);
    this.assertPermission(context, PermissionCode.achievementUpdateOwn);

    const reason = dto.reason?.trim();

    if (!reason) {
      throw new AchievementInvalidPayloadError("Void reason is required.");
    }

    const current = await this.findOwnedState(
      context,
      achievementId,
      PermissionCode.achievementUpdateOwn,
    );

    this.assertCurrentStatus(current, AchievementStatusCode.draft);
    assertAchievementTransition(AchievementStatusCode.draft, AchievementStatusCode.voided);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const achievementClient = tx as AchievementTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const state = await this.repository.transitionStatusInTransaction(
          achievementClient,
          {
            achievementId,
            expectedStatus: AchievementStatusCode.draft,
            nextStatus: AchievementStatusCode.voided,
            voidedById: context.userId,
            voidedAt: new Date(),
            voidReason: reason,
            updatedById: context.userId,
          },
        );

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toAchievementAuditEvent(context, AuditActionCode.void, current, state),
        );

        return state;
      });
    } catch (error) {
      if (error instanceof AchievementStatusTransitionConflictError) {
        throw new AchievementInvalidStateError(
          error.expectedStatus,
          AchievementStatusCode.draft,
        );
      }

      throw this.mapRepositoryError(error);
    }
  }

  async archiveAchievement(
    context: UserContext,
    achievementId: string,
  ): Promise<AchievementStateResult> {
    this.assertUserContext(context);
    this.assertPermission(context, PermissionCode.achievementArchive);

    const archivedAt = new Date();

    try {
      return await this.prisma.$transaction(async (tx) => {
        const achievementClient = tx as AchievementTransactionClient;
        const workflowClient = tx as WorkflowTransactionClient;
        const current = await this.repository.findStateByIdInTransaction(
          achievementClient,
          achievementId,
        );

        if (!current) {
          throw new AchievementNotFoundError(achievementId);
        }

        this.assertCurrentStatus(current, AchievementStatusCode.pendingArchive);
        assertAchievementTransition(
          AchievementStatusCode.pendingArchive,
          AchievementStatusCode.archived,
        );

        const workflowInstance =
          await this.workflowService.prepareAchievementArchiveInTransaction(
            workflowClient,
            {
              achievementId,
            },
          );

        const state = await this.repository.transitionStatusInTransaction(
          achievementClient,
          {
            achievementId,
            expectedStatus: AchievementStatusCode.pendingArchive,
            nextStatus: AchievementStatusCode.archived,
            archivedById: context.userId,
            archivedAt,
            updatedById: context.userId,
          },
        );

        await this.workflowService.completeAchievementArchiveInTransaction(
          workflowClient,
          {
            instanceId: workflowInstance.id,
            achievementId,
            archivedById: context.userId,
            actorDepartmentId: context.departmentId,
            targetDepartmentId: current.departmentId,
            targetSecretLevel: current.secretLevel as AuthorizationSecretLevelCode,
            archivedAt,
            auditClient: tx as AuditTransactionClient,
          },
        );

        await this.auditService.recordEventInTransaction(
          tx as AuditTransactionClient,
          this.toAchievementAuditEvent(context, AuditActionCode.archive, current, state),
        );

        return state;
      });
    } catch (error) {
      if (error instanceof AchievementStatusTransitionConflictError) {
        throw new AchievementInvalidStateError(
          error.expectedStatus,
          AchievementStatusCode.pendingArchive,
        );
      }

      if (
        error instanceof WorkflowInvalidStateError ||
        error instanceof WorkflowInstanceTransitionConflictError
      ) {
        throw new AchievementInvalidStateError(
          "WORKFLOW_INVALID_STATE",
          "ARCHIVE_WORKFLOW_READY",
        );
      }

      throw this.mapRepositoryError(error);
    }
  }

  private assertUserContext(context: UserContext | null | undefined): asserts context is UserContext {
    if (!context?.userId || !context.departmentId) {
      throw new AchievementAccessDeniedError("User context with department is required.");
    }
  }

  private toAchievementListItem(
    context: UserContext,
    record: AchievementListRecord,
    grants: readonly AchievementResourceGrant[],
  ): AchievementListItem {
    const isRestricted = isRestrictedSecretLevel(
      record.secretLevel as AuthorizationSecretLevelCode,
    );
    const isRedacted =
      isRestricted &&
      this.secretAccessPolicy.canReadResource(
        context,
        {
          resourceType: ResourceTypeCode.achievement,
          resourceId: record.id,
          secretLevel: record.secretLevel as AuthorizationSecretLevelCode,
          ownerUserId: record.ownerUserId,
        },
        allowDecision("Base achievement visibility is granted."),
        grants,
      ).effect === "DENY";

    return {
      id: record.id,
      type: record.type as AchievementTypeCode,
      status: record.status as AchievementStatusCode,
      secretLevel: record.secretLevel as SecretLevelCode,
      departmentId: record.departmentId,
      ownerUserId: record.ownerUserId,
      title: isRedacted ? null : record.title,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      submittedAt: record.submittedAt,
      archivedAt: record.archivedAt,
      voidedAt: record.voidedAt,
      isRestricted,
      isRedacted,
    };
  }

  private assertPermission(context: UserContext, permission: PermissionCode): void {
    const decision = this.rbacPolicy.hasPermission(context, permission);

    if (decision.effect === "DENY") {
      throw new AchievementPermissionDeniedError(permission);
    }
  }

  private assertAnyPermission(
    context: UserContext,
    permissions: readonly PermissionCode[],
  ): void {
    const decision = this.rbacPolicy.hasAnyPermission(context, permissions);

    if (decision.effect === "DENY") {
      throw new AchievementAccessDeniedError(decision.reason);
    }
  }

  private assertDepartmentBoundary(context: UserContext, departmentId?: string): void {
    if (departmentId && departmentId !== context.departmentId) {
      throw new AchievementInvalidPayloadError(
        "Achievement departmentId must match the current user context departmentId.",
      );
    }
  }

  private async assertActiveDepartmentForWrite(departmentId: string): Promise<void> {
    const department = await this.prisma.department.findFirst({
      where: {
        id: departmentId,
        status: DepartmentStatus.ACTIVE,
        archivedAt: null,
      },
      select: { id: true },
    });

    if (!department) {
      throw new AchievementUnsupportedOperationError(
        "Achievement department is archived or unavailable.",
      );
    }
  }

  private assertContributorsAreNotUpdated(dto: UpdateAchievementDto): void {
    if (isProvidedDetail(dto.contributors)) {
      throw new AchievementUnsupportedOperationError(
        "Updating achievement contributors is not supported in Step 5B-2.",
      );
    }
  }

  private assertCreateDetailMatchesType(dto: CreateAchievementDto): void {
    this.assertDetailPayloadMatchesType(dto.type, dto);

    if (dto.type === AchievementTypeCode.paper && !dto.paperDetail) {
      throw new AchievementInvalidPayloadError("Paper detail is required.");
    }

    if (dto.type === AchievementTypeCode.patent && !dto.patentDetail) {
      throw new AchievementInvalidPayloadError("Patent detail is required.");
    }

    if (
      dto.type === AchievementTypeCode.softwareCopyright &&
      !dto.softwareCopyrightDetail
    ) {
      throw new AchievementInvalidPayloadError("Software copyright detail is required.");
    }
  }

  private assertUpdateDetailMatchesType(
    type: AchievementTypeCode,
    dto: UpdateAchievementDto,
  ): void {
    this.assertDetailPayloadMatchesType(type, dto);
  }

  private assertDetailPayloadMatchesType(
    type: AchievementTypeCode,
    dto: CreateAchievementDto | UpdateAchievementDto,
  ): void {
    if (type !== AchievementTypeCode.paper && isProvidedDetail(dto.paperDetail)) {
      throw new AchievementInvalidPayloadError("Paper detail does not match achievement type.");
    }

    if (type !== AchievementTypeCode.patent && isProvidedDetail(dto.patentDetail)) {
      throw new AchievementInvalidPayloadError("Patent detail does not match achievement type.");
    }

    if (
      type !== AchievementTypeCode.softwareCopyright &&
      isProvidedDetail(dto.softwareCopyrightDetail)
    ) {
      throw new AchievementInvalidPayloadError(
        "Software copyright detail does not match achievement type.",
      );
    }
  }

  private toCreateDraftInput(
    context: UserContext,
    dto: CreateAchievementDto,
  ): CreateAchievementDraftInput {
    return {
      type: dto.type,
      title: dto.title,
      secretLevel: dto.secretLevel ?? SecretLevelCode.internal,
      departmentId: context.departmentId,
      ownerUserId: context.userId,
      createdById: context.userId,
      updatedById: context.userId,
      paperDetail:
        dto.type === AchievementTypeCode.paper
          ? this.toPaperDetailInput(dto.paperDetail)
          : undefined,
      patentDetail:
        dto.type === AchievementTypeCode.patent
          ? this.toPatentDetailInput(dto.patentDetail)
          : undefined,
      softwareCopyrightDetail:
        dto.type === AchievementTypeCode.softwareCopyright
          ? this.toSoftwareCopyrightDetailInput(dto.softwareCopyrightDetail)
          : undefined,
      contributors: dto.contributors.map(toContributorInput),
    };
  }

  private toUpdateDraftInput(
    context: UserContext,
    current: AchievementAggregate,
    dto: UpdateAchievementDto,
  ): UpdateAchievementDraftInput {
    const type = current.type as AchievementTypeCode;

    return {
      achievementId: current.id,
      type,
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.secretLevel !== undefined ? { secretLevel: dto.secretLevel } : {}),
      updatedById: context.userId,
      paperDetail:
        type === AchievementTypeCode.paper && dto.paperDetail
          ? this.toPaperDetailInput(dto.paperDetail)
          : undefined,
      patentDetail:
        type === AchievementTypeCode.patent && dto.patentDetail
          ? this.toPatentDetailInput(dto.patentDetail)
          : undefined,
      softwareCopyrightDetail:
        type === AchievementTypeCode.softwareCopyright && dto.softwareCopyrightDetail
          ? this.toSoftwareCopyrightDetailInput(dto.softwareCopyrightDetail)
          : undefined,
    };
  }

  private toPaperDetailInput(
    detail: PaperDetailDto | undefined,
  ): CreatePaperDetailDraftInput | undefined {
    if (!detail) {
      return undefined;
    }

    return {
      ...(hasOwn(detail, "doi") ? { doi: detail.doi ?? null, doiNormalized: normalizeDoi(detail.doi) } : {}),
      ...(hasOwn(detail, "journal") ? { journal: detail.journal ?? null } : {}),
      ...(hasOwn(detail, "issnCn") ? { issnCn: detail.issnCn ?? null } : {}),
      ...(hasOwn(detail, "publishYear") ? { publishYear: detail.publishYear ?? null } : {}),
      ...(hasOwn(detail, "includedType") ? { includedType: detail.includedType ?? null } : {}),
      ...(hasOwn(detail, "impactFactor") ? { impactFactor: detail.impactFactor ?? null } : {}),
      ...(hasOwn(detail, "partition") ? { partition: detail.partition ?? null } : {}),
      ...(hasOwn(detail, "abstract") ? { abstract: detail.abstract ?? null } : {}),
    };
  }

  private toPatentDetailInput(
    detail: PatentDetailDto | undefined,
  ): CreatePatentDetailDraftInput | undefined {
    if (!detail) {
      return undefined;
    }

    return {
      ...(hasOwn(detail, "applicationNo")
        ? {
            applicationNo: detail.applicationNo ?? null,
            applicationNoNormalized: normalizePatentApplicationNo(detail.applicationNo),
          }
        : {}),
      ...(hasOwn(detail, "grantNo")
        ? {
            grantNo: detail.grantNo ?? null,
            grantNoNormalized: normalizePatentGrantNo(detail.grantNo),
          }
        : {}),
      ...(hasOwn(detail, "patentType") ? { patentType: detail.patentType ?? null } : {}),
      ...(hasOwn(detail, "filingDate") ? { filingDate: detail.filingDate ?? null } : {}),
      ...(hasOwn(detail, "grantDate") ? { grantDate: detail.grantDate ?? null } : {}),
      ...(hasOwn(detail, "nextFeeDate") ? { nextFeeDate: detail.nextFeeDate ?? null } : {}),
      ...(hasOwn(detail, "feeAmount") ? { feeAmount: detail.feeAmount ?? null } : {}),
      ...(hasOwn(detail, "legalStatus") ? { legalStatus: detail.legalStatus ?? null } : {}),
    };
  }

  private toSoftwareCopyrightDetailInput(
    detail: SoftwareCopyrightDetailDto | undefined,
  ): CreateSoftwareCopyrightDetailDraftInput | undefined {
    if (!detail) {
      return undefined;
    }

    return {
      ...(hasOwn(detail, "registrationNo")
        ? {
            registrationNo: detail.registrationNo ?? null,
            registrationNoNormalized: normalizeSoftwareRegistrationNo(detail.registrationNo),
          }
        : {}),
      ...(hasOwn(detail, "softwareVersion")
        ? { softwareVersion: detail.softwareVersion ?? null }
        : {}),
      ...(hasOwn(detail, "softwareType") ? { softwareType: detail.softwareType ?? null } : {}),
      ...(hasOwn(detail, "publishDate") ? { publishDate: detail.publishDate ?? null } : {}),
      ...(hasOwn(detail, "registerDate") ? { registerDate: detail.registerDate ?? null } : {}),
      ...(hasOwn(detail, "runEnv") ? { runEnv: detail.runEnv ?? null } : {}),
    };
  }

  private toNormalizedConflictInput(
    input: CreateAchievementDraftInput | UpdateAchievementDraftInput,
  ): NormalizedAchievementConflictInput {
    return {
      doiNormalized: input.paperDetail?.doiNormalized,
      applicationNoNormalized: input.patentDetail?.applicationNoNormalized,
      grantNoNormalized: input.patentDetail?.grantNoNormalized,
      registrationNoNormalized: input.softwareCopyrightDetail?.registrationNoNormalized,
    };
  }

  private async assertNoNormalizedConflict(
    input: NormalizedAchievementConflictInput,
    excludeAchievementId?: string,
  ): Promise<void> {
    if (!hasNormalizedValue(input)) {
      return;
    }

    const conflict = await this.repository.findNormalizedConflict(input, excludeAchievementId);

    if (conflict) {
      throw new AchievementConflictError(
        conflict.field,
        conflict.normalizedValue,
        conflict.achievementId,
      );
    }
  }

  private async findOwnedState(
    context: UserContext,
    achievementId: string,
    permission: PermissionCode,
  ): Promise<AchievementStateRecord> {
    const where = this.policyQueryFactory.achievementOwnedWhere(context, permission);
    const current = await this.repository.findStateByIdWhere(achievementId, where);

    if (!current) {
      throw new AchievementNotFoundError(achievementId);
    }

    return current;
  }

  private assertCurrentStatus(
    current: AchievementStateRecord,
    expectedStatus: AchievementStatusCode,
  ): void {
    if (current.status !== expectedStatus) {
      throw new AchievementInvalidStateError(current.status, expectedStatus);
    }
  }

  private mapRepositoryError(error: unknown): Error {
    if (this.repository.isPrismaUniqueConflict(error)) {
      const field = mapUniqueConflictTarget(this.repository.getPrismaUniqueConflictTarget(error));
      return new AchievementConflictError(field);
    }

    return error instanceof Error ? error : new Error("Unknown achievement repository error.");
  }

  private toAchievementAuditEvent(
    context: UserContext,
    action: AuditActionCode,
    oldRecord: AchievementAuditRecord | null,
    newRecord: AchievementAuditRecord,
  ): CreateAuditEventInput {
    return {
      actor: {
        userId: context.userId,
        departmentId: context.departmentId,
      },
      action,
      target: {
        type: AuditTargetTypeCode.achievement,
        id: newRecord.id,
        departmentId: newRecord.departmentId,
        secretLevel: newRecord.secretLevel as AuthorizationSecretLevelCode,
      },
      oldValue: oldRecord ? toAchievementAuditSummary(action, oldRecord) : null,
      newValue: toAchievementAuditSummary(action, newRecord),
    };
  }
}

type AchievementAuditRecord = Pick<
  AchievementAggregate | AchievementStateRecord,
  | "id"
  | "status"
  | "secretLevel"
  | "departmentId"
  | "version"
  | "submittedAt"
  | "archivedAt"
  | "voidedAt"
>;

const toAchievementAuditSummary = (
  action: AuditActionCode,
  record: AchievementAuditRecord,
) => ({
  achievementId: record.id,
  action,
  status: record.status,
  version: record.version,
  ...(record.submittedAt ? { submittedAt: toAuditIsoString(record.submittedAt) } : {}),
  ...(record.archivedAt ? { archivedAt: toAuditIsoString(record.archivedAt) } : {}),
  ...(record.voidedAt ? { voidedAt: toAuditIsoString(record.voidedAt) } : {}),
});

const toAuditIsoString = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : value;

const toContributorInput = (
  contributor: CreateAchievementDto["contributors"][number],
): CreateAchievementContributorDraftInput => ({
  name: contributor.name,
  userId: contributor.userId ?? null,
  organization: contributor.organization ?? null,
  contributorType: contributor.contributorType,
  contributorRole: contributor.contributorRole ?? null,
  sortOrder: contributor.sortOrder,
});

const hasOwn = <T extends object>(object: T, key: PropertyKey): boolean =>
  Object.prototype.hasOwnProperty.call(object, key);

const isProvidedDetail = (value: unknown): boolean => value !== undefined && value !== null;

const hasNormalizedValue = (input: NormalizedAchievementConflictInput): boolean =>
  Boolean(
    input.doiNormalized ||
      input.applicationNoNormalized ||
      input.grantNoNormalized ||
      input.registrationNoNormalized,
  );

const mapUniqueConflictTarget = (
  targets: readonly string[],
): "doi" | "applicationNo" | "grantNo" | "registrationNo" | "unknown" => {
  const normalizedTargets = targets.map((target) =>
    target.replace(/[^a-z0-9]/gi, "").toLowerCase(),
  );

  if (normalizedTargets.some((target) => target.includes("doinormalized"))) {
    return "doi";
  }

  if (normalizedTargets.some((target) => target.includes("applicationnonormalized"))) {
    return "applicationNo";
  }

  if (normalizedTargets.some((target) => target.includes("grantnonormalized"))) {
    return "grantNo";
  }

  if (normalizedTargets.some((target) => target.includes("registrationnonormalized"))) {
    return "registrationNo";
  }

  return "unknown";
};
