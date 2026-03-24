import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
  FlatList,
  Share,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MapPin,
  Mountain,
  TrendingUp,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronDown,
  Share2,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { categoryLabels } from '@/constants/mountains';
import { getMountainImage } from '@/constants/mountainImages';
import { useSummits } from '@/contexts/SummitContext';
import { useCustomMountains } from '@/contexts/CustomMountainsContext';
import { useFindMountain } from '@/hooks/useAllMountains';
import MountainIcon from '@/components/MountainIcon';

const HERO_HEIGHT = 320;

type TabType = 'info' | 'summit';

export default function MountainDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSummited, getSummit, addSummit, removeSummit } = useSummits();
  const { isCustom, removeCustomMountain } = useCustomMountains();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [showDateInput, setShowDateInput] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const tabAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const mountain = useFindMountain(id);
  const summitRecord = useMemo(() => (id ? getSummit(id) : undefined), [id, getSummit]);
  const summited = id ? isSummited(id) : false;

  const heroImageUrl = useMemo(() => {
    if (!mountain) return '';
    return getMountainImage(mountain.id);
  }, [mountain]);

  const switchTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
    Animated.spring(tabAnim, {
      toValue: tab === 'info' ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [tabAnim]);

  const handleSummitYes = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowDateInput(true);
  }, []);

  const MONTHS = useMemo(() => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ], []);

  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedMonth, selectedYear]);

  const DAYS = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const YEARS = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 80 }, (_, i) => currentYear - i);
  }, []);

  const formattedDate = useMemo(() => {
    return `${MONTHS[selectedMonth]} ${selectedDay}, ${selectedYear}`;
  }, [MONTHS, selectedMonth, selectedDay, selectedYear]);

  const closePickers = useCallback(() => {
    setShowMonthPicker(false);
    setShowDayPicker(false);
    setShowYearPicker(false);
  }, []);

  const handleConfirmSummit = useCallback(() => {
    if (!id || !mountain) return;

    addSummit({
      mountainId: id,
      date: formattedDate,
      report: '',
      photoUri: null,
      createdAt: new Date().toISOString(),
    });

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setShowDateInput(false);

    router.push({
      pathname: '/summit-report' as any,
      params: { mountainId: id, mountainName: mountain.name },
    });
  }, [id, mountain, formattedDate, addSummit, router]);

  const handleShareSummit = useCallback(async () => {
    if (!mountain) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const lines = [
      `Summit Achievement!`,
      ``,
      `${mountain.iconEmoji} I summited ${mountain.name}!`,
      `${mountain.country} · ${mountain.range}`,
      `${mountain.elevation.toLocaleString()}m / ${mountain.elevationFt.toLocaleString()}ft`,
      summitRecord?.date ? `${summitRecord.date}` : '',
      summitRecord?.report ? `\n"${summitRecord.report}"` : '',
    ].filter(Boolean).join('\n');
    try {
      await Share.share({ message: lines });
    } catch (e) {
      console.log('Share cancelled or failed', e);
    }
  }, [mountain, summitRecord]);

  const handleRemoveSummit = useCallback(() => {
    if (!id) return;
    Alert.alert(
      'Remove Summit',
      'Are you sure you want to remove this summit record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeSummit(id);
            if (Platform.OS !== 'web') {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
          },
        },
      ]
    );
  }, [id, removeSummit]);

  const handleDeleteMountain = useCallback(() => {
    if (!id) return;
    Alert.alert(
      'Delete Peak',
      'This will permanently delete this custom peak and any summit record. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeSummit(id);
            removeCustomMountain(id);
            if (Platform.OS !== 'web') {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            router.back();
          },
        },
      ]
    );
  }, [id, removeSummit, removeCustomMountain, router]);

  if (!mountain) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Mountain not found</Text>
      </View>
    );
  }

  const categoryColor = Colors.categoryColors[mountain.category] ?? Colors.accent;
  const o2Percentage = Math.max(0, Math.round((1 - (mountain.elevation / 44300)) * 100 * (1 - mountain.elevation * 0.0000165)));
  const effectiveO2 = Math.round(20.9 * o2Percentage / 100 * 10) / 10;

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT / 2],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.3, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.heroImageContainer, { opacity: imageOpacity, transform: [{ scale: imageScale }] }]}>
        <Image
          source={{ uri: heroImageUrl }}
          style={styles.heroImage}
          resizeMode="cover"
        />
      </Animated.View>
      <View style={styles.heroGradientTop} />
      <View style={styles.heroGradientBottom} />

      <View style={[styles.floatingHeader, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft color="#fff" size={22} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        {summited && (
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareSummit}
            activeOpacity={0.7}
            testID="share-summit-button"
          >
            <Share2 color="#fff" size={18} />
          </TouchableOpacity>
        )}
      </View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.heroSpacer} />

        <View style={styles.heroOverlay}>
          <Text style={styles.heroName}>{mountain.name}</Text>
          <Text style={styles.heroLocation}>{mountain.country} · {mountain.range}</Text>
        </View>

        <View style={styles.contentCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mountain.elevation.toLocaleString()}m</Text>
              <Text style={styles.statSub}>{mountain.elevationFt.toLocaleString()}ft</Text>
              <Text style={styles.statLabel}>Elevation</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: categoryColor }]}>{mountain.difficulty}</Text>
              <Text style={styles.statLabel}>Difficulty</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '18' }]}>
                <MountainIcon mountainId={mountain.id} category={mountain.category} size={20} />
              </View>
              <Text style={styles.statLabel}>{categoryLabels[mountain.category]}</Text>
            </View>
          </View>

          {summited && (
            <View style={styles.summitedBanner}>
              <View style={styles.summitedBannerInner}>
                <CheckCircle color="#fff" size={18} />
                <Text style={styles.summitedBannerText}>SUMMITED</Text>
                {summitRecord?.date && (
                  <Text style={styles.summitedBannerDate}> · {summitRecord.date}</Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'info' && styles.tabActive]}
              onPress={() => switchTab('info')}
            >
              <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>Info</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'summit' && styles.tabActive]}
              onPress={() => switchTab('summit')}
            >
              <Text style={[styles.tabText, activeTab === 'summit' && styles.tabTextActive]}>Did You Summit?</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'info' ? (
            <View style={styles.infoContent}>
              <Text style={styles.description}>{mountain.description}</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}><Mountain color={Colors.primary} size={18} /></View>
                  <View style={styles.infoDetail}>
                    <Text style={styles.infoLabel}>Range</Text>
                    <Text style={styles.infoValue}>{mountain.range}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}><Globe color={Colors.primary} size={18} /></View>
                  <View style={styles.infoDetail}>
                    <Text style={styles.infoLabel}>Category</Text>
                    <Text style={styles.infoValue}>{categoryLabels[mountain.category]}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}><MapPin color={Colors.primary} size={18} /></View>
                  <View style={styles.infoDetail}>
                    <Text style={styles.infoLabel}>Coordinates</Text>
                    <Text style={styles.infoValue}>{mountain.latitude.toFixed(4)}°, {mountain.longitude.toFixed(4)}°</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}><Clock color={Colors.primary} size={18} /></View>
                  <View style={styles.infoDetail}>
                    <Text style={styles.infoLabel}>First Ascent</Text>
                    <Text style={styles.infoValue}>{mountain.firstAscent}</Text>
                  </View>
                </View>
                <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.infoIcon}><TrendingUp color={Colors.primary} size={18} /></View>
                  <View style={styles.infoDetail}>
                    <Text style={styles.infoLabel}>O₂ at Summit</Text>
                    <Text style={styles.infoValue}>~{effectiveO2}% effective O₂ ({o2Percentage}% of sea level)</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.summitContent}>
              {summited ? (
                <View style={styles.summitedSection}>
                  <View style={styles.summitSuccessIcon}><CheckCircle color={Colors.success} size={48} /></View>
                  <Text style={styles.summitSuccessTitle}>Summit Recorded!</Text>
                  <Text style={styles.summitSuccessDate}>Date: {summitRecord?.date}</Text>
                  {summitRecord?.report ? (
                    <View style={styles.reportPreview}>
                      <Text style={styles.reportPreviewLabel}>Your Report:</Text>
                      <Text style={styles.reportPreviewText}>{summitRecord.report}</Text>
                    </View>
                  ) : null}
                  <TouchableOpacity
                    style={styles.editReportButton}
                    onPress={() => router.push({ pathname: '/summit-report' as any, params: { mountainId: mountain.id, mountainName: mountain.name } })}
                  >
                    <Text style={styles.editReportText}>{summitRecord?.report ? 'Edit Report & Photo' : 'Add Report & Photo'}</Text>
                    <ChevronRight color={Colors.primary} size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shareReportButton}
                    onPress={handleShareSummit}
                    activeOpacity={0.7}
                  >
                    <Share2 color={Colors.primary} size={16} />
                    <Text style={styles.shareReportText}>Share Summit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeButton} onPress={handleRemoveSummit}>
                    <XCircle color={Colors.danger} size={16} />
                    <Text style={styles.removeButtonText}>Remove Summit</Text>
                  </TouchableOpacity>
                  {id && isCustom(id) && (
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteMountain}>
                      <Trash2 color={Colors.danger} size={16} />
                      <Text style={styles.removeButtonText}>Delete Peak</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.summitQuestion}>
                  {!showDateInput ? (
                    <>
                      {id && isCustom(id) && (
                        <TouchableOpacity style={styles.deleteInlineButton} onPress={handleDeleteMountain}>
                          <Trash2 color={Colors.danger} size={14} />
                          <Text style={styles.deleteInlineText}>Delete Peak</Text>
                        </TouchableOpacity>
                      )}
                      <Text style={styles.questionTitle}>Did you reach the summit?</Text>
                      <Text style={styles.questionSubtitle}>Record your achievement and share your experience</Text>
                      <View style={styles.yesNoRow}>
                        <TouchableOpacity style={styles.yesButton} onPress={handleSummitYes} activeOpacity={0.8}>
                          <Text style={styles.yesButtonText}>Yes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.noButton} onPress={() => switchTab('info')} activeOpacity={0.8}>
                          <Text style={styles.noButtonText}>No</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.dateTitle}>Select Summit Date</Text>

                      <View style={styles.datePickerRow}>
                        <View style={styles.datePickerCol}>
                          <TouchableOpacity
                            style={styles.dateDropdown}
                            onPress={() => { closePickers(); setShowMonthPicker(!showMonthPicker); }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.dateDropdownText}>{MONTHS[selectedMonth].slice(0, 3)}</Text>
                            <ChevronDown color={Colors.primary} size={14} />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.datePickerCol}>
                          <TouchableOpacity
                            style={styles.dateDropdown}
                            onPress={() => { closePickers(); setShowDayPicker(!showDayPicker); }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.dateDropdownText}>{selectedDay}</Text>
                            <ChevronDown color={Colors.primary} size={14} />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.datePickerCol}>
                          <TouchableOpacity
                            style={styles.dateDropdown}
                            onPress={() => { closePickers(); setShowYearPicker(!showYearPicker); }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.dateDropdownText}>{selectedYear}</Text>
                            <ChevronDown color={Colors.primary} size={14} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {showMonthPicker && (
                        <View style={styles.pickerList}>
                          <FlatList
                            data={MONTHS}
                            keyExtractor={(item) => item}
                            style={styles.pickerScroll}
                            renderItem={({ item, index }) => (
                              <TouchableOpacity
                                style={[styles.pickerItem, selectedMonth === index && styles.pickerItemActive]}
                                onPress={() => {
                                  setSelectedMonth(index);
                                  setShowMonthPicker(false);
                                  if (selectedDay > new Date(selectedYear, index + 1, 0).getDate()) {
                                    setSelectedDay(new Date(selectedYear, index + 1, 0).getDate());
                                  }
                                }}
                              >
                                <Text style={[styles.pickerItemText, selectedMonth === index && styles.pickerItemTextActive]}>{item}</Text>
                              </TouchableOpacity>
                            )}
                          />
                        </View>
                      )}

                      {showDayPicker && (
                        <View style={styles.pickerList}>
                          <FlatList
                            data={DAYS}
                            keyExtractor={(item) => item.toString()}
                            style={styles.pickerScroll}
                            renderItem={({ item }) => (
                              <TouchableOpacity
                                style={[styles.pickerItem, selectedDay === item && styles.pickerItemActive]}
                                onPress={() => { setSelectedDay(item); setShowDayPicker(false); }}
                              >
                                <Text style={[styles.pickerItemText, selectedDay === item && styles.pickerItemTextActive]}>{item}</Text>
                              </TouchableOpacity>
                            )}
                          />
                        </View>
                      )}

                      {showYearPicker && (
                        <View style={styles.pickerList}>
                          <FlatList
                            data={YEARS}
                            keyExtractor={(item) => item.toString()}
                            style={styles.pickerScroll}
                            renderItem={({ item }) => (
                              <TouchableOpacity
                                style={[styles.pickerItem, selectedYear === item && styles.pickerItemActive]}
                                onPress={() => {
                                  setSelectedYear(item);
                                  setShowYearPicker(false);
                                  if (selectedDay > new Date(item, selectedMonth + 1, 0).getDate()) {
                                    setSelectedDay(new Date(item, selectedMonth + 1, 0).getDate());
                                  }
                                }}
                              >
                                <Text style={[styles.pickerItemText, selectedYear === item && styles.pickerItemTextActive]}>{item}</Text>
                              </TouchableOpacity>
                            )}
                          />
                        </View>
                      )}

                      <TouchableOpacity style={styles.confirmDateButton} onPress={handleConfirmSummit}>
                        <Text style={styles.confirmDateText}>Continue</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.cancelDateButton} onPress={() => { setShowDateInput(false); closePickers(); }}>
                        <Text style={styles.cancelDateText}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1D30' },
  heroImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT + 40,
    zIndex: 0,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(11, 29, 48, 0.5)',
    zIndex: 1,
  },
  heroGradientBottom: {
    position: 'absolute',
    top: HERO_HEIGHT - 80,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  shareButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  scrollView: { flex: 1, zIndex: 2 },
  scrollContent: { paddingBottom: 40 },
  heroSpacer: { height: HERO_HEIGHT - 80 },
  heroOverlay: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  heroName: {
    fontSize: 30,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroLocation: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500' as const,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  contentCard: {
    backgroundColor: Colors.snow,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 140,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 17, fontWeight: '700' as const, color: Colors.text, marginBottom: 2, textAlign: 'center' as const },
  statSub: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2, textAlign: 'center' as const },
  statLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' as const, textAlign: 'center' as const, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  categoryBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  summitedBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.success,
  },
  summitedBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  summitedBannerText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800' as const,
    letterSpacing: 2,
  },
  summitedBannerDate: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500' as const,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '600' as const, color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  infoContent: { paddingHorizontal: 20 },
  description: { fontSize: 15, color: Colors.text, lineHeight: 24, marginBottom: 24 },
  infoGrid: { backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.frost, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  infoDetail: { flex: 1 },
  infoLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 2, fontWeight: '500' as const },
  infoValue: { fontSize: 14, color: Colors.text, fontWeight: '600' as const },
  summitContent: { paddingHorizontal: 20 },
  summitQuestion: { alignItems: 'center', backgroundColor: Colors.white, borderRadius: 20, padding: 32, borderWidth: 1, borderColor: Colors.border },
  questionTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.text, textAlign: 'center', marginBottom: 8 },
  questionSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 28 },
  yesNoRow: { flexDirection: 'row', gap: 12, width: '100%' },
  yesButton: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 10 },
  yesButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' as const },
  noButton: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  noButtonText: { color: Colors.text, fontSize: 16, fontWeight: '600' as const },
  dateTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text, marginBottom: 20 },
  datePickerRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 12 },
  datePickerCol: { flex: 1 },
  dateDropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.frost, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  dateDropdownText: { color: Colors.text, fontSize: 15, fontWeight: '600' as const },
  pickerList: { width: '100%', backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 12, overflow: 'hidden' },
  pickerScroll: { maxHeight: 180 },
  pickerItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickerItemActive: { backgroundColor: Colors.frost },
  pickerItemText: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center' },
  pickerItemTextActive: { color: Colors.primary, fontWeight: '700' as const },
  confirmDateButton: { width: '100%', paddingVertical: 14, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', marginTop: 8 },
  confirmDateText: { color: Colors.white, fontSize: 15, fontWeight: '700' as const },
  cancelDateButton: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  cancelDateText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' as const },
  summitedSection: { alignItems: 'center', backgroundColor: Colors.white, borderRadius: 20, padding: 32, borderWidth: 1, borderColor: Colors.border },
  summitSuccessIcon: { marginBottom: 16 },
  summitSuccessTitle: { fontSize: 22, fontWeight: '700' as const, color: Colors.success, marginBottom: 8 },
  summitSuccessDate: { fontSize: 15, color: Colors.textSecondary, marginBottom: 20 },
  reportPreview: { width: '100%', backgroundColor: Colors.frost, borderRadius: 12, padding: 16, marginBottom: 16 },
  reportPreviewLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 6, fontWeight: '600' as const },
  reportPreviewText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  editReportButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12 },
  editReportText: { color: Colors.primary, fontSize: 15, fontWeight: '600' as const },
  shareReportButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, marginTop: 4 },
  shareReportText: { color: Colors.primary, fontSize: 14, fontWeight: '600' as const },
  removeButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, marginTop: 8 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: Colors.border, width: '100%', justifyContent: 'center' },
  deleteInlineButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 12, marginBottom: 8 },
  deleteInlineText: { color: Colors.danger, fontSize: 12, fontWeight: '500' as const },
  removeButtonText: { color: Colors.danger, fontSize: 14, fontWeight: '500' as const },
  errorText: { color: Colors.text, fontSize: 16, textAlign: 'center', marginTop: 100 },
});
