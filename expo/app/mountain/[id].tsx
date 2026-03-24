import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
  FlatList,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Info,
  Flag,
  MapPin,
  Calendar,
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
import { useSummits } from '@/contexts/SummitContext';
import { useCustomMountains } from '@/contexts/CustomMountainsContext';
import { useFindMountain } from '@/hooks/useAllMountains';
import MountainIcon from '@/components/MountainIcon';

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

  const mountain = useFindMountain(id);
  const summitRecord = useMemo(() => (id ? getSummit(id) : undefined), [id, getSummit]);
  const summited = id ? isSummited(id) : false;

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const lines = [
      `🏔️ Summit Achievement!`,
      ``,
      `${mountain.iconEmoji} I summited ${mountain.name}!`,
      `📍 ${mountain.country} · ${mountain.range}`,
      `📏 ${mountain.elevation.toLocaleString()}m / ${mountain.elevationFt.toLocaleString()}ft`,
      summitRecord?.date ? `📅 ${summitRecord.date}` : '',
      summitRecord?.report ? `\n📝 "${summitRecord.report}"` : '',
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
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A1A2E', '#1E2240', '#1A1A2E']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft color={Colors.text} size={22} />
          </TouchableOpacity>
          {summited && (
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShareSummit}
              activeOpacity={0.7}
              testID="share-summit-button"
            >
              <Share2 color={Colors.white} size={20} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.heroSection}>
          <View style={[styles.heroIcon, { backgroundColor: categoryColor + '15' }]}>
            <MountainIcon mountainId={mountain.id} category={mountain.category} size={40} />
          </View>
          <Text style={styles.heroName}>{mountain.name}</Text>
          <Text style={styles.heroLocation}>{mountain.country}</Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{mountain.elevation.toLocaleString()}m / {mountain.elevationFt.toLocaleString()}ft</Text>
              <Text style={styles.heroStatLabel}>Elevation</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: categoryColor }]}>{mountain.difficulty}</Text>
              <Text style={styles.heroStatLabel}>Difficulty</Text>
            </View>
          </View>
          {summited && (
            <View style={styles.summitedBadge}>
              <CheckCircle color={Colors.success} size={16} />
              <Text style={styles.summitedText}>Summited {summitRecord?.date}</Text>
            </View>
          )}
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.tabActive]}
            onPress={() => switchTab('info')}
          >
            <Info color={activeTab === 'info' ? Colors.accent : Colors.textMuted} size={18} />
            <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>Info</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'summit' && styles.tabActive]}
            onPress={() => switchTab('summit')}
          >
            <Flag color={activeTab === 'summit' ? Colors.accent : Colors.textMuted} size={18} />
            <Text style={[styles.tabText, activeTab === 'summit' && styles.tabTextActive]}>Did You Summit?</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'info' ? (
          <View style={styles.infoContent}>
            <Text style={styles.description}>{mountain.description}</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}><Mountain color={Colors.accent} size={18} /></View>
                <View style={styles.infoDetail}>
                  <Text style={styles.infoLabel}>Range</Text>
                  <Text style={styles.infoValue}>{mountain.range}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}><Globe color={Colors.accent} size={18} /></View>
                <View style={styles.infoDetail}>
                  <Text style={styles.infoLabel}>Category</Text>
                  <Text style={styles.infoValue}>{categoryLabels[mountain.category]}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}><MapPin color={Colors.accent} size={18} /></View>
                <View style={styles.infoDetail}>
                  <Text style={styles.infoLabel}>Coordinates</Text>
                  <Text style={styles.infoValue}>{mountain.latitude.toFixed(4)}°, {mountain.longitude.toFixed(4)}°</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}><Clock color={Colors.accent} size={18} /></View>
                <View style={styles.infoDetail}>
                  <Text style={styles.infoLabel}>First Ascent</Text>
                  <Text style={styles.infoValue}>{mountain.firstAscent}</Text>
                </View>
              </View>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <View style={styles.infoIcon}><TrendingUp color={Colors.accent} size={18} /></View>
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
                  <ChevronRight color={Colors.accent} size={16} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.shareReportButton}
                  onPress={handleShareSummit}
                  activeOpacity={0.7}
                >
                  <Share2 color={Colors.accent} size={16} />
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
                    <Text style={styles.questionEmoji}>⛰️</Text>
                    <Text style={styles.questionTitle}>Did you summit {mountain.name}?</Text>
                    <Text style={styles.questionSubtitle}>Record your achievement and share your experience</Text>
                    <View style={styles.yesNoRow}>
                      <TouchableOpacity style={styles.yesButton} onPress={handleSummitYes} activeOpacity={0.8}>
                        <CheckCircle color={Colors.white} size={22} />
                        <Text style={styles.yesButtonText}>Yes!</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.noButton} onPress={() => switchTab('info')} activeOpacity={0.8}>
                        <XCircle color={Colors.textSecondary} size={22} />
                        <Text style={styles.noButtonText}>Not Yet</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <Calendar color={Colors.accent} size={40} />
                    <Text style={styles.dateTitle}>When did you summit?</Text>

                    <View style={styles.datePickerRow}>
                      <View style={styles.datePickerCol}>
                        <Text style={styles.datePickerLabel}>Month</Text>
                        <TouchableOpacity
                          style={styles.dateDropdown}
                          onPress={() => { closePickers(); setShowMonthPicker(!showMonthPicker); }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.dateDropdownText}>{MONTHS[selectedMonth].slice(0, 3)}</Text>
                          <ChevronDown color={Colors.accent} size={14} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.datePickerCol}>
                        <Text style={styles.datePickerLabel}>Day</Text>
                        <TouchableOpacity
                          style={styles.dateDropdown}
                          onPress={() => { closePickers(); setShowDayPicker(!showDayPicker); }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.dateDropdownText}>{selectedDay}</Text>
                          <ChevronDown color={Colors.accent} size={14} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.datePickerCol}>
                        <Text style={styles.datePickerLabel}>Year</Text>
                        <TouchableOpacity
                          style={styles.dateDropdown}
                          onPress={() => { closePickers(); setShowYearPicker(!showYearPicker); }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.dateDropdownText}>{selectedYear}</Text>
                          <ChevronDown color={Colors.accent} size={14} />
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

                    <Text style={styles.selectedDatePreview}>{formattedDate}</Text>

                    <View style={styles.dateButtonRow}>
                      <TouchableOpacity style={styles.cancelDateButton} onPress={() => { setShowDateInput(false); closePickers(); }}>
                        <Text style={styles.cancelDateText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.confirmDateButton} onPress={handleConfirmSummit}>
                        <Text style={styles.confirmDateText}>Continue →</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  errorText: { color: Colors.text, fontSize: 16, textAlign: 'center', marginTop: 100 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 8 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.cardBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  shareButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center' },
  heroSection: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
  heroIcon: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroName: { fontSize: 28, fontWeight: '900' as const, color: Colors.text, textAlign: 'center', marginBottom: 4, letterSpacing: -0.5 },
  heroLocation: { fontSize: 15, color: Colors.textSecondary, marginBottom: 20 },
  heroStats: { flexDirection: 'row', backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, width: '100%' },
  heroStat: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroStatValue: { fontSize: 18, fontWeight: '800' as const, color: Colors.accentLight, marginBottom: 4, textAlign: 'center' as const },
  heroStatLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' as const, textAlign: 'center' as const },
  heroDivider: { width: 1, backgroundColor: Colors.border },
  summitedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: Colors.success + '12', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.success + '25' },
  summitedText: { color: Colors.success, fontSize: 13, fontWeight: '600' as const },
  tabBar: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: Colors.cardBg, borderRadius: 14, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  tabActive: { backgroundColor: Colors.cardBgLight },
  tabText: { fontSize: 14, fontWeight: '600' as const, color: Colors.textMuted },
  tabTextActive: { color: Colors.accent },
  infoContent: { paddingHorizontal: 20 },
  description: { fontSize: 15, color: Colors.text, lineHeight: 24, marginBottom: 24 },
  infoGrid: { gap: 0, backgroundColor: Colors.cardBg, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.accent + '12', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  infoDetail: { flex: 1 },
  infoLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 2, fontWeight: '500' as const },
  infoValue: { fontSize: 14, color: Colors.text, fontWeight: '600' as const },
  summitContent: { paddingHorizontal: 20 },
  summitQuestion: { alignItems: 'center', backgroundColor: Colors.cardBg, borderRadius: 20, padding: 32, borderWidth: 1, borderColor: Colors.border },
  questionEmoji: { fontSize: 48, marginBottom: 16 },
  questionTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.text, textAlign: 'center', marginBottom: 8 },
  questionSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 28 },
  yesNoRow: { flexDirection: 'row', gap: 12, width: '100%' },
  yesButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.success, paddingVertical: 14, borderRadius: 14, gap: 8 },
  yesButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' as const },
  noButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cardBgLight, paddingVertical: 14, borderRadius: 14, gap: 8, borderWidth: 1, borderColor: Colors.border },
  noButtonText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '600' as const },
  dateTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text, marginTop: 16, marginBottom: 20 },
  datePickerRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 12 },
  datePickerCol: { flex: 1 },
  datePickerLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' as const, marginBottom: 6, textAlign: 'center' },
  dateDropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cardBgLight, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  dateDropdownText: { color: Colors.text, fontSize: 15, fontWeight: '600' as const },
  pickerList: { width: '100%', backgroundColor: Colors.cardBgLight, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 12, overflow: 'hidden' },
  pickerScroll: { maxHeight: 180 },
  pickerItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickerItemActive: { backgroundColor: Colors.accent + '15' },
  pickerItemText: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center' },
  pickerItemTextActive: { color: Colors.accent, fontWeight: '700' as const },
  selectedDatePreview: { color: Colors.accentLight, fontSize: 16, fontWeight: '600' as const, marginBottom: 20, textAlign: 'center' },
  dateButtonRow: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelDateButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.cardBgLight, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  cancelDateText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' as const },
  confirmDateButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.accent, alignItems: 'center' },
  confirmDateText: { color: Colors.white, fontSize: 15, fontWeight: '700' as const },
  summitedSection: { alignItems: 'center', backgroundColor: Colors.cardBg, borderRadius: 20, padding: 32, borderWidth: 1, borderColor: Colors.border },
  summitSuccessIcon: { marginBottom: 16 },
  summitSuccessTitle: { fontSize: 22, fontWeight: '700' as const, color: Colors.success, marginBottom: 8 },
  summitSuccessDate: { fontSize: 15, color: Colors.textSecondary, marginBottom: 20 },
  reportPreview: { width: '100%', backgroundColor: Colors.cardBgLight, borderRadius: 12, padding: 16, marginBottom: 16 },
  reportPreviewLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 6, fontWeight: '600' as const },
  reportPreviewText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  editReportButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12 },
  editReportText: { color: Colors.accent, fontSize: 15, fontWeight: '600' as const },
  shareReportButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, marginTop: 4 },
  shareReportText: { color: Colors.accent, fontSize: 14, fontWeight: '600' as const },
  removeButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, marginTop: 8 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: Colors.border, width: '100%', justifyContent: 'center' },
  deleteInlineButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 12, marginBottom: 8 },
  deleteInlineText: { color: Colors.danger, fontSize: 12, fontWeight: '500' as const },
  removeButtonText: { color: Colors.danger, fontSize: 14, fontWeight: '500' as const },
});
