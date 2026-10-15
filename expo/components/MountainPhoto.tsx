import { Image as ExpoImage } from 'expo-image';
import React, { memo, useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { getMountainImage } from '@/constants/mountainImages';
import { getMountainPhotoThumb } from '@/constants/mountainPhotoThumbs';

/** Shown only when a mountain has no bundled photo (e.g. custom peaks). */
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=960&q=80';

interface MountainPhotoProps {
  mountainId?: string;
  /** Size/position style for the photo (the wrapper view fills it). */
  style: StyleProp<ViewStyle>;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

/**
 * Progressive mountain photo: renders the bundled lightweight WebP instantly,
 * then loads the full-resolution remote copy for that mountain on top of it.
 *
 * - The local photo stays visible until the remote image has fully loaded
 *   (the remote layer only renders over it).
 * - The remote copy uses expo-image's disk cache, so repeat visits load it
 *   locally without a network round trip.
 * - On network failure the remote layer is dropped and the bundled photo
 *   remains (custom peaks without a bundled photo fall back to a generic
 *   background image, matching the previous behavior).
 * - `recyclingKey` + state reset guarantee rapid navigation between peaks
 *   never shows the previous mountain's photo.
 */
export const MountainPhoto = memo(function MountainPhoto({
  mountainId,
  style,
  contentFit = 'cover',
}: MountainPhotoProps) {
  const thumb = mountainId ? getMountainPhotoThumb(mountainId) : undefined;
  const remoteUrl = mountainId ? getMountainImage(mountainId) : '';
  const [remoteFailed, setRemoteFailed] = useState<boolean>(false);

  // Reset when the same screen instance is reused for a different peak.
  useEffect(() => {
    setRemoteFailed(false);
  }, [mountainId]);

  return (
    <View style={style}>
      {thumb != null && (
        <ExpoImage
          source={thumb}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
        />
      )}
      {remoteUrl !== '' && !remoteFailed && (
        <ExpoImage
          source={{ uri: remoteUrl }}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
          cachePolicy="memory-disk"
          recyclingKey={mountainId}
          transition={150}
          onError={() => setRemoteFailed(true)}
        />
      )}
      {thumb == null && remoteFailed && (
        <ExpoImage
          source={{ uri: FALLBACK_IMAGE }}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
        />
      )}
    </View>
  );
});
