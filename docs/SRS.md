# Software Requirements Specification
# Football Club Community Raffle Management System

**Version:** 1.0  
**Status:** Approved for implementation

---

## 1. Introduction

### 1.1 Purpose
Production-ready full-stack web application for managing football club community raffles supporting online and offline ticket sales, draws, prizes, wallets, and multi-role dashboards.

### 1.2 Scope
- Public website for raffle discovery and online ticket purchase
- Role-based dashboards: User, Community Seller, Finance, Super Admin
- Offline ticket book distribution and manual sales tracking
- Cryptographically secure draw engine with audit reports
- Payment processing, wallet ledger, notifications, reports, and analytics

### 1.3 Scale
Must support thousands of concurrent users.

---

## 2. User Roles and Permissions

| Role | Code | Description |
|------|------|-------------|
| Super Admin | `SUPER_ADMIN` | Full system control |
| Finance | `FINANCE` | Financial operations, reconciliation, settlements |
| Community Seller | `COMMUNITY_SELLER` | Offline ticket sales and book management |
| User | `USER` | Online purchases, wallet, personal tickets |

Permissions are granular per module: `create`, `read`, `update`, `delete`, `export`, `import`, `bulk_action`, `draw`, `settle`.

---

## 3. Core Entities

### 3.1 User
- `id`, `email` (unique), `passwordHash`, `firstName`, `lastName`, `phone`, `isActive`, `emailVerified`, `lastLoginAt`, `createdAt`, `updatedAt`

### 3.2 Raffle
- `id`, `title`, `description`, `status` (DRAFT | ACTIVE | CLOSED | DRAWN | ARCHIVED)
- `ticketPrice` (decimal, GBP), `maxTicketsPerUser`, `startDate`, `endDate`, `imageUrl`, `createdAt`, `updatedAt`

### 3.3 Raffle Round
- `id`, `raffleId`, `roundNumber`, `title`, `drawDate`, `status` (PENDING | OPEN | CLOSED | DRAWN)
- Multiple rounds per raffle supported

### 3.4 Prize
- `id`, `roundId`, `name`, `description`, `value`, `position` (1st, 2nd, etc.), `imageUrl`

### 3.5 Ticket Book
- `id`, `raffleId`, `bookNumber` (unique per raffle), `sellerId` (nullable until assigned)
- `startTicketNumber`, `endTicketNumber`, `status` (AVAILABLE | ASSIGNED | RETURNED | LOST)

### 3.6 Ticket
- `id`, `raffleId`, `roundId`, `bookId` (nullable for online), `ticketNumber` (unique per raffle)
- `status`: ASSIGNED | SOLD | UNSOLD | RETURNED | CANCELLED | LOST | VOIDED
- `saleChannel`: ONLINE | OFFLINE
- `buyerId` (nullable), `sellerId` (nullable), `soldAt`, `price`

**Draw eligibility:** Only tickets with status `SOLD` participate. CANCELLED, LOST, RETURNED, VOIDED never participate.

### 3.7 Sale
- `id`, `ticketId`, `userId`, `sellerId`, `channel`, `amount`, `paymentId` (nullable), `createdAt`

### 3.8 Draw
- `id`, `roundId`, `prizeId`, `winnerTicketId`, `drawnAt`, `drawnById`, `method` (CRYPTO_RANDOM), `participantCount`

### 3.9 Draw Audit Report
- `id`, `drawId`, `participantHash` (SHA-256 of sorted ticket IDs), `rngMethod`, `timestamp`, `operatorId`, `reportJson`

### 3.10 Wallet
- `id`, `userId`, `balance` (decimal), `currency` (GBP), `updatedAt`

### 3.11 Wallet Transaction (double-entry ledger)
- `id`, `walletId`, `type` (CREDIT | DEBIT), `amount`, `balanceAfter`, `reference`, `description`, `createdAt`

### 3.12 Payment
- `id`, `userId`, `stripeSessionId`, `stripePaymentIntentId`, `amount`, `status` (PENDING | COMPLETED | FAILED | REFUNDED), `metadata`, `createdAt`

