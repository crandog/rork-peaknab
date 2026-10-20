import { Image as ExpoImage } from 'expo-image';
import React, { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { getMountainImage, mountainImages } from '@/constants/mountainImages';
import { getMountainPhotoThumb } from '@/constants/mountainPhotoThumbs';
import { useSummits } from '@/contexts/SummitContext';
import FrostPeakPlaceholder from '@/components/FrostPeakPlaceholder';

interface MountainPhotoProps {
  mountainId?: string;
  /** Size/position style for the photo (the wrapper view fills it). */
  style: StyleProp<ViewStyle>;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

/**
 * Most recent attached summit photo for a peak (custom peaks have no bundled
 * photo — they show the user's own photo when they attached one).
 */
export function useLatestSummitPhoto(mountainId: string | undefined, enabled: boolean): string | null {
  const { records } = useSummits();
  return useMemo(() => {
    if (!enabled || !mountainId) return null;
    const withPhoto = records.filter((r) => r.mountainId === mountainId && r.photoUri);
    if (withPhoto.length === 0) return null;
    const latest = withPhoto.reduce((a, b) =>
      new Date(b.createdAt).getTime() > new Date(a.createdAt).getTime() ? b : a
    );
    return latest.photoUri ?? null;
  }, [enabled, mountainId, records]);
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
 *   remains.
 * - Peaks without a bundled photo (custom peaks) never reuse another peak's
 *   photo: they show the user's most recent attached summit photo, or a
 *   neutral frost placeholder when there is none.
 * - `recyclingKey` + state reset guarantee rapid navigation between peaks
 *   never shows the previous mountain's photo.
 */
export const MountainPhoto = memo(function MountainPhoto({
  mountainId,
  style,
  contentFit = 'cover',
}: MountainPhotoProps) {
  const thumb = mountainId ? getMountainPhotoThumb(mountainId) : undefined;
  const hasBundledPhoto = mountainId != null && mountainImages[mountainId] != null;
  const remoteUrl = hasBundledPhoto ? getMountainImage(mountainId) : '';
  const latestSummitPhoto = useLatestSummitPhoto(mountainId, !hasBundledPhoto);
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
      {thumb == null && !hasBundledPhoto && (
        latestSummitPhoto ? (
          <ExpoImage
            source={{ uri: latestSummitPhoto }}
            style={StyleSheet.absoluteFill}
            contentFit={contentFit}
            cachePolicy="memory-disk"
            recyclingKey={mountainId}
            transition={150}
          />
        ) : (
          <FrostPeakPlaceholder iconSize={44} />
        )
      )}
    </View>
  );
});
