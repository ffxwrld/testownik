import { FC, useState, FormEvent, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, ArrowDownToLine, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useP2PTransfer } from '../../hooks/useP2PTransfer';
import { SessionState } from '../../models/types';
import { Button } from '../ui/Button';

interface ReceiveModalProps {
  onClose: () => void;
  onSuccess: (session: SessionState) => void;
  initialCode?: string;
  autoStart?: boolean;
}

export const ReceiveModal: FC<ReceiveModalProps> = ({ onClose, onSuccess, initialCode, autoStart = false }) => {
  const { t } = useTranslation();
  const [inputCode, setInputCode] = useState(() => {
    return initialCode ? initialCode.replace(/\D/g, '').slice(0, 6) : '';
  });
  const { status, progress, errorMessage, startReceiving, cancel, receivedSession } = useP2PTransfer();
  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (autoStart && initialCode && !autoStartedRef.current) {
      const cleaned = initialCode.replace(/\D/g, '').slice(0, 6);
      if (cleaned.length === 6) {
        autoStartedRef.current = true;
        startReceiving(cleaned);
      }
    }
  }, [autoStart, initialCode, startReceiving]);

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  useEffect(() => {
    if (status === 'completed' && receivedSession) {
      onSuccess(receivedSession);
    }
  }, [status, receivedSession, onSuccess]);

  const handleInputChange = (val: string) => {
    // Keep only numbers and max 6 digits
    const cleaned = val.replace(/\D/g, '').slice(0, 6);
    setInputCode(cleaned);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (inputCode.length !== 6) return;
    await startReceiving(inputCode);
  };

  const formattedValue = inputCode.length > 3 
    ? `${inputCode.slice(0, 3)} ${inputCode.slice(3)}` 
    : inputCode;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 md:bg-black/60 md:backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md overflow-hidden relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {t('receive.title', 'Odbierz bazę pytań kodem')}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t('receive.subtitle', 'Wprowadź 6-cyfrowy kod od nadawcy')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'idle' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 text-center">
                  {t('receive.inputLabel', 'Kod transferu (6 cyfr)')}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  placeholder="000 000"
                  value={formattedValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="w-full text-center text-3xl font-black font-mono tracking-widest px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                />
              </div>

              <p className="text-xs text-center text-zinc-400 dark:text-zinc-500">
                {t('receive.hint', 'Nadawca musi mieć otwarte okno udostępniania w tym samym momencie.')}
              </p>

              <Button
                type="submit"
                variant="primary"
                disabled={inputCode.length !== 6}
                className="w-full py-3 flex items-center justify-center gap-2 cursor-pointer font-bold"
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>{t('receive.actionBtn', 'Połącz i pobierz')}</span>
              </Button>
            </form>
          )}

          {status === 'connecting' && (
            <div className="py-8 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto" />
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                {t('receive.connecting', 'Łączenie z nadawcą przez WebRTC...')}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {t('receive.waitingForSender', 'Oczekiwanie na przesłanie danych...')}
              </p>
            </div>
          )}

          {status === 'transferring' && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <span>{t('receive.downloading', 'Pobieranie bazy pytań...')}</span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700/50">
                <div 
                  className="h-full bg-primary-500 transition-all duration-150 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-center text-zinc-400 dark:text-zinc-500">
                {t('receive.unpacking', 'Odbieranie i rozpakowywanie pytań...')}
              </p>
            </div>
          )}

          {status === 'completed' && receivedSession && (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {t('receive.successTitle', 'Baza została pomyślnie odebrana!')}
              </h4>
              <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                {receivedSession.baseName} ({t('home.questionsCount', '{{count}} pytań', { count: receivedSession.questions.length })})
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {t('receive.savedNotice', 'Test jest już gotowy do nauki w Twoich testach.')}
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="py-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {t('receive.errorTitle', 'Błąd transferu')}
              </h4>
              <p className="text-xs text-red-600 dark:text-red-400">
                {errorMessage || t('receive.errorGeneric', 'Upewnij się, że kod jest poprawny i nadawca ma otwarte okno udostępniania.')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
          {status === 'error' ? (
            <>
              <Button variant="ghost" onClick={onClose}>
                {t('receive.cancel', 'Anuluj')}
              </Button>
              <Button variant="primary" onClick={() => cancel()}>
                {t('receive.tryAgain', 'Wpisz ponownie')}
              </Button>
            </>
          ) : status === 'completed' ? (
            <Button variant="primary" onClick={onClose}>
              {t('receive.done', 'Gotowe')}
            </Button>
          ) : (
            <Button variant="ghost" onClick={onClose}>
              {t('receive.cancel', 'Anuluj')}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
