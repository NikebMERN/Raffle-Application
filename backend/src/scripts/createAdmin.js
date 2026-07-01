require('dotenv').config({ path: ['.env.local', '.env'] });
const { initializeFirebase, getAuth } = require('../config/firebase');
const usersRepo = require('../repositories/usersRepo');
const { ROLES } = require('../utils/constants');

// Create (or update the password of) an email/password admin account.
//
// Usage:
//   node src/scripts/createAdmin.js <email> <password> [displayName]
//   npm run create-admin -- admin@example.com "StrongPass123" "Site Admin"
//
// The email is also added to ADMIN_EMAILS handling on login, but to be safe this
// script directly sets the Firestore profile role to super_admin as well.
async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const displayName = process.argv[4] || 'Administrator';

  if (!email || !password) {
    console.error('Usage: node src/scripts/createAdmin.js <email> <password> [displayName]');
    process.exit(1);
  }
  if (password.length < 6) {
    console.error('Password must be at least 6 characters (Firebase requirement).');
    process.exit(1);
  }

  initializeFirebase();
  const auth = getAuth();

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    await auth.updateUser(userRecord.uid, { password, displayName, emailVerified: true });
    console.log(`Updated existing account: ${email}`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      userRecord = await auth.createUser({ email, password, displayName, emailVerified: true });
      console.log(`Created new account: ${email}`);
    } else {
      throw err;
    }
  }

  // Sync the Firestore profile and grant super_admin so the admin panel lets them in.
  await usersRepo.upsertByUid(userRecord.uid, {
    email: email.toLowerCase(),
    displayName,
    role: ROLES.SUPER_ADMIN,
    isActive: true,
    emailVerified: true,
    provider: 'password',
    walletBalance: 0,
  });

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (!adminEmails.includes(email.toLowerCase())) {
    console.log(`\nNote: add "${email}" to ADMIN_EMAILS in backend/.env to keep super_admin on every login.`);
  }

  console.log('\nAdmin ready. Sign in at the admin app (http://localhost:3001) with:');
  console.log(`  Email:    ${email}`);
  console.log('  Password: (the one you just set)');
  console.log('\nIMPORTANT: enable Email/Password sign-in in Firebase Console >');
  console.log('Authentication > Sign-in method, or client login will fail.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to create admin:', err.message);
  process.exit(1);
});
