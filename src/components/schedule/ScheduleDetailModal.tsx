import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { differenceInCalendarDays, parseISO, format, startOfDay } from 'date-fns';
import { X, Clock, BookOpen, Sparkle, ArrowRight } from '@phosphor-icons/react';
import { SavedSessionMetadata } from '../../models/types';
import { DatePicker } from '../ui/DatePicker';

interface ScheduleDetailModalProps {
  session: SavedSessionMetadata | null;
  onClose: () => void;
  onUpdateDate: (sessionId: string, date: string | undefined) => void | Promise<void>;
  onStartLearning: () => void;
}

export const ScheduleDetailModal: React.FC<ScheduleDetailModalProps> = ({
  session,
  onClose,
  onUpdateDate,
  onStartLearning,
}) => {
  const { t, i18n } = useTranslation();
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState('');

  if (!session) return null;

  const days = session.targetDate
    ? differenceInCalendarDays(parseISO(session.targetDate), startOfDay(new Date()))
    : null;

  const progressPercent = Math.min(
    100,
    Math.round((session.completedQuestions / (session.totalQuestions || 1)) * 100)
  );

  return (
    <AnimatePresence>
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
          className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {session.baseName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {days !== null && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      days <= 2
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                        : days <= 7
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        : 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300'
                    }`}
                  >
                    {days < 0
                      ? 'Po terminie'
                      : days === 0
                      ? 'Egzamin dzisiaj!'
                      : days === 1
                      ? 'Jutro!'
                      : `Za ${days} dni`}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 bg-zinc-50/70 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300 font-medium">
              <span className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                {t('learn.newSessionModal.targetDate')}
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {session.targetDate
                  ? new Date(session.targetDate).toLocaleDateString(
                      i18n.language === 'en' ? 'en-US' : 'pl-PL',
                      { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }
                    )
                  : '-'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300 font-medium">
              <span className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                {t('summary.questionsLabel')}
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {session.completedQuestions} / {session.totalQuestions}
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Sparkle className="w-3 h-3 text-amber-500" />
                  {t('dashboard.yourProgress')}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-zinc-200/80 dark:bg-zinc-700/60 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {isEditingDate ? (
            <div className="space-y-2.5 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                {t('schedule.assignModal.selectDate')}
              </label>
              <div className="flex items-center gap-2">
                <DatePicker
                  value={tempDate || session.targetDate || ''}
                  onChange={(date) => setTempDate(date)}
                  minDate={format(new Date(), 'yyyy-MM-dd')}
                  placeholder={t('schedule.assignModal.selectDate')}
                  size="sm"
                  className="flex-1"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateDate(session.id, undefined);
                    setIsEditingDate(false);
                  }}
                  className="px-2.5 py-1 text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                >
                  {t('schedule.detailsModal.removeDate', 'Usuń termin')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingDate(false)}
                  className="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {t('schedule.assignModal.cancelBtn')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (tempDate) {
                      onUpdateDate(session.id, tempDate);
                    }
                    setIsEditingDate(false);
                  }}
                  className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {t('schedule.assignModal.saveBtn')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-1">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setTempDate(session.targetDate || format(new Date(), 'yyyy-MM-dd'));
                  setIsEditingDate(true);
                }}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                {t('schedule.detailsModal.changeDate')}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onStartLearning}
                className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                {t('schedule.detailsModal.startLearning')}
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
