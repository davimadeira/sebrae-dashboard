import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { AlertCircle, Loader2, LockKeyhole, LogIn, UserPlus } from 'lucide-react';
import sebraeLogo from '../logo-sebrae.png';
import {
  allowedEmailDomain,
  auth,
  isAllowedCorporateEmail,
  isFirebaseConfigured,
} from '../firebase';

const getFriendlyAuthError = (error) => {
  const code = error?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password')) return 'E-mail ou senha incorretos.';
  if (code.includes('user-not-found')) return 'Conta nao encontrada. Crie uma conta para continuar.';
  if (code.includes('email-already-in-use')) return 'Esse e-mail ja tem conta. Entre com sua senha.';
  if (code.includes('weak-password')) return 'Use uma senha com pelo menos 6 caracteres.';
  if (code.includes('invalid-email')) return 'Digite um e-mail valido.';
  if (code.includes('too-many-requests')) return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
  return error?.message || 'Nao foi possivel concluir o acesso.';
};

const AuthGate = ({ children }) => {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setChecking(false);
      return undefined;
    }

    return onAuthStateChanged(auth, async currentUser => {
      if (currentUser && !isAllowedCorporateEmail(currentUser)) {
        await signOut(auth);
        setUser(null);
        setAuthError(
          allowedEmailDomain
            ? `Use um e-mail da empresa com final @${allowedEmailDomain}.`
            : 'Conta nao liberada para acessar o dashboard.'
        );
      } else {
        setUser(currentUser);
      }
      setChecking(false);
    });
  }, []);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setAuthError('');
    setAuthMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!auth) return;

    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!isAllowedCorporateEmail(email)) {
      setAuthError(
        allowedEmailDomain
          ? `Use um e-mail da empresa com final @${allowedEmailDomain}.`
          : 'E-mail nao liberado para acessar o dashboard.'
      );
      return;
    }

    setSubmitting(true);
    setAuthError('');
    setAuthMessage('');

    try {
      if (mode === 'signup') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (form.name.trim()) {
          await updateProfile(result.user, { displayName: form.name.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      setAuthError(getFriendlyAuthError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!auth || !form.email.trim()) {
      setAuthError('Digite seu e-mail para recuperar a senha.');
      return;
    }

    const email = form.email.trim().toLowerCase();
    if (!isAllowedCorporateEmail(email)) {
      setAuthError(
        allowedEmailDomain
          ? `Use um e-mail da empresa com final @${allowedEmailDomain}.`
          : 'E-mail nao liberado para acessar o dashboard.'
      );
      return;
    }

    setSubmitting(true);
    setAuthError('');
    setAuthMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setAuthMessage('Enviamos um link de recuperacao para o seu e-mail.');
    } catch (error) {
      setAuthError(getFriendlyAuthError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => signOut(auth);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-sebrae-orange" />
      </div>
    );
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sebrae p-6 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Login nao configurado</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Configure as variaveis VITE_FIREBASE_* e VITE_ALLOWED_EMAIL_DOMAIN no Vercel para liberar o acesso por e-mail.
          </p>
        </div>
      </div>
    );
  }

  if (user) {
    return children({ user, onLogout: handleLogout });
  }

  const isSignup = mode === 'signup';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sebrae-lg p-7"
      >
        <div className="flex items-center justify-between gap-4 mb-8">
          <img src={sebraeLogo} alt="SEBRAE" className="h-12 w-auto object-contain" />
          <div className="w-11 h-11 rounded-lg bg-sebrae-blue/10 flex items-center justify-center">
            <LockKeyhole className="w-5 h-5 text-sebrae-blue" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {isSignup ? 'Criar conta' : 'Entrar no dashboard'}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          {isSignup ? 'Crie seu acesso com e-mail e senha.' : 'Entre com seu e-mail e senha cadastrados.'}
          {allowedEmailDomain ? ` Use e-mail @${allowedEmailDomain}.` : ''}
        </p>

        {authError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {authError}
          </div>
        )}
        {authMessage && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
            {authMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Nome</label>
              <input
                type="text"
                value={form.name}
                onChange={event => updateField('name', event.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm outline-none focus:border-sebrae-blue focus:ring-2 focus:ring-sebrae-blue/10"
                placeholder="Seu nome"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">E-mail</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={event => updateField('email', event.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm outline-none focus:border-sebrae-blue focus:ring-2 focus:ring-sebrae-blue/10"
              placeholder={allowedEmailDomain ? `nome@${allowedEmailDomain}` : 'nome@email.com'}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={event => updateField('password', event.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm outline-none focus:border-sebrae-blue focus:ring-2 focus:ring-sebrae-blue/10"
              placeholder="Minimo de 6 caracteres"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-sebrae-blue px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-sebrae-blueDark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isSignup ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {isSignup ? 'Criar conta' : 'Entrar'}
          </button>
        </form>

        <div className="mt-5 flex flex-col gap-2 text-center text-sm">
          <button
            type="button"
            onClick={() => {
              setMode(isSignup ? 'login' : 'signup');
              setAuthError('');
              setAuthMessage('');
            }}
            className="text-sebrae-blue hover:text-sebrae-orange font-semibold transition-colors"
          >
            {isSignup ? 'Ja tenho conta' : 'Criar uma conta'}
          </button>
          {!isSignup && (
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={submitting}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-sebrae-orange transition-colors disabled:opacity-70"
            >
              Esqueci minha senha
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthGate;
