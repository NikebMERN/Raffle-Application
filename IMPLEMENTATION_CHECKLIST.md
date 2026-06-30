# SF Football Club Raffle — Implementation Checklist

**Project:** SF Football Club Community Raffle Management System  
**Stack:** `/backend` (Express + Mongoose) · `/frontend` (Vite + React)  
**Legend:** `[x]` Implemented · `[~]` Partial / legacy only · `[ ]` Not implemented

---

## 1. Project Structure

### 1.1 Backend (`/backend`)

- [x] `src/app.js` — Express application setup
- [x] `src/server.js` — HTTP server bootstrap
- [x] `src/config/database.js` — MongoDB connection
- [x] `src/config/redis.js` — Redis client
- [x] `src/config/auth.js` — JWT secrets and expiry
- [x] `src/config/queue.js` — BullMQ job queue
- [x] `src/config/logger.js` — Winston logger
- [x] `src/models/User.js`
- [x] `src/models/Raffle.js`
- [x] `src/models/Ticket.js`
- [x] `src/models/Transaction.js`
- [x] `src/models/Notification.js`
- [x] `src/models/AuditLog.js`
- [x] `src/models/Settings.js`
- [x] `src/models/RewardConfig.js`
- [x] `src/controllers/authController.js`
- [x] `src/controllers/raffleController.js`
- [x] `src/controllers/ticketController.js`
- [x] `src/controllers/paymentController.js`
- [x] `src/controllers/userController.js`
- [x] `src/controllers/adminController.js`
- [x] `src/services/authService.js`
- [x] `src/services/raffleService.js`
- [x] `src/services/ticketService.js`
- [x] `src/services/paymentService.js`
- [x] `src/services/drawService.js`
- [x] `src/services/notificationService.js`
- [x] `src/services/walletService.js`
- [x] `src/services/analyticsService.js`
- [x] `src/middleware/auth.js`
- [x] `src/middleware/role.js`
- [x] `src/middleware/validation.js`
- [x] `src/middleware/rateLimit.js`
- [x] `src/middleware/errorHandler.js`
- [x] `src/routes/v1/authRoutes.js`
- [x] `src/routes/v1/raffleRoutes.js`
- [x] `src/routes/v1/ticketRoutes.js`
- [x] `src/routes/v1/paymentRoutes.js`
- [x] `src/routes/v1/userRoutes.js`
- [x] `src/routes/v1/adminRoutes.js`
- [x] `src/utils/helpers.js`
- [x] `src/utils/validators.js`
- [x] `src/utils/formatters.js`
- [x] `src/utils/crypto.js`
- [x] `src/utils/constants.js`
- [x] `src/jobs/drawJob.js`
- [x] `src/jobs/emailJob.js`
- [x] `src/jobs/reminderJob.js`
- [x] `src/jobs/cleanupJob.js`
- [x] `src/websocket/socket.js`
- [x] `src/websocket/handlers.js`
- [x] `src/websocket/events.js`
- [x] `src/scripts/seed.js`
- [x] `package.json`
- [x] `.env` / `.env.example`
- [x] `Dockerfile`
- [x] `README.md`
- [~] Separate `routes/index.js` aggregator (routes mounted directly in `app.js`)
- [~] Dedicated `drawController.js` (draw logic in `drawService` + `adminController`)
- [~] Dedicated `notificationController.js` (notifications via services only)
- [~] Dedicated `walletController.js` (wallet via `paymentController` / services)
- [ ] `src/models/Prize.js` (prizes embedded in Raffle/RewardConfig)
- [ ] `src/models/TicketBook.js` (offline seller books)
- [ ] `src/models/Sale.js` (separate sale entity)
- [ ] `src/models/Draw.js` (draw results embedded in Raffle)
- [ ] `src/models/WalletTransaction.js` (ledger on User balance only)
- [ ] `src/models/NotificationTemplate.js`
- [ ] `src/models/ActivityLog.js`
- [ ] `src/models/SecurityLog.js`
- [ ] `src/models/SellerCommission.js`

