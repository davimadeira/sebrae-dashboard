import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getVercelOidcToken } from '@vercel/oidc';
import { ExternalAccountClient } from 'google-auth-library';

let externalAccountClient;

const getGcpConfiguration = () => {
  const required = [
    'GCP_PROJECT_ID',
    'GCP_PROJECT_NUMBER',
    'GCP_SERVICE_ACCOUNT_EMAIL',
    'GCP_WORKLOAD_IDENTITY_POOL_ID',
    'GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID',
  ];
  const missing = required.filter(name => !process.env[name]);
  if (missing.length) {
    throw Object.assign(new Error(`Autenticação administrativa não configurada: ${missing.join(', ')}.`), { statusCode: 503 });
  }
  return Object.fromEntries(required.map(name => [name, process.env[name]]));
};

const getExternalAccountClient = config => {
  if (externalAccountClient) return externalAccountClient;

  const audience = `//iam.googleapis.com/projects/${config.GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${config.GCP_WORKLOAD_IDENTITY_POOL_ID}/providers/${config.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID}`;
  externalAccountClient = ExternalAccountClient.fromJSON({
    type: 'external_account',
    audience,
    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
    token_url: 'https://sts.googleapis.com/v1/token',
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${config.GCP_SERVICE_ACCOUNT_EMAIL}:generateAccessToken`,
    subject_token_supplier: {
      // A Vercel fornece este token em cada execução. Ele é temporário e não é uma chave privada.
      getSubjectToken: () => getVercelOidcToken(),
    },
  });
  if (!externalAccountClient) throw Object.assign(new Error('Não foi possível iniciar a autenticação OIDC.'), { statusCode: 503 });
  return externalAccountClient;
};

const getAdminAuth = () => {
  if (!getApps().length) {
    const config = getGcpConfiguration();
    const authClient = getExternalAccountClient(config);
    initializeApp({
      projectId: config.GCP_PROJECT_ID,
      credential: {
        async getAccessToken() {
          const response = await authClient.getAccessToken();
          if (!response.token) throw Object.assign(new Error('Não foi possível obter o token de acesso do Google Cloud.'), { statusCode: 503 });
          const expiresAt = authClient.credentials.expiry_date || Date.now() + 55 * 60 * 1000;
          return {
            access_token: response.token,
            expires_in: Math.max(1, Math.floor((expiresAt - Date.now()) / 1000)),
          };
        },
      },
    });
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
