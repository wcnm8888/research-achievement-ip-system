import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Server } from "node:http";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { AppModule } from "../app.module";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { PrismaService } from "../database/prisma.service";
import { IDENTITY_ADAPTER } from "../identity/identity-adapter.token";
import { UserContext } from "../identity/user-context";
import {
  FeeReviewStatusCode,
  FeeTypeCode,
  FeeWarningTypeCode,
  FundSourceCode,
  PayStatusCode,
} from "./domain/fee-domain.types";
import { FeeService } from "./fee.service";

const ids = {
  achievement: "30000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  feeRecord: "80000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000001",
};

type FeeServiceMock = {
  listFees: ReturnType<typeof vi.fn>;
  getFeeWarnings: ReturnType<typeof vi.fn>;
  getFee: ReturnType<typeof vi.fn>;
  createFee: ReturnType<typeof vi.fn>;
  markFeePaid: ReturnType<typeof vi.fn>;
  waiveFee: ReturnType<typeof vi.fn>;
  cancelFee: ReturnType<typeof vi.fn>;
  archiveFee: ReturnType<typeof vi.fn>;
  approveFeeReview: ReturnType<typeof vi.fn>;
  rejectFeeReview: ReturnType<typeof vi.fn>;
};

type TestCallback = (
  app: INestApplication,
  service: FeeServiceMock,
  identityAdapter: { loadUserContext: ReturnType<typeof vi.fn> },
) => Promise<void>;

const makeUserContext = (
  permissions: readonly PermissionCode[],
): UserContext => ({
  userId: ids.user,
  departmentId: ids.department,
  roleIds: [ids.role],
  roleCodes: [RoleCode.researcher],
  permissionCodes: permissions,
  roleScopes: [
    {
      roleCode: RoleCode.researcher,
      scopeType: ScopeType.department,
      scopeKey: ids.department,
      departmentId: ids.department,
    },
  ],
  scopedDepartmentIds: [ids.department],
});

const makeFeeRecord = () => ({
  id: ids.feeRecord,
  achievementId: ids.achievement,
  departmentId: ids.department,
  feeType: FeeTypeCode.patentAnnual,
  fundSource: FundSourceCode.department,
  amount: 1200,
  dueDate: new Date("2026-07-01T00:00:00.000Z"),
  paidDate: null,
  payStatus: PayStatusCode.pending,
  voucherNo: null,
  reviewStatus: FeeReviewStatusCode.pending,
  reviewedById: null,
  reviewedAt: null,
  createdById: ids.user,
  updatedById: ids.user,
  createdAt: new Date("2026-06-01T00:00:00.000Z"),
  updatedAt: new Date("2026-06-01T00:00:00.000Z"),
  archivedAt: null,
});

const makePaidFeeState = () => ({
  id: ids.feeRecord,
  achievementId: ids.achievement,
  departmentId: ids.department,
  feeType: FeeTypeCode.patentAnnual,
  dueDate: new Date("2026-07-01T00:00:00.000Z"),
  paidDate: new Date("2026-06-18T00:00:00.000Z"),
  payStatus: PayStatusCode.paid,
  voucherNo: "VOUCHER-001",
  reviewStatus: FeeReviewStatusCode.pending,
  reviewedById: null,
  reviewedAt: null,
  updatedById: ids.user,
  archivedAt: null,
});

const makeFeeWarningSummary = () => ({
  generatedAt: new Date("2026-06-18T00:00:00.000Z"),
  today: "2026-06-18",
  dueSoonDays: 30,
  total: 1,
  overdueCount: 0,
  dueSoonCount: 1,
  items: [
    {
      ...makeFeeRecord(),
      warningType: FeeWarningTypeCode.dueSoon,
      daysUntilDue: 13,
    },
  ],
});

