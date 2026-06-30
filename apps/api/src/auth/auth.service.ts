import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private audit: AuditService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const userRole = await this.prisma.role.findUnique({ where: { code: 'USER' } });
    if (!userRole) throw new BadRequestException('Default role not configured');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        roles: { create: { roleId: userRole.id } },
        wallet: { create: {} },
      },
      include: { roles: { include: { role: true } } },
    });

    await this.audit.log({
      userId: user.id,
      action: 'REGISTER',
      entity: 'user',
      entityId: user.id,
      ipAddress,
    });

    return this.generateTokens(user.id, user.email);
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { roles: { include: { role: true } } },
    });

    if (!user || !user.isActive) {
      await this.audit.security('LOGIN_FAILED', { ipAddress, userAgent, details: { email: dto.email } });
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      await this.audit.security('LOGIN_FAILED', { userId: user.id, ipAddress, userAgent });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.audit.security('LOGIN_SUCCESS', { userId: user.id, ipAddress, userAgent });
    return this.generateTokens(user.id, user.email);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      return this.generateTokens(payload.sub, payload.email);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If the email exists, a reset link has been sent' };

    const token = uuidv4();
    await this.prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: { token, expiresAt: new Date(Date.now() + 3600000) },
      create: { userId: user.id, token, expiresAt: new Date(Date.now() + 3600000) },
    });

    return { message: 'If the email exists, a reset link has been sent', token };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.delete({ where: { id: resetToken.id } }),
    ]);

    return { message: 'Password reset successful' };
  }

  private generateTokens(userId: string, email: string) {
    const accessToken = this.jwt.sign(
      { sub: userId, email },
      { secret: this.config.get<string>('JWT_ACCESS_SECRET'), expiresIn: this.config.get('JWT_ACCESS_EXPIRY') || '15m' },
    );
    const refreshToken = this.jwt.sign(
      { sub: userId, email },
      { secret: this.config.get<string>('JWT_REFRESH_SECRET'), expiresIn: this.config.get('JWT_REFRESH_EXPIRY') || '7d' },
    );
    return { accessToken, refreshToken };
  }
}
