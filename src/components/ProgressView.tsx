import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useActivity } from '../hooks/useActivity';
import { Clock, CheckCircle2, TrendingUp, Target, CalendarDays } from 'lucide-react';
import { Card } from './ui/Card';

export const ProgressView: React.FC = () => {
  const { activity } = useActivity();
  
  const last7Days = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const dayLabel = ['Nd', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'][d.getDay()];
      
      const dayData = activity.find(a => a.log_date === dateString);
      days.push({
        date: dateString,
        label: dayLabel,
        studySeconds: dayData?.study_seconds || 0,
        xp: dayData?.xp_gained || 0
      });
    }
    return days;
  }, [activity]);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar bg-transparent">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        
        <div className="flex items-center justify-between mb-8 mt-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Postępy</h1>
        </div>

        <motion.div 
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
            <CalendarDays className="w-4 h-4" /> Ostatnie 7 dni
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tile 1 */}
            <motion.div variants={itemVariants}>
              <Card className="p-5 flex flex-col items-start bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow h-full">
                <div className="flex items-center gap-2 mb-3 text-zinc-500">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Czas nauki</span>
                </div>
                <div className="mt-auto">
                  <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tabular-nums tracking-tight">
                    {Math.round(weeklyStats.time / 60)}
                  </span>
                  <span className="text-sm font-bold text-zinc-400 ml-1">min</span>
                </div>
              </Card>
            </motion.div>

            {/* Tile 2 */}
            <motion.div variants={itemVariants}>
              <Card className="p-5 flex flex-col items-start bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow h-full">
                <div className="flex items-center gap-2 mb-3 text-zinc-500">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <Target className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Celność</span>
                </div>
                <div className="mt-auto">
                  <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tabular-nums tracking-tight">
                    {weeklyAccuracy}
                  </span>
                  <span className="text-sm font-bold text-zinc-400 ml-1">%</span>
                </div>
              </Card>
            </motion.div>

            {/* Tile 3 */}
            <motion.div variants={itemVariants}>
              <Card className="p-5 flex flex-col items-start bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow h-full">
                <div className="flex items-center gap-2 mb-3 text-zinc-500">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Sesje</span>
                </div>
                <div className="mt-auto">
                  <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tabular-nums tracking-tight">
                    {weeklyStats.sessions}
                  </span>
                </div>
              </Card>
            </motion.div>

            {/* Tile 4 */}
            <motion.div variants={itemVariants}>
              <Card className="p-5 flex flex-col items-start bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow h-full">
                <div className="flex items-center gap-2 mb-3 text-zinc-500">
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Pytania</span>
                </div>
                <div className="mt-auto">
                  <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tabular-nums tracking-tight">
                    {weeklyStats.questions}
                  </span>
                </div>
              </Card>
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="pt-4">
            <Card className="p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-8">Aktywność</h3>
              
              <div className="relative h-56 mt-6">
                <div className="absolute inset-0 flex items-end justify-between gap-2 sm:gap-6">
                  {last7Days.map((day, i) => {
                    const heightPercent = day.studySeconds > 0 ? Math.max((day.studySeconds / maxStudyTime) * 100, 4) : 0;
                    const isToday = i === 6;
                    
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        
                        {/* The actual chart track area */}
                        <div className="w-full h-48 flex items-end justify-center">
                          {/* The animated bar */}
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPercent}%` }}
                            transition={{ duration: 0.8, delay: i * 0.08, type: "spring", bounce: 0.2 }}
                            className={`w-full max-w-[48px] rounded-t-xl relative flex justify-center ${
                              isToday 
                                ? 'bg-primary-500 shadow-[0_0_15px_rgba(var(--color-primary-500),0.3)]' 
                                : 'bg-zinc-300 dark:bg-zinc-700 group-hover:bg-primary-400 dark:group-hover:bg-primary-500 transition-colors'
                            }`}
                          >
                            {/* Tooltip rides on top of the bar */}
                            {day.studySeconds > 0 && (
                              <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:-translate-y-1 pointer-events-none z-10 flex flex-col items-center">
                                <div className="bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] sm:text-xs font-bold py-1 px-2 sm:py-1.5 sm:px-3 rounded-lg shadow-lg whitespace-nowrap">
                                  {Math.round(day.studySeconds / 60)} min
                                </div>
                                <div className="w-2 h-2 bg-zinc-800 dark:bg-zinc-100 rotate-45 -mt-1 shadow-sm" />
                              </div>
                            )}
                          </motion.div>
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
          </motion.div>

        </motion.div>

      </div>
    </div>
  );
};
