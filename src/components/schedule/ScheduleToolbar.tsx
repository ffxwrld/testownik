import React from 'react';
import { ToolbarProps, Views } from 'react-big-calendar';
import { format } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CaretLeft, CaretRight, CalendarDots, Funnel } from '@phosphor-icons/react';
import { CalendarEvent } from './types';

export const ScheduleToolbar: React.FC<ToolbarProps<CalendarEvent, object>> = ({
  date,
  view,
  onView,
  onNavigate,
}) => {
  const { t, i18n } = useTranslation();
  // Format Month + Year e.g. "wrzesień 2026" / "September 2026"
  const monthYearLabel = format(date, 'LLLL yyyy', { locale: i18n.language === 'en' ? enUS : pl });

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-5 pb-2">
      {/* Left: Navigation Chevrons + Month title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-zinc-100/80 dark:bg-zinc-800/80 rounded-xl p-0.5 border border-zinc-200/50 dark:border-zinc-700/50">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate('PREV')}
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700/80 transition-colors shadow-none hover:shadow-xs"
            aria-label={t('test.prevQuestion', 'Poprzedni')}
          >
            <CaretLeft className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate('TODAY')}
            className="px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700/80 rounded-lg transition-colors shadow-none hover:shadow-xs"
          >
            {t('schedule.calendar.today')}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate('NEXT')}
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700/80 transition-colors shadow-none hover:shadow-xs"
            aria-label={t('test.nextShort', 'Dalej')}
          >
            <CaretRight className="w-4 h-4" />
          </motion.button>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 capitalize">
          {monthYearLabel}
        </h2>
      </div>

      {/* Right: Apple Segmented Control [ Miesiąc | Agenda ] */}
      <div className="flex items-center bg-zinc-100/90 dark:bg-zinc-800/80 p-1 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50 self-start sm:self-auto">
        <button
          onClick={() => onView(Views.MONTH)}
          className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors z-10 flex items-center gap-1.5 ${
            view === Views.MONTH
              ? 'text-zinc-900 dark:text-zinc-50'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          {view === Views.MONTH && (
            <motion.div
              layoutId="calendar-segmented-pill"
              className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-xl shadow-xs -z-10"
              transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
            />
          )}
          <CalendarDots className="w-3.5 h-3.5" />
          {t('schedule.calendar.month')}
        </button>

        <button
          onClick={() => onView(Views.AGENDA)}
          className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors z-10 flex items-center gap-1.5 ${
            view === Views.AGENDA
              ? 'text-zinc-900 dark:text-zinc-50'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          {view === Views.AGENDA && (
            <motion.div
              layoutId="calendar-segmented-pill"
              className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-xl shadow-xs -z-10"
              transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
            />
          )}
          <Funnel className="w-3.5 h-3.5" />
          {t('schedule.calendar.agenda')}
        </button>
      </div>
    </div>
  );
};
