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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
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
  Cloud,
  CloudOff,
  LogOut,
  RefreshCw,
  User as UserIcon,
} from 'lucide-react-native';
import * as Print from 'expo-print';
import Colors from '@/constants/colors';
import { categoryLabels, MountainCategory } from '@/constants/mountains';
import MountainIcon from '@/components/MountainIcon';
import { useSummits } from '@/contexts/SummitContext';
import { useAllMountains } from '@/hooks/useAllMountains';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { records, summitCount, uniqueSummitCount, totalElevation, isSummited } = useSummits();
  const allMountains = useAllMountains();
  const { isAuthenticated, user, signOut, syncStatus, pushToCloud, isSigningOut } = useAuth();

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [records, progressAnim]);

  const summitedMountains = useMemo(() => {
    return allMountains.filter((m) => isSummited(m.id));
  }, [isSummited, allMountains]);

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
  }, [isSummited, allMountains]);

  const recentSummits = useMemo(() => {
    return [...records]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((r) => {
        const mountain = allMountains.find((m) => m.id === r.mountainId);
        const count = records.filter((rec) => rec.mountainId === r.mountainId).length;
        return { ...r, mountain, summitCount: count };
      });
  }, [records, allMountains]);

  const overallCompletion = useMemo(() => {
    return allMountains.length > 0 ? Math.round((uniqueSummitCount / allMountains.length) * 100) : 0;
  }, [uniqueSummitCount, allMountains]);

  const handleExportPDF = useCallback(async () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const sortedSummits = summitedMountains
      .map((m) => {
        const record = records.find((r) => r.mountainId === m.id);
        return {
          name: m.name,
          elevation: m.elevation,
          elevationFt: m.elevationFt,
          category: m.category,
          country: m.country,
          range: m.range,
          date: record?.date ?? '',
          createdAt: record?.createdAt ?? '',
        };
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const milestones: string[] = [];
    const sevenSummitsTotal = allMountains.filter((m) => m.category === '7summits').length;
    const sevenSummitsDone = allMountains.filter((m) => m.category === '7summits' && isSummited(m.id)).length;
    if (sevenSummitsDone > 0) {
      milestones.push(sevenSummitsDone === sevenSummitsTotal
        ? `All ${sevenSummitsTotal} of the 7 Summits completed!`
        : `${sevenSummitsDone}/${sevenSummitsTotal} of the 7 Summits completed`);
    }
    const eightKTotal = allMountains.filter((m) => m.category === '8000m').length;
    const eightKDone = allMountains.filter((m) => m.category === '8000m' && isSummited(m.id)).length;
    if (eightKDone > 0) {
      milestones.push(eightKDone === eightKTotal
        ? `All ${eightKTotal} of the 8000m Peaks completed!`
        : `${eightKDone}/${eightKTotal} of the 8000m Peaks completed`);
    }
    const fourteenersTotal = allMountains.filter((m) => m.category === '14ers').length;
    const fourteenersDone = allMountains.filter((m) => m.category === '14ers' && isSummited(m.id)).length;
    if (fourteenersDone > 0) {
      milestones.push(fourteenersDone === fourteenersTotal
        ? `All ${fourteenersTotal} Colorado 14ers completed!`
        : `${fourteenersDone}/${fourteenersTotal} Colorado 14ers completed`);
    }

    const milestoneHtml = milestones.length > 0
      ? '<div style="margin-bottom:24px;padding:12px 16px;background:#f8f8f8;border-radius:6px;border-left:3px solid #222;">' +
        '<div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:8px;font-weight:bold;">Milestones</div>' +
        milestones.map((m) => '<div style="font-size:13px;color:#333;padding:3px 0;">' + (m.includes('All ') ? '\u2B50 ' : '\u25CB ') + m + '</div>').join('') +
        '</div>'
      : '';

    const rows = sortedSummits.map((s) =>
      '<tr style="border-bottom:1px solid #eee;">' +
      '<td style="padding:10px 8px 10px 0;font-size:13px;color:#222;font-weight:500;">' + s.name + '</td>' +
      '<td style="padding:10px 8px;font-size:12px;color:#555;white-space:nowrap;">' + s.country + '</td>' +
      '<td style="padding:10px 8px;font-size:12px;color:#555;white-space:nowrap;">' + s.range + '</td>' +
      '<td style="padding:10px 8px;font-size:12px;color:#555;text-align:right;white-space:nowrap;">' + s.elevation.toLocaleString() + 'm</td>' +
      '<td style="padding:10px 8px;font-size:12px;color:#555;text-align:right;white-space:nowrap;">' + s.elevationFt.toLocaleString() + 'ft</td>' +
      '<td style="padding:10px 0 10px 8px;font-size:12px;color:#999;text-align:right;white-space:nowrap;">' + s.date + '</td>' +
      '</tr>'
    ).join('');

    const totalElev = sortedSummits.reduce((a, s) => a + s.elevation, 0);
    const totalElevFt = sortedSummits.reduce((a, s) => a + s.elevationFt, 0);

    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"/>' +
      '<style>@page{margin:50px 45px}body{font-family:Helvetica,Arial,sans-serif;margin:0;padding:0;color:#222}table{width:100%;border-collapse:collapse}th{text-align:left;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px;padding:0 8px 8px 0;font-weight:600;border-bottom:2px solid #222}th:nth-child(4),th:nth-child(5),th:nth-child(6){text-align:right}th:last-child{padding-right:0}td:first-child{max-width:200px}</style>' +
      '</head><body>' +
      '<div style="margin-bottom:24px;">' +
      '<div style="font-size:26px;font-weight:bold;color:#111;letter-spacing:-0.5px;">Summit Log</div>' +
      '<div style="font-size:11px;color:#aaa;margin-top:4px;">' + sortedSummits.length + ' summit' + (sortedSummits.length !== 1 ? 's' : '') + ' \u2022 ' + totalElev.toLocaleString() + 'm / ' + totalElevFt.toLocaleString() + 'ft total \u2022 ' + dateStr + '</div>' +
      '</div>' +
      milestoneHtml +
      '<table><thead><tr><th>Mountain</th><th>Country</th><th>Range</th><th style="text-align:right;padding-right:8px;">Meters</th><th style="text-align:right;padding-right:8px;">Feet</th><th style="text-align:right;padding-right:0;">Date</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div style="margin-top:40px;text-align:center;font-size:9px;color:#ccc;">Summit Tracker</div>' +
      '</body></html>';

    console.log('PDF Export v3: generating minimal summit log, count:', sortedSummits.length);

    try {
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 300);
        } else {
          console.log('Popup blocked — falling back to blob download');
          const blob = new Blob([html], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'summit-log.html';
          a.click();
          URL.revokeObjectURL(url);
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        console.log('PDF saved to:', uri);
        const Sharing = await import('expo-sharing');
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (e) {
      console.log('Export cancelled or failed', e);
    }
  }, [summitedMountains, records, allMountains, isSummited]);

  const handleShareStats = useCallback(async () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const topCategories = categoryProgress
      .filter((c) => c.done > 0)
      .map((c) => `  ${c.label}: ${c.done}/${c.total}`)
      .join('\n');

    const message = [
      `My Summit Tracker Stats`,
      ``,
      `Summits: ${summitCount}`,
      `Elevation Gained: ${totalElevation.toLocaleString()}m / ${totalElevationFt.toLocaleString()}ft`,
      `Countries: ${countriesVisited}`,
      `Ranges: ${rangesClimbed}`,
      highestSummit ? `Highest: ${highestSummit.name} (${highestSummit.elevation.toLocaleString()}m)` : '',
      ``,
      topCategories ? `Progress:\n${topCategories}` : '',
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
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const mountain = allMountains.find((m) => m.id === mountainId);
    const record = records.find((r) => r.mountainId === mountainId);
    if (!mountain || !record) return;

    const message = [
      `Summit Achievement!`,
      ``,
      `${mountain.iconEmoji} I summited ${mountain.name}!`,
      `${mountain.country} · ${mountain.range}`,
      `${mountain.elevation.toLocaleString()}m / ${mountain.elevationFt.toLocaleString()}ft`,
      `${record.date}`,
      record.report ? `\n"${record.report}"` : '',
    ].filter(Boolean).join('\n');

    try {
      await Share.share({ message });
    } catch (e) {
      console.log('Share cancelled or failed', e);
    }
  }, [records, allMountains]);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/h9lsc5acg9fa3uka6bwlz' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.backgroundOverlay} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>My Summits</Text>
            <Text style={styles.subtitleLight}>Your mountaineering journey</Text>
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

        <View style={styles.completionCard}>
          <View style={styles.completionTop}>
            <View>
              <Text style={styles.completionLabel}>OVERALL PROGRESS</Text>
              <Text style={styles.completionPercentage}>{overallCompletion}%</Text>
            </View>
            <View style={styles.completionCircle}>
              <Text style={styles.completionFraction}>{uniqueSummitCount}/{allMountains.length}</Text>
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
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.primary + '15' }]}>
              <Flag color={Colors.primary} size={20} />
            </View>
            <Text style={styles.statNumber}>{summitCount}</Text>
            <Text style={styles.statLabel}>{summitCount !== uniqueSummitCount ? `Summits (${uniqueSummitCount} peaks)` : 'Summits'}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.success + '15' }]}>
              <TrendingUp color={Colors.success} size={20} />
            </View>
            <Text style={styles.statNumber}>
              {totalElevation > 1000 ? `${(totalElevation / 1000).toFixed(1)}k` : totalElevation}
            </Text>
            <Text style={styles.statLabel}>Meters</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#4A7FB5' + '15' }]}>
              <Globe color={'#4A7FB5'} size={20} />
            </View>
            <Text style={styles.statNumber}>{countriesVisited}</Text>
            <Text style={styles.statLabel}>Countries</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.gold + '15' }]}>
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
                  diff === 'Moderate' ? Colors.primary :
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
            <Target color={Colors.primary} size={18} />
            <Text style={styles.sectionTitle}>Category Progress</Text>
          </View>
          {categoryProgress.map((cat) => {
            const percentage = cat.total > 0 ? (cat.done / cat.total) * 100 : 0;
            const catColor = Colors.categoryColors[cat.category] ?? Colors.primary;
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
              <View key={record.createdAt} style={styles.recentItem}>
                <TouchableOpacity
                  style={styles.recentContent}
                  onPress={() => router.push(`/mountain/${record.mountainId}` as any)}
                  activeOpacity={0.8}
                >
                  <MountainIcon mountainId={record.mountainId} category={record.mountain?.category ?? 'other'} size={20} />
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName}>
                      {record.mountain?.name ?? 'Unknown'}
                      {record.summitCount > 1 ? ` (x${record.summitCount})` : ''}
                    </Text>
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

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Cloud color={Colors.primary} size={18} />
            <Text style={styles.sectionTitle}>Account & Sync</Text>
          </View>
          {isAuthenticated ? (
            <View style={styles.accountCard}>
              <View style={styles.accountInfo}>
                <View style={styles.avatarCircle}>
                  <UserIcon color={Colors.white} size={20} />
                </View>
                <View style={styles.accountDetails}>
                  <Text style={styles.accountEmail} numberOfLines={1}>{user?.email ?? 'Signed in'}</Text>
                  <View style={styles.syncRow}>
                    <View style={[styles.syncDot, { backgroundColor: syncStatus === 'synced' ? Colors.success : syncStatus === 'syncing' ? Colors.warning : syncStatus === 'error' ? Colors.danger : Colors.textMuted }]} />
                    <Text style={styles.syncLabel}>
                      {syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'error' ? 'Sync error' : 'Local'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.accountActions}>
                <TouchableOpacity
                  style={styles.accountActionButton}
                  onPress={() => { void pushToCloud(); }}
                  activeOpacity={0.7}
                  testID="sync-now-button"
                >
                  <RefreshCw color={Colors.primary} size={16} />
                  <Text style={styles.accountActionText}>Sync</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.accountActionButton, styles.signOutButton]}
                  onPress={signOut}
                  disabled={isSigningOut}
                  activeOpacity={0.7}
                  testID="sign-out-button"
                >
                  <LogOut color={Colors.danger} size={16} />
                  <Text style={[styles.accountActionText, { color: Colors.danger }]}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.signInCard}
              onPress={() => router.push('/auth' as any)}
              activeOpacity={0.8}
              testID="sign-in-prompt"
            >
              <View style={styles.signInLeft}>
                <View style={styles.signInIconCircle}>
                  <CloudOff color={Colors.textMuted} size={20} />
                </View>
                <View style={styles.signInInfo}>
                  <Text style={styles.signInTitle}>Sign in to sync</Text>
                  <Text style={styles.signInSubtitle}>Back up your data & access it anywhere</Text>
                </View>
              </View>
              <ChevronRight color={Colors.textMuted} size={18} />
            </TouchableOpacity>
          )}
        </View>

        {summitCount === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Compass color={Colors.primary} size={48} />
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
    backgroundColor: Colors.snow,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: 'rgba(180, 205, 230, 0.25)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitleLight: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  shareStatsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  completionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  completionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  completionLabel: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  completionPercentage: {
    fontSize: 38,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -1,
  },
  completionCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: Colors.primary + '35',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.frost,
  },
  completionFraction: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  completionPeaks: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  completionBar: {
    height: 8,
    backgroundColor: Colors.frost,
    borderRadius: 4,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
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
    fontWeight: '800' as const,
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
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gold + '30',
    marginBottom: 20,
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
    backgroundColor: Colors.white,
    borderRadius: 10,
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
    backgroundColor: Colors.frost,
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
    backgroundColor: Colors.white,
    borderRadius: 12,
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
    backgroundColor: Colors.frost,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
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
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 6,
  },
  exploreButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  accountCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountDetails: {
    flex: 1,
  },
  accountEmail: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  syncLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  accountActions: {
    flexDirection: 'row',
    gap: 10,
  },
  accountActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.frost,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center',
  },
  signOutButton: {
    backgroundColor: Colors.danger + '0C',
  },
  accountActionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  signInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '25',
    borderStyle: 'dashed' as const,
  },
  signInLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  signInIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.frost,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInInfo: {
    flex: 1,
  },
  signInTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  signInSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
