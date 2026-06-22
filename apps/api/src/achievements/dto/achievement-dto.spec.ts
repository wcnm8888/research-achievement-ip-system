import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";
import {
  AchievementTypeCode,
  ContributorTypeCode,
  PatentTypeCode,
  SecretLevelCode,
  SoftwareTypeCode,
} from "../domain/achievement-domain.types";
import { CreateAchievementDto } from "./create-achievement.dto";
import { UpdateAchievementDto } from "./update-achievement.dto";
import { VoidAchievementDto } from "./achievement-action.dto";

const validContributor = {
  name: "测试作者",
  contributorType: ContributorTypeCode.author,
  sortOrder: 1,
};

const validateDto = async <T extends object>(
  cls: new () => T,
  value: Record<string, unknown>,
) => validate(plainToInstance(cls, value));

describe("CreateAchievementDto", () => {
  it("accepts a paper draft payload with nested detail and contributors", async () => {
    const errors = await validateDto(CreateAchievementDto, {
      type: AchievementTypeCode.paper,
      title: "论文成果",
      secretLevel: SecretLevelCode.internal,
      paperDetail: {
        doi: "10.1234/example",
        journal: "Journal",
        publishYear: 2026,
        impactFactor: 3.2,
      },
      contributors: [validContributor],
    });

    expect(errors).toHaveLength(0);
  });

  it("requires matching detail for paper payloads", async () => {
    const errors = await validateDto(CreateAchievementDto, {
      type: AchievementTypeCode.paper,
      title: "缺少论文详情",
      contributors: [validContributor],
    });

    expect(errors.some((error) => error.property === "paperDetail")).toBe(true);
  });

  it("accepts a patent draft payload", async () => {
    const errors = await validateDto(CreateAchievementDto, {
      type: AchievementTypeCode.patent,
      title: "专利成果",
      patentDetail: {
        applicationNo: "CN 2024-001",
        patentType: PatentTypeCode.invention,
        filingDate: "2026-01-02",
        feeAmount: 1200.5,
      },
      contributors: [
        {
          ...validContributor,
          contributorType: ContributorTypeCode.inventor,
        },
      ],
    });

    expect(errors).toHaveLength(0);
  });

  it("accepts a software copyright draft payload", async () => {
    const errors = await validateDto(CreateAchievementDto, {
      type: AchievementTypeCode.softwareCopyright,
      title: "软著成果",
      softwareCopyrightDetail: {
        registrationNo: "2026SR001",
        softwareType: SoftwareTypeCode.application,
        registerDate: "2026-03-04",
      },
      contributors: [
        {
          ...validContributor,
          contributorType: ContributorTypeCode.copyrightOwner,
        },
      ],
    });

    expect(errors).toHaveLength(0);
  });

  it("rejects empty title and missing contributors", async () => {
    const errors = await validateDto(CreateAchievementDto, {
      type: AchievementTypeCode.paper,
      title: "",
      paperDetail: {},
      contributors: [],
    });

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(["title", "contributors"]),
    );
  });
});

describe("UpdateAchievementDto", () => {
  it("allows partial draft updates without status or identity fields", async () => {
    const errors = await validateDto(UpdateAchievementDto, {
      title: "更新后的标题",
      secretLevel: SecretLevelCode.public,
      paperDetail: {
        journal: "Updated Journal",
      },
    });

    expect(errors).toHaveLength(0);
  });

  it("rejects invalid nested detail fields", async () => {
    const errors = await validateDto(UpdateAchievementDto, {
      patentDetail: {
        feeAmount: -1,
      },
    });

    expect(errors.some((error) => error.property === "patentDetail")).toBe(true);
  });
});

describe("VoidAchievementDto", () => {
  it("requires a non-empty void reason", async () => {
    const errors = await validateDto(VoidAchievementDto, { reason: "" });

    expect(errors.some((error) => error.property === "reason")).toBe(true);
  });
});
