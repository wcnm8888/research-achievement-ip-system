import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Server } from "http";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { SecretLevelCode } from "../authorization/constants/secret-level-code";
import { UserContext } from "../identity/user-context";
import { PrismaService } from "../database/prisma.service";
import { AttachmentService } from "./attachment.service";
import { AttachmentsModule } from "./attachments.module";
import {
  AttachmentAccessDeniedError,
  AttachmentNotFoundError,
  AttachmentPreviewUnsupportedMediaTypeError,
  AttachmentStorageError,
  AttachmentUnsupportedRelationError,
  AttachmentVersionConflictError,
} from "./domain/attachment-errors";
import { AttachmentRelationTypeCode } from "./domain/attachment-relation-type-code";
import { AttachmentStatusCode } from "./domain/attachment-status-code";

const ids = {
  attachment: "70000000-0000-4000-8000-000000000001",
  achievement: "30000000-0000-4000-8000-000000000001",
  feeRecord: "80000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
};

const IDENTITY_ADAPTER = "IDENTITY_ADAPTER";

type ServiceMock = {
  createAchievementAttachmentForUser: ReturnType<typeof vi.fn>;
  listAchievementMetadata: ReturnType<typeof vi.fn>;
  getAchievementAttachmentMetadata: ReturnType<typeof vi.fn>;
  downloadAchievementAttachment: ReturnType<typeof vi.fn>;
  previewAchievementAttachment: ReturnType<typeof vi.fn>;
  createFeeVoucherAttachmentForUser: ReturnType<typeof vi.fn>;
  listFeeVoucherMetadata: ReturnType<typeof vi.fn>;
  getFeeVoucherAttachmentMetadata: ReturnType<typeof vi.fn>;
  downloadFeeVoucherAttachment: ReturnType<typeof vi.fn>;
  previewFeeVoucherAttachment: ReturnType<typeof vi.fn>;
};

const metadata = {
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
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  archivedAt: null,
};

