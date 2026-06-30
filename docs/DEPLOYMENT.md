# Deployment Guide

## Production Checklist

- [ ] Set strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Configure production `DATABASE_URL` (PostgreSQL)
- [ ] Configure `REDIS_URL` for rate limiting and draw locks
- [ ] Set Stripe live keys and webhook endpoint
- [ ] Enable HTTPS (reverse proxy: nginx, Caddy, or cloud load balancer)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `FRONTEND_URL` and `API_URL`
- [ ] Set up S3-compatible storage for backups
- [ ] Configure email provider (SendGrid) for notifications
- [ ] Run database migrations: `npx prisma migrate deploy`
- [ ] Seed initial admin (or create manually in production)

## Docker Compose (Development)

```bash
docker compose up -d
```

## Build

```bash
pnpm install
pnpm db:generate
pnpm build
```

## Start

```bash
# API
cd apps/api && node dist/main

# Web
cd apps/web && pnpm start
```

## Monitoring

- Health endpoint: `GET /api/health`
- Swagger docs: `/api/docs`
- Audit logs: Admin panel → Audit Logs

## Security

- All cookies use `httpOnly`, `secure`, `sameSite: strict` in production
- Rate limiting: 100 requests/minute per IP
- RBAC enforced on all protected routes
- Draw uses `crypto.randomInt` with Redis lock
