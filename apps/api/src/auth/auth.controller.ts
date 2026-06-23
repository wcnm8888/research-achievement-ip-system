import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Inject,
  InternalServerErrorException,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { CurrentUser } from "../authorization/decorators/current-user.decorator";
import { UserContextGuard } from "../authorization/guards/user-context.guard";
import {
  getSessionCookieClearOptions,
  getSessionCookieOptions,
  type SessionCookieClearOptions,
  type SessionCookieOptions,
} from "../config/production-config";
import { readCookie, sessionCookieName } from "../identity/session-identity.adapter";
import { UserContext } from "../identity/user-context";
import { AuthConfigurationError } from "./auth-crypto";
import {
  AuthBootstrapAlreadyCompletedError,
  AuthBootstrapDisabledError,
  AuthInvalidCredentialsError,
} from "./auth.errors";
import { AuthService } from "./auth.service";
import { BootstrapAdminDto } from "./dto/bootstrap-admin.dto";
import { LoginDto } from "./dto/login.dto";

type CookieResponse = {
  cookie: (name: string, value: string, options: SessionCookieOptions) => void;
  clearCookie: (name: string, options: SessionCookieClearOptions) => void;
};

const authValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,
  ) {}

  @Post("bootstrap")
  async bootstrap(@Body(authValidationPipe) dto: BootstrapAdminDto) {
    try {
      return await this.authService.bootstrapAdmin(dto);
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  @Post("login")
  @HttpCode(200)
  async login(
    @Body(authValidationPipe) dto: LoginDto,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    try {
      const result = await this.authService.login(dto);
      response.cookie(sessionCookieName, result.sessionToken, getSessionCookieOptions(result.expiresAt));

      return { user: result.user };
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  @Post("logout")
  @HttpCode(204)
  async logout(
    @Headers("cookie") cookieHeader: string | undefined,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    try {
      const sessionToken = readCookie({ headers: { cookie: cookieHeader } }, sessionCookieName);
      await this.authService.logout(sessionToken);
      response.clearCookie(sessionCookieName, getSessionCookieClearOptions());
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  @Get("me")
  @UseGuards(UserContextGuard)
  async me(@CurrentUser() currentUser: UserContext) {
    try {
      return { user: await this.authService.getMe(currentUser) };
    } catch (error) {
      throw mapAuthError(error);
    }
  }
}

const mapAuthError = (error: unknown): Error => {
  if (error instanceof AuthBootstrapAlreadyCompletedError) {
    return new ConflictException(error.message);
  }

  if (error instanceof AuthBootstrapDisabledError) {
    return new ForbiddenException(error.message);
  }

  if (error instanceof AuthInvalidCredentialsError) {
    return new UnauthorizedException("Invalid email or password.");
  }

  if (error instanceof AuthConfigurationError) {
    return new InternalServerErrorException("Authentication is not configured.");
  }

  return error instanceof Error ? error : new Error("Unknown auth error.");
};
