import React, { memo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
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

  const categoryColor = Colors.categoryColors[mountain.category] ?? Colors.accent;

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
            <View style={[styles.iconContainer, { backgroundColor: categoryColor + '15' }]}>
              <MountainIcon mountainId={mountain.id} category={mountain.category} size={22} />
            </View>
          </View>

          <View style={styles.centerSection}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{mountain.name}</Text>
              {isSummited && (
                <CheckCircle color={Colors.success} size={15} />
              )}
            </View>
            <Text style={styles.location} numberOfLines={1}>
              {mountain.country} · {mountain.range}
            </Text>
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
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default memo(MountainCardComponent);

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 2,
  },
  card: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '60',
  },
  cardSummited: {
    backgroundColor: '#F0F8F0',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  leftSection: {
    marginRight: 12,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
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
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    flexShrink: 1,
  },
  location: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  elevation: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  elevationAlt: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
});
