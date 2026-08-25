import { useState, useEffect, useCallback } from 'react';
import { getFriends, sendFriendRequest, respondToRequest, removeFriend, searchUsers, FriendData } from '../utils/friends';
import { UserProfile } from '../models/social';
import { useAuth } from './useAuth';

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getFriends();
      setFriends(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const handleSendRequest = async (addresseeId: string) => {
    await sendFriendRequest(addresseeId);
    await fetchFriends();
  };

  const handleRespond = async (friendshipId: string, accept: boolean) => {
    await respondToRequest(friendshipId, accept);
    await fetchFriends();
  };

  const handleRemove = async (friendshipId: string) => {
    await removeFriend(friendshipId);
    await fetchFriends();
  };

  const handleSearch = async (query: string): Promise<UserProfile[]> => {
    if (!query || query.length < 3) return [];
    return searchUsers(query);
  };

  return {
    friends,
    loading,
    error,
    refreshFriends: fetchFriends,
    sendRequest: handleSendRequest,
    respondToRequest: handleRespond,
    removeFriend: handleRemove,
    searchUsers: handleSearch,
  };
}
