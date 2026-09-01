import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useFriends } from '../../hooks/useFriends';
import { FriendData } from '../../utils/friends';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const FriendsView: React.FC = () => {
  const { t } = useTranslation();
  const { friends, loading, error, respondToRequest, removeFriend, searchUsers, sendRequest } = useFriends();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const renderFriendCard = (friend: FriendData) => {
    const isPending = friend.status === 'pending';
    const isIncoming = isPending && !friend.isRequester;
    const isOutgoing = isPending && friend.isRequester;
    const initial = friend.profile.username.charAt(0).toUpperCase();
    const hue = friend.profile.username.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % 360;

    return (
      <motion.div 
        key={friend.friendshipId} 
        layout 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="mb-2 block"
      >
        <Card className="flex items-center justify-between bg-white dark:bg-zinc-900 shadow-sm border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }}>
            {initial}
          </div>
          <div>
            <div className="font-bold text-zinc-900 dark:text-zinc-50">{friend.profile.username}</div>
            {isPending && (
              <div className="text-xs text-amber-500">
                {isIncoming ? 'Oczekujące zaproszenie' : 'Wysłano zaproszenie'}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {isIncoming && (
            <>
              <Button size="sm" variant="primary" onClick={() => respondToRequest(friend.friendshipId, true)}>{t('social.friends.acceptBtn', 'Akceptuj')}</Button>
              <Button size="sm" variant="danger" onClick={() => respondToRequest(friend.friendshipId, false)}>{t('social.friends.rejectBtn', 'Odrzuć')}</Button>
            </>
          )}
          {isOutgoing && (
            <Button size="sm" variant="danger" onClick={() => { removeFriend(friend.friendshipId); toast.success('Anulowano zaproszenie'); }}>Anuluj</Button>
          )}
          {friend.status === 'accepted' && (
            <Button size="sm" variant="secondary" onClick={() => { removeFriend(friend.friendshipId); toast.success('Usunięto znajomego'); }}>Usuń</Button>
          )}
        </div>
      </Card>
      </motion.div>
    );
  };

  const pendingIncoming = friends.filter(f => f.status === 'pending' && !f.isRequester);

  return (
    <div className="flex-1 bg-transparent text-zinc-900 dark:text-zinc-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8 mt-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Znajomi</h1>
            {pendingIncoming.length > 0 && (
              <p className="text-sm text-amber-500 font-medium mt-1">
                {pendingIncoming.length} oczekując{pendingIncoming.length === 1 ? 'e' : 'ych'} zaproszeni{pendingIncoming.length === 1 ? 'e' : 'a'}
              </p>
            )}
          </div>
        </div>

        {error && <div className="p-4 mb-4 bg-red-900/50 text-red-400 rounded-lg">{error}</div>}

        {/* Search / Add Friend */}
        <Card className="mb-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-sm border-zinc-200 dark:border-zinc-800 rounded-xl">
          <h2 className="text-lg font-bold mb-4">Dodaj znajomego</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Szukaj po nicku..."
              className="flex-1 min-w-0 px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              minLength={3}
            />
            <Button type="submit" variant="primary" disabled={searching}>Szukaj</Button>
          </form>
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
              {searchResults.map(user => (
                <div key={user.id} className="flex items-center justify-between p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg font-bold">
                  <span>{user.username}</span>
                  <Button size="sm" variant="secondary" onClick={() => sendRequest(user.id)}>Zaproś</Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Friends List */}
        <div>
          <h2 className="text-lg font-bold mb-4">Twoja lista znajomych</h2>
          {loading ? (
            <div className="animate-pulse space-y-4" role="status" aria-busy="true" aria-label="Ładowanie listy znajomych">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/50 dark:bg-zinc-900/50 shadow-sm rounded-xl"></div>)}
            </div>
          ) : friends.length > 0 ? (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
              {friends.sort((a, b) => {
                if (a.status === 'pending' && b.status !== 'pending') return -1;
                if (b.status === 'pending' && a.status !== 'pending') return 1;
                return 0;
              }).map(renderFriendCard)}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center text-zinc-400 dark:text-zinc-500 py-8 bg-white/50 dark:bg-zinc-900/50 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
              Nie masz jeszcze znajomych na liście.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
