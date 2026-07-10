import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { AlertCircle, Loader2, LockKeyhole, LogIn } from 'lucide-react';
import sebraeLogo from '../logo-sebrae.png';
import {
  allowedEmailDomain,
  auth,
  getUserEmail,
  isAllowedCorporateEmail,
  isFirebaseConfigured,
  microsoftProvider,
} from '../firebase';

const AuthGate = ({ children }) => {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [authError, setAuthError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setChecking(false);
      return undefined;
    }

    return onAuthStateChanged(auth, async currentUser => {
      if (currentUser && !isAllowedCorporateEmail(currentUser)) {
        const email = getUserEmail(currentUser);
        await signOut(auth);
        setUser(null);
        setAuthError(
          allowedEmailDomain
            ? `Use uma conta da empresa com final @${allowedEmailDomain}. A conta ${email || 'selecionada'} nao foi liberada.`
            : 'Conta nao liberada para acessar o dashboard.'
        );
      } else {
        setUser(currentUser);
      }
      setChecking(false);
    });
  }, []);

  const handleLogin = async () => {
    if (!auth) return;
    setSigningIn(true);
    setAuthError('');
    try {
      const result = await signInWithPopup(auth, microsoftProvider);
      if (!isAllowedCorporateEmail(result.user)) {
        const email = getUserEmail(result.user);
        await signOut(auth);
        setAuthError(
          allowedEmailDomain
            ? `Use uma conta da empresa com final @${allowedEmailDomain}. A conta ${email || 'selecionada'} nao foi liberada.`
            : 'Conta nao liberada para acessar o dashboard.'
        );
      }
    } catch (error) {
      setAuthError(error?.message || 'Nao foi possivel entrar com a conta Microsoft.');
    } finally {
      setSigningIn(false);
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
            Configure as variaveis VITE_FIREBASE_* e VITE_ALLOWED_EMAIL_DOMAIN no Vercel para liberar o acesso Microsoft da empresa.
          </p>
        </div>
      </div>
    );
  }

  if (user) {
    return children({ user, onLogout: handleLogout });
  }

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

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Entrar no dashboard</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Acesse com sua conta Microsoft corporativa{allowedEmailDomain ? ` @${allowedEmailDomain}` : ''}.
        </p>

        {authError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {authError}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={signingIn}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-sebrae-blue px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-sebrae-blueDark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {signingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          Entrar com Microsoft
        </button>
      </motion.div>
    </div>
  );
};

export default AuthGate;
