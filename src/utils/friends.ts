import { supabase } from '../lib/supabase';
import { UserProfile } from '../models/social';

export async function searchUsers(usernameQuery: string): Promise<UserProfile[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', `%${usernameQuery}%`)
    .neq('id', session.user.id)
    .limit(10);

  if (error) throw error;
  return data as UserProfile[];
}

export async function sendFriendRequest(addresseeId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('friendships')
    .insert({
      requester_id: session.user.id,
      addressee_id: addresseeId,
    });

  if (error) {
    if (error.code === '23505') {
      throw new Error('Zaproszenie zostało już wysłane lub jesteście znajomymi.');
    }
    throw error;
  }
}

export async function respondToRequest(friendshipId: string, accept: boolean): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: accept ? 'accepted' : 'declined' })
    .eq('id', friendshipId);

  if (error) throw error;
}

export async function removeFriend(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId);

  if (error) throw error;
}

export interface FriendData {
  friendshipId: string;
  status: 'pending' | 'accepted' | 'declined';
  isRequester: boolean;
  profile: UserProfile;
}

export async function getFriends(): Promise<FriendData[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const userId = session.user.id;

  // We need to fetch both sides: where we are the requester OR the addressee
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      status,
      requester_id,
      addressee_id,
      requester:profiles!requester_id(*),
      addressee:profiles!addressee_id(*)
    `)
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (error) throw error;

  return data.map((row: any) => {
    const isRequester = row.requester_id === userId;
    const profile = isRequester ? row.addressee : row.requester;
    
    return {
      friendshipId: row.id,
      status: row.status,
      isRequester,
      profile
    };
  });
}
