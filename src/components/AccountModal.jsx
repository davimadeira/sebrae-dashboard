import { useState } from 'react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { KeyRound, Loader2, X } from 'lucide-react';

const passwordIsStrong = value => value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);

const AccountModal = ({ isOpen, onClose, user }) => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmation: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const submit = async event => {
    event.preventDefault();
    setError(''); setMessage('');
    if (!passwordIsStrong(form.newPassword)) {
      setError('A nova senha deve ter 8+ caracteres, maiúscula, minúscula, número e símbolo.');
      return;
    }
    if (form.newPassword !== form.confirmation) {
      setError('A confirmação da nova senha não confere.');
      return;
    }
    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, form.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, form.newPassword);
      setForm({ currentPassword: '', newPassword: '', confirmation: '' });
      setMessage('Senha alterada com sucesso.');
    } catch (authError) {
      if (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') setError('A senha atual está incorreta.');
      else setError('Não foi possível alterar a senha. Entre novamente e tente de novo.');
    } finally {
      setSaving(false);
    }
  };

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"><div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800"><div className="mb-5 flex items-start justify-between gap-4"><div className="flex gap-3"><div className="rounded-lg bg-sebrae-blue/10 p-2"><KeyRound className="h-5 w-5 text-sebrae-blue" /></div><div><h2 className="font-bold text-gray-900 dark:text-white">Alterar minha senha</h2><p className="text-xs text-gray-500 dark:text-gray-300">{user.email}</p></div></div><button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="h-5 w-5" /></button></div>{error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}{message && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}<form onSubmit={submit} className="space-y-3"><input required type="password" value={form.currentPassword} onChange={e => setForm(prev => ({ ...prev, currentPassword: e.target.value }))} placeholder="Senha atual" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900" /><input required minLength={8} type="password" value={form.newPassword} onChange={e => setForm(prev => ({ ...prev, newPassword: e.target.value }))} placeholder="Nova senha" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900" /><input required minLength={8} type="password" value={form.confirmation} onChange={e => setForm(prev => ({ ...prev, confirmation: e.target.value }))} placeholder="Confirmar nova senha" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900" /><p className="text-xs text-gray-500">8+ caracteres com maiúscula, minúscula, número e símbolo.</p><button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-lg bg-sebrae-blue px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Salvar nova senha</button></form></div></div>;
};

export default AccountModal;
