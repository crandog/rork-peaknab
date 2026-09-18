import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

const STORAGE_KEY = 'peaknab_use_feet';

/**
 * App-wide elevation unit preference (the FT/M toggle on the peaks list).
 * Persisted locally so screens like the share card can default to it.
 */
export const [UnitsProvider, useUnits] = createContextHook(() => {
  const [useFeet, setUseFeetState] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored != null) setUseFeetState(stored === 'true');
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const setUseFeet = useCallback((value: boolean) => {
    setUseFeetState(value);
    AsyncStorage.setItem(STORAGE_KEY, value ? 'true' : 'false').catch(() => {});
  }, []);

  return { useFeet, setUseFeet, isLoaded };
});
