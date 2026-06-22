import { UserContext } from "./user-context";

export type IdentityHeaders = Record<string, string | string[] | undefined>;

export type IdentityRequest = {
  headers: IdentityHeaders;
  environment?: string;
};

export interface IdentityAdapter {
  loadUserContext(request: IdentityRequest): Promise<UserContext | null>;
}
