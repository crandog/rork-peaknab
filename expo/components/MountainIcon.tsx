import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MountainCategory } from '@/constants/mountains';
import { getSilhouette } from '@/constants/silhouettes';
import Colors from '@/constants/colors';

interface MountainIconProps {
  mountainId?: string;
  category: MountainCategory;
  size?: number;
  color?: string;
}

function MountainIconComponent({ mountainId, category, size = 24, color }: MountainIconProps) {
  const baseColor = color ?? Colors.mountainIcon;
  const silhouette = getSilhouette(mountainId ?? '');

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 100 70"
      >
        <Path
          d={silhouette.path}
          fill={baseColor}
          opacity={0.9}
        />
        {silhouette.snowPath && (
          <Path
            d={silhouette.snowPath}
            fill="#FFFFFF"
            opacity={0.85}
          />
        )}
      </Svg>
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
