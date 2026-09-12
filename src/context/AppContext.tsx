// Contexto Principal do Aplicativo LEVE
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  AppData, Task, Habit, HydrationLog, MealLog, GroceryItem, MovementActivity, 
  SleepLog, EmotionalCheckIn, JournalEntry, Memory, Prayer, Devotional,
  FiveMinuteGodSession, Goal, Bill, Income, MenstrualPeriod, CycleDailyLog, UserProfile,
  Achievement, MyLifeBook, MyLifeMovie, MyLifeSeries, MyLifeHobby, MyLifePlace, MyLifeDream,
  LeviaMyLifeAction, NotificationSettings, DEFAULT_NOTIFICATION_SETTINGS
} from '../types';
import { 
  loadAppData, saveAppData, getTodayDateString, resetAllData, saveUserIdentity,
  isPresentationAlreadyCompleted, markPresentationCompleted, getRememberedEmail,
  sanitizeAppData
} from '../services/storage';
import { 
  mergeAppData, pollCloudForUpdates, getLastSyncTimestamp, setLastSyncTimestamp,
  subscribeToCloudSyncEvents, subscribeToLocalTabUpdates, broadcastLocalTabUpdate,
  isDefaultPlaceholderData
} from '../services/syncService';
import { ACHIEVEMENTS_LIST } from '../services/quotesAndVerses';
import { useAuth } from './AuthContext';
import { normalizeTreatmentPreference } from '../utils/treatment';
import { 
  getNotificationPermission, 
  requestNotificationPermission as requestPermService,
  sendSystemNotification,
  checkAndTriggerReminders,
  sendDailyMotivationalNotification,
  NotificationPermissionStatus
} from '../services/notificationService';

