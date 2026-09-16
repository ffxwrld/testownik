import { type FC, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ImageLightboxModalProps {
  isOpen: boolean;
  src: string;
  alt?: string;
  onClose: () => void;
}

export const ImageLightboxModal: FC<ImageLightboxModalProps> = ({
  isOpen,
  src,
  alt = 'Image preview',
  onClose,
}) => {
  const { t } = useTranslation();
  const [scale, setScale] = useState<number>(1);

  // Reset scale when modal is opened with a new image or closed
  useEffect(() => {
    if (isOpen) {
      setScale(1);
    }
  }, [isOpen, src]);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(3, +(prev + 0.25).toFixed(2)));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(0.5, +(prev - 0.25).toFixed(2)));
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
  }, []);

  const handleToggleZoom = useCallback(() => {
    setScale(prev => (prev > 1.1 ? 1 : 2));
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleZoomIn, handleZoomOut, handleResetZoom]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 sm:p-8 select-none"
          onClick={onClose}
        >
          {/* Top Close Button */}
          <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onClose();
              }}
              aria-label={t('components.questionRenderer.close') || 'Close'}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/90 hover:text-white transition-all backdrop-blur-md border border-white/10 shadow-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Centered Image Container */}
          <div
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              drag={scale > 1}
              dragElastic={0.08}
              dragConstraints={{ left: -300 * (scale - 1), right: 300 * (scale - 1), top: -200 * (scale - 1), bottom: 200 * (scale - 1) }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
              onDoubleClick={handleToggleZoom}
              className={`max-w-[92vw] max-h-[84vh] flex items-center justify-center ${
                scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
              }`}
            >
              <img
                src={src}
                alt={alt}
                draggable={false}
                className="max-w-full max-h-[82vh] w-auto h-auto object-contain rounded-xl shadow-2xl border border-white/10"
              />
            </motion.div>
          </div>

          {/* Floating Bottom Toolbar */}
          <div
            className="fixed bottom-6 inset-x-0 flex items-center justify-center pointer-events-none z-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/90 text-white/90 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/40">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                title={t('components.questionRenderer.zoomOut') || 'Zoom Out'}
                aria-label={t('components.questionRenderer.zoomOut') || 'Zoom Out'}
                className="p-1.5 rounded-full hover:bg-white/15 active:scale-95 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                title={t('components.questionRenderer.resetZoom') || 'Reset Zoom'}
                className="px-2 py-1 text-xs font-mono font-medium rounded-full hover:bg-white/15 active:scale-95 transition-all tabular-nums cursor-pointer"
              >
                {Math.round(scale * 100)}%
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= 3}
                title={t('components.questionRenderer.zoomIn') || 'Zoom In'}
                aria-label={t('components.questionRenderer.zoomIn') || 'Zoom In'}
                className="p-1.5 rounded-full hover:bg-white/15 active:scale-95 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-white/20 mx-1" />

              <button
                type="button"
                onClick={handleResetZoom}
                title={t('components.questionRenderer.resetZoom') || 'Reset (100%)'}
                aria-label={t('components.questionRenderer.resetZoom') || 'Reset'}
                className="p-1.5 rounded-full hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
