import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { CreateAuditEventInput } from "./domain/audit-event.types";
import {
  toAuditFindManyWhere,
  toAuditLogCreateData,
} from "./domain/audit-prisma.mapper";
import { AuditFindManyInput, AuditLogRecord } from "./domain/audit-repository.types";

const defaultAuditTake = 50;

export type AuditTransactionClient = Pick<Prisma.TransactionClient, "auditLog">;

@Injectable()
export class AuditRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(input: CreateAuditEventInput): Promise<AuditLogRecord> {
    return this.prisma.$transaction((tx) =>
      this.createInTransaction(tx as AuditTransactionClient, input),
    );
  }

  createInTransaction(
    client: AuditTransactionClient,
    input: CreateAuditEventInput,
  ): Promise<AuditLogRecord> {
    return client.auditLog.create({
      data: toAuditLogCreateData(input),
    }) as Promise<AuditLogRecord>;
  }

  findMany(input: AuditFindManyInput = {}): Promise<AuditLogRecord[]> {
    return this.prisma.auditLog.findMany({
      where: toAuditFindManyWhere(input),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: input.take ?? defaultAuditTake,
    }) as Promise<AuditLogRecord[]>;
  }
}
