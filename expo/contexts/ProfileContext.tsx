import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ONBOARDING_KEY_PREFIX, validateScreenname } from '@/constants/profile';

export interface UserProfile {
  screenname: string | null;
  avatarUrl: string | null;
  ageRange: string | null;
  gender: string | null;
}

interface ProfileRow {
  screenname: string | null;
  avatar_url: string | null;
  age_range: string | null;
  gender: string | null;
}

export const [ProfileProvider, useProfile] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user, isDemoMode } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(false);

  const userId = user?.id ?? null;

  // Load profile from Supabase when user changes
  const loadProfile = useCallback(async (uid: string) => {
    if (!supabaseConfigured || isDemoMode) {
      setIsLoading(false);
      setProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('screenname, avatar_url, age_range, gender')
        .eq('user_id', uid)
        .maybeSingle();

      if (error) {
        console.log('[Profile] Load error:', error.message);
        setIsLoading(false);
        return;
      }

      if (data) {
        const row = data as ProfileRow;
        const loaded: UserProfile = {
          screenname: row.screenname,
          avatarUrl: row.avatar_url,
          ageRange: row.age_range,
          gender: row.gender,
        };
        setProfile(loaded);

        // Check if onboarding was completed
        const onboarded = await AsyncStorage.getItem(ONBOARDING_KEY_PREFIX + uid);
        setNeedsOnboarding(!onboarded);
      } else {
        // No profile row yet — needs onboarding
        setProfile(null);
        setNeedsOnboarding(true);
      }
    } catch (e) {
      console.log('[Profile] Load failed:', e);
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    if (userId) {
      void loadProfile(userId);
    } else {
      setProfile(null);
      setNeedsOnboarding(false);
      setIsLoading(false);
    }
  }, [userId, loadProfile]);

  /**
   * Check if a screenname is available (not taken by another user).
   * Returns true if available, false if taken.
   */
  const checkScreennameAvailable = useCallback(async (raw: string): Promise<boolean> => {
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed) return false;

    if (!supabaseConfigured || isDemoMode) return true;

    try {
      const { data, error } = await supabase.rpc('check_screenname_available', {
        p_screenname: trimmed,
      });

      if (error) {
        console.log('[Profile] Screenname check error:', error.message);
        return true; // Don't block on error
      }

      return data === true;
    } catch (e) {
      console.log('[Profile] Screenname check failed:', e);
      return true;
    }
  }, [isDemoMode]);

  /**
   * Save or update the user's profile. Also marks onboarding as complete.
   */
  const saveProfile = useCallback(async (updates: {
    screenname?: string | null;
    avatarUrl?: string | null;
    ageRange?: string | null;
    gender?: string | null;
  }): Promise<{ error: string | null }> => {
    if (!userId) return { error: 'Not signed in' };

    // Validate screenname if provided
    if (updates.screenname !== undefined) {
      const trimmed = updates.screenname?.trim().toLowerCase() ?? null;
      if (trimmed) {
        const validationError = validateScreenname(trimmed);
        if (validationError) return { error: validationError };

        // Check availability (only if different from current)
        if (profile?.screenname !== trimmed) {
          const available = await checkScreennameAvailable(trimmed);
          if (!available) return { error: 'That screenname is taken' };
        }
      }
      updates = { ...updates, screenname: trimmed };
    }

    // Demo mode — store locally only
    if (!supabaseConfigured || isDemoMode) {
      const newProfile: UserProfile = {
        screenname: updates.screenname !== undefined ? updates.screenname : profile?.screenname ?? null,
        avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : profile?.avatarUrl ?? null,
        ageRange: updates.ageRange !== undefined ? updates.ageRange : profile?.ageRange ?? null,
        gender: updates.gender !== undefined ? updates.gender : profile?.gender ?? null,
      };
      setProfile(newProfile);
      await AsyncStorage.setItem(ONBOARDING_KEY_PREFIX + userId, 'true');
      setNeedsOnboarding(false);
      return { error: null };
    }

    try {
      const row: Record<string, string | null> = {
        user_id: userId,
      };
      if (updates.screenname !== undefined) row.screenname = updates.screenname;
      if (updates.avatarUrl !== undefined) row.avatar_url = updates.avatarUrl;
      if (updates.ageRange !== undefined) row.age_range = updates.ageRange;
      if (updates.gender !== undefined) row.gender = updates.gender;

      const { error } = await supabase
        .from('profiles')
        .upsert(row, { onConflict: 'user_id' });

      if (error) {
        console.log('[Profile] Save error:', error.message);
        if (error.code === '23505') {
          return { error: 'That screenname is taken' };
        }
        return { error: error.message };
      }

      // Update local state
      const newProfile: UserProfile = {
        screenname: updates.screenname !== undefined ? updates.screenname : profile?.screenname ?? null,
        avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : profile?.avatarUrl ?? null,
        ageRange: updates.ageRange !== undefined ? updates.ageRange : profile?.ageRange ?? null,
        gender: updates.gender !== undefined ? updates.gender : profile?.gender ?? null,
      };
      setProfile(newProfile);

      // Mark onboarding complete
      await AsyncStorage.setItem(ONBOARDING_KEY_PREFIX + userId, 'true');
      setNeedsOnboarding(false);

      // Invalidate query cache
      void queryClient.invalidateQueries({ queryKey: ['profile'] });

      return { error: null };
    } catch (e) {
      console.log('[Profile] Save failed:', e);
      return { error: 'Failed to save profile' };
    }
  }, [userId, profile, isDemoMode, checkScreennameAvailable, queryClient]);

  /**
   * Mark onboarding as skipped (user chose "Skip — stay private").
   * No profile row is created — user stays private/invisible.
   */
  const skipOnboarding = useCallback(async () => {
    if (!userId) return;
    await AsyncStorage.setItem(ONBOARDING_KEY_PREFIX + userId, 'true');
    setNeedsOnboarding(false);
  }, [userId]);

  /**
   * Delete the user's profile row (used during account deletion).
   */
  const deleteProfile = useCallback(async () => {
    if (!userId || !supabaseConfigured || isDemoMode) return;
    try {
      await supabase.from('profiles').delete().eq('user_id', userId);
      // Also try to remove avatar from storage
      await supabase.storage.from('avatars').remove([`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.jpeg`]);
    } catch (e) {
      console.log('[Profile] Delete failed:', e);
    }
    setProfile(null);
    await AsyncStorage.removeItem(ONBOARDING_KEY_PREFIX + userId);
  }, [userId, isDemoMode]);

  const isDiscoverable = useMemo(() => {
    return !!(profile?.screenname && profile.screenname.length > 0);
  }, [profile]);

  return useMemo(() => ({
    profile,
    isLoading,
    needsOnboarding,
    isDiscoverable,
    saveProfile,
    skipOnboarding,
    deleteProfile,
    checkScreennameAvailable,
    reloadProfile: () => userId ? loadProfile(userId) : Promise.resolve(),
  }), [profile, isLoading, needsOnboarding, isDiscoverable, saveProfile, skipOnboarding, deleteProfile, checkScreennameAvailable, userId, loadProfile]);
});
