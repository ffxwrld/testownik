import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '../../hooks/useProfile';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { CreateProfileSchema } from '../../lib/validation';

export const SetupProfileView: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { t } = useTranslation();
  const { createProfile } = useProfile();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Local validation first
      CreateProfileSchema.parse({ username });
      
      await createProfile({ username });
      onComplete();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message); toast.error(err.issues[0].message);
      } else {
        setError(err.message || 'Error'); toast.error(err.message || 'Error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 shadow-sm rounded-xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Prawie gotowe!</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          Zalogowano pomyślnie. Wybierz swój unikalny nick, który będzie widoczny dla znajomych i w rankingach.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Nick (nazwa użytkownika)
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="np. testownik_ninja"
              minLength={3}
              maxLength={30}
              pattern="^[a-zA-Z0-9_]+$"
              title="Dozwolone są tylko litery (bez polskich znaków), cyfry i znak podkreślenia."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('auth.saving') : t('auth.saveProfile')}
          </button>
        </form>

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
