import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Trophy } from 'lucide-react';
import { ProgressView } from './ProgressView';
import { LeaderboardView } from './social/LeaderboardView';

type StatsTab = 'progress' | 'ranking';

export const StatsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StatsTab>('progress');

  const tabs: { id: StatsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'progress', label: 'Postępy', icon: <LineChart className="w-4 h-4" /> },
    { id: 'ranking', label: 'Ranking', icon: <Trophy className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Tab switcher */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-0">
        <div className="flex items-center justify-between mb-2 mt-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Statystyki</h1>
        </div>
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors z-10 ${
                activeTab === tab.id
                  ? 'text-zinc-900 dark:text-zinc-50'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="stats-active-tab"
                  className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-lg shadow-sm -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                />
              )}
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {activeTab === 'progress' && <ProgressView showHeader={false} />}
        {activeTab === 'ranking' && <LeaderboardView showHeader={false} />}
      </div>
    </div>
  );
};
