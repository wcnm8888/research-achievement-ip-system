import { Module } from "@nestjs/common";
import { AccountManagementModule } from "./account-management/account-management.module";
import { AchievementConversionsModule } from "./achievement-conversions/achievement-conversions.module";
import { AchievementsModule } from "./achievements/achievements.module";
import { AttachmentsModule } from "./attachments/attachments.module";
import { AuthModule } from "./auth/auth.module";
import { AuditModule } from "./audit/audit.module";
import { AuthorizationModule } from "./authorization/authorization.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DatabaseModule } from "./database/database.module";
import { DepartmentManagementModule } from "./department-management/department-management.module";
import { FeesModule } from "./fees/fees.module";
import { HealthController } from "./health.controller";
import { IdentityModule } from "./identity/identity.module";
import { ImportsModule } from "./imports/imports.module";
import { RemindersModule } from "./reminders/reminders.module";
import { ReportsModule } from "./reports/reports.module";
import { SearchModule } from "./search/search.module";
import { SecretAuthorizationModule } from "./secret-authorization/secret-authorization.module";
import { SettingsModule } from "./settings/settings.module";
import { WorkflowModule } from "./workflow/workflow.module";

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    IdentityModule,
    AuthorizationModule,
    AuditModule,
    AchievementsModule,
    AchievementConversionsModule,
    WorkflowModule,
    AttachmentsModule,
    FeesModule,
    RemindersModule,
    SearchModule,
    DashboardModule,
    AccountManagementModule,
    DepartmentManagementModule,
    SettingsModule,
    ImportsModule,
    ReportsModule,
    SecretAuthorizationModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
