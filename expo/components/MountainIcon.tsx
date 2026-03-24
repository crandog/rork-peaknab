import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, ClipPath } from 'react-native-svg';
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

  const lightBlue = Colors.accentLight || '#5B8EC2';
  const midBlue = baseColor;
  const darkBlue = Colors.accentDark || '#1E4A72';

  const mainPath = silhouette.basePath || silhouette.path || '';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 100 70"
      >
        <Defs>
          <LinearGradient id={`grad-${mountainId}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lightBlue} stopOpacity="1" />
            <Stop offset="1" stopColor={midBlue} stopOpacity="1" />
          </LinearGradient>
          <ClipPath id={`clip-${mountainId}`}>
            <Path d={mainPath} />
          </ClipPath>
        </Defs>

        <Path
          d={mainPath}
          fill={`url(#grad-${mountainId})`}
        />

        {silhouette.shadowPath && (
          <Path
            d={silhouette.shadowPath}
            fill={darkBlue}
            opacity={0.35}
            clipPath={`url(#clip-${mountainId})`}
          />
        )}

        {silhouette.detailPath && (
          <Path
            d={silhouette.detailPath}
            fill="none"
            stroke={darkBlue}
            strokeWidth={0.6}
            opacity={0.2}
            clipPath={`url(#clip-${mountainId})`}
          />
        )}

        {silhouette.ridgePath && (
          <Path
            d={silhouette.ridgePath}
            fill="none"
            stroke={lightBlue}
            strokeWidth={0.8}
            opacity={0.4}
            clipPath={`url(#clip-${mountainId})`}
          />
        )}

        {silhouette.snowPath && (
          <Path
            d={silhouette.snowPath}
            fill="#FFFFFF"
            opacity={0.9}
            clipPath={`url(#clip-${mountainId})`}
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
