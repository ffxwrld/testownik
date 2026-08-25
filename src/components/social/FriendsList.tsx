import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFriends } from '../../hooks/useFriends';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const FriendsList: React.FC<{ onBack: () => void }> = ({ onBack }) => {
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

  const renderFriendCard = (friend: any) => {
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
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
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
              <Button size="sm" variant="primary" onClick={() => respondToRequest(friend.friendshipId, true)}>Akceptuj</Button>
              <Button size="sm" variant="danger" onClick={() => respondToRequest(friend.friendshipId, false)}>Odrzuć</Button>
            </>
          )}
          {isOutgoing && (
            <Button size="sm" variant="danger" onClick={() => removeFriend(friend.friendshipId)}>Anuluj</Button>
          )}
          {friend.status === 'accepted' && (
            <Button size="sm" variant="secondary" onClick={() => removeFriend(friend.friendshipId)}>Usuń</Button>
          )}
        </div>
      </Card>
      </motion.div>
    );
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 text-zinc-900 dark:text-zinc-50 p-6 flex flex-col items-center overflow-y-auto">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Powrót
          </button>
          <h1 className="text-2xl font-bold">Znajomi</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>

        {error && <div className="p-4 mb-4 bg-red-900/50 text-red-400 rounded-lg">{error}</div>}

        <Card className="mb-8 bg-white dark:bg-zinc-900 shadow-sm border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold mb-4">Dodaj znajomego</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Szukaj po nicku..."
              className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              minLength={3}
            />
            <Button type="submit" variant="primary" disabled={searching}>
              Szukaj
            </Button>
          </form>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
              {searchResults.map(user => (
                <div key={user.id} className="flex items-center justify-between p-2 hover:bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
                  <span>{user.username}</span>
                  <Button size="sm" variant="secondary" onClick={() => sendRequest(user.id)}>
                    Zaproś
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div>
          <h2 className="text-lg font-bold mb-4">Twoja lista znajomych</h2>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white dark:bg-zinc-900 shadow-sm rounded-xl"></div>)}
            </div>
          ) : friends.length > 0 ? (
            <div className="space-y-1">
              <AnimatePresence mode="popLayout">
              {friends.sort((a, b) => {
                if (a.status === 'pending' && b.status !== 'pending') return -1;
                if (b.status === 'pending' && a.status !== 'pending') return 1;
                return 0;
              }).map(renderFriendCard)}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center text-zinc-400 dark:text-zinc-500 py-8">
              Nie masz jeszcze znajomych na liście.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
