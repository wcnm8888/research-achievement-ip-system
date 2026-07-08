import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ReportsService } from "./reports.service";

export type ScheduledReportEmailSchedulerConfig = {
  enabled: boolean;
  intervalMs: number;
};

export const SCHEDULED_REPORT_EMAIL_SCHEDULER_CONFIG = Symbol(
  "SCHEDULED_REPORT_EMAIL_SCHEDULER_CONFIG",
);

const defaultIntervalMs = 60 * 60 * 1000;
const minimumIntervalMs = 60 * 1000;

@Injectable()
export class ScheduledReportEmailSchedulerProvider implements OnModuleInit, OnModuleDestroy {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(ReportsService)
    private readonly reportsService: ReportsService,
    @Inject(SCHEDULED_REPORT_EMAIL_SCHEDULER_CONFIG)
    private readonly config: ScheduledReportEmailSchedulerConfig,
  ) {}

  onModuleInit(): void {
    if (!this.config.enabled) {
      return;
    }

    this.timer = setInterval(() => {
      void this.runScheduledTick();
    }, Math.max(this.config.intervalMs, minimumIntervalMs));
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async runScheduledTick(now = new Date()): Promise<void> {
    await this.reportsService.sendDueScheduledReportEmails({ now });
  }
}

export const createScheduledReportEmailSchedulerConfig = (
  env: Record<string, string | undefined>,
): ScheduledReportEmailSchedulerConfig => ({
  enabled: env.REPORT_EMAIL_SCHEDULER_ENABLED === "true",
  intervalMs: parseSchedulerInterval(env.REPORT_EMAIL_SCHEDULER_INTERVAL_MS),
});

const parseSchedulerInterval = (value: string | undefined): number => {
  if (!value) {
    return defaultIntervalMs;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= minimumIntervalMs
    ? parsed
    : defaultIntervalMs;
};
