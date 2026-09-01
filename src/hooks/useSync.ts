import { useEffect } from 'react';
import { syncStatsToServer, buyStreakFreeze } from '../utils/sync';
import { useAuth } from './useAuth';

export function useSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Try to sync when the component mounts (e.g. app starts)
    syncStatsToServer();

    // Listen for online events to trigger a sync when coming back online
    const handleOnline = () => {
      syncStatsToServer();
    };

    // Auto-sync every 60 seconds (for incremental minutes logging)
    const syncInterval = setInterval(() => {
      syncStatsToServer();
    }, 60000);

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(syncInterval);
    };
  }, [user]);

  return {
    triggerSync: syncStatsToServer,
    buyStreakFreeze
  };
}
