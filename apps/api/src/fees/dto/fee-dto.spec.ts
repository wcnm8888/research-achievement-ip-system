import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";
import { FeeTypeCode, FundSourceCode, PayStatusCode } from "../domain/fee-domain.types";
import { CreateFeeRecordDto } from "./create-fee-record.dto";
import { FeeQueryDto } from "./fee-query.dto";
import { MarkFeePaidDto } from "./mark-fee-paid.dto";
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

