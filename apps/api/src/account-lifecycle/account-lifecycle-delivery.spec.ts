import { AccountLifecycleDeliveryStatus, AccountLifecycleTokenPurpose } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  AccountLifecycleDeliveryAdapter,
  AccountLifecycleDeliveryInput,
  normalizeAccountLifecycleProviderResult,
  normalizeProviderMessageId,
} from "./account-lifecycle-delivery";

describe("account lifecycle delivery adapter contract", () => {
  it("runs a fake provider dry run without persisting raw token or full URL", async () => {
    const sentInputs: AccountLifecycleDeliveryInput[] = [];
    const fakeAdapter: AccountLifecycleDeliveryAdapter = {
      send: async (input) => {
        sentInputs.push(input);
        return {
          status: "ACCEPTED",
          adapter: "LOCAL_FAKE_PROVIDER",
          providerMessageId: "fake-message-001",
        };
      },
    };

    const input = makeDeliveryInput();
    const result = normalizeAccountLifecycleProviderResult(await fakeAdapter.send(input));

    expect(result).toEqual({
      deliveryStatus: AccountLifecycleDeliveryStatus.SENT,
      adapter: "LOCAL_FAKE_PROVIDER",
      providerMessageId: "fake-message-001",
      failureCategory: undefined,
    });
    expect(sentInputs).toHaveLength(1);

    const persistedProjection = JSON.stringify({
      tokenId: input.tokenId,
      emailHash: input.emailHash,
      adapter: result.adapter,
      providerMessageId: result.providerMessageId,
      deliveryStatus: result.deliveryStatus,
      correlationId: input.correlationId,
    });
    expect(persistedProjection).not.toContain(input.rawToken);
    expect(persistedProjection).not.toContain(input.recipientEmail);
    expect(persistedProjection).not.toContain(input.publicBaseUrl);
    expect(persistedProjection).not.toContain("reset-password?token=");
  });

  it("maps failed, suppressed, and rate-limited provider results to safe statuses", () => {
    expect(
      normalizeAccountLifecycleProviderResult({
        status: "FAILED",
        adapter: "LOCAL_FAKE_PROVIDER",
        failureCategory: "PERMANENT",
      }),
    ).toEqual({
      deliveryStatus: AccountLifecycleDeliveryStatus.FAILED,
      adapter: "LOCAL_FAKE_PROVIDER",
      providerMessageId: undefined,
      failureCategory: "PERMANENT",
    });

    expect(
      normalizeAccountLifecycleProviderResult({
        status: "SUPPRESSED",
        adapter: "LOCAL_FAKE_PROVIDER",
        failureCategory: "SUPPRESSED",
      }).deliveryStatus,
    ).toBe(AccountLifecycleDeliveryStatus.SUPPRESSED);

    expect(
      normalizeAccountLifecycleProviderResult({
        status: "RATE_LIMITED",
        adapter: "LOCAL_FAKE_PROVIDER",
        failureCategory: "RATE_LIMITED",
      }).deliveryStatus,
    ).toBe(AccountLifecycleDeliveryStatus.QUEUED);
  });

  it("drops unsafe provider message ids instead of exposing sensitive material", () => {
    expect(normalizeProviderMessageId("provider-message-123")).toBe("provider-message-123");
    expect(normalizeProviderMessageId("user@example.invalid")).toBeUndefined();
    expect(normalizeProviderMessageId("https://provider.invalid/messages/123")).toBeUndefined();
    expect(normalizeProviderMessageId("token=raw-lifecycle-token")).toBeUndefined();
    expect(normalizeProviderMessageId("cookie=research_ip_session")).toBeUndefined();
  });
});

const makeDeliveryInput = (): AccountLifecycleDeliveryInput => ({
  deliveryId: "80000000-0000-4000-8000-000000000001",
  tokenId: "70000000-0000-4000-8000-000000000001",
  purpose: AccountLifecycleTokenPurpose.PASSWORD_RESET_SELF,
  template: "PASSWORD_RESET",
  targetUserId: "40000000-0000-4000-8000-000000000002",
  emailHash: "email-hash:target",
  recipientEmail: "target@example.invalid",
  expiresAt: new Date("2026-06-27T12:00:00.000Z"),
  rawToken: "raw-lifecycle-token",
  publicBaseUrl: "https://app.example.invalid",
  correlationId: "corr-step47f",
});
