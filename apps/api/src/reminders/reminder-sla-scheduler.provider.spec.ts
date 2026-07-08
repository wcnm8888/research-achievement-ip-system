import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createReminderSlaSchedulerConfig,
  ReminderSlaSchedulerProvider,
} from "./reminder-sla-scheduler.provider";
import { ReminderService } from "./reminder.service";

describe("ReminderSlaSchedulerProvider", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the scheduler disabled unless explicitly enabled", () => {
    expect(createReminderSlaSchedulerConfig({})).toEqual({
      enabled: false,
      intervalMs: 15 * 60 * 1000,
    });
    expect(
      createReminderSlaSchedulerConfig({
        REMINDER_SLA_SCHEDULER_ENABLED: "true",
        REMINDER_SLA_SCHEDULER_INTERVAL_MS: "60000",
      }),
    ).toEqual({
      enabled: true,
      intervalMs: 60_000,
    });
  });

  it("enqueues scheduled scans without processing them", async () => {
    const service = {
      enqueueScheduledReminderSlaScan: vi.fn().mockResolvedValue(null),
      processNextReminderSlaScan: vi.fn(),
    } as unknown as ReminderService & {
      enqueueScheduledReminderSlaScan: ReturnType<typeof vi.fn>;
      processNextReminderSlaScan: ReturnType<typeof vi.fn>;
    };
    const provider = new ReminderSlaSchedulerProvider(service, {
      enabled: true,
      intervalMs: 60_000,
    });
    const now = new Date("2026-07-08T00:01:00.000Z");

    await provider.enqueueScheduledScan(now);

    expect(service.enqueueScheduledReminderSlaScan).toHaveBeenCalledWith({
      now,
      idempotencyKey: "scheduled:29724481",
    });
    expect(service.processNextReminderSlaScan).not.toHaveBeenCalled();
  });
});
