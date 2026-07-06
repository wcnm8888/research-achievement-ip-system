import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";
import {
  AchievementConversionContractStatusCode,
  AchievementConversionEvaluationEffectCode,
  AchievementConversionRevenueStatusCode,
  AchievementConversionStatusCode,
  AchievementConversionTypeCode,
} from "../domain/achievement-conversion-domain.types";
import { CreateAchievementConversionDto } from "./create-achievement-conversion.dto";
import { UpdateAchievementConversionDto } from "./update-achievement-conversion.dto";

const validateDto = async <T extends object>(
  cls: new () => T,
  value: Record<string, unknown>,
) => validate(plainToInstance(cls, value), { whitelist: true, forbidNonWhitelisted: true });

describe("Achievement conversion DTO validation", () => {
  it("accepts conversion deepening fields with safe benefit distribution JSON", async () => {
    const errors = await validateDto(CreateAchievementConversionDto, {
      conversionType: AchievementConversionTypeCode.license,
      counterpartyName: "Example Company",
      contractAmount: 100000,
      revenueAmount: 60000,
      status: AchievementConversionStatusCode.signed,
      conversionDate: "2026-07-01",
      contractStatus: AchievementConversionContractStatusCode.active,
      revenueStatus: AchievementConversionRevenueStatusCode.partial,
      revenueDueDate: "2026-08-01",
      revenueReceivedDate: "2026-07-15",
      benefitDistributionJson: [
        {
          category: "TEAM",
          label: "Research team",
          amount: 30000,
          ratio: 0.5,
          note: "Local aggregate allocation",
        },
      ],
      evaluationEffect: AchievementConversionEvaluationEffectCode.positive,
      evaluationSummary: "Local demo evaluation summary",
      evaluationDate: "2026-09-01",
    });

    expect(errors).toHaveLength(0);
  });

  it("rejects invalid deepening enums and date strings", async () => {
    const errors = await validateDto(UpdateAchievementConversionDto, {
      contractStatus: "LEGAL_APPROVED",
      revenueStatus: "BANK_CONFIRMED",
      evaluationEffect: "EXTERNAL_CERTIFIED",
      revenueDueDate: "not-a-date",
      revenueReceivedDate: "2026-99-99",
      evaluationDate: "invalid",
    });
    const properties = errors.map((error) => error.property);

    expect(properties).toEqual(
      expect.arrayContaining([
        "contractStatus",
        "revenueStatus",
        "evaluationEffect",
        "revenueDueDate",
        "revenueReceivedDate",
        "evaluationDate",
      ]),
    );
  });

  it("rejects unsafe benefit distribution JSON shape and oversized arrays", async () => {
    const errors = await validateDto(UpdateAchievementConversionDto, {
      benefitDistributionJson: Array.from({ length: 11 }, (_, index) => ({
        category: index === 0 ? "BANK_ACCOUNT" : "TEAM",
        label: index === 1 ? "" : `Team ${index}`,
        ratio: index === 2 ? 1.5 : 0.01,
        rawPayload: "forbidden",
      })),
    });
    const benefitError = errors.find(
      (error) => error.property === "benefitDistributionJson",
    );

    expect(benefitError).toBeDefined();
  });

  it("requires each benefit distribution row to include amount or ratio", async () => {
    const errors = await validateDto(UpdateAchievementConversionDto, {
      benefitDistributionJson: [
        {
          category: "TEAM",
          label: "Research team",
        },
      ],
    });
    const serialized = JSON.stringify(errors);

    expect(serialized).toContain("amount or ratio");
  });

  it("rejects oversized evaluation summary text", async () => {
    const errors = await validateDto(UpdateAchievementConversionDto, {
      evaluationSummary: "x".repeat(1001),
    });

    expect(errors.some((error) => error.property === "evaluationSummary")).toBe(true);
  });
});
