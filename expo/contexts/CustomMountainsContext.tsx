import { useEffect, useMemo, useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { Mountain } from '@/constants/mountains';
import { debouncedCloudPush, enqueueTombstone, setPendingSyncFlag, Tombstone } from '@/lib/cloudSync';

const STORAGE_KEY = 'custom_mountains';

export const [CustomMountainsProvider, useCustomMountains] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [customMountains, setCustomMountains] = useState<Mountain[]>([]);

  const query = useQuery({
    queryKey: ['custom_mountains'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as Mountain[]) : [];
    },
  });

  useEffect(() => {
    if (query.data) {
      setCustomMountains(query.data);
    }
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: async (updated: Mountain[]) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['custom_mountains'], data);
      void debouncedCloudPush(queryClient);
    },
  });

  const addCustomMountain = useCallback((mountain: Mountain) => {
    setCustomMountains((prev) => {
      const updated = [...prev, mountain];
      saveMutation.mutate(updated);
      console.log('[CustomMountains] Added mountain:', mountain.name);
      return updated;
    });
  }, [saveMutation]);

  const removeCustomMountain = useCallback((id: string) => {
    setCustomMountains((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      saveMutation.mutate(updated);
      void enqueueTombstone({
        kind: 'mountain' as const,
        mountainId: id,
        createdAt: '',
        deletedAt: new Date().toISOString(),
      } satisfies Tombstone).then(() => setPendingSyncFlag());
      console.log('[CustomMountains] Removed mountain:', id);
      return updated;
    });
  }, [saveMutation]);

  const updateCustomMountain = useCallback((id: string, updates: Partial<Mountain>) => {
    setCustomMountains((prev) => {
      const updated = prev.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      );
      saveMutation.mutate(updated);
      return updated;
    });
  }, [saveMutation]);

  const isCustom = useCallback((id: string): boolean => {
    return customMountains.some((m) => m.id === id);
  }, [customMountains]);

  return useMemo(() => ({
    customMountains,
    addCustomMountain,
    removeCustomMountain,
    updateCustomMountain,
    isCustom,
    isLoading: query.isLoading,
  }), [customMountains, addCustomMountain, removeCustomMountain, updateCustomMountain, isCustom, query.isLoading]);
});
