import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Camera, Save, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSummits } from '@/contexts/SummitContext';

export default function SummitReportScreen() {
  const { mountainId, mountainName } = useLocalSearchParams<{
    mountainId: string;
    mountainName: string;
  }>();
  const router = useRouter();
  const { getSummit, updateSummit } = useSummits();

  const summitRecord = useMemo(
    () => (mountainId ? getSummit(mountainId) : undefined),
    [mountainId, getSummit]
  );

  const [report, setReport] = useState(summitRecord?.report ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(summitRecord?.photoUri ?? null);
  const saveScale = useRef(new Animated.Value(1)).current;

  const handleSavePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(saveScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(saveScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  }, [saveScale]);

  const handlePickPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!mountainId) return;

    updateSummit(mountainId, {
      report: report.trim(),
      photoUri,
    });

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Alert.alert('Saved!', 'Your summit report has been saved.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }, [mountainId, report, photoUri, updateSummit, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Summit Report',
          headerStyle: { backgroundColor: Colors.white },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700' as const },
        }}
      />

      <View style={styles.heroHeader}>
        <Text style={styles.heroTitle}>{mountainName ?? 'Summit Report'}</Text>
        <Text style={styles.heroSubtitle}>{summitRecord?.date ?? 'Document your achievement'}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notes:</Text>
          <TextInput
            style={styles.reportInput}
            placeholder="Amazing climb, perfect weather!"
            placeholderTextColor={Colors.textMuted}
            value={report}
            onChangeText={setReport}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Photo</Text>
          {photoUri ? (
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: photoUri }}
                style={styles.photo}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => setPhotoUri(null)}
              >
                <X color="#fff" size={14} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.photoPlaceholder}
              onPress={handlePickPhoto}
              activeOpacity={0.7}
            >
              <Camera color={Colors.primary} size={28} />
              <Text style={styles.photoPlaceholderText}>Upload Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Conditions:</Text>
          <TextInput
            style={styles.conditionsInput}
            placeholder="Clear skies, -20°C, Light wind."
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <Animated.View style={{ transform: [{ scale: saveScale }] }}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => { handleSavePress(); handleSave(); }}
            activeOpacity={0.85}
          >
            <Save color="#fff" size={18} />
            <Text style={styles.saveButtonText}>Save Report</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.snow,
  },
  heroHeader: {
    paddingTop: 4,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 16,
    gap: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  reportInput: {
    backgroundColor: Colors.frost,
    borderRadius: 10,
    padding: 14,
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  conditionsInput: {
    backgroundColor: Colors.frost,
    borderRadius: 10,
    padding: 14,
    color: Colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoContainer: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholder: {
    height: 120,
    backgroundColor: Colors.frost,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    gap: 8,
  },
  photoPlaceholderText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 10,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
