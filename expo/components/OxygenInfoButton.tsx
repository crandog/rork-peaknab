import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Info } from 'lucide-react-native';
import Colors from '@/constants/colors';
import OxygenSourcesSheet from './OxygenSourcesSheet';

interface OxygenInfoButtonProps {
  color?: string;
  size?: number;
}

function OxygenInfoButton({ color, size = 14 }: OxygenInfoButtonProps) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.6}
        accessibilityLabel="About the oxygen figure. Sources."
        accessibilityRole="button"
      >
        <Info color={color ?? Colors.textMuted} size={size} />
      </TouchableOpacity>
      <OxygenSourcesSheet
        visible={visible}
        onClose={() => setVisible(false)}
      />
    </>
  );
}

export default OxygenInfoButton;
