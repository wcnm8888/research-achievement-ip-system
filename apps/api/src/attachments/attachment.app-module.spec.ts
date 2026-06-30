import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Server } from "node:http";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { AchievementService } from "../achievements/achievement.service";
import { AppModule } from "../app.module";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { SecretLevelCode } from "../authorization/constants/secret-level-code";
import { PrismaService } from "../database/prisma.service";
import { WorkflowService } from "../workflow/workflow.service";
import { AttachmentService } from "./attachment.service";
import { AttachmentRelationTypeCode } from "./domain/attachment-relation-type-code";
import { AttachmentStatusCode } from "./domain/attachment-status-code";

const ids = {
  attachment: "70000000-0000-4000-8000-000000000001",
  achievement: "30000000-0000-4000-8000-000000000001",
  feeRecord: "80000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000001",
};

type LoadedUserFixture = {
  id: string;
  departmentId: string;
  userRoles: Array<{
    departmentId: string | null;
    scopeKey: string;
    scopeType: ScopeType;
    role: {
      id: string;
      code: RoleCode;
      rolePermissions: Array<{
        permission: {
          code: PermissionCode;
          status: "ACTIVE";
        };
      }>;
    };
  }>;
};

type AttachmentServiceMock = {
  createAchievementAttachmentForUser: ReturnType<typeof vi.fn>;
  listAchievementMetadata: ReturnType<typeof vi.fn>;
  getAchievementAttachmentMetadata: ReturnType<typeof vi.fn>;
  downloadAchievementAttachment: ReturnType<typeof vi.fn>;
  createFeeVoucherAttachmentForUser: ReturnType<typeof vi.fn>;
  listFeeVoucherMetadata: ReturnType<typeof vi.fn>;
  getFeeVoucherAttachmentMetadata: ReturnType<typeof vi.fn>;
  downloadFeeVoucherAttachment: ReturnType<typeof vi.fn>;
};

type TestCallback = (
  app: INestApplication,
  service: AttachmentServiceMock,
  getFindFirstCallCount: () => number,
) => Promise<void>;

const createdAt = "2026-01-01T00:00:00.000Z";

const makeMetadata = () => ({
  id: ids.attachment,
  relationType: AttachmentRelationTypeCode.achievement,
  relationId: ids.achievement,
  fileName: "paper.pdf",
  mimeType: "application/pdf",
  sizeBytes: 24,
  storageProvider: "LOCAL_DISK",
  originalName: "paper.pdf",
  storedName: "paper.pdf",
  version: 1,
  uploaderId: ids.user,
  secretLevel: SecretLevelCode.internal,
  status: AttachmentStatusCode.active,
  createdAt,
  updatedAt: createdAt,
  archivedAt: null,
});

const createAttachmentServiceMock = (): AttachmentServiceMock => ({
  createAchievementAttachmentForUser: vi.fn().mockResolvedValue(makeMetadata()),
  listAchievementMetadata: vi.fn().mockResolvedValue([makeMetadata()]),
  getAchievementAttachmentMetadata: vi.fn().mockResolvedValue(makeMetadata()),
  downloadAchievementAttachment: vi.fn().mockResolvedValue({
    id: ids.attachment,
    fileName: "paper.pdf",
    version: 1,
    mimeType: "application/pdf",
    sizeBytes: 9,
    body: Buffer.from("fake body"),
  }),
  createFeeVoucherAttachmentForUser: vi.fn().mockResolvedValue({
    ...makeMetadata(),
    relationType: AttachmentRelationTypeCode.feeRecord,
    relationId: ids.feeRecord,
    fileName: "voucher.pdf",
  }),
  listFeeVoucherMetadata: vi.fn().mockResolvedValue([
    {
      ...makeMetadata(),
      relationType: AttachmentRelationTypeCode.feeRecord,
      relationId: ids.feeRecord,
    },
  ]),
  getFeeVoucherAttachmentMetadata: vi.fn().mockResolvedValue({
    ...makeMetadata(),
    relationType: AttachmentRelationTypeCode.feeRecord,
    relationId: ids.feeRecord,
  }),
  downloadFeeVoucherAttachment: vi.fn().mockResolvedValue({
    id: ids.attachment,
    fileName: "voucher.pdf",
    version: 1,
    mimeType: "application/pdf",
    sizeBytes: 9,
    body: Buffer.from("fake body"),
  }),
});

