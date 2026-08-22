import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useDataStore } from '../stores/dataStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

export const useAuth = () => {
  const { token, user, isAuthenticated, isLoading, setToken, setUser, logout, updateUserProfile } = useAuthStore();
  return { token, user, isAuthenticated, isLoading, setToken, setUser, logout, updateUserProfile };
};

export const useHabits = () => {
  const { token } = useAuthStore();
  const { setHabits, addHabit, updateHabit, removeHabit } = useDataStore();
  
  const query = useQuery({
    queryKey: ['habits'],
    queryFn: () => api.habits.list(),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Habit>) => api.habits.create(data),
    onSuccess: (newHabit) => addHabit(newHabit),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Habit> }) => api.habits.update(id, data),
    onSuccess: (updatedHabit) => updateHabit(updatedHabit.id, updatedHabit),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.habits.delete(id),
    onSuccess: (_, id) => removeHabit(id),
  });

  return {
    habits: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createHabit: createMutation.mutateAsync,
    updateHabit: updateMutation.mutateAsync,
    deleteHabit: deleteMutation.mutateAsync,
  };
};

export const useTodayItems = (date?: string) => {
  const { token } = useAuthStore();
  const { setTodayItems, addTodayItem, updateTodayItem, removeTodayItem } = useDataStore();
  
  const query = useQuery({
    queryKey: ['today', date],
    queryFn: () => api.today.list(date),
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<TodayItem>) => api.today.create(data),
    onSuccess: (newItem) => addTodayItem(newItem),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TodayItem> }) => api.today.update(id, data),
    onSuccess: (updatedItem) => updateTodayItem(updatedItem.id, updatedItem),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.today.delete(id),
    onSuccess: (_, id) => removeTodayItem(id),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.today.complete(id),
    onSuccess: (updatedItem) => updateTodayItem(updatedItem.id, updatedItem),
  });

  const uncompleteMutation = useMutation({
    mutationFn: (id: string) => api.today.uncomplete(id),
    onSuccess: (updatedItem) => updateTodayItem(updatedItem.id, updatedItem),
  });

  return {
    items: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    completeItem: completeMutation.mutateAsync,
    uncompleteItem: uncompleteMutation.mutateAsync,
  };
};

export const useTransactions = () => {
  const { token } = useAuthStore();
  const { setTransactions, addTransaction, updateTransaction, removeTransaction } = useDataStore();
  const { timeRange } = useUIStore();
  
  const query = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.transactions.list(),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Transaction>) => api.transactions.create(data),
    onSuccess: (newTransaction) => addTransaction(newTransaction),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Transaction> }) => api.transactions.update(id, data),
    onSuccess: (updated) => updateTransaction(updated.id, updated),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.transactions.delete(id),
    onSuccess: (_, id) => removeTransaction(id),
  });

  return {
    transactions: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createTransaction: createMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,
  };
};

export const useWorkouts = () => {
  const { token } = useAuthStore();
  const { setWorkouts, addWorkout, updateWorkout, removeWorkout } = useDataStore();
  
  const query = useQuery({
    queryKey: ['workouts'],
    queryFn: () => api.fitness.workouts.list(),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Workout>) => api.fitness.workouts.create(data),
    onSuccess: (newWorkout) => addWorkout(newWorkout),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Workout> }) => api.fitness.workouts.update(id, data),
    onSuccess: (updated) => updateWorkout(updated.id, updated),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.fitness.workouts.delete(id),
    onSuccess: (_, id) => removeWorkout(id),
  });

  return {
    workouts: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createWorkout: createMutation.mutateAsync,
    updateWorkout: updateMutation.mutateAsync,
    deleteWorkout: deleteMutation.mutateAsync,
  };
};

export const useBodyStats = () => {
  const { token } = useAuthStore();
  const { setBodyStats, addBodyStat, updateBodyStat, removeBodyStat } = useDataStore();
  
  const query = useQuery({
    queryKey: ['bodyStats'],
    queryFn: () => api.fitness.bodyStats.list(),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<BodyStat>) => api.fitness.bodyStats.create(data),
    onSuccess: (newStat) => addBodyStat(newStat),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BodyStat> }) => api.fitness.bodyStats.update(id, data),
    onSuccess: (updated) => updateBodyStat(updated.id, updated),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.fitness.bodyStats.delete(id),
    onSuccess: (_, id) => removeBodyStat(id),
  });

  return {
    bodyStats: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createBodyStat: createMutation.mutateAsync,
    updateBodyStat: updateMutation.mutateAsync,
    deleteBodyStat: deleteMutation.mutateAsync,
  };
};

