import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Wind } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface AltitudeRow {
  altitude: number;
  altitudeFt: number;
  o2Percent: number;
  effectiveO2: number;
  zone: string;
  color: string;
}

const altitudeData: AltitudeRow[] = [
  { altitude: 0, altitudeFt: 0, o2Percent: 100, effectiveO2: 20.9, zone: 'Sea Level', color: '#4CAF50' },
  { altitude: 1000, altitudeFt: 3281, o2Percent: 88, effectiveO2: 18.4, zone: 'Low', color: '#4CAF50' },
  { altitude: 2000, altitudeFt: 6562, o2Percent: 78, effectiveO2: 16.3, zone: 'Moderate', color: '#8BC34A' },
  { altitude: 2500, altitudeFt: 8202, o2Percent: 74, effectiveO2: 15.5, zone: 'Moderate', color: '#CDDC39' },
  { altitude: 3000, altitudeFt: 9843, o2Percent: 70, effectiveO2: 14.6, zone: 'High', color: '#FFEB3B' },
  { altitude: 3500, altitudeFt: 11483, o2Percent: 66, effectiveO2: 13.8, zone: 'High', color: '#FFC107' },
  { altitude: 4000, altitudeFt: 13123, o2Percent: 62, effectiveO2: 13.0, zone: 'Very High', color: '#FF9800' },
  { altitude: 4500, altitudeFt: 14764, o2Percent: 58, effectiveO2: 12.1, zone: 'Very High', color: '#FF9800' },
  { altitude: 5000, altitudeFt: 16404, o2Percent: 54, effectiveO2: 11.3, zone: 'Very High', color: '#FF5722' },
  { altitude: 5500, altitudeFt: 18045, o2Percent: 50, effectiveO2: 10.5, zone: 'Extreme', color: '#F44336' },
  { altitude: 6000, altitudeFt: 19685, o2Percent: 47, effectiveO2: 9.8, zone: 'Extreme', color: '#F44336' },
  { altitude: 6500, altitudeFt: 21325, o2Percent: 44, effectiveO2: 9.2, zone: 'Extreme', color: '#E91E63' },
  { altitude: 7000, altitudeFt: 22966, o2Percent: 41, effectiveO2: 8.6, zone: 'Death Zone', color: '#9C27B0' },
  { altitude: 7500, altitudeFt: 24606, o2Percent: 38, effectiveO2: 7.9, zone: 'Death Zone', color: '#9C27B0' },
  { altitude: 8000, altitudeFt: 26247, o2Percent: 36, effectiveO2: 7.5, zone: 'Death Zone', color: '#6A1B9A' },
  { altitude: 8500, altitudeFt: 27887, o2Percent: 33, effectiveO2: 6.9, zone: 'Death Zone', color: '#4A148C' },
  { altitude: 8849, altitudeFt: 29032, o2Percent: 33, effectiveO2: 6.9, zone: 'Everest', color: '#311B92' },
];

export default function O2EquivalentScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'O₂ Equivalent',
          headerStyle: { backgroundColor: Colors.secondary },
          headerTintColor: Colors.text,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Wind color={Colors.accentLight} size={28} />
          <Text style={styles.infoTitle}>Oxygen at Altitude</Text>
          <Text style={styles.infoText}>
            As altitude increases, atmospheric pressure decreases, reducing the amount of oxygen available. At 8,000m, you breathe only ~33% of the oxygen available at sea level.
          </Text>
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Low</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFC107' }]} />
            <Text style={styles.legendText}>High</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF5722' }]} />
            <Text style={styles.legendText}>Extreme</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#9C27B0' }]} />
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
                <View style={[styles.zoneBadge, { backgroundColor: row.color + '25', borderColor: row.color + '50' }]}>
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
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
    marginTop: 10,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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
    backgroundColor: Colors.cardBg,
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
    backgroundColor: Colors.cardBgLight,
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
    backgroundColor: Colors.cardBgLight + '30',
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
    color: Colors.accentLight,
  },
  altSecondary: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  o2BarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.primary,
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
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 10,
  },
  noteText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
