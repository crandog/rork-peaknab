import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mountain } from 'lucide-react-native';

/**
 * Neutral placeholder for peaks without a bundled photo (custom peaks):
 * a frost-blue gradient with a centred white Mountain icon.
 */
export default function FrostPeakPlaceholder({
  style,
  iconSize = 40,
}: {
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
}) {
  return (
    <LinearGradient
      colors={['#E4EEF8', '#C9DCEE']}
      style={[StyleSheet.absoluteFill, style]}
    >
      <View style={styles.center}>
        <Mountain color="#FFFFFF" size={iconSize} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
