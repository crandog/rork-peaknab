import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Camera, FileText, Save, X } from 'lucide-react-native';
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

  const handlePickPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Alert.alert('Saved!', 'Your summit report has been saved.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }, [mountainId, report, photoUri, updateSummit, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: mountainName ?? 'Summit Report',
          headerStyle: { backgroundColor: Colors.secondary },
          headerTintColor: Colors.text,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText color={Colors.accent} size={20} />
            <Text style={styles.sectionTitle}>Summit Report</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Share your experience, conditions, and memories from the climb
          </Text>
          <TextInput
            style={styles.reportInput}
            placeholder="How was the climb? Describe the conditions, your route, memorable moments..."
            placeholderTextColor={Colors.textMuted}
            value={report}
            onChangeText={setReport}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Camera color={Colors.accent} size={20} />
            <Text style={styles.sectionTitle}>Summit Photo</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Upload a photo from your summit
          </Text>

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
                <X color={Colors.white} size={16} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.photoPlaceholder}
              onPress={handlePickPhoto}
              activeOpacity={0.7}
            >
              <Camera color={Colors.textMuted} size={32} />
              <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Save color={Colors.white} size={20} />
          <Text style={styles.saveButtonText}>Save Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  reportInput: {
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 16,
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 180,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoContainer: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 14,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholder: {
    height: 180,
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    gap: 8,
  },
  photoPlaceholderText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700' as const,
  },
});
