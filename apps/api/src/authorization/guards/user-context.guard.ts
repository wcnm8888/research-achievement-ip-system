import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { IdentityAdapter } from "../../identity/identity-adapter.interface";
import { IDENTITY_ADAPTER } from "../../identity/identity-adapter.token";
import {
  setRequestUserContext,
  UserContextRequest,
} from "./user-context-request";

@Injectable()
export class UserContextGuard implements CanActivate {
  constructor(
    @Inject(IDENTITY_ADAPTER)
    private readonly identityAdapter: IdentityAdapter,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<UserContextRequest>();
    const userContext = await this.identityAdapter.loadUserContext({
      headers: request.headers,
    });

    if (!userContext) {
      throw new UnauthorizedException("User context is required.");
    }

    setRequestUserContext(request, userContext);
    return true;
  }
}
