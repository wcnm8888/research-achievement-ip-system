import { Inject, Injectable } from "@nestjs/common";
import { DevIdentityAdapter, isProductionEnvironment } from "./dev-identity.adapter";
import { IdentityAdapter, IdentityRequest } from "./identity-adapter.interface";
import { SessionIdentityAdapter } from "./session-identity.adapter";
import { UserContext } from "./user-context";

@Injectable()
export class RuntimeIdentityAdapter implements IdentityAdapter {
  constructor(
    @Inject(DevIdentityAdapter)
    private readonly devIdentityAdapter: DevIdentityAdapter,
    @Inject(SessionIdentityAdapter)
    private readonly sessionIdentityAdapter: SessionIdentityAdapter,
  ) {}

  loadUserContext(request: IdentityRequest): Promise<UserContext | null> {
    if (isProductionEnvironment(request.environment ?? process.env.NODE_ENV)) {
      return this.sessionIdentityAdapter.loadUserContext(request);
    }

    return this.devIdentityAdapter.loadUserContext(request);
  }
}
