import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Wind, X, ChevronDown, Check, Plus, ArrowUpDown, Mountain, Trophy } from 'lucide-react-native';
import OxygenInfoButton from '@/components/OxygenInfoButton';
import Colors from '@/constants/colors';
import { MountainCategory, mountainInCategory } from '@/constants/mountains';
import { useSummits } from '@/contexts/SummitContext';
import { useUnits } from '@/contexts/UnitsContext';
import { useAllMountains } from '@/hooks/useAllMountains';
import MountainCard from '@/components/MountainCard';

const categories: Array<{ key: MountainCategory | 'all'; label: string }> = [
  { key: 'all', label: 'All Peaks' },
  { key: '7summits', label: '7 Summits' },
  { key: '8000m', label: '8000m' },
  { key: 'volcanic', label: 'Volcanic' },
  { key: '14ers', label: 'Colorado 14ers' },
  { key: 'alps', label: 'Alps' },
  { key: 'andes', label: 'Andes' },
  { key: 'himalaya', label: 'Himalaya' },
  { key: 'custom', label: 'My Peaks' },
];

type SortOption = 'name' | 'elevation_desc' | 'elevation_asc';

// Notes shown under the chips for categories that need explanation.
const categoryNotes: Partial<Record<MountainCategory, string>> = {
  '7summits': 'Includes both Carstensz Pyramid and Mount Kosciuszko, the two accepted versions of the list.',
  '14ers': "A selection of Colorado's best-known 14ers.",
};

const FIRST_SUMMIT_HINT_KEY = 'peaknab.first-summit-hint-dismissed';

