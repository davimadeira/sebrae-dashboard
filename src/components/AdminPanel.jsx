import { useEffect, useRef, useState } from 'react';
import { FileDown, KeyRound, Loader2, Pencil, ShieldCheck, Upload, UserPlus, X } from 'lucide-react';

const normalizeHeader = value => String(value || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]/g, '');

const parseDelimitedRows = (text, delimiter) => {
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { value += '"'; index += 1; } else quoted = !quoted;
    } else if (char === delimiter && !quoted) { row.push(value.trim()); value = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value.trim());
      if (row.some(cell => cell)) rows.push(row);
      row = []; value = '';
    } else value += char;
  }
  row.push(value.trim());
  if (row.some(cell => cell)) rows.push(row);
  return rows;
};

const parseCsv = text => {
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const delimiter = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ';' : ',';
  const rows = parseDelimitedRows(text.replace(/^\uFEFF/, ''), delimiter);
  if (rows.length < 2) throw new Error('O CSV precisa ter cabeçalho e ao menos um usuário.');
  const headers = rows[0].map(normalizeHeader);
  const findColumn = names => headers.findIndex(header => names.includes(header));
  const nameColumn = findColumn(['nome', 'nomecompleto', 'name', 'displayname']);
  const emailColumn = findColumn(['email', 'emailcorporativo']);
  const passwordColumn = findColumn(['senha', 'senhatemporaria', 'password']);
  if ([nameColumn, emailColumn, passwordColumn].some(index => index < 0)) throw new Error('Use as colunas Nome, E-mail e Senha no CSV.');
  return rows.slice(1).map(row => ({ displayName: row[nameColumn], email: row[emailColumn], password: row[passwordColumn] }));
};

