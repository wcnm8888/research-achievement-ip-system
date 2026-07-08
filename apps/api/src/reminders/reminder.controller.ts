import {
  ConflictException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { PermissionCode } from "../authorization/constants/permission-code";
import { CurrentUser } from "../authorization/decorators/current-user.decorator";
import { RequirePermissions } from "../authorization/decorators/require-permissions.decorator";
import { PermissionGuard } from "../authorization/guards/permission.guard";
import { UserContextGuard } from "../authorization/guards/user-context.guard";
import { UserContext } from "../identity/user-context";
import {
  ReminderAccessDeniedError,
  ReminderConflictError,
  ReminderInvalidTransitionError,
  ReminderNotFoundError,
} from "./domain/reminder-errors";
import { ReminderService } from "./reminder.service";

@Controller("reminders")
@UseGuards(UserContextGuard, PermissionGuard)
export class ReminderController {
  constructor(
    @Inject(ReminderService)
    private readonly reminderService: ReminderService,
  ) {}

  @Get("center")
  @RequirePermissions(PermissionCode.reminderReadDepartment)
  async getReminderCenter(@CurrentUser() currentUser: UserContext) {
    try {
      return await this.reminderService.getReminderCenter(currentUser);
    } catch (error) {
      throw mapReminderServiceError(error);
    }
  }

  @Get("sla-queue")
  @RequirePermissions(PermissionCode.reminderReadDepartment)
  async getReminderSlaQueue(@CurrentUser() currentUser: UserContext) {
    try {
      return await this.reminderService.listReminderSlaQueue(currentUser);
    } catch (error) {
      throw mapReminderServiceError(error);
    }
  }

  @Get("sla-policy")
  @RequirePermissions(PermissionCode.reminderReadDepartment)
  async getReminderSlaPolicy() {
    return await this.reminderService.getReminderSlaPolicy();
  }

  @Put("sla-policy")
  @RequirePermissions(PermissionCode.systemConfig)
  async updateReminderSlaPolicy(
    @CurrentUser() currentUser: UserContext,
    @Body() body: unknown,
  ) {
    try {
      return await this.reminderService.updateReminderSlaPolicy(
        currentUser,
        body as never,
      );
    } catch (error) {
      throw mapReminderServiceError(error);
    }
  }

  @Get("sla-scan/runs")
  @RequirePermissions(PermissionCode.systemConfig)
  async listReminderSlaScanRuns() {
    return await this.reminderService.listReminderSlaScanRuns();
  }

  @Get("sla-scan/metrics")
  @RequirePermissions(PermissionCode.systemConfig)
  async getReminderSlaScanMetrics() {
    return await this.reminderService.getReminderSlaScanMetrics();
  }

  @Get("sla-scan/health")
  @RequirePermissions(PermissionCode.systemConfig)
  async getReminderSlaScanHealth() {
    return await this.reminderService.getReminderSlaScanHealth();
  }

  @Post("sla-scan/enqueue")
  @HttpCode(200)
  @RequirePermissions(PermissionCode.systemConfig)
  async enqueueReminderSlaScan(
    @CurrentUser() currentUser: UserContext,
    @Body() body: unknown,
  ) {
    try {
      return await this.reminderService.enqueueReminderSlaScan(
        currentUser,
        normalizeSlaScanEnqueueBody(body),
      );
    } catch (error) {
      throw mapReminderServiceError(error);
    }
  }

  @Post("sla-scan/process-next")
  @HttpCode(200)
  @RequirePermissions(PermissionCode.systemConfig)
  async processNextReminderSlaScan(@CurrentUser() currentUser: UserContext) {
    try {
      return await this.reminderService.processNextReminderSlaScan(currentUser);
    } catch (error) {
      throw mapReminderServiceError(error);
    }
  }

  @Post("sla-scan/run")
  @HttpCode(200)
  @RequirePermissions(PermissionCode.reminderReadDepartment)
  async runReminderSlaScan(@CurrentUser() currentUser: UserContext) {
    try {
      return await this.reminderService.runReminderSlaScan(currentUser);
    } catch (error) {
      throw mapReminderServiceError(error);
    }
  }

  @Post("sla-scan/run-all")
  @HttpCode(200)
  @RequirePermissions(PermissionCode.systemConfig)
  async runFullReminderSlaScan(@CurrentUser() currentUser: UserContext) {
    try {
      return await this.reminderService.runFullReminderSlaScan(currentUser);
    } catch (error) {
      throw mapReminderServiceError(error);
    }
  }

  @Get(":id/escalation-history")
  @RequirePermissions(PermissionCode.reminderReadDepartment)
  async getReminderEscalationHistory(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) reminderTaskId: string,
  ) {
    try {
      return await this.reminderService.listReminderEscalationHistory(
        currentUser,
        reminderTaskId,
      );
    } catch (error) {
      throw mapReminderServiceError(error);
    }
  }

  @Post(":id/confirm")
  @HttpCode(200)
  @RequirePermissions(PermissionCode.reminderReadDepartment)
  async confirmReminder(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) reminderTaskId: string,
  ) {
    try {
      return await this.reminderService.confirmReminder(
        currentUser,
        reminderTaskId,
      );
    } catch (error) {
      throw mapReminderServiceError(error);
    }
  }

  @Post(":id/email-reminder")
  @HttpCode(200)
  @RequirePermissions(PermissionCode.reminderReadDepartment)
  async sendReminderEmailReminder(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) reminderTaskId: string,
  ) {
    try {
      return await this.reminderService.sendReminderEmailReminder(
        currentUser,
        reminderTaskId,
      );
    } catch (error) {
      throw mapReminderServiceError(error);
    }
  }

  @Post(":id/escalate")
  @HttpCode(200)
  @RequirePermissions(PermissionCode.reminderReadDepartment)
  async escalateReminder(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) reminderTaskId: string,
  ) {
    try {
      return await this.reminderService.escalateReminder(
        currentUser,
        reminderTaskId,
      );
    } catch (error) {
      throw mapReminderServiceError(error);
    }
  }

  @Post(":id/escalate-to-department")
  @HttpCode(200)
  @RequirePermissions(PermissionCode.reminderReadDepartment)
  async escalateReminderToDepartment(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) reminderTaskId: string,
  ) {
    try {
      return await this.reminderService.escalateReminderToDepartment(
        currentUser,
        reminderTaskId,
      );
    } catch (error) {
      throw mapReminderServiceError(error);
    }
  }
}

const mapReminderServiceError = (error: unknown): Error => {
  if (error instanceof ReminderAccessDeniedError) {
    return new ForbiddenException(error.message);
  }

  if (error instanceof ReminderNotFoundError) {
    return new NotFoundException(error.message);
  }

  if (
    error instanceof ReminderConflictError ||
    error instanceof ReminderInvalidTransitionError
  ) {
    return new ConflictException(error.message);
  }

  return error instanceof Error
    ? error
    : new Error("Unknown reminder service error.");
};

const normalizeSlaScanEnqueueBody = (
  body: unknown,
): { idempotencyKey?: string; triggerType?: "MANUAL" | "API_QUEUE" } => {
  if (!body || typeof body !== "object") {
    return {};
  }

  const record = body as Record<string, unknown>;
  const triggerType =
    record.triggerType === "MANUAL" || record.triggerType === "API_QUEUE"
      ? record.triggerType
      : undefined;

  return {
    idempotencyKey:
      typeof record.idempotencyKey === "string" ? record.idempotencyKey : undefined,
    triggerType,
  };
};
