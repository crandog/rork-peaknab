import React, { memo, useMemo, useState } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { MountainCategory } from '@/constants/mountains';
import { getMountainIconSource } from '@/constants/mountainIcons';
import Colors from '@/constants/colors';
import { useLatestSummitPhoto } from '@/components/MountainPhoto';
import FrostPeakPlaceholder from '@/components/FrostPeakPlaceholder';

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
  'volcanic': '🌋',
};

function MountainIconComponent({ mountainId, category, size = 24 }: MountainIconProps) {
  const iconSource = getMountainIconSource(mountainId ?? 'default');
  const [error, setHasError] = useState(false);

  // Custom peaks have no bundled imagery: show the user's most recent
  // attached summit photo, or a neutral frost placeholder.
  const isCustom = category === 'custom';
  const latestPhoto = useLatestSummitPhoto(mountainId, isCustom);
  const customPhoto = useMemo(
    () => (isCustom ? latestPhoto : null),
    [isCustom, latestPhoto]
  );

  if (isCustom) {
    return (
      <View
        style={[
          styles.container,
          { width: size, height: size, borderRadius: Math.round(size * 0.21), overflow: 'hidden' },
        ]}
      >
        {customPhoto ? (
          <Image
            source={{ uri: customPhoto }}
            style={{ width: size, height: size }}
            resizeMode="cover"
          />
        ) : (
          <FrostPeakPlaceholder iconSize={Math.round(size * 0.45)} />
        )}
      </View>
    );
  }

  if (error) {
    return (
      <View style={[
        styles.fallbackContainer,
        {
          width: size,
          height: size,
          borderRadius: 0,
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
      },
    ]}>
      <Image
        source={iconSource}
        style={{
          width: size,
          height: size,
        }}
        resizeMode="contain"
        onError={() => {
          console.log('MountainIcon load error for:', mountainId);
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
    overflow: 'visible',
    backgroundColor: 'transparent',
    borderRadius: 0,
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 0,
  },
});