export type ActiveTab = 
  | 'my-day' 
  | 'calendar' 
  | 'habits' 
  | 'journal' 
  | 'spirituality' 
  | 'goals' 
  | 'my-life'
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
  isTourOpen: boolean;
  setIsTourOpen: (open: boolean) => void;
  startTour: () => void;
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

  // Minha Vida (My Life)
  addMyLifeBook: (book: Omit<MyLifeBook, 'id' | 'createdAt'>) => void;
  updateMyLifeBook: (book: MyLifeBook) => void;
  deleteMyLifeBook: (id: string) => void;
  
  addMyLifeMovie: (movie: Omit<MyLifeMovie, 'id' | 'createdAt'>) => void;
  updateMyLifeMovie: (movie: MyLifeMovie) => void;
  deleteMyLifeMovie: (id: string) => void;
  
  addMyLifeSeries: (series: Omit<MyLifeSeries, 'id' | 'createdAt'>) => void;
  updateMyLifeSeries: (series: MyLifeSeries) => void;
  deleteMyLifeSeries: (id: string) => void;
  
  addMyLifeHobby: (hobby: Omit<MyLifeHobby, 'id' | 'createdAt'>) => void;
  updateMyLifeHobby: (hobby: MyLifeHobby) => void;
  deleteMyLifeHobby: (id: string) => void;
  
  addMyLifePlace: (place: Omit<MyLifePlace, 'id' | 'createdAt'>) => void;
  updateMyLifePlace: (place: MyLifePlace) => void;
  deleteMyLifePlace: (id: string) => void;
  
  addMyLifeDream: (dream: Omit<MyLifeDream, 'id' | 'createdAt'>) => void;
  updateMyLifeDream: (dream: MyLifeDream) => void;
  deleteMyLifeDream: (id: string) => void;
  
  toggleMyLifeFavorite: (category: 'books' | 'movies' | 'series' | 'hobbies' | 'places' | 'dreams', id: string) => void;
  executeLeviaMyLifeAction: (action: LeviaMyLifeAction) => Promise<{ success: boolean; message: string }>;
  
  // Data management & Multi-Device Sync
  resetData: () => void;
  refreshData: () => void;
  forceSyncAll: () => Promise<boolean>;

  // Notificações & Lembretes
  notificationSettings: NotificationSettings;
  notificationPermission: NotificationPermissionStatus;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  requestNotificationPermission: () => Promise<boolean>;
  sendTestNotification: () => Promise<boolean>;
  sendDailyMotivationalNotificationNow: () => Promise<boolean>;

  // Stats
  todayCompletionPercentage: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(loadAppData);
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => {
    try {
      const saved = localStorage.getItem('leve_active_tab');
      if (saved) return saved as ActiveTab;
    } catch {
      // fallback
    }
    return 'my-day';
  });

  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('leve_active_tab', tab);
    } catch {
      // ignore
    }
  };
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  
  const [isBrainDumpOpen, setIsBrainDumpOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDayClosingOpen, setIsDayClosingOpen] = useState(false);
  const [isFiveMinGodOpen, setIsFiveMinGodOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [celebrationAchievement, setCelebrationAchievement] = useState<Achievement | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const startTour = useCallback(() => {
    setIsTourOpen(true);
  }, []);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const closeCelebration = useCallback(() => {
    setCelebrationAchievement(null);
  }, []);

  // Check onboarding on mount - apresentação exibida estritamente apenas 1 vez
  useEffect(() => {
    const alreadyCompleted = isPresentationAlreadyCompleted();
    const hasCompleted = Boolean(data?.user?.hasCompletedOnboarding);
    if (hasCompleted || alreadyCompleted) {
      setIsOnboardingOpen(false);
      if (!hasCompleted && alreadyCompleted && data?.user) {
        setData((prev) => {
          const userObj = prev?.user || { name: '', avatar: '🌿', accentColor: '#1F3A34', theme: 'light', hasCompletedOnboarding: false, treatmentPreference: 'neutro' };
          const updated = {
            ...prev,
            user: { ...userObj, hasCompletedOnboarding: true }
          };
          saveAppData(updated);
          return updated;
        });
      }
    } else {
      setIsOnboardingOpen(true);
    }
  }, [data?.user?.hasCompletedOnboarding]);

  // Synchronize Dark Mode with document.documentElement
  useEffect(() => {
    const isDark = data.user?.theme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [data.user?.theme]);

  // Supabase Cloud Sync Integration
  const { user, syncDataNow, pullCloudData, userProfile, saveProfile } = useAuth();

  // If user profile with name or treatment preference is fetched from Supabase, update user profile in state
  useEffect(() => {
    if (userProfile) {
      const profileName = (userProfile.name || userProfile.full_name || '').trim();
      const rawPref = userProfile.treatment_preference;
      const pref = rawPref ? normalizeTreatmentPreference(rawPref) : undefined;
      
      if (pref) {
        try {
          localStorage.setItem('leve_treatment_pref_current', pref);
          if (user?.id) {
            localStorage.setItem('leve_treatment_pref_' + user.id, pref);
          }
        } catch {}
      }

      setData((prev) => {
        const needsNameUpdate = Boolean(profileName && prev.user.name !== profileName);
        const hasExplicitLocalPref = Boolean(prev.user.treatmentPreference && prev.user.treatmentPreference !== 'nao_informar');
        const isMeaningfulCloudPref = Boolean(pref && pref !== 'nao_informar');
        const needsPrefUpdate = isMeaningfulCloudPref 
          ? prev.user.treatmentPreference !== pref
          : (!hasExplicitLocalPref && Boolean(pref) && prev.user.treatmentPreference !== pref);

        if (!needsNameUpdate && !needsPrefUpdate) return prev;
        const updated = {
          ...prev,
          user: {
            ...prev.user,
            ...(needsNameUpdate ? { name: profileName } : {}),
            ...(needsPrefUpdate ? { treatmentPreference: pref } : {})
          }
        };
        saveAppData(updated);
        return updated;
      });
    }
  }, [userProfile, user?.id]);

  // ============================================================================
  // Multi-Device Cloud Sync Engine (Sincronização entre todos os dispositivos)
  // ============================================================================
  // MULTI-DEVICE CLOUD SYNC ENGINE (Sincronização em Tempo Real entre Dispositivos)
  // ============================================================================
  const isApplyingRemoteRef = React.useRef(false);
  const isSyncingRef = React.useRef(false);
  const lastSyncedTimestampRef = React.useRef<number>(getLastSyncTimestamp());
  const lastLocalEditTimeRef = React.useRef<number>(0);

  const activeEmail = (user?.email || getRememberedEmail() || '').trim().toLowerCase();
  const activeUserId = user?.id || '';
  const hasAccount = Boolean(activeEmail || activeUserId);

  // Força uma sincronização completa manual
  const forceSyncAll = useCallback(async (): Promise<boolean> => {
    if (!hasAccount) return false;
    isSyncingRef.current = true;
    try {
      const cloudData = await pullCloudData();
      if (cloudData) {
        isApplyingRemoteRef.current = true;
        const hasUnsavedEdits = lastLocalEditTimeRef.current > lastSyncedTimestampRef.current;
        let nextData: AppData;
        setData((prev) => {
          nextData = (!hasUnsavedEdits || isDefaultPlaceholderData(prev))
            ? sanitizeAppData(cloudData)
            : mergeAppData(prev, cloudData);
          saveAppData(nextData);
          return nextData;
        });
        const now = Date.now();
        lastSyncedTimestampRef.current = now;
        setLastSyncTimestamp(now);
        broadcastLocalTabUpdate(nextData!, now);
        if (hasUnsavedEdits) {
          await syncDataNow(nextData!);
        }
        return true;
      } else {
        // Envia os dados locais se a nuvem ainda não tem nada
        const success = await syncDataNow(data);
        if (success) {
          const now = Date.now();
          lastSyncedTimestampRef.current = now;
          setLastSyncTimestamp(now);
          broadcastLocalTabUpdate(data, now);
        }
        return success;
      }
    } catch (err) {
      console.warn('[forceSyncAll] Erro:', err);
      return false;
    } finally {
      isSyncingRef.current = false;
    }
  }, [hasAccount, pullCloudData, syncDataNow, data]);

  // 1. Ao iniciar o app ou logar: puxa da nuvem para sincronizar a conta imediatamente
  useEffect(() => {
    if (!hasAccount) return;
    let isCancelled = false;

    async function syncOnLoginOrMount() {
      try {
        const cloudData = await pullCloudData();
        if (cloudData && !isCancelled) {
          isApplyingRemoteRef.current = true;
          setData((prev) => {
            const next = isDefaultPlaceholderData(prev) ? sanitizeAppData(cloudData) : mergeAppData(prev, cloudData);
            saveAppData(next);
            return next;
          });
          const now = Date.now();
          lastSyncedTimestampRef.current = now;
          setLastSyncTimestamp(now);
          broadcastLocalTabUpdate(cloudData, now);
        } else if (!cloudData && !isCancelled) {
          // Nuvem ainda sem dados: envia os dados atuais para a conta
          await syncDataNow(data);
          const now = Date.now();
          lastSyncedTimestampRef.current = now;
          setLastSyncTimestamp(now);
        }
      } catch (e) {
        console.warn('Sync on mount error:', e);
      }
    }

    syncOnLoginOrMount();
    return () => { isCancelled = true; };
  }, [user?.id, activeEmail]);

  // 2. Transmissão em tempo real instantânea (SSE) e Cross-Tab: reflete alterações de outros dispositivos em <100ms
  useEffect(() => {
    if (!hasAccount) return;

    // Escuta Server-Sent Events do servidor quando outro dispositivo da mesma conta altera algo
    const unsubscribeSSE = subscribeToCloudSyncEvents(
      { email: activeEmail, userId: activeUserId },
      (remoteData, timestamp) => {
        isApplyingRemoteRef.current = true;
        setData((prev) => {
          const hasUnsavedEdits = lastLocalEditTimeRef.current > lastSyncedTimestampRef.current;
          let nextState: AppData;
          if (!hasUnsavedEdits || isDefaultPlaceholderData(prev)) {
            nextState = sanitizeAppData(remoteData);
          } else {
            nextState = mergeAppData(prev, remoteData);
          }
          saveAppData(nextState);
          return nextState;
        });
        lastSyncedTimestampRef.current = timestamp;
        setLastSyncTimestamp(timestamp);
      }
    );

    // Escuta alterações imediatas em outras abas do mesmo navegador
    const unsubscribeTabs = subscribeToLocalTabUpdates((tabData, timestamp) => {
      isApplyingRemoteRef.current = true;
      setData(tabData);
      saveAppData(tabData);
      lastSyncedTimestampRef.current = timestamp;
    });

    return () => {
      unsubscribeSSE();
      unsubscribeTabs();
    };
  }, [hasAccount, activeEmail, activeUserId]);

  // 3. Debounced auto-sync (Push): Envia alterações locais para a nuvem de forma ágil (350ms)
  useEffect(() => {
    if (!hasAccount) return;

    if (isApplyingRemoteRef.current) {
      isApplyingRemoteRef.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      try {
        await syncDataNow(data);
        const now = Date.now();
        lastSyncedTimestampRef.current = now;
        setLastSyncTimestamp(now);
        broadcastLocalTabUpdate(data, now);
      } finally {
        isSyncingRef.current = false;
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [data, hasAccount, syncDataNow]);

  // 4. Salvar imediatamente ao minimizar o app ou fechar a janela (Mobile e Desktop)
  useEffect(() => {
    if (!hasAccount) return;

    const handleFlushSync = () => {
      if (!isSyncingRef.current) {
        syncDataNow(data);
      }
    };

    window.addEventListener('beforeunload', handleFlushSync);
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        handleFlushSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('beforeunload', handleFlushSync);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [data, hasAccount, syncDataNow]);

  // 5. Poller de contingência (caso a conexão SSE oscile na rede do celular)
  useEffect(() => {
    if (!hasAccount) return;

    const checkForOtherDeviceUpdates = async () => {
      if (document.visibilityState === 'hidden' || isSyncingRef.current) return;
      try {
        const check = await pollCloudForUpdates(
          { email: activeEmail, userId: activeUserId },
          lastSyncedTimestampRef.current
        );

        if (check.hasUpdates) {
          isSyncingRef.current = true;
          const cloudData = await pullCloudData(lastSyncedTimestampRef.current);
          if (cloudData) {
            isApplyingRemoteRef.current = true;
            setData((prev) => {
              const hasUnsavedEdits = lastLocalEditTimeRef.current > lastSyncedTimestampRef.current;
              const next = (!hasUnsavedEdits || isDefaultPlaceholderData(prev))
                ? sanitizeAppData(cloudData)
                : mergeAppData(prev, cloudData);
              saveAppData(next);
              return next;
            });
            const now = check.timestamp || Date.now();
            lastSyncedTimestampRef.current = now;
            setLastSyncTimestamp(now);
          }
          isSyncingRef.current = false;
        }
      } catch {
        isSyncingRef.current = false;
      }
    };

    // Polling a cada 3 segundos
    const pollInterval = setInterval(checkForOtherDeviceUpdates, 3000);

    // Verificação imediata ao focar na janela / reabrir o app no celular
    const handleWindowFocus = () => {
      checkForOtherDeviceUpdates();
    };
    window.addEventListener('focus', handleWindowFocus);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForOtherDeviceUpdates();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasAccount, activeEmail, activeUserId, pullCloudData]);

  // Persist state
  const updateData = useCallback((updater: (prev: AppData) => AppData) => {
    lastLocalEditTimeRef.current = Date.now();
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
    const normalizedPref = profile.treatmentPreference !== undefined
      ? normalizeTreatmentPreference(profile.treatmentPreference)
      : undefined;

    if (normalizedPref) {
      try {
        localStorage.setItem('leve_treatment_pref_current', normalizedPref);
        if (user?.id) {
          localStorage.setItem('leve_treatment_pref_' + user.id, normalizedPref);
        }
      } catch {}
    }

    // Salvar na persistência dedicada para que nunca se perca
    saveUserIdentity({
      name: profile.name,
      avatar: profile.avatar,
      treatmentPreference: normalizedPref || profile.treatmentPreference
    });

    updateData((prev) => ({
      ...prev,
      user: { 
        ...prev.user, 
        ...profile,
        ...(normalizedPref ? { treatmentPreference: normalizedPref } : {})
      }
    }));

    // Se o usuário estiver autenticado e alterou nome, avatar ou preferência de tratamento, salva no Supabase
    if (user && (profile.treatmentPreference !== undefined || profile.name !== undefined || profile.avatar !== undefined)) {
      saveProfile({
        name: profile.name,
        avatar: profile.avatar,
        treatment_preference: normalizedPref || profile.treatmentPreference
      }).catch((e) => {
        console.warn('Erro ao sincronizar preferência no Supabase:', e);
      });
    }

    showToast('Preferências atualizadas.');
  }, [updateData, showToast, user, saveProfile]);

  // NOTIFICAÇÕES & LEMBRETES
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionStatus>(() => {
    return getNotificationPermission();
  });

  const notificationSettings = data.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS;

  const updateNotificationSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    updateData((prev) => {
      const current = prev.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS;
      const updated: NotificationSettings = { ...current, ...newSettings };
      return {
        ...prev,
        notificationSettings: updated
      };
    });
    showToast('Preferências de lembretes salvas! 🔔');
  }, [updateData, showToast]);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    const status = await requestPermService();
    setNotificationPermission(status);
    if (status === 'granted') {
      showToast('Notificações ativadas no dispositivo! 🔔', 'success');
      return true;
    } else if (status === 'denied') {
      showToast('Notificações bloqueadas pelo navegador. Você pode liberá-las nas configurações do navegador.', 'info');
      return false;
    }
    return false;
  }, [showToast]);

  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    const perm = getNotificationPermission();
    if (perm !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) {
        showToast('Ative as notificações para receber no dispositivo.', 'info');
        return false;
      }
    }

    const current = data.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS;
    showToast('Lembrete de teste disparado! 🔔', 'success');
    const sent = await sendSystemNotification('🌿 LEVE • Lembrete de Teste', {
      body: 'Seus lembretes de tarefas, água e hábitos estão ativos e funcionando perfeitamente!',
      tag: 'test-notification',
      sound: current.soundEnabled
    });
    return sent;
  }, [data.notificationSettings, requestNotificationPermission, showToast]);

  const sendDailyMotivationalNotificationNow = useCallback(async (): Promise<boolean> => {
    const perm = getNotificationPermission();
    if (perm !== 'granted') {
      await requestNotificationPermission();
    }
    return sendDailyMotivationalNotification(data, (msg) => showToast(msg, 'success'));
  }, [data, requestNotificationPermission, showToast]);

  // Verificador em segundo plano para lembretes de tarefas, água, hábitos, fé e fechamento
  useEffect(() => {
    // Checagem inicial com pequeno atraso para o app carregar suavemente
    const timer = setTimeout(() => {
      checkAndTriggerReminders(data, (msg) => showToast(msg, 'info'));
    }, 2500);

    // Checagem a cada 35 segundos
    const interval = setInterval(() => {
      checkAndTriggerReminders(data, (msg) => showToast(msg, 'info'));
    }, 35000);

    // Checagem automática ao retornar à aba / desbloquear o celular
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndTriggerReminders(data, (msg) => showToast(msg, 'info'));
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [data, showToast]);

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

  // --------------------------------------------------------
  // Minha Vida (My Life) Operations
  // --------------------------------------------------------
  const getSafeMyLife = (prev: AppData) => {
    return prev.myLife || {
      books: [],
      movies: [],
      series: [],
      hobbies: [],
      places: [],
      dreams: []
    };
  };

  const addMyLifeBook = useCallback((book: Omit<MyLifeBook, 'id' | 'createdAt'>) => {
    const newBook: MyLifeBook = {
      ...book,
      id: 'book-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      createdAt: new Date().toISOString()
    };
    updateData((prev) => {
      const ml = getSafeMyLife(prev);
      return {
        ...prev,
        myLife: {
          ...ml,
          books: [newBook, ...ml.books]
        }
      };
    });
    showToast(`"${book.title}" adicionado aos seus livros.`);
  }, [updateData, showToast]);

  const updateMyLifeBook = useCallback((book: MyLifeBook) => {
    updateData((prev) => {
      const ml = getSafeMyLife(prev);
      return {
        ...prev,
        myLife: {
          ...ml,
          books: ml.books.map((b) => (b.id === book.id ? { ...book, updatedAt: new Date().toISOString() } : b))
        }
      };
    });
    showToast('Livro atualizado.');
  }, [updateData, showToast]);

  const deleteMyLifeBook = useCallback((id: string) => {
    updateData((prev) => {
      const ml = getSafeMyLife(prev);
      return {
        ...prev,
        myLife: {
          ...ml,
          books: ml.books.filter((b) => b.id !== id)
        }
      };
    });
    showToast('Livro removido.');
  }, [updateData, showToast]);

  const addMyLifeMovie = useCallback((movie: Omit<MyLifeMovie, 'id' | 'createdAt'>) => {
    const newMovie: MyLifeMovie = {
      ...movie,
      id: 'movie-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      createdAt: new Date().toISOString()
    };
    updateData((prev) => {
      const ml = getSafeMyLife(prev);
      return {
        ...prev,
        myLife: {
          ...ml,
          movies: [newMovie, ...ml.movies]
        }
      };
    });
    showToast(`"${movie.title}" adicionado aos seus filmes.`);
  }, [updateData, showToast]);

  const updateMyLifeMovie = useCallback((movie: MyLifeMovie) => {
    updateData((prev) => {
      const ml = getSafeMyLife(prev);
      return {
        ...prev,
        myLife: {
          ...ml,
          movies: ml.movies.map((m) => (m.id === movie.id ? { ...movie, updatedAt: new Date().toISOString() } : m))
        }
      };
    });
    showToast('Filme atualizado.');
  }, [updateData, showToast]);

  const deleteMyLifeMovie = useCallback((id: string) => {
    updateData((prev) => {
      const ml = getSafeMyLife(prev);
      return {
        ...prev,
        myLife: {
          ...ml,
          movies: ml.movies.filter((m) => m.id !== id)
        }
      };
    });
    showToast('Filme removido.');
  }, [updateData, showToast]);

  const addMyLifeSeries = useCallback((series: Omit<MyLifeSeries, 'id' | 'createdAt'>) => {
    const newSeries: MyLifeSeries = {
      ...series,
      id: 'series-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      createdAt: new Date().toISOString()
    };
    updateData((prev) => {
      const ml = getSafeMyLife(prev);
      return {
        ...prev,
        myLife: {
          ...ml,
          series: [newSeries, ...ml.series]
        }
      };
    });
    showToast(`"${series.name}" adicionada às suas séries.`);
  }, [updateData, showToast]);

  const updateMyLifeSeries = useCallback((series: MyLifeSeries) => {
    updateData((prev) => {
      const ml = getSafeMyLife(prev);
      return {
        ...prev,
        myLife: {
          ...ml,
          series: ml.series.map((s) => (s.id === series.id ? { ...series, updatedAt: new Date().toISOString() } : s))
        }
      };
    });
    showToast('Série atualizada.');
  }, [updateData, showToast]);

  const deleteMyLifeSeries = useCallback((id: string) => {
    updateData((prev) => {
      const ml = getSafeMyLife(prev);
      return {
        ...prev,
        myLife: {
          ...ml,
          series: ml.series.filter((s) => s.id !== id)
        }
      };
    });
    showToast('Série removida.');
  }, [updateData, showToast]);

  const addMyLifeHobby = useCallback((hobby: Omit<MyLifeHobby, 'id' | 'createdAt'>) => {
    const newHobby: MyLifeHobby = {
      ...hobby,
      id: 'hobby-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      createdAt: new Date().toISOString()
    };
    updateData((prev) => {
      const ml = getSafeMyLife(prev);
      return {
        ...prev,
        myLife: {
          ...ml,
          hobbies: [newHobby, ...ml.hobbies]
        }
      };
    });
    showToast(`Hobby "${hobby.name}" adicionado.`);
  }, [updateData, showToast]);

  const updateMyLifeHobby = useCallback((hobby: MyLifeHobby) => {
    updateData((prev) => {
      const ml = getSafeMyLife(prev);
      return {
        ...prev,
        myLife: {
          ...ml,
          hobbies: ml.hobbies.map((h) => (h.id === hobby.id ? { ...hobby, updatedAt: new Date().toISOString() } : h))
        }
      };
    });
    showToast('Hobby atualizado.');
  }, [updateData, showToast]);

  const deleteMyLifeHobby = useCallback((id: string) => {
    updateData((prev) => {
      const ml = getSafeMyLife(prev);
      return {
        ...prev,
        myLife: {
          ...ml,
          hobbies: ml.hobbies.filter((h) => h.id !== id)
        }
      };
    });
    showToast('Hobby removido.');
  }, [updateData, showToast]);

  const addMyLifePlace = useCallback((place: Omit<MyLifePlace, 'id' | 'createdAt'>) => {
    const newPlace: MyLifePlace = {
      ...place,
      id: 'place-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      createdAt: new Date().toISOString()
    };
    updateData((prev) => {
      const ml = getSafeMyLife(prev);
      return {
        ...prev,
        myLife: {
          ...ml,
          places: [newPlace, ...ml.places]
        }
      };
    });
    showToast(`"${place.name}" adicionado aos seus lugares.`);
  }, [updateData, showToast]);

  const updateMyLifePlace = useCallback((place: MyLifePlace) => {
    updateData((prev) => {
      const ml = getSafeMyLife(prev);
      return {
        ...prev,
        myLife: {
          ...ml,
          places: ml.places.map((p) => (p.id === place.id ? { ...place, updatedAt: new Date().toISOString() } : p))
        }
      };
    });
    showToast('Lugar atualizado.');
  }, [updateData, showToast]);

  const deleteMyLifePlace = useCallback((id: string) => {
    updateData((prev) => {
      const ml = getSafeMyLife(prev);
      return {
        ...prev,
        myLife: {
          ...ml,
          places: ml.places.filter((p) => p.id !== id)
        }
      };
    });
    showToast('Lugar removido.');
  }, [updateData, showToast]);

  const addMyLifeDream = useCallback((dream: Omit<MyLifeDream, 'id' | 'createdAt'>) => {
    const newDream: MyLifeDream = {
      ...dream,
      id: 'dream-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      createdAt: new Date().toISOString()
    };
    updateData((prev) => {
      const ml = getSafeMyLife(prev);
      return {
        ...prev,
        myLife: {
          ...ml,
          dreams: [newDream, ...ml.dreams]
        }
      };
    });
    showToast(`Sonho "${dream.title}" registrado com carinho.`);
  }, [updateData, showToast]);

  const updateMyLifeDream = useCallback((dream: MyLifeDream) => {
    updateData((prev) => {
      const ml = getSafeMyLife(prev);
      return {
        ...prev,
        myLife: {
          ...ml,
          dreams: ml.dreams.map((d) => (d.id === dream.id ? { ...dream, updatedAt: new Date().toISOString() } : d))
        }
      };
    });
    showToast('Sonho atualizado.');
  }, [updateData, showToast]);

  const deleteMyLifeDream = useCallback((id: string) => {
    updateData((prev) => {
      const ml = getSafeMyLife(prev);
      return {
        ...prev,
        myLife: {
          ...ml,
          dreams: ml.dreams.filter((d) => d.id !== id)
        }
      };
    });
    showToast('Sonho removido.');
  }, [updateData, showToast]);

  const toggleMyLifeFavorite = useCallback((category: 'books' | 'movies' | 'series' | 'hobbies' | 'places' | 'dreams', id: string) => {
    updateData((prev) => {
      const ml = getSafeMyLife(prev);
      const updated = {
        ...prev,
        myLife: {
          ...ml,
          [category]: (ml[category] as any[]).map((item) => {
            if (item.id === id) {
              return { ...item, favorite: !item.favorite };
            }
            return item;
          })
        }
      };
      return updated;
    });
  }, [updateData]);

  // Pre-configured executor for future LEVIA AI interactions
  const executeLeviaMyLifeAction = useCallback(async (action: LeviaMyLifeAction): Promise<{ success: boolean; message: string }> => {
    try {
      const { category, action: act, item } = action;
      if (act === 'add') {
        if (category === 'books') addMyLifeBook(item as any);
        else if (category === 'movies') addMyLifeMovie(item as any);
        else if (category === 'series') addMyLifeSeries(item as any);
        else if (category === 'hobbies') addMyLifeHobby(item as any);
        else if (category === 'places') addMyLifePlace(item as any);
        else if (category === 'dreams') addMyLifeDream(item as any);
        return { success: true, message: `Item adicionado com sucesso em Minha Vida (${category}).` };
      }
      return { success: true, message: 'Ação processada com sucesso.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Erro ao processar ação.' };
    }
  }, [addMyLifeBook, addMyLifeMovie, addMyLifeSeries, addMyLifeHobby, addMyLifePlace, addMyLifeDream]);

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
        isTourOpen,
        setIsTourOpen,
        startTour,
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
        addMyLifeBook,
        updateMyLifeBook,
        deleteMyLifeBook,
        addMyLifeMovie,
        updateMyLifeMovie,
        deleteMyLifeMovie,
        addMyLifeSeries,
        updateMyLifeSeries,
        deleteMyLifeSeries,
        addMyLifeHobby,
        updateMyLifeHobby,
        deleteMyLifeHobby,
        addMyLifePlace,
        updateMyLifePlace,
        deleteMyLifePlace,
        addMyLifeDream,
        updateMyLifeDream,
        deleteMyLifeDream,
        toggleMyLifeFavorite,
        executeLeviaMyLifeAction,
        resetData,
        refreshData,
        forceSyncAll,
        notificationSettings,
        notificationPermission,
        updateNotificationSettings,
        requestNotificationPermission,
        sendTestNotification,
        sendDailyMotivationalNotificationNow,
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
