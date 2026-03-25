import { useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { mountains, Mountain } from '@/constants/mountains';
import { debouncedCloudPush } from '@/lib/cloudSync';

export interface SummitRecord {
  mountainId: string;
  date: string;
  report: string;
  photoUri: string | null;
  createdAt: string;
}

const STORAGE_KEY = 'summit_records';

export const [SummitProvider, useSummits] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [records, setRecords] = useState<SummitRecord[]>([]);

  const summitsQuery = useQuery({
    queryKey: ['summits'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as SummitRecord[]) : [];
    },
  });

  useEffect(() => {
    if (summitsQuery.data) {
      setRecords(summitsQuery.data);
    }
  }, [summitsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (updated: SummitRecord[]) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['summits'], data);
      void debouncedCloudPush();
    },
  });

  const addSummit = useCallback((record: SummitRecord) => {
    setRecords((prev) => {
      const updated = [...prev, record];
      saveMutation.mutate(updated);
      return updated;
    });
  }, [saveMutation]);

  const removeSummit = useCallback((mountainId: string) => {
    setRecords((prev) => {
      const updated = prev.filter((r) => r.mountainId !== mountainId);
      saveMutation.mutate(updated);
      return updated;
    });
  }, [saveMutation]);

  const updateSummit = useCallback((mountainId: string, updates: Partial<SummitRecord>) => {
    setRecords((prev) => {
      const updated = prev.map((r) =>
        r.mountainId === mountainId ? { ...r, ...updates } : r
      );
      saveMutation.mutate(updated);
      return updated;
    });
  }, [saveMutation]);

  const getSummit = useCallback((mountainId: string): SummitRecord | undefined => {
    return records.find((r) => r.mountainId === mountainId);
  }, [records]);

  const isSummited = useCallback((mountainId: string): boolean => {
    return records.some((r) => r.mountainId === mountainId);
  }, [records]);

  const summitCount = useMemo(() => records.length, [records]);

  const findMountain = useCallback((id: string): Mountain | undefined => {
    return mountains.find((m) => m.id === id);
  }, []);

  const totalElevation = useMemo(() => {
    return records.reduce((acc, record) => {
      const mountain = findMountain(record.mountainId);
      return acc + (mountain?.elevation ?? 0);
    }, 0);
  }, [records, findMountain]);

  return useMemo(() => ({
    records,
    addSummit,
    removeSummit,
    updateSummit,
    getSummit,
    isSummited,
    summitCount,
    totalElevation,
    isLoading: summitsQuery.isLoading,
  }), [records, addSummit, removeSummit, updateSummit, getSummit, isSummited, summitCount, totalElevation, summitsQuery.isLoading]);
});
