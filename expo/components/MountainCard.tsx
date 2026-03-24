import React, { memo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

import Colors from '@/constants/colors';
import { Mountain } from '@/constants/mountains';
import MountainIcon from '@/components/MountainIcon';

interface MountainCardProps {
  mountain: Mountain;
  isSummited: boolean;
  onPress: () => void;
  useFeet?: boolean;
}

function MountainCardComponent({ mountain, isSummited, onPress, useFeet = false }: MountainCardProps) {
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
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{mountain.name}</Text>
            </View>
          </View>

          <View style={styles.rightSection}>
            <Text style={styles.elevation}>
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

          {isSummited && (
            <View style={styles.stampContainer}>
              <View style={styles.stamp}>
                <Text style={styles.stampText}>SUMMITED</Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
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
    backgroundColor: 'rgba(58, 158, 92, 0.04)',
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    flexShrink: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  stampContainer: {
    position: 'absolute' as const,
    right: 14,
    top: 6,
    transform: [{ rotate: '-12deg' }],
  },
  stamp: {
    borderWidth: 2,
    borderColor: '#C0392B',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(192, 57, 43, 0.08)',
  },
  stampText: {
    fontSize: 8,
    fontWeight: '900' as const,
    color: '#C0392B',
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  elevation: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  elevationAlt: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
});