### 1.2 Frontend (`/frontend`)

- [x] `src/index.jsx` — app entry
- [x] `src/Routes.jsx` — React Router
- [x] `src/context/AuthContext.jsx`
- [x] `src/store/index.js` — Redux store
- [x] `src/services/api.js`
- [x] `src/services/socket.js`
- [x] `src/components/common/Layout.jsx`
- [x] `src/components/common/Button.jsx`
- [x] `src/components/common/Card.jsx`
- [x] `src/components/common/Spinner.jsx`
- [x] `src/components/auth/Login.jsx`
- [x] `src/components/auth/Register.jsx`
- [x] `src/components/raffle/RaffleCard.jsx`
- [x] `src/components/raffle/TicketGrid.jsx`
- [x] `src/pages/Home.jsx`
- [x] `src/pages/Raffles.jsx`
- [x] `src/pages/RaffleDetail.jsx`
- [x] `src/pages/Admin.jsx`
- [x] `src/styles/globals.css`
- [x] `src/styles/theme.js`
- [x] `src/utils/constants.js`
- [x] `src/utils/formatters.js`
- [x] `src/hooks/useAuth.js`
- [x] `tailwind.config.js`
- [x] `public/manifest.json`
- [x] `Dockerfile`
- [x] `.env` / `.env.example`
- [x] `vite.config.js`
- [x] `package.json`
- [ ] `src/pages/Dashboard.jsx` (route stub only)
- [ ] `src/pages/MyTickets.jsx` (route stub only)
- [ ] `src/pages/Wallet.jsx` (route stub only)
- [ ] `src/pages/Profile.jsx`
- [ ] `src/pages/ForgotPassword.jsx`
- [ ] `src/pages/ResetPassword.jsx`
- [ ] `src/pages/Notifications.jsx`
- [ ] `src/pages/Winners.jsx`
- [ ] `src/pages/HowItWorks.jsx`
- [ ] `src/pages/PrivacyPolicy.jsx` (GDPR)
- [ ] `src/pages/TermsOfService.jsx`
- [ ] `src/pages/CookiePolicy.jsx`
- [ ] `src/pages/KYC.jsx`
- [ ] `src/pages/SellerDashboard.jsx`
- [ ] `src/pages/FinanceDashboard.jsx`
- [ ] `src/components/auth/ForgotPasswordForm.jsx`
- [ ] `src/components/auth/ResetPasswordForm.jsx`
- [ ] `src/components/auth/TwoFactorSetup.jsx`
- [ ] `src/components/auth/EmailVerification.jsx`
- [ ] `src/components/raffle/TicketSelector.jsx`
- [ ] `src/components/raffle/PurchaseModal.jsx`
- [ ] `src/components/raffle/WinnerAnnouncement.jsx`
- [ ] `src/components/raffle/CountdownTimer.jsx`
- [ ] `src/components/payment/StripeCheckout.jsx`
- [ ] `src/components/payment/PayPalButton.jsx`
- [ ] `src/components/payment/WalletTopUp.jsx`
- [ ] `src/components/wallet/WalletBalance.jsx`
- [ ] `src/components/wallet/TransactionHistory.jsx`
- [ ] `src/components/notifications/NotificationBell.jsx`
- [ ] `src/components/notifications/NotificationList.jsx`
- [ ] `src/components/admin/AdminSidebar.jsx`
- [ ] `src/components/admin/DataTable.jsx`
- [ ] `src/components/admin/StatCard.jsx`
- [ ] `src/components/admin/UserManagement.jsx`
- [ ] `src/components/admin/RaffleManagement.jsx`
- [ ] `src/components/admin/TicketManagement.jsx`
- [ ] `src/components/admin/AuditLogViewer.jsx`
- [ ] `src/components/admin/ReportsPanel.jsx`
- [ ] `src/components/admin/SettingsPanel.jsx`
- [ ] `src/components/common/Modal.jsx`
- [ ] `src/components/common/Toast.jsx`
- [ ] `src/components/common/Pagination.jsx`
- [ ] `src/components/common/SearchBar.jsx`
- [ ] `src/components/common/ErrorBoundary.jsx`
- [ ] `src/components/common/Footer.jsx`
- [ ] `src/components/common/Navbar.jsx` (nav in Layout only)
- [~] Admin sub-pages (users, tickets, reports, etc.) — legacy `apps/web` only
- [~] Seller / Finance dashboards — legacy `apps/web` only
- [~] Redux RTK Query API slice
- [~] `src/store/api/` RTK Query endpoints

