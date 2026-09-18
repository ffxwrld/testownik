import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChartBar, ChartLine, Trophy } from '@phosphor-icons/react';
import { ProgressView } from './ProgressView';
import { LeaderboardView } from './social/LeaderboardView';
import { PageHeader } from './common/PageHeader';
import { cn } from '../utils/cn';

export type StatsTab = 'progress' | 'ranking';

interface StatsViewProps {
  embedded?: boolean;
}

export const StatsView: React.FC<StatsViewProps> = ({ embedded = false }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<StatsTab>('progress');

  const tabs: { id: StatsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'progress', label: t('stats.tabs.progress'), icon: <ChartLine className="w-4 h-4" /> },
    { id: 'ranking', label: t('stats.tabs.ranking'), icon: <Trophy className="w-4 h-4" /> },
  ];

  if (embedded) {
    return (
      <div className="w-full space-y-6">
        <div className="flex justify-center sm:justify-start">
          <div className="flex p-1 rounded-2xl bg-zinc-200/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 z-10 active:scale-[0.98] cursor-pointer",
                  activeTab === tab.id
                    ? "text-zinc-900 dark:text-zinc-50 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="stats-embedded-segmented-pill"
                    className="absolute inset-0 bg-white dark:bg-zinc-700/90 rounded-xl shadow-xs -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          {activeTab === 'progress' && <ProgressView showHeader={false} />}
          {activeTab === 'ranking' && <LeaderboardView showHeader={false} />}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8 pb-32 md:pb-12">
      {/* Header & Apple Segmented Control */}
      <PageHeader
        icon={<ChartBar />}
        title={t('stats.title')}
        subtitle={t('stats.subtitle')}
      >
        <div className="flex p-1 rounded-2xl bg-zinc-200/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 w-fit self-start sm:self-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 z-10 active:scale-[0.98] cursor-pointer",
                activeTab === tab.id
                  ? "text-zinc-900 dark:text-zinc-50 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="stats-segmented-pill"
                  className="absolute inset-0 bg-white dark:bg-zinc-700/90 rounded-xl shadow-xs -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </PageHeader>

      {/* Tab content */}
      <div>
        {activeTab === 'progress' && <ProgressView showHeader={false} />}
        {activeTab === 'ranking' && <LeaderboardView showHeader={false} />}
      </div>
    </div>
  );
};
