import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export const LoginView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useTranslation();
  const { sendOtp, verifyOtp, signInAnonymously } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await sendOtp(email);
      setStep('code');
      setMessage(t('auth.codeSent'));
try { toast.success(t('auth.codeSent')); } catch(e){}
    } catch (err: any) {
      setError(err.message || 'Error'); toast.error(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await verifyOtp(email, code);
      // AuthGuard will automatically detect session change and dismiss this view
    } catch (err: any) {
      setError(err.message || 'Error'); toast.error(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 shadow-sm rounded-xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t('auth.loginTitle')}</h2>
          <button 
            onClick={onBack}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Anuluj
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              {t('auth.emailPrompt')}
            </p>

            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {t('auth.emailLabel')}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('auth.emailPlaceholder')}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('auth.sending') : t('auth.sendCode')}
              </button>

              <div className="relative flex items-center justify-center mt-6 mb-4">
                <div className="absolute border-t border-zinc-200 dark:border-zinc-800 w-full"></div>
                <span className="relative bg-white dark:bg-zinc-900 px-3 text-xs text-zinc-400 uppercase font-semibold tracking-wider">
                  lub
                </span>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    await signInAnonymously();
                  } catch (err: any) {
                    setError(err.message || 'Błąd tworzenia konta lokalnego');
                    toast.error(err.message || 'Błąd tworzenia konta lokalnego');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-50 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-200 dark:border-zinc-700"
              >
                Utwórz konto lokalne (Gość)
              </button>
            </form>
            </motion.div>
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              <span>{t('auth.codePrompt', { email })}</span>
            </p>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {t('auth.codeLabel')}
                </label>
                <input
                  id="code"
                  type="text"
                  required
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary-500 text-center tracking-[0.5em] font-mono text-2xl"
                  placeholder={t('auth.codePlaceholder')}
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('auth.verifying') : t('auth.verifyCode')}
              </button>
              
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full mt-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                {t('auth.useOtherEmail')}
              </button>
            </form>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-emerald-900/30 border border-emerald-800 rounded-lg text-emerald-400 text-sm">
              {message}
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
};
