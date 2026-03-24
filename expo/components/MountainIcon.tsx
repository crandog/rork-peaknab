import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { MountainCategory } from '@/constants/mountains';
import Colors from '@/constants/colors';

interface MountainIconProps {
  category: MountainCategory;
  difficulty: string;
  size?: number;
  color?: string;
}

function MountainIconComponent({ category, difficulty, size = 24, color }: MountainIconProps) {
  const baseColor = color ?? Colors.categoryColors[category] ?? Colors.accent;
  const scale = size / 24;

  const peakVariant = getPeakVariant(category, difficulty);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {peakVariant === 'twin' && (
        <>
          <View
            style={[
              styles.peak,
              {
                width: 0,
                height: 0,
                borderLeftWidth: 7 * scale,
                borderRightWidth: 7 * scale,
                borderBottomWidth: 14 * scale,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: baseColor,
                position: 'absolute',
                bottom: 2 * scale,
                left: 1 * scale,
                opacity: 0.6,
              },
            ]}
          />
          <View
            style={[
              styles.peak,
              {
                width: 0,
                height: 0,
                borderLeftWidth: 8 * scale,
                borderRightWidth: 8 * scale,
                borderBottomWidth: 16 * scale,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: baseColor,
                position: 'absolute',
                bottom: 2 * scale,
                right: 1 * scale,
              },
            ]}
          />
          <View
            style={[
              styles.snowCap,
              {
                width: 0,
                height: 0,
                borderLeftWidth: 3 * scale,
                borderRightWidth: 3 * scale,
                borderBottomWidth: 5 * scale,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: '#FFFFFF',
                position: 'absolute',
                top: 4 * scale,
                right: 6 * scale,
                opacity: 0.9,
              },
            ]}
          />
        </>
      )}

      {peakVariant === 'jagged' && (
        <>
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 5 * scale,
              borderRightWidth: 5 * scale,
              borderBottomWidth: 12 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: baseColor,
              position: 'absolute',
              bottom: 2 * scale,
              left: 0,
              opacity: 0.5,
            }}
          />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 6 * scale,
              borderRightWidth: 6 * scale,
              borderBottomWidth: 18 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: baseColor,
              position: 'absolute',
              bottom: 2 * scale,
              left: 5 * scale,
            }}
          />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 5 * scale,
              borderRightWidth: 5 * scale,
              borderBottomWidth: 10 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: baseColor,
              position: 'absolute',
              bottom: 2 * scale,
              right: 0,
              opacity: 0.7,
            }}
          />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 2.5 * scale,
              borderRightWidth: 2.5 * scale,
              borderBottomWidth: 4 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: '#FFFFFF',
              position: 'absolute',
              top: 2 * scale,
              left: 8.5 * scale,
              opacity: 0.9,
            }}
          />
        </>
      )}

      {peakVariant === 'broad' && (
        <>
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 10 * scale,
              borderRightWidth: 10 * scale,
              borderBottomWidth: 14 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: baseColor,
              position: 'absolute',
              bottom: 2 * scale,
              alignSelf: 'center',
              opacity: 0.5,
            }}
          />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 7 * scale,
              borderRightWidth: 7 * scale,
              borderBottomWidth: 16 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: baseColor,
              position: 'absolute',
              bottom: 2 * scale,
              alignSelf: 'center',
            }}
          />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 3 * scale,
              borderRightWidth: 3 * scale,
              borderBottomWidth: 5 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: '#FFFFFF',
              position: 'absolute',
              top: 4 * scale,
              alignSelf: 'center',
              opacity: 0.85,
            }}
          />
        </>
      )}

      {peakVariant === 'sharp' && (
        <>
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 9 * scale,
              borderRightWidth: 9 * scale,
              borderBottomWidth: 10 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: baseColor,
              position: 'absolute',
              bottom: 2 * scale,
              alignSelf: 'center',
              opacity: 0.4,
            }}
          />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 5 * scale,
              borderRightWidth: 5 * scale,
              borderBottomWidth: 19 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: baseColor,
              position: 'absolute',
              bottom: 2 * scale,
              alignSelf: 'center',
            }}
          />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 2 * scale,
              borderRightWidth: 2 * scale,
              borderBottomWidth: 4 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: '#FFFFFF',
              position: 'absolute',
              top: 1 * scale,
              alignSelf: 'center',
              opacity: 0.9,
            }}
          />
        </>
      )}

      {peakVariant === 'layered' && (
        <>
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 11 * scale,
              borderRightWidth: 11 * scale,
              borderBottomWidth: 8 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: baseColor,
              position: 'absolute',
              bottom: 2 * scale,
              alignSelf: 'center',
              opacity: 0.3,
            }}
          />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 8 * scale,
              borderRightWidth: 8 * scale,
              borderBottomWidth: 12 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: baseColor,
              position: 'absolute',
              bottom: 4 * scale,
              alignSelf: 'center',
              opacity: 0.6,
            }}
          />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 5 * scale,
              borderRightWidth: 5 * scale,
              borderBottomWidth: 14 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: baseColor,
              position: 'absolute',
              bottom: 6 * scale,
              alignSelf: 'center',
            }}
          />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 2.5 * scale,
              borderRightWidth: 2.5 * scale,
              borderBottomWidth: 4 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: '#FFFFFF',
              position: 'absolute',
              top: 2 * scale,
              alignSelf: 'center',
              opacity: 0.85,
            }}
          />
        </>
      )}

      {peakVariant === 'classic' && (
        <>
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 8 * scale,
              borderRightWidth: 8 * scale,
              borderBottomWidth: 12 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: baseColor,
              position: 'absolute',
              bottom: 2 * scale,
              left: 2 * scale,
              opacity: 0.45,
            }}
          />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 7 * scale,
              borderRightWidth: 7 * scale,
              borderBottomWidth: 17 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: baseColor,
              position: 'absolute',
              bottom: 2 * scale,
              right: 3 * scale,
            }}
          />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 3 * scale,
              borderRightWidth: 3 * scale,
              borderBottomWidth: 5 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: '#FFFFFF',
              position: 'absolute',
              top: 3 * scale,
              right: 7 * scale,
              opacity: 0.9,
            }}
          />
        </>
      )}

      {peakVariant === 'ridge' && (
        <>
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 6 * scale,
              borderRightWidth: 6 * scale,
              borderBottomWidth: 14 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: baseColor,
              position: 'absolute',
              bottom: 2 * scale,
              left: 1 * scale,
              opacity: 0.7,
            }}
          />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 6 * scale,
              borderRightWidth: 6 * scale,
              borderBottomWidth: 16 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: baseColor,
              position: 'absolute',
              bottom: 2 * scale,
              alignSelf: 'center',
            }}
          />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 5 * scale,
              borderRightWidth: 5 * scale,
              borderBottomWidth: 11 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: baseColor,
              position: 'absolute',
              bottom: 2 * scale,
              right: 1 * scale,
              opacity: 0.55,
            }}
          />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 2.5 * scale,
              borderRightWidth: 2.5 * scale,
              borderBottomWidth: 4 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: '#FFFFFF',
              position: 'absolute',
              top: 4 * scale,
              alignSelf: 'center',
              opacity: 0.9,
            }}
          />
        </>
      )}
    </View>
  );
}

function getPeakVariant(category: MountainCategory, difficulty: string): string {
  switch (category) {
    case '7summits':
      return difficulty === 'Extreme' ? 'sharp' : 'classic';
    case '8000m':
      return difficulty === 'Extreme' ? 'jagged' : 'sharp';
    case '14ers':
      return 'broad';
    case 'alps':
      return 'twin';
    case 'andes':
      return 'layered';
    case 'himalaya':
      return 'ridge';
    case 'other':
      return 'classic';
    default:
      return 'classic';
  }
}

export default memo(MountainIconComponent);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  peak: {},
  snowCap: {},
});
