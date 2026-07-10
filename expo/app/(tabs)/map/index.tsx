import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Mountain } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { MAPBOX_TOKEN } from '@/constants/mapConfig';
import { useSummits } from '@/contexts/SummitContext';
import { useAllMountains } from '@/hooks/useAllMountains';
import MountainIcon from '@/components/MountainIcon';
import RNMapView, {
  Marker as RNMarker,
  Region,
  UrlTile,
  LatLng,
} from 'react-native-maps';
import type { Mountain as MountainType } from '@/constants/mountains';

type MarkerPeak = MountainType & { summited: boolean };

type Cluster = {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  peaks: MarkerPeak[];
  summited: boolean;
};

const MAPBOX_DARK_URL = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`;

function getClusterCellSize(latitudeDelta: number): number {
  if (latitudeDelta > 120) return 22;
  if (latitudeDelta > 80) return 16;
  if (latitudeDelta > 40) return 10;
  if (latitudeDelta > 20) return 6;
  if (latitudeDelta > 10) return 3;
  if (latitudeDelta > 5) return 1.5;
  return 0.6;
}

function buildClusters(peaks: MarkerPeak[], region: Region): Cluster[] {
  const cellSize = getClusterCellSize(region.latitudeDelta);
  const groups = new Map<string, MarkerPeak[]>();

  for (const peak of peaks) {
    const latKey = Math.floor(peak.latitude / cellSize);
    const lonKey = Math.floor(peak.longitude / cellSize);
    const key = `${latKey}_${lonKey}`;
    const group = groups.get(key) ?? [];
    group.push(peak);
    groups.set(key, group);
  }

  return Array.from(groups.entries()).map(([key, group]) => {
    const avgLat = group.reduce((sum, p) => sum + p.latitude, 0) / group.length;
    const avgLon = group.reduce((sum, p) => sum + p.longitude, 0) / group.length;
    return {
      id: key,
      latitude: avgLat,
      longitude: avgLon,
      count: group.length,
      peaks: group,
      summited: group.some((p) => p.summited),
    };
  });
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { records, isSummited } = useSummits();
  const allMountains = useAllMountains();
  const mapRef = useRef<RNMapView>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 20,
    longitude: 30,
    latitudeDelta: 160,
    longitudeDelta: 160,
  });
  const [mapReady, setMapReady] = useState(false);

  const navigateToMountain = useCallback((id: string) => {
    router.push(`/mountain/${id}`);
  }, [router]);

  const summitedMountains = useMemo(() => {
    return allMountains.filter((m) => isSummited(m.id));
  }, [records, isSummited, allMountains]);

  const allMountainMarkers = useMemo<MarkerPeak[]>(() => {
    return allMountains
      .map((m) => ({ ...m, summited: isSummited(m.id) }))
      .filter((m) => !(m.latitude === 0 && m.longitude === 0));
  }, [records, isSummited, allMountains]);

  const clusters = useMemo(() => {
    return buildClusters(allMountainMarkers, region);
  }, [allMountainMarkers, region]);

  const fitToPeaks = useCallback(() => {
    if (!mapRef.current) return;
    const target = summitedMountains.length > 0 ? summitedMountains : allMountains;
    const coords: LatLng[] = target
      .filter((m) => !(m.latitude === 0 && m.longitude === 0))
      .map((m) => ({ latitude: m.latitude, longitude: m.longitude }));
    if (coords.length === 0) return;
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 140, right: 40, bottom: 140, left: 40 },
      animated: true,
    });
  }, [summitedMountains, allMountains]);

  useEffect(() => {
    if (!mapReady) return;
    const timer = setTimeout(() => fitToPeaks(), 400);
    return () => clearTimeout(timer);
  }, [mapReady, fitToPeaks]);

  const handleClusterPress = useCallback((cluster: Cluster) => {
    if (!mapRef.current || cluster.count === 1) return;
    const coords: LatLng[] = cluster.peaks
      .filter((m) => !(m.latitude === 0 && m.longitude === 0))
      .map((m) => ({ latitude: m.latitude, longitude: m.longitude }));
    if (coords.length === 0) return;
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 120, right: 40, bottom: 120, left: 40 },
      animated: true,
    });
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={[styles.fallbackContainer, { paddingTop: insets.top }]}>
          <View style={styles.fallbackContent}>
            <View style={styles.fallbackIconWrap}>
              <MapPin color={Colors.primary} size={40} />
            </View>
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
                  <TouchableOpacity key={m.id} style={styles.summitItem} onPress={() => navigateToMountain(m.id)} activeOpacity={0.7}>
                    <MountainIcon mountainId={m.id} category={m.category} size={20} />
                    <View style={styles.summitInfo}>
                      <Text style={styles.summitName}>{m.name}</Text>
                      <Text style={styles.summitLocation}>{m.country}</Text>
                    </View>
                    <Text style={styles.summitElev}>{m.elevation.toLocaleString()}m</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.mapHeader, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.mapTitle}>Summit Map</Text>
        <View style={styles.mapBadge}>
          <Text style={styles.mapBadgeText}>
            {summitedMountains.length} / {allMountains.length} Summited
          </Text>
        </View>
      </View>
      <RNMapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        mapType="none"
        showsCompass={false}
        showsScale={false}
        rotateEnabled={false}
        pitchEnabled={false}
        onMapReady={() => setMapReady(true)}
      >
        <UrlTile
          urlTemplate={MAPBOX_DARK_URL}
          maximumZ={19}
          flipY={false}
          tileSize={256}
        />
        {clusters.map((cluster) => {
          if (cluster.count > 1) {
            return (
              <RNMarker
                key={cluster.id}
                coordinate={{
                  latitude: cluster.latitude,
                  longitude: cluster.longitude,
                }}
                tracksViewChanges={false}
                onPress={() => handleClusterPress(cluster)}
              >
                <View
                  style={[
                    styles.clusterBubble,
                    cluster.summited && styles.clusterBubbleSummited,
                  ]}
                >
                  <Text
                    style={[
                      styles.clusterCount,
                      cluster.summited && styles.clusterCountSummited,
                    ]}
                  >
                    {cluster.count}
                  </Text>
                </View>
              </RNMarker>
            );
          }

          const peak = cluster.peaks[0];
          if (!peak) return null;

          return (
            <RNMarker
              key={peak.id}
              coordinate={{
                latitude: peak.latitude,
                longitude: peak.longitude,
              }}
              title={peak.name}
              description={`${peak.elevation.toLocaleString()}m - ${peak.country}`}
              tracksViewChanges={false}
              onCalloutPress={() => navigateToMountain(peak.id)}
            >
              {peak.summited ? (
                <View style={styles.summitedMarker}>
                  <Mountain color={Colors.textDark} size={18} strokeWidth={2.5} />
                </View>
              ) : (
                <View style={styles.unclimbedMarker}>
                  <Mountain color={Colors.textMuted} size={18} strokeWidth={2} />
                </View>
              )}
            </RNMarker>
          );
        })}
      </RNMapView>

      <View style={styles.mapLegend}>
        <View style={styles.legendItem}>
          <View style={styles.legendSummitedMarker}>
            <Mountain color={Colors.textDark} size={10} strokeWidth={2.5} />
          </View>
          <Text style={styles.legendText}>Summited</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendUnclimbedMarker}>
            <Mountain color={Colors.textMuted} size={10} strokeWidth={2} />
          </View>
          <Text style={styles.legendText}>Unclimbed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.snow,
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
    fontWeight: '700' as const,
    color: Colors.text,
  },
  mapBadge: {
    backgroundColor: Colors.frost,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mapBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  map: {
    flex: 1,
  },
  summitedMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  unclimbedMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.textMuted,
  },
  clusterBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(91, 142, 194, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },
  clusterBubbleSummited: {
    backgroundColor: 'rgba(212, 168, 67, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  clusterCount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  clusterCountSummited: {
    color: Colors.textDark,
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
    borderWidth: 1,
    borderColor: Colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSummitedMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendUnclimbedMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
  },
  legendText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '500' as const,
  },
  fallbackContainer: {
    flex: 1,
    backgroundColor: Colors.snow,
  },
  fallbackContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  fallbackIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.frost,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
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
    backgroundColor: Colors.white,
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
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  statsLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  summitList: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summitListTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  summitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summitInfo: {
    flex: 1,
    marginLeft: 12,
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
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