### 1.3 Infrastructure & Monorepo

- [x] Root `docker-compose.yml`
- [x] `docker/docker-compose.yml`
- [x] `docker/Dockerfile.backend`
- [x] `docker/Dockerfile.frontend`
- [~] `kubernetes/` manifests (backend-focused; not fully integrated)
- [~] Legacy `apps/api` NestJS monorepo package
- [~] Legacy `apps/web` Next.js monorepo package
- [~] `pnpm-workspace.yaml` / `turbo.json`
- [ ] Unified CI for `/backend` + `/frontend` Express/Vite stack

---

## 2. Authentication & Authorization

### 2.1 Registration & Login

- [x] User registration (email, password, first/last name)
- [~] Username field (registration yes; login email-only)
- [x] Password strength validation (upper, lower, number, special, min 8)
- [x] Duplicate email/username check
- [x] Login with email + password
- [x] JWT access token issuance
- [x] JWT refresh token issuance
- [x] Logout (clear cookies)
- [x] `GET /api/v1/auth/me` current user
- [x] Account lockout after failed login attempts
- [x] Login rate limiting
- [~] Refresh token endpoint (`/refresh` — legacy NestJS only)
- [~] httpOnly secure cookie token storage (backend sets cookies; frontend uses localStorage via api.js)
- [ ] Login with username (email or username)
- [ ] OAuth / social login (Google, Facebook)
- [ ] Magic link login
- [ ] Device trust / remember device

### 2.2 Password Management

- [x] Forgot password endpoint
- [x] Reset password endpoint
- [x] Password reset token expiry
- [ ] Forgot password UI page (`/frontend`)
- [ ] Reset password UI page (`/frontend`)
- [ ] Password change while logged in

### 2.3 Two-Factor Authentication (2FA)

- [x] 2FA setup endpoint (`POST /2fa/setup`) — TOTP secret + QR
- [x] 2FA enable endpoint (`POST /2fa/enable`)
- [x] 2FA verification on login
- [x] Backup codes generation
- [x] 2FA code input on Login.jsx
- [ ] 2FA setup UI component
- [ ] 2FA disable endpoint + UI
- [ ] SMS-based 2FA (Twilio)

### 2.4 Email Verification

- [x] Email verification token on registration
- [x] `emailVerified` flag on User model
- [ ] Email verification endpoint
- [ ] Resend verification email
- [ ] Email verification UI page
- [ ] Block unverified users from purchasing

### 2.5 Role-Based Access Control (RBAC)

- [x] Roles: USER, ADMIN, SUPER_ADMIN, SELLER, FINANCE
- [x] `authenticate` middleware
- [x] `requireAdmin` role middleware
- [~] Granular permissions (create/read/update/delete/export) — legacy NestJS `permissions.guard` only
- [~] Finance role routes — legacy only
- [~] Community Seller role routes — legacy only
- [ ] Permission decorator per-route matrix
- [ ] Role management admin UI

### 2.6 KYC & Compliance

- [ ] KYC document upload flow
- [ ] KYC verification status on User
- [ ] KYC admin review panel
- [ ] Age verification gate
- [ ] GDPR consent capture on registration
- [ ] GDPR data export endpoint
- [ ] GDPR data deletion (right to be forgotten)
- [ ] Privacy Policy page
- [ ] Terms of Service page
- [ ] Cookie consent banner

---

## 3. Raffle Engine

### 3.1 Raffle Lifecycle

