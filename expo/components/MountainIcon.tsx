import React, { memo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { MountainCategory } from '@/constants/mountains';
import { getMountainIconUrl } from '@/constants/mountainIcons';

interface MountainIconProps {
  mountainId?: string;
  category: MountainCategory;
  size?: number;
  color?: string;
}

function MountainIconComponent({ mountainId, size = 24 }: MountainIconProps) {
  const iconUrl = getMountainIconUrl(mountainId ?? 'default');

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={{ uri: iconUrl }}
        style={{ width: size, height: size }}
        resizeMode="contain"
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
  },
});
