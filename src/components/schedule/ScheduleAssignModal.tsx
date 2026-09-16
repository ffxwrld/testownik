import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { SavedSessionMetadata } from '../../models/types';
import { DatePicker } from '../ui/DatePicker';

interface ScheduleAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  unscheduledSessions: SavedSessionMetadata[];
  onUpdateDate: (sessionId: string, date: string | undefined) => void | Promise<void>;
}

export const ScheduleAssignModal: React.FC<ScheduleAssignModalProps> = ({
  isOpen,
  onClose,
  unscheduledSessions,
  onUpdateDate,
}) => {
  const { t } = useTranslation();
  const [editingDateSessionId, setEditingDateSessionId] = useState<string | null>(null);
  const [newDateInput, setNewDateInput] = useState('');

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
            className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {t('schedule.assignModal.title')}
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t('schedule.assignModal.desc')}
            </p>

            <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 pr-1">
              {unscheduledSessions.map(s => (
                <div key={s.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {s.baseName}
                    </div>
                    <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      {t('home.questionsCount', { count: s.totalQuestions })}
                    </div>
                  </div>

                  {editingDateSessionId === s.id ? (
                    <div className="flex items-center gap-1.5">
                      <DatePicker
                        value={newDateInput}
                        onChange={(date) => {
                          setNewDateInput(date);
                          if (date) {
                            onUpdateDate(s.id, date);
                            setEditingDateSessionId(null);
                          }
                        }}
                        minDate={new Date().toISOString().split('T')[0]}
                        placeholder={t('schedule.assignModal.selectDate')}
                        size="sm"
                        align="right"
                        className="w-44"
                      />
                      <button
                        onClick={() => setEditingDateSessionId(null)}
                        className="text-xs px-2 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition cursor-pointer"
                      >
                        {t('schedule.assignModal.cancelBtn')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingDateSessionId(s.id);
                        setNewDateInput(new Date().toISOString().split('T')[0]);
                      }}
                      className="text-xs px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold rounded-lg transition cursor-pointer"
                    >
                      {t('schedule.assignModal.saveBtn')}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              {t('common.close', 'Zamknij')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
