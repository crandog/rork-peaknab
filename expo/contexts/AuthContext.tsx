import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Alert, Platform, AppState, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import {
  reconcile,
  flushPendingWrites,
  applyRealtimeUpdate,
  clearLastPushedUpdatedAt,
  hasPendingWrites,
} from '@/lib/cloudSync';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import type { Session, User } from '@supabase/supabase-js';
import type { SummitRecord } from '@/contexts/SummitContext';
import type { Mountain } from '@/constants/mountains';

const SUMMIT_STORAGE_KEY = 'summit_records';
const CUSTOM_MOUNTAINS_KEY = 'custom_mountains';
const DEMO_SESSION_KEY = 'demo_session';
const SESSION_BACKUP_KEY = 'peaknab_session_backup';

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
  const reconcilingRef = useRef(false);

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

        // Persist session for offline use. AsyncStorage already stores it via
        // the supabase-js storage adapter, but we keep an explicit backup so
        // we can detect "was logged in but session expired" separately.
        if (s) {
          void AsyncStorage.setItem(SESSION_BACKUP_KEY, JSON.stringify(s)).then(() => {
            // If there are pending writes from a previous offline session, flush now.
            void hasPendingWrites().then((pending) => {
              if (pending) {
                console.log('[Auth] Pending writes detected on cold start, flushing');
                void flushPendingWrites(s.user.id, queryClient).catch((e) =>
                  console.log('[Auth] Cold-start flush failed:', e),
                );
              }
            });
          });
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
        console.log('[Auth] State changed:', _event);
        setSession(s);
        setUser(s?.user ?? null);
        if (s) {
          void AsyncStorage.setItem(SESSION_BACKUP_KEY, JSON.stringify(s));
        } else {
          void AsyncStorage.removeItem(SESSION_BACKUP_KEY);
        }
      });

      return () => subscription.unsubscribe();
    });
  }, []);

  // Live cross-device sync: subscribe to realtime UPDATEs on this user's
  // user_data row. When another device pushes, merge the incoming summits /
  // custom_mountains into AsyncStorage + React Query cache so the UI updates
  // live without needing sign out/in. Demo mode stays local-only. An echo
  // guard (lastPushedUpdatedAt) prevents re-applying our own write.
  useEffect(() => {
    if (!user || isDemoMode || !supabaseConfigured) return;
    const userId = user.id;

    const channel = supabase
      .channel(`user_data_sync:${userId}`)
      .on<{
        summits: SummitRecord[];
        custom_mountains: Mountain[];
        updated_at: string;
      }>(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_data', filter: `user_id=eq.${userId}` },
        async (payload) => {
          try {
            const newRow = payload.new;
            console.log('[Auth] Realtime user_data update, updated_at:', newRow.updated_at);

            const cloudSummits: SummitRecord[] = newRow.summits ?? [];
            const cloudMountains: Mountain[] = newRow.custom_mountains ?? [];

            // Use the shared realtime merge helper (handles echo guard, tombstones,
            // field-aware union, AsyncStorage + cache writes).
            await applyRealtimeUpdate(
              userId,
              cloudSummits,
              cloudMountains,
              newRow.updated_at,
              queryClient,
            );
          } catch (error) {
            console.log('[Auth] Realtime handler error:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Auth] Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isDemoMode, supabaseConfigured, queryClient]);

  const signUpMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      console.log('[Auth] Signed up successfully');
      if (data.session) {
        await doReconcile(data.session.user.id);
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
      await doReconcile(data.user.id);
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
      clearLastPushedUpdatedAt();
    },
    onError: (error: Error) => {
      console.log('[Auth] Sign out error:', error.message);
      Alert.alert('Sign Out Failed', error.message);
    },
  });

  const doReconcile = useCallback(async (userId: string) => {
    if (reconcilingRef.current) {
      console.log('[Auth] Reconcile already in progress, skipping');
      return;
    }
    reconcilingRef.current = true;
    setSyncStatus('syncing');
    try {
      const result = await reconcile(userId, queryClient);
      setSyncStatus('synced');
      console.log('[Auth] Reconcile done. Summits:', result.summits.length, 'Tombstones:', result.tombstonesApplied);
    } catch (error) {
      setSyncStatus('error');
      // Surface the error — no silent catch. Keep it non-blocking (console +
      // status) so the user can retry via the profile screen.
      console.warn('[Auth] Reconcile failed:', error);
    } finally {
      reconcilingRef.current = false;
    }
  }, [queryClient]);

  // AppState listener: when the app returns to the foreground, flush any pending
  // writes (from offline edits or a failed push) so cross-device sync stays current.
  useEffect(() => {
    if (!user || isDemoMode || !supabaseConfigured) return;
    const userId = user.id;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        console.log('[Auth] App became active, flushing pending writes');
        void flushPendingWrites(userId, queryClient)
          .then(() => {
            // After a flush, also reconcile to pull any changes from other devices.
            void doReconcile(userId);
          })
          .catch((e) => console.log('[Auth] App-focus flush failed:', e));
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [user, isDemoMode, supabaseConfigured, queryClient, doReconcile]);

  // Keep pushToCloud as a thin wrapper around reconcile so the profile screen
  // "Sync now" button keeps working without UI changes.
  const pushToCloud = useCallback(async () => {
    if (!user) return;
    await doReconcile(user.id);
  }, [user, doReconcile]);

  const signUp = useCallback((email: string, password: string) => {
    signUpMutation.mutate({ email, password });
  }, [signUpMutation]);

  const signIn = useCallback((email: string, password: string) => {
    signInMutation.mutate({ email, password });
  }, [signInMutation]);

  const signOut = useCallback(() => {
    signOutMutation.mutate();
  }, [signOutMutation]);

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      console.log('[Auth] Deleting account...');

      if (isDemoMode) {
        await AsyncStorage.multiRemove([SUMMIT_STORAGE_KEY, CUSTOM_MOUNTAINS_KEY, DEMO_SESSION_KEY]);
        setIsDemoMode(false);
        setUser(null);
        setSession(null);
        queryClient.setQueryData(['summits'], []);
        queryClient.setQueryData(['custom_mountains'], []);
        return;
      }

      const currentUser = user;
      if (!currentUser) throw new Error('No user to delete');

      // The SECURITY DEFINER RPC deletes both user_data and auth.users for
      // auth.uid() — no client-supplied user id. Attempt a client-side
      // user_data delete first as a best-effort fallback if the RPC fails.
      try {
        await supabase.from('user_data').delete().eq('user_id', currentUser.id);
        console.log('[Auth] Deleted user_data row (client-side fallback)');
      } catch (e) {
        console.log('[Auth] Error deleting user_data (will rely on RPC):', e);
      }

      const { error: rpcError } = await supabase.rpc('delete_user');
      if (rpcError) {
        console.log('[Auth] delete_user RPC error:', rpcError.message);
        throw new Error(
          'Could not fully delete your account on the server. Your data has been erased, but please contact support@peaknab.com to complete deletion.'
        );
      }
      console.log('[Auth] Auth user deleted via RPC');

      await AsyncStorage.multiRemove([SUMMIT_STORAGE_KEY, CUSTOM_MOUNTAINS_KEY]);
      // Clean up profile row + avatar
      try {
        await supabase.from('profiles').delete().eq('user_id', currentUser.id);
        console.log('[Auth] Deleted profile row (client-side fallback)');
      } catch (e) {
        console.log('[Auth] Error deleting profile (will rely on CASCADE):', e);
      }
      // Remove onboarding flag
      try {
        await AsyncStorage.removeItem('peaknab_onboarded_' + currentUser.id);
      } catch {}
      // The auth user no longer exists server-side, so signOut() may throw —
      // wrap it so local cleanup always runs.
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.log('[Auth] signOut after delete (expected, user already gone):', e);
      }
      clearLastPushedUpdatedAt();
      setUser(null);
      setSession(null);
      queryClient.setQueryData(['summits'], []);
      queryClient.setQueryData(['custom_mountains'], []);
    },
    onSuccess: () => {
      console.log('[Auth] Account deleted successfully');
      setSyncStatus('idle');
      Alert.alert('Account Deleted', 'Your account and all associated data have been permanently deleted.');
    },
    onError: (error: Error) => {
      console.log('[Auth] Delete account error:', error.message);
      Alert.alert('Account Deletion', error.message);
    },
  });

  const deleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account?',
      'This will permanently delete your account and all your summit data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'All your summits, custom mountains, and account data will be erased forever.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: () => deleteAccountMutation.mutate(),
                },
              ]
            );
          },
        },
      ]
    );
  }, [deleteAccountMutation]);

  const signInWithAppleMutation = useMutation({
    mutationFn: async () => {
      // Apple Sign-In nonce flow: generate a raw nonce, hash it (SHA-256, hex),
      // send the HASH to Apple so it is embedded in the JWT `nonce` claim, and
      // send the RAW nonce to Supabase so it can hash it and verify the match.
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
        { encoding: Crypto.CryptoEncoding.HEX },
      );
      console.log('[Auth] Apple sign in: nonce generated, hashed length:', hashedNonce.length);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      console.log('[Auth] Apple sign in successful');
      if (data.session) {
        await doReconcile(data.session.user.id);
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
      // In the Rork web preview (and web builds generally), exp:// URLs cannot
      // be intercepted by the browser — Supabase would fall back to the Site
      // URL and the app would never receive the auth code. Use the current
      // https origin instead so the browser popup can redirect back to us.
      const isWeb = Platform.OS === 'web' && typeof window !== 'undefined' && !!window.location?.origin;
      const redirectUrl = isWeb
        ? window.location.origin
        : AuthSession.makeRedirectUri({ path: 'auth/callback' });
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

      console.log('[Auth] Google OAuth result type:', result.type);
      if (result.type === 'success') {
        console.log('[Auth] Google OAuth result url:', result.url);
      }

      if (result.type !== 'success') {
        throw new Error('AUTH_CANCELLED');
      }

      const url = result.url;

      // Native/Expo Go path: parse the callback with expo-auth-session's
      // QueryParams helper, which handles exp:// URLs reliably on Hermes.
      if (!isWeb) {
        const { params, errorCode } = QueryParams.getQueryParams(url);
        console.log('[Auth] Google OAuth parsed params:', JSON.stringify(params), 'errorCode:', errorCode);

        if (errorCode) {
          throw new Error(`OAuth error: ${errorCode}`);
        }

        // PKCE flow: callback contains ?code=... — exchange it for a session.
        if (params.code) {
          console.log('[Auth] Google OAuth exchanging code for session, code length:', params.code.length);
          const { data: sessionData, error: sessionError } =
            await supabase.auth.exchangeCodeForSession(params.code);
          if (sessionError) {
            console.log('[Auth] exchangeCodeForSession error:', JSON.stringify({
              message: sessionError.message,
              name: sessionError.name,
              status: (sessionError as any).status,
              code: (sessionError as any).code,
              details: (sessionError as any).details,
            }));
            throw sessionError;
          }
          console.log('[Auth] exchangeCodeForSession success, has session:', !!sessionData?.session);
          return sessionData;
        }

        // Implicit flow fallback: callback may contain access_token/refresh_token.
        if (params.access_token && params.refresh_token) {
          console.log('[Auth] Google OAuth implicit flow, setSession');
          const { data: sessionData, error: sessionError } =
            await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });
          if (sessionError) {
            console.log('[Auth] setSession error:', JSON.stringify({
              message: sessionError.message,
              name: sessionError.name,
              status: (sessionError as any).status,
            }));
            throw sessionError;
          }
          return sessionData;
        }

        // No code and no tokens — include the raw URL so we can see what
        // actually came back instead of guessing.
        console.log('[Auth] No tokens in callback. Raw url:', url);
        throw new Error(`Could not extract tokens from callback. URL: ${url}`);
      }

      // Web path: new URL() is reliable for https origins.
      const webParams = new URL(url);
      const webCode = webParams.searchParams.get('code');
      if (webCode) {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.exchangeCodeForSession(url);
        if (sessionError) throw sessionError;
        return sessionData;
      }

      const webAccessToken =
        webParams.searchParams.get('access_token') ||
        webParams.hash?.match(/access_token=([^&]*)/)?.[1];
      const webRefreshToken =
        webParams.searchParams.get('refresh_token') ||
        webParams.hash?.match(/refresh_token=([^&]*)/)?.[1];
      if (webAccessToken && webRefreshToken) {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.setSession({
            access_token: webAccessToken,
            refresh_token: webRefreshToken,
          });
        if (sessionError) throw sessionError;
        return sessionData;
      }

      throw new Error('Could not extract tokens from callback');
    },
    onSuccess: async (data) => {
      console.log('[Auth] Google sign in successful');
      if (data.session) {
        await doReconcile(data.session.user.id);
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
    deleteAccount,
    pushToCloud,
    isSigningUp: signUpMutation.isPending,
    isSigningIn: signInMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    isDeletingAccount: deleteAccountMutation.isPending,
    signInWithApple,
    signInWithGoogle,
    isSigningInWithApple: signInWithAppleMutation.isPending,
    isSigningInWithGoogle: signInWithGoogleMutation.isPending,
  }), [user, session, isAuthenticated, isDemoMode, isLoading, syncStatus, signUp, signIn, signOut, deleteAccount, pushToCloud, signUpMutation.isPending, signInMutation.isPending, signOutMutation.isPending, deleteAccountMutation.isPending, signInWithApple, signInWithGoogle, signInWithAppleMutation.isPending, signInWithGoogleMutation.isPending]);
});


