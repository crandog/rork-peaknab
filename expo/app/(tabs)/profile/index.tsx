import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Trophy,
  Mountain,
  TrendingUp,
  Flag,
  ChevronRight,
  Award,
  Share2,
  Globe,
  Layers,
  Target,
  Zap,
  Compass,
  FileDown,
} from 'lucide-react-native';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import Colors from '@/constants/colors';
import { categoryLabels, MountainCategory } from '@/constants/mountains';
import MountainIcon from '@/components/MountainIcon';
import { useSummits } from '@/contexts/SummitContext';
import { useAllMountains } from '@/hooks/useAllMountains';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { records, summitCount, totalElevation, isSummited } = useSummits();
  const allMountains = useAllMountains();

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [records]);

  const summitedMountains = useMemo(() => {
    return allMountains.filter((m) => isSummited(m.id));
  }, [records, isSummited, allMountains]);

  const highestSummit = useMemo(() => {
    if (summitedMountains.length === 0) return null;
    return summitedMountains.reduce((a, b) => (a.elevation > b.elevation ? a : b));
  }, [summitedMountains]);

  const totalElevationFt = useMemo(() => {
    return records.reduce((acc, record) => {
      const mountain = allMountains.find((m) => m.id === record.mountainId);
      return acc + (mountain?.elevationFt ?? 0);
    }, 0);
  }, [records, allMountains]);

  const countriesVisited = useMemo(() => {
    const countries = new Set<string>();
    summitedMountains.forEach((m) => {
      m.country.split(' / ').forEach((c) => countries.add(c.trim()));
    });
    return countries.size;
  }, [summitedMountains]);

  const rangesClimbed = useMemo(() => {
    const ranges = new Set<string>();
    summitedMountains.forEach((m) => ranges.add(m.range));
    return ranges.size;
  }, [summitedMountains]);

  const difficultyBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    summitedMountains.forEach((m) => {
      map[m.difficulty] = (map[m.difficulty] ?? 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [summitedMountains]);

  const categoryProgress = useMemo(() => {
    const cats: MountainCategory[] = ['7summits', '8000m', '14ers', 'alps', 'andes', 'himalaya', 'other', 'custom'];
    return cats
      .map((cat) => {
        const total = allMountains.filter((m) => m.category === cat).length;
        const done = allMountains.filter((m) => m.category === cat && isSummited(m.id)).length;
        return { category: cat, total, done, label: categoryLabels[cat] };
      })
      .filter((cat) => cat.total > 0);
  }, [records, isSummited, allMountains]);

  const recentSummits = useMemo(() => {
    return [...records]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((r) => {
        const mountain = allMountains.find((m) => m.id === r.mountainId);
        return { ...r, mountain };
      });
  }, [records, allMountains]);

  const overallCompletion = useMemo(() => {
    return allMountains.length > 0 ? Math.round((summitCount / allMountains.length) * 100) : 0;
  }, [summitCount, allMountains]);

  const handleExportPDF = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const sortedSummits = summitedMountains
      .map((m) => {
        const record = records.find((r) => r.mountainId === m.id);
        return { name: m.name, date: record?.date ?? '—', createdAt: record?.createdAt ?? '' };
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const tableRows = sortedSummits
      .map((s, i) =>
        '<tr>' +
        '<td style="padding:8px 12px;border-bottom:1px solid #eee;color:#888;font-size:13px;width:30px;">' + (i + 1) + '</td>' +
        '<td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;font-weight:600;color:#222;">' + s.name + '</td>' +
        '<td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;color:#666;text-align:right;white-space:nowrap;">' + s.date + '</td>' +
        '</tr>'
      )
      .join('');

    const html =
      '<!DOCTYPE html><html><head><meta charset="utf-8"/>' +
      '<style>' +
      '@page{margin:40px;}' +
      'body{font-family:Helvetica,Arial,sans-serif;margin:0;padding:0;color:#222;}' +
      'table{width:100%;border-collapse:collapse;}' +
      'th{text-align:left;padding:6px 12px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #222;}' +
      'th:last-child{text-align:right;}' +
      '</style></head><body>' +
      '<div style="padding:20px;">' +
      '<div style="margin-bottom:24px;">' +
      '<div style="font-size:28px;font-weight:800;color:#111;margin-bottom:2px;">Summit Log</div>' +
      '<div style="font-size:12px;color:#aaa;">' + dateStr + ' — ' + sortedSummits.length + ' summit' + (sortedSummits.length !== 1 ? 's' : '') + ' recorded</div>' +
      '</div>' +
      '<table><thead><tr><th>#</th><th>Peak</th><th style="text-align:right;">Date</th></tr></thead>' +
      '<tbody>' + tableRows + '</tbody></table>' +
      '</div></body></html>';

    try {
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        console.log('PDF saved to:', uri);
        await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (e) {
      console.log('Export cancelled or failed', e);
    }
  }, [summitedMountains, records]);

  const handleShareStats = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const topCategories = categoryProgress
      .filter((c) => c.done > 0)
      .map((c) => `  ${c.label}: ${c.done}/${c.total}`)
      .join('\n');

    const message = [
      `🏔️ My Summit Tracker Stats`,
      ``,
      `⛰️ Summits: ${summitCount}`,
      `📈 Elevation Gained: ${totalElevation.toLocaleString()}m / ${totalElevationFt.toLocaleString()}ft`,
      `🌍 Countries: ${countriesVisited}`,
      `🗻 Ranges: ${rangesClimbed}`,
      highestSummit ? `🏆 Highest: ${highestSummit.name} (${highestSummit.elevation.toLocaleString()}m)` : '',
      ``,
      topCategories ? `📊 Progress:\n${topCategories}` : '',
      ``,
      `${overallCompletion}% of all peaks completed!`,
    ].filter(Boolean).join('\n');

    try {
      await Share.share({ message });
    } catch (e) {
      console.log('Share cancelled or failed', e);
    }
  }, [summitCount, totalElevation, totalElevationFt, countriesVisited, rangesClimbed, highestSummit, categoryProgress, overallCompletion]);

  const handleShareSummit = useCallback(async (mountainId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const mountain = allMountains.find((m) => m.id === mountainId);
    const record = records.find((r) => r.mountainId === mountainId);
    if (!mountain || !record) return;

    const message = [
      `🏔️ Summit Achievement!`,
      ``,
      `${mountain.iconEmoji} I summited ${mountain.name}!`,
      `📍 ${mountain.country} · ${mountain.range}`,
      `📏 ${mountain.elevation.toLocaleString()}m / ${mountain.elevationFt.toLocaleString()}ft`,
      `📅 ${record.date}`,
      record.report ? `\n📝 "${record.report}"` : '',
    ].filter(Boolean).join('\n');

    try {
      await Share.share({ message });
    } catch (e) {
      console.log('Share cancelled or failed', e);
    }
  }, [records]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A1A2E', '#1E2240', '#1A1A2E']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Your mountaineering journey</Text>
          </View>
          {summitCount > 0 && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={handleExportPDF}
                activeOpacity={0.7}
                testID="export-pdf-button"
              >
                <FileDown color={Colors.white} size={18} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shareStatsButton}
                onPress={handleShareStats}
                activeOpacity={0.7}
                testID="share-stats-button"
              >
                <Share2 color={Colors.white} size={18} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <LinearGradient
          colors={[Colors.accent + '15', Colors.warmGlow + '10', 'transparent']}
          style={styles.completionCard}
        >
          <View style={styles.completionTop}>
            <View>
              <Text style={styles.completionLabel}>OVERALL PROGRESS</Text>
              <Text style={styles.completionPercentage}>{overallCompletion}%</Text>
            </View>
            <View style={styles.completionCircle}>
              <Text style={styles.completionFraction}>{summitCount}/{allMountains.length}</Text>
              <Text style={styles.completionPeaks}>peaks</Text>
            </View>
          </View>
          <View style={styles.completionBar}>
            <Animated.View
              style={[
                styles.completionFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', `${Math.max(overallCompletion, 1)}%`],
                  }),
                },
              ]}
            />
          </View>
        </LinearGradient>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.accent + '18' }]}>
              <Flag color={Colors.accent} size={20} />
            </View>
            <Text style={styles.statNumber}>{summitCount}</Text>
            <Text style={styles.statLabel}>Summits</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.success + '18' }]}>
              <TrendingUp color={Colors.success} size={20} />
            </View>
            <Text style={styles.statNumber}>
              {totalElevation > 1000 ? `${(totalElevation / 1000).toFixed(1)}k` : totalElevation}
            </Text>
            <Text style={styles.statLabel}>Meters</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.ice + '18' }]}>
              <Globe color={Colors.ice} size={20} />
            </View>
            <Text style={styles.statNumber}>{countriesVisited}</Text>
            <Text style={styles.statLabel}>Countries</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.gold + '18' }]}>
              <Layers color={Colors.gold} size={20} />
            </View>
            <Text style={styles.statNumber}>{rangesClimbed}</Text>
            <Text style={styles.statLabel}>Ranges</Text>
          </View>
        </View>

        {highestSummit && (
          <TouchableOpacity
            style={styles.highestCard}
            onPress={() => router.push(`/mountain/${highestSummit.id}` as any)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.gold + '12', Colors.warmGlow + '08', 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.highestLeft}>
              <Award color={Colors.gold} size={24} />
              <View style={styles.highestInfo}>
                <Text style={styles.highestLabel}>HIGHEST SUMMIT</Text>
                <Text style={styles.highestName}>{highestSummit.name}</Text>
                <Text style={styles.highestElev}>
                  {highestSummit.elevation.toLocaleString()}m · {highestSummit.country}
                </Text>
              </View>
            </View>
            <ChevronRight color={Colors.textMuted} size={18} />
          </TouchableOpacity>
        )}

        {difficultyBreakdown.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Zap color={Colors.warning} size={18} />
              <Text style={styles.sectionTitle}>Difficulty Breakdown</Text>
            </View>
            <View style={styles.difficultyRow}>
              {difficultyBreakdown.map(([diff, count]) => {
                const diffColor =
                  diff === 'Extreme' ? Colors.danger :
                  diff === 'Hard' ? Colors.warning :
                  diff === 'Moderate' ? Colors.accent :
                  Colors.success;
                return (
                  <View key={diff} style={[styles.difficultyChip, { borderColor: diffColor + '30' }]}>
                    <View style={[styles.difficultyDot, { backgroundColor: diffColor }]} />
                    <Text style={[styles.difficultyText, { color: diffColor }]}>{diff}</Text>
                    <Text style={styles.difficultyCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Target color={Colors.accent} size={18} />
            <Text style={styles.sectionTitle}>Category Progress</Text>
          </View>
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
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', `${Math.max(percentage, 0)}%`],
                        }),
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
              <View key={record.mountainId} style={styles.recentItem}>
                <TouchableOpacity
                  style={styles.recentContent}
                  onPress={() => router.push(`/mountain/${record.mountainId}` as any)}
                  activeOpacity={0.8}
                >
                  <MountainIcon mountainId={record.mountainId} category={record.mountain?.category ?? 'other'} size={20} />
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName}>{record.mountain?.name ?? 'Unknown'}</Text>
                    <Text style={styles.recentDate}>{record.date}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.shareIconButton}
                  onPress={() => handleShareSummit(record.mountainId)}
                  activeOpacity={0.7}
                  testID={`share-summit-${record.mountainId}`}
                >
                  <Share2 color={Colors.textMuted} size={16} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {summitCount === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Compass color={Colors.accent} size={48} />
            </View>
            <Text style={styles.emptyTitle}>Your journey begins here</Text>
            <Text style={styles.emptyText}>
              Explore peaks around the world and record your first summit to start tracking your progress.
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push('/')}
              activeOpacity={0.8}
            >
              <Text style={styles.exploreButtonText}>Explore Peaks</Text>
              <ChevronRight color={Colors.white} size={18} />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '900' as const,
    color: Colors.text,
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shareStatsButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.accent + '20',
    overflow: 'hidden',
  },
  completionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  completionLabel: {
    fontSize: 10,
    color: Colors.accent,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  completionPercentage: {
    fontSize: 38,
    fontWeight: '900' as const,
    color: Colors.text,
    letterSpacing: -1,
  },
  completionCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: Colors.accent + '35',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.accent + '08',
  },
  completionFraction: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.accentLight,
  },
  completionPeaks: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  completionBar: {
    height: 8,
    backgroundColor: Colors.cardBgLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
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
    borderColor: Colors.gold + '25',
    marginBottom: 20,
    overflow: 'hidden',
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
    fontSize: 9,
    color: Colors.gold,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  highestName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  highestElev: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  difficultyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  difficultyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    gap: 8,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  difficultyCount: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.text,
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
    height: 7,
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
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  recentContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  recentInfo: {
    flex: 1,
    marginLeft: 12,
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
  shareIconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.accent + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 21,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  exploreButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
