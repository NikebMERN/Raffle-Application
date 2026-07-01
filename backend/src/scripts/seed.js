require('dotenv').config({ path: ['.env.local', '.env'] });
const { initializeFirebase } = require('../config/firebase');
const settingsService = require('../services/settingsService');

// Manual seed entry point. NOTE: this is now optional — the backend runs the
// same idempotent bootstrap automatically on startup (see server.js). It remains
// for CI or explicit re-seeding. Safe to run repeatedly; existing data is kept.
async function seed() {
  initializeFirebase();
  console.log('Bootstrapping Football Club Raffle (Firestore)…');

  const summary = await settingsService.ensureBootstrap();

  console.log(`✓ Settings created: ${summary.settingsCreated}`);
  console.log(`✓ Opening round created: ${summary.raffleCreated ? 'yes' : 'already existed'}`);
  console.log(`✓ Default reward config: ${summary.rewardCreated ? 'created' : 'already existed'}`);
  console.log('\nBootstrap complete!');
  console.log('Admin access: add your Google email to ADMIN_EMAILS in backend/.env,');
  console.log('then sign in — your account is auto-promoted to super_admin. Manage all');
  console.log('other roles from the admin Users page afterwards.');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
