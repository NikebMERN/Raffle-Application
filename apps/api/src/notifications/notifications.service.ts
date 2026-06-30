import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async sendToUser(
    userId: string,
    params: { channel: 'EMAIL' | 'SMS' | 'PUSH'; title: string; body: string; templateName?: string },
  ) {
    let templateId: string | undefined;
    if (params.templateName) {
      const template = await this.prisma.notificationTemplate.findUnique({
        where: { name: params.templateName },
      });
      templateId = template?.id;
    }

    return this.prisma.notification.create({
      data: {
        userId,
        templateId,
        channel: params.channel,
        title: params.title,
        body: params.body,
        status: 'SENT',
        sentAt: new Date(),
      },
    });
  }

  async findAll(query: Record<string, string>) {
    const where: Record<string, unknown> = {};
    if (query.userId) where.userId = query.userId;

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getTemplates() {
    return this.prisma.notificationTemplate.findMany();
  }

  async createTemplate(data: {
    name: string;
    channel: 'EMAIL' | 'SMS' | 'PUSH';
    subject?: string;
    body: string;
    variables?: string[];
  }) {
    return this.prisma.notificationTemplate.create({ data: { ...data, variables: data.variables } });
  }

  async updateTemplate(id: string, data: Record<string, unknown>) {
    return this.prisma.notificationTemplate.update({ where: { id }, data: data as never });
  }

  async deleteTemplate(id: string) {
    return this.prisma.notificationTemplate.delete({ where: { id } });
  }
}
