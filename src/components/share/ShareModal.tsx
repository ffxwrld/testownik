import { FC, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Copy, Check, Radio, CheckCircle2, AlertCircle, Loader2, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { SavedSessionMetadata } from '../../models/types';
import { useP2PTransfer } from '../../hooks/useP2PTransfer';
import { getShareJoinUrl } from '../../utils/url';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

interface ShareModalProps {
  session: SavedSessionMetadata;
  onClose: () => void;
}

export const ShareModal: FC<ShareModalProps> = ({ session, onClose }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const { status, progress, errorMessage, roomCode, startSending, cancel } = useP2PTransfer();

  useEffect(() => {
    startSending(session);
    return () => {
      cancel();
    };
  }, [session, startSending, cancel]);

  const shareUrl = getShareJoinUrl(roomCode || '');

  useEffect(() => {
    if (!shareUrl) return;
    let isMounted = true;
    QRCode.toDataURL(shareUrl, {
      width: 280,
      margin: 1,
      color: { dark: '#09090b', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Błąd generowania QR dla udostępniania:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [shareUrl]);

  const handleCopyCode = async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const formattedCode = roomCode ? `${roomCode.slice(0, 3)} ${roomCode.slice(3)}` : '------';

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
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {t('share.title', 'Udostępnij kodem na żywo')}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[240px]">
                {session.baseName}
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
        <div className="p-6 space-y-6">
          {status === 'waiting_for_peer' && (
            <div className="text-center space-y-4">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {t('share.codeSubtitle', 'Podaj poniższy 6-cyfrowy kod osobie, która ma odebrać ten test:')}
              </p>

              {/* Code & QR Display */}
              <div className="flex items-center justify-center gap-2.5">
                <div 
                  onClick={handleCopyCode}
                  className="group relative cursor-pointer inline-flex items-center justify-center gap-3 px-5 sm:px-6 py-3.5 sm:py-4 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl transition-all"
                  title={t('share.clickToCopy', 'Kliknij, aby skopiować')}
                >
                  <span className="text-3xl sm:text-4xl font-black tracking-widest text-zinc-900 dark:text-zinc-50 font-mono notranslate" translate="no">
                    {formattedCode}
                  </span>
                  <div className="p-2 rounded-xl bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 group-hover:scale-105 transition-transform shadow-xs">
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQr(prev => !prev)}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer group ${
                    showQr 
                      ? 'bg-primary-50 dark:bg-primary-950/40 border-primary-500 text-primary-600 dark:text-primary-400 shadow-sm' 
                      : 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200/70 text-zinc-700 dark:text-zinc-300'
                  }`}
                  title={showQr ? t('share.hideQr', 'Ukryj kod QR') : t('share.showQr', 'Pokaż kod QR')}
                  aria-label={showQr ? t('share.hideQr', 'Ukryj kod QR') : t('share.showQr', 'Pokaż kod QR')}
                >
                  <QrCode className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {copied && (
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {t('share.copiedNotice', 'Skopiowano do schowka!')}
                </p>
              )}

              {/* QR Section */}
              <AnimatePresence>
                {showQr && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden flex flex-col items-center pt-2 space-y-3"
                  >
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-zinc-200/80 inline-flex items-center justify-center">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt={t('share.qrCodeAlt', 'Kod QR paczki')}
                          className="w-44 h-44 sm:w-48 sm:h-48 select-none object-contain rounded-lg"
                        />
                      ) : (
                        <div className="w-44 h-44 flex items-center justify-center text-zinc-400 text-xs">
                          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                      {t('share.qrHint', 'Zeskanuj kod aparatem telefonu, aby odebrać bazę pytań bez przepisywania kodu.')}
                    </p>
                    <Button
                      variant={linkCopied ? 'success' : 'secondary'}
                      onClick={async () => {
                        if (!shareUrl) return;
                        try {
                          await navigator.clipboard.writeText(shareUrl);
                          setLinkCopied(true);
                          toast.success(t('share.linkCopied', 'Skopiowano link!'));
                          setTimeout(() => setLinkCopied(false), 2000);
                        } catch {
                          toast.error(t('share.copyLinkFailed', 'Nie udało się skopiować linku'));
                        }
                      }}
                      className="text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{linkCopied ? t('share.linkCopied', 'Skopiowano link!') : t('share.copyLink', 'Kopiuj link do odbioru')}</span>
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-center gap-2 pt-2 text-xs text-zinc-400 dark:text-zinc-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t('share.waitingNotice', 'Oczekiwanie na połączenie odbiorcy... Trzymaj to okno otwarte.')}</span>
              </div>
            </div>
          )}

          {status === 'connecting' && (
            <div className="py-8 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto" />
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                {t('share.connecting', 'Odbiorca dołączył! Nawiązywanie tunelu WebRTC...')}
              </p>
            </div>
          )}

          {status === 'transferring' && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <span>{t('share.transferring', 'Wysyłanie bazy pytań...')}</span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700/50">
                <div 
                  className="h-full bg-primary-500 transition-all duration-150 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-center text-zinc-400 dark:text-zinc-500">
                {t('share.doNotClose', 'Nie zamykaj tego okna do zakończenia transferu.')}
              </p>
            </div>
          )}

          {status === 'completed' && (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {t('share.successTitle', 'Paczka pomyślnie przesłana!')}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                {t('share.successDesc', 'Odbiorca pomyślnie pobrał i zapisał test w swojej aplikacji.')}
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="py-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {t('share.errorTitle', 'Wystąpił błąd')}
              </h4>
              <p className="text-xs text-red-600 dark:text-red-400">
                {errorMessage || t('share.errorGeneric', 'Nie udało się nawiązać połączenia.')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
          {status === 'error' ? (
            <Button variant="primary" onClick={() => startSending(session)}>
              {t('share.tryAgain', 'Spróbuj ponownie')}
            </Button>
          ) : (
            <Button variant="secondary" onClick={onClose}>
              {status === 'completed' ? t('share.close', 'Zamknij') : t('share.cancel', 'Anuluj')}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
