import React, { memo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

import Colors from '@/constants/colors';
import { Mountain } from '@/constants/mountains';
import MountainIcon from '@/components/MountainIcon';

interface MountainCardProps {
  mountain: Mountain;
  isSummited: boolean;
  summitDate?: string;
  onPress: () => void;
  useFeet?: boolean;
}

function MountainCardComponent({ mountain, isSummited, summitDate, onPress, useFeet = false }: MountainCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[
          styles.card,
          isSummited && styles.cardSummited,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        testID={`mountain-card-${mountain.id}`}
      >
        <View style={styles.cardContent}>
          <View style={styles.leftSection}>
            <MountainIcon mountainId={mountain.id} category={mountain.category} size={34} />
          </View>

          <View style={styles.centerSection}>
            <Text style={styles.name} numberOfLines={1}>{mountain.name}</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {mountain.country} · {mountain.range}
            </Text>
          </View>

          {isSummited && (
            <View style={styles.summitCenter}>
              <View style={styles.summitBadge}>
                <Text style={styles.summitBadgeText}>SUMMITED</Text>
              </View>
              {summitDate && (
                <View style={styles.dateBox}>
                  <Text style={styles.dateText}>{formatSummitDate(summitDate)}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.rightSection}>
            <Text style={[styles.elevation, isSummited && styles.elevationSummited]}>
              {useFeet
                ? `${mountain.elevationFt.toLocaleString()} ft`
                : `${mountain.elevation.toLocaleString()} m`}
            </Text>
            <Text style={styles.elevationAlt}>
              {useFeet
                ? `${mountain.elevation.toLocaleString()} m`
                : `${mountain.elevationFt.toLocaleString()} ft`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function formatSummitDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  } catch {
    return dateStr;
  }
}

export default memo(MountainCardComponent);

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 0,
  },
  card: {
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border + '50',
  },
  cardSummited: {
    backgroundColor: 'rgba(192, 57, 43, 0.03)',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 18,
  },
  leftSection: {
    marginRight: 14,
    width: 36,
    alignItems: 'center',
  },
  centerSection: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    flexShrink: 1,
  },
  summitCenter: {
    alignItems: 'center',
    marginRight: 12,
  },
  summitBadge: {
    borderWidth: 2,
    borderColor: '#C0392B',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    transform: [{ rotate: '-4deg' }],
  },
  summitBadgeText: {
    fontSize: 8,
    fontWeight: '900' as const,
    color: '#C0392B',
    letterSpacing: 1.5,
  },
  dateBox: {
    backgroundColor: '#2E86C1',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  dateText: {
    fontSize: 7,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  elevation: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  elevationSummited: {
    color: Colors.text,
  },
  elevationAlt: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
});
