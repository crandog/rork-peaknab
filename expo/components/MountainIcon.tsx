import React, { memo, useState } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { MountainCategory } from '@/constants/mountains';
import { getMountainIconUrl } from '@/constants/mountainIcons';
import Colors from '@/constants/colors';

interface MountainIconProps {
  mountainId?: string;
  category: MountainCategory;
  size?: number;
  color?: string;
}

const categoryEmojis: Record<string, string> = {
  '7summits': '🏔️',
  '8000m': '⛰️',
  '14ers': '🏔️',
  'alps': '🗻',
  'andes': '🌋',
  'himalaya': '🏔️',
  'other': '⛰️',
  'custom': '📍',
};

function MountainIconComponent({ mountainId, category, size = 24 }: MountainIconProps) {
  const iconUrl = getMountainIconUrl(mountainId ?? 'default');
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <View style={[
        styles.fallbackContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: Colors.categoryColors[category] ?? Colors.primary,
        },
      ]}>
        <Text style={{ fontSize: size * 0.5 }}>{categoryEmojis[category] ?? '⛰️'}</Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
      },
    ]}>
      <Image
        source={{ uri: iconUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
        resizeMode="cover"
        onError={() => {
          console.log('MountainIcon load error for:', mountainId, iconUrl);
          setHasError(true);
        }}
      />
    </View>
  );
}

export default memo(MountainIconComponent);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: Colors.frost,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 111, 160, 0.15)',
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
