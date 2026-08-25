import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export const LoginView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { sendOtp, verifyOtp } = useAuth();
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
      setMessage('Kod wysłany! Sprawdź swoją skrzynkę e-mail i wpisz go poniżej.');
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas wysyłania kodu.');
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
      setError(err.message || 'Nieprawidłowy kod lub kod wygasł.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 shadow-sm rounded-xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Logowanie</h2>
          <button 
            onClick={onBack}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Anuluj
          </button>
        </div>

        {step === 'email' ? (
          <>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              Wpisz swój adres e-mail, aby otrzymać jednorazowy 6-cyfrowy kod logowania.
            </p>

            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Adres e-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="twoj@email.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Wysyłanie...' : 'Wyślij kod'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              Wpisz 6-cyfrowy kod, który wysłaliśmy na adres <strong>{email}</strong>.
            </p>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Kod jednorazowy (OTP)
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
                  placeholder="------"
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Weryfikacja...' : 'Zaloguj się'}
              </button>
              
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full mt-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Użyj innego adresu e-mail
              </button>
            </form>
          </>
        )}

        {message && (
          <div className="mt-4 p-3 bg-emerald-900/30 border border-emerald-800 rounded-lg text-emerald-400 text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