- [x] Create raffle (admin)
- [x] List active raffles (public)
- [x] Get raffle by ID
- [x] Raffle statuses: draft, active, drawing, completed, cancelled
- [x] Auto-generate 1000 tickets per raffle
- [x] Configurable ticket price
- [x] Configurable max tickets per user
- [x] Start/end dates
- [x] Round number tracking
- [x] Auto new round after draw completes
- [~] Multiple rounds per raffle entity — legacy NestJS rounds module
- [~] Raffle image upload
- [ ] Raffle edit/archive admin UI
- [ ] Raffle draft → active publish workflow UI

### 3.2 Business Rules

- [x] 1000 total tickets per round (`DEFAULTS.TOTAL_TICKETS`)
- [x] 800 minimum sold to draw (`DEFAULTS.REQUIRED_SOLD`)
- [x] 10 winners per draw (`DEFAULTS.WINNERS_COUNT`)
- [x] Prize % distribution (25/20/15/10/8/6/5/4/4/3 = 100%)
- [x] Bulk purchase discounts (5/10/25/50/100 ticket tiers)
- [x] Ticket reservation with 5-minute timeout
- [x] Max tickets per user enforcement
- [x] Sold count tracking on raffle
- [x] Prize pool calculation
- [ ] Offline ticket book assignment (seller workflow)
- [ ] Offline sale recording
- [ ] Seller commission (10%) calculation
- [ ] Ticket return/lost/void workflows

### 3.3 Ticket Operations

- [x] Ticket grid API (`getTicketGrid`)
- [x] Reserve tickets endpoint
- [x] Release expired reservations (cleanup job)
- [x] Assign tickets permanently on payment
- [x] Ticket statuses: available, reserved, sold, cancelled, returned, lost, voided
- [x] List user tickets
- [x] TicketGrid.jsx visual grid
- [~] Ticket number selection UI (grid shows status; purchase flow basic)
- [ ] My Tickets full page UI
- [ ] Ticket PDF receipt generation
- [ ] QR code on ticket

---

## 4. Draw Engine

### 4.1 Secure Draw Execution

- [x] Admin-triggered draw (`POST /api/v1/admin/draws/:raffleId`)
- [x] Minimum sold tickets validation (800)
- [x] Only SOLD tickets eligible
- [x] Cryptographic shuffle (`shuffleArray` + seed)
- [x] `crypto.randomInt` / secure random selection
- [x] Participant hash (SHA-256 audit trail)
- [x] Draw seed stored on raffle
- [x] 10 winners selected with rank
- [x] Prize amount per winner from % distribution
- [x] Claim deadline (30 days)
- [x] Audit log entry on draw
- [x] Draw job (`drawJob.js`) for scheduled draws
- [~] Redis distributed lock during draw — referenced in SRS; partial in draw flow
- [ ] Draw replay protection (idempotency key)
- [ ] Public draw audit report download (PDF)

### 4.2 Post-Draw

- [x] Raffle status → completed after draw
- [x] Winners array persisted on raffle
- [x] Winner in-app notifications
- [x] Winner email notifications (dev/log mode)
- [x] Auto-create next round (`createNextRound`)
- [x] WebSocket `draw_started` / winner events
- [ ] Winner claim workflow UI
- [ ] Unclaimed prize rollover
- [ ] Public winners page

---

## 5. Payment & Wallet

### 5.1 Stripe Integration

- [x] Stripe Checkout session creation
- [x] Stripe webhook handler endpoint
- [x] Transaction model (pending/completed/failed/refunded)
- [x] Auto-fulfill in demo mode (no Stripe key)
- [x] Bulk discount applied at checkout
- [x] Ticket assignment on successful payment
- [x] Payment failure notification
- [ ] Stripe Payment Element (embedded checkout)
- [ ] Stripe live keys production config
- [ ] Refund endpoint + admin UI
- [ ] StripeCustomer portal

### 5.2 PayPal

- [ ] PayPal SDK integration
- [ ] PayPal checkout button
- [ ] PayPal webhook handler
- [ ] PayPal refund support

### 5.3 Wallet

