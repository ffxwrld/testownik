import { FC, useEffect, useState, useId } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Copy, Check, QrCode, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';
import { getRoomJoinUrl } from '../../utils/url';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

interface QRCodeModalProps {
  roomCode: string;
  onClose: () => void;
}

export const QRCodeModal: FC<QRCodeModalProps> = ({ roomCode, onClose }) => {
  const { t } = useTranslation();
  const titleId = useId();
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  const joinUrl = getRoomJoinUrl(roomCode);
  const formattedCode = roomCode.length === 6 
    ? `${roomCode.slice(0, 3)} ${roomCode.slice(3)}` 
    : roomCode;

  useEffect(() => {
    let isMounted = true;
    setIsGenerating(true);

    if (!joinUrl) {
      setIsGenerating(false);
      return;
    }

    QRCode.toDataURL(joinUrl, {
      width: 320,
      margin: 1,
      color: {
        dark: '#09090b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Błąd generowania kodu QR:', err);
        if (isMounted) {
          setIsGenerating(false);
          toast.error(t('multiplayer.qr.generateError', 'Nie udało się wygenerować kodu QR'));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [joinUrl, t]);

  // Obsługa klawisza Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopyLink = async () => {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      toast.success(t('multiplayer.qr.copied', 'Skopiowano link!'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('multiplayer.qr.copyLinkFailed', 'Nie udało się skopiować linku do schowka'));
    }
  };

  const handleCopyCodeOnly = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      toast.success(t('multiplayer.qr.codeCopied', 'Skopiowano kod pokoju!'));
    } catch {
      // ignore
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-zinc-200/80 dark:border-zinc-800/80 w-full max-w-sm overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-500/10 dark:bg-primary-500/20 border border-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 id={titleId} className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                {t('multiplayer.qr.title', 'Kod QR Pokoju')}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t('multiplayer.qr.scanHint', 'Zeskanuj aparatem telefonu')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label={t('multiplayer.qr.close', 'Zamknij')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center text-center">
          {/* Kontener kodu QR — zawsze biały dla idealnego kontrastu skanera */}
          <div className="relative p-4 bg-white rounded-3xl shadow-sm border border-zinc-200/80 flex items-center justify-center min-w-[240px] min-h-[240px]">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center gap-2 text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                <span className="text-xs font-medium">{t('multiplayer.qr.generating', 'Generowanie QR...')}</span>
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Kod QR dołączenia do pokoju ${roomCode}`}
                className="w-56 h-56 rounded-xl select-none object-contain"
                draggable={false}
              />
            ) : (
              <div className="text-xs text-red-500">{t('multiplayer.qr.generateError', 'Nie udało się wygenerować kodu')}</div>
            )}
          </div>

          {/* Wyświetlenie kodu pokoju */}
          <div className="mt-5 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block mb-1">
              {t('multiplayer.qr.codeLabel', 'KOD POKOJU')}
            </span>
            <button
              type="button"
              onClick={handleCopyCodeOnly}
              className="group inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-750 transition-colors cursor-pointer"
              title={t('multiplayer.qr.copyCodeOnly', 'Kopiuj sam kod')}
            >
              <span className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-zinc-900 dark:text-zinc-50 notranslate" translate="no">
                {formattedCode}
              </span>
              <Copy className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors" />
            </button>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed mb-5">
            {t('multiplayer.qr.scanHint', 'Zeskanuj kod aparatem telefonu, aby natychmiast dołączyć do pokoju.')}
          </p>

          {/* Przycisk kopiowania linku */}
          <Button
            variant={copied ? 'success' : 'primary'}
            onClick={handleCopyLink}
            className="w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>{t('multiplayer.qr.copied', 'Skopiowano link!')}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{t('multiplayer.qr.copyLink', 'Kopiuj bezpośredni link')}</span>
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