const makeTerminalFeeState = (payStatus: PayStatusCode) => ({
  id: ids.feeRecord,
  achievementId: ids.achievement,
  departmentId: ids.department,
  feeType: FeeTypeCode.patentAnnual,
  dueDate: new Date("2026-07-01T00:00:00.000Z"),
  paidDate: payStatus === PayStatusCode.paid
    ? new Date("2026-06-18T00:00:00.000Z")
    : null,
  payStatus,
  voucherNo: payStatus === PayStatusCode.paid ? "VOUCHER-001" : null,
  reviewStatus: FeeReviewStatusCode.pending,
  reviewedById: null,
  reviewedAt: null,
  updatedById: ids.user,
  archivedAt: null,
});

const makeReviewedFeeState = (reviewStatus: FeeReviewStatusCode) => ({
  id: ids.feeRecord,
  achievementId: ids.achievement,
  departmentId: ids.department,
  feeType: FeeTypeCode.patentAnnual,
  dueDate: new Date("2026-07-01T00:00:00.000Z"),
  paidDate: null,
  payStatus: PayStatusCode.pending,
  voucherNo: null,
  reviewStatus,
  reviewedById: ids.user,
  reviewedAt: new Date("2026-06-19T00:00:00.000Z"),
  updatedById: ids.user,
  archivedAt: null,
});

const makeCreatePayload = () => ({
  achievementId: ids.achievement,
  feeType: FeeTypeCode.patentAnnual,
  fundSource: FundSourceCode.department,
  amount: 1200,
  dueDate: "2026-07-01T00:00:00.000Z",
});

const createServiceMock = (): FeeServiceMock => ({
  listFees: vi.fn().mockResolvedValue([makeFeeRecord()]),
  getFeeWarnings: vi.fn().mockResolvedValue(makeFeeWarningSummary()),
  getFee: vi.fn().mockResolvedValue(makeFeeRecord()),
  createFee: vi.fn().mockResolvedValue(makeFeeRecord()),
  markFeePaid: vi.fn().mockResolvedValue(makePaidFeeState()),
  waiveFee: vi.fn().mockResolvedValue(makeTerminalFeeState(PayStatusCode.waived)),
  cancelFee: vi.fn().mockResolvedValue(makeTerminalFeeState(PayStatusCode.cancelled)),
  archiveFee: vi.fn().mockResolvedValue({
    ...makeFeeRecord(),
    archivedAt: new Date("2026-06-20T00:00:00.000Z"),
  }),
  approveFeeReview: vi
    .fn()
    .mockResolvedValue(makeReviewedFeeState(FeeReviewStatusCode.approved)),
  rejectFeeReview: vi
    .fn()
    .mockResolvedValue(makeReviewedFeeState(FeeReviewStatusCode.rejected)),
});