- [x] Wallet balance on User model
- [x] Credit / debit wallet service
- [x] Pay with wallet for tickets
- [x] Wallet top-up endpoint
- [x] Audit log on wallet movements
- [~] Double-entry ledger (single balance field; no WalletTransaction model)
- [~] Wallet UI page (route stub only)
- [~] Wallet admin view — legacy `apps/web` only
- [ ] Transaction history API + UI
- [ ] Wallet withdrawal request

### 5.4 Pricing

- [x] `calculateTotalPrice` with bulk discounts
- [x] Unit tests for pricing logic
- [ ] Promo / referral codes
- [ ] Dynamic pricing rules

---

## 6. Notifications

### 6.1 Channels

- [x] In-app notifications (Notification model)
- [x] Email via nodemailer (dev/ethereal mode)
- [x] Notification preferences on User model
- [x] `getUserNotifications` / mark read / mark all read
- [~] SendGrid production delivery (env var stub; logs only)
- [~] Email job queue (`emailJob.js`)
- [ ] Twilio SMS notifications
- [ ] Firebase Cloud Messaging push notifications
- [ ] Web push notifications (service worker)

### 6.2 Notification Events

- [x] Welcome email on registration
- [x] Winner notification (email + in-app)
- [x] Payment confirmation notification
- [x] Draw started WebSocket event
- [x] Reminder job (`reminderJob.js`)
- [~] Password reset email (endpoint exists; email dev mode)
- [~] Seller book assigned — legacy offline flow only
- [ ] Ticket purchased email (template)
- [ ] Draw reminder email to participants
- [ ] Payment failed email (production)
- [ ] Notification bell UI component
- [ ] Notification list UI component
- [ ] Notification template admin CRUD

---

## 7. Security

### 7.1 Application Security

- [x] Helmet HTTP headers
- [x] CORS with credentials
- [x] XSS sanitization (`xss-clean`)
- [x] bcrypt password hashing (12 rounds)
- [x] JWT signed tokens
- [x] Rate limiting (API + login limiter)
- [x] Input validation (Joi schemas)
- [x] Request body size limit
- [x] Account lockout on brute force
- [x] Audit logs for privileged operations
- [x] Suspicious login flagging
- [~] CSRF protection (SRS requirement; not explicitly in Express app)
- [~] Refresh token rotation
- [ ] Security headers CSP tuning
- [ ] IP allowlist for admin
- [ ] WAF / DDoS protection (infrastructure)
- [ ] Penetration test report
- [ ] Dependency vulnerability scanning in CI

### 7.2 Data Protection

- [x] Password never returned in API responses
- [x] 2FA secrets stored server-side only
- [~] PII encryption at rest
- [ ] GDPR data retention policies
- [ ] Automated PII redaction in logs
- [ ] S3 backup encryption

---

## 8. Frontend (User Experience)

### 8.1 Public Pages

- [x] Home page with club branding
- [x] Raffles listing page
- [x] Raffle detail page with ticket grid
- [x] Login page
- [x] Register page
- [x] 404 page (basic)
- [ ] How It Works page
- [ ] Winners hall of fame page
- [ ] FAQ page
- [ ] Contact page

### 8.2 Authenticated User

- [ ] User dashboard (full — route stub only)
- [ ] My tickets page (full — route stub only)
- [ ] Wallet page (full — route stub only)
- [ ] Profile settings page
- [ ] Notification center page
- [ ] Purchase history page
- [ ] Referral program UI

### 8.3 Purchase Flow

- [x] Ticket quantity selection on RaffleDetail
- [x] API purchase call
- [~] Stripe redirect checkout (backend ready; minimal frontend redirect)
- [ ] Purchase confirmation modal
- [ ] Payment success/failure pages
- [ ] Cart / basket persistence

### 8.4 State Management

- [x] AuthContext for auth state
- [x] Redux store (raffle + notifications slices)
- [x] API service layer (`api.js`)
- [x] Socket service (`socket.js`)
- [ ] Redux RTK Query
- [ ] Optimistic UI updates
- [ ] Offline support / service worker (beyond manifest)

### 8.5 Accessibility & PWA

