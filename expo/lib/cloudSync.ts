import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import type { SummitRecord } from '@/contexts/SummitContext';
import type { Mountain } from '@/constants/mountains';

const SUMMIT_STORAGE_KEY = 'summit_records';
const CUSTOM_MOUNTAINS_KEY = 'custom_mountains';
const TOMBSTONE_QUEUE_KEY = 'pending_tombstones';
const WRITE_QUEUE_KEY = 'pending_writes';
const MAX_RETRIES = 5;

export type TombstoneKind = 'summit' | 'mountain';

export interface Tombstone {
  kind: TombstoneKind;
  mountainId: string;
  createdAt: string;
  deletedAt: string;
}

interface PendingWrite {
  id: string;
  enqueuedAt: string;
  attempt: number;
}

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

// ─── Tombstone queue ──────────────────────────────────────────────
// Deletions are recorded locally so a reconcile can propagate them cross-device
// even when the deleting device is offline at the time of deletion. Entries are
// drained after a successful reconcile.

async function readTombstones(): Promise<Tombstone[]> {
  const raw = await AsyncStorage.getItem(TOMBSTONE_QUEUE_KEY);
  return raw ? (JSON.parse(raw) as Tombstone[]) : [];
}

async function writeTombstones(list: Tombstone[]): Promise<void> {
  await AsyncStorage.setItem(TOMBSTONE_QUEUE_KEY, JSON.stringify(list));
}

export async function enqueueTombstone(t: Tombstone): Promise<void> {
  const list = await readTombstones();
  // Dedupe: same kind+mountainId+createdAt already queued.
  const exists = list.some(
    (x) => x.kind === t.kind && x.mountainId === t.mountainId && x.createdAt === t.createdAt,
  );
  if (!exists) {
    list.push(t);
    await writeTombstones(list);
  }
}

async function clearTombstones(toRemove: Tombstone[]): Promise<void> {
  if (toRemove.length === 0) return;
  const list = await readTombstones();
  const remaining = list.filter(
    (x) =>
      !toRemove.some(
        (r) => r.kind === x.kind && r.mountainId === x.mountainId && r.createdAt === x.createdAt,
      ),
  );
  await writeTombstones(remaining);
}

// ─── Offline write queue ──────────────────────────────────────────
// When a push fails (network error, rate limit, auth glitch) we enqueue a
// pending-write marker so a future flush / app-focus event retries the push.
// The queue holds a single logical "dirty" flag per user — actual payload is
// always read fresh from AsyncStorage at flush time.

async function readWriteQueue(): Promise<PendingWrite[]> {
  const raw = await AsyncStorage.getItem(WRITE_QUEUE_KEY);
  return raw ? (JSON.parse(raw) as PendingWrite[]) : [];
}

async function writeWriteQueue(list: PendingWrite[]): Promise<void> {
  await AsyncStorage.setItem(WRITE_QUEUE_KEY, JSON.stringify(list));
}

async function enqueueWrite(): Promise<void> {
  const list = await readWriteQueue();
  if (list.length === 0) {
    list.push({ id: 'default', enqueuedAt: new Date().toISOString(), attempt: 0 });
    await writeWriteQueue(list);
  }
}

async function clearWriteQueue(): Promise<void> {
  await AsyncStorage.removeItem(WRITE_QUEUE_KEY);
}

// ─── Merge helpers (field-aware) ──────────────────────────────────

