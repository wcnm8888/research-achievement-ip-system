import {
  ConflictException,
  Controller,
  ForbiddenException,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
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
