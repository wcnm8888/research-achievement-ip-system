import { SELF_DECLARED_DEPS_METADATA } from "@nestjs/common/constants";
import { describe, expect, it } from "vitest";
import { AuditRepository } from "./audit/audit.repository";
import { AuditService } from "./audit/audit.service";
import { AttachmentAccessPolicyService } from "./authorization/policy/attachment-access-policy.service";
import { AuditReadPolicyService } from "./authorization/policy/audit-read-policy.service";
import { AuditRedactorService } from "./authorization/policy/audit-redactor.service";
import { PolicyQueryFactory } from "./authorization/policy/policy-query.factory";
import { RbacPolicyService } from "./authorization/policy/rbac-policy.service";
import { SecretAccessPolicyService } from "./authorization/policy/secret-access-policy.service";
import { PrismaService } from "./database/prisma.service";
import { AttachmentRepository } from "./attachments/attachment.repository";
import { AttachmentService } from "./attachments/attachment.service";
import { ATTACHMENT_STORAGE_ADAPTER } from "./attachments/storage/attachment-storage.provider";
import { DashboardRepository } from "./dashboard/dashboard.repository";
import { DashboardService } from "./dashboard/dashboard.service";
import { FeeRepository } from "./fees/fee.repository";
import { FeeService } from "./fees/fee.service";
import { MockNotificationAdapter } from "./notifications/adapters/mock-notification.adapter";
import { NotificationRepository } from "./notifications/notification.repository";
import { NotificationService } from "./notifications/notification.service";
import { ReportEmailDeliveryService } from "./reports/report-email-delivery.service";
import { ReminderRepository } from "./reminders/reminder.repository";
import { ReminderService } from "./reminders/reminder.service";
import { SEARCH_ADAPTER } from "./search/adapters/search-adapter";
import { SearchService } from "./search/search.service";
import { WorkflowService } from "./workflow/workflow.service";

type ExplicitDependency = { index: number; param: unknown };

const getExplicitDependencyTokens = (target: object): unknown[] =>
  [
    ...((Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) ?? []) as ExplicitDependency[]),
  ]
    .sort((left: ExplicitDependency, right: ExplicitDependency) => left.index - right.index)
    .map((dependency: ExplicitDependency) => dependency.param);

describe("service provider dependency injection", () => {
  it("declares explicit AttachmentService constructor injection tokens for the dev runtime path", () => {
    expect(getExplicitDependencyTokens(AttachmentService)).toEqual([
      AttachmentRepository,
      AttachmentAccessPolicyService,
      PolicyQueryFactory,
      SecretAccessPolicyService,
      RbacPolicyService,
      PrismaService,
      AuditService,
      ATTACHMENT_STORAGE_ADAPTER,
    ]);
  });

  it("declares explicit AuditService constructor injection tokens for the dev runtime path", () => {
    expect(getExplicitDependencyTokens(AuditService)).toEqual([
      AuditRepository,
      AuditReadPolicyService,
      AuditRedactorService,
    ]);
  });

  it("declares explicit DashboardService constructor injection tokens for the dev runtime path", () => {
    expect(getExplicitDependencyTokens(DashboardService)).toEqual([
      DashboardRepository,
      PolicyQueryFactory,
    ]);
  });

  it("declares explicit FeeService constructor injection tokens for the dev runtime path", () => {
    expect(getExplicitDependencyTokens(FeeService)).toEqual([
      FeeRepository,
      RbacPolicyService,
      PolicyQueryFactory,
      PrismaService,
      AuditService,
      WorkflowService,
    ]);
  });

  it("declares explicit NotificationService constructor injection tokens for the dev runtime path", () => {
    expect(getExplicitDependencyTokens(NotificationService)).toEqual([
      NotificationRepository,
      MockNotificationAdapter,
    ]);
  });

  it("declares explicit ReminderService constructor injection tokens for the dev runtime path", () => {
    expect(getExplicitDependencyTokens(ReminderService)).toEqual([
      ReminderRepository,
      PrismaService,
      NotificationService,
      AuditService,
      WorkflowService,
      ReportEmailDeliveryService,
    ]);
  });

  it("declares explicit SearchService constructor injection tokens for the dev runtime path", () => {
    expect(getExplicitDependencyTokens(SearchService)).toEqual([
      SEARCH_ADAPTER,
      PolicyQueryFactory,
      SecretAccessPolicyService,
    ]);
  });
});
