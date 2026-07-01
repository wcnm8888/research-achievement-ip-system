import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";
import {
  WorkflowTargetTypeCode,
  WorkflowTaskStatusCode,
} from "../domain/workflow-domain.types";
import { ApproveWorkflowTaskDto, RejectWorkflowTaskDto } from "./workflow-action.dto";
import { WorkflowTaskQueryDto } from "./workflow-task-query.dto";

const validateDto = async <T extends object>(
  cls: new () => T,
  value: Record<string, unknown>,
) => validate(plainToInstance(cls, value));

describe("ApproveWorkflowTaskDto", () => {
  it("accepts optional comments", async () => {
    await expect(validateDto(ApproveWorkflowTaskDto, {})).resolves.toHaveLength(0);
    await expect(
      validateDto(ApproveWorkflowTaskDto, { comment: "Looks good." }),
    ).resolves.toHaveLength(0);
  });

  it("rejects blank comments when comment is provided", async () => {
    const errors = await validateDto(ApproveWorkflowTaskDto, { comment: "" });

    expect(errors.some((error) => error.property === "comment")).toBe(true);
  });
});

describe("RejectWorkflowTaskDto", () => {
  it("requires a non-empty rejection comment", async () => {
    const errors = await validateDto(RejectWorkflowTaskDto, { comment: "" });

    expect(errors.some((error) => error.property === "comment")).toBe(true);
  });

  it("accepts a rejection comment", async () => {
    await expect(
      validateDto(RejectWorkflowTaskDto, { comment: "Missing required fields." }),
    ).resolves.toHaveLength(0);
  });
});

describe("WorkflowTaskQueryDto", () => {
  it("accepts task status and achievement id filters", async () => {
    await expect(
      validateDto(WorkflowTaskQueryDto, {
        status: WorkflowTaskStatusCode.pending,
        achievementId: "30000000-0000-4000-8000-000000000001",
      }),
    ).resolves.toHaveLength(0);
  });

  it("accepts fee record target filters", async () => {
    await expect(
      validateDto(WorkflowTaskQueryDto, {
        targetType: WorkflowTargetTypeCode.feeRecord,
        feeRecordId: "80000000-0000-4000-8000-000000000001",
      }),
    ).resolves.toHaveLength(0);
  });

  it("rejects invalid status filters", async () => {
    const errors = await validateDto(WorkflowTaskQueryDto, { status: "OPEN" });

    expect(errors.some((error) => error.property === "status")).toBe(true);
  });
});
