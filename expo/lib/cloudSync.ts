import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const SUMMIT_STORAGE_KEY = 'summit_records';
const CUSTOM_MOUNTAINS_KEY = 'custom_mountains';

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export async function debouncedCloudPush() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [summitsRaw, mountainsRaw] = await Promise.all([
        AsyncStorage.getItem(SUMMIT_STORAGE_KEY),
        AsyncStorage.getItem(CUSTOM_MOUNTAINS_KEY),
      ]);

      const summits = summitsRaw ? JSON.parse(summitsRaw) : [];
      const customMountains = mountainsRaw ? JSON.parse(mountainsRaw) : [];

      await supabase
        .from('user_data')
        .upsert({
          user_id: session.user.id,
          summits,
          custom_mountains: customMountains,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      console.log('[CloudSync] Auto-pushed to cloud');
    } catch (error) {
      console.log('[CloudSync] Auto-push failed:', error);
    }
  }, 2000);
}
