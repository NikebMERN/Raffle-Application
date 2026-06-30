import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValue?: unknown;
    newValue?: unknown;
    ipAddress?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldValue: params.oldValue as object,
        newValue: params.newValue as object,
        ipAddress: params.ipAddress,
      },
    });
  }

  async activity(userId: string | undefined, action: string, details?: unknown) {
    return this.prisma.activityLog.create({
      data: { userId, action, details: details as object },
    });
  }

  async security(event: string, params: { userId?: string; ipAddress?: string; userAgent?: string; details?: unknown }) {
    return this.prisma.securityLog.create({
      data: {
        event,
        userId: params.userId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        details: params.details as object,
      },
    });
  }
}
