import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Head from 'expo-router/head';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { APP_STORE_LINK, fetchShareBySlug, type SummitShareRow } from '@/lib/shareLinks';
import { defaultMountainImage, mountainImages } from '@/constants/mountainImages';
import { useSummits } from '@/contexts/SummitContext';

function firstSlug(slug: string | string[] | undefined): string {
  return Array.isArray(slug) ? (slug[0] ?? '') : (slug ?? '');
}

function formatShareDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Public page for a tappable summit link (peaknab.../s/<slug>).
 *
 * On web it renders the share page + social meta tags. On native a universal
 * link lands here: signed-in users who own the summit go straight to their
 * share card; everyone else is taken to the peak detail screen.
 */
export default function SummitSharePage() {
  const params = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { getSummitByCreatedAt, isLoading: summitsLoading } = useSummits();

  const slug = firstSlug(params.slug);
  const shareQuery = useQuery({
    queryKey: ['summit_share', slug],
    queryFn: () => fetchShareBySlug(slug),
    enabled: slug.length > 0,
    staleTime: 60_000,
    retry: false,
  });
  const share = shareQuery.data ?? null;

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (shareQuery.isLoading || summitsLoading || slug.length === 0) return;

    if (share) {
      const isOwner = !!getSummitByCreatedAt(share.mountain_id, share.summit_created_at);
      if (isOwner) {
        router.replace({
          pathname: '/share-card',
          params: { mountainId: share.mountain_id, createdAt: share.summit_created_at },
        });
      } else {
        router.replace({ pathname: '/mountain/[id]', params: { id: share.mountain_id } });
      }
    } else {
      router.replace('/');
    }
  }, [Platform.OS, shareQuery.isLoading, summitsLoading, share, slug, router, getSummitByCreatedAt]);

  const title = share
    ? `${share.mountain_name} — summited with PeakNab`
    : 'PeakNab — Summit Log';
  const elevationLine = share
    ? `${share.elevation_m.toLocaleString()} m / ${share.elevation_ft.toLocaleString()} ft`
    : '';
  const description = share
    ? [share.mountain_country, share.mountain_range, elevationLine, share.summit_date ? `Summited ${formatShareDate(share.summit_date)}` : null]
        .filter(Boolean)
        .join(' · ')
    : 'Every summit has a story. Track, log and share your peaks with PeakNab.';
  const photoUrl = share ? (mountainImages[share.mountain_id] ?? defaultMountainImage) : null;

  return (
    <>
      {Platform.OS === 'web' && (
        <Head>
          <title>{title}</title>
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta name="twitter:card" content="summary_large_image" />
          {photoUrl && <meta property="og:image" content={photoUrl} />}
        </Head>
      )}

      {Platform.OS !== 'web' ? (
        <NativeRedirecting />
      ) : share ? (
        <WebSharePage share={share} photoUrl={photoUrl ?? ''} />
      ) : (
        <WebMissingShare isLoading={shareQuery.isLoading} />
      )}
    </>
  );
}

/** Minimal native interstitial shown while the redirect effect runs. */
function NativeRedirecting() {
  return (
    <View style={[styles.page, styles.centered]}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  );
}

function WebSharePage({ share, photoUrl }: { share: SummitShareRow; photoUrl: string }) {
  const date = formatShareDate(share.summit_date);

  return (
    <View style={styles.page}>
      <Image source={{ uri: photoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={['rgba(7,18,34,0.35)', 'rgba(7,18,34,0.6)', 'rgba(7,18,34,0.92)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Text style={styles.brand}>
          <Text style={{ fontWeight: '800' as const }}>Peak</Text>
          <Text style={{ fontStyle: 'italic' as const }}>Nab</Text>
        </Text>
        <View style={styles.stamp}>
          <Text style={styles.stampText}>SUMMITED</Text>
        </View>
        <Text style={styles.peakName}>{share.mountain_name}</Text>
        <Text style={styles.metaLine}>
          {share.mountain_country} · {share.mountain_range} · {share.elevation_m.toLocaleString()} m
        </Text>
        {date && <Text style={styles.dateLine}>{date}</Text>}
        {share.show_climber && share.climber_screenname && (
          <Text style={styles.climberLine}>Climbed by @{share.climber_screenname}</Text>
        )}
        <TouchableOpacity
          style={styles.cta}
          onPress={() => void Linking.openURL(APP_STORE_LINK)}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Log your summits with PeakNab</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function WebMissingShare({ isLoading }: { isLoading: boolean }) {
  return (
    <View style={[styles.page, styles.centered, { backgroundColor: '#0b1a2e' }]}>
      {isLoading ? (
        <ActivityIndicator color={Colors.primary} />
      ) : (
        <>
          <Text style={styles.missingTitle}>This summit link isn&apos;t available</Text>
          <Text style={styles.missingSubtitle}>
            It may have been removed, or the link may be incorrect.
          </Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => void Linking.openURL(APP_STORE_LINK)}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>Get PeakNab</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#0b1a2e',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 32,
    paddingBottom: 72,
    gap: 10,
  },
  brand: {
    position: 'absolute' as const,
    top: 72,
    fontSize: 18,
    color: '#F5F1E6',
    letterSpacing: 1,
  },
  stamp: {
    borderWidth: 1.5,
    borderColor: '#C0392B',
    borderRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: 6,
    transform: [{ rotate: '-6deg' }],
    marginBottom: 8,
  },
  stampText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#C0392B',
    letterSpacing: 2,
  },
  peakName: {
    fontSize: 42,
    fontWeight: '800' as const,
    color: '#F5F1E6',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  metaLine: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  dateLine: {
    fontSize: 14,
    color: '#D4A843',
    fontWeight: '700' as const,
  },
  climberLine: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontStyle: 'italic' as const,
  },
  cta: {
    marginTop: 28,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 28,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  missingTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#F5F1E6',
    textAlign: 'center',
  },
  missingSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 6,
  },
});
