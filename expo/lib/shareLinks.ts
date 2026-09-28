import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { supabase, supabaseConfigured } from '@/lib/supabase';

/**
 * Public share-link helpers for tappable summit links.
 *
 * Each summit record carries a stable short slug. The first time a summit is
 * shared (or its link is copied) the slug is generated, written back onto the
 * local record, and a privacy-safe public snapshot is upserted into the
 * `summit_shares` table so https://<origin>/s/<slug> can resolve it.
 */

export const APP_STORE_LINK = 'https://apps.apple.com/app/id6790620432';

const DEFAULT_WEB_ORIGIN = 'https://peaknab.rork.app';
const SLUG_ALPHABET = 'abcdefghijkmnopqrstuvwxyz23456789';
const SLUG_LENGTH = 8;

/** Row shape stored in the public `summit_shares` table. */
export interface SummitShareRow {
  share_slug: string;
  user_id: string;
  mountain_id: string;
  summit_created_at: string;
  summit_date: string | null;
  mountain_name: string;
  mountain_country: string;
  mountain_range: string;
  elevation_m: number;
  elevation_ft: number;
  show_climber: boolean;
  climber_screenname: string | null;
}

/** Web origin the /s/<slug> pages are served from (overridable via env). */
export function getShareWebOrigin(): string {
  const env = process.env.EXPO_PUBLIC_SHARE_WEB_ORIGIN;
  if (env && env.trim().length > 0) return env.trim().replace(/\/+$/, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return DEFAULT_WEB_ORIGIN;
}

export function buildShareUrl(slug: string): string {
  return `${getShareWebOrigin()}/s/${slug}`;
}

/** Unambiguous base32-ish random slug (no 0/o/1/l). */
export function generateShareSlug(): string {
  const bytes = Crypto.getRandomBytes(SLUG_LENGTH);
  let slug = '';
  for (let i = 0; i < SLUG_LENGTH; i++) {
    slug += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  }
  return slug;
}

/**
 * Upsert the public share row for a summit. If the generated slug collides
 * (23505 on the primary key) a fresh slug is generated and the upsert retried
 * once; the caller must persist the returned slug when it differs.
 */
export async function upsertSummitShare(
  payload: SummitShareRow,
): Promise<{ ok: boolean; slug: string; error?: string }> {
  if (!supabaseConfigured) {
    return { ok: false, slug: payload.share_slug, error: 'supabase-not-configured' };
  }

  let row = payload;
  for (let attempt = 0; attempt < 2; attempt++) {
    const { error } = await supabase
      .from('summit_shares')
      .upsert(row, { onConflict: 'share_slug' });
    if (!error) return { ok: true, slug: row.share_slug };

    console.log('[ShareLink] Upsert failed:', error.message);
    if (error.code === '23505' && attempt === 0) {
      // Slug collision — regenerate and try once more.
      row = { ...row, share_slug: generateShareSlug() };
      continue;
    }
    return { ok: false, slug: row.share_slug, error: error.message };
  }
  return { ok: false, slug: row.share_slug, error: 'upsert-failed' };
}

/** Resolve a slug to its public share row via the anon client (public RLS). */
export async function fetchShareBySlug(slug: string): Promise<SummitShareRow | null> {
  if (!supabaseConfigured) return null;
  const { data, error } = await supabase
    .from('summit_shares')
    .select('*')
    .eq('share_slug', slug)
    .maybeSingle();
  if (error) {
    console.log('[ShareLink] Fetch failed:', error.message);
    return null;
  }
  return (data as SummitShareRow) ?? null;
}
