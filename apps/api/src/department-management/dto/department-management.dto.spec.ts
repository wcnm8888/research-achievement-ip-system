import "reflect-metadata";
import { DepartmentStatus } from "@prisma/client";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";
import {
  CreateDepartmentDto,
  ListDepartmentsQueryDto,
  UpdateDepartmentDto,
} from "./department-management.dto";

const validateDto = async <T extends object>(
  cls: new () => T,
  value: Record<string, unknown>,
) => validate(plainToInstance(cls, value));

describe("DepartmentManagement DTO validation", () => {
  it("accepts list filters", async () => {
    const errors = await validateDto(ListDepartmentsQueryDto, {
      keyword: "research",
      status: DepartmentStatus.ACTIVE,
      parentId: "10000000-0000-4000-8000-000000000001",
      includeArchived: false,
      page: 1,
      pageSize: 100,
    });

    expect(errors).toHaveLength(0);
  });

  it("accepts create department payloads", async () => {
    const errors = await validateDto(CreateDepartmentDto, {
      code: "AI_RESEARCH",
      name: "AI Research",
      parentId: "10000000-0000-4000-8000-000000000001",
    });

    expect(errors).toHaveLength(0);
  });

  it("rejects invalid department code and oversize page", async () => {
    const createErrors = await validateDto(CreateDepartmentDto, {
      code: "bad-code",
      name: "AI Research",
    });
    const queryErrors = await validateDto(ListDepartmentsQueryDto, {
      pageSize: 101,
    });

    expect(createErrors.map((error) => error.property)).toContain("code");
    expect(queryErrors.map((error) => error.property)).toContain("pageSize");
  });

  it("requires at least one update field and never accepts status", async () => {
    const emptyErrors = await validateDto(UpdateDepartmentDto, {});
    const validErrors = await validateDto(UpdateDepartmentDto, { parentId: null });

    expect(emptyErrors.map((error) => error.property)).toContain("updateFieldMarker");
    expect(validErrors).toHaveLength(0);
  });
});
