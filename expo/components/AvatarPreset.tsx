import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { presetSvg } from '@/constants/avatarPresets';

interface AvatarPresetProps {
  id: string;
  size?: number;
}

/** Full-bleed preset avatar. Fills its parent; the parent's borderRadius + overflow:'hidden' shapes it. */
function AvatarPresetBase({ id }: AvatarPresetProps) {
  const xml = useMemo(() => presetSvg(id), [id]);
  if (!xml) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <SvgXml xml={xml} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
    </View>
  );
}

export const AvatarPreset = React.memo(AvatarPresetBase);
export default AvatarPreset;
