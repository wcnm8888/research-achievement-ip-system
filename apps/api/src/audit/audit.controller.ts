import {
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { PermissionCode } from "../authorization/constants/permission-code";
import { CurrentUser } from "../authorization/decorators/current-user.decorator";
import { RequirePermissions } from "../authorization/decorators/require-permissions.decorator";
import { PermissionGuard } from "../authorization/guards/permission.guard";
import { UserContextGuard } from "../authorization/guards/user-context.guard";
import { UserContext } from "../identity/user-context";
import { AuditService } from "./audit.service";
import { AuditAccessDeniedError } from "./domain/audit-errors";
import {
  AuditMaskedQueryDto,
  toAuditMaskedQueryInput,
} from "./dto/audit-query.dto";

const auditValidationOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
};

const auditValidationPipe = new ValidationPipe(auditValidationOptions);
const auditMaskedQueryValidationPipe = new ValidationPipe({
  ...auditValidationOptions,
  expectedType: AuditMaskedQueryDto,
});

@Controller("audit-logs")
@UseGuards(UserContextGuard, PermissionGuard)
@UsePipes(auditValidationPipe)
export class AuditController {
  constructor(
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @RequirePermissions(PermissionCode.auditReadMasked)
  async listMasked(
    @CurrentUser() currentUser: UserContext,
    @Query(auditMaskedQueryValidationPipe) query: AuditMaskedQueryDto = {},
  ) {
    try {
      return await this.auditService.listMasked(
        currentUser,
        toAuditMaskedQueryInput(query),
      );
    } catch (error) {
      throw mapAuditServiceError(error);
    }
  }
}

const mapAuditServiceError = (error: unknown): Error => {
  if (error instanceof AuditAccessDeniedError) {
    return new ForbiddenException(error.message);
  }

  return error instanceof Error ? error : new Error("Unknown audit service error.");
};
