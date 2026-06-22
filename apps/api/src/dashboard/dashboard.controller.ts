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
import { DashboardService } from "./dashboard.service";
import { DashboardAccessDeniedError } from "./domain/dashboard-errors";
import {
  DashboardSummaryQueryDto,
  toDashboardRequestOptions,
} from "./dto/dashboard-summary-query.dto";

const dashboardValidationOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
};

const dashboardValidationPipe = new ValidationPipe(dashboardValidationOptions);
const dashboardSummaryQueryValidationPipe = new ValidationPipe({
  ...dashboardValidationOptions,
  expectedType: DashboardSummaryQueryDto,
});

@Controller("dashboard")
@UseGuards(UserContextGuard, PermissionGuard)
@UsePipes(dashboardValidationPipe)
export class DashboardController {
  constructor(
    @Inject(DashboardService)
    private readonly dashboardService: DashboardService,
  ) {}

  @Get("summary")
  @RequirePermissions(PermissionCode.userContextRead)
  async getSummary(
    @CurrentUser() currentUser: UserContext,
    @Query(dashboardSummaryQueryValidationPipe)
    query: DashboardSummaryQueryDto = {},
  ) {
    try {
      return await this.dashboardService.getDashboardSummary(
        currentUser,
        toDashboardRequestOptions(query),
      );
    } catch (error) {
      throw mapDashboardServiceError(error);
    }
  }
}

const mapDashboardServiceError = (error: unknown): Error => {
  if (error instanceof DashboardAccessDeniedError) {
    return new ForbiddenException(error.message);
  }

  return error instanceof Error
    ? error
    : new Error("Unknown dashboard service error.");
};
