import { Module } from "@nestjs/common";
import { AuthorizationModule } from "../authorization/authorization.module";
import { DatabaseModule } from "../database/database.module";
import { IdentityModule } from "../identity/identity.module";
import { SecretAuthorizationController } from "./secret-authorization.controller";
import { SecretAuthorizationRepository } from "./secret-authorization.repository";
import { SecretAuthorizationService } from "./secret-authorization.service";

@Module({
  imports: [AuthorizationModule, DatabaseModule, IdentityModule],
  controllers: [SecretAuthorizationController],
  providers: [SecretAuthorizationRepository, SecretAuthorizationService],
})
export class SecretAuthorizationModule {}
