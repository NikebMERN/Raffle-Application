import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

export function isMessagingConfigured() {
  return Boolean(
    isFirebaseConfigured()
    && firebaseConfig.messagingSenderId
    && import.meta.env.VITE_FIREBASE_VAPID_KEY,
  );
}

export function getFirebaseApp() {
  if (!isFirebaseConfigured()) return null;
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Errors where a popup can't be used — fall back to a full-page redirect.
const POPUP_FALLBACK_ERRORS = new Set([
  'auth/popup-blocked',
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/operation-not-supported-in-this-environment',
]);

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase is not configured. Add VITE_FIREBASE_* values to frontend/.env');
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    if (POPUP_FALLBACK_ERRORS.has(err?.code)) {
      // Browser blocked the popup — continue via redirect; result is read on reload.
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

// Completes a redirect-based sign-in after the browser navigates back.
export async function completeRedirectSignIn() {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch {
    return null;
  }
}

export async function signOutUser() {
  const auth = getFirebaseAuth();
  if (auth) await firebaseSignOut(auth);
}

export async function getFirebaseMessaging() {
  if (!isMessagingConfigured()) return null;
  const supported = await isSupported();
  if (!supported) return null;
  const app = getFirebaseApp();
  return app ? getMessaging(app) : null;
}

export { firebaseConfig };
