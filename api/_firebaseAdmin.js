import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const getAdminAuth = () => {
  if (!getApps().length) {
    const rawCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!rawCredentials) throw Object.assign(new Error('Credencial administrativa não configurada no Vercel.'), { statusCode: 503 });
    initializeApp({ credential: cert(JSON.parse(rawCredentials)) });
  }
  return getAuth();
};

const getBootstrapEmails = () => (process.env.INITIAL_ADMIN_EMAILS || process.env.INITIAL_ADMIN_EMAIL || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

export const requireAdmin = async req => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) throw Object.assign(new Error('Sessão não informada.'), { statusCode: 401 });

  const adminAuth = getAdminAuth();
  const decoded = await adminAuth.verifyIdToken(token);
  const bootstrap = getBootstrapEmails().includes(decoded.email?.toLowerCase());
  if (bootstrap && !decoded.admin) {
    const record = await adminAuth.getUser(decoded.uid);
    await adminAuth.setCustomUserClaims(decoded.uid, { ...(record.customClaims || {}), admin: true });
  }
  if (!bootstrap && !decoded.admin) throw Object.assign(new Error('Acesso restrito a administradores.'), { statusCode: 403 });
  return { adminAuth, decoded, bootstrapEmails: getBootstrapEmails() };
};

export const allowedDomain = () => (process.env.ALLOWED_EMAIL_DOMAIN || 'sollobrasil.com.br').trim().replace(/^@/, '').toLowerCase();
