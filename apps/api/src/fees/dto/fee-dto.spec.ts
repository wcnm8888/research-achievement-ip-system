import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";
import { FeeTypeCode, FundSourceCode, PayStatusCode } from "../domain/fee-domain.types";
import { ChangeFeeStatusDto } from "./change-fee-status.dto";
import { CreateFeeRecordDto } from "./create-fee-record.dto";
import { FeeQueryDto } from "./fee-query.dto";
import { MarkFeePaidDto } from "./mark-fee-paid.dto";
import { ApproveFeeReviewDto, RejectFeeReviewDto } from "./review-fee.dto";
import { UpdateFeeRecordDto } from "./update-fee-record.dto";

const validateDto = async <T extends object>(
  cls: new () => T,
  value: Record<string, unknown>,
) => validate(plainToInstance(cls, value));

describe("CreateFeeRecordDto", () => {
  it("accepts a valid fee record payload", async () => {
    const errors = await validateDto(CreateFeeRecordDto, {
      achievementId: "30000000-0000-4000-8000-000000000001",
      feeType: FeeTypeCode.patentAnnual,
      fundSource: FundSourceCode.department,
      amount: 1200.5,
      dueDate: "2026-07-01",
      voucherNo: "V-2026-001",
    });

    expect(errors).toHaveLength(0);
  });

  it("rejects negative amount and invalid fee type", async () => {
    const errors = await validateDto(CreateFeeRecordDto, {
      achievementId: "30000000-0000-4000-8000-000000000001",
      feeType: "BAD_TYPE",
      amount: -1,
      dueDate: "2026-07-01",
    });

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(["feeType", "amount"]),
    );
  });
});

describe("UpdateFeeRecordDto", () => {
  it("accepts partial fee updates", async () => {
    const errors = await validateDto(UpdateFeeRecordDto, {
      amount: 800,
      fundSource: FundSourceCode.project,
      voucherNo: null,
    });

    expect(errors).toHaveLength(0);
  });
});

describe("MarkFeePaidDto", () => {
  it("accepts paid date and optional voucher number", async () => {
    const errors = await validateDto(MarkFeePaidDto, {
      paidDate: "2026-06-18",
      voucherNo: "PAY-001",
    });

    expect(errors).toHaveLength(0);
  });
});

describe("ChangeFeeStatusDto", () => {
  it("accepts and trims a required reason", async () => {
    const dto = plainToInstance(ChangeFeeStatusDto, {
      reason: "  approved waiver  ",
    });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.reason).toBe("approved waiver");
  });

  it("rejects missing, blank, or overlong reasons", async () => {
    const cases = [{}, { reason: "   " }, { reason: "x".repeat(501) }];

    for (const testCase of cases) {
      const errors = await validateDto(ChangeFeeStatusDto, testCase);
      expect(errors.map((error) => error.property)).toContain("reason");
    }
  });
});

describe("ApproveFeeReviewDto", () => {
  it("accepts an optional trimmed reason", async () => {
    const dto = plainToInstance(ApproveFeeReviewDto, {
      reason: "  finance verified  ",
    });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.reason).toBe("finance verified");
  });

  it("accepts an empty approval body", async () => {
    const errors = await validateDto(ApproveFeeReviewDto, {});

    expect(errors).toHaveLength(0);
  });

  it("rejects blank or overlong approval reasons when provided", async () => {
    const cases = [{ reason: "   " }, { reason: "x".repeat(501) }];

    for (const testCase of cases) {
      const errors = await validateDto(ApproveFeeReviewDto, testCase);
      expect(errors.map((error) => error.property)).toContain("reason");
    }
  });
});

describe("RejectFeeReviewDto", () => {
  it("accepts and trims a required reason", async () => {
    const dto = plainToInstance(RejectFeeReviewDto, {
      reason: "  missing invoice support  ",
    });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.reason).toBe("missing invoice support");
  });

  it("rejects missing, blank, or overlong reasons", async () => {
    const cases = [{}, { reason: "   " }, { reason: "x".repeat(501) }];

    for (const testCase of cases) {
      const errors = await validateDto(RejectFeeReviewDto, testCase);
      expect(errors.map((error) => error.property)).toContain("reason");
    }
  });
});

describe("FeeQueryDto", () => {
  it("accepts department fee filters", async () => {
    const errors = await validateDto(FeeQueryDto, {
      departmentId: "10000000-0000-4000-8000-000000000001",
      feeType: FeeTypeCode.patentAnnual,
      payStatus: PayStatusCode.pending,
      dueDateFrom: "2026-06-01",
      dueDateTo: "2026-12-31",
      includeArchived: false,
      take: 50,
    });

    expect(errors).toHaveLength(0);
  });
});