- [x] `manifest.json` for PWA install
- [x] Tailwind responsive layout
- [~] Basic semantic HTML
- [ ] Full WCAG 2.1 AA audit
- [ ] Keyboard navigation audit
- [ ] Screen reader testing
- [ ] Focus management in modals
- [ ] Color contrast compliance report
- [ ] Service worker for offline caching

---

## 9. Admin Dashboard

### 9.1 Overview & Analytics

- [x] Admin overview stats (users, raffles, revenue)
- [x] Active round display
- [x] Execute draw button
- [x] `analyticsService.js`
- [~] Reports endpoint (basic in adminController)
- [~] Full reports UI — legacy `apps/web/admin/reports` only
- [ ] Real-time sales chart
- [ ] Export CSV/PDF from admin UI

### 9.2 Reward Configuration

- [x] RewardConfig model
- [x] List / create / update / delete reward configs
- [x] Admin reward config form on Admin.jsx
- [x] Configurable number of winners
- [x] Prize amounts per position
- [ ] Reward config preview before save
- [ ] Apply config to active raffle wizard

### 9.3 User Management

- [x] List users API (admin)
- [~] User search/filter — backend partial
- [~] User management UI — legacy `apps/web/admin/users` only
- [ ] Ban/suspend user UI
- [ ] Role assignment UI
- [ ] Bulk user import (CSV)

### 9.4 Raffle & Ticket Admin

- [~] Raffle CRUD UI — legacy only
- [~] Ticket management UI — legacy only
- [~] Ticket book assignment — legacy only
- [~] Offline sales recording — legacy only
- [ ] Draw history viewer
- [ ] Manual ticket void/return

### 9.5 Settings & Audit

- [x] Settings model + get/update API
- [x] Audit logs list API
- [~] Settings admin UI — legacy only
- [~] Audit log viewer UI — legacy only
- [ ] System maintenance mode toggle UI
- [ ] Commission rate configuration UI

---

## 10. WebSocket (Real-Time)

- [x] Socket.io server initialization
- [x] JWT auth on socket handshake
- [x] Connection / disconnect handlers
- [x] Raffle room join (`raffle:{id}`)
- [x] `draw_started` event emission
- [x] Winner announcement events
- [x] Ticket sold count updates
- [x] Frontend `socket.js` client
- [~] Frontend live ticket grid updates (socket connected; partial UI refresh)
- [ ] Reconnection backoff strategy
- [ ] Presence indicators (users viewing raffle)
- [ ] Admin live dashboard feed

---

## 11. Database

### 11.1 MongoDB Models (Mongoose)

- [x] User collection with indexes
- [x] Raffle collection
- [x] Ticket collection (ticketNumber index)
- [x] Transaction collection
- [x] Notification collection
- [x] AuditLog collection
- [x] Settings collection
- [x] RewardConfig collection
- [x] Seed script with demo data
- [~] Prisma schema — legacy `apps/api` (MongoDB)
- [ ] Database migrations framework (Mongoose versioning)
- [ ] TicketBook collection
- [ ] Sale collection
- [ ] Draw collection (standalone)
- [ ] WalletTransaction ledger collection
- [ ] NotificationTemplate collection

### 11.2 Redis

- [x] Redis client configuration
- [x] BullMQ queue on Redis
- [~] Draw distributed lock (SRS specifies; partial implementation)
- [ ] Session store in Redis
- [ ] Rate limit store in Redis (in-memory fallback possible)
- [ ] Pub/sub for horizontal socket scaling

### 11.3 Data Integrity

- [x] Unique email constraint
- [x] Unique username constraint
- [x] Unique ticket number per raffle
- [x] Timestamps on all models
- [ ] MongoDB replica set production config
- [ ] Daily backup to S3
- [ ] Point-in-time recovery

---

## 12. Deployment

### 12.1 Containerization

- [x] Backend Dockerfile
- [x] Frontend Dockerfile
- [x] docker-compose.yml (MongoDB + Redis + services)
- [x] Environment variable templates
- [~] Multi-stage Docker builds (basic)
- [ ] Docker Compose production override
- [ ] Health check in frontend container

