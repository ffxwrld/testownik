import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { X, Calendar } from 'lucide-react';
import { SavedSessionMetadata } from '../../models/types';
import { DatePicker } from '../ui/DatePicker';

interface TargetDateModalProps {
  session: SavedSessionMetadata | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (sessionId: string, date: string | undefined) => void | Promise<void>;
}

export const TargetDateModal: React.FC<TargetDateModalProps> = ({
  session,
  isOpen,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    if (session) {
      setSelectedDate(session.targetDate || '');
    }
  }, [session]);

  if (!session) return null;

  const handleSave = async () => {
    await onSave(session.id, selectedDate || undefined);
    onClose();
  };

  const handleRemove = async () => {
    await onSave(session.id, undefined);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {session.targetDate 
                      ? t('sessionsList.editTargetDate', 'Zmień termin egzaminu')
                      : t('sessionsList.setTargetDate', 'Ustaw termin egzaminu')}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {session.baseName}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* DatePicker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                {t('learn.newSessionModal.targetDate', 'Data egzaminu')}
              </label>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                minDate={format(new Date(), 'yyyy-MM-dd')}
                placeholder={t('schedule.assignModal.selectDate', 'Wybierz datę egzaminu...')}
                size="md"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              {session.targetDate ? (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline font-semibold cursor-pointer"
                >
                  {t('schedule.detailsModal.removeDate', 'Usuń termin')}
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                >
                  {t('schedule.assignModal.cancelBtn', 'Anuluj')}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-xs font-semibold text-white transition shadow-xs cursor-pointer"
                >
                  {t('schedule.assignModal.saveBtn', 'Zapisz')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