const AdminPanel = ({ user, onClose }) => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const fileInput = useRef(null);

  const api = async (method = 'GET', body) => {
    const token = await user.getIdToken(true);
    const response = await fetch('/api/admin/users', { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const raw = await response.text();
    let payload = {};
    try { payload = raw ? JSON.parse(raw) : {}; } catch { throw new Error('O servidor retornou uma resposta inválida.'); }
    if (!response.ok) throw new Error(payload.error || 'Não foi possível concluir a operação.');
    return payload;
  };

  const loadUsers = async () => {
    setLoading(true); setError('');
    try { setUsers((await api()).users); } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  useEffect(() => { loadUsers(); }, []);

  const createUser = async event => {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      await api('POST', { action: 'create', ...form });
      setForm({ displayName: '', email: '', password: '' });
      setMessage('Usuário criado. Informe a senha temporária por um canal seguro.');
      await loadUsers();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const updateUser = async (action, uid, extra) => {
    setSaving(true); setError(''); setMessage('');
    try {
      await api('POST', { action, uid, ...extra });
      setMessage(action === 'updateProfile' ? 'Nome e e-mail atualizados.' : 'Alteração salva.');
      if (action === 'updateProfile') setEditing(null);
      await loadUsers();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const resetPassword = uid => {
    const password = window.prompt('Digite uma senha temporária: mínimo 8 caracteres, maiúscula, minúscula, número e símbolo.');
    if (password) updateUser('resetPassword', uid, { password });
  };
  const importCsv = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError(''); setMessage('');
    try {
      const importedUsers = parseCsv(await file.text());
      if (importedUsers.length > 200) throw new Error('O CSV pode ter no máximo 200 usuários por importação.');
      if (!window.confirm(`Importar ${importedUsers.length} usuário(s)?`)) return;
      setSaving(true);
      const result = await api('POST', { action: 'bulkImport', users: importedUsers });
      const failures = result.errors || [];
      setMessage(failures.length ? `${result.created.length} usuário(s) criado(s). ${failures.length} linha(s) não foram importadas: ${failures.slice(0, 3).map(item => `${item.email} (${item.error})`).join('; ')}` : `${result.created.length} usuário(s) importado(s) com sucesso.`);
      await loadUsers();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/60 p-4"><div className="mx-auto w-full max-w-6xl rounded-xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-700 dark:bg-gray-800 sm:p-7"><div className="mb-6 flex items-start justify-between gap-4"><div className="flex gap-3"><div className="rounded-lg bg-sebrae-blue/10 p-2"><ShieldCheck className="h-6 w-6 text-sebrae-blue" /></div><div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Administração de acessos</h2><p className="text-sm text-gray-500 dark:text-gray-300">Crie, edite, importe, bloqueie e redefina acessos do dashboard.</p></div></div><button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="h-5 w-5" /></button></div>{error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}{message && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}<form onSubmit={createUser} className="mb-4 grid gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700 sm:grid-cols-4"><input required value={form.displayName} onChange={e => setForm(prev => ({ ...prev, displayName: e.target.value }))} placeholder="Nome" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900" /><input required type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} placeholder="E-mail corporativo" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900" /><input required minLength={8} type="password" value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))} placeholder="Senha temporária" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900" /><button disabled={saving} className="flex items-center justify-center gap-2 rounded-lg bg-sebrae-blue px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"><UserPlus className="h-4 w-4" />Criar usuário</button><p className="sm:col-span-4 text-xs text-gray-500">Senha: 8+ caracteres com maiúscula, minúscula, número e símbolo.</p></form><div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700"><div className="min-w-0 flex-1"><div className="font-semibold text-gray-900 dark:text-white">Importação em massa por CSV</div><div className="text-xs text-gray-500">Colunas obrigatórias: Nome; E-mail; Senha. Máximo de 200 usuários por arquivo.</div></div><a href="data:text/csv;charset=utf-8,Nome%3BE-mail%3BSenha%0AMaria%20Silva%3Bmaria%40empresa.com.br%3BSenha%40123" download="modelo-usuarios.csv" className="inline-flex items-center gap-1 text-sm text-sebrae-blue hover:underline"><FileDown className="h-4 w-4" />Modelo</a><input ref={fileInput} onChange={importCsv} type="file" accept=".csv,text/csv" className="hidden" /><button type="button" disabled={saving} onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-sebrae-blue px-3 py-2 text-sm font-semibold text-sebrae-blue hover:bg-sebrae-blue/10 disabled:opacity-60"><Upload className="h-4 w-4" />Importar CSV</button></div>{loading ? <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-sebrae-orange" /></div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-700"><th className="p-2">Usuário</th><th className="p-2">Acesso</th><th className="p-2">Ações</th></tr></thead><tbody>{users.map(item => <tr key={item.uid} className="border-b border-gray-100 align-top dark:border-gray-700"><td className="p-2">{editing?.uid === item.uid ? <div className="grid gap-2 sm:grid-cols-2"><input value={editing.displayName} onChange={e => setEditing(prev => ({ ...prev, displayName: e.target.value }))} aria-label="Nome" className="rounded border border-gray-300 px-2 py-1.5 dark:border-gray-600 dark:bg-gray-900" /><input type="email" value={editing.email} onChange={e => setEditing(prev => ({ ...prev, email: e.target.value }))} aria-label="E-mail" className="rounded border border-gray-300 px-2 py-1.5 dark:border-gray-600 dark:bg-gray-900" /></div> : <><div className="font-medium text-gray-900 dark:text-white">{item.displayName || 'Sem nome'}</div><div className="text-xs text-gray-500">{item.email}</div></>}</td><td className="p-2">{item.disabled ? <span className="text-red-600">Bloqueado</span> : <span className="text-emerald-600">Ativo</span>}{item.admin && <span className="ml-2 text-sebrae-blue">Admin</span>}</td><td className="p-2"><div className="flex flex-wrap gap-3">{editing?.uid === item.uid ? <><button type="button" disabled={saving} onClick={() => updateUser('updateProfile', item.uid, editing)} className="text-emerald-600 hover:underline">Salvar</button><button type="button" onClick={() => setEditing(null)} className="text-gray-600 hover:underline dark:text-gray-300">Cancelar</button></> : <button type="button" onClick={() => setEditing({ uid: item.uid, displayName: item.displayName || '', email: item.email || '' })} className="inline-flex items-center gap-1 text-sebrae-blue hover:underline"><Pencil className="h-3.5 w-3.5" />Editar</button>}<button type="button" onClick={() => resetPassword(item.uid)} className="inline-flex items-center gap-1 text-sebrae-blue hover:underline"><KeyRound className="h-3.5 w-3.5" />Senha</button><button type="button" onClick={() => updateUser('setDisabled', item.uid, { disabled: !item.disabled })} className="text-sebrae-orange hover:underline">{item.disabled ? 'Liberar' : 'Bloquear'}</button><button type="button" onClick={() => updateUser('setAdmin', item.uid, { admin: !item.admin })} className="text-gray-600 hover:underline dark:text-gray-300">{item.admin ? 'Remover admin' : 'Tornar admin'}</button></div></td></tr>)}</tbody></table></div>}</div></div>;
};

export default AdminPanel;
