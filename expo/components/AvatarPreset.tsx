import React, { useMemo } from 'react';
import { SvgXml } from 'react-native-svg';
import { AVATAR_PRESETS, presetSvg } from '@/constants/avatarPresets';

interface AvatarPresetProps {
  id: string;
  size: number;
}

/**
 * Renders a preset avatar icon as a self-contained SVG tile.
 * Each SVG includes its own gradient background + white glyph,
 * so it fills whatever square size you give it.
 */
function AvatarPresetBase({ id, size }: AvatarPresetProps) {
  const preset = AVATAR_PRESETS.find((p) => p.id === id);
  const xml = useMemo(
    () => (preset ? presetSvg(preset.glyph) : ''),
    [preset],
  );
  if (!preset) return null;
  return <SvgXml xml={xml} width={size} height={size} />;
}

export const AvatarPreset = React.memo(AvatarPresetBase);
export default AvatarPreset;
