import { DashboardRequestOptions } from "./dashboard-domain.types";

export const defaultDashboardDueSoonDays = 30;
export const minDashboardDueSoonDays = 1;
export const maxDashboardDueSoonDays = 90;

export type NormalizedDashboardOptions = {
  today: Date;
  dueSoonDays: number;
};

export const normalizeDashboardOptions = (
  options: DashboardRequestOptions = {},
): NormalizedDashboardOptions => ({
  today: cloneDate(options.today ?? new Date()),
  dueSoonDays: normalizeDueSoonDays(options.dueSoonDays),
});

export const normalizeDueSoonDays = (value: number | undefined): number => {
  if (value === undefined) {
    return defaultDashboardDueSoonDays;
  }

  if (!Number.isInteger(value)) {
    throw new RangeError("Dashboard due-soon days must be an integer.");
  }

  if (value < minDashboardDueSoonDays || value > maxDashboardDueSoonDays) {
    throw new RangeError(
      `Dashboard due-soon days must be between ${minDashboardDueSoonDays} and ${maxDashboardDueSoonDays}.`,
    );
  }

  return value;
};

const cloneDate = (value: Date): Date => new Date(value.getTime());