describe("Attachment routes through AppModule", () => {
  it("keeps the health route available after attachment module integration", async () => {
    await withAppModule([], async (app) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/health")
        .expect(200);

      expect(response.body).toEqual({
        service: "research-achievement-ip-api",
        status: "ok",
      });
    });
  });

  it("exposes attachment upload, list, detail, and download routes through AppModule", async () => {
    await withAppModule(
      [
        PermissionCode.achievementUpdateOwn,
        PermissionCode.attachmentReadMetadata,
        PermissionCode.attachmentDownload,
      ],
      async (app, service) => {
        await request(app.getHttpServer() as Server)
          .post(`/achievements/${ids.achievement}/attachments`)
          .set("X-Demo-User-Id", ids.user)
          .field("secretLevel", SecretLevelCode.internal)
          .attach("file", pdfBuffer(), {
            filename: "paper.pdf",
            contentType: "application/pdf",
          })
          .expect(201);

        await request(app.getHttpServer() as Server)
          .get(`/achievements/${ids.achievement}/attachments`)
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        await request(app.getHttpServer() as Server)
          .get(`/achievements/${ids.achievement}/attachments/${ids.attachment}`)
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        await request(app.getHttpServer() as Server)
          .get(`/achievements/${ids.achievement}/attachments/${ids.attachment}/download`)
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        expect(service.createAchievementAttachmentForUser).toHaveBeenCalledOnce();
        expect(service.listAchievementMetadata).toHaveBeenCalledOnce();
        expect(service.getAchievementAttachmentMetadata).toHaveBeenCalledOnce();
        expect(service.downloadAchievementAttachment).toHaveBeenCalledOnce();
      },
    );
  });

  it("exposes fee voucher attachment routes through AppModule", async () => {
    await withAppModule(
      [
        PermissionCode.feeManageDepartment,
        PermissionCode.feeReviewDepartment,
        PermissionCode.attachmentDownload,
      ],
      async (app, service) => {
        await request(app.getHttpServer() as Server)
          .post(`/fees/${ids.feeRecord}/voucher-attachments`)
          .set("X-Demo-User-Id", ids.user)
          .field("secretLevel", SecretLevelCode.internal)
          .attach("file", pdfBuffer(), {
            filename: "voucher.pdf",
            contentType: "application/pdf",
          })
          .expect(201);

        await request(app.getHttpServer() as Server)
          .get(`/fees/${ids.feeRecord}/voucher-attachments`)
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        await request(app.getHttpServer() as Server)
          .get(`/fees/${ids.feeRecord}/voucher-attachments/${ids.attachment}`)
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        await request(app.getHttpServer() as Server)
          .get(`/fees/${ids.feeRecord}/voucher-attachments/${ids.attachment}/download`)
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        expect(service.createFeeVoucherAttachmentForUser).toHaveBeenCalledOnce();
        expect(service.listFeeVoucherMetadata).toHaveBeenCalledOnce();
        expect(service.getFeeVoucherAttachmentMetadata).toHaveBeenCalledOnce();
        expect(service.downloadFeeVoucherAttachment).toHaveBeenCalledOnce();
      },
    );
  });

  it("returns 401 through AppModule when user context is missing", async () => {
    await withAppModule(
      [PermissionCode.attachmentReadMetadata],
      async (app, service, getFindFirstCallCount) => {
        const response = await request(app.getHttpServer() as Server)
          .get(`/achievements/${ids.achievement}/attachments`)
          .expect(401);

        expect(response.body.message).toBe("User context is required.");
        expect(service.listAchievementMetadata).not.toHaveBeenCalled();
        expect(getFindFirstCallCount()).toBe(0);
      },
    );
  });

  it("returns 403 through AppModule when static permission is missing", async () => {
    await withAppModule([], async (app, service, getFindFirstCallCount) => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/achievements/${ids.achievement}/attachments`)
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      expect(response.body.message).toBe("Required permissions are missing.");
      expect(service.listAchievementMetadata).not.toHaveBeenCalled();
      expect(getFindFirstCallCount()).toBe(1);
    });
  });

  it("keeps upload and download protected by their own static permissions", async () => {
    await withAppModule([PermissionCode.attachmentReadMetadata], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post(`/achievements/${ids.achievement}/attachments`)
        .set("X-Demo-User-Id", ids.user)
        .attach("file", pdfBuffer(), {
          filename: "paper.pdf",
          contentType: "application/pdf",
        })
        .expect(403);

      await request(app.getHttpServer() as Server)
        .get(`/achievements/${ids.achievement}/attachments/${ids.attachment}/download`)
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      expect(service.createAchievementAttachmentForUser).not.toHaveBeenCalled();
      expect(service.downloadAchievementAttachment).not.toHaveBeenCalled();
    });
  });
});

const pdfBuffer = (): Buffer => Buffer.from("%PDF-1.7 local test file");

const withAppModule = async (
  permissions: readonly PermissionCode[],
  callback: TestCallback,
): Promise<void> => {
  let findFirstCallCount = 0;
  let app: INestApplication | null = null;
  const attachmentService = createAttachmentServiceMock();

  try {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AttachmentService)
      .useValue(attachmentService)
      .overrideProvider(AchievementService)
      .useValue({})
      .overrideProvider(WorkflowService)
      .useValue({})
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findFirst: async (): Promise<LoadedUserFixture | null> => {
            findFirstCallCount += 1;
            return makeLoadedUser(permissions);
          },
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await callback(app, attachmentService, () => findFirstCallCount);
  } finally {
    if (app) {
      await app.close();
    }
  }
};

const makeLoadedUser = (
  permissions: readonly PermissionCode[],
): LoadedUserFixture => ({
  id: ids.user,
  departmentId: ids.department,
  userRoles: [
    {
      departmentId: ids.department,
      scopeKey: ids.department,
      scopeType: ScopeType.department,
      role: {
        id: ids.role,
        code: RoleCode.researcher,
        rolePermissions: permissions.map((permission) => ({
          permission: {
            code: permission,
            status: "ACTIVE",
          },
        })),
      },
    },
  ],
});