describe("Fee routes through AppModule", () => {
  it("keeps the health route available after fees module integration", async () => {
    await withAppModule(null, async (app) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/health")
        .expect(200);

      expect(response.body).toEqual({
        service: "research-achievement-ip-api",
        status: "ok",
      });
    });
  });

  it("exposes fee read routes through AppModule", async () => {
    await withAppModule([PermissionCode.feeReadDepartment], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/fees")
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      await request(app.getHttpServer() as Server)
        .get(`/fees/${ids.feeRecord}`)
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      expect(service.listFees).toHaveBeenCalledOnce();
      expect(service.getFee).toHaveBeenCalledOnce();
    });
  });

  it("exposes fee warnings through AppModule", async () => {
    await withAppModule([PermissionCode.feeReadDepartment], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/fees/warnings")
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.items[0].warningType).toBe(FeeWarningTypeCode.dueSoon);
      expect(service.getFeeWarnings).toHaveBeenCalledOnce();
      expect(service.listFees).not.toHaveBeenCalled();
      expect(service.getFee).not.toHaveBeenCalled();
      expect(service.createFee).not.toHaveBeenCalled();
      expect(service.markFeePaid).not.toHaveBeenCalled();
    });
  });

  it("exposes fee write routes through AppModule", async () => {
    await withAppModule([PermissionCode.feeManageDepartment], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post("/fees")
        .set("X-Demo-User-Id", ids.user)
        .send(makeCreatePayload())
        .expect(201);

      await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/mark-paid`)
        .set("X-Demo-User-Id", ids.user)
        .send({ paidDate: "2026-06-18T00:00:00.000Z", voucherNo: "VOUCHER-001" })
        .expect(200);

      await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/waive`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "policy exemption" })
        .expect(200);

      await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/cancel`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "duplicate fee record" })
        .expect(200);

      await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/archive`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "local soft archive" })
        .expect(200);

      expect(service.createFee).toHaveBeenCalledOnce();
      expect(service.markFeePaid).toHaveBeenCalledOnce();
      expect(service.waiveFee).toHaveBeenCalledOnce();
      expect(service.cancelFee).toHaveBeenCalledOnce();
      expect(service.archiveFee).toHaveBeenCalledOnce();
    });
  });

  it("exposes fee review routes through AppModule", async () => {
    await withAppModule([PermissionCode.feeReviewDepartment], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/review/approve`)
        .set("X-Demo-User-Id", ids.user)
        .send({})
        .expect(200);

      await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/review/reject`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "missing support" })
        .expect(200);

      expect(service.approveFeeReview).toHaveBeenCalledOnce();
      expect(service.rejectFeeReview).toHaveBeenCalledOnce();
    });
  });

  it("returns 401 through AppModule when user context is missing", async () => {
    await withAppModule(null, async (app, service, identityAdapter) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/fees")
        .expect(401);

      expect(response.body.message).toBe("User context is required.");
      expect(identityAdapter.loadUserContext).toHaveBeenCalledOnce();
      expect(service.listFees).not.toHaveBeenCalled();
    });
  });

  it("returns 403 through AppModule when static read permission is missing", async () => {
    await withAppModule([], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/fees")
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      expect(response.body.message).toBe("Required permissions are missing.");
      expect(service.listFees).not.toHaveBeenCalled();
    });
  });

  it("keeps fee write routes protected from read-only users", async () => {
    await withAppModule([PermissionCode.feeReadDepartment], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post("/fees")
        .set("X-Demo-User-Id", ids.user)
        .send(makeCreatePayload())
        .expect(403);

      await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/mark-paid`)
        .set("X-Demo-User-Id", ids.user)
        .send({ paidDate: "2026-06-18T00:00:00.000Z" })
        .expect(403);

      await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/waive`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "policy exemption" })
        .expect(403);

      await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/cancel`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "duplicate fee record" })
        .expect(403);

      await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/archive`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "local soft archive" })
        .expect(403);

      expect(service.createFee).not.toHaveBeenCalled();
      expect(service.markFeePaid).not.toHaveBeenCalled();
      expect(service.waiveFee).not.toHaveBeenCalled();
      expect(service.cancelFee).not.toHaveBeenCalled();
      expect(service.archiveFee).not.toHaveBeenCalled();
    });
  });

  it("keeps fee review routes protected from manage-only users", async () => {
    await withAppModule([PermissionCode.feeManageDepartment], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/review/approve`)
        .set("X-Demo-User-Id", ids.user)
        .send({})
        .expect(403);

      await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/review/reject`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "missing support" })
        .expect(403);

      expect(service.approveFeeReview).not.toHaveBeenCalled();
      expect(service.rejectFeeReview).not.toHaveBeenCalled();
    });
  });
});

const withAppModule = async (
  permissions: readonly PermissionCode[] | null,
  callback: TestCallback,
): Promise<void> => {
  let app: INestApplication | null = null;
  const service = createServiceMock();
  const identityAdapter = {
    loadUserContext: vi.fn().mockResolvedValue(
      permissions === null ? null : makeUserContext(permissions),
    ),
  };

  try {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FeeService)
      .useValue(service)
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(IDENTITY_ADAPTER)
      .useValue(identityAdapter)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await callback(app, service, identityAdapter);
  } finally {
    if (app) {
      await app.close();
    }
  }
};
