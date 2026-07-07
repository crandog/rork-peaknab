import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const SUMMIT_STORAGE_KEY = 'summit_records';
const CUSTOM_MOUNTAINS_KEY = 'custom_mountains';

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

// Tracks the updated_at of the most recent push from THIS device. The realtime
// listener compares incoming payload.updated_at against this to skip echoing our
// own write back into local state (which would be redundant and could loop).
let lastPushedUpdatedAt: string | null = null;

export function getLastPushedUpdatedAt(): string | null {
  return lastPushedUpdatedAt;
}

export function clearLastPushedUpdatedAt(): void {
  lastPushedUpdatedAt = null;
}

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

      const updatedAt = new Date().toISOString();
      // Record the timestamp BEFORE the upsert so the realtime listener can
      // recognise this row's UPDATE as our own and skip it.
      lastPushedUpdatedAt = updatedAt;

      await supabase
        .from('user_data')
        .upsert({
          user_id: session.user.id,
          summits,
          custom_mountains: customMountains,
          updated_at: updatedAt,
        }, { onConflict: 'user_id' });

      console.log('[CloudSync] Auto-pushed to cloud');
    } catch (error) {
      console.log('[CloudSync] Auto-push failed:', error);
    }
  }, 2000);
}