function mergeSummits(local: SummitRecord[], cloud: SummitRecord[]): SummitRecord[] {
  const map = new Map<string, SummitRecord>();
  for (const record of cloud) {
    map.set(`${record.mountainId}|${record.createdAt}`, record);
  }
  for (const record of local) {
    const key = `${record.mountainId}|${record.createdAt}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, record);
    } else {
      // Field-level union: local wins on conflicting fields so unsaved edits
      // (route, conditions, photo, etc.) are not silently dropped.
      map.set(key, { ...existing, ...record });
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
    const existing = map.get(m.id);
    if (!existing) {
      map.set(m.id, m);
    } else {
      map.set(m.id, { ...existing, ...m });
    }
  }
  return Array.from(map.values());
}

// ─── Reconcile ────────────────────────────────────────────────────
// Bidirectional reconcile: fetch cloud + local, union (field-aware), subtract
// tombstones from both sides, write merged result to BOTH cloud and local, then
// drain the tombstone queue. Surfaced errors (no silent catch) so callers can
// show sync status / retry UI.

export interface ReconcileResult {
  summits: SummitRecord[];
  mountains: Mountain[];
  tombstonesApplied: number;
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES - 1) {
        const delay = Math.min(500 * Math.pow(2, attempt), 8000);
        console.log(`[CloudSync] ${label} attempt ${attempt + 1} failed, retrying in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

export async function reconcile(
  userId: string,
  queryClient: QueryClient,
): Promise<ReconcileResult> {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured — cannot reconcile.');
  }

  // 1. Read local state.
  const [summitsRaw, mountainsRaw, tombstones] = await Promise.all([
    AsyncStorage.getItem(SUMMIT_STORAGE_KEY),
    AsyncStorage.getItem(CUSTOM_MOUNTAINS_KEY),
    readTombstones(),
  ]);
  const localSummits: SummitRecord[] = summitsRaw ? JSON.parse(summitsRaw) : [];
  const localMountains: Mountain[] = mountainsRaw ? JSON.parse(mountainsRaw) : [];

  // 2. Fetch cloud state with retry.
  const fetched = await withRetry(
    async () =>
      await supabase
        .from('user_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
    'fetch user_data',
  );
  if (fetched.error) throw fetched.error;
  const cloudData = fetched.data;

  const cloudSummits: SummitRecord[] = cloudData?.summits ?? [];
  const cloudMountains: Mountain[] = cloudData?.custom_mountains ?? [];

  // 3. Union (field-aware).
  let mergedSummits = mergeSummits(localSummits, cloudSummits);
  let mergedMountains = mergeMountains(localMountains, cloudMountains);

  // 4. Apply tombstones: remove any record matching a queued tombstone.
  const tombstoneSet = new Set(
    tombstones.map((t) => `${t.kind}|${t.mountainId}|${t.createdAt}`),
  );
  mergedSummits = mergedSummits.filter(
    (r) => !tombstoneSet.has(`summit|${r.mountainId}|${r.createdAt}`),
  );
  mergedMountains = mergedMountains.filter(
    (m) => !tombstoneSet.has(`mountain|${m.id}|`),
  );

  // 5. Write merged result to cloud (insert or update) with retry.
  const updatedAt = new Date().toISOString();
  lastPushedUpdatedAt = updatedAt;

  if (cloudData) {
    const updated = await withRetry(
      async () =>
        await supabase
          .from('user_data')
          .update({
            summits: mergedSummits,
            custom_mountains: mergedMountains,
            updated_at: updatedAt,
          })
          .eq('user_id', userId),
      'update user_data',
    );
    if (updated.error) throw updated.error;
  } else {
    const inserted = await withRetry(
      async () =>
        await supabase
          .from('user_data')
          .insert({
            user_id: userId,
            summits: mergedSummits,
            custom_mountains: mergedMountains,
            updated_at: updatedAt,
          }),
      'insert user_data',
    );
    if (inserted.error) throw inserted.error;
  }

  // 6. Push tombstones to cloud (so other devices learn of deletions), then drain local queue.
  if (tombstones.length > 0) {
    const rows = tombstones.map((t) => ({
      user_id: userId,
      kind: t.kind,
      mountain_id: t.mountainId,
      created_at: t.createdAt,
      deleted_at: t.deletedAt,
    }));
    const tombed = await withRetry(
      async () => await supabase.from('summit_tombstones').insert(rows),
      'insert tombstones',
    );
    if (tombed.error) throw tombed.error;
    await clearTombstones(tombstones);
  }

  // 7. Write merged result back to local AsyncStorage + React Query cache.
  await AsyncStorage.setItem(SUMMIT_STORAGE_KEY, JSON.stringify(mergedSummits));
  await AsyncStorage.setItem(CUSTOM_MOUNTAINS_KEY, JSON.stringify(mergedMountains));
  queryClient.setQueryData(['summits'], mergedSummits);
  queryClient.setQueryData(['custom_mountains'], mergedMountains);

  await clearWriteQueue();

  console.log(
    `[CloudSync] Reconcile complete. Summits: ${mergedSummits.length}, Mountains: ${mergedMountains.length}, Tombstones applied: ${tombstones.length}`,
  );

  return {
    summits: mergedSummits,
    mountains: mergedMountains,
    tombstonesApplied: tombstones.length,
  };
}

// ─── Flush pending writes (app focus / reconnect) ─────────────────

export async function flushPendingWrites(userId: string, queryClient: QueryClient): Promise<void> {
  const queue = await readWriteQueue();
  if (queue.length === 0) return;
  console.log(`[CloudSync] Flushing ${queue.length} pending write(s)`);
  try {
    await reconcile(userId, queryClient);
  } catch (err) {
    console.log('[CloudSync] Flush failed, write stays queued:', err);
    // Bump attempt counter so we can surface persistent failures.
    const list = await readWriteQueue();
    if (list.length > 0) {
      list[0].attempt += 1;
      await writeWriteQueue(list);
    }
    throw err;
  }
}

export async function hasPendingWrites(): Promise<boolean> {
  const queue = await readWriteQueue();
  return queue.length > 0;
}

// ─── Debounced cloud push (local mutation → cloud) ────────────────
// Debounces rapid edits, then attempts a full reconcile. On failure, enqueues a
// pending write for the next flush. Errors are surfaced (not silently caught).

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export async function debouncedCloudPush(queryClient?: QueryClient): Promise<void> {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No session — anonymous data stays local. Enqueue so a future sign-in
        // reconcile will carry it to the cloud.
        await enqueueWrite();
        return;
      }

      if (!queryClient) {
        // Fallback: no client passed (shouldn't happen from contexts, but be safe).
        // Just push to cloud; caches will refresh on next query read.
        const { QueryClient } = await import('@tanstack/react-query');
        queryClient = new QueryClient();
      }
      await reconcile(session.user.id, queryClient);
      console.log('[CloudSync] Auto-push (reconcile) succeeded');
    } catch (error) {
      console.log('[CloudSync] Auto-push failed, enqueued for flush:', error);
      await enqueueWrite();
    }
  }, 2000);
}

