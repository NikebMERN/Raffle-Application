# Football Club Raffle Backend

Express.js API using Firebase Admin SDK (Firestore + Auth) + Socket.io.

## Quick start

```bash
cp .env.example .env   # then fill in Firebase service-account values
npm install
npm run seed           # seeds Firestore (requires Firebase credentials)
npm run dev
```

API health: http://localhost:5000/api/health

## Auth

Clients sign in with Google via Firebase on the frontend and send the Firebase
ID token as `Authorization: Bearer <token>`. The `authenticate` middleware
verifies the token and syncs the user profile in the Firestore `users` collection
(keyed by the Firebase UID). Emails listed in `ADMIN_EMAILS` are promoted to
`super_admin` automatically.

## Data model (Firestore collections)

`users`, `raffles`, `tickets`, `transactions`, `notifications`, `auditLogs`,
`settings`, `rewardConfigs`.
