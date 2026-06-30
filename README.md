# Football Club Community Raffle Management System

Production-ready full-stack web application for managing football club community raffles with online and offline ticket sales, secure draws, wallet management, and multi-role dashboards.

## Tech Stack

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS
- **Backend:** NestJS, TypeScript, Prisma ORM
- **Database:** **MongoDB** (MERN data layer)
- **Cache:** Redis
- **Payments:** Stripe
- **Monorepo:** Turborepo + pnpm

## Features

- Public website with raffle browsing and online ticket purchase
- Role-based dashboards: User, Community Seller, Finance, Super Admin
- Offline ticket book distribution and manual sales
- Cryptographically secure draw engine with audit reports
- Wallet ledger, Stripe payments, notifications, reports, and analytics
- Full admin CRUD with search, filter, export, and bulk actions

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker & Docker Compose

### Setup

```bash
# Start infrastructure
docker compose up -d

# Install dependencies
pnpm install

# Environment files are pre-created at apps/api/.env and apps/web/.env.local
# Edit apps/api/.env and add your Stripe keys

# Database setup (MongoDB)
pnpm db:generate
pnpm db:push
pnpm db:seed

# Start development servers
pnpm dev
```

- **Web:** http://localhost:3000
- **API:** http://localhost:3001
- **API Docs:** http://localhost:3001/api/docs

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@footballclub.example | Admin123! |
| Community Seller | seller@footballclub.example | Seller123! |
| User | user@footballclub.example | User123! |

## Project Structure

```
apps/
  api/          # NestJS backend API
  web/          # Next.js frontend
docs/
  SRS.md        # Software Requirements Specification
packages/       # Shared packages (future)
```

## API Modules

- Auth & RBAC
- Users, Roles, Permissions
- Raffles, Rounds, Prizes
- Ticket Books & Tickets
- Sales (Online & Offline)
- Draws with Audit Reports
- Wallet & Payments
- Notifications & Templates
- Reports & Analytics
- Audit/Activity/Security Logs
- Settings, Backups, Health

## Security

- JWT access + refresh tokens (httpOnly cookies)
- RBAC with granular permissions
- bcrypt password hashing
- Helmet, CORS, rate limiting
- Input validation and sanitization
- Audit logs for privileged operations

## Testing

```bash
pnpm test
```

## Documentation

See [docs/SRS.md](docs/SRS.md) for the complete Software Requirements Specification.
