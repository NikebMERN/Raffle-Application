# Football Club Community Raffle

Production-ready raffle platform. React + Express, **Firebase Authentication (Google sign-in)** and **Cloud Firestore** as the database.

## Stack

| Layer | Path | Technology |
|-------|------|------------|
| **Frontend** | `/frontend` | React, Vite, Redux Toolkit, Tailwind CSS, Firebase Web SDK |
| **Backend** | `/backend` | Express.js, Firebase Admin SDK (Firestore + Auth), Socket.io |
| **Auth** | — | Google Sign-In via Firebase (ID tokens verified server-side) |
| **Database** | — | Cloud Firestore |
| **Payments** | — | Stripe (optional; demo mode without keys) |

## Quick start

```bash
# From the repo root — creates .env files, installs deps, seeds, and runs both apps
npm start
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api/health

You must fill in your Firebase credentials first (see below), then run `npm start` again.

## Setup: Firebase

1. Create a project at https://console.firebase.google.com.
2. **Authentication → Sign-in method →** enable **Google**.
3. **Firestore Database → Create database** (production or test mode).
4. **Backend credentials:** Project settings → **Service accounts** → *Generate new private key*. Put `project_id`, `client_email`, and `private_key` into `backend/.env` (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`).
5. **Frontend credentials:** Project settings → **General → Your apps → Web app** → copy the SDK config into `frontend/.env` (`VITE_FIREBASE_*`).
6. Add your Google email to `ADMIN_EMAILS` in `backend/.env` — that account becomes `super_admin` on first sign-in.
7. (Optional) Web Push: Project settings → **Cloud Messaging → Web Push certificates** → put the key pair value in `VITE_FIREBASE_VAPID_KEY`.

## Roles

`user`, `community_seller`, `finance`, `admin`, `super_admin`. The **first** admin is bootstrapped via `ADMIN_EMAILS`; every subsequent role change is done from the admin **Users** page (no env edits or scripts).

## Configuration (dynamic)

On first start the backend auto-creates default settings, the opening round and a reward config — there is no required seed step. Club name, ticket price, total tickets, required-sold threshold, winners count, max tickets per user, round length and bulk-discount tiers are all stored in Firestore and editable live from the admin **Settings** page. The backend reads these values at runtime, so changes take effect on the next round/purchase without redeploying. The public site reads branding via `GET /api/v1/config`.

## Core business rules

- 1000 tickets per round, 800 required before a draw
- 10 winners with fixed prize-pool percentages (25%, 20%, 15% … 3%)
- Bulk discounts: 5+/10+/25+/50+/100 tickets
- Cryptographically secure draw with an audit hash
- Firestore transaction draw-lock prevents concurrent draws
- Auto-starts a new round after each draw

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Bootstrap + run everything |
| `npm run dev` | Run backend + frontend (deps already installed) |
| `npm run seed` | Optional — re-run Firestore bootstrap (settings, round 1, reward config). Runs automatically on backend start. |
| `npm run build` | Build the frontend |
| `npm test` | Backend unit tests |

## Documentation

- [docs/SRS.md](docs/SRS.md)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
