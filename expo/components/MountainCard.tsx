import React, { memo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { CheckCircle, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Mountain, categoryLabels } from '@/constants/mountains';
import MountainIcon from '@/components/MountainIcon';

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

  const diffColor =
    mountain.difficulty === 'Extreme' ? Colors.danger :
    mountain.difficulty === 'Hard' ? Colors.warning :
    mountain.difficulty === 'Moderate' ? Colors.accent :
    Colors.success;

  const elevationIntensity = Math.min(mountain.elevation / 8849, 1);

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
        <View
          style={[
            styles.elevationStrip,
            { backgroundColor: categoryColor, opacity: 0.4 + elevationIntensity * 0.6 },
          ]}
        />

        <View style={styles.cardContent}>
          <View style={styles.leftSection}>
            <View style={[styles.iconContainer, { backgroundColor: categoryColor + '18' }]}>
              <MountainIcon mountainId={mountain.id} category={mountain.category} size={26} />
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
            <View style={styles.tagRow}>
              <View style={[styles.categoryTag, { backgroundColor: categoryColor + '18', borderColor: categoryColor + '35' }]}>
                <Text style={[styles.categoryTagText, { color: categoryColor }]}>
                  {categoryLabels[mountain.category]}
                </Text>
              </View>
              <View style={[styles.difficultyTag, { borderColor: diffColor + '25' }]}>
                <View style={[styles.difficultyDot, { backgroundColor: diffColor }]} />
                <Text style={[styles.difficultyText, { color: diffColor }]}>{mountain.difficulty}</Text>
              </View>
            </View>
          </View>

          <View style={styles.rightSection}>
            <Text style={styles.elevation}>{mountain.elevation.toLocaleString()}</Text>
            <Text style={styles.elevationUnit}>meters</Text>
            <Text style={styles.elevationFt}>{mountain.elevationFt.toLocaleString()}ft</Text>
            <ChevronRight color={Colors.textMuted} size={14} style={styles.chevron} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default memo(MountainCardComponent);

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardSummited: {
    borderColor: Colors.success + '40',
  },
  elevationStrip: {
    height: 3,
    width: '100%',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  leftSection: {
    marginRight: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
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
    marginBottom: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    flexShrink: 1,
  },
  location: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 7,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.cardBgLight,
    borderWidth: 1,
    gap: 4,
  },
  difficultyDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  rightSection: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  elevation: {
    fontSize: 17,
    fontWeight: '900' as const,
    color: Colors.accentLight,
    letterSpacing: -0.5,
  },
  elevationUnit: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginTop: -1,
  },
  elevationFt: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  chevron: {
    marginTop: 4,
  },
});
