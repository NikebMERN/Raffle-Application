import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, paginatedResponse } from '../common/decorators';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: Record<string, string>) {
    const { page, limit, skip } = paginate(query);
    const where: Prisma.UserWhereInput = query.search
      ? {
          OR: [
            { email: { contains: query.search } },
            { firstName: { contains: query.search } },
            { lastName: { contains: query.search } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        select: {
          id: true, email: true, firstName: true, lastName: true, phone: true,
          isActive: true, emailVerified: true, lastLoginAt: true, createdAt: true,
          roles: { include: { role: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginatedResponse(data, total, page, limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } }, wallet: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash: _, ...rest } = user;
    return rest;
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async assignRole(userId: string, roleId: string) {
    return this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });
  }

  async removeRole(userId: string, roleId: string) {
    return this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    });
  }
}
