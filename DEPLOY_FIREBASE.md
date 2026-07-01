# Deploying to Firebase (100% Firebase‑hosted)

This app now runs entirely on Firebase — **no separate server to manage**:

| Piece                     | Where it runs                                        |
| ------------------------- | ---------------------------------------------------- |
| User site (`frontend/`)   | Firebase Hosting                                     |
| Admin site (`admin/`)     | Firebase Hosting (second site)                       |
| Backend API (`backend/`)  | Cloud Functions for Firebase (`api`, HTTPS)          |
| Auto‑draw / cleanup jobs  | Scheduled Cloud Function (`scheduledJobs`, 1 min)    |
| Database & Auth           | Firestore + Firebase Auth                            |

The Express backend is wrapped as a single HTTPS function (`backend/index.js`).
Firebase Hosting rewrites `/api/**` to it, so both sites call `/api/...` on their
own origin (no CORS). Socket.IO was dropped (it can't run on Functions and the
frontend never used it — pages already refetch after actions).

---

## 0. Prerequisites

- **Node 20** locally (Functions run on the Node 20 runtime).
- Firebase CLI: `npm install -g firebase-tools` then `firebase login`.
- **Blaze (pay‑as‑you‑go) plan** on the project. Cloud Functions require it to make
  outbound calls (Stripe). Blaze has a generous free monthly quota — a demo
  typically costs $0. Upgrade at: Firebase Console → ⚙️ → Usage and billing.

---

## 1. Create the second Hosting site (for the admin app)

The `.firebaserc` expects two sites: `raffle-app-22ff4` (user) and
`raffle-app-22ff4-admin` (admin). Create the admin one once:

```bash
firebase hosting:sites:create raffle-app-22ff4-admin
```

If you pick a different name, update `.firebaserc` → `targets.hosting.admin`.

(The targets are already mapped in `.firebaserc`. If the CLI complains, run:
`firebase target:apply hosting app raffle-app-22ff4` and
`firebase target:apply hosting admin raffle-app-22ff4-admin`.)

---

## 2. Configure environment variables

### Backend (the function) — `backend/.env`
Functions v2 auto‑loads this file at deploy. Make sure it has:

```env
# Firebase Admin — optional on Functions (the runtime service account is used
# automatically), but harmless to keep. Required for local dev.
FIREBASE_PROJECT_ID=raffle-app-22ff4
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="..."

# Public URLs of the DEPLOYED sites (used for CORS + Stripe redirect URLs)
FRONTEND_URL=https://raffle-app-22ff4.web.app
ADMIN_URL=https://raffle-app-22ff4-admin.web.app

# Admins (comma‑separated emails get the admin role)
ADMIN_EMAILS=you@example.com

# Stripe (test mode is fine for a demo)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...        # from step 5

# Wallet HMAC signing key (any long random string)
WALLET_SECRET=change-me-to-a-long-random-string

NODE_ENV=production
```

> For real production, prefer `firebase functions:secrets:set STRIPE_SECRET_KEY`
> over committing secrets in `.env`.

### Frontends — build‑time env
Set each site's API base to **its own origin** (Hosting rewrites `/api` to the
function). In `frontend/.env`:

```env
VITE_API_URL=https://raffle-app-22ff4.web.app
# ...plus all VITE_FIREBASE_* values (same as dev)
```

In `admin/.env`:

```env
VITE_API_URL=https://raffle-app-22ff4-admin.web.app
# ...plus all VITE_FIREBASE_* values
```

---

## 3. Build both frontends

```bash
npm run build            # builds frontend/ then admin/
# or individually:
# npm run build:frontend
# npm run build:admin
```

This produces `frontend/dist` and `admin/dist`.

---

## 4. Deploy

```bash
# Install the function's deps first (deploy also does this, but good to verify)
cd backend && npm install && cd ..

# Deploy everything: hosting (both sites) + functions
firebase deploy
```

Deploy selectively if you like:

```bash
firebase deploy --only functions
firebase deploy --only hosting:app
firebase deploy --only hosting:admin
```

After deploy you'll get:
- User app: `https://raffle-app-22ff4.web.app`
- Admin app: `https://raffle-app-22ff4-admin.web.app`
- API function: reachable at `/api/**` on both sites

Add both `*.web.app` domains under **Firebase Console → Authentication →
Settings → Authorized domains** so sign‑in works.

---

## 5. Point Stripe at the deployed webhook

1. Stripe Dashboard (test mode) → Developers → Webhooks → Add endpoint.
2. URL: `https://raffle-app-22ff4.web.app/api/v1/payments/webhook`
3. Event: `checkout.session.completed`.
4. Copy the signing secret (`whsec_...`) into `backend/.env` → `STRIPE_WEBHOOK_SECRET`
   and redeploy the function: `firebase deploy --only functions`.

---

## 6. Seed / create an admin (one‑time)

These scripts talk to Firestore directly using the credentials in `backend/.env`,
so run them locally:

```bash
npm run seed
npm run create-admin -- you@example.com "YourPassword123"
```

---

## Notes & caveats

- **Cold starts**: the first request after idle may take ~1–3s. Set a min‑instance
  in `backend/index.js` (`setGlobalOptions({ minInstances: 1 })`) to avoid it (costs more).
- **No WebSockets**: real‑time push isn't available on Functions. If you want live
  updates later, use Firestore `onSnapshot` listeners in the frontend.
- **Background jobs**: auto‑draw and cleanup run every minute via the
  `scheduledJobs` scheduled function (Cloud Scheduler). Verify it's enabled in the
  Functions dashboard after the first deploy.
- **Region**: everything uses `us-central1` (see `setGlobalOptions` in
  `backend/index.js` and the Hosting rewrites). Keep them in sync if you change it.
- **Local dev is unchanged**: `npm run dev` still runs the Express server on :5000
  plus both Vite dev servers.
