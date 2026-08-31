import useSWR from 'swr';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { UserProfile, CreateProfileInput } from '../models/social';
import { CreateProfileSchema } from '../lib/validation';

export function useProfile() {
  const { user } = useAuth();

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data as UserProfile;
  };

  const {
    data: profile = null,
    error,
    isLoading,
    mutate
  } = useSWR<UserProfile | null>(
    user ? ['profile', user.id] : null,
    ([, userId]) => fetchProfile(userId as string)
  );

  const createProfile = async (input: CreateProfileInput) => {
    if (!user) throw new Error('Not authenticated');
    
    const parsed = CreateProfileSchema.parse(input);

    const { data, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: parsed.username,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        throw new Error('Ta nazwa użytkownika jest już zajęta.');
      }
      throw insertError;
    }

    await mutate(data as UserProfile);
    return data;
  };

  return {
    profile,
    loading: isLoading,
    error: error ? error.message : null,
    createProfile,
    refreshProfile: mutate
  };
}
