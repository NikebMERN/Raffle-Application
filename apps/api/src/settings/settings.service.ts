import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { paginate, paginatedResponse } from '../common/decorators';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll() {
    return this.prisma.systemSetting.findMany();
  }

  async update(key: string, value: string, userId?: string) {
    const existing = await this.prisma.systemSetting.findUnique({ where: { key } });
    const setting = await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    await this.audit.log({
      userId,
      action: 'UPDATE',
      entity: 'system_setting',
      entityId: key,
      oldValue: existing,
      newValue: setting,
    });
    return setting;
  }

  async getAuditLogs(query: Record<string, string>) {
    const { page, limit, skip } = paginate(query);
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      }),
      this.prisma.auditLog.count(),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async getActivityLogs(query: Record<string, string>) {
    const { page, limit, skip } = paginate(query);
    const [data, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      }),
      this.prisma.activityLog.count(),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async getSecurityLogs(query: Record<string, string>) {
    const { page, limit, skip } = paginate(query);
    const [data, total] = await Promise.all([
      this.prisma.securityLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      }),
      this.prisma.securityLog.count(),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async createBackup() {
    const backup = await this.prisma.backup.create({
      data: {
        filename: `backup-${Date.now()}.sql`,
        size: 0,
        status: 'COMPLETED',
      },
    });
    return backup;
  }

  async listBackups() {
    return this.prisma.backup.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
