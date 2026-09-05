// Contexto Principal do Aplicativo LEVE
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  AppData, Task, Habit, HydrationLog, MealLog, GroceryItem, MovementActivity, 
  SleepLog, EmotionalCheckIn, JournalEntry, Memory, Prayer, Devotional,
  FiveMinuteGodSession, Goal, Bill, Income, MenstrualPeriod, CycleDailyLog, UserProfile,
  Achievement
} from '../types';
import { 
  loadAppData, saveAppData, getTodayDateString, resetAllData 
} from '../services/storage';
import { ACHIEVEMENTS_LIST } from '../services/quotesAndVerses';
import { useAuth } from './AuthContext';

export type ActiveTab = 
  | 'my-day' 
  | 'calendar' 
  | 'habits' 
  | 'journal' 
  | 'spirituality' 
  | 'goals' 
  | 'progress'
  | 'hydration'
  | 'nutrition'
  | 'movement'
  | 'sleep'
  | 'self-care'
  | 'bills'
  | 'cycle'
  | 'lia'
  | 'settings';

interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'gentle';
}

interface AppContextType {
  data: AppData;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  
  // Modals
  isBrainDumpOpen: boolean;
  setIsBrainDumpOpen: (open: boolean) => void;
  isTaskModalOpen: boolean;
  setIsTaskModalOpen: (open: boolean) => void;
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isDayClosingOpen: boolean;
  setIsDayClosingOpen: (open: boolean) => void;
  isFiveMinGodOpen: boolean;
  setIsFiveMinGodOpen: (open: boolean) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  isAchievementsOpen: boolean;
  setIsAchievementsOpen: (open: boolean) => void;
  celebrationAchievement: Achievement | null;
  closeCelebration: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;

  // Actions
  showToast: (message: string, type?: 'success' | 'info' | 'gentle') => void;
  updateUser: (profile: Partial<UserProfile>) => void;
  
  // Tasks
  addTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  updateTask: (task: Task) => void;
  toggleTask: (id: string) => void;
  toggleTaskCompleted: (id: string) => void;
  deleteTask: (id: string) => void;
  duplicateTask: (id: string) => void;
  openNewTaskModal: () => void;
  openEditTaskModal: (task: Task) => void;
  
  // Habits
  addHabit: (habit: Omit<Habit, 'id' | 'history' | 'createdAt'>) => void;
  updateHabit: (habit: Habit) => void;
  toggleHabit: (id: string, date?: string) => void;
  toggleHabitCompletion: (id: string, date?: string) => void;
  deleteHabit: (id: string) => void;
  
  // Hydration
  addWater: (amountMl: number, date?: string) => void;
  resetWater: (date?: string) => void;
  setWaterTarget: (targetMl: number, cupSizeMl?: number) => void;
  updateHydrationTarget: (targetMl: number, cupSizeMl?: number) => void;
  
  // Meals & Groceries
  updateMeal: (date: string, meals: Partial<MealLog>) => void;
  addGroceryItem: (item: Omit<GroceryItem, 'id' | 'completed'>) => void;
  toggleGroceryItem: (id: string) => void;
  deleteGroceryItem: (id: string) => void;
  
  // Movement
  addMovement: (movement: Omit<MovementActivity, 'id'>) => void;
  deleteMovement: (id: string) => void;
  
  // Sleep
  updateSleep: (date: string, sleep: Omit<SleepLog, 'date'>) => void;
  
  // Self-care
  toggleSelfCareAction: (actionId: string, date?: string) => void;
  toggleSelfCareItem: (actionId: string, date?: string) => void;
  addCustomSelfCareAction: (title: string) => void;
  
  // Emotional Check-in
  saveCheckIn: (checkIn: EmotionalCheckIn) => void;
  
  // Journal & Gratitude
  saveJournalEntry: (entry: JournalEntry) => void;
  addMemory: (memory: Omit<Memory, 'id'>) => void;
  deleteMemory: (id: string) => void;
  
