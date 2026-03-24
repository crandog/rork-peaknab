import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  X,
  Mountain as MountainIcon,
  MapPin,
  TrendingUp,
  Globe,
  Layers,
  Check,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Mountain as MountainType, MountainCategory } from '@/constants/mountains';
import { useCustomMountains } from '@/contexts/CustomMountainsContext';

const DIFFICULTY_OPTIONS = ['Easy', 'Moderate', 'Hard', 'Extreme'] as const;

export default function AddMountainScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addCustomMountain } = useCustomMountains();

  const [name, setName] = useState('');
  const [elevation, setElevation] = useState('');
  const [country, setCountry] = useState('');
  const [range, setRange] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [difficulty, setDifficulty] = useState<string>('Moderate');
  const [description, setDescription] = useState('');

  const isValid =
    name.trim().length > 0 &&
    elevation.trim().length > 0 &&
    !isNaN(Number(elevation)) &&
    Number(elevation) > 0;

  const handleSave = useCallback(() => {
    console.log('[AddMountain] Save pressed, valid:', isValid);
    if (!isValid) {
      Alert.alert('Missing Info', 'Please enter at least a name and elevation.');
      return;
    }

    const elevM = Math.round(Number(elevation));
    const elevFt = Math.round(elevM * 3.28084);
    const lat = latitude.trim() ? Number(latitude) : 0;
    const lng = longitude.trim() ? Number(longitude) : 0;

    if (latitude.trim() && (isNaN(lat) || lat < -90 || lat > 90)) {
      Alert.alert('Invalid Latitude', 'Latitude must be between -90 and 90.');
      return;
    }
    if (longitude.trim() && (isNaN(lng) || lng < -180 || lng > 180)) {
      Alert.alert('Invalid Longitude', 'Longitude must be between -180 and 180.');
      return;
    }

    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const newMountain: MountainType = {
      id,
      name: name.trim(),
      elevation: elevM,
      elevationFt: elevFt,
      latitude: lat,
      longitude: lng,
      country: country.trim() || 'Unknown',
      range: range.trim() || 'Unknown',
      category: 'custom' as MountainCategory,
      difficulty,
      description: description.trim() || `A custom peak added by you.`,
      firstAscent: 'Unknown',
      iconEmoji: '⛰️',
    };
    console.log('[AddMountain] Saving mountain:', JSON.stringify(newMountain));
    try {
      addCustomMountain(newMountain);
      console.log('[AddMountain] Mountain saved successfully');
    } catch (err) {
      console.error('[AddMountain] Error saving mountain:', err);
      Alert.alert('Error', 'Failed to save mountain. Please try again.');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    router.back();
  }, [isValid, name, elevation, country, range, latitude, longitude, difficulty, description, addCustomMountain, router]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A1A2E', '#1E2240']}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
              testID="close-add-mountain"
            >
              <X color={Colors.text} size={22} />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Add Peak</Text>
            <TouchableOpacity
              style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
              onPress={handleSave}
              activeOpacity={0.7}
              disabled={!isValid}
              testID="save-mountain"
            >
              <Check color={Colors.white} size={20} />
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroIcon}>
            <MountainIcon color={Colors.peach} size={40} />
          </View>
          <Text style={styles.heroLabel}>Add your own mountain or peak</Text>

          <View style={styles.section}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldIcon}>
                <MountainIcon color={Colors.accent} size={18} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Mount Olympus"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  testID="mountain-name-input"
                />
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldIcon}>
                <TrendingUp color={Colors.accent} size={18} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Elevation (meters) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2917"
                  placeholderTextColor={Colors.textMuted}
                  value={elevation}
                  onChangeText={setElevation}
                  keyboardType="numeric"
                  testID="mountain-elevation-input"
                />
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldIcon}>
                <Globe color={Colors.accent} size={18} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Country</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Greece"
                  placeholderTextColor={Colors.textMuted}
                  value={country}
                  onChangeText={setCountry}
                  testID="mountain-country-input"
                />
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldIcon}>
                <Layers color={Colors.accent} size={18} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Mountain Range</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Olympus Range"
                  placeholderTextColor={Colors.textMuted}
                  value={range}
                  onChangeText={setRange}
                  testID="mountain-range-input"
                />
              </View>
            </View>

            <View style={styles.coordRow}>
              <View style={styles.coordField}>
                <View style={styles.fieldIcon}>
                  <MapPin color={Colors.accent} size={18} />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Latitude</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 40.08"
                    placeholderTextColor={Colors.textMuted}
                    value={latitude}
                    onChangeText={setLatitude}
                    keyboardType="numeric"
                    testID="mountain-lat-input"
                  />
                </View>
              </View>
              <View style={styles.coordField}>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Longitude</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 22.35"
                    placeholderTextColor={Colors.textMuted}
                    value={longitude}
                    onChangeText={setLongitude}
                    keyboardType="numeric"
                    testID="mountain-lng-input"
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Difficulty</Text>
            <View style={styles.difficultyRow}>
              {DIFFICULTY_OPTIONS.map((opt) => {
                const isActive = difficulty === opt;
                const diffColor =
                  opt === 'Extreme' ? Colors.danger :
                  opt === 'Hard' ? Colors.warning :
                  opt === 'Moderate' ? Colors.accent :
                  Colors.success;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.difficultyChip,
                      isActive && { backgroundColor: diffColor + '18', borderColor: diffColor },
                    ]}
                    onPress={() => setDifficulty(opt)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.difficultyDot, { backgroundColor: diffColor }]} />
                    <Text
                      style={[
                        styles.difficultyText,
                        isActive && { color: diffColor, fontWeight: '700' as const },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell a story about this peak..."
              placeholderTextColor={Colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              testID="mountain-description-input"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Colors.peach + '15',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  heroLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.accent + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  input: {
    fontSize: 15,
    color: Colors.text,
    paddingVertical: Platform.OS === 'web' ? 6 : 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  textArea: {
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomWidth: 1,
    padding: 14,
    minHeight: 100,
  },
  coordRow: {
    flexDirection: 'row',
    gap: 10,
  },
  coordField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
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
    borderColor: Colors.border,
    gap: 8,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
});
