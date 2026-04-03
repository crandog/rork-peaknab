import React, { memo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Mountain } from '@/constants/mountains';
import { getMountainIconUrl } from '@/constants/mountainIcons';

interface MountainCardProps {
  mountain: Mountain;
  isSummited: boolean;
  summitDate?: string;
  summitCount?: number;
  onPress: () => void;
  useFeet?: boolean;
}

function MountainCardComponent({ mountain, isSummited, summitDate, summitCount = 0, onPress, useFeet = false }: MountainCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [imgError, setImgError] = useState(false);
  const iconUrl = getMountainIconUrl(mountain.id);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
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

  const elevationPrimary = useFeet
    ? `${mountain.elevationFt.toLocaleString()} ft`
    : `${mountain.elevation.toLocaleString()} m`;

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        testID={`mountain-card-${mountain.id}`}
      >
        {!imgError ? (
          <Image
            source={{ uri: iconUrl }}
            style={styles.bgImage}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={[styles.bgImage, styles.bgFallback]} />
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.72)']}
          locations={[0, 0.4, 1]}
          style={styles.gradient}
        />

        {isSummited && (
          <View style={styles.summitOverlay}>
            <View style={styles.summitBadge}>
              <Text style={styles.summitBadgeText}>SUMMITED</Text>
            </View>
            {summitCount > 1 && (
              <View style={styles.summitCountBadge}>
                <Text style={styles.summitCountText}>x{summitCount}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.elevationTag}>
          <Text style={styles.elevationTagText}>{elevationPrimary}</Text>
        </View>

        <View style={styles.infoOverlay}>
          <Text style={styles.name} numberOfLines={1}>{mountain.name}</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {mountain.country} · {mountain.range}
          </Text>
          {isSummited && summitDate && (
            <Text style={styles.dateText}>{formatSummitDate(summitDate)}</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function formatSummitDate(dateStr: string): string {
  const MONTHS: Record<string, string> = {
    'January': 'JAN', 'February': 'FEB', 'March': 'MAR', 'April': 'APR',
    'May': 'MAY', 'June': 'JUN', 'July': 'JUL', 'August': 'AUG',
    'September': 'SEP', 'October': 'OCT', 'November': 'NOV', 'December': 'DEC',
  };
  const parts = dateStr.match(/^(\w+)\s+(\d+),\s+(\d+)$/);
  if (parts) {
    const monthAbbr = MONTHS[parts[1]] ?? parts[1].slice(0, 3).toUpperCase();
    return `${monthAbbr} ${parts[2]}, ${parts[3]}`;
  }
  return dateStr;
}

export default memo(MountainCardComponent);

const styles = StyleSheet.create({
  cardWrapper: {
    width: '50%',
    padding: 4,
  },
  card: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1A3350',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  bgFallback: {
    backgroundColor: '#2E5A85',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  summitOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summitBadge: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    backgroundColor: 'rgba(192, 57, 43, 0.85)',
    transform: [{ rotate: '-3deg' }],
  },
  summitBadgeText: {
    fontSize: 7,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  summitCountBadge: {
    backgroundColor: 'rgba(192, 57, 43, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  summitCountText: {
    fontSize: 8,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  elevationTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  elevationTagText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 6,
  },
  name: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  locationText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
  },
  dateText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
    letterSpacing: 0.3,
  },
});