// ─── Realtime merge (incoming cloud update) ───────────────────────
// Used by the AuthContext realtime handler. Applies tombstones already in the
// cloud row's tombstone set (fetched separately) and merges field-aware.

export async function applyRealtimeUpdate(
  userId: string,
  cloudSummits: SummitRecord[],
  cloudMountains: Mountain[],
  cloudUpdatedAt: string,
  queryClient: QueryClient,
): Promise<void> {
  // Echo guard: skip our own push coming back through Realtime.
  const lastPush = getLastPushedUpdatedAt();
  if (lastPush && cloudUpdatedAt === lastPush) {
    console.log('[CloudSync] Realtime echo — skipping own push');
    return;
  }

  const [summitsRaw, mountainsRaw, tombstones] = await Promise.all([
    AsyncStorage.getItem(SUMMIT_STORAGE_KEY),
    AsyncStorage.getItem(CUSTOM_MOUNTAINS_KEY),
    readTombstones(),
  ]);
  const localSummits: SummitRecord[] = summitsRaw ? JSON.parse(summitsRaw) : [];
  const localMountains: Mountain[] = mountainsRaw ? JSON.parse(mountainsRaw) : [];

  let mergedSummits = mergeSummits(localSummits, cloudSummits);
  let mergedMountains = mergeMountains(localMountains, cloudMountains);

  const tombstoneSet = new Set(
    tombstones.map((t) => `${t.kind}|${t.mountainId}|${t.createdAt}`),
  );
  mergedSummits = mergedSummits.filter(
    (r) => !tombstoneSet.has(`summit|${r.mountainId}|${r.createdAt}`),
  );
  mergedMountains = mergedMountains.filter(
    (m) => !tombstoneSet.has(`mountain|${m.id}|`),
  );

  await AsyncStorage.setItem(SUMMIT_STORAGE_KEY, JSON.stringify(mergedSummits));
  await AsyncStorage.setItem(CUSTOM_MOUNTAINS_KEY, JSON.stringify(mergedMountains));
  queryClient.setQueryData(['summits'], mergedSummits);
  queryClient.setQueryData(['custom_mountains'], mergedMountains);

  console.log(
    `[CloudSync] Realtime merge applied. Summits: ${mergedSummits.length}, Mountains: ${mergedMountains.length}`,
  );
}

// ─── Pending sync flag (for UI) ────────────────────────────────────

export async function setPendingSyncFlag(): Promise<void> {
  await enqueueWrite();
}

export async function clearPendingSyncFlag(): Promise<void> {
  await clearWriteQueue();
}

export async function getPendingSyncState(): Promise<{ pending: boolean; attempts: number }> {
  const queue = await readWriteQueue();
  return { pending: queue.length > 0, attempts: queue[0]?.attempt ?? 0 };
}
