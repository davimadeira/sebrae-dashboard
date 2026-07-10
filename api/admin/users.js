import { allowedDomain, requireAdmin } from '../_firebaseAdmin.js';

const strongPassword = value => typeof value === 'string' && value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
const userDto = user => ({ uid: user.uid, email: user.email, displayName: user.displayName || '', disabled: user.disabled, admin: Boolean(user.customClaims?.admin), createdAt: user.metadata.creationTime });
const errorResponse = (res, error) => res.status(error.statusCode || 500).json({ error: error.message || 'Não foi possível concluir a operação.' });

const validateEmail = email => {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized.includes('@')) throw Object.assign(new Error('Informe um e-mail válido.'), { statusCode: 400 });
  const domain = allowedDomain();
  if (domain && !normalized.endsWith(`@${domain}`)) throw Object.assign(new Error(`Use um e-mail @${domain}.`), { statusCode: 400 });
  return normalized;
};
const validatePassword = password => {
  if (!strongPassword(password)) throw Object.assign(new Error('A senha deve ter 8+ caracteres, maiúscula, minúscula, número e símbolo.'), { statusCode: 400 });
  return password;
};

export default async function handler(req, res) {
  try {
    const { adminAuth, bootstrapEmails } = await requireAdmin(req);
    if (req.method === 'GET') {
      const result = await adminAuth.listUsers(1000);
      return res.status(200).json({ users: result.users.map(userDto) });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

    const { action, uid, email, displayName, password, disabled, admin } = req.body || {};
    if (action === 'create') {
      const user = await adminAuth.createUser({ email: validateEmail(email), password: validatePassword(password), displayName: String(displayName || '').trim(), emailVerified: true });
      return res.status(201).json({ user: userDto(user) });
    }
    if (action === 'resetPassword') {
      const user = await adminAuth.updateUser(uid, { password: validatePassword(password) });
      return res.status(200).json({ user: userDto(user) });
    }
    if (action === 'setDisabled') {
      const existing = await adminAuth.getUser(uid);
      if (bootstrapEmails.includes(existing.email?.toLowerCase()) && disabled) throw Object.assign(new Error('Não é permitido bloquear um administrador inicial.'), { statusCode: 400 });
      const user = await adminAuth.updateUser(uid, { disabled: Boolean(disabled) });
      return res.status(200).json({ user: userDto(user) });
    }
    if (action === 'setAdmin') {
      const existing = await adminAuth.getUser(uid);
      if (bootstrapEmails.includes(existing.email?.toLowerCase()) && !admin) throw Object.assign(new Error('Não é permitido remover um administrador inicial.'), { statusCode: 400 });
      await adminAuth.setCustomUserClaims(uid, { ...(existing.customClaims || {}), admin: Boolean(admin) });
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: 'Ação inválida.' });
  } catch (error) {
    return errorResponse(res, error);
  }
}
