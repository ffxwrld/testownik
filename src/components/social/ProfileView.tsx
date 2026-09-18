import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  User, Gear, ChartBar, Users, ArrowsClockwise, Cloud, SignOut, CaretRight, Calendar, EnvelopeSimple } from '@phosphor-icons/react';

import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useSync } from '../../hooks/useSync';
import { Button } from '../ui/Button';
import { PageHeader } from '../common/PageHeader';
import { StatsView } from '../StatsView';
import { FriendsView } from './FriendsView';
import { cn } from '../../utils/cn';

export type ProfileTab = 'profile' | 'stats' | 'friends';

interface ProfileViewProps {
  onOpenSettings?: () => void;
  initialTab?: ProfileTab;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenSettings, initialTab = 'profile' }) => {
  const { t, i18n } = useTranslation();
  const { user, signOut, deleteAccount } = useAuth();
  const { profile } = useProfile();
  const { triggerSync } = useSync();
  const [syncing, setSyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);

  const userEmail = user?.email || user?.user_metadata?.email || (typeof window !== 'undefined' ? localStorage.getItem('testownik_user_email') : null);

  const handleDeleteAccount = async () => {
    if (window.confirm(t('social.profile.deleteConfirm'))) {
      setIsDeleting(true);
      try {
        await deleteAccount();
        toast.success(t('social.profile.deleteSuccess'));
      } catch (err: unknown) {
        toast.error(
          t('social.profile.deleteError', {
            message: (err as Error)?.message || t('social.profile.checkConnection')
          })
        );
        setIsDeleting(false);
      }
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    await triggerSync();
    setSyncing(false);
    toast.success(t('social.profile.syncSuccess'));
  };

  if (!profile) return null;

  const initial = profile.username.charAt(0).toUpperCase();
  const colorHash = profile.username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = colorHash % 360;
  const avatarStyle = { backgroundColor: `hsl(${hue}, 70%, 50%)` };

  const tabs: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: t('social.profile.tabs.account'), icon: <User className="w-4 h-4" /> },
    { id: 'stats', label: t('social.profile.tabs.stats'), icon: <ChartBar className="w-4 h-4" /> },
    { id: 'friends', label: t('social.profile.tabs.friends'), icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-6 pb-32 md:pb-12">
      <PageHeader
        icon={activeTab === 'profile' ? <User /> : activeTab === 'stats' ? <ChartBar /> : <Users />}
        title={
          activeTab === 'profile' 
            ? t('social.profile.headers.accountTitle') 
            : activeTab === 'stats' 
            ? t('social.profile.headers.statsTitle') 
            : t('social.profile.headers.friendsTitle')
        }
        subtitle={
          activeTab === 'profile' 
            ? t('social.profile.headers.accountSubtitle')
            : activeTab === 'stats'
            ? t('social.profile.headers.statsSubtitle')
            : t('social.profile.headers.friendsSubtitle')
        }
      />

      {/* Apple-style Segmented Control */}
      <div className="flex justify-center">
        <div className="inline-flex items-center p-1 rounded-2xl bg-zinc-100/90 dark:bg-zinc-800/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-colors duration-200 select-none cursor-pointer",
                  isActive
                    ? "text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="profile-active-tab-pill"
                    className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-xl shadow-xs border border-zinc-200/50 dark:border-zinc-700/50 -z-10"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                  />
                )}
                <span className="shrink-0">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Profile Details (Apple iOS Settings Inset Grouped Style) */}
      {activeTab === 'profile' && (
        <motion.div 
          key="profile-tab-content"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="max-w-xl mx-auto space-y-6"
        >
          {/* 1. Identity Hero Card (Apple ID Card) */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-xs">
            <div 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-3xl sm:text-4xl font-bold text-white shadow-md mb-3.5 border-2 border-white dark:border-zinc-800"
              style={avatarStyle}
            >
              {initial}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {profile.username}
            </h2>
            {userEmail ? (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                <EnvelopeSimple className="w-3.5 h-3.5 opacity-70" />
                <span>{userEmail}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 mt-1 font-medium">
                <User className="w-3.5 h-3.5 opacity-70" />
                <span>{t('social.profile.guestAccount')}</span>
              </div>
            )}
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 text-xs font-medium border border-zinc-200/50 dark:border-zinc-700/50">
              <Calendar className="w-3.5 h-3.5 text-primary-500" />
              <span>
                {t('social.profile.joined', { 
                  date: new Date(profile.created_at).toLocaleDateString(i18n.language === 'pl' ? 'pl-PL' : 'en-US') 
                })}
              </span>
            </div>
          </div>

          {/* 2. Group 1: Chmura i Synchronizacja */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 px-3 uppercase tracking-wider">
              {t('social.profile.sections.cloudData')}
            </span>
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs">
              {/* Synchronizacja */}
              <div className="flex items-center justify-between p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {t('social.profile.syncTitle')}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {t('social.profile.syncDesc')}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={handleSync} 
                  disabled={syncing}
                  className="flex items-center gap-1.5 shrink-0"
                >
                  <ArrowsClockwise className={cn("w-3.5 h-3.5", syncing && "animate-spin")} />
                  {syncing ? t('social.profile.syncingBtn') : t('social.profile.syncBtn')}
                </Button>
              </div>
            </div>
          </div>

          {/* 3. Group 2: Ustawienia aplikacji */}
          {onOpenSettings && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 px-3 uppercase tracking-wider">
                {t('social.profile.sections.preferences')}
              </span>
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs">
                <motion.button
                  whileTap={{ scale: 0.99 }}
                  onClick={onOpenSettings}
                  className="w-full flex items-center justify-between p-4 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 flex items-center justify-center shrink-0">
                      <Gear className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {t('social.profile.appSettingsTitle')}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {t('social.profile.appSettingsDesc')}
                      </div>
                    </div>
                  </div>
                  <CaretRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                </motion.button>
              </div>
            </div>
          )}

          {/* 4. Group 3: Zarządzanie Sesją */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 px-3 uppercase tracking-wider">
              {t('social.profile.sections.session')}
            </span>
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs">
              <motion.button
                whileTap={{ scale: 0.99 }}
                onClick={signOut}
                className="w-full flex items-center justify-between p-4 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                    <SignOut className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                    {t('social.profile.logoutBtn')}
                  </div>
                </div>
                <CaretRight className="w-4 h-4 text-rose-300 dark:text-rose-800 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
            </div>
          </div>

          {/* 5. Dyskretna strefa usuwania konta */}
          <div className="pt-2 flex flex-col items-center text-center">
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="text-xs font-medium text-zinc-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 transition-colors cursor-pointer py-2 px-3 rounded-lg hover:bg-rose-50/50 dark:hover:bg-rose-950/20"
            >
              {isDeleting ? t('social.profile.deletingAccount') : t('social.profile.deleteAccountBtn')}
            </button>
            <p className="text-[11px] text-zinc-400/80 dark:text-zinc-600 max-w-xs mt-0.5">
              {t('social.profile.deleteAccountDesc')}
            </p>
          </div>
        </motion.div>
      )}

      {/* Tab 2: Embedded Stats View */}
      {activeTab === 'stats' && (
        <motion.div
          key="stats-tab-content"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <StatsView embedded />
        </motion.div>
      )}

      {/* Tab 3: Embedded Friends View */}
      {activeTab === 'friends' && (
        <motion.div
          key="friends-tab-content"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <FriendsView embedded />
        </motion.div>
      )}
    </div>
  );
};


