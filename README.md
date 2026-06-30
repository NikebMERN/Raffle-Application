# SF Football Club Community Raffle

Production-ready MERN stack raffle platform for SF Football Club.

## Stacks

| Layer | Path | Technology |
|-------|------|------------|
| **Backend (primary)** | `/backend` | Express.js, MongoDB, Mongoose, Socket.io, Redis |
| **Frontend (primary)** | `/frontend` | React, Vite, Redux Toolkit, Tailwind CSS |
| **Legacy API** | `/apps/api` | NestJS + Prisma (MongoDB) |
| **Legacy Web** | `/apps/web` | Next.js 15 |

## Quick Start (MERN)

```bash
# Start MongoDB + Redis
docker compose -f docker/docker-compose.yml up -d mongodb redis

# Backend
cd backend && npm install && npm run seed && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api/health

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@sffootballclub.example | Admin123! |
| User | user@sffootballclub.example | User123! |

## Core Business Rules

- **1000** tickets per round
- **800** tickets required before draw
- **10** winners with fixed prize pool percentages (25%, 20%, 15%... 3%)
- Bulk discounts: 5+/10+/25+/50+/100 tickets
- Cryptographically secure draw with audit hash
- Auto-start new round after draw
- Admin reward configuration (number of winners + amounts)

## Environment Files

Pre-filled (local only, gitignored):
- `backend/.env` — MongoDB, JWT, Stripe, Redis
- `frontend/.env` — API URL

**Add your Stripe keys** in `backend/.env`:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Implementation Status

See [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md) for full feature audit (~48% complete, 270/563 items).

## Documentation

- [docs/SRS.md](docs/SRS.md)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)
