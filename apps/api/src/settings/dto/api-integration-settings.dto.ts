import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  Validate,
  ValidateIf,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import { ApiIntegrationProvider } from "@prisma/client";

const integrationCodePattern = /^[A-Z0-9_:-]+$/;
const configRefPattern = /^[A-Za-z0-9_.:/-]+$/;

export class ListApiIntegrationsQueryDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  keyword?: string;

  @IsOptional()
  @IsEnum(ApiIntegrationProvider)
  provider?: ApiIntegrationProvider;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeArchived?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class CreateApiIntegrationDto {
  @IsString()
  @Length(1, 100)
  @Matches(integrationCodePattern)
  code!: string;

  @IsEnum(ApiIntegrationProvider)
  provider!: ApiIntegrationProvider;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(120000)
  timeoutMs?: number;

  @ValidateIf(
    (_dto: CreateApiIntegrationDto, value) => value !== null && value !== undefined,
  )
  @IsString()
  @Length(1, 255)
  @Matches(configRefPattern)
  configRef?: string | null;
}

@ValidatorConstraint({ name: "apiIntegrationUpdateHasField", async: false })
class ApiIntegrationUpdateHasFieldConstraint
  implements ValidatorConstraintInterface
{
  validate(_value: unknown, args: ValidationArguments): boolean {
    const dto = args.object as UpdateApiIntegrationDto;
    return (
      dto.code !== undefined ||
      dto.provider !== undefined ||
      dto.enabled !== undefined ||
      dto.timeoutMs !== undefined ||
      dto.configRef !== undefined
    );
  }

  defaultMessage(): string {
    return "At least one api integration update field is required.";
  }
}

export class UpdateApiIntegrationDto {
  @Validate(ApiIntegrationUpdateHasFieldConstraint)
  private readonly updateFieldMarker?: never;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(integrationCodePattern)
  code?: string;

  @IsOptional()
  @IsEnum(ApiIntegrationProvider)
  provider?: ApiIntegrationProvider;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(120000)
  timeoutMs?: number;

  @ValidateIf(
    (_dto: UpdateApiIntegrationDto, value) => value !== null && value !== undefined,
  )
  @IsString()
  @Length(1, 255)
  @Matches(configRefPattern)
  configRef?: string | null;
}

export class ApiIntegrationReasonDto {
  @ValidateIf(
    (_dto: ApiIntegrationReasonDto, value) => value !== null && value !== undefined,
  )
  @IsString()
  @Length(1, 300)
  reason?: string | null;
}

export enum ApiIntegrationMockScenario {
  doiLookup = "DOI_LOOKUP",
  patentStatusSync = "PATENT_STATUS_SYNC",
  financeReconcile = "FINANCE_RECONCILE",
  hrSync = "HR_SYNC",
}

export enum ApiIntegrationMockResultMode {
  success = "SUCCESS",
  failure = "FAILURE",
  degraded = "DEGRADED",
}

export class RunApiIntegrationMockDemoDto {
  @IsEnum(ApiIntegrationProvider)
  provider!: ApiIntegrationProvider;

  @IsEnum(ApiIntegrationMockScenario)
  scenario!: ApiIntegrationMockScenario;

  @IsEnum(ApiIntegrationMockResultMode)
  resultMode!: ApiIntegrationMockResultMode;
}

export class ListApiCallLogsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export type ApiIntegrationResponseDto = {
  id: string;
  code: string;
  provider: ApiIntegrationProvider;
  enabled: boolean;
  timeoutMs: number;
  configRef: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  archivedAt: Date | string | null;
};

export type ApiCallLogSummaryDto = {
  integrationCode: string;
  requestId: string;
  status: string;
  durationMs: number | null;
  errorSummary: string | null;
  createdAt: Date | string;
};