export const useSleepLogs = () => {
  const { token } = useAuthStore();
  const { setSleepLogs, addSleepLog, updateSleepLog, removeSleepLog } = useDataStore();
  
  const query = useQuery({
    queryKey: ['sleepLogs'],
    queryFn: () => api.fitness.sleep.list(),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<SleepLog>) => api.fitness.sleep.create(data),
    onSuccess: (newLog) => addSleepLog(newLog),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SleepLog> }) => api.fitness.sleep.update(id, data),
    onSuccess: (updated) => updateSleepLog(updated.id, updated),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.fitness.sleep.delete(id),
    onSuccess: (_, id) => removeSleepLog(id),
  });

  return {
    sleepLogs: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createSleepLog: createMutation.mutateAsync,
    updateSleepLog: updateMutation.mutateAsync,
    deleteSleepLog: deleteMutation.mutateAsync,
  };
};

export const useCalendarEvents = () => {
  const { token } = useAuthStore();
  const { setCalendarEvents, addCalendarEvent, updateCalendarEvent, removeCalendarEvent } = useDataStore();
  
  const query = useQuery({
    queryKey: ['calendarEvents'],
    queryFn: () => api.calendar.list(),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<CalendarEvent>) => api.calendar.create(data),
    onSuccess: (newEvent) => addCalendarEvent(newEvent),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CalendarEvent> }) => api.calendar.update(id, data),
    onSuccess: (updated) => updateCalendarEvent(updated.id, updated),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.calendar.delete(id),
    onSuccess: (_, id) => removeCalendarEvent(id),
  });

  return {
    events: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createEvent: createMutation.mutateAsync,
    updateEvent: updateMutation.mutateAsync,
    deleteEvent: deleteMutation.mutateAsync,
  };
};

export const useNotes = () => {
  const { token } = useAuthStore();
  const { setNotes, addNote, updateNote, removeNote } = useDataStore();
  
  const query = useQuery({
    queryKey: ['notes'],
    queryFn: () => api.notes.list(),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Note>) => api.notes.create(data),
    onSuccess: (newNote) => addNote(newNote),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Note> }) => api.notes.update(id, data),
    onSuccess: (updated) => updateNote(updated.id, updated),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.notes.delete(id),
    onSuccess: (_, id) => removeNote(id),
  });

  const togglePinMutation = useMutation({
    mutationFn: (id: string) => api.notes.togglePin(id),
    onSuccess: (updated) => updateNote(updated.id, updated),
  });

  const toggleArchiveMutation = useMutation({
    mutationFn: (id: string) => api.notes.toggleArchive(id),
    onSuccess: (updated) => updateNote(updated.id, updated),
  });

  return {
    notes: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createNote: createMutation.mutateAsync,
    updateNote: updateMutation.mutateAsync,
    deleteNote: deleteMutation.mutateAsync,
    togglePin: togglePinMutation.mutateAsync,
    toggleArchive: toggleArchiveMutation.mutateAsync,
  };
};

export const useSettings = () => {
  const { token } = useAuthStore();
  const { updateUserProfile } = useAuthStore();
  
  const query = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.settings.get(),
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<any>) => api.settings.update(data),
    onSuccess: (updatedSettings) => updateUserProfile(updatedSettings),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => api.settings.deleteAccount(),
  });

  const resetDataMutation = useMutation({
    mutationFn: () => api.settings.resetData(),
    onSuccess: () => {
      useDataStore.getState().clearAll();
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateSettings: updateMutation.mutateAsync,
    deleteAccount: deleteAccountMutation.mutateAsync,
    resetData: resetDataMutation.mutateAsync,
  };
};

export const useAIChat = () => {
  const { user } = useAuthStore();
  
  const mutation = useMutation({
    mutationFn: ({ messages }: { messages: any[] }) => 
      api.ai.chat(messages, user?.ai_provider || 'gemini', user?.gemini_api_key || user?.groq_api_key || ''),
  });

  return {
    sendMessage: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};