import { useEffect, useMemo } from 'react';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { mountains } from '@/constants/mountains';

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
    },
  });

  const addSummit = (record: SummitRecord) => {
    const updated = [...records, record];
    setRecords(updated);
    saveMutation.mutate(updated);
  };

  const removeSummit = (mountainId: string) => {
    const updated = records.filter((r) => r.mountainId !== mountainId);
    setRecords(updated);
    saveMutation.mutate(updated);
  };

  const updateSummit = (mountainId: string, updates: Partial<SummitRecord>) => {
    const updated = records.map((r) =>
      r.mountainId === mountainId ? { ...r, ...updates } : r
    );
    setRecords(updated);
    saveMutation.mutate(updated);
  };

  const getSummit = (mountainId: string): SummitRecord | undefined => {
    return records.find((r) => r.mountainId === mountainId);
  };

  const isSummited = (mountainId: string): boolean => {
    return records.some((r) => r.mountainId === mountainId);
  };

  const summitCount = useMemo(() => records.length, [records]);

  const totalElevation = useMemo(() => {
    return records.reduce((acc, record) => {
      const mountain = mountains.find((m) => m.id === record.mountainId);
      return acc + (mountain?.elevation ?? 0);
    }, 0);
  }, [records]);

  return {
    records,
    addSummit,
    removeSummit,
    updateSummit,
    getSummit,
    isSummited,
    summitCount,
    totalElevation,
    isLoading: summitsQuery.isLoading,
  };
});
