import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthorizationModule } from "../authorization/authorization.module";
import { DatabaseModule } from "../database/database.module";
import { IdentityModule } from "../identity/identity.module";
import { AttachmentController } from "./attachment.controller";
import { AttachmentRepository } from "./attachment.repository";
import { AttachmentService } from "./attachment.service";
import { ATTACHMENT_STORAGE_ADAPTER } from "./storage/attachment-storage.provider";
import { FakeAttachmentStorageAdapter } from "./storage/fake-attachment-storage.adapter";

@Module({
  imports: [DatabaseModule, AuthorizationModule, IdentityModule, AuditModule],
  controllers: [AttachmentController],
  providers: [
    AttachmentRepository,
    AttachmentService,
    {
      provide: ATTACHMENT_STORAGE_ADAPTER,
      useClass: FakeAttachmentStorageAdapter,
    },
  ],
  exports: [AttachmentService],
})
export class AttachmentsModule {}
