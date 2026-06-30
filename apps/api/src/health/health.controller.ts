import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private redis: Redis | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const redisUrl = config.get<string>('REDIS_URL');
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, connectTimeout: 2000 });
      } catch {
        this.redis = null;
      }
    }
  }

  @Get()
  async check() {
    const checks: Record<string, string> = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'healthy';
    } catch {
      checks.database = 'unhealthy';
    }

    if (this.redis) {
      try {
        await this.redis.ping();
        checks.redis = 'healthy';
      } catch {
        checks.redis = 'unhealthy';
      }
    } else {
      checks.redis = 'not_configured';
    }

    const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY');
    checks.stripe = stripeKey && !stripeKey.includes('your_key') ? 'configured' : 'not_configured';

    const allHealthy = checks.database === 'healthy';
    return {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
