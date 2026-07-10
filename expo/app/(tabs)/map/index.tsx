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
import Svg, { Circle, Path, Polygon, Text as SvgText } from 'react-native-svg';
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

const MAPBOX_OUTDOORS_URL = `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`;

const VOYAGER_BRASS = '#c8a24a';
const VOYAGER_BRASS_LIGHT = '#f3ecd8';
const VOYAGER_BRASS_DARK = '#3a2e12';
const VOYAGER_FRAME = '#5c503b';
const VOYAGER_FRAME_INNER = '#8a7a5c';
const VOYAGER_TITLE = '#3f3527';
const VOYAGER_OVERLAY = 'rgba(205, 225, 232, 0.22)';

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

function CompassRose() {
  const size = 84;
  const center = size / 2;
  const radius = 38;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={center} cy={center} r={radius} stroke={VOYAGER_BRASS} strokeWidth={2} fill="rgba(54, 48, 36, 0.28)" />
      <Circle cx={center} cy={center} r={radius - 6} stroke={VOYAGER_FRAME_INNER} strokeWidth={1} fill="none" />
      <Polygon
        points={`${center},${center - 26} ${center - 9},${center + 10} ${center},${center + 4} ${center + 9},${center + 10}`}
        fill={VOYAGER_BRASS}
      />
      <Polygon
        points={`${center},${center + 26} ${center - 9},${center - 10} ${center},${center - 4} ${center + 9},${center - 10}`}
        fill={VOYAGER_FRAME}
      />
      <Path d={`M${center} ${center - 32} L${center} ${center - 24}`} stroke={VOYAGER_BRASS_LIGHT} strokeWidth={2} strokeLinecap="round" />
      <SvgText
        x={center}
        y={center - 22}
        textAnchor="middle"
        fill={VOYAGER_BRASS_LIGHT}
        fontSize={10}
        fontWeight="bold"
        fontFamily="serif"
      >
        N
      </SvgText>
    </Svg>
  );
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
      edgePadding: { top: 160, right: 60, bottom: 160, left: 60 },
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
      edgePadding: { top: 140, right: 60, bottom: 140, left: 60 },
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
      <View style={styles.mapFrameOuter}>
        <View style={styles.mapFrameInner}>
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
              urlTemplate={MAPBOX_OUTDOORS_URL}
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
                    <View style={styles.clusterBubble}>
                      <Text style={styles.clusterCount}>{cluster.count}</Text>
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

          <View style={styles.frostOverlay} pointerEvents="none" />
        </View>
      </View>

      <View style={[styles.chartHeader, { paddingTop: insets.top + 16 }]} pointerEvents="none">
        <Text style={styles.chartTitle} numberOfLines={1}>Summit Map</Text>
        <Text style={styles.chartSubtitle}>PeakNab · expedition chart</Text>
      </View>

      <View style={[styles.compassWrap, { paddingTop: insets.top + 16 }]} pointerEvents="none">
        <CompassRose />
      </View>

      <View style={styles.mapLegend} pointerEvents="box-none">
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
  mapFrameOuter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 8,
    borderColor: VOYAGER_FRAME,
    backgroundColor: VOYAGER_FRAME,
  },
  mapFrameInner: {
    flex: 1,
    borderWidth: 2,
    borderColor: VOYAGER_FRAME_INNER,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  frostOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: VOYAGER_OVERLAY,
  },
  chartHeader: {
    position: 'absolute',
    top: 16,
    left: 22,
    zIndex: 20,
    maxWidth: '55%',
  },
  chartTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: VOYAGER_TITLE,
    fontFamily: 'serif',
    textShadowColor: 'rgba(243, 236, 216, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  chartSubtitle: {
    fontSize: 13,
    color: VOYAGER_FRAME,
    fontStyle: 'italic',
    marginTop: 2,
    textShadowColor: 'rgba(243, 236, 216, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  compassWrap: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 20,
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
    backgroundColor: VOYAGER_BRASS,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: VOYAGER_BRASS_LIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },
  clusterCount: {
    color: VOYAGER_BRASS_DARK,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  mapLegend: {
    position: 'absolute',
    bottom: 22,
    left: 22,
    flexDirection: 'row',
    gap: 16,
    backgroundColor: 'rgba(243, 236, 216, 0.88)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: VOYAGER_FRAME_INNER,
    zIndex: 20,
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
    color: VOYAGER_BRASS_DARK,
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
