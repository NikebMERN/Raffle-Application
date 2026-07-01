# Deployment Guide

The app is three deployables:

| Component | Type | Default port | Serve as |
|-----------|------|--------------|----------|
| `backend` | Node/Express + Firebase | 5000 | long-running service |
| `frontend`| React SPA (Vite) | 3000 | static files (nginx/CDN) |
| `admin`   | React SPA (Vite) | 3001 | static files (nginx/CDN) |

On first start the backend **auto-bootstraps** Firestore (default settings, opening round, reward config) — no seed step. Most business config (ticket price, club name, winners, discounts, etc.) is edited live from the admin **Settings** page.

## 1. What you must provide (secrets / accounts)

- **Firebase project** with **Authentication** (enable **Google** for the public site and **Email/Password** for admin) and **Cloud Firestore** enabled.
- **Backend Admin credentials** — `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` in `backend/.env`. In containers prefer these three env vars over the service-account JSON file.
- **Frontend/admin web config** — `VITE_FIREBASE_*` in `frontend/.env` and `admin/.env`.
- **`ADMIN_EMAILS`** — your email(s); the first sign-in is promoted to `super_admin`. All later role changes happen in the admin **Users** page.
- **Stripe** (only if handling real money) — `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`, webhook pointed at `/api/v1/payments/webhook`. When Stripe is configured, the demo-only free wallet top-up is automatically disabled; funding goes through card deposit.

## 2. Production env vars (backend)

| Var | Purpose |
|-----|---------|
| `NODE_ENV=production` | Enables trust-proxy default + prod logging + hides error internals |
| `FRONTEND_URL`, `ADMIN_URL` | Exact origins of the deployed SPAs (used for CORS) |
| `CORS_ORIGINS` | Optional extra comma-separated allowed origins |
| `TRUST_PROXY` | Proxy hops (defaults to `1` in production) — required behind nginx/a load balancer for correct client IPs + rate limiting |
| `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX` | Optional per-minute limits (defaults 100 / 30) |

**Frontend/admin:** set `VITE_API_URL` to the **deployed** backend URL before building (Vite bakes it into the bundle at build time).

## 3. Build

```bash
npm run install:all
npm run build          # builds BOTH frontend and admin (into their dist/)
```

## 4. Run / host

- **Backend:** `cd backend && npm start` behind HTTPS (nginx/Caddy/PaaS). Set the env vars above.
- **Frontend & admin:** deploy the `dist/` folders to any static host/CDN (nginx, Netlify, Vercel, S3+CloudFront). SPA routing needs an `index.html` fallback — the provided `nginx.conf` files already do this.

### Docker (all three)

```bash
# Set VITE_API_URL in frontend/.env and admin/.env first (baked at build time).
docker compose build
docker compose up -d
# frontend :3000  admin :3001  backend :5000
```

Backend secrets are injected at **runtime** via `env_file: backend/.env` and are **not** baked into the image (`.dockerignore` excludes `.env` and any `*firebase-adminsdk*.json`). The backend image runs as a non-root user with a `HEALTHCHECK` on `/api/health`.

## 5. Security notes

- **Never commit or bake secrets.** `backend/.env` and the service-account JSON are gitignored and excluded from Docker images — keep it that way; inject config at runtime.
- Add your production web domains to Firebase Auth **Authorized domains**.
- Publish restrictive **Firestore security rules** (the backend uses the Admin SDK and bypasses rules, but lock down any direct client access).
- Terminate **HTTPS** at your proxy/load balancer.

## Firestore notes

- Composite indexes: queries needing one degrade to an in-memory sort automatically; for scale, create the index from the one-click URL Firestore logs.
- The draw uses `crypto.randomInt` and an ACTIVE→DRAWING transaction lock to prevent concurrent draws.

## Monitoring

- Health endpoint: `GET /api/health` (reports Firestore connectivity).
- Audit logs: Admin panel → Audit Logs.
