# Deployment Guide

## Production checklist

- [ ] Create a Firebase project with **Authentication (Google)** and **Cloud Firestore** enabled
- [ ] Provide backend Firebase Admin credentials (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, or `GOOGLE_APPLICATION_CREDENTIALS`)
- [ ] Provide frontend web config (`VITE_FIREBASE_*`)
- [ ] Set `ADMIN_EMAILS` to bootstrap admin accounts
- [ ] Set Stripe live keys and the webhook endpoint (`/api/v1/payments/webhook`)
- [ ] Enable HTTPS (reverse proxy: nginx, Caddy, or a cloud load balancer)
- [ ] Set `NODE_ENV=production` and `FRONTEND_URL`
- [ ] Add your production web domain to Firebase Auth **Authorized domains**
- [ ] Publish Firestore security rules
- [ ] Configure an email provider via SMTP (optional)

## Build

```bash
npm run install:all
npm run build          # builds the frontend
```

## Run

```bash
# Backend API
cd backend && npm start

# Frontend (static build in frontend/dist) — serve via nginx or any static host
```

## Docker

```bash
docker build -t raffle-backend ./backend
docker build -t raffle-frontend ./frontend
```

Provide the Firebase/Stripe env vars to the backend container at runtime
(e.g. `--env-file backend/.env`). See `kubernetes/` for a sample deployment that
reads non-secret config from a ConfigMap and credentials from a Secret.

## Firestore notes

- Composite indexes: Firestore will print a one-click index creation URL in the
  server logs the first time a query needs one (e.g. notifications ordered per user).
- The draw uses `crypto.randomInt` and an ACTIVE→DRAWING transaction lock on the
  raffle document to prevent concurrent draws.

## Monitoring

- Health endpoint: `GET /api/health` (reports Firestore connectivity)
- Audit logs: Admin panel → Audit Logs