export default function MountainsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSummited, getSummit, getSummitCount, summitCount } = useSummits();
  const allMountains = useAllMountains();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MountainCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('elevation_desc');
  const [showSort, setShowSort] = useState(false);
  const { useFeet, setUseFeet } = useUnits();
  const [summitedOnly, setSummitedOnly] = useState<boolean>(false);
  // null = not loaded yet (banner stays hidden until we know)
  const [hintDismissed, setHintDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(FIRST_SUMMIT_HINT_KEY)
      .then((v) => {
        if (active) setHintDismissed(v === 'true');
      })
      .catch(() => {
        if (active) setHintDismissed(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const dismissHint = useCallback(() => {
    setHintDismissed(true);
    void AsyncStorage.setItem(FIRST_SUMMIT_HINT_KEY, 'true').catch(() => {});
  }, []);

  // Hidden forever once dismissed or once any summit exists.
  const showFirstRunHint = hintDismissed === false && summitCount === 0;

  const filteredMountains = useMemo(() => {
    let filtered = allMountains;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((m) => mountainInCategory(m, selectedCategory));
    }

    if (summitedOnly) {
      filtered = filtered.filter((m) => isSummited(m.id));
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.country.toLowerCase().includes(q) ||
          m.range.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'name':
        return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      case 'elevation_asc':
        return [...filtered].sort((a, b) => a.elevation - b.elevation);
      case 'elevation_desc':
      default:
        return [...filtered].sort((a, b) => b.elevation - a.elevation);
    }
  }, [search, selectedCategory, sortBy, allMountains, summitedOnly, isSummited]);

  const handleMountainPress = useCallback((id: string) => {
    router.push(`/mountain/${id}` as any);
  }, [router]);

  const handleO2Press = useCallback(() => {
    router.push('/o2-equivalent' as any);
  }, [router]);

  const handleAddMountain = useCallback(() => {
    router.push('/add-mountain' as any);
  }, [router]);

  const handleSelectCategory = useCallback(
    (key: MountainCategory | 'all') => {
      if (key === 'all') {
        // "All Peaks" clears everything.
        setSelectedCategory('all');
        setSummitedOnly(false);
        return;
      }
      // Tapping the active category again turns it off.
      setSelectedCategory((prev) => (prev === key ? 'all' : key));
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setSelectedCategory('all');
    setSummitedOnly(false);
  }, []);

  const renderItem = useCallback(({ item }: { item: typeof allMountains[0] }) => {
    return (
      <MountainCard
        mountain={item}
        isSummited={isSummited(item.id)}
        summitDate={getSummit(item.id)?.date}
        summitCount={getSummitCount(item.id)}
        onPress={() => handleMountainPress(item.id)}
        useFeet={useFeet}
      />
    );
  }, [isSummited, getSummit, getSummitCount, handleMountainPress, useFeet]);

  const sortLabels: Record<SortOption, string> = {
    name: 'Name A-Z',
    elevation_desc: 'Highest First',
    elevation_asc: 'Lowest First',
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/e154lkqvikg84q9a05bjl' }}
        cachePolicy="memory-disk"
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.backgroundOverlay} />

      <Image
        source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ce56ixcq6dwvfeks1eq19' }}
        cachePolicy="memory-disk"
        style={styles.bottomBackground}
        resizeMode="cover"
      />
      <View style={styles.bottomOverlay} />

      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <View style={styles.titleRow}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/icon.png')}
              style={styles.logoIcon}
              resizeMode="cover"
            />
            <View>
              <Text style={styles.title}>
                <Text style={styles.titleBold}>Peak</Text>
                <Text style={styles.titleAccent}>Nab</Text>
              </Text>
            </View>
          </View>
          <View style={styles.titleActions}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddMountain}
              activeOpacity={0.7}
              testID="add-mountain-button"
            >
              <Plus color="#1A3350" size={18} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.o2Button}
              onPress={handleO2Press}
              activeOpacity={0.7}
            >
              <Wind color="#1A3350" size={16} />
              <Text style={styles.o2Text}>O₂</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Search color={Colors.textMuted} size={16} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search peaks, countries, ranges..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <X color={Colors.textMuted} size={16} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScrollView}
          contentContainerStyle={styles.categoryList}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              styles.summitedChip,
              summitedOnly && styles.categoryChipActive,
            ]}
            onPress={() => setSummitedOnly((p) => !p)}
            activeOpacity={0.7}
            testID="summited-filter-button"
          >
            <Trophy color={summitedOnly ? Colors.white : Colors.textSecondary} size={12} />
            <Text
              style={[
                styles.categoryChipText,
                summitedOnly && styles.categoryChipTextActive,
              ]}
            >
              Summited
            </Text>
          </TouchableOpacity>
          <View style={styles.chipDivider} />
          {categories.map((item) => {
            const isActive = selectedCategory === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.categoryChip,
                  isActive && styles.categoryChipActive,
                ]}
                onPress={() => handleSelectCategory(item.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isActive && styles.categoryChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {selectedCategory !== 'all' && categoryNotes[selectedCategory] && (
          <Text style={styles.categoryNote}>{categoryNotes[selectedCategory]}</Text>
        )}

        </View>

      {/* Mountains list */}
      <View style={styles.mountainsSection}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.resultCount}>
            {summitedOnly
              ? `${filteredMountains.length} summited${
                  selectedCategory !== 'all'
                    ? ` · ${categories.find((c) => c.key === selectedCategory)?.label ?? ''}`
                    : ''
                }`
              : `${filteredMountains.length} peak${filteredMountains.length !== 1 ? 's' : ''}`}
          </Text>
          <View style={styles.listHeaderRight}>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setShowSort(!showSort)}
              activeOpacity={0.7}
            >
              <ChevronDown color={Colors.primary} size={14} />
              <Text style={styles.sortLabel}>{sortLabels[sortBy]}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.unitToggleBtn}
              onPress={() => setUseFeet(!useFeet)}
              activeOpacity={0.7}
              testID="unit-toggle-button"
            >
              <ArrowUpDown color={Colors.primary} size={13} />
              <Text style={styles.unitToggleBtnText}>{useFeet ? 'FT' : 'M'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showSort && (
          <View style={styles.sortDropdown}>
            {(Object.keys(sortLabels) as SortOption[]).map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.sortOption, sortBy === key && styles.sortOptionActive]}
                onPress={() => {
                  setSortBy(key);
                  setShowSort(false);
                }}
              >
                <Text style={[styles.sortOptionText, sortBy === key && styles.sortOptionTextActive]}>
                  {sortLabels[key]}
                </Text>
                {sortBy === key && <Check color={Colors.primary} size={14} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <FlatList
          data={filteredMountains}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          style={styles.mountainList}
          ListHeaderComponent={
            showFirstRunHint ? (
              <View style={styles.hintBanner}>
                <Mountain color={Colors.primary} size={16} />
                <Text style={styles.hintBannerText}>Tap any peak to log a summit.</Text>
                <TouchableOpacity
                  onPress={dismissHint}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  testID="dismiss-first-run-hint"
                >
                  <X color={Colors.textMuted} size={16} />
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Mountain color={Colors.primary} size={34} />
              </View>
              <Text style={styles.emptyTitle}>No peaks found</Text>
              <Text style={styles.emptyText}>
                {search.trim()
                  ? `Nothing matches “${search.trim()}”`
                  : summitedOnly
                    ? "You haven't summited any peaks in this list yet"
                    : 'No peaks in this category'}
              </Text>
              <TouchableOpacity
                style={styles.emptyClearButton}
                onPress={handleClearFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyClearButtonText}>Clear filters</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 215,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 215,
    backgroundColor: 'rgba(180, 205, 230, 0.25)',
  },
  bottomBackground: {
    display: 'none',
  },
  bottomOverlay: {
    display: 'none',
  },
  header: {
    paddingBottom: 8,
    zIndex: 2,
  },
  chipScrollView: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 0,
    paddingBottom: 2,
    backgroundColor: 'transparent',
  },
  mountainsSection: {
    flex: 1,
    backgroundColor: Colors.white,
    marginTop: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 0,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(200,215,230,0.35)',
  },
  mountainList: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  logoContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    color: Colors.white,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  titleBold: {
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  titleAccent: {
    fontWeight: '400' as const,
    fontStyle: 'italic' as const,
    letterSpacing: 0.5,
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  o2Button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  o2Text: {
    color: '#1A3350',
    fontSize: 13,
    fontWeight: '700' as const,
  },
  searchRow: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    paddingVertical: Platform.OS === 'web' ? 10 : 11,
  },
  sortDropdown: {
    marginHorizontal: 20,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sortOptionActive: {
    backgroundColor: Colors.frost,
  },
  sortOptionText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  sortOptionTextActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 0,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(200,215,230,0.45)',
    minHeight: 36,
    justifyContent: 'center' as const,
    overflow: 'hidden',
  },
  summitedChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  chipDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(200,215,230,0.9)',
    alignSelf: 'center' as const,
    marginRight: 8,
  },
  categoryNote: {
    paddingHorizontal: 20,
    paddingTop: 6,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
  },
  hintBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: Colors.frost,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hintBannerText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 56,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.frost,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  emptyClearButton: {
    backgroundColor: Colors.frost,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 18,
  },
  emptyClearButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: 'transparent',
    elevation: 0,
  },
  categoryChipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  categoryChipTextActive: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  listHeaderRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border + '50',
  },
  listHeaderRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  resultCount: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500' as const,
  },
  sortButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.frost,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    gap: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortLabel: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600' as const,
  },
  summitedBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.frost,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summitedBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  summitedBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  summitedBtnTextActive: {
    color: Colors.white,
  },
  unitToggleBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.frost,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    gap: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unitToggleBtnText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  list: {
    paddingBottom: 120,
  },
});
