import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Camera,
  Check,
  Eye,
  EyeOff,
  Mountain,
  User as UserIcon,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import {
  PRESET_AVATARS,
  AGE_RANGES,
  GENDER_OPTIONS,
  validateScreenname,
  type PresetAvatar,
} from '@/constants/profile';
import { pickAndUploadAvatar } from '@/lib/avatarUpload';

type AvatarMode = 'preset' | 'upload';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isDemoMode } = useAuth();
  const { saveProfile, skipOnboarding, checkScreennameAvailable } = useProfile();

  const [screenname, setScreenname] = useState<string>('');
  const [screennameError, setScreennameError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [uploadedAvatar, setUploadedAvatar] = useState<string | null>(null);
  const [avatarMode, setAvatarMode] = useState<AvatarMode>('preset');
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showScreennameHint, setShowScreennameHint] = useState<boolean>(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScreennameChange = useCallback((text: string) => {
    // Force lowercase, strip invalid chars
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setScreenname(cleaned);
    setScreennameError(null);
    setIsAvailable(null);
    setShowScreennameHint(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const validationError = validateScreenname(cleaned);
    if (validationError) {
      setScreennameError(validationError);
      return;
    }

    // Debounce availability check
    debounceRef.current = setTimeout(() => {
      setIsChecking(true);
      void checkScreennameAvailable(cleaned).then((available) => {
        setIsAvailable(available);
        setIsChecking(false);
      });
    }, 500);
  }, [checkScreennameAvailable]);

  const handlePickPhoto = useCallback(async () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const result = await pickAndUploadAvatar(user?.id ?? 'temp');
    if (result) {
      setUploadedAvatar(result);
      setAvatarMode('upload');
      setSelectedPreset(null);
    }
  }, [user?.id]);

  const handlePresetSelect = useCallback((avatar: PresetAvatar) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPreset(avatar.id);
    setAvatarMode('preset');
    setUploadedAvatar(null);
  }, []);

  const canSubmit = useMemo(() => {
    const validationError = validateScreenname(screenname);
    if (validationError) return false;
    if (isChecking) return false;
    if (isAvailable === false) return false;
    return true;
  }, [screenname, isChecking, isAvailable]);

  const handleSave = useCallback(async () => {
    if (!canSubmit) return;
    setIsSaving(true);

    const avatarUrl = avatarMode === 'upload'
      ? uploadedAvatar
      : selectedPreset
        ? PRESET_AVATARS.find((a) => a.id === selectedPreset)?.url ?? null
        : null;

    const { error } = await saveProfile({
      screenname: screenname,
      avatarUrl,
      ageRange,
      gender,
    });

    setIsSaving(false);

    if (error) {
      Alert.alert('Could not save', error);
      return;
    }

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [canSubmit, screenname, avatarMode, uploadedAvatar, selectedPreset, ageRange, gender, saveProfile, router]);

  const handleSkip = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    void skipOnboarding().then(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    });
  }, [skipOnboarding, router]);

  const currentAvatarUrl = avatarMode === 'upload'
    ? uploadedAvatar
    : selectedPreset
      ? PRESET_AVATARS.find((a) => a.id === selectedPreset)?.url ?? null
      : null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80' }}
        style={styles.bgImage}
        contentFit="cover"
      />
      <View style={styles.bgOverlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleSkip}
            activeOpacity={0.7}
            testID="onboarding-back-button"
          >
            <ArrowLeft color={Colors.white} size={22} />
          </TouchableOpacity>

          <View style={styles.heroSection}>
            <View style={styles.iconCircle}>
              <Mountain color={Colors.white} size={28} />
            </View>
            <Text style={styles.heroTitle}>Make it yours</Text>
            <Text style={styles.heroSubtitle}>
              Pick a screenname and avatar so other climbers can find you. You can skip this and stay private — your call.
            </Text>
          </View>

          <View style={styles.formCard}>
            {/* Avatar section */}
            <Text style={styles.fieldLabel}>Avatar</Text>
            <View style={styles.avatarPreviewRow}>
              <View style={styles.avatarPreviewCircle}>
                {currentAvatarUrl ? (
                  <Image
                    source={{ uri: currentAvatarUrl }}
                    style={styles.avatarPreviewImage}
                    contentFit="cover"
                  />
                ) : (
                  <UserIcon color={Colors.textMuted} size={28} />
                )}
              </View>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handlePickPhoto}
                activeOpacity={0.7}
              >
                <Camera color={Colors.primary} size={16} />
                <Text style={styles.uploadButtonText}>Upload photo</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetScroll}
            >
              {PRESET_AVATARS.map((avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.presetAvatar,
                    selectedPreset === avatar.id && styles.presetAvatarSelected,
                  ]}
                  onPress={() => handlePresetSelect(avatar)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: avatar.url }}
                    style={styles.presetAvatarImage}
                    contentFit="contain"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Screenname section */}
            <View style={styles.screennameContainer}>
              <Text style={styles.fieldLabel}>
                Screenname <Text style={styles.fieldRequired}>*</Text>
              </Text>
              <View style={[
                styles.inputWrapper,
                screennameError ? styles.inputWrapperError : null,
                isAvailable === true && !screennameError ? styles.inputWrapperSuccess : null,
              ]}>
                <Text style={styles.atSign}>@</Text>
                <TextInput
                  style={styles.screennameInput}
                  placeholder="your_handle"
                  placeholderTextColor={Colors.textMuted}
                  value={screenname}
                  onChangeText={handleScreennameChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                  testID="onboarding-screenname-input"
                />
                {isChecking ? (
                  <ActivityIndicator color={Colors.textMuted} size="small" />
                ) : isAvailable === true && !screennameError && screenname.length > 0 ? (
                  <Check color={Colors.success} size={18} />
                ) : null}
              </View>
              {screennameError ? (
                <Text style={styles.hintError}>{screennameError}</Text>
              ) : isAvailable === false ? (
                <Text style={styles.hintError}>That screenname is taken</Text>
              ) : showScreennameHint && screenname.length > 0 ? (
                <Text style={styles.hintText}>Letters, numbers, _ and — · 3–20 characters</Text>
              ) : (
                <Text style={styles.hintText}>This is how other climbers will find you</Text>
              )}
            </View>

            {/* Age range */}
            <Text style={styles.fieldLabel}>Age range <Text style={styles.fieldOptional}>(optional)</Text></Text>
            <View style={styles.chipsRow}>
              {AGE_RANGES.map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[styles.chip, ageRange === range && styles.chipActive]}
                  onPress={() => {
                    setAgeRange(ageRange === range ? null : range);
                    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, ageRange === range && styles.chipTextActive]}>
                    {range}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Gender */}
            <Text style={styles.fieldLabel}>Gender <Text style={styles.fieldOptional}>(optional)</Text></Text>
            <View style={styles.chipsRow}>
              {GENDER_OPTIONS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, gender === g && styles.chipActive]}
                  onPress={() => {
                    setGender(gender === g ? null : g);
                    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Privacy note */}
          <View style={styles.privacyNote}>
            <EyeOff color={Colors.textSecondary} size={16} />
            <Text style={styles.privacyText}>
              Without a screenname, your account is private — others can't find or interact with you, and you can't interact with them.
            </Text>
          </View>

          {/* Action buttons */}
          <TouchableOpacity
            style={[styles.saveButton, !canSubmit && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!canSubmit || isSaving}
            activeOpacity={0.8}
            testID="onboarding-save-button"
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Become discoverable</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
            testID="onboarding-skip-button"
          >
            <Text style={styles.skipButtonText}>Skip — stay private</Text>
          </TouchableOpacity>

          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.snow,
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  bgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: 'rgba(26, 51, 80, 0.55)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  fieldRequired: {
    color: Colors.danger,
  },
  fieldOptional: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  avatarPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  avatarPreviewCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.frost,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  avatarPreviewImage: {
    width: '100%',
    height: '100%',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.frost,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  uploadButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  presetScroll: {
    gap: 8,
    paddingRight: 4,
    paddingBottom: 4,
  },
  presetAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.frost,
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetAvatarSelected: {
    borderColor: Colors.primary,
    borderWidth: 2.5,
  },
  presetAvatarImage: {
    width: 40,
    height: 40,
  },
  screennameContainer: {
    marginTop: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.frost,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputWrapperError: {
    borderColor: Colors.danger + '60',
  },
  inputWrapperSuccess: {
    borderColor: Colors.success + '60',
  },
  atSign: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.textMuted,
  },
  screennameInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  hintText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
    marginLeft: 2,
  },
  hintError: {
    fontSize: 11,
    color: Colors.danger,
    marginTop: 6,
    marginLeft: 2,
    fontWeight: '500' as const,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: Colors.frost,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 18,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
});
