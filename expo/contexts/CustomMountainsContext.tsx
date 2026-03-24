import { useEffect, useMemo } from 'react';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { Mountain } from '@/constants/mountains';

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
    },
  });

  const addCustomMountain = (mountain: Mountain) => {
    const updated = [...customMountains, mountain];
    setCustomMountains(updated);
    saveMutation.mutate(updated);
    console.log('[CustomMountains] Added mountain:', mountain.name);
  };

  const removeCustomMountain = (id: string) => {
    const updated = customMountains.filter((m) => m.id !== id);
    setCustomMountains(updated);
    saveMutation.mutate(updated);
    console.log('[CustomMountains] Removed mountain:', id);
  };

  const updateCustomMountain = (id: string, updates: Partial<Mountain>) => {
    const updated = customMountains.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    );
    setCustomMountains(updated);
    saveMutation.mutate(updated);
  };

  const isCustom = (id: string): boolean => {
    return customMountains.some((m) => m.id === id);
  };

  return {
    customMountains,
    addCustomMountain,
    removeCustomMountain,
    updateCustomMountain,
    isCustom,
    isLoading: query.isLoading,
  };
});
