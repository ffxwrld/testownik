import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Users } from '@phosphor-icons/react';
import { useFriends } from '../../hooks/useFriends';
import { FriendData } from '../../utils/friends';
import { UserProfile } from '../../models/social';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PageHeader } from '../common/PageHeader';

interface FriendsViewProps {
  embedded?: boolean;
}

export const FriendsView: React.FC<FriendsViewProps> = ({ embedded = false }) => {
  const { t } = useTranslation();
  const { friends, loading, error, respondToRequest, removeFriend, searchUsers, sendRequest } = useFriends();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
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
        initial={false}
        exit={{ opacity: 0, scale: 0.95 }}
        className="mb-2.5 block"
      >
        <Card className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-xs text-sm flex-shrink-0" style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }}>
              {initial}
            </div>
            <div>
              <div className="font-bold text-sm text-zinc-900 dark:text-zinc-50">{friend.profile.username}</div>
              {isPending && (
                <div className="text-xs text-amber-500 font-medium">
                  {isIncoming ? t('social.friends.incomingRequest') : t('social.friends.outgoingRequest')}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {isIncoming && (
              <>
                <Button size="sm" variant="primary" onClick={() => respondToRequest(friend.friendshipId, true)}>{t('social.friends.acceptBtn')}</Button>
                <Button size="sm" variant="danger" onClick={() => respondToRequest(friend.friendshipId, false)}>{t('social.friends.rejectBtn')}</Button>
              </>
            )}
            {isOutgoing && (
              <Button size="sm" variant="danger" onClick={() => { removeFriend(friend.friendshipId); toast.success(t('social.friends.canceledToast')); }}>{t('social.friends.cancelBtn')}</Button>
            )}
            {friend.status === 'accepted' && (
              <Button size="sm" variant="secondary" onClick={() => { removeFriend(friend.friendshipId); toast.success(t('social.friends.removedToast')); }}>{t('social.friends.removeBtn')}</Button>
            )}
          </div>
        </Card>
      </motion.div>
    );
  };

  const pendingIncoming = friends.filter(f => f.status === 'pending' && !f.isRequester);

  return (
    <div className={embedded ? "w-full" : "w-full max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8 pb-32 md:pb-12"}>
      <div className="w-full">
        {embedded ? (
          <div className="mb-4">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{t('social.friends.title')}</h1>
            {pendingIncoming.length > 0 && (
              <p className="text-sm text-amber-500 font-medium mt-1">
                {t('social.friends.pendingCount', { count: pendingIncoming.length })}
              </p>
            )}
          </div>
        ) : (
          <PageHeader
            icon={<Users />}
            title={t('social.friends.title')}
            subtitle={
              <div>
                <span>{t('social.friends.subtitle')}</span>
                {pendingIncoming.length > 0 && (
                  <span className="block text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                    {t('social.friends.pendingCount', { count: pendingIncoming.length })}
                  </span>
                )}
              </div>
            }
          />
        )}

        {error && <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-medium">{error}</div>}

        {/* Search / Add Friend */}
        <Card className="mb-8 p-6">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-3">{t('social.friends.addFriend')}</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('social.friends.searchPlaceholder')}
              className="flex-1 min-w-0 px-4 py-2 bg-zinc-50/80 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 rounded-xl text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-sm"
              minLength={3}
            />
            <Button type="submit" variant="primary" disabled={searching}>{searching ? t('social.friends.searching') : t('social.friends.searchBtn')}</Button>
          </form>
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4">
              {searchResults.map(user => (
                <div key={user.id} className="flex items-center justify-between p-2.5 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 rounded-xl font-bold text-sm">
                  <span className="text-zinc-900 dark:text-zinc-100">{user.username}</span>
                  <Button size="sm" variant="secondary" onClick={() => sendRequest(user.id)}>{t('social.friends.addBtn')}</Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Friends List */}
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-4">{t('social.friends.list')}</h2>
          {loading ? (
            <div className="animate-pulse space-y-3" role="status" aria-busy="true" aria-label={t('social.friends.loadingList')}>
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-2xl"></div>)}
            </div>
          ) : friends.length > 0 ? (
            <div className="space-y-2.5">
              <AnimatePresence mode="popLayout">
              {friends.sort((a, b) => {
                if (a.status === 'pending' && b.status !== 'pending') return -1;
                if (b.status === 'pending' && a.status !== 'pending') return 1;
                return 0;
              }).map(renderFriendCard)}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center text-zinc-400 dark:text-zinc-500 py-12 bg-white/40 dark:bg-zinc-900/40 rounded-2xl border-2 border-dashed border-zinc-200/80 dark:border-zinc-800/80 text-sm font-medium">
              {t('social.friends.noFriends')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