  // Spirituality
  addPrayer: (prayer: Omit<Prayer, 'id'>) => void;
  updatePrayer: (prayer: Prayer) => void;
  togglePrayerAnswered: (id: string) => void;
  deletePrayer: (id: string) => void;
  addDevotional: (devotional: Omit<Devotional, 'id'>) => void;
  toggleFavoriteVerse: (verseId: string) => void;
  saveFiveMinuteSession: (session: Omit<FiveMinuteGodSession, 'id'>) => void;
  
  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'completed'>) => void;
  updateGoal: (goal: Goal) => void;
  toggleGoalStep: (goalId: string, stepId: string) => void;
  deleteGoal: (id: string) => void;
  
  // Bills
  addBill: (bill: Omit<Bill, 'id'>) => void;
  updateBillStatus: (id: string, status: 'vencida' | 'pendente' | 'paga') => void;
  toggleBillPaid: (id: string) => void;
  deleteBill: (id: string) => void;

  // Incomes / Recebimentos
  addIncome: (income: Omit<Income, 'id'>) => void;
  updateIncome: (income: Income) => void;
  toggleIncomeReceived: (id: string) => void;
  deleteIncome: (id: string) => void;

  // Menstrual Cycle & Feminine Care
  addPeriod: (period: Omit<MenstrualPeriod, 'id'>) => void;
  updatePeriod: (period: MenstrualPeriod) => void;
  deletePeriod: (id: string) => void;
  updateCycleDailyLog: (date: string, log: Partial<CycleDailyLog>) => void;
  updateCycleSettings: (settings: { averageCycleLength?: number; averagePeriodLength?: number }) => void;
  
  // Data management
  resetData: () => void;
  refreshData: () => void;

  // Stats
  todayCompletionPercentage: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(loadAppData);
  const [activeTab, setActiveTab] = useState<ActiveTab>('my-day');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  
  const [isBrainDumpOpen, setIsBrainDumpOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDayClosingOpen, setIsDayClosingOpen] = useState(false);
  const [isFiveMinGodOpen, setIsFiveMinGodOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [celebrationAchievement, setCelebrationAchievement] = useState<Achievement | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const closeCelebration = useCallback(() => {
    setCelebrationAchievement(null);
  }, []);

  // Check onboarding on mount
  useEffect(() => {
    if (!data.user.hasCompletedOnboarding) {
      setIsOnboardingOpen(true);
    }
  }, [data.user.hasCompletedOnboarding]);

  // Supabase Cloud Sync Integration
  const { user, syncDataNow, pullCloudData, userProfile } = useAuth();

  // If user profile with name is fetched from Supabase, update user profile
  useEffect(() => {
    if (userProfile?.name || userProfile?.full_name) {
      const profileName = (userProfile.name || userProfile.full_name).trim();
      if (profileName) {
        setData((prev) => {
          if (prev.user.name === profileName) return prev;
          const updated = {
            ...prev,
            user: {
              ...prev.user,
              name: profileName
            }
          };
          saveAppData(updated);
          return updated;
        });
      }
    }
  }, [userProfile]);

  // On user login: pull from Supabase if available, or sync initial data
  useEffect(() => {
    if (!user) return;
    let isCancelled = false;

    async function syncOnLogin() {
      try {
        const cloudData = await pullCloudData();
        if (cloudData && !isCancelled) {
          setData((prev) => {
            const merged: AppData = {
              ...prev,
              ...cloudData,
              user: { ...prev.user, ...(cloudData.user || {}) }
            };
            saveAppData(merged);
            return merged;
          });
        } else if (!cloudData && !isCancelled) {
          // Push initial data to cloud
          syncDataNow(data);
        }
      } catch (e) {
        console.warn('Sync on login error:', e);
      }
    }

    syncOnLogin();
    return () => { isCancelled = true; };
  }, [user]);

  // Debounced auto-sync to Supabase when data changes and user is authenticated
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      syncDataNow(data);
    }, 2500);
    return () => clearTimeout(timer);
  }, [data, user, syncDataNow]);

  // Persist state
  const updateData = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      saveAppData(next);
      return next;
    });
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'gentle' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  // Achievement unlock helper with congratulations celebration modal
  const triggerAchievement = useCallback((achievementId: string) => {
    setData((prev) => {
      if (prev.unlockedAchievements && prev.unlockedAchievements[achievementId]) return prev;
      const ach = ACHIEVEMENTS_LIST.find((a) => a.id === achievementId);
      if (ach) {
        setCelebrationAchievement(ach);
      }
      const updated = {
        ...prev,
        unlockedAchievements: {
          ...(prev.unlockedAchievements || {}),
          [achievementId]: new Date().toISOString()
        }
      };
      saveAppData(updated);
      return updated;
    });
  }, []);

  const updateUser = useCallback((profile: Partial<UserProfile>) => {
    updateData((prev) => ({
      ...prev,
      user: { ...prev.user, ...profile }
    }));
    showToast('Preferências atualizadas.');
  }, [updateData, showToast]);

  // TASKS
  const addTask = useCallback((taskInput: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = {
      ...taskInput,
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      completed: false
    };
    updateData((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks]
    }));
    showToast('Tarefa guardada na sua lista.');
  }, [updateData, showToast]);

  const updateTask = useCallback((task: Task) => {
    updateData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === task.id ? task : t))
    }));
    showToast('Tarefa atualizada.');
  }, [updateData, showToast]);

  const toggleTask = useCallback((id: string) => {
    let justCompleted = false;
    let totalCompleted = 0;
    updateData((prev) => {
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          if (nextCompleted) justCompleted = true;
          return {
            ...t,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined
          };
        }
        return t;
      });
      totalCompleted = updatedTasks.filter((t) => t.completed).length;
      return { ...prev, tasks: updatedTasks };
    });
    if (justCompleted) {
      triggerAchievement('first_task');
      if (totalCompleted >= 50) {
        triggerAchievement('fifty_tasks');
      }
    }
  }, [updateData, triggerAchievement]);

  const toggleTaskCompleted = useCallback((id: string) => {
    toggleTask(id);
  }, [toggleTask]);

  const openNewTaskModal = useCallback(() => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  }, []);

  const openEditTaskModal = useCallback((task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  }, []);

  const deleteTask = useCallback((id: string) => {
    updateData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id)
    }));
    showToast('Tarefa removida.');
  }, [updateData, showToast]);

  const duplicateTask = useCallback((id: string) => {
    updateData((prev) => {
      const existing = prev.tasks.find((t) => t.id === id);
      if (!existing) return prev;
      const dup: Task = {
        ...existing,
        id: 'task-' + Date.now(),
        title: `${existing.title} (cópia)`,
        completed: false
      };
      return { ...prev, tasks: [dup, ...prev.tasks] };
    });
    showToast('Tarefa duplicada.');
  }, [updateData, showToast]);

  // HABITS
  const addHabit = useCallback((habitInput: Omit<Habit, 'id' | 'history' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...habitInput,
      id: 'habit-' + Date.now(),
      createdAt: getTodayDateString(),
      history: {}
    };
    updateData((prev) => ({
      ...prev,
      habits: [...prev.habits, newHabit]
    }));
    showToast('Novo hábito cultivado.');
  }, [updateData, showToast]);

  const updateHabit = useCallback((habit: Habit) => {
    updateData((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => (h.id === habit.id ? habit : h))
    }));
    showToast('Hábito atualizado.');
  }, [updateData, showToast]);

  const toggleHabit = useCallback((id: string, date = getTodayDateString()) => {
    let completedToday = false;
    let habitStreak = 0;
    updateData((prev) => {
      const updated = prev.habits.map((h) => {
        if (h.id === id) {
          const cur = !!h.history[date];
          const nextVal = !cur;
          if (nextVal) completedToday = true;
          const nextHistory = { ...h.history, [date]: nextVal };

          // Calculate streak
          let streak = 0;
          const d = new Date();
          for (let i = 0; i < 30; i++) {
            const checkD = new Date(d);
            checkD.setDate(checkD.getDate() - i);
            const iso = `${checkD.getFullYear()}-${String(checkD.getMonth() + 1).padStart(2, '0')}-${String(checkD.getDate()).padStart(2, '0')}`;
            if (nextHistory[iso]) streak++;
            else break;
          }
          habitStreak = streak;

          return {
            ...h,
            history: nextHistory
          };
        }
        return h;
      });
      return { ...prev, habits: updated };
    });
    if (completedToday) {
      triggerAchievement('first_habit');
      if (habitStreak >= 14) {
        triggerAchievement('streak_14');
      } else if (habitStreak >= 7) {
        triggerAchievement('streak_7');
      } else if (habitStreak >= 3) {
        triggerAchievement('streak_3');
      }
    }
  }, [updateData, triggerAchievement]);

  const toggleHabitCompletion = useCallback((id: string, date?: string) => {
    toggleHabit(id, date);
  }, [toggleHabit]);

  const deleteHabit = useCallback((id: string) => {
    updateData((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== id)
    }));
    showToast('Hábito removido.');
  }, [updateData, showToast]);

  // HYDRATION
  const addWater = useCallback((amountMl: number, date = getTodayDateString()) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let reachedTarget = false;
    updateData((prev) => {
      const current = prev.hydration[date] || {
        date,
        amountMl: 0,
        targetMl: 2000,
        cupSizeMl: 300,
        logs: []
      };
      const newAmount = Math.max(0, current.amountMl + amountMl);
      if (newAmount >= current.targetMl && current.amountMl < current.targetMl) {
        reachedTarget = true;
      }
      return {
        ...prev,
        hydration: {
          ...prev.hydration,
          [date]: {
            ...current,
            amountMl: newAmount,
            logs: amountMl > 0 ? [...current.logs, { time: timeNow, amount: amountMl }] : current.logs
          }
        }
      };
    });
    if (reachedTarget) {
      triggerAchievement('first_water');
    }
    showToast(`+${amountMl} ml adicionados com carinho! 💧`);
  }, [updateData, triggerAchievement, showToast]);

  const updateHydrationTarget = useCallback((targetMl: number, cupSizeMl?: number) => {
    const today = getTodayDateString();
    updateData((prev) => {
      const cur = prev.hydration[today] || {
        date: today,
        amountMl: 0,
        targetMl: 2000,
        cupSizeMl: 300,
        logs: []
      };
      return {
        ...prev,
        hydration: {
          ...prev.hydration,
          [today]: {
            ...cur,
            targetMl,
            cupSizeMl: cupSizeMl || cur.cupSizeMl
          }
        }
      };
    });
    showToast('Meta de hidratação atualizada.');
  }, [updateData, showToast]);

  const resetWater = useCallback((date = getTodayDateString()) => {
    updateData((prev) => {
      const cur = prev.hydration[date] || {
        date,
        amountMl: 0,
        targetMl: 2000,
        cupSizeMl: 300,
        logs: []
      };
      return {
        ...prev,
        hydration: {
          ...prev.hydration,
          [date]: {
            ...cur,
            amountMl: 0,
            logs: []
          }
        }
      };
    });
    showToast('Registro de água zerado.');
  }, [updateData, showToast]);

  const setWaterTarget = useCallback((targetMl: number, cupSizeMl?: number) => {
    updateHydrationTarget(targetMl, cupSizeMl);
  }, [updateHydrationTarget]);

  // MEALS & GROCERIES
  const updateMeal = useCallback((date: string, partial: Partial<MealLog>) => {
    updateData((prev) => {
      const existing = prev.meals[date] || {
        date,
        breakfast: { checked: false, description: '' },
        lunch: { checked: false, description: '' },
        snack: { checked: false, description: '' },
        dinner: { checked: false, description: '' }
      };
      return {
        ...prev,
        meals: {
          ...prev.meals,
          [date]: { ...existing, ...partial }
        }
      };
    });
    showToast('Registro de alimentação salvo.');
  }, [updateData, showToast]);

  const addGroceryItem = useCallback((item: Omit<GroceryItem, 'id' | 'completed'>) => {
    const newItem: GroceryItem = {
      ...item,
      id: 'groc-' + Date.now(),
      completed: false
    };
    updateData((prev) => ({
      ...prev,
      groceries: [...prev.groceries, newItem]
    }));
    showToast('Item adicionado às compras.');
  }, [updateData, showToast]);

  const toggleGroceryItem = useCallback((id: string) => {
    updateData((prev) => ({
      ...prev,
      groceries: prev.groceries.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g))
    }));
  }, [updateData]);

  const deleteGroceryItem = useCallback((id: string) => {
    updateData((prev) => ({
      ...prev,
      groceries: prev.groceries.filter((g) => g.id !== id)
    }));
  }, [updateData]);

  // MOVEMENT
  const addMovement = useCallback((movement: Omit<MovementActivity, 'id'>) => {
    const newM: MovementActivity = {
      ...movement,
      id: 'mov-' + Date.now()
    };
    updateData((prev) => ({
      ...prev,
      movement: [newM, ...prev.movement]
    }));
    showToast('Movimento registrado com sucesso! 🏃');
  }, [updateData, showToast]);

  const deleteMovement = useCallback((id: string) => {
    updateData((prev) => ({
      ...prev,
      movement: prev.movement.filter((m) => m.id !== id)
    }));
  }, [updateData]);

  // SLEEP
  const updateSleep = useCallback((date: string, sleep: Omit<SleepLog, 'date'>) => {
    updateData((prev) => ({
      ...prev,
      sleep: {
        ...prev.sleep,
        [date]: { ...sleep, date }
      }
    }));
    showToast('Registro de sono salvo. Bons sonhos! 😴');
  }, [updateData, showToast]);

  // SELF-CARE
  const toggleSelfCareAction = useCallback((actionId: string, date = getTodayDateString()) => {
    updateData((prev) => {
      const completed = prev.selfCareCompleted[date] || [];
      const exists = completed.includes(actionId);
      const nextCompleted = exists 
        ? completed.filter((id) => id !== actionId)
        : [...completed, actionId];
      return {
        ...prev,
        selfCareCompleted: {
          ...prev.selfCareCompleted,
          [date]: nextCompleted
        }
      };
    });
  }, [updateData]);

  const toggleSelfCareItem = useCallback((actionId: string, date = getTodayDateString()) => {
    toggleSelfCareAction(actionId, date);
  }, [toggleSelfCareAction]);

  const addCustomSelfCareAction = useCallback((title: string) => {
    const newAction = {
      id: 'sc-custom-' + Date.now(),
      title,
      isCustom: true
    };
    updateData((prev) => ({
      ...prev,
      selfCareList: [...prev.selfCareList, newAction]
    }));
    showToast('Ação de autocuidado adicionada.');
  }, [updateData, showToast]);

  // EMOTIONAL CHECK-IN
  const saveCheckIn = useCallback((checkIn: EmotionalCheckIn) => {
    updateData((prev) => ({
      ...prev,
      checkIns: {
        ...prev.checkIns,
        [checkIn.date]: checkIn
      }
    }));
    showToast('Sentimentos acolhidos e registrados. 💛');
  }, [updateData, showToast]);

  // JOURNAL & GRATITUDE
  const saveJournalEntry = useCallback((entry: JournalEntry) => {
    updateData((prev) => ({
      ...prev,
      journal: {
        ...prev.journal,
        [entry.date]: entry
      }
    }));
    triggerAchievement('first_journal');
    triggerAchievement('first_gratitude');
    showToast('Seu caderno foi atualizado com carinho. 💭');
  }, [updateData, triggerAchievement, showToast]);

  const addMemory = useCallback((memory: Omit<Memory, 'id'>) => {
    const newMem: Memory = {
      ...memory,
      id: 'mem-' + Date.now()
    };
    updateData((prev) => ({
      ...prev,
      memories: [newMem, ...prev.memories]
    }));
    showToast('Memória guardada para sempre! 📸');
  }, [updateData, showToast]);

  const deleteMemory = useCallback((id: string) => {
    updateData((prev) => ({
      ...prev,
      memories: prev.memories.filter((m) => m.id !== id)
    }));
    showToast('Memória removida.');
  }, [updateData, showToast]);

  // SPIRITUALITY
  const addPrayer = useCallback((prayer: Omit<Prayer, 'id'>) => {
    const newPrayer: Prayer = {
      ...prayer,
      id: 'pray-' + Date.now()
    };
    updateData((prev) => ({
      ...prev,
      prayers: [newPrayer, ...prev.prayers]
    }));
    triggerAchievement('first_prayer');
    showToast('Oração guardada com reverência. 🙏');
  }, [updateData, triggerAchievement, showToast]);

  const togglePrayerAnswered = useCallback((id: string) => {
    updateData((prev) => ({
      ...prev,
      prayers: prev.prayers.map((p) => (p.id === id ? { ...p, answered: !p.answered } : p))
    }));
    showToast('Status da oração atualizado.');
  }, [updateData, showToast]);

  const updatePrayer = useCallback((prayer: Prayer) => {
    updateData((prev) => ({
      ...prev,
      prayers: prev.prayers.map((p) => (p.id === prayer.id ? prayer : p))
    }));
    showToast('Oração atualizada.');
  }, [updateData, showToast]);

  const deletePrayer = useCallback((id: string) => {
    updateData((prev) => ({
      ...prev,
      prayers: prev.prayers.filter((p) => p.id !== id)
    }));
    showToast('Oração removida.');
  }, [updateData, showToast]);

  const addDevotional = useCallback((devotional: Omit<Devotional, 'id'>) => {
    const newDev: Devotional = {
      ...devotional,
      id: 'dev-' + Date.now()
    };
    updateData((prev) => ({
      ...prev,
      devotionals: [newDev, ...(prev.devotionals || [])]
    }));
  }, [updateData]);

  const toggleFavoriteVerse = useCallback((verseId: string) => {
    updateData((prev) => {
      const favs = prev.favoriteVerses || [];
      const nextFavs = favs.includes(verseId)
        ? favs.filter((v) => v !== verseId)
        : [...favs, verseId];
      return { ...prev, favoriteVerses: nextFavs };
    });
  }, [updateData]);

  const saveFiveMinuteSession = useCallback((session: Omit<FiveMinuteGodSession, 'id'>) => {
    const newSession: FiveMinuteGodSession = {
      ...session,
      id: 'god-session-' + Date.now()
    };
    updateData((prev) => ({
      ...prev,
      fiveMinuteSessions: [newSession, ...prev.fiveMinuteSessions]
    }));
    triggerAchievement('first_prayer');
    showToast('Momento com Deus concluído em paz. 🤍');
  }, [updateData, triggerAchievement, showToast]);

  // GOALS
  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'completed'>) => {
    const newGoal: Goal = {
      ...goal,
      id: 'goal-' + Date.now(),
      completed: false
    };
    updateData((prev) => ({
      ...prev,
      goals: [...prev.goals, newGoal]
    }));
    triggerAchievement('first_goal');
    showToast('Nova meta estabelecida com foco.');
  }, [updateData, triggerAchievement, showToast]);

  const updateGoal = useCallback((goal: Goal) => {
    updateData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === goal.id ? goal : g))
    }));
    showToast('Meta atualizada.');
  }, [updateData, showToast]);

  const toggleGoalStep = useCallback((goalId: string, stepId: string) => {
    updateData((prev) => {
      const updated = prev.goals.map((g) => {
        if (g.id === goalId) {
          const nextSteps = g.steps.map((s) => (s.id === stepId ? { ...s, completed: !s.completed } : s));
          const allCompleted = nextSteps.length > 0 && nextSteps.every((s) => s.completed);
          if (allCompleted && !g.completed) {
            triggerAchievement('goal_completed');
          }
          return {
            ...g,
            steps: nextSteps,
            completed: allCompleted
          };
        }
        return g;
      });
      return { ...prev, goals: updated };
    });
  }, [updateData, triggerAchievement]);

  const deleteGoal = useCallback((id: string) => {
    updateData((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id)
    }));
    showToast('Meta removida.');
  }, [updateData, showToast]);

  // BILLS
  const addBill = useCallback((bill: Omit<Bill, 'id'>) => {
    const newBill: Bill = {
      ...bill,
      id: 'bill-' + Date.now()
    };
    updateData((prev) => ({
      ...prev,
      bills: [...prev.bills, newBill]
    }));
    showToast('Conta adicionada ao controle financeiro.');
  }, [updateData, showToast]);

  const updateBillStatus = useCallback((id: string, status: 'vencida' | 'pendente' | 'paga') => {
    updateData((prev) => ({
      ...prev,
      bills: (prev.bills || []).map((b) => (b.id === id ? { ...b, status, paid: status === 'paga' } : b))
    }));
    showToast('Status da conta atualizado.');
  }, [updateData, showToast]);

  const toggleBillPaid = useCallback((id: string) => {
    updateData((prev) => ({
      ...prev,
      bills: (prev.bills || []).map((b) => {
        if (b.id === id) {
          const nextPaid = !b.paid;
          return {
            ...b,
            paid: nextPaid,
            status: nextPaid ? 'paga' : 'pendente'
          };
        }
        return b;
      })
    }));
    showToast('Status da conta atualizado.');
  }, [updateData, showToast]);

  const deleteBill = useCallback((id: string) => {
    updateData((prev) => ({
      ...prev,
      bills: (prev.bills || []).filter((b) => b.id !== id)
    }));
    showToast('Conta removida.');
  }, [updateData, showToast]);

  // INCOMES / RECEBIMENTOS
  const addIncome = useCallback((income: Omit<Income, 'id'>) => {
    const newIncome: Income = {
      ...income,
      id: 'inc-' + Date.now()
    };
    updateData((prev) => ({
      ...prev,
      incomes: [newIncome, ...(prev.incomes || [])]
    }));
    showToast('Receita / Ganho registrado com sucesso! 💰');
  }, [updateData, showToast]);

  const updateIncome = useCallback((income: Income) => {
    updateData((prev) => ({
      ...prev,
      incomes: (prev.incomes || []).map((i) => (i.id === income.id ? income : i))
    }));
    showToast('Recebimento atualizado.');
  }, [updateData, showToast]);

  const toggleIncomeReceived = useCallback((id: string) => {
    updateData((prev) => ({
      ...prev,
      incomes: (prev.incomes || []).map((i) => (i.id === id ? { ...i, received: !i.received } : i))
    }));
    showToast('Status do recebimento atualizado.');
  }, [updateData, showToast]);

  const deleteIncome = useCallback((id: string) => {
    updateData((prev) => ({
      ...prev,
      incomes: (prev.incomes || []).filter((i) => i.id !== id)
    }));
    showToast('Recebimento removido.');
  }, [updateData, showToast]);

  // MENSTRUAL CYCLE & FEMININE CARE
  const addPeriod = useCallback((period: Omit<MenstrualPeriod, 'id'>) => {
    const newPeriod: MenstrualPeriod = {
      ...period,
      id: 'period-' + Date.now()
    };
    updateData((prev) => {
      const currentCycle = prev.cycle || { averageCycleLength: 28, averagePeriodLength: 5, periods: [], dailyLogs: {} };
      return {
        ...prev,
        cycle: {
          ...currentCycle,
          periods: [newPeriod, ...(currentCycle.periods || [])]
        }
      };
    });
    showToast('Menstruação registrada com carinho. 🌸');
  }, [updateData, showToast]);

  const updatePeriod = useCallback((period: MenstrualPeriod) => {
    updateData((prev) => {
      const currentCycle = prev.cycle || { averageCycleLength: 28, averagePeriodLength: 5, periods: [], dailyLogs: {} };
      return {
        ...prev,
        cycle: {
          ...currentCycle,
          periods: (currentCycle.periods || []).map((p) => (p.id === period.id ? period : p))
        }
      };
    });
    showToast('Ciclo atualizado.');
  }, [updateData, showToast]);

  const deletePeriod = useCallback((id: string) => {
    updateData((prev) => {
      const currentCycle = prev.cycle || { averageCycleLength: 28, averagePeriodLength: 5, periods: [], dailyLogs: {} };
      return {
        ...prev,
        cycle: {
          ...currentCycle,
          periods: (currentCycle.periods || []).filter((p) => p.id !== id)
        }
      };
    });
    showToast('Registro de ciclo removido.');
  }, [updateData, showToast]);

  const updateCycleDailyLog = useCallback((date: string, log: Partial<CycleDailyLog>) => {
    updateData((prev) => {
      const currentCycle = prev.cycle || { averageCycleLength: 28, averagePeriodLength: 5, periods: [], dailyLogs: {} };
      const existing = currentCycle.dailyLogs?.[date] || {
        date,
        symptoms: [],
        mood: [],
        energyLevel: 3
      };
      const updatedLog: CycleDailyLog = {
        ...existing,
        ...log,
        date
      };
      return {
        ...prev,
        cycle: {
          ...currentCycle,
          dailyLogs: {
            ...(currentCycle.dailyLogs || {}),
            [date]: updatedLog
          }
        }
      };
    });
    showToast('Registro do dia salvo. 🌸');
  }, [updateData, showToast]);

  const updateCycleSettings = useCallback((settings: { averageCycleLength?: number; averagePeriodLength?: number }) => {
    updateData((prev) => {
      const currentCycle = prev.cycle || { averageCycleLength: 28, averagePeriodLength: 5, periods: [], dailyLogs: {} };
      return {
        ...prev,
        cycle: {
          ...currentCycle,
          averageCycleLength: settings.averageCycleLength ?? currentCycle.averageCycleLength,
          averagePeriodLength: settings.averagePeriodLength ?? currentCycle.averagePeriodLength
        }
      };
    });
    showToast('Configurações do ciclo salvas.');
  }, [updateData, showToast]);

  const resetData = useCallback(() => {
    resetAllData();
    setData(loadAppData());
    showToast('Todos os dados foram restaurados para o padrão.');
  }, [showToast]);

  const refreshData = useCallback(() => {
    setData(loadAppData());
  }, []);

  // Today completion percentage calculation:
  // Combines tasks, habits, water progress, self-care
  const todayStr = getTodayDateString();
  const todayTasks = data.tasks.filter((t) => t.date === todayStr);
  const tasksCompleted = todayTasks.filter((t) => t.completed).length;
  const tasksTotal = todayTasks.length;

  const habitsTotal = data.habits.length;
  const habitsCompleted = data.habits.filter((h) => !!h.history[todayStr]).length;

  const waterToday = data.hydration[todayStr];
  const waterRatio = waterToday ? Math.min(1, waterToday.amountMl / (waterToday.targetMl || 2000)) : 0;

  const selfCareTodayCount = (data.selfCareCompleted[todayStr] || []).length;
  const selfCareTarget = 4; // realistic daily target

  let scoreSum = 0;
  let weightSum = 0;

  if (tasksTotal > 0) {
    scoreSum += (tasksCompleted / tasksTotal) * 40;
    weightSum += 40;
  }
  if (habitsTotal > 0) {
    scoreSum += (habitsCompleted / habitsTotal) * 30;
    weightSum += 30;
  }
  scoreSum += waterRatio * 20;
  weightSum += 20;

  scoreSum += Math.min(1, selfCareTodayCount / selfCareTarget) * 10;
  weightSum += 10;

  const todayCompletionPercentage = weightSum > 0 ? Math.round((scoreSum / weightSum) * 100) : 0;

  return (
    <AppContext.Provider
      value={{
        data,
        activeTab,
        setActiveTab,
        selectedDate,
        setSelectedDate,
        isBrainDumpOpen,
        setIsBrainDumpOpen,
        isTaskModalOpen,
        setIsTaskModalOpen,
        editingTask,
        setEditingTask,
        isSearchOpen,
        setIsSearchOpen,
        isDayClosingOpen,
        setIsDayClosingOpen,
        isFiveMinGodOpen,
        setIsFiveMinGodOpen,
        isOnboardingOpen,
        setIsOnboardingOpen,
        isAchievementsOpen,
        setIsAchievementsOpen,
        celebrationAchievement,
        closeCelebration,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        showToast,
        updateUser,
        addTask,
        updateTask,
        toggleTask,
        toggleTaskCompleted,
        deleteTask,
        duplicateTask,
        openNewTaskModal,
        openEditTaskModal,
        addHabit,
        updateHabit,
        toggleHabit,
        toggleHabitCompletion,
        deleteHabit,
        addWater,
        resetWater,
        setWaterTarget,
        updateHydrationTarget,
        updateMeal,
        addGroceryItem,
        toggleGroceryItem,
        deleteGroceryItem,
        addMovement,
        deleteMovement,
        updateSleep,
        toggleSelfCareAction,
        toggleSelfCareItem,
        addCustomSelfCareAction,
        saveCheckIn,
        saveJournalEntry,
        addMemory,
        deleteMemory,
        addPrayer,
        updatePrayer,
        togglePrayerAnswered,
        deletePrayer,
        addDevotional,
        toggleFavoriteVerse,
        saveFiveMinuteSession,
        addGoal,
        updateGoal,
        toggleGoalStep,
        deleteGoal,
        addBill,
        updateBillStatus,
        toggleBillPaid,
        deleteBill,
        addIncome,
        updateIncome,
        toggleIncomeReceived,
        deleteIncome,
        addPeriod,
        updatePeriod,
        deletePeriod,
        updateCycleDailyLog,
        updateCycleSettings,
        resetData,
        refreshData,
        todayCompletionPercentage
      }}
    >
      {children}

      {/* Floating toast notification bar */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none px-4 w-full max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#1F3A34] text-emerald-50 text-xs sm:text-sm font-medium shadow-xl border border-emerald-800/40 animate-in fade-in slide-in-from-bottom-3 duration-200"
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