### 12.2 Kubernetes

- [~] `kubernetes/deployment.yaml` (backend)
- [~] `kubernetes/service.yaml`
- [~] `kubernetes/ingress.yaml`
- [~] `kubernetes/configmap.yaml`
- [ ] Frontend K8s deployment manifest
- [ ] Helm chart
- [ ] Horizontal Pod Autoscaler
- [ ] Secrets management (Vault / K8s secrets)

### 12.3 CI/CD

- [x] `.github/workflows/ci.yml`
- [x] `.github/workflows/test.yml`
- [~] CI targets legacy `apps/api` + `apps/web` (not `/backend` + `/frontend`)
- [ ] Staging environment auto-deploy
- [ ] Production blue-green deploy
- [ ] Database migration in deploy pipeline
- [ ] Slack/email deploy notifications

### 12.4 Production Config

- [~] HTTPS / TLS (documented; not enforced in dev)
- [ ] Strong production JWT secrets rotation
- [ ] Stripe live webhook URL
- [ ] SendGrid production sender domain
- [ ] CDN for frontend static assets
- [ ] Custom domain + SSL certificate

---

## 13. Testing

### 13.1 Backend Tests

- [x] `tests/unit/helpers.test.js` (pricing, prize distribution)
- [~] `apps/api/src/tests/business-rules.test.ts` — legacy NestJS only
- [ ] Auth service unit tests
- [ ] Draw service unit tests
- [ ] Ticket reservation unit tests
- [ ] Payment webhook integration tests
- [ ] Wallet ledger unit tests
- [ ] API route integration tests (supertest)
- [ ] MongoDB memory server test setup

### 13.2 Frontend Tests

- [ ] Component unit tests (Vitest + RTL)
- [ ] Auth flow component tests
- [ ] TicketGrid component tests
- [ ] Redux store tests
- [ ] API mock tests

### 13.3 End-to-End

- [~] `apps/web/e2e/smoke.spec.ts` — legacy Playwright (3 tests)
- [ ] Full E2E: register → login → purchase → draw
- [ ] E2E admin draw workflow
- [ ] E2E 2FA login flow
- [ ] E2E wallet purchase flow
- [ ] Playwright config for `/frontend` Vite app

### 13.4 Load & Performance

- [ ] K6 load test scripts
- [ ] 1000 concurrent user simulation
- [ ] Draw under load test
- [ ] API response time benchmarks (<500ms reads)
- [ ] Lighthouse performance audit

---

## 14. Monitoring & Observability

### 14.1 Health & Logging

- [x] `GET /api/health` endpoint
- [x] Winston structured logging
- [x] Morgan HTTP request logging
- [~] Swagger / OpenAPI docs — legacy NestJS `/api/docs` only
- [ ] Request correlation IDs
- [ ] Log aggregation (ELK / CloudWatch)
- [ ] Error tracking (Sentry)

### 14.2 Metrics

- [ ] Prometheus metrics exporter
- [ ] Grafana dashboards
- [ ] API latency histograms
- [ ] Active raffle gauge
- [ ] Tickets sold counter
- [ ] Payment success/failure rates
- [ ] WebSocket connection count
- [ ] Redis / MongoDB health alerts
- [ ] Uptime monitoring (Pingdom / UptimeRobot)

---

## 15. Final Verification

### 15.1 Core User Journeys

- [x] Register new user account
- [x] Login with email/password
- [x] Browse active raffles
- [x] View raffle ticket grid
- [~] Purchase tickets end-to-end (demo auto-pay works; Stripe UI partial)
- [~] View my tickets (API yes; UI stub)
- [x] Admin view overview dashboard
- [x] Admin configure rewards
- [x] Admin execute draw (≥800 sold)
- [x] Winners notified after draw
- [ ] Complete Stripe live payment journey
- [ ] Seller offline ticket sale journey
- [ ] Finance reconciliation journey

### 15.2 Business Rule Verification

