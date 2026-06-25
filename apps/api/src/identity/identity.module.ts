import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { DevIdentityAdapter } from "./dev-identity.adapter";
import { IDENTITY_ADAPTER } from "./identity-adapter.token";
import { RuntimeIdentityAdapter } from "./runtime-identity.adapter";
import { SessionIdentityAdapter } from "./session-identity.adapter";

@Module({
  imports: [DatabaseModule],
  providers: [
    DevIdentityAdapter,
    SessionIdentityAdapter,
    RuntimeIdentityAdapter,
    {
      provide: IDENTITY_ADAPTER,
      useExisting: RuntimeIdentityAdapter,
    },
  ],
  exports: [DevIdentityAdapter, SessionIdentityAdapter, RuntimeIdentityAdapter, IDENTITY_ADAPTER],
})
export class IdentityModule {}
