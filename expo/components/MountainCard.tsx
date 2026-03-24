import React, { memo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { CheckCircle, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Mountain, categoryLabels } from '@/constants/mountains';

interface MountainCardProps {
  mountain: Mountain;
  isSummited: boolean;
  onPress: () => void;
}

function MountainCardComponent({ mountain, isSummited, onPress }: MountainCardProps) {
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
        style={[styles.card, isSummited && styles.cardSummited]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        testID={`mountain-card-${mountain.id}`}
      >
        <View style={styles.leftSection}>
          <View style={[styles.iconContainer, { backgroundColor: categoryColor + '20' }]}>
            <Text style={styles.emoji}>{mountain.iconEmoji}</Text>
          </View>
        </View>

        <View style={styles.centerSection}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{mountain.name}</Text>
            {isSummited && (
              <CheckCircle color={Colors.success} size={16} />
            )}
          </View>
          <Text style={styles.location} numberOfLines={1}>
            {mountain.country} · {mountain.range}
          </Text>
          <View style={styles.tagRow}>
            <View style={[styles.categoryTag, { backgroundColor: categoryColor + '25', borderColor: categoryColor + '40' }]}>
              <Text style={[styles.categoryTagText, { color: categoryColor }]}>
                {categoryLabels[mountain.category]}
              </Text>
            </View>
            <View style={styles.difficultyTag}>
              <Text style={styles.difficultyText}>{mountain.difficulty}</Text>
            </View>
          </View>
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.elevation}>{mountain.elevation.toLocaleString()}m</Text>
          <Text style={styles.elevationFt}>{mountain.elevationFt.toLocaleString()}ft</Text>
          <ChevronRight color={Colors.textMuted} size={16} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default memo(MountainCardComponent);

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardSummited: {
    borderColor: Colors.success + '50',
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  leftSection: {
    marginRight: 12,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 22,
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
    fontWeight: '700' as const,
    color: Colors.white,
    flexShrink: 1,
  },
  location: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  difficultyTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.cardBgLight,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 2,
  },
  elevation: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.accentLight,
  },
  elevationFt: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
});
