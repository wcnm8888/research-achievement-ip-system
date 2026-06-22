import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UnprocessableEntityException,
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
  ActiveWorkflowInstanceAlreadyExistsError,
  DepartmentReviewerNotFoundError,
  InvalidWorkflowInstanceTransitionError,
  InvalidWorkflowTaskTransitionError,
  WorkflowAccessDeniedError,
  WorkflowInstanceTransitionConflictError,
  WorkflowInvalidPayloadError,
  WorkflowInvalidStateError,
  WorkflowTaskTransitionConflictError,
} from "./domain/workflow-errors";
import { ApproveWorkflowTaskDto, RejectWorkflowTaskDto } from "./dto/workflow-action.dto";
import { WorkflowTaskQueryDto } from "./dto/workflow-task-query.dto";
import { WorkflowService } from "./workflow.service";

const workflowValidationOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
};

const workflowValidationPipe = new ValidationPipe(workflowValidationOptions);
const approveWorkflowTaskValidationPipe = new ValidationPipe({
  ...workflowValidationOptions,
  expectedType: ApproveWorkflowTaskDto,
});
const rejectWorkflowTaskValidationPipe = new ValidationPipe({
  ...workflowValidationOptions,
  expectedType: RejectWorkflowTaskDto,
});
const workflowTaskQueryValidationPipe = new ValidationPipe({
  ...workflowValidationOptions,
  expectedType: WorkflowTaskQueryDto,
});

@Controller("workflow")
@UseGuards(UserContextGuard, PermissionGuard)
@UsePipes(workflowValidationPipe)
export class WorkflowController {
  constructor(
    @Inject(WorkflowService)
    private readonly workflowService: WorkflowService,
  ) {}

  @Get("tasks/my")
  @RequirePermissions(PermissionCode.achievementReviewDepartment)
  async listMyWorkflowTasks(
    @CurrentUser() currentUser: UserContext,
    @Query(workflowTaskQueryValidationPipe) query: WorkflowTaskQueryDto,
  ) {
    try {
      return await this.workflowService.listMyWorkflowTasks(
        currentUser,
        query ?? {},
      );
    } catch (error) {
      throw mapWorkflowServiceError(error);
    }
  }

  @Get("tasks/:taskId")
  @RequirePermissions(PermissionCode.achievementReviewDepartment)
  async getMyWorkflowTask(
    @CurrentUser() currentUser: UserContext,
    @Param("taskId", new ParseUUIDPipe({ version: "4" })) taskId: string,
  ) {
    try {
      return await this.workflowService.getMyWorkflowTask(currentUser, taskId);
    } catch (error) {
      throw mapWorkflowServiceError(error);
    }
  }

  @Post("tasks/:taskId/approve")
  @HttpCode(200)
  @RequirePermissions(PermissionCode.achievementReviewDepartment)
  async approveDepartmentReviewTask(
    @CurrentUser() currentUser: UserContext,
    @Param("taskId", new ParseUUIDPipe({ version: "4" })) taskId: string,
    @Body(approveWorkflowTaskValidationPipe) dto: ApproveWorkflowTaskDto,
  ) {
    try {
      return await this.workflowService.approveDepartmentReviewTask(
        currentUser,
        taskId,
        dto ?? {},
      );
    } catch (error) {
      throw mapWorkflowServiceError(error);
    }
  }

  @Post("tasks/:taskId/reject")
  @HttpCode(200)
  @RequirePermissions(PermissionCode.achievementReviewDepartment)
  async rejectDepartmentReviewTask(
    @CurrentUser() currentUser: UserContext,
    @Param("taskId", new ParseUUIDPipe({ version: "4" })) taskId: string,
    @Body(rejectWorkflowTaskValidationPipe) dto: RejectWorkflowTaskDto,
  ) {
    try {
      return await this.workflowService.rejectDepartmentReviewTask(
        currentUser,
        taskId,
        dto,
      );
    } catch (error) {
      throw mapWorkflowServiceError(error);
    }
  }
}

const mapWorkflowServiceError = (error: unknown): Error => {
  if (error instanceof WorkflowAccessDeniedError) {
    return new ForbiddenException(error.message);
  }

  if (
    error instanceof WorkflowInvalidStateError ||
    error instanceof InvalidWorkflowTaskTransitionError ||
    error instanceof InvalidWorkflowInstanceTransitionError ||
    error instanceof WorkflowTaskTransitionConflictError ||
    error instanceof WorkflowInstanceTransitionConflictError ||
    error instanceof ActiveWorkflowInstanceAlreadyExistsError
  ) {
    return new ConflictException(error.message);
  }

  if (
    error instanceof WorkflowInvalidPayloadError ||
    error instanceof DepartmentReviewerNotFoundError
  ) {
    return new UnprocessableEntityException(error.message);
  }

  return error instanceof Error ? error : new Error("Unknown workflow service error.");
};
