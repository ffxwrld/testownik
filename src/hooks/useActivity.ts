import useSWR from 'swr';
import { getUserActivity7d, DailyActivity } from '../utils/activity';
import { useAuth } from './useAuth';

export function useActivity() {
  const { user } = useAuth();

  const {
    data: activity = [],
    error,
    isLoading
  } = useSWR<DailyActivity[]>(
    user ? ['activity', user.id] : null,
    ([, userId]) => getUserActivity7d(userId as string),
    { refreshInterval: 60000 }
  );

  return {
    activity,
    loading: isLoading,
    error: error ? error.message : null
  };
}
