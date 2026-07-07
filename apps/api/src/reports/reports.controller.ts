import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Inject,
  NotFoundException,
  Param,
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
import {
  CustomReportRunQueryDto,
  toCustomReportRunOptions,
} from "./dto/custom-report-run-query.dto";
import {
  CustomReportInvalidQueryError,
  CustomReportTemplateNotFoundError,
} from "./domain/custom-report-errors";
import { ReportsService } from "./reports.service";

const reportsValidationOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
};

const reportsValidationPipe = new ValidationPipe(reportsValidationOptions);
const customReportRunQueryValidationPipe = new ValidationPipe({
  ...reportsValidationOptions,
  expectedType: CustomReportRunQueryDto,
});

@Controller("reports")
@UseGuards(UserContextGuard, PermissionGuard)
@RequirePermissions(PermissionCode.userContextRead)
@UsePipes(reportsValidationPipe)
export class ReportsController {
  constructor(
    @Inject(ReportsService)
    private readonly reportsService: ReportsService,
  ) {}

  @Get("templates")
  listTemplates(@CurrentUser() currentUser: UserContext) {
    return this.reportsService.listTemplates(currentUser);
  }

  @Get("templates/:templateId/run")
  async runTemplate(
    @CurrentUser() currentUser: UserContext,
    @Param("templateId") templateId: string,
    @Query(customReportRunQueryValidationPipe) query: CustomReportRunQueryDto,
  ) {
    try {
      return await this.reportsService.runTemplate(
        currentUser,
        templateId,
        toCustomReportRunOptions(query),
      );
    } catch (error) {
      if (error instanceof CustomReportTemplateNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof CustomReportInvalidQueryError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @Get("templates/:templateId/export.csv")
  @Header("Content-Type", "text/csv; charset=utf-8")
  @Header("Content-Disposition", 'attachment; filename="custom-report.csv"')
  async exportTemplateCsv(
    @CurrentUser() currentUser: UserContext,
    @Param("templateId") templateId: string,
    @Query(customReportRunQueryValidationPipe) query: CustomReportRunQueryDto,
  ) {
    try {
      return await this.reportsService.exportTemplateCsv(
        currentUser,
        templateId,
        toCustomReportRunOptions(query),
      );
    } catch (error) {
      if (error instanceof CustomReportTemplateNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof CustomReportInvalidQueryError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
