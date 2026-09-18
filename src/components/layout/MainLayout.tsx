import { FC, ReactNode, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { SquaresFour, Lightning, GameController, Calendar, User } from '@phosphor-icons/react';

import { useLocation } from 'wouter';
import logo from '../../assets/logo.png';
import { useProfile } from '../../hooks/useProfile';
import { useUserStats, calculateLevel } from '../../hooks/useUserStats';

import { AppPhase } from '../../hooks/useAppOrchestrator';

export type MainLayoutNavTarget = AppPhase | 'settings';

interface MainLayoutProps {
  onNavigate?: (phase: MainLayoutNavTarget) => void;
  children: ReactNode;
}

export const MainLayout: FC<MainLayoutProps> = ({ children, onNavigate }) => {
  const [location] = useLocation();
  const currentPhase = location === '/' ? 'dashboard' : location === '/nauka' ? 'learn' : location === '/statystyki' ? 'stats' : location === '/znajomi' ? 'friends' : location === '/profil' ? 'profile' : location === '/multiplayer' ? 'multiplayer' : location === '/harmonogram' ? 'schedule' : 'dashboard';
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { stats } = useUserStats();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPhase]);

  const levelInfo = stats ? calculateLevel(stats.total_xp) : { level: 1, currentLevelXp: 0, nextLevelXp: 1250, progress: 0, xpToNextLevel: 1250 };

  const mainTabs: { id: MainLayoutNavTarget; icon: React.ReactNode; label: string }[] = [
    { id: 'dashboard', icon: <SquaresFour className="w-5 h-5" />, label: t('nav.dashboard', 'Pulpit') },
    { id: 'multiplayer', icon: <GameController className="w-5 h-5" />, label: t('nav.games', 'Graj') },
    { id: 'learn', icon: <Lightning className="w-5 h-5" />, label: t('nav.learn', 'Nauka') },
    { id: 'schedule', icon: <Calendar className="w-5 h-5" />, label: t('nav.schedule', 'Harmonogram') },
  ];

  const userHue = profile
    ? profile.username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360
    : 200;

  const profileAvatarIcon = profile ? (
    profile.avatar_url ? (
      <img
        src={profile.avatar_url}
        alt={profile.username}
        className="w-5 h-5 rounded-full object-cover shadow-xs border border-white/80 dark:border-zinc-700"
      />
    ) : (
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white shadow-xs"
        style={{ backgroundColor: `hsl(${userHue}, 70%, 50%)` }}
      >
        {profile.username.charAt(0).toUpperCase()}
      </div>
    )
  ) : (
    <User className="w-5 h-5" />
  );

  const mobileTabs: { id: MainLayoutNavTarget; icon: React.ReactNode; label: string }[] = [
    { id: 'dashboard', icon: <SquaresFour className="w-5 h-5" />, label: t('nav.dashboard', 'Pulpit') },
    { id: 'learn', icon: <Lightning className="w-5 h-5" />, label: t('nav.learn', 'Nauka') },
    { id: 'multiplayer', icon: <GameController className="w-5 h-5" />, label: t('nav.games', 'Graj') },
    { id: 'schedule', icon: <Calendar className="w-5 h-5" />, label: t('nav.schedule', 'Harmonogram') },
    { id: 'profile', icon: profileAvatarIcon, label: t('nav.profile', 'Profil') },
  ];

  const renderTab = (tab: { id: MainLayoutNavTarget; icon: React.ReactNode; label: string }) => {
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
          {/* User Profile Mini Snippet */}
          {profile && (
            <div 
              className={`flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition cursor-pointer shrink-0 ${
                currentPhase === 'profile' 
                  ? 'bg-zinc-100 dark:bg-zinc-800/80 shadow-sm border border-zinc-200/50 dark:border-zinc-700/50' 
                  : 'border border-transparent'
              }`}
              onClick={() => onNavigate?.('profile')}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0"
                style={{ backgroundColor: `hsl(${profile.username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 70%, 50%)` }}
              >
                {profile.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate">
                  {profile.username}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  {t('nav.level', 'Poz.')} {levelInfo.level} • {stats?.total_xp || 0} XP
                </span>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area — offset by sidebar width on desktop */}
      <main ref={mainRef} className="flex-1 md:ml-64 overflow-y-auto relative pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0 hide-scrollbar h-full">
        {children}
      </main>

      {/* Mobile Floating Island TabBar (Apple iOS 18 & visionOS Style - Icon Only) */}
      <div className="md:hidden fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 flex justify-center px-3 pointer-events-none">
        <nav 
          aria-label={t('nav.mainNavigation', 'Nawigacja')}
          className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl border border-zinc-200/80 dark:border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
        >
          {mobileTabs.map(tab => {
            const isActive = currentPhase === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => onNavigate?.(tab.id)}
                aria-label={tab.label}
                title={tab.label}
                className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-colors duration-200 select-none cursor-pointer ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-active-pill"
                    className="absolute inset-0 bg-primary-500/10 dark:bg-primary-400/15 border border-primary-500/25 dark:border-primary-400/30 rounded-full -z-10 shadow-xs"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                  />
                )}
                <span className={`shrink-0 [&>svg]:w-5 [&>svg]:h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'opacity-85'}`}>
                  {tab.icon}
                </span>
              </motion.button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
