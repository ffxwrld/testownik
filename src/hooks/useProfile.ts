import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { UserProfile, CreateProfileInput } from '../models/social';
import { CreateProfileSchema } from '../lib/validation';

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    fetchProfile(user.id);
  }, [user]);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Record not found - user needs to create profile
          setProfile(null);
        } else {
          throw error;
        }
      } else {
        setProfile(data as UserProfile);
      }
    } catch (err: any) {
      console.error('Failed to fetch profile', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (input: CreateProfileInput) => {
    if (!user) throw new Error('Not authenticated');
    
    // Zod validation at boundary
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
      if (insertError.code === '23505') { // Unique violation
        throw new Error('Ta nazwa użytkownika jest już zajęta.');
      }
      throw insertError;
    }

    setProfile(data as UserProfile);
    return data;
  };

  return {
    profile,
    loading,
    error,
    createProfile,
    refreshProfile: () => user && fetchProfile(user.id)
  };
}
