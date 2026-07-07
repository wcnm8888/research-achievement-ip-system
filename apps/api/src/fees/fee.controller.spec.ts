import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Server } from "node:http";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { IDENTITY_ADAPTER } from "../identity/identity-adapter.token";
import { UserContext } from "../identity/user-context";
import { PrismaService } from "../database/prisma.service";
import {
  FeeReviewStatusCode,
  FeeTypeCode,
  FeeWarningTypeCode,
  FundSourceCode,
  PayStatusCode,
} from "./domain/fee-domain.types";
import {
  FeeAccessDeniedError,
  FeeConflictError,
  FeeInvalidTransitionError,
  FeeNotFoundError,
  FeePermissionDeniedError,
} from "./domain/fee-service.errors";
import { FeeService } from "./fee.service";
import { FeesModule } from "./fees.module";

const ids = {
  achievement: "30000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  feeRecord: "80000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000001",
};

type FeeServiceMock = {
  listFees: ReturnType<typeof vi.fn>;
  exportCsv: ReturnType<typeof vi.fn>;
  getFeeWarnings: ReturnType<typeof vi.fn>;
  listFeeReviewHistory: ReturnType<typeof vi.fn>;
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
      scopeType: ScopeType.global,
      scopeKey: "GLOBAL",
      departmentId: null,
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

const makeFeeReviewHistory = () => [
  {
    id: "81000000-0000-4000-8000-000000000001",
    feeRecordId: ids.feeRecord,
    departmentId: ids.department,
    reviewerId: ids.user,
    action: "APPROVE",
    fromStatus: FeeReviewStatusCode.pending,
    toStatus: FeeReviewStatusCode.approved,
    reason: "finance checked",
    createdAt: new Date("2026-06-19T00:00:00.000Z"),
  },
];

const makeCreatePayload = () => ({
  achievementId: ids.achievement,
  feeType: FeeTypeCode.patentAnnual,
  fundSource: FundSourceCode.department,
  amount: 1200,
  dueDate: "2026-07-01T00:00:00.000Z",
});

const createServiceMock = (): FeeServiceMock => ({
  listFees: vi.fn().mockResolvedValue([makeFeeRecord()]),
  exportCsv: vi.fn().mockResolvedValue("ID,Amount\r\nfee-1,1200\r\n"),
  getFeeWarnings: vi.fn().mockResolvedValue(makeFeeWarningSummary()),
  listFeeReviewHistory: vi.fn().mockResolvedValue(makeFeeReviewHistory()),
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

describe("FeeController HTTP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no user context is loaded", async () => {
    await withTestApp(null, async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/fees")
        .expect(401);

      expect(response.body.message).toBe("User context is required.");
      expect(service.listFees).not.toHaveBeenCalled();
    });
  });

  it("returns 403 when fee read permission is missing", async () => {
    await withTestApp([], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/fees")
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      expect(response.body.message).toBe("Required permissions are missing.");
      expect(service.listFees).not.toHaveBeenCalled();
    });
  });

  it("returns 403 when fee manage permission is missing", async () => {
    await withTestApp([PermissionCode.feeReadDepartment], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post("/fees")
        .set("X-Demo-User-Id", ids.user)
        .send(makeCreatePayload())
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
        .send({ reason: "local archive" })
        .expect(403);

      expect(service.createFee).not.toHaveBeenCalled();
      expect(service.waiveFee).not.toHaveBeenCalled();
      expect(service.cancelFee).not.toHaveBeenCalled();
      expect(service.archiveFee).not.toHaveBeenCalled();
    });
  });

  it("returns 403 when fee review permission is missing", async () => {
    await withTestApp([PermissionCode.feeManageDepartment], async (app, service) => {
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

  it("lists fees with fee:read_department and validated query", async () => {
    await withTestApp([PermissionCode.feeReadDepartment], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/fees")
        .set("X-Demo-User-Id", ids.user)
        .query({
          achievementId: ids.achievement,
          feeType: FeeTypeCode.patentAnnual,
          payStatus: PayStatusCode.pending,
          take: "5",
        })
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(service.listFees).toHaveBeenCalledWith(
        expect.objectContaining<Partial<UserContext>>({
          userId: ids.user,
          departmentId: ids.department,
        }),
        expect.objectContaining({
          achievementId: ids.achievement,
          feeType: FeeTypeCode.patentAnnual,
          payStatus: PayStatusCode.pending,
          take: 5,
        }),
      );
    });
  });

  it("exports fees as CSV with fee:read_department and validated filters", async () => {
    await withTestApp([PermissionCode.feeReadDepartment], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/fees/export.csv")
        .set("X-Demo-User-Id", ids.user)
        .query({
          achievementId: ids.achievement,
          feeType: FeeTypeCode.patentAnnual,
          payStatus: PayStatusCode.pending,
        })
        .expect(200);

      expect(response.headers["content-type"]).toContain("text/csv");
      expect(response.headers["content-disposition"]).toContain("fees.csv");
      expect(response.text).toBe("ID,Amount\r\nfee-1,1200\r\n");
      expect(service.exportCsv).toHaveBeenCalledWith(
        expect.objectContaining<Partial<UserContext>>({
          userId: ids.user,
          departmentId: ids.department,
        }),
        expect.objectContaining({
          achievementId: ids.achievement,
          feeType: FeeTypeCode.patentAnnual,
          payStatus: PayStatusCode.pending,
        }),
      );
      expect(service.getFee).not.toHaveBeenCalled();
    });
  });

  it("reads fee detail with fee:read_department", async () => {
    await withTestApp([PermissionCode.feeReadDepartment], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get(`/fees/${ids.feeRecord}`)
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      expect(service.getFee).toHaveBeenCalledWith(expect.any(Object), ids.feeRecord);
    });
  });

  it("reads fee review history through the service permission boundary", async () => {
    await withTestApp([PermissionCode.feeReviewDepartment], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/fees/${ids.feeRecord}/review-history`)
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      expect(service.listFeeReviewHistory).toHaveBeenCalledWith(
        expect.objectContaining<Partial<UserContext>>({
          userId: ids.user,
          departmentId: ids.department,
        }),
        ids.feeRecord,
      );
      expect(response.body).toEqual([
        expect.objectContaining({
          feeRecordId: ids.feeRecord,
          departmentId: ids.department,
          reviewerId: ids.user,
          action: "APPROVE",
          fromStatus: FeeReviewStatusCode.pending,
          toStatus: FeeReviewStatusCode.approved,
          reason: "finance checked",
        }),
      ]);
      expectHistoryHasNoSensitiveFeeFields(response.body);
    });
  });

  it("maps fee review history service denials to 403 and 404", async () => {
    await withTestApp([], async (app, service) => {
      service.listFeeReviewHistory.mockRejectedValueOnce(
        new FeePermissionDeniedError(PermissionCode.feeReviewDepartment),
      );

      await request(app.getHttpServer() as Server)
        .get(`/fees/${ids.feeRecord}/review-history`)
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      service.listFeeReviewHistory.mockRejectedValueOnce(new FeeNotFoundError());

      await request(app.getHttpServer() as Server)
        .get(`/fees/${ids.feeRecord}/review-history`)
        .set("X-Demo-User-Id", ids.user)
        .expect(404);
    });
  });

  it("does not expose a standalone review history creation route", async () => {
    await withTestApp([PermissionCode.feeReviewDepartment], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/review-history`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "manual insert" })
        .expect(404);

      expect(service.listFeeReviewHistory).not.toHaveBeenCalled();
      expect(service.approveFeeReview).not.toHaveBeenCalled();
      expect(service.rejectFeeReview).not.toHaveBeenCalled();
    });
  });

  it("creates a fee with fee:manage_department and returns 201", async () => {
    await withTestApp([PermissionCode.feeManageDepartment], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .post("/fees")
        .set("X-Demo-User-Id", ids.user)
        .send(makeCreatePayload())
        .expect(201);

      expect(response.body.id).toBe(ids.feeRecord);
      expect(service.createFee).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          achievementId: ids.achievement,
          feeType: FeeTypeCode.patentAnnual,
          amount: 1200,
        }),
      );
    });
  });

  it("marks a fee paid with fee:manage_department and returns 200", async () => {
    await withTestApp([PermissionCode.feeManageDepartment], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/mark-paid`)
        .set("X-Demo-User-Id", ids.user)
        .send({ paidDate: "2026-06-18T00:00:00.000Z", voucherNo: "VOUCHER-001" })
        .expect(200);

      expect(response.body.payStatus).toBe(PayStatusCode.paid);
      expect(service.markFeePaid).toHaveBeenCalledWith(
        expect.any(Object),
        ids.feeRecord,
        expect.objectContaining({
          paidDate: "2026-06-18T00:00:00.000Z",
          voucherNo: "VOUCHER-001",
        }),
      );
    });
  });

  it("reads fee warnings with fee:read_department and validated query", async () => {
    await withTestApp([PermissionCode.feeReadDepartment], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/fees/warnings")
        .set("X-Demo-User-Id", ids.user)
        .query({ today: "2026-06-18", dueSoonDays: "15", take: "5" })
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.items[0].warningType).toBe(FeeWarningTypeCode.dueSoon);
      expect(service.getFeeWarnings).toHaveBeenCalledWith(
        expect.objectContaining<Partial<UserContext>>({
          userId: ids.user,
          departmentId: ids.department,
        }),
        expect.objectContaining({
          today: "2026-06-18",
          dueSoonDays: 15,
          take: 5,
        }),
      );
    });
  });

  it("waives a fee with fee:manage_department and required reason", async () => {
    await withTestApp([PermissionCode.feeManageDepartment], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/waive`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "  policy exemption  " })
        .expect(200);

      expect(response.body.payStatus).toBe(PayStatusCode.waived);
      expect(service.waiveFee).toHaveBeenCalledWith(
        expect.any(Object),
        ids.feeRecord,
        expect.objectContaining({
          reason: "policy exemption",
        }),
      );
    });
  });

  it("cancels a fee with fee:manage_department and required reason", async () => {
    await withTestApp([PermissionCode.feeManageDepartment], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/cancel`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "duplicate fee record" })
        .expect(200);

      expect(response.body.payStatus).toBe(PayStatusCode.cancelled);
      expect(service.cancelFee).toHaveBeenCalledWith(
        expect.any(Object),
        ids.feeRecord,
        expect.objectContaining({
          reason: "duplicate fee record",
        }),
      );
    });
  });

  it("archives a fee with fee:manage_department and required reason", async () => {
    await withTestApp([PermissionCode.feeManageDepartment], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/archive`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "local soft archive" })
        .expect(200);

      expect(response.body.archivedAt).toBeTruthy();
      expect(service.archiveFee).toHaveBeenCalledWith(
        expect.any(Object),
        ids.feeRecord,
        expect.objectContaining({
          reason: "local soft archive",
        }),
      );
    });
  });

  it("approves and rejects fee review with fee:review_department", async () => {
    await withTestApp([PermissionCode.feeReviewDepartment], async (app, service) => {
      const approveResponse = await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/review/approve`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "  finance checked  " })
        .expect(200);

      expect(approveResponse.body.reviewStatus).toBe(FeeReviewStatusCode.approved);
      expect(approveResponse.body.payStatus).toBe(PayStatusCode.pending);
      expect(service.approveFeeReview).toHaveBeenCalledWith(
        expect.any(Object),
        ids.feeRecord,
        expect.objectContaining({
          reason: "finance checked",
        }),
      );

      const rejectResponse = await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/review/reject`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "missing support" })
        .expect(200);

      expect(rejectResponse.body.reviewStatus).toBe(FeeReviewStatusCode.rejected);
      expect(rejectResponse.body.payStatus).toBe(PayStatusCode.pending);
      expect(service.rejectFeeReview).toHaveBeenCalledWith(
        expect.any(Object),
        ids.feeRecord,
        expect.objectContaining({
          reason: "missing support",
        }),
      );
    });
  });

  it("rejects invalid UUID params with 400", async () => {
    await withTestApp([PermissionCode.feeReadDepartment], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/fees/not-a-uuid")
        .set("X-Demo-User-Id", ids.user)
        .expect(400);

      expect(service.getFee).not.toHaveBeenCalled();
    });
  });

  it("rejects invalid query and body payloads with 400", async () => {
    await withTestApp(
      [PermissionCode.feeReadDepartment, PermissionCode.feeManageDepartment],
      async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/fees")
        .set("X-Demo-User-Id", ids.user)
        .query({ unexpectedField: "x" })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .post("/fees")
        .set("X-Demo-User-Id", ids.user)
        .send({
          ...makeCreatePayload(),
          amount: -1,
          unexpectedField: true,
        })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/mark-paid`)
        .set("X-Demo-User-Id", ids.user)
        .send({ paidDate: "not-a-date" })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/waive`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "   " })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/cancel`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "x".repeat(501) })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/archive`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "   " })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/review/approve`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "   " })
        .expect(403);

      expect(service.listFees).not.toHaveBeenCalled();
      expect(service.createFee).not.toHaveBeenCalled();
      expect(service.markFeePaid).not.toHaveBeenCalled();
      expect(service.waiveFee).not.toHaveBeenCalled();
      expect(service.cancelFee).not.toHaveBeenCalled();
      expect(service.archiveFee).not.toHaveBeenCalled();
      expect(service.approveFeeReview).not.toHaveBeenCalled();
      expect(service.rejectFeeReview).not.toHaveBeenCalled();
      },
    );
  });

  it("maps service errors to HTTP status codes", async () => {
    await withTestApp([PermissionCode.feeReadDepartment], async (app, service) => {
      const cases = [
        {
          error: new FeeAccessDeniedError("Out of scope."),
          expectedStatus: 403,
        },
        {
          error: new FeePermissionDeniedError(PermissionCode.feeReadDepartment),
          expectedStatus: 403,
        },
        {
          error: new FeeNotFoundError(ids.feeRecord),
          expectedStatus: 404,
        },
        {
          error: new FeeConflictError("Duplicate fee."),
          expectedStatus: 409,
        },
        {
          error: new FeeInvalidTransitionError(PayStatusCode.paid, PayStatusCode.paid),
          expectedStatus: 409,
        },
      ];

      for (const testCase of cases) {
        service.getFee.mockRejectedValueOnce(testCase.error);

        await request(app.getHttpServer() as Server)
          .get(`/fees/${ids.feeRecord}`)
          .set("X-Demo-User-Id", ids.user)
          .expect(testCase.expectedStatus);
      }
    });
  });

  it("uses the identity adapter context and only calls FeeService at the HTTP boundary", async () => {
    await withTestApp([PermissionCode.feeReadDepartment], async (app, service, identityAdapter) => {
      await request(app.getHttpServer() as Server)
        .get(`/fees/${ids.feeRecord}`)
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      expect(identityAdapter.loadUserContext).toHaveBeenCalledWith({
        headers: expect.objectContaining({
          "x-demo-user-id": ids.user,
        }),
      });
      expect(service.getFee).toHaveBeenCalledTimes(1);
    });
  });
});

const withTestApp = async (
  permissions: readonly PermissionCode[] | null,
  callback: TestCallback,
): Promise<void> => {
  let app: INestApplication | null = null;
  const previousNodeEnv = process.env.NODE_ENV;
  const service = createServiceMock();
  const identityAdapter = {
    loadUserContext: vi.fn().mockResolvedValue(
      permissions === null ? null : makeUserContext(permissions),
    ),
  };

  process.env.NODE_ENV = "test";

  try {
    const moduleRef = await Test.createTestingModule({
      imports: [FeesModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(IDENTITY_ADAPTER)
      .useValue(identityAdapter)
      .overrideProvider(FeeService)
      .useValue(service)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await callback(app, service, identityAdapter);
  } finally {
    if (app) {
      await app.close();
    }

    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
};

const expectHistoryHasNoSensitiveFeeFields = (input: unknown): void => {
  const serialized = JSON.stringify(input);

  expect(serialized).not.toContain("amount");
  expect(serialized).not.toContain("voucherNo");
  expect(serialized).not.toContain("storageKey");
  expect(serialized).not.toContain("checksum");
  expect(serialized).not.toContain("raw");
  expect(serialized).not.toContain("cookie");
  expect(serialized).not.toContain("token");
  expect(serialized).not.toContain("databaseUrl");
};
