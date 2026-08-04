import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
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
  Camera,
  Check,
  Mountain,
  User as UserIcon,
  Eye,
  EyeOff,
  Shield,
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
import { pickAndUploadAvatar, resolveAvatarUrl } from '@/lib/avatarUpload';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { profile, saveProfile, checkScreennameAvailable } = useProfile();

  const [screenname, setScreenname] = useState<string>(profile?.screenname ?? '');
  const [screennameError, setScreennameError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    PRESET_AVATARS.find((a) => a.url === profile?.avatarUrl)?.id ?? null
  );
  const [uploadedAvatar, setUploadedAvatar] = useState<string | null>(
    profile?.avatarUrl && !PRESET_AVATARS.some((a) => a.url === profile.avatarUrl)
      ? profile.avatarUrl
      : null
  );
  const [avatarMode, setAvatarMode] = useState<'preset' | 'upload'>(
    profile?.avatarUrl && !PRESET_AVATARS.some((a) => a.url === profile.avatarUrl)
      ? 'upload'
      : 'preset'
  );
  const [ageRange, setAgeRange] = useState<string | null>(profile?.ageRange ?? null);
  const [gender, setGender] = useState<string | null>(profile?.gender ?? null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [resolvedAvatar, setResolvedAvatar] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve avatar URL for display (signed URL for storage paths)
  useEffect(() => {
    const avatarToResolve = avatarMode === 'upload' ? uploadedAvatar : null;
    if (!avatarToResolve) {
      setResolvedAvatar(null);
      return;
    }
    let active = true;
    void resolveAvatarUrl(avatarToResolve).then((url) => {
      if (active) setResolvedAvatar(url);
    });
    return () => { active = false; };
  }, [uploadedAvatar, avatarMode]);

  const handleScreennameChange = useCallback((text: string) => {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setScreenname(cleaned);
    setScreennameError(null);
    setIsAvailable(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const validationError = validateScreenname(cleaned);
    if (validationError) {
      setScreennameError(validationError);
      return;
    }

    // If unchanged from current, no need to check
    if (cleaned === profile?.screenname) {
      setIsAvailable(true);
      return;
    }

    debounceRef.current = setTimeout(() => {
      setIsChecking(true);
      void checkScreennameAvailable(cleaned).then((available) => {
        setIsAvailable(available);
        setIsChecking(false);
      });
    }, 500);
  }, [checkScreennameAvailable, profile?.screenname]);

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
    router.back();
  }, [canSubmit, screenname, avatarMode, uploadedAvatar, selectedPreset, ageRange, gender, saveProfile, router]);

  const currentAvatarUrl = avatarMode === 'upload'
    ? resolvedAvatar ?? uploadedAvatar
    : selectedPreset
      ? PRESET_AVATARS.find((a) => a.id === selectedPreset)?.url ?? null
      : null;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Edit Profile',
          headerStyle: { backgroundColor: Colors.white },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700' as const },
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar section */}
          <View style={styles.card}>
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
          </View>

          {/* Screenname */}
          <View style={styles.card}>
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
            ) : (
              <Text style={styles.hintText}>Letters, numbers, _ and — · 3–20 characters</Text>
            )}

            {/* Privacy indicator */}
            <View style={styles.privacyIndicator}>
              {screenname.trim().length > 0 && !screennameError ? (
                <>
                  <Eye color={Colors.success} size={14} />
                  <Text style={styles.privacyDiscoverable}>Discoverable — other climbers can find you</Text>
                </>
              ) : (
                <>
                  <EyeOff color={Colors.textMuted} size={14} />
                  <Text style={styles.privacyPrivate}>Private — invisible to other climbers</Text>
                </>
              )}
            </View>
          </View>

          {/* Age range */}
          <View style={styles.card}>
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
          </View>

          {/* Gender */}
          <View style={styles.card}>
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

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveButton, !canSubmit && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!canSubmit || isSaving}
            activeOpacity={0.8}
            testID="edit-profile-save-button"
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 16,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
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
  privacyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  privacyDiscoverable: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500' as const,
  },
  privacyPrivate: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
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
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
