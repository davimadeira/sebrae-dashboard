import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { AlertCircle, Loader2, LockKeyhole, LogIn, UserPlus } from 'lucide-react';
import sebraeLogo from '../logo-sebrae.png';
import { allowedEmailDomain, auth, isAllowedCorporateEmail, isFirebaseConfigured } from '../firebase';

const friendlyError = error => {
  const code = error?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password')) return 'E-mail ou senha incorretos.';
  if (code.includes('user-not-found')) return 'Conta não encontrada. Crie uma conta para continuar.';
  if (code.includes('email-already-in-use')) return 'Esse e-mail já tem conta. Entre com sua senha.';
  if (code.includes('weak-password')) return 'Use uma senha com pelo menos 6 caracteres.';
  if (code.includes('too-many-requests')) return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
  return error?.message || 'Não foi possível concluir o acesso.';
};

const isStrongPassword = password => (
  password.length >= 8 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password)
);

const AuthGate = ({ children }) => {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

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
    if (mode === 'signup' && !isStrongPassword(form.password)) {
      setError('A senha deve ter pelo menos 8 caracteres, letra maiúscula, minúscula, número e caractere especial.');
      return;
    }
    setSubmitting(true); setError('');
    try {
      if (mode === 'signup') {
        const result = await createUserWithEmailAndPassword(auth, email, form.password);
        if (form.name.trim()) await updateProfile(result.user, { displayName: form.name.trim() });
      } else await signInWithEmailAndPassword(auth, email, form.password);
    } catch (authError) { setError(friendlyError(authError)); }
    finally { setSubmitting(false); }
  };

  if (checking) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-sebrae-orange" /></div>;
  if (!isFirebaseConfigured) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4"><div className="w-full max-w-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sebrae p-6 text-center"><AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" /><h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Login não configurado</h1><p className="text-sm text-gray-600 dark:text-gray-300">Configure as variáveis VITE_FIREBASE_* no Vercel.</p></div></div>;
  if (user) return children({ user, onLogout: () => signOut(auth) });

  const signup = mode === 'signup';
  return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4"><motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sebrae-lg p-7"><div className="flex items-center justify-between gap-4 mb-8"><img src={sebraeLogo} alt="SEBRAE" className="h-12 w-auto object-contain" /><div className="w-11 h-11 rounded-lg bg-sebrae-blue/10 flex items-center justify-center"><LockKeyhole className="w-5 h-5 text-sebrae-blue" /></div></div><h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{signup ? 'Criar conta' : 'Entrar no dashboard'}</h1><p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{signup ? 'Crie seu acesso com e-mail corporativo e senha.' : 'Entre com seu e-mail corporativo e senha.'}</p>{error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<form onSubmit={submit} className="space-y-4">{signup && <div><label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Nome</label><input required value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm" placeholder="Seu nome" /></div>}<div><label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">E-mail</label><input required type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm" placeholder={allowedEmailDomain ? `nome@${allowedEmailDomain}` : 'nome@empresa.com'} /></div><div><label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Senha</label><input required minLength={8} type="password" value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm" placeholder="Ex.: Sebrae@2026" />{signup && <p className="mt-1 text-[11px] text-gray-500">Mínimo de 8 caracteres, com maiúscula, minúscula, número e símbolo.</p>}</div><button disabled={submitting} className="w-full flex items-center justify-center gap-2 rounded-lg bg-sebrae-blue px-4 py-3 text-sm font-semibold text-white disabled:opacity-70">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : signup ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}{signup ? 'Criar conta' : 'Entrar'}</button></form><button type="button" onClick={() => { setMode(signup ? 'login' : 'signup'); setError(''); }} className="mt-5 w-full text-center text-sm font-semibold text-sebrae-blue hover:text-sebrae-orange">{signup ? 'Já tenho conta' : 'Criar uma conta'}</button></motion.div></div>;
};

export default AuthGate;
