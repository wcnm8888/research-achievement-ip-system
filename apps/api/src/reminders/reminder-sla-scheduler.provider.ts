import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ReminderService } from "./reminder.service";

export type ReminderSlaSchedulerConfig = {
  enabled: boolean;
  intervalMs: number;
};

export const REMINDER_SLA_SCHEDULER_CONFIG = Symbol(
  "REMINDER_SLA_SCHEDULER_CONFIG",
);

const defaultIntervalMs = 15 * 60 * 1000;
const minimumIntervalMs = 60 * 1000;

@Injectable()
export class ReminderSlaSchedulerProvider implements OnModuleInit, OnModuleDestroy {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(ReminderService)
    private readonly reminderService: ReminderService,
    @Inject(REMINDER_SLA_SCHEDULER_CONFIG)
    private readonly config: ReminderSlaSchedulerConfig,
  ) {}

  onModuleInit(): void {
    if (!this.config.enabled) {
      return;
    }

    const intervalMs = Math.max(this.config.intervalMs, minimumIntervalMs);
    this.timer = setInterval(() => {
      void this.enqueueScheduledScan();
    }, intervalMs);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async enqueueScheduledScan(now = new Date()): Promise<void> {
    const intervalBucket = Math.floor(now.getTime() / Math.max(this.config.intervalMs, minimumIntervalMs));
    await this.reminderService.enqueueScheduledReminderSlaScan({
      now,
      idempotencyKey: `scheduled:${intervalBucket}`,
    });
  }
}

export const createReminderSlaSchedulerConfig = (
  env: Record<string, string | undefined>,
): ReminderSlaSchedulerConfig => ({
  enabled: env.REMINDER_SLA_SCHEDULER_ENABLED === "true",
  intervalMs: parseSchedulerInterval(env.REMINDER_SLA_SCHEDULER_INTERVAL_MS),
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
