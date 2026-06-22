import { Module } from "@nestjs/common";
import { AuthorizationModule } from "../authorization/authorization.module";
import { DatabaseModule } from "../database/database.module";
import { IdentityModule } from "../identity/identity.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardRepository } from "./dashboard.repository";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [DatabaseModule, AuthorizationModule, IdentityModule],
  controllers: [DashboardController],
  providers: [DashboardRepository, DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
