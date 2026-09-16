import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useActivity } from '../hooks/useActivity';
import { Clock, CheckCircle2, TrendingUp, Target, CalendarDays } from 'lucide-react';
import { Card } from './ui/Card';

interface ProgressViewProps {
  showHeader?: boolean;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ showHeader = true }) => {
  const { t } = useTranslation();
  const { activity } = useActivity();
  
  const last7Days = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      const dayLabel = t(`stats.days.${dayKeys[d.getDay()]}`);
      
      const dayData = activity.find(a => a.log_date === dateString);
      days.push({
        date: dateString,
        label: dayLabel,
        studySeconds: dayData?.study_seconds || 0,
        xp: dayData?.xp_gained || 0
      });
    }
    return days;
  }, [activity, t]);

  const maxStudyTime = Math.max(...last7Days.map(d => d.studySeconds), 60); // min 1 minute to avoid divide by zero
  
  const weeklyStats = useMemo(() => {
    return activity.reduce((acc, curr) => {
      acc.time += curr.study_seconds;
      acc.correct += curr.correct_answers;
      acc.questions += curr.questions_answered;
      acc.sessions += curr.sessions_completed;
      return acc;
    }, { time: 0, correct: 0, questions: 0, sessions: 0 });
  }, [activity]);

  const weeklyAccuracy = weeklyStats.questions > 0 
    ? Math.round((weeklyStats.correct / weeklyStats.questions) * 100) 
    : 0;

  return (
    <div className={showHeader ? "w-full max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8 pb-32 md:pb-12" : "w-full"}>
      <div className={showHeader ? "w-full" : "w-full"}>
        
        {showHeader && (
          <div className="flex items-center justify-between mb-8 mt-2">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{t('stats.tabs.progress')}</h1>
          </div>
        )}

        <div className="space-y-6">
          
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4">
            <CalendarDays className="w-4 h-4 text-primary-500" /> {t('stats.progress.last7Days')}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tile 1 */}
            <div>
              <Card className="p-5 flex flex-col items-start h-full">
                <div className="flex items-center gap-2 mb-3 text-zinc-500">
                  <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('stats.progress.studyTime')}</span>
                </div>
                <div className="mt-auto">
                  <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tabular-nums tracking-tight">
                    {Math.round(weeklyStats.time / 60)}
                  </span>
                  <span className="text-sm font-bold text-zinc-400 ml-1">{t('stats.progress.minutes')}</span>
                </div>
              </Card>
            </div>

            {/* Tile 2 */}
            <div>
              <Card className="p-5 flex flex-col items-start h-full">
                <div className="flex items-center gap-2 mb-3 text-zinc-500">
                  <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
                    <Target className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('stats.progress.accuracy')}</span>
                </div>
                <div className="mt-auto">
                  <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tabular-nums tracking-tight">
                    {weeklyAccuracy}
                  </span>
                  <span className="text-sm font-bold text-zinc-400 ml-1">%</span>
                </div>
              </Card>
            </div>

            {/* Tile 3 */}
            <div>
              <Card className="p-5 flex flex-col items-start h-full">
                <div className="flex items-center gap-2 mb-3 text-zinc-500">
                  <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-500/20">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('stats.progress.sessions')}</span>
                </div>
                <div className="mt-auto">
                  <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tabular-nums tracking-tight">
                    {weeklyStats.sessions}
                  </span>
                </div>
              </Card>
            </div>

            {/* Tile 4 */}
            <div>
              <Card className="p-5 flex flex-col items-start h-full">
                <div className="flex items-center gap-2 mb-3 text-zinc-500">
                  <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('stats.progress.questions')}</span>
                </div>
                <div className="mt-auto">
                  <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tabular-nums tracking-tight">
                    {weeklyStats.questions}
                  </span>
                </div>
              </Card>
            </div>
          </div>

          <div className="pt-4">
            <Card className="p-6 sm:p-8">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-8">{t('stats.progress.activity')}</h3>
              
              <div className="relative h-56 mt-6">
                <div className="absolute inset-0 flex items-end justify-between gap-2 sm:gap-6">
                  {last7Days.map((day, i) => {
                    const heightPercent = day.studySeconds > 0 ? Math.max((day.studySeconds / maxStudyTime) * 100, 4) : 0;
                    const isToday = i === 6;
                    
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        
                        {/* The actual chart track area */}
                        <div className="w-full h-48 flex items-end justify-center">
                          {/* The chart bar */}
                          <div 
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full max-w-[48px] rounded-t-xl relative flex justify-center transition-[height] duration-300 ease-out ${
                              isToday 
                                ? 'bg-primary-500 shadow-[0_0_15px_rgba(var(--color-primary-500),0.3)]' 
                                : 'bg-zinc-300 dark:bg-zinc-700 group-hover:bg-primary-400 dark:group-hover:bg-primary-500 transition-colors'
                            }`}
                          >
                            {/* Tooltip rides on top of the bar */}
                            {day.studySeconds > 0 && (
                              <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-[opacity,transform] duration-200 ease-out group-hover:-translate-y-1 pointer-events-none z-10 flex flex-col items-center">
                                <div className="bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] sm:text-xs font-bold py-1 px-2 sm:py-1.5 sm:px-3 rounded-lg shadow-lg whitespace-nowrap">
                                  {Math.round(day.studySeconds / 60)} {t('stats.progress.minutes')}
                                </div>
                                <div className="w-2 h-2 bg-zinc-800 dark:bg-zinc-100 rotate-45 -mt-1 shadow-sm" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Label */}
                        <span className={`mt-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest ${
                          isToday 
                            ? 'text-primary-600 dark:text-primary-400' 
                            : 'text-zinc-400 dark:text-zinc-500'
                        }`}>
                          {day.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
};
