import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { DevIdentityAdapter } from "./dev-identity.adapter";
import { IDENTITY_ADAPTER } from "./identity-adapter.token";

@Module({
  imports: [DatabaseModule],
  providers: [
    DevIdentityAdapter,
    {
      provide: IDENTITY_ADAPTER,
      useExisting: DevIdentityAdapter,
    },
  ],
  exports: [DevIdentityAdapter, IDENTITY_ADAPTER],
})
export class IdentityModule {}
