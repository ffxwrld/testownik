
import useSWR from 'swr';
import { getFriends, sendFriendRequest, respondToRequest, removeFriend, searchUsers, FriendData } from '../utils/friends';
import { UserProfile } from '../models/social';
import { useAuth } from './useAuth';

export function useFriends() {
  const { user } = useAuth();

  const {
    data: friends = [],
    error,
    isLoading,
    mutate
  } = useSWR<FriendData[]>(user ? 'friends' : null, getFriends);

  const handleSendRequest = async (addresseeId: string) => {
    await sendFriendRequest(addresseeId);
    await mutate();
  };

  const handleRespond = async (friendshipId: string, accept: boolean) => {
    await respondToRequest(friendshipId, accept);
    await mutate();
  };

  const handleRemove = async (friendshipId: string) => {
    await removeFriend(friendshipId);
    await mutate();
  };

  const handleSearch = async (query: string): Promise<UserProfile[]> => {
    if (!query || query.length < 3) return [];
    return searchUsers(query);
  };

  return {
    friends,
    loading: isLoading,
    error: error ? error.message : null,
    refreshFriends: mutate,
    sendRequest: handleSendRequest,
    respondToRequest: handleRespond,
    removeFriend: handleRemove,
    searchUsers: handleSearch,
  };
}
