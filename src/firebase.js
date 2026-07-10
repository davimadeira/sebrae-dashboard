import { initializeApp } from 'firebase/app';
import { getAuth, OAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const allowedEmailDomain = (import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || '')
  .trim()
  .replace(/^@/, '')
  .toLowerCase();

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;

export const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.setCustomParameters({ prompt: 'select_account' });

export const getUserEmail = (user) => {
  if (!user) return '';
  return user.email || user.providerData?.find(provider => provider.email)?.email || '';
};

export const isAllowedCorporateEmail = (user) => {
  if (!allowedEmailDomain) return true;
  const email = getUserEmail(user).toLowerCase();
  return email.endsWith(`@${allowedEmailDomain}`);
};

