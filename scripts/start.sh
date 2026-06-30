#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# One-command bootstrap + run for the Football Club Raffle (React + Express +
# Firebase/Firestore + Google sign-in).
#
#   - Creates backend/.env, frontend/.env and admin/.env from the examples
#   - Installs backend, frontend & admin dependencies
#   - Runs backend (:5000) + frontend (:3000) + admin (:3001) together
#
# The backend bootstraps Firestore automatically on startup (default settings,
# opening round, reward config) — no manual seed step is required.
#
# Usage:  npm start        (from the repo root)
# -----------------------------------------------------------------------------
set -euo pipefail

cd "$(dirname "$0")/.."

say() { printf "\n\033[1;36m==> %s\033[0m\n" "$1"; }
warn() { printf "\n\033[1;33m[!] %s\033[0m\n" "$1"; }

# 1. Environment files -----------------------------------------------------
say "Checking environment files"
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  warn "Created backend/.env — fill in your Firebase service-account values."
else
  echo "backend/.env exists."
fi
if [ ! -f frontend/.env ]; then
  cp frontend/.env.example frontend/.env
  warn "Created frontend/.env — fill in your Firebase web-app values."
else
  echo "frontend/.env exists."
fi
if [ ! -f admin/.env ]; then
  cp admin/.env.example admin/.env
  warn "Created admin/.env — fill in your Firebase web-app values."
else
  echo "admin/.env exists."
fi

# 2. Dependencies ----------------------------------------------------------
say "Installing root dependencies (concurrently)"
npm install
say "Installing backend dependencies"
( cd backend && npm install )
say "Installing frontend dependencies"
( cd frontend && npm install )
say "Installing admin dependencies"
( cd admin && npm install )

# 3. Firebase readiness note (bootstrap runs automatically on backend start) -
if ! grep -qE '^FIREBASE_PROJECT_ID=.+' backend/.env; then
  warn "Firebase not configured yet — fill backend/.env (FIREBASE_*). The backend"
  warn "auto-creates default settings, the opening round and reward config on start."
fi

# 4. Run everything --------------------------------------------------------
say "Starting backend (:5000) + frontend (:3000) + admin (:3001)"
echo "Press Ctrl+C to stop all."
npm run dev
