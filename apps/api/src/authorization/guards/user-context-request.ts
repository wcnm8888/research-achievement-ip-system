import { UserContext } from "../../identity/user-context";

export type RequestHeaders = Record<string, string | string[] | undefined>;

export type UserContextRequest = {
  headers: RequestHeaders;
  userContext?: UserContext;
};

export const getRequestUserContext = (
  request: UserContextRequest,
): UserContext | null => request.userContext ?? null;

export const setRequestUserContext = (
  request: UserContextRequest,
  userContext: UserContext,
): void => {
  request.userContext = userContext;
};
