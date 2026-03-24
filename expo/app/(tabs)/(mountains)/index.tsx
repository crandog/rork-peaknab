import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Wind, X, ChevronDown, Check, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { categoryLabels, MountainCategory } from '@/constants/mountains';
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
  { key: 'other', label: 'World' },
  { key: 'custom', label: 'My Peaks' },
];

type SortOption = 'name' | 'elevation_desc' | 'elevation_asc';

export default function MountainsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSummited } = useSummits();
  const allMountains = useAllMountains();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MountainCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('elevation_desc');
  const [showSort, setShowSort] = useState(false);

  const filteredMountains = useMemo(() => {
    let filtered = allMountains;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((m) => m.category === selectedCategory);
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
  }, [search, selectedCategory, sortBy, allMountains]);

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
        onPress={() => handleMountainPress(item.id)}
      />
    );
  }, [isSummited, handleMountainPress]);

  const sortLabels: Record<SortOption, string> = {
    name: 'Name A-Z',
    elevation_desc: 'Highest First',
    elevation_asc: 'Lowest First',
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Summit Tracker</Text>
          <View style={styles.titleActions}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddMountain}
              activeOpacity={0.7}
              testID="add-mountain-button"
            >
              <Plus color={Colors.white} size={18} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.o2Button}
              onPress={handleO2Press}
              activeOpacity={0.7}
            >
              <Wind color={Colors.accentLight} size={18} />
              <Text style={styles.o2Text}>O₂</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Search color={Colors.textMuted} size={18} />
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
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSort(!showSort)}
            activeOpacity={0.7}
          >
            <ChevronDown color={Colors.accentLight} size={16} />
            <Text style={styles.sortLabel}>{sortLabels[sortBy]}</Text>
          </TouchableOpacity>
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
                {sortBy === key && <Check color={Colors.accent} size={14} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.key && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item.key && styles.categoryChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </LinearGradient>

      <View style={styles.listContainer}>
        <Text style={styles.resultCount}>
          {filteredMountains.length} peak{filteredMountains.length !== 1 ? 's' : ''}
        </Text>
        <FlatList
          data={filteredMountains}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    paddingBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: -0.5,
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
    backgroundColor: Colors.categoryColors.custom,
    justifyContent: 'center',
    alignItems: 'center',
  },
  o2Button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  o2Text: {
    color: Colors.accentLight,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    paddingVertical: Platform.OS === 'web' ? 10 : 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortLabel: {
    color: Colors.accentLight,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  sortDropdown: {
    marginHorizontal: 20,
    backgroundColor: Colors.cardBgLight,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sortOptionActive: {
    backgroundColor: Colors.cardBg,
  },
  sortOptionText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  sortOptionTextActive: {
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  categoryChipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  listContainer: {
    flex: 1,
  },
  resultCount: {
    color: Colors.textMuted,
    fontSize: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
});
