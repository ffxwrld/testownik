import { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { LineChart, LayoutDashboard, Zap, Trophy, PenTool, Users, Settings, Gamepad2 } from 'lucide-react';

import { useLocation } from 'wouter';
import logo from '../../assets/logo.png';
import { useProfile } from '../../hooks/useProfile';
import { useUserStats, calculateLevel } from '../../hooks/useUserStats';

export type MainLayoutPhase = 'dashboard' | 'learn' | 'leaderboard' | 'creator' | 'friends' | 'settings' | 'profile';

interface MainLayoutProps {
  onNavigate?: (phase: string) => void;
  children: ReactNode;
}

export const MainLayout: FC<MainLayoutProps> = ({ children, onNavigate }) => {
  const [location] = useLocation();
  const currentPhase = location === '/' ? 'dashboard' : location === '/nauka' ? 'learn' : location === '/ranking' ? 'leaderboard' : location === '/kreator' ? 'creator' : location === '/znajomi' ? 'friends' : location === '/profil' ? 'profile' : location === '/progress' ? 'progress' : location === '/multiplayer' ? 'multiplayer' : 'dashboard';
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { stats } = useUserStats();

  const levelInfo = stats ? calculateLevel(stats.total_xp) : { level: 1, currentLevelXp: 0, nextLevelXp: 1250, progress: 0, xpToNextLevel: 1250 };

  const mainTabs = [
    { id: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: t('layout.nav.dashboard', 'Pulpit') },
    { id: 'multiplayer', icon: <Gamepad2 className="w-5 h-5" />, label: 'Graj' },
    { id: 'learn', icon: <Zap className="w-5 h-5" />, label: t('layout.nav.learn', 'Nauka') },
    { id: 'leaderboard', icon: <Trophy className="w-5 h-5" />, label: t('layout.nav.leaderboard', 'Ranking') },
    { id: 'progress', icon: <LineChart className="w-5 h-5" />, label: 'Postępy' },
    { id: 'creator', icon: <PenTool className="w-5 h-5" />, label: t('layout.nav.creator', 'Kreator') },
  ];

  const bottomTabs = [
    { id: 'friends', icon: <Users className="w-5 h-5" />, label: t('layout.nav.friends', 'Znajomi') },
    { id: 'settings', icon: <Settings className="w-5 h-5" />, label: t('layout.nav.settings', 'Ustawienia') },
  ];

  const allMobileTabs = [...mainTabs, bottomTabs[0]]; // 5 tabs for mobile bottom bar


  const renderTab = (tab: { id: string; icon: React.ReactNode; label: string }) => {
    const isActive = currentPhase === tab.id;
    return (
      <motion.button
        whileTap={{ scale: 0.96 }}
        key={tab.id}
        onClick={() => onNavigate?.(tab.id)}
        className={`relative flex items-center gap-4 px-4 py-3 rounded-xl transition-colors font-semibold z-10 ${
          isActive 
            ? 'text-primary-700 dark:text-primary-300' 
            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/50 hover:text-zinc-900 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100'
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="desktop-active-tab"
            className="absolute inset-0 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-900/50 rounded-xl shadow-sm -z-10"
            transition={{ type: "spring" as const, bounce: 0.2, duration: 0.4 }}
          />
        )}
        <span className="text-xl opacity-80 grayscale">{tab.icon}</span>
        <span className="text-sm tracking-wide">{tab.label}</span>
      </motion.button>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-[#09090b] dark:to-[#09090b]">
      
      {/* Sidebar for Desktop — fixed to left edge */}
      <nav className="hidden md:flex flex-col w-64 fixed top-0 left-0 bottom-0 border-r border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-xl p-4 pb-14 z-30">
        
        {/* Scrollable top area */}
        <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col pb-4">
          <div className="flex items-center gap-3 mb-10 mt-2 px-2 shrink-0">
            <img src={logo} alt="Logo" className="w-8 h-8 drop-shadow-md" />
            <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-50">Testownik</span>
          </div>
          
          {/* Main navigation tabs */}
          <div className="flex flex-col gap-1.5 shrink-0">
            {mainTabs.map(renderTab)}
          </div>
        </div>

        {/* Fixed bottom area */}
        <div className="flex-none pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex flex-col gap-1.5">
            {bottomTabs.map(renderTab)}
          </div>

          {/* User Profile Mini Snippet */}
          {profile && (
            <div 
              className="mt-4 flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition cursor-pointer shrink-0"
              onClick={() => onNavigate?.('profile')}
            >
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
                {profile.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate">
                  {profile.username}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  Poz. {levelInfo.level} • {stats?.total_xp || 0} XP
                </span>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area — offset by sidebar width on desktop */}
      <main className="flex-1 md:ml-64 overflow-y-auto relative pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0 hide-scrollbar h-full">
        {children}
      </main>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] bg-white/90 dark:bg-[#0f0f13]/90 backdrop-blur-md border-t border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-around z-40 px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
        {allMobileTabs.map(tab => {
          const isActive = currentPhase === tab.id;
          return (
            <motion.button
              whileTap={{ scale: 0.92 }}
              key={tab.id}
              onClick={() => onNavigate?.(tab.id)}
              className={`relative flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors ${
                isActive ? 'text-primary-600 dark:text-primary-400' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400'
              }`}
            >
              
              <span className={`text-xl transition-transform duration-200 opacity-80 grayscale ${isActive ? 'scale-110 -translate-y-0.5 grayscale-0' : ''}`}>
                {tab.icon}
              </span>
              <span className={`text-[10px] font-bold tracking-wide transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                {tab.label}
              </span>
            </motion.button>
          )
        })}
      </nav>
    </div>
  );
};