const createServiceMock = (): ServiceMock => ({
  createAchievementAttachmentForUser: vi.fn().mockResolvedValue(metadata),
  listAchievementMetadata: vi.fn().mockResolvedValue([metadata]),
  getAchievementAttachmentMetadata: vi.fn().mockResolvedValue(metadata),
  downloadAchievementAttachment: vi.fn().mockResolvedValue({
    id: ids.attachment,
    fileName: "paper.pdf",
    version: 1,
    mimeType: "application/pdf",
    sizeBytes: 9,
    body: Buffer.from("fake body"),
  }),
  previewAchievementAttachment: vi.fn().mockResolvedValue({
    id: ids.attachment,
    fileName: "paper.pdf",
    version: 1,
    mimeType: "application/pdf",
    sizeBytes: 9,
    body: Buffer.from("fake body"),
  }),
  createFeeVoucherAttachmentForUser: vi.fn().mockResolvedValue({
    ...metadata,
    relationType: AttachmentRelationTypeCode.feeRecord,
    relationId: ids.feeRecord,
    fileName: "voucher.pdf",
    originalName: "voucher.pdf",
    storedName: "voucher.pdf",
  }),
  listFeeVoucherMetadata: vi.fn().mockResolvedValue([
    {
      ...metadata,
      relationType: AttachmentRelationTypeCode.feeRecord,
      relationId: ids.feeRecord,
    },
  ]),
  getFeeVoucherAttachmentMetadata: vi.fn().mockResolvedValue({
    ...metadata,
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
  previewFeeVoucherAttachment: vi.fn().mockResolvedValue({
    id: ids.attachment,
    fileName: "voucher.pdf",
    version: 1,
    mimeType: "application/pdf",
    sizeBytes: 9,
    body: Buffer.from("fake body"),
  }),
});

const makeUserContext = (permissions: readonly PermissionCode[]): UserContext => ({
  userId: ids.user,
  departmentId: ids.department,
  roleIds: [],
  roleCodes: [RoleCode.researcher],
  permissionCodes: permissions,
  roleScopes: [],
  scopedDepartmentIds: [ids.department],
});

type TestCallback = (
  app: INestApplication,
  service: ServiceMock,
  context: UserContext | null,
) => Promise<void>;

const withAttachmentApp = async (
  permissions: readonly PermissionCode[] | null,
  callback: TestCallback,
): Promise<void> => {
  let app: INestApplication | null = null;
  const service = createServiceMock();
  const context = permissions ? makeUserContext(permissions) : null;

  try {
    const moduleRef = await Test.createTestingModule({
      imports: [AttachmentsModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(IDENTITY_ADAPTER)
      .useValue({
        loadUserContext: vi.fn().mockResolvedValue(context),
      })
      .overrideProvider(AttachmentService)
      .useValue(service)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await callback(app, service, context);
  } finally {
    if (app) {
      await app.close();
    }
  }
};

describe("AttachmentController", () => {
  it("returns 401 without user context", async () => {
    await withAttachmentApp(null, async (app) => {
      await request(app.getHttpServer() as Server)
        .post(`/achievements/${ids.achievement}/attachments`)
        .attach("file", pdfBuffer(), {
          filename: "paper.pdf",
          contentType: "application/pdf",
        })
        .expect(401);
    });
  });

  it("returns 403 without upload permission", async () => {
    await withAttachmentApp([], async (app) => {
      await request(app.getHttpServer() as Server)
        .post(`/achievements/${ids.achievement}/attachments`)
        .attach("file", pdfBuffer(), {
          filename: "paper.pdf",
          contentType: "application/pdf",
        })
        .expect(403);
    });
  });

  it("uploads metadata through the module-local route", async () => {
    await withAttachmentApp(
      [PermissionCode.achievementUpdateOwn],
      async (app, service, context) => {
        await request(app.getHttpServer() as Server)
          .post(`/achievements/${ids.achievement}/attachments`)
          .field("secretLevel", SecretLevelCode.internal)
          .attach("file", pdfBuffer(), {
            filename: "paper.pdf",
            contentType: "application/pdf",
          })
          .expect(201)
          .expect((response) => {
            expect(response.body).toMatchObject({
              id: ids.attachment,
              relationId: ids.achievement,
              fileName: "paper.pdf",
              mimeType: "application/pdf",
              sizeBytes: 24,
              originalName: "paper.pdf",
              version: 1,
            });
            expect(response.body).not.toHaveProperty("checksum");
            expect(response.body).not.toHaveProperty("objectKey");
          });

        expect(service.createAchievementAttachmentForUser).toHaveBeenCalledWith(
          context,
          ids.achievement,
          expect.objectContaining({
            fileName: "paper.pdf",
            secretLevel: SecretLevelCode.internal,
            mimeType: "application/pdf",
            sizeBytes: 24,
            originalName: "paper.pdf",
            storedName: "paper.pdf",
            objectBody: expect.any(Buffer),
          }),
        );
      },
    );
  });

  it("rejects multipart uploads without a file", async () => {
    await withAttachmentApp([PermissionCode.achievementUpdateOwn], async (app) => {
      await request(app.getHttpServer() as Server)
        .post(`/achievements/${ids.achievement}/attachments`)
        .field("secretLevel", SecretLevelCode.internal)
        .expect(400);
    });
  });

  it("rejects unsupported attachment file types", async () => {
    await withAttachmentApp([PermissionCode.achievementUpdateOwn], async (app) => {
      await request(app.getHttpServer() as Server)
        .post(`/achievements/${ids.achievement}/attachments`)
        .attach("file", Buffer.from("<html></html>"), {
          filename: "bad.html",
          contentType: "text/html",
        })
        .expect(415);
    });
  });

  it("rejects oversized attachment files", async () => {
    await withAttachmentApp([PermissionCode.achievementUpdateOwn], async (app) => {
      await request(app.getHttpServer() as Server)
        .post(`/achievements/${ids.achievement}/attachments`)
        .attach("file", Buffer.alloc(10 * 1024 * 1024 + 1), {
          filename: "too-large.pdf",
          contentType: "application/pdf",
        })
        .expect(413);
    });
  });

  it("sanitizes path traversal filenames before service upload", async () => {
    await withAttachmentApp(
      [PermissionCode.achievementUpdateOwn],
      async (app, service) => {
        await request(app.getHttpServer() as Server)
          .post(`/achievements/${ids.achievement}/attachments`)
          .attach("file", pdfBuffer(), {
            filename: "../paper.pdf",
            contentType: "application/pdf",
          })
          .expect(201);

        expect(service.createAchievementAttachmentForUser).toHaveBeenCalledWith(
          expect.anything(),
          ids.achievement,
          expect.objectContaining({
            fileName: "paper.pdf",
            originalName: "paper.pdf",
            storedName: "paper.pdf",
          }),
        );
      },
    );
  });

  it("rejects upload bodies with forbidden relation or uploader fields", async () => {
    await withAttachmentApp([PermissionCode.achievementUpdateOwn], async (app) => {
      await request(app.getHttpServer() as Server)
        .post(`/achievements/${ids.achievement}/attachments`)
        .field("relationId", ids.achievement)
        .field("uploaderId", ids.user)
        .attach("file", pdfBuffer(), {
          filename: "paper.pdf",
          contentType: "application/pdf",
        })
        .expect(400);
    });
  });

  it("validates route ids and list query fields", async () => {
    await withAttachmentApp([PermissionCode.attachmentReadMetadata], async (app) => {
      await request(app.getHttpServer() as Server)
        .get(`/achievements/not-a-uuid/attachments`)
        .expect(400);

      await request(app.getHttpServer() as Server)
        .get(`/achievements/${ids.achievement}/attachments?take=0`)
        .expect(400);
    });
  });

  it("lists and gets metadata without exposing storage internals", async () => {
    await withAttachmentApp(
      [PermissionCode.attachmentReadMetadata],
      async (app, service, context) => {
        await request(app.getHttpServer() as Server)
          .get(`/achievements/${ids.achievement}/attachments?take=10`)
          .expect(200)
          .expect((response) => {
            expect(response.body).toHaveLength(1);
            expect(response.body[0]).toMatchObject({
              id: ids.attachment,
              relationId: ids.achievement,
            });
            expect(response.body[0]).not.toHaveProperty("checksum");
            expect(response.body[0]).not.toHaveProperty("objectKey");
          });

        await request(app.getHttpServer() as Server)
          .get(`/achievements/${ids.achievement}/attachments/${ids.attachment}`)
          .expect(200);

        expect(service.listAchievementMetadata).toHaveBeenCalledWith(context, ids.achievement, {
          take: 10,
        });
        expect(service.getAchievementAttachmentMetadata).toHaveBeenCalledWith(
          context,
          ids.achievement,
          ids.attachment,
        );
      },
    );
  });

  it("downloads fake payload through the download boundary", async () => {
    await withAttachmentApp(
      [PermissionCode.attachmentDownload],
      async (app, service, context) => {
        await request(app.getHttpServer() as Server)
          .get(`/achievements/${ids.achievement}/attachments/${ids.attachment}/download`)
          .expect(200)
          .expect((response) => {
            expect(response.headers["content-type"]).toContain("application/pdf");
            expect(response.headers["content-length"]).toBe("9");
            expect(response.headers["content-disposition"]).toBe(
              'attachment; filename="paper.pdf"',
            );
            expect(Buffer.from(response.body).toString("utf8")).toBe("fake body");
          });

        expect(service.downloadAchievementAttachment).toHaveBeenCalledWith(
          context,
          ids.achievement,
          ids.attachment,
        );
      },
    );
  });

  it("previews achievement attachments inline through the download permission boundary", async () => {
    await withAttachmentApp(
      [PermissionCode.attachmentDownload],
      async (app, service, context) => {
        await request(app.getHttpServer() as Server)
          .get(`/achievements/${ids.achievement}/attachments/${ids.attachment}/preview`)
          .expect(200)
          .expect((response) => {
            expect(response.headers["content-type"]).toContain("application/pdf");
            expect(response.headers["content-length"]).toBe("9");
            expect(response.headers["x-content-type-options"]).toBe("nosniff");
            expect(response.headers["content-disposition"]).toBe(
              'inline; filename="paper.pdf"',
            );
            expect(Buffer.from(response.body).toString("utf8")).toBe("fake body");
            expect(JSON.stringify(response.headers)).not.toMatch(
              /objectKey|storageKey|checksum/,
            );
          });

        expect(service.previewAchievementAttachment).toHaveBeenCalledWith(
          context,
          ids.achievement,
          ids.attachment,
        );
      },
    );
  });

  it("maps unsupported achievement preview media to 415", async () => {
    await withAttachmentApp([PermissionCode.attachmentDownload], async (app, service) => {
      service.previewAchievementAttachment.mockRejectedValueOnce(
        new AttachmentPreviewUnsupportedMediaTypeError("application/msword"),
      );

      await request(app.getHttpServer() as Server)
        .get(`/achievements/${ids.achievement}/attachments/${ids.attachment}/preview`)
        .expect(415);
    });
  });

  it("uploads fee voucher attachments through the fee route", async () => {
    await withAttachmentApp(
      [PermissionCode.feeManageDepartment],
      async (app, service, context) => {
        await request(app.getHttpServer() as Server)
          .post(`/fees/${ids.feeRecord}/voucher-attachments`)
          .field("secretLevel", SecretLevelCode.internal)
          .attach("file", pdfBuffer(), {
            filename: "voucher.pdf",
            contentType: "application/pdf",
          })
          .expect(201)
          .expect((response) => {
            expect(response.body).toMatchObject({
              id: ids.attachment,
              relationType: AttachmentRelationTypeCode.feeRecord,
              relationId: ids.feeRecord,
              fileName: "voucher.pdf",
            });
            expect(response.body).not.toHaveProperty("checksum");
            expect(response.body).not.toHaveProperty("objectKey");
          });

        expect(service.createFeeVoucherAttachmentForUser).toHaveBeenCalledWith(
          context,
          ids.feeRecord,
          expect.objectContaining({
            fileName: "voucher.pdf",
            secretLevel: SecretLevelCode.internal,
            mimeType: "application/pdf",
            objectBody: expect.any(Buffer),
          }),
        );
      },
    );
  });

  it("keeps finance reviewers read-only at the fee voucher upload route", async () => {
    await withAttachmentApp([PermissionCode.feeReviewDepartment], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post(`/fees/${ids.feeRecord}/voucher-attachments`)
        .attach("file", pdfBuffer(), {
          filename: "voucher.pdf",
          contentType: "application/pdf",
        })
        .expect(403);

      expect(service.createFeeVoucherAttachmentForUser).not.toHaveBeenCalled();
    });
  });

  it("lists and gets fee voucher metadata for read-only finance reviewers", async () => {
    await withAttachmentApp([PermissionCode.feeReviewDepartment], async (app, service, context) => {
      await request(app.getHttpServer() as Server)
        .get(`/fees/${ids.feeRecord}/voucher-attachments?take=10`)
        .expect(200)
        .expect((response) => {
          expect(response.body).toHaveLength(1);
          expect(response.body[0]).toMatchObject({
            relationType: AttachmentRelationTypeCode.feeRecord,
            relationId: ids.feeRecord,
          });
          expect(response.body[0]).not.toHaveProperty("checksum");
          expect(response.body[0]).not.toHaveProperty("objectKey");
        });

      await request(app.getHttpServer() as Server)
        .get(`/fees/${ids.feeRecord}/voucher-attachments/${ids.attachment}`)
        .expect(200);

      expect(service.listFeeVoucherMetadata).toHaveBeenCalledWith(context, ids.feeRecord, {
        take: 10,
      });
      expect(service.getFeeVoucherAttachmentMetadata).toHaveBeenCalledWith(
        context,
        ids.feeRecord,
        ids.attachment,
      );
    });
  });

  it("downloads fee voucher payload through the static download permission boundary", async () => {
    await withAttachmentApp(
      [PermissionCode.feeReadDepartment, PermissionCode.attachmentDownload],
      async (app, service, context) => {
        await request(app.getHttpServer() as Server)
          .get(`/fees/${ids.feeRecord}/voucher-attachments/${ids.attachment}/download`)
          .expect(200)
          .expect((response) => {
            expect(response.headers["content-type"]).toContain("application/pdf");
            expect(response.headers["content-length"]).toBe("9");
            expect(response.headers["content-disposition"]).toBe(
              'attachment; filename="voucher.pdf"',
            );
          });

        expect(service.downloadFeeVoucherAttachment).toHaveBeenCalledWith(
          context,
          ids.feeRecord,
          ids.attachment,
        );
      },
    );
  });

  it("previews fee voucher attachments inline through the download permission boundary", async () => {
    await withAttachmentApp(
      [PermissionCode.feeReadDepartment, PermissionCode.attachmentDownload],
      async (app, service, context) => {
        await request(app.getHttpServer() as Server)
          .get(`/fees/${ids.feeRecord}/voucher-attachments/${ids.attachment}/preview`)
          .expect(200)
          .expect((response) => {
            expect(response.headers["content-type"]).toContain("application/pdf");
            expect(response.headers["content-length"]).toBe("9");
            expect(response.headers["x-content-type-options"]).toBe("nosniff");
            expect(response.headers["content-disposition"]).toBe(
              'inline; filename="voucher.pdf"',
            );
            expect(JSON.stringify(response.headers)).not.toMatch(
              /objectKey|storageKey|checksum/,
            );
          });

        expect(service.previewFeeVoucherAttachment).toHaveBeenCalledWith(
          context,
          ids.feeRecord,
          ids.attachment,
        );
      },
    );
  });

  it("maps unsupported fee voucher preview media to 415", async () => {
    await withAttachmentApp(
      [PermissionCode.feeReadDepartment, PermissionCode.attachmentDownload],
      async (app, service) => {
        service.previewFeeVoucherAttachment.mockRejectedValueOnce(
          new AttachmentPreviewUnsupportedMediaTypeError("text/html"),
        );

        await request(app.getHttpServer() as Server)
          .get(`/fees/${ids.feeRecord}/voucher-attachments/${ids.attachment}/preview`)
          .expect(415);
      },
    );
  });

  it("maps fee voucher metadata service denial to 403", async () => {
    await withAttachmentApp([PermissionCode.feeReviewDepartment], async (app, service) => {
      service.listFeeVoucherMetadata.mockRejectedValueOnce(
        new AttachmentAccessDeniedError("denied"),
      );

      await request(app.getHttpServer() as Server)
        .get(`/fees/${ids.feeRecord}/voucher-attachments`)
        .expect(403);
    });
  });

  it("maps attachment service errors to HTTP responses", async () => {
    await withAttachmentApp(
      [PermissionCode.achievementUpdateOwn, PermissionCode.attachmentReadMetadata],
      async (app, service) => {
        service.createAchievementAttachmentForUser.mockRejectedValueOnce(
          new AttachmentVersionConflictError(
            AttachmentRelationTypeCode.achievement,
            ids.achievement,
            "paper.pdf",
            1,
          ),
        );
        await request(app.getHttpServer() as Server)
          .post(`/achievements/${ids.achievement}/attachments`)
          .attach("file", pdfBuffer(), {
            filename: "paper.pdf",
            contentType: "application/pdf",
          })
          .expect(409);

        service.listAchievementMetadata.mockRejectedValueOnce(
          new AttachmentAccessDeniedError("denied"),
        );
        await request(app.getHttpServer() as Server)
          .get(`/achievements/${ids.achievement}/attachments`)
          .expect(403);

        service.getAchievementAttachmentMetadata.mockRejectedValueOnce(
          new AttachmentNotFoundError(ids.attachment),
        );
        await request(app.getHttpServer() as Server)
          .get(`/achievements/${ids.achievement}/attachments/${ids.attachment}`)
          .expect(404);

        service.getAchievementAttachmentMetadata.mockRejectedValueOnce(
          new AttachmentUnsupportedRelationError("FEE_RECORD"),
        );
        await request(app.getHttpServer() as Server)
          .get(`/achievements/${ids.achievement}/attachments/${ids.attachment}`)
          .expect(422);
      },
    );
  });

  it("maps storage failures at the download route", async () => {
    await withAttachmentApp([PermissionCode.attachmentDownload], async (app, service) => {
      service.downloadAchievementAttachment.mockRejectedValueOnce(
        new AttachmentStorageError("fake adapter failed"),
      );

      await request(app.getHttpServer() as Server)
        .get(`/achievements/${ids.achievement}/attachments/${ids.attachment}/download`)
        .expect(502);
    });
  });
});

const pdfBuffer = (): Buffer => Buffer.from("%PDF-1.7 local test file");