### 3.13 Notification Template
- `id`, `name`, `channel` (EMAIL | SMS | PUSH), `subject`, `body`, `variables` (JSON array)

### 3.14 Notification
- `id`, `userId`, `templateId`, `channel`, `title`, `body`, `status` (PENDING | SENT | FAILED), `sentAt`, `createdAt`

### 3.15 Audit Log
- `id`, `userId`, `action`, `entity`, `entityId`, `oldValue`, `newValue`, `ipAddress`, `createdAt`

### 3.16 Activity Log
- `id`, `userId`, `action`, `details`, `createdAt`

### 3.17 Security Log
- `id`, `event`, `userId`, `ipAddress`, `userAgent`, `details`, `createdAt`

### 3.18 System Setting
- `id`, `key` (unique), `value`, `description`, `updatedAt`

### 3.19 Seller Commission
- Commission rate: **10%** of offline sales (configurable via `system_settings.commission_rate`)
- Outstanding balance = money collected - amount remitted to club
- Performance = sold tickets / assigned tickets * 100

---

## 4. Business Rules

### 4.1 Ticket Sales
- Online: Stripe Checkout → webhook confirms → ticket status SOLD
- Offline: Seller records sale → ticket status SOLD, sale linked to seller
- Ticket numbers must be unique within a raffle

### 4.2 Draw
- Admin triggers draw for a round when status is CLOSED
- System loads all SOLD tickets for that round's raffle
- Uses `crypto.randomInt(0, pool.length)` server-side
- Creates immutable audit report before announcing winner
- Redis lock prevents concurrent draws on same round

### 4.3 Wallet
- All movements recorded as ledger entries
- Balance = sum of credits - sum of debits
- Online purchase credits wallet then debits for ticket (or direct purchase flow)

### 4.4 Commission
- `commission = soldAmount * commissionRate`
- `netRemittance = moneyCollected - commission`

### 4.5 Admin CRUD
Every admin resource supports: Create, Read, Update, Delete, Search, Filter, Sort, Pagination, Export (CSV), Import (CSV), Print, Bulk Actions.

---

## 5. API Modules

- `/api/auth` — register, login, refresh, logout, forgot-password
- `/api/users` — user management
- `/api/roles` — roles and permissions
- `/api/raffles` — raffle CRUD
- `/api/rounds` — round management
- `/api/prizes` — prize management
- `/api/ticket-books` — book assignment
- `/api/tickets` — ticket operations
- `/api/sales` — sales recording
- `/api/draws` — draw execution
- `/api/wallet` — wallet operations
- `/api/payments` — Stripe checkout and webhooks
- `/api/notifications` — notification management
- `/api/reports` — report generation
- `/api/audit-logs` — audit trail
- `/api/rewards` — admin reward configuration (winners count, amounts)
- `/api/health` — system health

---

## 6. Security Requirements

- JWT access (15min) + refresh tokens (7d) in httpOnly secure cookies
- bcrypt password hashing (12 rounds)
- RBAC guards on all protected routes
- Helmet, CORS, rate limiting (100 req/min per IP)
- CSRF protection on cookie-based mutations
- Input validation and sanitization
- HTTPS in production
- Audit logs for privileged operations

---

## 7. Notification Events

| Event | Channels |
|-------|----------|
| Ticket purchased | Email |
| Draw winner selected | Email, Push |
| Seller book assigned | Email |
| Password reset | Email |
| Payment failed | Email |

---

## 8. Reports

- Sales summary (online/offline, by date, by raffle, by seller)
- Seller performance report
- Financial reconciliation report
- Draw audit report
- Ticket inventory report

Export formats: CSV, PDF (print view).

---

## 9. System Settings Keys

- `commission_rate` — default 0.10
- `club_name` — Football Club name
- `ticket_price_default` — default ticket price
- `max_tickets_per_user` — default 10
- `email_from` — sender email
- `maintenance_mode` — boolean

---

## 10. Non-Functional Requirements

- Response time < 500ms for API reads under normal load
- Horizontal scaling via stateless API + Redis
- Database backups daily to S3-compatible storage
- Test coverage for draw eligibility, wallet ledger, RBAC
