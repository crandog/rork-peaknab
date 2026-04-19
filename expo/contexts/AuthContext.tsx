import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import type { Session, User } from '@supabase/supabase-js';
import type { SummitRecord } from '@/contexts/SummitContext';
import type { Mountain } from '@/constants/mountains';

const SUMMIT_STORAGE_KEY = 'summit_records';
const CUSTOM_MOUNTAINS_KEY = 'custom_mountains';
const DEMO_SESSION_KEY = 'demo_session';

const DEMO_EMAIL = 'appreview@peaknab.com';
const DEMO_PASSWORD = 'ReviewPeakNab2026!';
const DEMO_USER_ID = 'demo-review-user-001';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface DemoUser {
  id: string;
  email: string;
  app_metadata: Record<string, unknown>;
  user_metadata: { full_name: string };
  aud: string;
  created_at: string;
}

function createDemoUser(): DemoUser {
  return {
    id: DEMO_USER_ID,
    email: DEMO_EMAIL,
    app_metadata: {},
    user_metadata: { full_name: 'App Reviewer' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };
}

function createDemoSession(demoUser: DemoUser) {
  return {
    access_token: 'demo-access-token',
    refresh_token: 'demo-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: demoUser,
  };
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  useEffect(() => {
    const checkDemoSession = async () => {
      try {
        const demoSession = await AsyncStorage.getItem(DEMO_SESSION_KEY);
        if (demoSession) {
          const parsed = JSON.parse(demoSession);
          console.log('[Auth] Restored demo session');
          setIsDemoMode(true);
          setUser(parsed.user as User);
          setSession(parsed as Session);
          setIsLoading(false);
          return true;
        }
      } catch (e) {
        console.log('[Auth] Error checking demo session:', e);
      }
      return false;
    };

    void checkDemoSession().then((isDemo) => {
      if (isDemo) return;

      if (!supabaseConfigured) {
        console.log('[Auth] Supabase not configured, running in offline mode');
        setIsLoading(false);
        return;
      }

      void supabase.auth.getSession().then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        setIsLoading(false);
        console.log('[Auth] Initial session:', s ? 'logged in' : 'anonymous');
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
        console.log('[Auth] State changed:', _event);
        setSession(s);
        setUser(s?.user ?? null);
      });

      return () => subscription.unsubscribe();
    });
  }, []);

  const signUpMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      console.log('[Auth] Signed up successfully');
      if (data.session) {
        await migrateLocalDataToCloud(data.session.user.id);
      }
    },
    onError: (error: Error) => {
      console.log('[Auth] Sign up error:', error.message);
      Alert.alert('Sign Up Failed', error.message);
    },
  });

  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      if (email.toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
        console.log('[Auth] Demo login detected');
        const demoUser = createDemoUser();
        const demoSession = createDemoSession(demoUser);
        await AsyncStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoSession));
        setIsDemoMode(true);
        setUser(demoUser as unknown as User);
        setSession(demoSession as unknown as Session);
        return { user: demoUser, session: demoSession } as any;
      }

      if (!supabaseConfigured) {
        throw new Error('Authentication is not configured. Please try the demo account.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      if (isDemoMode) {
        console.log('[Auth] Demo sign in complete');
        return;
      }
      console.log('[Auth] Signed in successfully');
      await syncDataFromCloud(data.user.id);
    },
    onError: (error: Error) => {
      console.log('[Auth] Sign in error:', error.message);
      Alert.alert('Sign In Failed', error.message);
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      if (isDemoMode) {
        await AsyncStorage.removeItem(DEMO_SESSION_KEY);
        setIsDemoMode(false);
        setUser(null);
        setSession(null);
        return;
      }
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      console.log('[Auth] Signed out');
      setSyncStatus('idle');
    },
    onError: (error: Error) => {
      console.log('[Auth] Sign out error:', error.message);
      Alert.alert('Sign Out Failed', error.message);
    },
  });

  const migrateLocalDataToCloud = useCallback(async (userId: string) => {
    try {
      setSyncStatus('syncing');
      console.log('[Auth] Migrating local data to cloud for user:', userId);

      const [summitsRaw, mountainsRaw] = await Promise.all([
        AsyncStorage.getItem(SUMMIT_STORAGE_KEY),
        AsyncStorage.getItem(CUSTOM_MOUNTAINS_KEY),
      ]);

      const localSummits: SummitRecord[] = summitsRaw ? JSON.parse(summitsRaw) : [];
      const localMountains: Mountain[] = mountainsRaw ? JSON.parse(mountainsRaw) : [];

      const { data: existing } = await supabase
        .from('user_data')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existing) {
        const cloudSummits: SummitRecord[] = existing.summits ?? [];
        const cloudMountains: Mountain[] = existing.custom_mountains ?? [];

        const mergedSummits = mergeSummits(localSummits, cloudSummits);
        const mergedMountains = mergeMountains(localMountains, cloudMountains);

        await supabase
          .from('user_data')
          .update({
            summits: mergedSummits,
            custom_mountains: mergedMountains,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        await AsyncStorage.setItem(SUMMIT_STORAGE_KEY, JSON.stringify(mergedSummits));
        await AsyncStorage.setItem(CUSTOM_MOUNTAINS_KEY, JSON.stringify(mergedMountains));

        queryClient.setQueryData(['summits'], mergedSummits);
        queryClient.setQueryData(['custom_mountains'], mergedMountains);

        console.log('[Auth] Merged and synced data. Summits:', mergedSummits.length, 'Mountains:', mergedMountains.length);
      } else {
        await supabase
          .from('user_data')
          .insert({
            user_id: userId,
            summits: localSummits,
            custom_mountains: localMountains,
            updated_at: new Date().toISOString(),
          });

        console.log('[Auth] Initial upload. Summits:', localSummits.length, 'Mountains:', localMountains.length);
      }

      setSyncStatus('synced');
    } catch (error) {
      console.log('[Auth] Migration error:', error);
      setSyncStatus('error');
    }
  }, [queryClient]);

  const syncDataFromCloud = useCallback(async (userId: string) => {
    try {
      setSyncStatus('syncing');
      console.log('[Auth] Syncing data from cloud for user:', userId);

      const { data: cloudData } = await supabase
        .from('user_data')
        .select('*')
        .eq('user_id', userId)
        .single();

      const [summitsRaw, mountainsRaw] = await Promise.all([
        AsyncStorage.getItem(SUMMIT_STORAGE_KEY),
        AsyncStorage.getItem(CUSTOM_MOUNTAINS_KEY),
      ]);

      const localSummits: SummitRecord[] = summitsRaw ? JSON.parse(summitsRaw) : [];
      const localMountains: Mountain[] = mountainsRaw ? JSON.parse(mountainsRaw) : [];

      if (cloudData) {
        const cloudSummits: SummitRecord[] = cloudData.summits ?? [];
        const cloudMountains: Mountain[] = cloudData.custom_mountains ?? [];

        const mergedSummits = mergeSummits(localSummits, cloudSummits);
        const mergedMountains = mergeMountains(localMountains, cloudMountains);

        await AsyncStorage.setItem(SUMMIT_STORAGE_KEY, JSON.stringify(mergedSummits));
        await AsyncStorage.setItem(CUSTOM_MOUNTAINS_KEY, JSON.stringify(mergedMountains));

        await supabase
          .from('user_data')
          .update({
            summits: mergedSummits,
            custom_mountains: mergedMountains,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        queryClient.setQueryData(['summits'], mergedSummits);
        queryClient.setQueryData(['custom_mountains'], mergedMountains);

        console.log('[Auth] Cloud sync complete. Summits:', mergedSummits.length);
      } else {
        await supabase
          .from('user_data')
          .insert({
            user_id: userId,
            summits: localSummits,
            custom_mountains: localMountains,
            updated_at: new Date().toISOString(),
          });

        console.log('[Auth] No cloud data found, uploaded local data');
      }

      setSyncStatus('synced');
    } catch (error) {
      console.log('[Auth] Sync error:', error);
      setSyncStatus('error');
    }
  }, [queryClient]);

  const pushToCloud = useCallback(async () => {
    if (!user) return;
    try {
      const [summitsRaw, mountainsRaw] = await Promise.all([
        AsyncStorage.getItem(SUMMIT_STORAGE_KEY),
        AsyncStorage.getItem(CUSTOM_MOUNTAINS_KEY),
      ]);

      const summits = summitsRaw ? JSON.parse(summitsRaw) : [];
      const customMountains = mountainsRaw ? JSON.parse(mountainsRaw) : [];

      await supabase
        .from('user_data')
        .upsert({
          user_id: user.id,
          summits,
          custom_mountains: customMountains,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      console.log('[Auth] Pushed data to cloud');
    } catch (error) {
      console.log('[Auth] Push error:', error);
    }
  }, [user]);

  const signUp = useCallback((email: string, password: string) => {
    signUpMutation.mutate({ email, password });
  }, [signUpMutation]);

  const signIn = useCallback((email: string, password: string) => {
    signInMutation.mutate({ email, password });
  }, [signInMutation]);

  const signOut = useCallback(() => {
    signOutMutation.mutate();
  }, [signOutMutation]);

  const signInWithAppleMutation = useMutation({
    mutationFn: async () => {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      console.log('[Auth] Apple sign in successful');
      if (data.session) {
        await syncDataFromCloud(data.session.user.id);
      }
    },
    onError: (error: Error) => {
      if ((error as any).code === 'ERR_REQUEST_CANCELED') {
        console.log('[Auth] Apple sign in cancelled');
        return;
      }
      console.log('[Auth] Apple sign in error:', error.message);
      Alert.alert('Apple Sign In Failed', error.message);
    },
  });

  const signInWithGoogleMutation = useMutation({
    mutationFn: async () => {
      const redirectUrl = AuthSession.makeRedirectUri();
      console.log('[Auth] Google OAuth redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned');

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl,
      );

      if (result.type !== 'success') {
        throw new Error('AUTH_CANCELLED');
      }

      const url = result.url;
      const params = new URL(url);
      const accessToken = params.searchParams.get('access_token') || params.hash?.match(/access_token=([^&]*)/)?.[1];
      const refreshToken = params.searchParams.get('refresh_token') || params.hash?.match(/refresh_token=([^&]*)/)?.[1];

      if (!accessToken || !refreshToken) {
        const fragmentParams = new URLSearchParams(url.split('#')[1] || '');
        const fragAccess = fragmentParams.get('access_token');
        const fragRefresh = fragmentParams.get('refresh_token');

        if (!fragAccess || !fragRefresh) {
          throw new Error('Could not extract tokens from callback');
        }

        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: fragAccess,
          refresh_token: fragRefresh,
        });
        if (sessionError) throw sessionError;
        return sessionData;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) throw sessionError;
      return sessionData;
    },
    onSuccess: async (data) => {
      console.log('[Auth] Google sign in successful');
      if (data.session) {
        await syncDataFromCloud(data.session.user.id);
      }
    },
    onError: (error: Error) => {
      if (error.message === 'AUTH_CANCELLED') {
        console.log('[Auth] Google sign in cancelled');
        return;
      }
      console.log('[Auth] Google sign in error:', error.message);
      Alert.alert('Google Sign In Failed', error.message);
    },
  });

  const signInWithApple = useCallback(() => {
    signInWithAppleMutation.mutate();
  }, [signInWithAppleMutation]);

  const signInWithGoogle = useCallback(() => {
    signInWithGoogleMutation.mutate();
  }, [signInWithGoogleMutation]);

  const isAuthenticated = !!session || isDemoMode;

  return useMemo(() => ({
    user,
    session,
    isAuthenticated,
    isDemoMode,
    isLoading,
    syncStatus,
    signUp,
    signIn,
    signOut,
    pushToCloud,
    isSigningUp: signUpMutation.isPending,
    isSigningIn: signInMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    signInWithApple,
    signInWithGoogle,
    isSigningInWithApple: signInWithAppleMutation.isPending,
    isSigningInWithGoogle: signInWithGoogleMutation.isPending,
  }), [user, session, isAuthenticated, isDemoMode, isLoading, syncStatus, signUp, signIn, signOut, pushToCloud, signUpMutation.isPending, signInMutation.isPending, signOutMutation.isPending, signInWithApple, signInWithGoogle, signInWithAppleMutation.isPending, signInWithGoogleMutation.isPending]);
});

function mergeSummits(local: SummitRecord[], cloud: SummitRecord[]): SummitRecord[] {
  const map = new Map<string, SummitRecord>();
  for (const record of cloud) {
    map.set(record.mountainId, record);
  }
  for (const record of local) {
    const existing = map.get(record.mountainId);
    if (!existing || new Date(record.createdAt) > new Date(existing.createdAt)) {
      map.set(record.mountainId, record);
    }
  }
  return Array.from(map.values());
}

function mergeMountains(local: Mountain[], cloud: Mountain[]): Mountain[] {
  const map = new Map<string, Mountain>();
  for (const m of cloud) {
    map.set(m.id, m);
  }
  for (const m of local) {
    if (!map.has(m.id)) {
      map.set(m.id, m);
    }
  }
  return Array.from(map.values());
}
