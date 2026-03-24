import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { mountains } from '@/constants/mountains';
import { useSummits } from '@/contexts/SummitContext';

let MapView: any = null;
let Marker: any = null;

try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
} catch (e) {
  console.log('react-native-maps not available');
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { records, isSummited } = useSummits();

  const summitedMountains = useMemo(() => {
    return mountains.filter((m) => isSummited(m.id));
  }, [records, isSummited]);

  const allMountainMarkers = useMemo(() => {
    return mountains.map((m) => ({
      ...m,
      summited: isSummited(m.id),
    }));
  }, [records, isSummited]);

  if (!MapView || Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={[styles.fallbackContainer, { paddingTop: insets.top }]}
        >
          <View style={styles.fallbackContent}>
            <MapPin color={Colors.accentLight} size={48} />
            <Text style={styles.fallbackTitle}>Summit Map</Text>
            <Text style={styles.fallbackSubtitle}>
              Open this app on your mobile device to see your summits on an interactive world map
            </Text>

            <View style={styles.statsCard}>
              <Text style={styles.statsNumber}>{summitedMountains.length}</Text>
              <Text style={styles.statsLabel}>Peaks Summited</Text>
            </View>

            {summitedMountains.length > 0 && (
              <View style={styles.summitList}>
                <Text style={styles.summitListTitle}>Your Summits</Text>
                {summitedMountains.map((m) => (
                  <View key={m.id} style={styles.summitItem}>
                    <Text style={styles.summitEmoji}>{m.iconEmoji}</Text>
                    <View style={styles.summitInfo}>
                      <Text style={styles.summitName}>{m.name}</Text>
                      <Text style={styles.summitLocation}>{m.country}</Text>
                    </View>
                    <Text style={styles.summitElev}>{m.elevation.toLocaleString()}m</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.mapHeader, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.mapTitle}>Summit Map</Text>
        <View style={styles.mapBadge}>
          <Text style={styles.mapBadgeText}>
            {summitedMountains.length} / {mountains.length} Summited
          </Text>
        </View>
      </View>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 30,
          longitude: 10,
          latitudeDelta: 120,
          longitudeDelta: 120,
        }}
        mapType="terrain"
      >
        {allMountainMarkers.map((m) => (
          <Marker
            key={m.id}
            coordinate={{
              latitude: m.latitude,
              longitude: m.longitude,
            }}
            title={m.name}
            description={`${m.elevation.toLocaleString()}m - ${m.country}`}
            pinColor={m.summited ? '#4CAF50' : '#4DA8DA'}
            opacity={m.summited ? 1 : 0.5}
          />
        ))}
      </MapView>

      <View style={styles.mapLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Summited</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4DA8DA', opacity: 0.5 }]} />
          <Text style={styles.legendText}>Not Yet</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  mapHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: Colors.overlay,
  },
  mapTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  mapBadge: {
    backgroundColor: Colors.accent + '30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent + '50',
  },
  mapBadgeText: {
    color: Colors.accentLight,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  map: {
    flex: 1,
  },
  mapLegend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    gap: 16,
    backgroundColor: Colors.overlay,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '500' as const,
  },
  fallbackContainer: {
    flex: 1,
  },
  fallbackContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  fallbackTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  fallbackSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  statsCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
    width: '100%',
  },
  statsNumber: {
    fontSize: 48,
    fontWeight: '900' as const,
    color: Colors.accentLight,
  },
  statsLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  summitList: {
    width: '100%',
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summitListTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 12,
  },
  summitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summitEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  summitInfo: {
    flex: 1,
  },
  summitName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  summitLocation: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  summitElev: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.accentLight,
  },
});
