import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Trophy,
  Mountain,
  TrendingUp,
  Flag,
  ChevronRight,
  Award,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mountains, categoryLabels, MountainCategory } from '@/constants/mountains';
import { useSummits } from '@/contexts/SummitContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { records, summitCount, totalElevation, isSummited } = useSummits();

  const summitedMountains = useMemo(() => {
    return mountains.filter((m) => isSummited(m.id));
  }, [records, isSummited]);

  const highestSummit = useMemo(() => {
    if (summitedMountains.length === 0) return null;
    return summitedMountains.reduce((a, b) => (a.elevation > b.elevation ? a : b));
  }, [summitedMountains]);

  const categoryProgress = useMemo(() => {
    const cats: MountainCategory[] = ['7summits', '8000m', '14ers', 'alps', 'andes', 'himalaya', 'other'];
    return cats.map((cat) => {
      const total = mountains.filter((m) => m.category === cat).length;
      const done = mountains.filter((m) => m.category === cat && isSummited(m.id)).length;
      return { category: cat, total, done, label: categoryLabels[cat] };
    });
  }, [records, isSummited]);

  const recentSummits = useMemo(() => {
    return [...records]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((r) => {
        const mountain = mountains.find((m) => m.id === r.mountainId);
        return { ...r, mountain };
      });
  }, [records]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your Profile</Text>
        <Text style={styles.subtitle}>Track your mountaineering journey</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.accent + '20' }]}>
              <Flag color={Colors.accent} size={22} />
            </View>
            <Text style={styles.statNumber}>{summitCount}</Text>
            <Text style={styles.statLabel}>Summits</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.success + '20' }]}>
              <TrendingUp color={Colors.success} size={22} />
            </View>
            <Text style={styles.statNumber}>{totalElevation > 1000 ? `${(totalElevation / 1000).toFixed(1)}k` : totalElevation}</Text>
            <Text style={styles.statLabel}>Meters Gained</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.gold + '20' }]}>
              <Trophy color={Colors.gold} size={22} />
            </View>
            <Text style={styles.statNumber}>{highestSummit ? `${(highestSummit.elevation / 1000).toFixed(1)}k` : '—'}</Text>
            <Text style={styles.statLabel}>Highest (m)</Text>
          </View>
        </View>

        {highestSummit && (
          <TouchableOpacity
            style={styles.highestCard}
            onPress={() => router.push(`/mountain/${highestSummit.id}`)}
            activeOpacity={0.8}
          >
            <View style={styles.highestLeft}>
              <Award color={Colors.gold} size={24} />
              <View style={styles.highestInfo}>
                <Text style={styles.highestLabel}>Highest Summit</Text>
                <Text style={styles.highestName}>{highestSummit.name}</Text>
                <Text style={styles.highestElev}>{highestSummit.elevation.toLocaleString()}m · {highestSummit.country}</Text>
              </View>
            </View>
            <ChevronRight color={Colors.textMuted} size={18} />
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Progress</Text>
          {categoryProgress.map((cat) => {
            const percentage = cat.total > 0 ? (cat.done / cat.total) * 100 : 0;
            const catColor = Colors.categoryColors[cat.category] ?? Colors.accent;
            return (
              <View key={cat.category} style={styles.progressRow}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>{cat.label}</Text>
                  <Text style={styles.progressCount}>
                    {cat.done}/{cat.total}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.max(percentage, 0)}%`,
                        backgroundColor: catColor,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {recentSummits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Summits</Text>
            {recentSummits.map((record) => (
              <TouchableOpacity
                key={record.mountainId}
                style={styles.recentItem}
                onPress={() => router.push(`/mountain/${record.mountainId}`)}
                activeOpacity={0.8}
              >
                <Text style={styles.recentEmoji}>{record.mountain?.iconEmoji ?? '⛰️'}</Text>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName}>{record.mountain?.name ?? 'Unknown'}</Text>
                  <Text style={styles.recentDate}>{record.date}</Text>
                </View>
                <ChevronRight color={Colors.textMuted} size={16} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {summitCount === 0 && (
          <View style={styles.emptyState}>
            <Mountain color={Colors.textMuted} size={48} />
            <Text style={styles.emptyTitle}>No summits yet</Text>
            <Text style={styles.emptyText}>
              Start exploring peaks and record your first summit!
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push('/')}
              activeOpacity={0.8}
            >
              <Text style={styles.exploreButtonText}>Explore Peaks</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: Colors.white,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  highestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gold + '30',
    marginBottom: 24,
  },
  highestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  highestInfo: {
    flex: 1,
  },
  highestLabel: {
    fontSize: 10,
    color: Colors.gold,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  highestName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  highestElev: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 14,
  },
  progressRow: {
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  progressCount: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.cardBg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 2,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  recentDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  exploreButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