- [x] Exactly 1000 tickets generated per round
- [x] Draw blocked below 800 sold
- [x] Exactly 10 winners with correct % split
- [x] Bulk discount tiers apply correctly
- [x] Reservation expires after 5 minutes
- [x] New round auto-created after draw
- [x] Audit log written on draw
- [ ] Commission calculated correctly for sellers
- [ ] Only SOLD tickets in draw pool (verified by unit test)

### 15.3 Production Readiness

- [x] Environment variables documented
- [x] Seed data for demo accounts
- [x] Docker local development works
- [~] README for backend and root (legacy-focused root README)
- [ ] Production deployment runbook executed
- [ ] Security review sign-off
- [ ] Load test sign-off
- [ ] GDPR compliance sign-off
- [ ] Backup restore drill completed

---

## 16. Critical Top 10 (Must-Have for Launch)

| # | Item | Status |
|---|------|--------|
| 1 | User registration & login with JWT | [x] |
| 2 | 1000-ticket raffle with 800 minimum sold rule | [x] |
| 3 | Secure cryptographic draw with 10 winners | [x] |
| 4 | Stripe payment integration (checkout + webhook) | [x] |
| 5 | Ticket reservation & purchase flow | [x] |
| 6 | Admin dashboard with draw execution | [x] |
| 7 | Reward configuration (admin) | [x] |
| 8 | Real-time WebSocket draw/sales updates | [x] |
| 9 | Audit logging for privileged actions | [x] |
| 10 | Production email notifications (SendGrid) | [ ] |

**Critical Top 10 Score: 9/10 complete**

---

## 17. Progress Tracking

### By Area

| Area | Implemented | Partial | Not Done | Total | % Complete |
|------|-------------|---------|----------|-------|------------|
| Project Structure | 90 | 12 | 56 | 158 | 61% |
| Auth | 23 | 6 | 26 | 55 | 48% |
| Raffle Engine | 26 | 3 | 9 | 38 | 70% |
| Draw | 18 | 1 | 5 | 24 | 77% |
| Payment & Wallet | 14 | 3 | 12 | 29 | 53% |
| Notifications | 9 | 4 | 9 | 22 | 50% |
| Security | 13 | 3 | 8 | 24 | 60% |
| Frontend UX | 14 | 2 | 23 | 39 | 38% |
| Admin | 12 | 10 | 11 | 33 | 48% |
| WebSocket | 8 | 1 | 3 | 12 | 71% |
| Database | 15 | 2 | 12 | 29 | 57% |
| Deployment | 6 | 7 | 15 | 28 | 32% |
| Testing | 1 | 2 | 22 | 25 | 8% |
| Monitoring | 3 | 1 | 12 | 16 | 25% |
| Final Verification | 18 | 3 | 10 | 31 | 63% |

*% Complete = (implemented + 0.5 × partial) ÷ total*

### Milestone Status

| Milestone | Target | Status |
|-----------|--------|--------|
| M1: Backend API core | Week 1–2 | **Done** |
| M2: Raffle + Draw engine | Week 2–3 | **Done** |
| M3: Payments (Stripe) | Week 3–4 | **Done** (demo + Stripe) |
| M4: Frontend public site | Week 4–5 | **Done** (core pages) |
| M5: Admin dashboard | Week 5–6 | **Partial** (single Admin page) |
| M6: Notifications production | Week 6 | **Not started** (SendGrid/Twilio/Firebase) |
| M7: Full user dashboard UI | Week 7 | **Not started** |
| M8: E2E + load testing | Week 8 | **Not started** |
| M9: K8s production deploy | Week 9 | **Partial** (manifests only) |
| M10: GDPR + KYC compliance | Week 10 | **Not started** |

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Items** | **563** |
| **Implemented [x]** | **270** |
| **Partial [~]** | **60** |
| **Not implemented [ ]** | **233** |
| **Percentage complete** | **48%** strict · **53%** weighted (partial = 0.5) |

*Section 16 (Critical Top 10) is a launch-priority subset of items above and is not double-counted in totals.*

**Last Updated:** 2026-06-30
