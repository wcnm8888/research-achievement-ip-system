import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthorizationModule } from "../authorization/authorization.module";
import { DatabaseModule } from "../database/database.module";
import { IdentityModule } from "../identity/identity.module";
import {
  AttachmentController,
  FeeVoucherAttachmentController,
} from "./attachment.controller";
import { AttachmentRepository } from "./attachment.repository";
import { AttachmentService } from "./attachment.service";
import { ATTACHMENT_STORAGE_ADAPTER } from "./storage/attachment-storage.provider";
import {
  LOCAL_ATTACHMENT_STORAGE_ROOT,
  LocalAttachmentStorageAdapter,
  localAttachmentStorageRoot,
} from "./storage/local-attachment-storage.adapter";

@Module({
  imports: [DatabaseModule, AuthorizationModule, IdentityModule, AuditModule],
  controllers: [AttachmentController, FeeVoucherAttachmentController],
  providers: [
    AttachmentRepository,
    AttachmentService,
    {
      provide: LOCAL_ATTACHMENT_STORAGE_ROOT,
      useValue: localAttachmentStorageRoot,
    },
    {
      provide: ATTACHMENT_STORAGE_ADAPTER,
      useClass: LocalAttachmentStorageAdapter,
    },
  ],
  exports: [AttachmentService],
})
export class AttachmentsModule {}
