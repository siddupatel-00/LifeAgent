import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import type { Habit, TodayItem, Transaction, Workout, BodyStat, SleepLog, CalendarEvent, Note } from '../types';

/** Shared hook options: only fetch when authenticated. */
const authQuery = <T>(queryKey: string[], queryFn: () => Promise<T>, enabled: boolean) => ({
  queryKey,
  queryFn,
  enabled,
  staleTime: 60 * 1000,
  retry: 1,
});

export const useHabits = () => {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const query = useQuery(authQuery(['habits'], () => api.habits.list(), !!token));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['habits'] });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Habit>) => api.habits.create(data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Habit> }) => api.habits.update(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.habits.delete(id),
    onSuccess: invalidate,
  });

  return {
    habits: (query.data || []) as Habit[],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createHabit: createMutation.mutateAsync,
    updateHabit: updateMutation.mutateAsync,
    deleteHabit: deleteMutation.mutateAsync,
  };
};

export const useTodayItems = (date?: string) => {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const query = useQuery(authQuery(['today', date || 'all'], () => api.today.list(date), !!token));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['today'] });
  const invalidateHabits = () => queryClient.invalidateQueries({ queryKey: ['habits'] });

  const createMutation = useMutation({
    mutationFn: (data: Partial<TodayItem>) => api.today.create(data),
    onSuccess: () => { invalidate(); invalidateHabits(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TodayItem> }) => api.today.update(id, data),
    onSuccess: invalidate,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, checked }: { id: number; checked: boolean }) => api.today.update(id, { checked }),
    onMutate: async ({ id, checked }) => {
      // Optimistic toggle for instant UI feedback
      await queryClient.cancelQueries({ queryKey: ['today', date || 'all'] });
      const previous = queryClient.getQueryData<any[]>(['today', date || 'all']);
      queryClient.setQueryData<any[]>(['today', date || 'all'], (old) =>
        old ? old.map(item => item.id === id ? { ...item, checked: checked ? 1 : 0 } : item) : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['today', date || 'all'], context.previous);
    },
    onSettled: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.today.delete(id),
    onSuccess: invalidate,
  });

  return {
    items: (query.data || []) as TodayItem[],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    toggleItem: toggleMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
  };
};

export const useTransactions = () => {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const query = useQuery(authQuery(['transactions'], () => api.transactions.list(), !!token));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['transactions'] });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Transaction>) => api.transactions.create(data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Transaction> }) => api.transactions.update(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.transactions.delete(id),
    onSuccess: invalidate,
  });

  return {
    transactions: (query.data || []) as Transaction[],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createTransaction: createMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,
  };
};

export const useWorkouts = () => {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const query = useQuery(authQuery(['workouts'], () => api.fitness.workouts.list(), !!token));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['workouts'] });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Workout>) => api.fitness.workouts.create(data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Workout> }) => api.fitness.workouts.update(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.fitness.workouts.delete(id),
    onSuccess: invalidate,
  });

  return {
    workouts: (query.data || []) as Workout[],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createWorkout: createMutation.mutateAsync,
    updateWorkout: updateMutation.mutateAsync,
    deleteWorkout: deleteMutation.mutateAsync,
  };
};

export const useBodyStats = () => {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const query = useQuery(authQuery(['bodyStats'], () => api.fitness.bodyStats.list(), !!token));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['bodyStats'] });

  const createMutation = useMutation({
    mutationFn: (data: Partial<BodyStat>) => api.fitness.bodyStats.create(data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BodyStat> }) => api.fitness.bodyStats.update(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.fitness.bodyStats.delete(id),
    onSuccess: invalidate,
  });

  return {
    bodyStats: (query.data || []) as BodyStat[],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createBodyStat: createMutation.mutateAsync,
    updateBodyStat: updateMutation.mutateAsync,
    deleteBodyStat: deleteMutation.mutateAsync,
  };
};

export const useSleepLogs = () => {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const query = useQuery(authQuery(['sleepLogs'], () => api.fitness.sleep.list(), !!token));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['sleepLogs'] });

  const createMutation = useMutation({
    mutationFn: (data: Partial<SleepLog>) => api.fitness.sleep.create(data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SleepLog> }) => api.fitness.sleep.update(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.fitness.sleep.delete(id),
    onSuccess: invalidate,
  });

  return {
    sleepLogs: (query.data || []) as SleepLog[],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createSleepLog: createMutation.mutateAsync,
    updateSleepLog: updateMutation.mutateAsync,
    deleteSleepLog: deleteMutation.mutateAsync,
  };
};

export const useCalendarEvents = () => {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const query = useQuery(authQuery(['calendarEvents'], () => api.calendar.list(), !!token));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });

  const createMutation = useMutation({
    mutationFn: (data: Partial<CalendarEvent>) => api.calendar.create(data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CalendarEvent> }) => api.calendar.update(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.calendar.delete(id),
    onSuccess: invalidate,
  });

  return {
    events: (query.data || []) as CalendarEvent[],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createEvent: createMutation.mutateAsync,
    updateEvent: updateMutation.mutateAsync,
    deleteEvent: deleteMutation.mutateAsync,
  };
};

export const useNotes = () => {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const query = useQuery(authQuery(['notes'], () => api.notes.list(), !!token));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notes'] });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Note>) => api.notes.create(data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Note> }) => api.notes.update(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.notes.delete(id),
    onSuccess: invalidate,
  });

  return {
    notes: (query.data || []) as Note[],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createNote: createMutation.mutateAsync,
    updateNote: updateMutation.mutateAsync,
    deleteNote: deleteMutation.mutateAsync,
  };
};

export const useSettings = () => {
  const token = useAuthStore((s) => s.token);
  const updateUserProfile = useAuthStore((s) => s.updateUserProfile);

  const query = useQuery(authQuery(['settings'], () => api.settings.get(), !!token));

  // Keep the auth store profile in sync with fetched settings
  useEffect(() => {
    if (query.data) {
      updateUserProfile(query.data);
    }
  }, [query.data, updateUserProfile]);

  return {
    settings: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
};

export const useAIChat = () => {
  const user = useAuthStore((s) => s.user);

  const mutation = useMutation({
    mutationFn: ({ message }: { message: string }) =>
      api.ai.chat(message, user?.ai_provider, undefined),
  });

  return {
    sendMessage: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};
