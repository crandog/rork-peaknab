import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

const STORY_TIP_KEY = 'share_story_tip_dismissed_v1';

/**
 * Small persisted settings for the share flow — currently only whether the
 * user dismissed the Instagram Stories "add a link sticker" tip forever.
 */
export const [ShareSettingsProvider, useShareSettings] = createContextHook(() => {
  const [storyTipDismissed, setStoryTipDismissed] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    AsyncStorage.getItem(STORY_TIP_KEY)
      .then((v) => {
        setStoryTipDismissed(v === 'true');
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const dismissStoryTip = useCallback(async () => {
    setStoryTipDismissed(true);
    try {
      await AsyncStorage.setItem(STORY_TIP_KEY, 'true');
    } catch (e) {
      console.log('[ShareSettings] Failed to persist tip dismissal:', e);
    }
  }, []);

  return useMemo(
    () => ({ storyTipDismissed, dismissStoryTip, isLoaded }),
    [storyTipDismissed, dismissStoryTip, isLoaded],
  );
});
