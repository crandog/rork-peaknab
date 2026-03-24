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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Camera, FileText, Save, X, Mountain } from 'lucide-react-native';
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
          title: '',
          headerStyle: { backgroundColor: Colors.secondary },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />

      <View style={styles.heroHeader}>
        <Mountain color={Colors.accent} size={28} />
        <Text style={styles.heroTitle}>{mountainName ?? 'Summit Report'}</Text>
        <Text style={styles.heroSubtitle}>Document your achievement</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconBadge}>
              <FileText color={Colors.accent} size={16} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Summit Notes</Text>
              <Text style={styles.sectionSubtitle}>
                Conditions, route, memorable moments
              </Text>
            </View>
          </View>
          <TextInput
            style={styles.reportInput}
            placeholder="How was the climb?"
            placeholderTextColor="rgba(160,152,136,0.6)"
            value={report}
            onChangeText={setReport}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconBadge}>
              <Camera color={Colors.accent} size={16} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Summit Photo</Text>
              <Text style={styles.sectionSubtitle}>
                Capture the moment
              </Text>
            </View>
          </View>

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
              <View style={styles.photoIconCircle}>
                <Camera color={Colors.accent} size={24} />
              </View>
              <Text style={styles.photoPlaceholderText}>Tap to add a photo</Text>
            </TouchableOpacity>
          )}
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
    backgroundColor: Colors.secondary,
  },
  heroHeader: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 20,
    backgroundColor: Colors.secondary,
    gap: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    marginTop: 6,
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
    gap: 16,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(212,168,67,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  reportInput: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 160,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  photoContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
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
    height: 150,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    borderStyle: 'dashed',
    gap: 10,
  },
  photoIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212,168,67,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
});
