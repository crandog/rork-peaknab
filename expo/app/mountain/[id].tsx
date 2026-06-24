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
import { Image as ExpoImage } from 'expo-image';
import {
  ArrowLeft,
  MapPin,
  Mountain,
  TrendingUp,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  Share2,
  Trash2,
  PlusCircle,
  FileText,
  Calendar,
  Camera,
  GitBranch,
  Home,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { categoryLabels } from '@/constants/mountains';
import { getMountainImage } from '@/constants/mountainImages';
import { useSummits, SummitRecord } from '@/contexts/SummitContext';
import { useCustomMountains } from '@/contexts/CustomMountainsContext';
import { useFindMountain } from '@/hooks/useAllMountains';
import MountainIcon from '@/components/MountainIcon';

const HERO_HEIGHT = 320;

type TabType = 'info' | 'summit';

export default function MountainDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSummited, getSummitsForMountain, getSummitCount, addSummit, removeSummit, removeSingleSummit } = useSummits();
  const { isCustom, removeCustomMountain } = useCustomMountains();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [showDateInput, setShowDateInput] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [imageError, setImageError] = useState(false);
  const tabAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const mountain = useFindMountain(id);
  const summitRecords = useMemo(() => (id ? getSummitsForMountain(id) : []), [id, getSummitsForMountain]);
  const summited = id ? isSummited(id) : false;
  const summitCountVal = id ? getSummitCount(id) : 0;

  const heroImageUrl = useMemo(() => {
    if (!mountain) return '';
    return getMountainImage(mountain.id);
  }, [mountain]);

  const fallbackImageUrl = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=960&q=80';

  const tabLabel = useMemo(() => {
    if (summited) return 'Summit Report';
    return 'Did You Summit?';
  }, [summited]);

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

    const createdAt = new Date().toISOString();

    addSummit({
      mountainId: id,
      date: formattedDate,
      report: '',
      photoUri: null,
      createdAt,
    });

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setShowDateInput(false);

    router.push({
      pathname: '/summit-report' as any,
      params: { mountainId: id, mountainName: mountain.name, createdAt },
    });
  }, [id, mountain, formattedDate, addSummit, router]);

  const handleShareSummit = useCallback(async () => {
    if (!mountain) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const latestRecord = summitRecords[summitRecords.length - 1];
    const lines = [
      `Summit Achievement!`,
      ``,
      `${mountain.iconEmoji} I summited ${mountain.name}${summitCountVal > 1 ? ` (x${summitCountVal})` : ''}!`,
      `${mountain.country} · ${mountain.range}`,
      `${mountain.elevation.toLocaleString()}m / ${mountain.elevationFt.toLocaleString()}ft`,
      latestRecord?.date ? `${latestRecord.date}` : '',
      latestRecord?.report ? `\n"${latestRecord.report}"` : '',
    ].filter(Boolean).join('\n');
    try {
      await Share.share({ message: lines });
    } catch (e) {
      console.log('Share cancelled or failed', e);
    }
  }, [mountain, summitRecords, summitCountVal]);

  const handleRemoveAllSummits = useCallback(() => {
    if (!id) return;
    Alert.alert(
      'Remove All Summits',
      `Are you sure you want to remove all ${summitCountVal} summit record${summitCountVal > 1 ? 's' : ''} for this mountain?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove All',
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
  }, [id, summitCountVal, removeSummit]);

  const handleRemoveSingleSummit = useCallback((record: SummitRecord) => {
    if (!id) return;
    Alert.alert(
      'Remove Summit',
      `Remove summit from ${record.date}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeSingleSummit(id, record.createdAt);
            if (Platform.OS !== 'web') {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
          },
        },
      ]
    );
  }, [id, removeSingleSummit]);

  const handleDeleteMountain = useCallback(() => {
    if (!id) return;
    Alert.alert(
      'Delete Peak',
      'This will permanently delete this custom peak and any summit records. Continue?',
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

  const handleAnotherSummit = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowDateInput(true);
  }, []);

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

  const renderSummitReportCard = (record: SummitRecord, index: number) => {
    return (
      <View key={record.createdAt} style={styles.reportCard}>
        <View style={styles.reportCardHeader}>
          <View style={styles.reportCardHeaderLeft}>
            <View style={styles.reportNumberBadge}>
              <Text style={styles.reportNumberText}>#{index + 1}</Text>
            </View>
            <View>
              <View style={styles.reportDateRow}>
                <Calendar color={Colors.primary} size={13} />
                <Text style={styles.reportCardDate}>{record.date}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.reportEditButton}
            onPress={() => router.push({
              pathname: '/summit-report' as any,
              params: { mountainId: mountain.id, mountainName: mountain.name, createdAt: record.createdAt },
            })}
            activeOpacity={0.7}
          >
            <FileText color={Colors.primary} size={14} />
            <Text style={styles.reportEditText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {record.photoUri && (
          <View style={styles.reportPhotoContainer}>
            <ExpoImage
              source={{ uri: record.photoUri }}
              style={styles.reportPhoto}
              contentFit="cover"
            />
          </View>
        )}

        {record.report ? (
          <View style={styles.reportTextContainer}>
            <Text style={styles.reportText} numberOfLines={4}>{record.report}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addReportPrompt}
            onPress={() => router.push({
              pathname: '/summit-report' as any,
              params: { mountainId: mountain.id, mountainName: mountain.name, createdAt: record.createdAt },
            })}
            activeOpacity={0.7}
          >
            <Camera color={Colors.textMuted} size={16} />
            <Text style={styles.addReportPromptText}>Add notes & photo</Text>
          </TouchableOpacity>
        )}

        <View style={styles.reportCardActions}>
          <TouchableOpacity
            style={styles.reportActionButton}
            onPress={() => handleRemoveSingleSummit(record)}
            activeOpacity={0.7}
          >
            <XCircle color={Colors.danger} size={14} />
            <Text style={styles.reportActionTextDanger}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.heroImageContainer, { opacity: imageOpacity, transform: [{ scale: imageScale }] }]}>
        <Image
          source={{ uri: imageError ? fallbackImageUrl : heroImageUrl }}
          style={styles.heroImage}
          resizeMode="cover"
          onError={() => {
            console.log('Hero image failed to load for:', mountain?.id);
            setImageError(true);
          }}
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
                {summitCountVal > 1 && (
                  <View style={styles.summitCountChip}>
                    <Text style={styles.summitCountChipText}>x{summitCountVal}</Text>
                  </View>
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
              <Text style={[styles.tabText, activeTab === 'summit' && styles.tabTextActive]}>{tabLabel}</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'info' ? (
            <View style={styles.infoContent}>
              <Text style={styles.description}>{mountain.description}</Text>

              {mountain.routes && mountain.routes.length > 0 && (
                <View style={styles.routesSection}>
                  <View style={styles.sectionHeader}>
                    <GitBranch color={Colors.primary} size={16} />
                    <Text style={styles.sectionHeaderText}>Common Routes</Text>
                  </View>
                  <View style={styles.routesList}>
                    {mountain.routes.map((route: string, idx: number) => (
                      <View key={idx} style={styles.routeChip}>
                        <Text style={styles.routeChipText}>{route}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {mountain.camps && mountain.camps.length > 0 && (
                <View style={styles.campsSection}>
                  <View style={styles.sectionHeader}>
                    <Home color={Colors.primary} size={16} />
                    <Text style={styles.sectionHeaderText}>Camps</Text>
                  </View>
                  <View style={styles.campsList}>
                    {mountain.camps.map((camp, idx: number) => (
                      <View key={idx} style={styles.campRow}>
                        <View style={styles.campDot} />
                        <View style={styles.campInfo}>
                          <Text style={styles.campName}>{camp.name}</Text>
                          <Text style={styles.campElevation}>{camp.elevation.toLocaleString()}m</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

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
                <View style={styles.summitReportSection}>
                  {summitRecords.map((record, index) => renderSummitReportCard(record, index))}

                  {!showDateInput && (
                    <TouchableOpacity
                      style={styles.anotherSummitButton}
                      onPress={handleAnotherSummit}
                      activeOpacity={0.8}
                    >
                      <PlusCircle color={Colors.primary} size={20} />
                      <Text style={styles.anotherSummitText}>Another Summit?</Text>
                    </TouchableOpacity>
                  )}

                  {showDateInput && (
                    <View style={styles.dateInputCard}>
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
                    </View>
                  )}

                  <View style={styles.summitActionsRow}>
                    <TouchableOpacity
                      style={styles.shareReportButton}
                      onPress={handleShareSummit}
                      activeOpacity={0.7}
                    >
                      <Share2 color={Colors.primary} size={16} />
                      <Text style={styles.shareReportText}>Share Summit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removeAllButton} onPress={handleRemoveAllSummits}>
                      <XCircle color={Colors.danger} size={16} />
                      <Text style={styles.removeButtonText}>Remove All</Text>
                    </TouchableOpacity>
                  </View>

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

        <View style={styles.bottomImageContainer}>
          <Image
            source={{ uri: imageError ? fallbackImageUrl : heroImageUrl }}
            style={styles.bottomImage}
            resizeMode="cover"
          />
          <View style={styles.bottomImageOverlay} />
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
  scrollContent: { paddingBottom: 0 },
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
    paddingBottom: 60,
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
  summitCountChip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  summitCountChipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800' as const,
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
  summitReportSection: {
    gap: 12,
  },
  reportCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  reportCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reportNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportNumberText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  reportDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reportCardDate: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  reportEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.frost,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reportEditText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  reportPhotoContainer: {
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
  reportPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },
  reportTextContainer: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  reportText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  addReportPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 14,
    marginTop: 10,
    paddingVertical: 14,
    backgroundColor: Colors.frost,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addReportPromptText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  reportCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  reportActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  reportActionTextDanger: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.danger,
  },
  anotherSummitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
    borderStyle: 'dashed',
  },
  anotherSummitText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  dateInputCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  summitActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 8,
  },
  shareReportButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12 },
  shareReportText: { color: Colors.primary, fontSize: 14, fontWeight: '600' as const },
  removeAllButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12 },
  removeButtonText: { color: Colors.danger, fontSize: 14, fontWeight: '500' as const },
  deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, justifyContent: 'center', marginTop: 4 },
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
  deleteInlineButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 12, marginBottom: 8 },
  deleteInlineText: { color: Colors.danger, fontSize: 12, fontWeight: '500' as const },
  bottomImageContainer: {
    width: '100%',
    height: 260,
    overflow: 'hidden',
  },
  bottomImage: {
    width: '100%',
    height: '100%',
  },
  bottomImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 29, 48, 0.35)',
  },
  errorText: { color: Colors.text, fontSize: 16, textAlign: 'center', marginTop: 100 },
  routesSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  campsSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  routesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  routeChip: {
    backgroundColor: Colors.frost,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  routeChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  campsList: {
    gap: 0,
  },
  campRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  campDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  campInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  campName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  campElevation: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
});
