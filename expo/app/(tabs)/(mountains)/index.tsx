import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Wind, X, ChevronDown, Check, Plus, ArrowUpDown, Mountain, Trophy } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { MountainCategory } from '@/constants/mountains';
import { useSummits } from '@/contexts/SummitContext';
import { useAllMountains } from '@/hooks/useAllMountains';
import MountainCard from '@/components/MountainCard';

const categories: Array<{ key: MountainCategory | 'all'; label: string }> = [
  { key: 'all', label: 'All Peaks' },
  { key: '7summits', label: '7 Summits' },
  { key: '8000m', label: '8000m' },
  { key: '14ers', label: '14ers' },
  { key: 'alps', label: 'Alps' },
  { key: 'andes', label: 'Andes' },
  { key: 'himalaya', label: 'Himalaya' },
  { key: 'custom', label: 'My Peaks' },
];

type SortOption = 'name' | 'elevation_desc' | 'elevation_asc';

export default function MountainsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSummited, getSummit, getSummitCount } = useSummits();
  const allMountains = useAllMountains();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MountainCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('elevation_desc');
  const [showSort, setShowSort] = useState(false);
  const [useFeet, setUseFeet] = useState(false);
  const [summitedOnly, setSummitedOnly] = useState<boolean>(false);

  const filteredMountains = useMemo(() => {
    let filtered = allMountains;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((m) => m.category === selectedCategory);
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
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.backgroundOverlay} />

      <Image
        source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ce56ixcq6dwvfeks1eq19' }}
        style={styles.bottomBackground}
        resizeMode="cover"
      />
      <View style={styles.bottomOverlay} />

      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <View style={styles.titleRow}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://r2-pub.rork.com/attachments/yysoti63i6d0rv4sldqgm.png' }}
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

        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.categoryList}
          ListHeaderComponent={
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
          }
          renderItem={({ item }) => {
            const isActive = selectedCategory === item.key;
            return (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  isActive && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(item.key)}
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
          }}
        />

        <View style={styles.listHeaderRow}>
          <Text style={styles.resultCount}>
            {filteredMountains.length} peak{filteredMountains.length !== 1 ? 's' : ''}
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
              onPress={() => setUseFeet(prev => !prev)}
              activeOpacity={0.7}
              testID="unit-toggle-button"
            >
              <ArrowUpDown color={Colors.primary} size={13} />
              <Text style={styles.unitToggleBtnText}>{useFeet ? 'FT' : 'M'}</Text>
            </TouchableOpacity>
          </View>
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
        style={styles.flatList}
      />
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
    height: 180,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: 'rgba(180, 205, 230, 0.25)',
  },
  bottomBackground: {
    display: 'none',
  },
  bottomOverlay: {
    display: 'none',
  },
  header: {
    paddingBottom: 0,
    zIndex: 2,
  },
  flatList: {
    zIndex: 1,
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
    paddingBottom: 2,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    minHeight: 36,
    justifyContent: 'center' as const,
  },
  summitedChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
    paddingTop: 0,
    paddingBottom: 0,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortLabel: {
    color: Colors.primary,
    fontSize: 12,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unitToggleBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  list: {
    paddingBottom: 120,
  },
});
