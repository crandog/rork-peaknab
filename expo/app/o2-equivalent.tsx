// O2 equivalent screen
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { Wind } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 280;

interface AltitudeRow {
  altitude: number;
  altitudeFt: number;
  o2Percent: number;
  effectiveO2: number;
  zone: string;
  color: string;
}

const altitudeData: AltitudeRow[] = [
  { altitude: 0, altitudeFt: 0, o2Percent: 100, effectiveO2: 20.9, zone: 'Sea Level', color: '#3A9E5C' },
  { altitude: 1000, altitudeFt: 3281, o2Percent: 88, effectiveO2: 18.4, zone: 'Low', color: '#3A9E5C' },
  { altitude: 2000, altitudeFt: 6562, o2Percent: 78, effectiveO2: 16.3, zone: 'Moderate', color: '#6BAA4A' },
  { altitude: 2500, altitudeFt: 8202, o2Percent: 74, effectiveO2: 15.5, zone: 'Moderate', color: '#9BB63A' },
  { altitude: 3000, altitudeFt: 9843, o2Percent: 70, effectiveO2: 14.6, zone: 'High', color: '#D4A843' },
  { altitude: 3500, altitudeFt: 11483, o2Percent: 66, effectiveO2: 13.8, zone: 'High', color: '#E8A838' },
  { altitude: 4000, altitudeFt: 13123, o2Percent: 62, effectiveO2: 13.0, zone: 'Very High', color: '#E8915A' },
  { altitude: 4500, altitudeFt: 14764, o2Percent: 58, effectiveO2: 12.1, zone: 'Very High', color: '#E8915A' },
  { altitude: 5000, altitudeFt: 16404, o2Percent: 54, effectiveO2: 11.3, zone: 'Very High', color: '#D94F4F' },
  { altitude: 5500, altitudeFt: 18045, o2Percent: 50, effectiveO2: 10.5, zone: 'Extreme', color: '#D94F4F' },
  { altitude: 6000, altitudeFt: 19685, o2Percent: 47, effectiveO2: 9.8, zone: 'Extreme', color: '#D94F4F' },
  { altitude: 6500, altitudeFt: 21325, o2Percent: 44, effectiveO2: 9.2, zone: 'Extreme', color: '#C2185B' },
  { altitude: 7000, altitudeFt: 22966, o2Percent: 41, effectiveO2: 8.6, zone: 'Death Zone', color: '#7B68AE' },
  { altitude: 7500, altitudeFt: 24606, o2Percent: 38, effectiveO2: 7.9, zone: 'Death Zone', color: '#7B68AE' },
  { altitude: 8000, altitudeFt: 26247, o2Percent: 36, effectiveO2: 7.5, zone: 'Death Zone', color: '#6652A0' },
  { altitude: 8500, altitudeFt: 27887, o2Percent: 33, effectiveO2: 6.9, zone: 'Death Zone', color: '#5E4095' },
  { altitude: 8849, altitudeFt: 29032, o2Percent: 33, effectiveO2: 6.9, zone: 'Everest', color: '#4A2D82' },
];

export default function O2EquivalentScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'O₂ Equivalent',
          headerTransparent: true,
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700' as const, color: '#FFFFFF' },
          headerStyle: { backgroundColor: 'transparent' },
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: 'https://r2-pub.rork.com/attachments/37ju8kn02uoq9cuh159tp' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.heroIconWrap}>
              <Wind color="#FFFFFF" size={30} />
            </View>
            <Text style={styles.heroTitle}>Oxygen at Altitude</Text>
            <Text style={styles.heroSubtitle}>
              How thin air affects your body as you climb higher
            </Text>
          </View>
        </View>

        <View style={styles.bodyContent}>
          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>33%</Text>
              <Text style={styles.statLabel}>O₂ at Everest</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>7,600m</Text>
              <Text style={styles.statLabel}>Death Zone</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>20.9%</Text>
              <Text style={styles.statLabel}>O₂ at Sea Level</Text>
            </View>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3A9E5C' }]} />
              <Text style={styles.legendText}>Low</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E8A838' }]} />
              <Text style={styles.legendText}>High</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#D94F4F' }]} />
              <Text style={styles.legendText}>Extreme</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#7B68AE' }]} />
              <Text style={styles.legendText}>Death Zone</Text>
            </View>
          </View>

          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colAlt]}>Altitude</Text>
              <Text style={[styles.tableHeaderText, styles.colO2]}>O₂ %</Text>
              <Text style={[styles.tableHeaderText, styles.colEff]}>Eff. O₂</Text>
              <Text style={[styles.tableHeaderText, styles.colZone]}>Zone</Text>
            </View>
            {altitudeData.map((row, index) => (
              <View
                key={row.altitude}
                style={[
                  styles.tableRow,
                  index % 2 === 0 && styles.tableRowAlt,
                ]}
              >
                <View style={styles.colAlt}>
                  <Text style={styles.altPrimary}>{row.altitude.toLocaleString()}m</Text>
                  <Text style={styles.altSecondary}>{row.altitudeFt.toLocaleString()}ft</Text>
                </View>
                <View style={styles.colO2}>
                  <View style={styles.o2BarContainer}>
                    <View
                      style={[
                        styles.o2Bar,
                        { width: `${row.o2Percent}%`, backgroundColor: row.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.o2Text}>{row.o2Percent}%</Text>
                </View>
                <Text style={[styles.effText, styles.colEff]}>{row.effectiveO2}%</Text>
                <View style={styles.colZone}>
                  <View style={[styles.zoneBadge, { backgroundColor: row.color + '15', borderColor: row.color + '35' }]}>
                    <Text style={[styles.zoneText, { color: row.color }]}>{row.zone}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Key Facts</Text>
            <Text style={styles.noteText}>
              • The "Death Zone" begins above ~7,600m (25,000ft){'\n'}
              • Above this altitude, the body deteriorates faster than it can acclimatize{'\n'}
              • Most climbers use supplemental oxygen above 7,000m{'\n'}
              • Effective O₂ shows the equivalent oxygen percentage you'd breathe{'\n'}
              • Acclimatization allows the body to partially compensate
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.snow,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroContainer: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 20, 40, 0.55)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 28,
    left: 20,
    right: 20,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500' as const,
  },
  bodyContent: {
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
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
    fontSize: 11,
    color: Colors.textSecondary,
  },
  tableContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.frost,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tableRowAlt: {
    backgroundColor: Colors.frost + '50',
  },
  colAlt: {
    width: 80,
  },
  colO2: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colEff: {
    width: 50,
    textAlign: 'center',
  },
  colZone: {
    width: 80,
    alignItems: 'flex-end',
  },
  altPrimary: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  altSecondary: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  o2BarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.frost,
    borderRadius: 3,
    overflow: 'hidden',
  },
  o2Bar: {
    height: '100%',
    borderRadius: 3,
  },
  o2Text: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text,
    width: 32,
    textAlign: 'right',
  },
  effText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  zoneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  zoneText: {
    fontSize: 9,
    fontWeight: '700' as const,
  },
  noteCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  noteText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
