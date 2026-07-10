import { useEffect, useState } from 'react';
import { KeyRound, Loader2, ShieldCheck, UserPlus, X } from 'lucide-react';

const AdminPanel = ({ user, onClose }) => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const api = async (method = 'GET', body) => {
    const token = await user.getIdToken(true);
    const response = await fetch('/api/admin/users', { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const payload = await response.json();
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
    try { await api('POST', { action: 'create', ...form }); setForm({ displayName: '', email: '', password: '' }); setMessage('Usuário criado. Informe a senha temporária por um canal seguro.'); await loadUsers(); }
    catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const updateUser = async (action, uid, extra) => {
    setSaving(true); setError(''); setMessage('');
    try { await api('POST', { action, uid, ...extra }); setMessage('Alteração salva.'); await loadUsers(); }
    catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const resetPassword = uid => {
    const password = window.prompt('Digite uma senha temporária: mínimo 8 caracteres, maiúscula, minúscula, número e símbolo.');
    if (password) updateUser('resetPassword', uid, { password });
  };

  return <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/60 p-4"><div className="mx-auto w-full max-w-5xl rounded-xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-700 dark:bg-gray-800 sm:p-7"><div className="mb-6 flex items-start justify-between gap-4"><div className="flex gap-3"><div className="rounded-lg bg-sebrae-blue/10 p-2"><ShieldCheck className="h-6 w-6 text-sebrae-blue" /></div><div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Administração de acessos</h2><p className="text-sm text-gray-500 dark:text-gray-300">Crie, bloqueie e redefina acessos do dashboard.</p></div></div><button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="h-5 w-5" /></button></div>{error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}{message && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}<form onSubmit={createUser} className="mb-6 grid gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700 sm:grid-cols-4"><input required value={form.displayName} onChange={e => setForm(prev => ({ ...prev, displayName: e.target.value }))} placeholder="Nome" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900" /><input required type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} placeholder="E-mail corporativo" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900" /><input required minLength={8} type="password" value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))} placeholder="Senha temporária" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900" /><button disabled={saving} className="flex items-center justify-center gap-2 rounded-lg bg-sebrae-blue px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"><UserPlus className="h-4 w-4" />Criar usuário</button><p className="sm:col-span-4 text-xs text-gray-500">Senha: 8+ caracteres com maiúscula, minúscula, número e símbolo.</p></form>{loading ? <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-sebrae-orange" /></div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-700"><th className="p-2">Usuário</th><th className="p-2">Acesso</th><th className="p-2">Ações</th></tr></thead><tbody>{users.map(item => <tr key={item.uid} className="border-b border-gray-100 dark:border-gray-700"><td className="p-2"><div className="font-medium text-gray-900 dark:text-white">{item.displayName || 'Sem nome'}</div><div className="text-xs text-gray-500">{item.email}</div></td><td className="p-2">{item.disabled ? <span className="text-red-600">Bloqueado</span> : <span className="text-emerald-600">Ativo</span>}{item.admin && <span className="ml-2 text-sebrae-blue">Admin</span>}</td><td className="p-2"><div className="flex flex-wrap gap-3"><button onClick={() => resetPassword(item.uid)} className="inline-flex items-center gap-1 text-sebrae-blue hover:underline"><KeyRound className="h-3.5 w-3.5" />Senha</button><button onClick={() => updateUser('setDisabled', item.uid, { disabled: !item.disabled })} className="text-sebrae-orange hover:underline">{item.disabled ? 'Liberar' : 'Bloquear'}</button><button onClick={() => updateUser('setAdmin', item.uid, { admin: !item.admin })} className="text-gray-600 hover:underline dark:text-gray-300">{item.admin ? 'Remover admin' : 'Tornar admin'}</button></div></td></tr>)}</tbody></table></div>}</div></div>;
};

export default AdminPanel;
