import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthorizationModule } from "../authorization/authorization.module";
import { DatabaseModule } from "../database/database.module";
import {
  AliyunDirectMailAdapter,
  createAliyunDirectMailConfigFromEnv,
} from "./account-lifecycle-aliyun-directmail.adapter";
import {
  AccountLifecycleDeliveryAdapter,
  AccountLifecycleProviderResult,
} from "./account-lifecycle-delivery";
import {
  AccountLifecycleMailer,
  LocalSafeStubDeliveryAdapter,
} from "./account-lifecycle-mailer";
import { AccountLifecycleRepository } from "./account-lifecycle.repository";
import { AccountLifecycleService } from "./account-lifecycle.service";

export const ACCOUNT_LIFECYCLE_DELIVERY_ADAPTER = Symbol("ACCOUNT_LIFECYCLE_DELIVERY_ADAPTER");

type AliyunAdapterFactory = (env: NodeJS.ProcessEnv) => AccountLifecycleDeliveryAdapter;

@Module({
  imports: [AuditModule, AuthorizationModule, DatabaseModule],
  providers: [
    {
      provide: ACCOUNT_LIFECYCLE_DELIVERY_ADAPTER,
      useFactory: (): AccountLifecycleDeliveryAdapter => createAccountLifecycleDeliveryAdapterFromEnv(),
    },
    {
      provide: AccountLifecycleMailer,
      useFactory: (adapter: AccountLifecycleDeliveryAdapter): AccountLifecycleMailer =>
        new AccountLifecycleMailer(adapter),
      inject: [ACCOUNT_LIFECYCLE_DELIVERY_ADAPTER],
    },
    AccountLifecycleRepository,
    AccountLifecycleService,
  ],
  exports: [AccountLifecycleService],
})
export class AccountLifecycleModule {}

export const createAccountLifecycleDeliveryAdapterFromEnv = (
  env: NodeJS.ProcessEnv = process.env,
  createAliyunAdapter: AliyunAdapterFactory = createDefaultAliyunAdapter,
): AccountLifecycleDeliveryAdapter => {
  const provider = env.ACCOUNT_LIFECYCLE_DELIVERY_PROVIDER?.trim().toLowerCase() ?? "local_stub";
  if (provider !== "aliyun_directmail") {
    return new LocalSafeStubDeliveryAdapter();
  }

  const config = createAliyunDirectMailConfigFromEnv(env);
  if (!config.dryRun && (!config.accessKeyId || !config.accessKeySecret)) {
    return new ConfigurationSuppressedDeliveryAdapter();
  }

  return createAliyunAdapter(env);
};

const createDefaultAliyunAdapter: AliyunAdapterFactory = (env) =>
  new AliyunDirectMailAdapter(createAliyunDirectMailConfigFromEnv(env));

class ConfigurationSuppressedDeliveryAdapter implements AccountLifecycleDeliveryAdapter {
  async send(): Promise<AccountLifecycleProviderResult> {
    return {
      status: "SUPPRESSED",
      adapter: "ALIYUN_DIRECTMAIL",
      failureCategory: "CONFIGURATION",
    };
  }
}
