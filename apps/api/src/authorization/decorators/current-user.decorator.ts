import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { UserContext } from "../../identity/user-context";
import {
  getRequestUserContext,
  UserContextRequest,
} from "../guards/user-context-request";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UserContext | null => {
    const request = context.switchToHttp().getRequest<UserContextRequest>();
    return getRequestUserContext(request);
  },
);
