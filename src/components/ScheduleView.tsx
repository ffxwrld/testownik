import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isValid, parseISO, startOfDay } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Calendar as CalendarIcon, BookOpen, Plus } from '@phosphor-icons/react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { getAllSessionMetadata, loadSession, saveSession } from '../utils/session';
import { SavedSessionMetadata } from '../models/types';
import { PageHeader } from './common/PageHeader';
import { CalendarErrorBoundary } from './schedule/CalendarErrorBoundary';
import { ScheduleToolbar } from './schedule/ScheduleToolbar';
import { ScheduleAssignModal } from './schedule/ScheduleAssignModal';
import { ScheduleDetailModal } from './schedule/ScheduleDetailModal';
import { ScheduleStyles } from './schedule/ScheduleStyles';
import { CalendarEvent } from './schedule/types';

const locales = { pl, en: enUS, 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date, options?: { locale?: any }) => startOfWeek(date, options || { locale: pl }),
  getDay,
  locales,
});

interface ScheduleViewProps {
  onResumeSession?: (sessionId: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onResumeSession }) => {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const [sessions, setSessions] = useState<SavedSessionMetadata[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<View>(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? Views.AGENDA : Views.MONTH
  );
  const [selectedSession, setSelectedSession] = useState<SavedSessionMetadata | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignInitialDate, setAssignInitialDate] = useState<string | undefined>(undefined);

  const refreshSessions = () => {
    getAllSessionMetadata().then(setSessions);
  };

  useEffect(() => {
    refreshSessions();
  }, []);

  const events: CalendarEvent[] = useMemo(() => {
    const list: CalendarEvent[] = [];

    sessions.forEach((s) => {
      if (!s.targetDate) return;

      const dateObj = parseISO(s.targetDate);
      if (!isValid(dateObj) || isNaN(dateObj.getTime())) return;

      const start = startOfDay(dateObj);
      const end = startOfDay(dateObj);

      const isCompleted =
        s.currentPhase === 'summary' ||
        (s.totalQuestions > 0 && s.completedQuestions >= s.totalQuestions);

      list.push({
        id: s.id,
        title: `${isCompleted ? '✓ ' : ''}${s.baseName}`,
        start,
        end,
        allDay: true,
        resource: s,
      });
    });

    return list;
  }, [sessions]);

  // Custom Event item for Agenda & Month view
  const CustomEventItem: React.FC<{ event: CalendarEvent; title: string }> = ({ event }) => {
    const isCompleted =
      event.resource.currentPhase === 'summary' ||
      (event.resource.totalQuestions > 0 &&
        event.resource.completedQuestions >= event.resource.totalQuestions);

    if (currentView === Views.AGENDA) {
      return (
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isCompleted ? 'bg-emerald-500' : 'bg-primary-500'
              }`}
            />
            <span className="font-semibold text-xs md:text-sm text-zinc-900 dark:text-zinc-100 truncate">
              {event.resource.baseName}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md">
              {event.resource.completedQuestions} / {event.resource.totalQuestions} pytań
            </span>
            {isCompleted && (
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-md">
                ✓ Opanowano
              </span>
            )}
          </div>
        </div>
      );
    }

    return (
      <span className="truncate block font-semibold text-[11px]">
        {event.title}
      </span>
    );
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    if (currentView === Views.AGENDA) {
      return {
        className: 'rbc-agenda-row',
        style: {},
      };
    }

    const isCompleted =
      event.resource.currentPhase === 'summary' ||
      (event.resource.totalQuestions > 0 &&
        event.resource.completedQuestions >= event.resource.totalQuestions);

    return {
      style: {
        backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.95)' : 'rgba(37, 99, 235, 0.95)',
        backdropFilter: 'blur(8px)',
        borderRadius: '9999px',
        color: '#ffffff',
        border: '0px',
        display: 'flex',
        alignItems: 'center',
        fontWeight: 600,
        fontSize: '0.74rem',
        padding: '2px 10px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      },
    };
  };

  const handleUpdateDate = async (sessionId: string, date: string | undefined) => {
    const loaded = await loadSession(sessionId);
    if (loaded) {
      loaded.targetDate = date;
      await saveSession(loaded, sessionId);
      refreshSessions();
      if (selectedSession && selectedSession.id === sessionId) {
        setSelectedSession({ ...selectedSession, targetDate: date });
      }
    }
  };

  const upcomingExams = useMemo(() => {
    const today = startOfDay(new Date());
    return sessions
      .filter((s) => s.targetDate && parseISO(s.targetDate) >= today)
      .sort((a, b) => parseISO(a.targetDate!).getTime() - parseISO(b.targetDate!).getTime());
  }, [sessions]);

  const unscheduledSessions = useMemo(() => {
    return sessions.filter((s) => !s.targetDate);
  }, [sessions]);

  return (
    <CalendarErrorBoundary>
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8 pb-32 md:pb-12">
        {/* Page Header */}
        <PageHeader
          icon={<CalendarIcon />}
          title={t('schedule.title')}
          subtitle={
            upcomingExams.length > 0
              ? upcomingExams.length === 1
                ? t('schedule.upcomingExams_one', { count: 1 })
                : upcomingExams.length < 5
                ? t('schedule.upcomingExams_few', { count: upcomingExams.length })
                : t('schedule.upcomingExams_many', { count: upcomingExams.length })
              : t('schedule.noExams')
          }
        >
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {unscheduledSessions.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setAssignInitialDate(undefined);
                  setIsAssignModalOpen(true);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('schedule.scheduleExam')}</span>
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setLocation('/nauka')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100/80 hover:bg-zinc-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-semibold transition border border-zinc-200/50 dark:border-zinc-700/50 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>{t('schedule.allTests')}</span>
            </motion.button>
          </div>
        </PageHeader>

        {/* Main Calendar Card with Apple Calendar Styling */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-3 sm:p-7 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col h-[520px] sm:h-[700px] min-h-[460px] sm:min-h-[560px]">
          <Calendar
            localizer={localizer}
            events={events}
            culture={i18n.language === 'en' ? 'en' : 'pl'}
            date={currentDate}
            onNavigate={(newDate) => setCurrentDate(newDate)}
            view={currentView}
            onView={(newView) => setCurrentView(newView)}
            views={[Views.MONTH, Views.AGENDA]}
            defaultView={Views.MONTH}
            startAccessor="start"
            endAccessor="end"
            selectable
            onSelectSlot={(slotInfo) => {
              if (unscheduledSessions.length > 0) {
                setAssignInitialDate(format(slotInfo.start, 'yyyy-MM-dd'));
                setIsAssignModalOpen(true);
              }
            }}
            onSelectEvent={(event) => setSelectedSession(event.resource)}
            eventPropGetter={eventStyleGetter}
            components={{
              toolbar: ScheduleToolbar,
              event: CustomEventItem,
            }}
            messages={{
              next: i18n.language === 'en' ? 'Next' : 'Następny',
              previous: i18n.language === 'en' ? 'Previous' : 'Poprzedni',
              today: t('schedule.calendar.today'),
              month: t('schedule.calendar.month'),
              week: t('schedule.calendar.week'),
              day: t('schedule.calendar.day'),
              agenda: t('schedule.calendar.agenda'),
              date: i18n.language === 'en' ? 'Date' : 'Data',
              time: i18n.language === 'en' ? 'Time' : 'Godzina',
              event: i18n.language === 'en' ? 'Exam' : 'Egzamin',
              allDay: i18n.language === 'en' ? 'All day' : 'Cały dzień',
              noEventsInRange:
                i18n.language === 'en'
                  ? 'No scheduled exams in this period.'
                  : 'Brak zaplanowanych egzaminów w tym okresie.',
              showMore: (total) => `+${total} ${i18n.language === 'en' ? 'more' : 'więcej'}`,
            }}
          />
        </div>

        {/* Apple Design Dialog: Exam Details Sheet */}
        <ScheduleDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onUpdateDate={handleUpdateDate}
          onStartLearning={() => {
            const sid = selectedSession?.id;
            setSelectedSession(null);
            if (sid && onResumeSession) {
              onResumeSession(sid);
            } else {
              setLocation('/nauka');
            }
          }}
        />

        {/* Modal: Zaplanuj termin dla nieprzypisanej paczki */}
        <ScheduleAssignModal
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setAssignInitialDate(undefined);
          }}
          initialDate={assignInitialDate}
          unscheduledSessions={unscheduledSessions}
          onUpdateDate={handleUpdateDate}
        />

        {/* Global Apple Calendar CSS overrides */}
        <ScheduleStyles />
      </div>
    </CalendarErrorBoundary>
  );
};
