import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { AlertCircle, Loader2, LockKeyhole, LogIn } from 'lucide-react';
import sebraeLogo from '../logo-sebrae.png';
import { allowedEmailDomain, auth, isAllowedCorporateEmail, isFirebaseConfigured } from '../firebase';

const friendlyError = error => {
  const code = error?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'E-mail ou senha incorretos.';
  if (code.includes('too-many-requests')) return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
  return error?.message || 'Não foi possível concluir o acesso.';
};

const AuthGate = ({ children }) => {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) { setChecking(false); return undefined; }
    return onAuthStateChanged(auth, async currentUser => {
      if (currentUser && !isAllowedCorporateEmail(currentUser)) {
        await signOut(auth);
        setError(allowedEmailDomain ? `Use um e-mail da empresa com final @${allowedEmailDomain}.` : 'Conta não liberada para acessar o dashboard.');
        setUser(null);
      } else setUser(currentUser);
      setChecking(false);
    });
  }, []);

  const submit = async event => {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (!auth || !isAllowedCorporateEmail(email)) {
      setError(allowedEmailDomain ? `Use um e-mail da empresa com final @${allowedEmailDomain}.` : 'E-mail não liberado para acessar o dashboard.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, form.password);
    } catch (authError) {
      setError(friendlyError(authError));
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-sebrae-orange" /></div>;
  if (!isFirebaseConfigured) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4"><div className="w-full max-w-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sebrae p-6 text-center"><AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" /><h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Login não configurado</h1><p className="text-sm text-gray-600 dark:text-gray-300">Configure as variáveis VITE_FIREBASE_* no Vercel.</p></div></div>;
  if (user) return children({ user, onLogout: () => signOut(auth) });

  return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4"><motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sebrae-lg p-7"><div className="flex items-center justify-between gap-4 mb-8"><img src={sebraeLogo} alt="SEBRAE" className="h-12 w-auto object-contain" /><div className="w-11 h-11 rounded-lg bg-sebrae-blue/10 flex items-center justify-center"><LockKeyhole className="w-5 h-5 text-sebrae-blue" /></div></div><h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Entrar no dashboard</h1><p className="text-sm text-gray-600 dark:text-gray-300 mb-6">Use seu e-mail corporativo e senha. Para criar ou recuperar acesso, fale com o administrador.</p>{error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<form onSubmit={submit} className="space-y-4"><div><label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">E-mail</label><input required type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm" placeholder={allowedEmailDomain ? `nome@${allowedEmailDomain}` : 'nome@empresa.com'} /></div><div><label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Senha</label><input required type="password" value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm" placeholder="Sua senha" /></div><button disabled={submitting} className="w-full flex items-center justify-center gap-2 rounded-lg bg-sebrae-blue px-4 py-3 text-sm font-semibold text-white disabled:opacity-70">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}Entrar</button></form></motion.div></div>;
};

export default AuthGate;
