import React, { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { Calendar, dateFnsLocalizer, View, Views, ToolbarProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isValid, differenceInCalendarDays } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { getAllSessionMetadata, loadSession, saveSession } from '../utils/session';
import { SavedSessionMetadata } from '../models/types';
import { DatePicker } from './ui/DatePicker';
import { PageHeader } from './common/PageHeader';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  BookOpen, 
  Sparkles, 
  Plus, 
  X, 
  AlertCircle, 
  ArrowRight,
  CalendarDays,
  ListFilter
} from 'lucide-react';

const locales = { pl, en: enUS, 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: pl }),
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: SavedSessionMetadata;
}

// Apple-style Error Boundary
class CalendarErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Calendar Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50/50 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40 rounded-3xl text-center my-8 backdrop-blur-md">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Nie udało się wyświetlić harmonogramu</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 mb-4">
            {this.state.error || 'Wystąpił problem z formatowaniem dat.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold rounded-xl text-xs transition active:scale-95 shadow-sm"
          >
            Odśwież kalendarz
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Apple-style Custom Toolbar for react-big-calendar
const CustomCalendarToolbar: React.FC<ToolbarProps<CalendarEvent, object>> = ({
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
            <ChevronLeft className="w-4 h-4" />
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
            <ChevronRight className="w-4 h-4" />
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
          <CalendarDays className="w-3.5 h-3.5" />
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
          <ListFilter className="w-3.5 h-3.5" />
          {t('schedule.calendar.agenda')}
        </button>
      </div>
    </div>
  );
};

export const ScheduleView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const [sessions, setSessions] = useState<SavedSessionMetadata[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<View>(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? Views.AGENDA : Views.MONTH
  );
  const [selectedSession, setSelectedSession] = useState<SavedSessionMetadata | null>(null);
  
  // Modal do szybkiego przypisania daty do paczki
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingDateSessionId, setEditingDateSessionId] = useState<string | null>(null);
  const [newDateInput, setNewDateInput] = useState('');

  const refreshSessions = () => {
    getAllSessionMetadata().then(setSessions);
  };

  useEffect(() => {
    refreshSessions();
  }, []);

  const events: CalendarEvent[] = useMemo(() => {
    const list: CalendarEvent[] = [];

    sessions.forEach(s => {
      if (!s.targetDate) return;

      const dateObj = new Date(s.targetDate);
      if (!isValid(dateObj) || isNaN(dateObj.getTime())) return;

      const start = new Date(dateObj);
      start.setHours(9, 0, 0, 0);

      const end = new Date(dateObj);
      end.setHours(12, 0, 0, 0);

      const isCompleted = s.currentPhase === 'summary' || (s.totalQuestions > 0 && s.completedQuestions >= s.totalQuestions);

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

  // Custom Event component for Agenda & Month view
  const CustomEventItem: React.FC<{ event: CalendarEvent; title: string }> = ({ event }) => {
    const isCompleted = event.resource.currentPhase === 'summary' || 
      (event.resource.totalQuestions > 0 && event.resource.completedQuestions >= event.resource.totalQuestions);

    if (currentView === Views.AGENDA) {
      return (
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isCompleted ? 'bg-emerald-500' : 'bg-primary-500'}`} />
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

  // Styling individual event badge pills
  const eventStyleGetter = (event: CalendarEvent) => {
    // In Agenda view, NEVER style the <tr> as a pill! Keep standard table row layout.
    if (currentView === Views.AGENDA) {
      return {
        className: 'rbc-agenda-row',
        style: {}
      };
    }

    const isCompleted = event.resource.currentPhase === 'summary' || 
      (event.resource.totalQuestions > 0 && event.resource.completedQuestions >= event.resource.totalQuestions);
    
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
      }
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
    setEditingDateSessionId(null);
  };

  const upcomingExams = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sessions
      .filter(s => s.targetDate && new Date(s.targetDate) >= today)
      .sort((a, b) => new Date(a.targetDate!).getTime() - new Date(b.targetDate!).getTime());
  }, [sessions]);

  const unscheduledSessions = useMemo(() => {
    return sessions.filter(s => !s.targetDate);
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
              ? (upcomingExams.length === 1 
                  ? t('schedule.upcomingExams_one', { count: 1 }) 
                  : upcomingExams.length < 5 
                    ? t('schedule.upcomingExams_few', { count: upcomingExams.length }) 
                    : t('schedule.upcomingExams_many', { count: upcomingExams.length }))
              : t('schedule.noExams')
          }
        >
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {unscheduledSessions.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsAssignModalOpen(true)}
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
            onSelectEvent={(event) => setSelectedSession(event.resource)}
            eventPropGetter={eventStyleGetter}
            components={{
              toolbar: CustomCalendarToolbar,
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
              noEventsInRange: i18n.language === 'en' ? 'No scheduled exams in this period.' : 'Brak zaplanowanych egzaminów w tym okresie.',
              showMore: (total) => `+${total} ${i18n.language === 'en' ? 'more' : 'więcej'}`,
            }}
          />
        </div>

        {/* Apple Design Dialog: Exam Details Sheet */}
        <AnimatePresence>
          {selectedSession && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
              onClick={() => setSelectedSession(null)}
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
                      {selectedSession.baseName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedSession.targetDate && (() => {
                        const days = differenceInCalendarDays(new Date(selectedSession.targetDate), new Date());
                        return (
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                            days <= 2 
                              ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400' 
                              : days <= 7 
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' 
                                : 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300'
                          }`}>
                            {days < 0 
                              ? 'Po terminie' 
                              : days === 0 
                                ? 'Egzamin dzisiaj!' 
                                : days === 1 
                                  ? 'Jutro!' 
                                  : `Za ${days} dni`}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
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
                      {new Date(selectedSession.targetDate!).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'pl-PL', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                      {t('summary.questionsLabel')}
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {selectedSession.completedQuestions} / {selectedSession.totalQuestions}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        {t('dashboard.yourProgress')}
                      </span>
                      <span>{Math.round((selectedSession.completedQuestions / (selectedSession.totalQuestions || 1)) * 100)}%</span>
                    </div>
                    <div className="w-full bg-zinc-200/80 dark:bg-zinc-700/60 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.round((selectedSession.completedQuestions / (selectedSession.totalQuestions || 1)) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      const cur = selectedSession.targetDate || '';
                      const promptMsg = i18n.language === 'en' 
                        ? 'Change exam date (YYYY-MM-DD) or leave empty to remove:' 
                        : 'Zmień datę egzaminu (YYYY-MM-DD) lub zostaw puste, aby usunąć:';
                      const next = window.prompt(promptMsg, cur);
                      if (next !== null) {
                        handleUpdateDate(selectedSession.id, next.trim() || undefined);
                      }
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    {t('schedule.detailsModal.changeDate')}
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setSelectedSession(null);
                      setLocation('/nauka');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    {t('schedule.detailsModal.startLearning')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal: Zaplanuj termin dla nieprzypisanej paczki */}
        <AnimatePresence>
          {isAssignModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
              onClick={() => setIsAssignModalOpen(false)}
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
                    onClick={() => setIsAssignModalOpen(false)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
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
                                handleUpdateDate(s.id, date);
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
                  onClick={() => setIsAssignModalOpen(false)}
                  className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-xl transition"
                >
                  Zamknij
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Apple Calendar CSS overrides */}
        <style>{`
          .rbc-calendar {
            font-family: inherit;
            height: 100% !important;
            display: flex;
            flex-direction: column;
          }

          /* Month Grid Container */
          .rbc-month-view {
            border: 1px solid #e4e4e7 !important;
            border-radius: 1.25rem;
            overflow: hidden;
            flex: 1 1 0;
            display: flex;
            flex-direction: column;
            background: transparent;
          }
          .dark .rbc-month-view {
            border-color: #27272a !important;
          }

          /* Weekday Header Row */
          .rbc-month-header {
            border-bottom: 1px solid #e4e4e7 !important;
            background: rgba(244, 244, 245, 0.4);
          }
          .dark .rbc-month-header {
            border-bottom-color: #27272a !important;
            background: rgba(39, 39, 42, 0.3);
          }
          .rbc-header {
            padding: 0.65rem 0.5rem !important;
            font-weight: 600 !important;
            font-size: 0.72rem !important;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #71717a !important;
            border-bottom: 0 !important;
          }
          .dark .rbc-header {
            color: #a1a1aa !important;
          }

          /* Day Rows */
          .rbc-month-row {
            border-top: 1px solid #f4f4f5 !important;
            min-height: 72px;
          }
          .dark .rbc-month-row {
            border-top-color: rgba(39, 39, 42, 0.6) !important;
          }

          /* Day Cell Backgrounds */
          .rbc-day-bg + .rbc-day-bg {
            border-left: 1px solid #f4f4f5 !important;
          }
          .dark .rbc-day-bg + .rbc-day-bg {
            border-left-color: rgba(39, 39, 42, 0.6) !important;
          }

          /* Today Highlight in Apple Calendar style */
          .rbc-day-bg.rbc-today {
            background-color: rgba(37, 99, 235, 0.03) !important;
          }
          .dark .rbc-day-bg.rbc-today {
            background-color: rgba(37, 99, 235, 0.08) !important;
          }

          /* Outside month range */
          .rbc-day-bg.rbc-off-range-bg {
            background-color: rgba(244, 244, 245, 0.5) !important;
          }
          .dark .rbc-day-bg.rbc-off-range-bg {
            background-color: rgba(18, 18, 21, 0.4) !important;
          }

          /* Date Number Cell */
          .rbc-date-cell {
            padding: 0.4rem 0.5rem !important;
            font-size: 0.75rem;
            font-weight: 500;
            color: #52525b;
          }
          .dark .rbc-date-cell {
            color: #a1a1aa;
          }
          .rbc-date-cell.rbc-off-range {
            color: #d4d4d8 !important;
          }
          .dark .rbc-date-cell.rbc-off-range {
            color: #52525b !important;
          }

          /* Apple Calendar Today Circle */
          .rbc-date-cell.rbc-now > a,
          .rbc-date-cell.rbc-now > button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 1.6rem;
            height: 1.6rem;
            border-radius: 9999px;
            background-color: #2563eb;
            color: #ffffff !important;
            font-weight: 700;
            margin-right: -0.15rem;
          }
          .dark .rbc-date-cell.rbc-now > a,
          .dark .rbc-date-cell.rbc-now > button {
            background-color: #3b82f6;
          }

          /* Event Container */
          .rbc-row-segment {
            padding: 1px 3px !important;
          }

          /* Agenda / List View in Apple Calendar Style */
          .rbc-agenda-view {
            border: 1px solid #e4e4e7 !important;
            border-radius: 1.25rem;
            overflow: hidden;
            flex: 1 1 0;
            background: transparent;
            display: flex;
            flex-direction: column;
          }
          .dark .rbc-agenda-view {
            border-color: #27272a !important;
          }

          /* Ensure both thead and tbody tables use fixed layout and identical widths */
          .rbc-agenda-table {
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            border: 0 !important;
          }

          /* Strip all vertical dividers between columns */
          .rbc-agenda-table thead > tr > th,
          .rbc-agenda-table tbody > tr > td,
          .rbc-agenda-table thead > tr > th + th,
          .rbc-agenda-table tbody > tr > td + td {
            border-left: 0 !important;
            border-right: 0 !important;
          }

          /* Column 1: DATA */
          .rbc-agenda-table thead > tr > th:nth-child(1),
          .rbc-agenda-table tbody > tr > td.rbc-agenda-date-cell {
            width: 180px !important;
            min-width: 180px !important;
            max-width: 180px !important;
            padding: 0.85rem 1.25rem !important;
            text-align: left !important;
            font-size: 0.82rem !important;
            font-weight: 600 !important;
            color: #18181b !important;
            white-space: nowrap;
          }
          .dark .rbc-agenda-table tbody > tr > td.rbc-agenda-date-cell {
            color: #f4f4f5 !important;
          }

          /* Column 2: GODZINA */
          .rbc-agenda-table thead > tr > th:nth-child(2),
          .rbc-agenda-table tbody > tr > td.rbc-agenda-time-cell {
            width: 140px !important;
            min-width: 140px !important;
            max-width: 140px !important;
            padding: 0.85rem 1.25rem !important;
            text-align: left !important;
            font-size: 0.8rem !important;
            font-weight: 500 !important;
            color: #71717a !important;
            white-space: nowrap;
            text-transform: capitalize;
          }
          .dark .rbc-agenda-table tbody > tr > td.rbc-agenda-time-cell {
            color: #a1a1aa !important;
          }

          /* Column 3: EGZAMIN */
          .rbc-agenda-table thead > tr > th:nth-child(3),
          .rbc-agenda-table tbody > tr > td.rbc-agenda-event-cell {
            width: auto !important;
            padding: 0.85rem 1.25rem !important;
            text-align: left !important;
            vertical-align: middle !important;
          }

          /* Table Header Styling */
          .rbc-agenda-table thead > tr > th {
            padding: 0.75rem 1.25rem !important;
            font-weight: 600 !important;
            font-size: 0.72rem !important;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #71717a !important;
            border-bottom: 1px solid #e4e4e7 !important;
            background: rgba(244, 244, 245, 0.5) !important;
          }
          .dark .rbc-agenda-table thead > tr > th {
            color: #a1a1aa !important;
            border-bottom-color: #27272a !important;
            background: rgba(39, 39, 42, 0.4) !important;
          }

          /* Row reset, dividers & smooth hover */
          .rbc-agenda-table tbody > tr {
            display: table-row !important;
            background-color: transparent !important;
            border-radius: 0 !important;
            border-bottom: 1px solid #f4f4f5 !important;
            transition: background-color 0.15s ease;
            cursor: pointer;
          }
          .dark .rbc-agenda-table tbody > tr {
            border-bottom-color: rgba(39, 39, 42, 0.6) !important;
          }
          .rbc-agenda-table tbody > tr:hover {
            background-color: rgba(244, 244, 245, 0.7) !important;
          }
          .dark .rbc-agenda-table tbody > tr:hover {
            background-color: rgba(39, 39, 42, 0.45) !important;
          }

          .rbc-agenda-empty {
            padding: 4rem 1.5rem !important;
            text-align: center;
            color: #71717a;
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .dark .rbc-agenda-empty {
            color: #a1a1aa;
          }
        `}</style>
      </div>
    </CalendarErrorBoundary>
  );
};
