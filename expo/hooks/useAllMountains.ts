import { useMemo } from 'react';
import { mountains, Mountain } from '@/constants/mountains';
import { useCustomMountains } from '@/contexts/CustomMountainsContext';

export function useAllMountains(): Mountain[] {
  const { customMountains } = useCustomMountains();

  return useMemo(() => {
    return [...mountains, ...customMountains];
  }, [customMountains]);
}

export function useFindMountain(id: string | undefined): Mountain | undefined {
  const allMountains = useAllMountains();
  return useMemo(() => {
    if (!id) return undefined;
    return allMountains.find((m) => m.id === id);
  }, [allMountains, id]);
}
