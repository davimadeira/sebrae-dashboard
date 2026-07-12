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
const validateDisplayName = name => {
  const normalized = String(name || '').trim();
  if (!normalized) throw Object.assign(new Error('Informe o nome do usuário.'), { statusCode: 400 });
  if (normalized.length > 120) throw Object.assign(new Error('O nome deve ter no máximo 120 caracteres.'), { statusCode: 400 });
  return normalized;
};

const createDashboardUser = async (adminAuth, input) => adminAuth.createUser({
  email: validateEmail(input.email),
  password: validatePassword(input.password),
  displayName: validateDisplayName(input.displayName),
  emailVerified: true,
});

export default async function handler(req, res) {
  try {
    const { adminAuth, bootstrapEmails } = await requireAdmin(req);
    if (req.method === 'GET') {
      const result = await adminAuth.listUsers(1000);
      return res.status(200).json({ users: result.users.map(userDto) });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

    const { action, uid, email, displayName, password, disabled, admin, users } = req.body || {};
    if (action === 'create') {
      const user = await createDashboardUser(adminAuth, { email, displayName, password });
      return res.status(201).json({ user: userDto(user) });
    }
    if (action === 'bulkImport') {
      if (!Array.isArray(users) || users.length === 0) throw Object.assign(new Error('Selecione um CSV com ao menos um usuário.'), { statusCode: 400 });
      if (users.length > 200) throw Object.assign(new Error('O CSV pode ter no máximo 200 usuários por importação.'), { statusCode: 400 });

      const normalizedUsers = users.map((item, index) => ({
        line: index + 2,
        displayName: validateDisplayName(item?.displayName),
        email: validateEmail(item?.email),
        password: validatePassword(item?.password),
      }));
      const duplicates = normalizedUsers.filter((item, index) => normalizedUsers.findIndex(candidate => candidate.email === item.email) !== index);
      if (duplicates.length) throw Object.assign(new Error(`Há e-mails repetidos no CSV: ${[...new Set(duplicates.map(item => item.email))].join(', ')}.`), { statusCode: 400 });

      const created = [];
      const errors = [];
      for (const item of normalizedUsers) {
        try {
          const createdUser = await createDashboardUser(adminAuth, item);
          created.push(userDto(createdUser));
        } catch (error) {
          errors.push({ line: item.line, email: item.email, error: error.code === 'auth/email-already-exists' ? 'E-mail já cadastrado.' : error.message || 'Não foi possível criar este usuário.' });
        }
      }
      return res.status(errors.length ? 207 : 201).json({ created, errors });
    }
    if (action === 'updateProfile') {
      const existing = await adminAuth.getUser(uid);
      const user = await adminAuth.updateUser(uid, {
        displayName: validateDisplayName(displayName),
        email: validateEmail(email),
      });
      if (existing.email?.toLowerCase() !== user.email?.toLowerCase() && bootstrapEmails.includes(existing.email?.toLowerCase())) {
        await adminAuth.setCustomUserClaims(uid, { ...(existing.customClaims || {}), admin: true });
      }
      return res.status(200).json({ user: userDto(user) });
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
