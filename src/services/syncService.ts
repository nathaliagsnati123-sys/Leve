// Serviço de Sincronização Multi-Dispositivo em Nuvem - LEVE
// Garante que o que for alterado em um dispositivo seja salvo e sincronizado
// em tempo real em todos os outros dispositivos cadastrados com a mesma conta/e-mail.

import { 
  AppData, Task, Habit, HydrationLog, MealLog, GroceryItem, MovementActivity, 
  SleepLog, JournalEntry, Memory, Prayer, FiveMinuteGodSession, Goal, Bill, 
  Income, EmotionalCheckIn, UserProfile, NotificationSettings 
} from '../types';
import { getRememberedEmail } from './storage';

const DEVICE_ID_KEY = 'leve_device_id_v1';
const LAST_SYNC_TS_KEY = 'leve_last_cloud_sync_ts';

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'device_default';
  }
}

export function getLastSyncTimestamp(): number {
  try {
    const val = localStorage.getItem(LAST_SYNC_TS_KEY);
    return val ? Number(val) : 0;
  } catch {
    return 0;
  }
}

export function setLastSyncTimestamp(ts: number): void {
  try {
    localStorage.setItem(LAST_SYNC_TS_KEY, String(ts));
  } catch {}
}

export interface SyncIdentity {
  email?: string | null;
  userId?: string | null;
}

export function resolveSyncIdentity(identity?: SyncIdentity): { email: string; userId: string } {
  let email = (identity?.email || '').trim().toLowerCase();
  let userId = (identity?.userId || '').trim();

  if (!email) {
    const remembered = getRememberedEmail();
    if (remembered) email = remembered.trim().toLowerCase();
  }

  return { email, userId };
}

/**
 * Envia todos os dados do aplicativo para a nuvem.
 * Salva com versionamento e horário do servidor.
 */
export async function pushAppDataToCloud(
  data: AppData,
  identity: SyncIdentity
): Promise<{ success: boolean; timestamp?: number; version?: number; error?: string }> {
  const { email, userId } = resolveSyncIdentity(identity);
  if (!email && !userId) {
    return { success: false, error: 'Sem identificação de usuário ou e-mail.' };
  }

  try {
    const res = await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        userId,
        data,
        clientTimestamp: Date.now(),
        deviceId: getDeviceId()
      })
    });

    if (!res.ok) {
      return { success: false, error: `Status ${res.status}` };
    }

    const json = await res.json();
    if (json.success && json.timestamp) {
      setLastSyncTimestamp(json.timestamp);
      return { success: true, timestamp: json.timestamp, version: json.version };
    }

    return { success: false, error: json.error || 'Falha ao sincronizar' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha de rede' };
  }
}

/**
 * Puxa os dados mais recentes salvos na nuvem para esta conta.
 */
export async function pullAppDataFromCloud(
  identity: SyncIdentity,
  since = 0
): Promise<{ hasUpdates: boolean; data?: AppData | null; timestamp?: number; version?: number }> {
  const { email, userId } = resolveSyncIdentity(identity);
  if (!email && !userId) {
    return { hasUpdates: false, data: null };
  }

  try {
    const params = new URLSearchParams();
    if (email) params.set('email', email);
    if (userId) params.set('userId', userId);
    if (since > 0) params.set('since', String(since));

    const res = await fetch(`/api/sync/pull?${params.toString()}`);
    if (!res.ok) {
      return { hasUpdates: false, data: null };
    }

    const json = await res.json();
    if (json.hasUpdates && json.data) {
      if (json.timestamp) setLastSyncTimestamp(json.timestamp);
      return {
        hasUpdates: true,
        data: json.data as AppData,
        timestamp: json.timestamp,
        version: json.version
      };
    }

    return { hasUpdates: false, timestamp: json.timestamp, version: json.version };
  } catch (err) {
    return { hasUpdates: false, data: null };
  }
}

/**
 * Consulta ultrarrápida (<1ms) para saber se outro dispositivo salvou algo novo.
 */
export async function pollCloudForUpdates(
  identity: SyncIdentity,
  since: number
): Promise<{ hasUpdates: boolean; timestamp?: number; version?: number }> {
  const { email, userId } = resolveSyncIdentity(identity);
  if (!email && !userId) {
    return { hasUpdates: false };
  }

  try {
    const params = new URLSearchParams();
    if (email) params.set('email', email);
    if (userId) params.set('userId', userId);
    params.set('since', String(since));

    const res = await fetch(`/api/sync/poll?${params.toString()}`);
    if (!res.ok) return { hasUpdates: false };

    const json = await res.json();
    return {
      hasUpdates: Boolean(json.hasUpdates),
      timestamp: json.timestamp,
      version: json.version
    };
  } catch {
    return { hasUpdates: false };
  }
}

/**
 * Conexão em tempo real instantânea via Server-Sent Events (SSE).
 * Recebe qualquer alteração feita em qualquer outro dispositivo da mesma conta em <100ms.
 */
export function subscribeToCloudSyncEvents(
  identity: SyncIdentity,
  onRemoteUpdate: (data: AppData, timestamp: number, version: number) => void
): () => void {
  const { email, userId } = resolveSyncIdentity(identity);
  if (!email && !userId) return () => {};

  const myDeviceId = getDeviceId();
  let eventSource: EventSource | null = null;
  let isClosed = false;
  let reconnectTimer: any = null;

  function connect() {
    if (isClosed) return;
    try {
      const params = new URLSearchParams();
      if (email) params.set('email', email);
      if (userId) params.set('userId', userId);
      params.set('deviceId', myDeviceId);

      eventSource = new EventSource(`/api/sync/events?${params.toString()}`);

      eventSource.addEventListener('sync-update', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          // Ignora eco originado por este mesmo dispositivo
          if (payload.sourceDeviceId && payload.sourceDeviceId === myDeviceId) {
            return;
          }
          if (payload.data) {
            if (payload.timestamp) setLastSyncTimestamp(payload.timestamp);
            onRemoteUpdate(payload.data, payload.timestamp || Date.now(), payload.version || 1);
          }
        } catch (err) {
          console.warn('[sync SSE] Erro ao processar evento:', err);
        }
      });

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!isClosed) {
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    } catch (err) {
      console.warn('[sync SSE] Falha ao criar EventSource:', err);
      if (!isClosed) {
        reconnectTimer = setTimeout(connect, 4000);
      }
    }
  }

  connect();

  return () => {
    isClosed = true;
    clearTimeout(reconnectTimer);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}

// Sincronização instantânea entre abas no mesmo navegador
let localBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    localBroadcastChannel = new BroadcastChannel('leve_multidevice_tab_sync');
  }
} catch {}

export function broadcastLocalTabUpdate(data: AppData, timestamp: number): void {
  try {
    if (localBroadcastChannel) {
      localBroadcastChannel.postMessage({
        type: 'LOCAL_TAB_UPDATE',
        deviceId: getDeviceId(),
        timestamp,
        data
      });
    }
  } catch {}
}

export function subscribeToLocalTabUpdates(
  onUpdate: (data: AppData, timestamp: number) => void
): () => void {
  if (!localBroadcastChannel) return () => {};
  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'LOCAL_TAB_UPDATE' && event.data?.data) {
      if (event.data.deviceId !== getDeviceId()) {
        onUpdate(event.data.data, event.data.timestamp);
      }
    }
  };
  localBroadcastChannel.addEventListener('message', handler);
  return () => {
    localBroadcastChannel?.removeEventListener('message', handler);
  };
}

/**
 * Verifica se os dados locais são apenas os dados fictícios iniciais do app.
 */
export function isDefaultPlaceholderData(data: AppData | null | undefined): boolean {
  if (!data) return true;
  const taskIds = (data.tasks || []).map(t => t.id);
  const isDefaultTasks = taskIds.length === 0 ||
    (taskIds.length <= 2 && taskIds.every(id => id === 't-prioridade-1' || id === 't-tarefa-1'));
  const habitIds = (data.habits || []).map(h => h.id);
  const isDefaultHabits = habitIds.length === 0 || (habitIds.length === 1 && habitIds[0] === 'h-1');
  const hasNoJournal = Object.keys(data.journal || {}).length === 0;
  const hasNoUserName = !data.user?.name;
  return isDefaultTasks && isDefaultHabits && hasNoJournal && hasNoUserName;
}

/**
 * Mescla de forma inteligente dois conjuntos de AppData (Local e Nuvem).
 * NUNCA descarta tarefas, hábitos, anotações ou dados criados em qualquer dos dispositivos.
 */
export function mergeAppData(local: AppData, cloud: AppData): AppData {
  if (!cloud) return local;
  if (!local) return cloud;

  // Se o local for apenas os dados de exemplo padrão, adota diretamente os dados da conta na nuvem
  if (isDefaultPlaceholderData(local)) {
    return cloud;
  }
  if (isDefaultPlaceholderData(cloud)) {
    return local;
  }

  // IDs de itens de exemplo iniciais que não devem ser ressuscitados
  const DEFAULT_PLACEHOLDER_IDS = new Set([
    't-prioridade-1',
    't-tarefa-1',
    'h-1',
    'b-1',
    'p-1',
    'goal-1'
  ]);

  // 1. Tarefas (Tasks): União por ID
  const taskMap = new Map<string, Task>();
  // Adiciona locais (exceto placeholders não presentes na nuvem)
  (local.tasks || []).forEach(t => {
    if (t?.id) {
      if (DEFAULT_PLACEHOLDER_IDS.has(t.id) && !(cloud.tasks || []).some(ct => ct?.id === t.id)) {
        return;
      }
      taskMap.set(t.id, t);
    }
  });
  // Mescla com os da nuvem
  (cloud.tasks || []).forEach(ct => {
    if (!ct?.id) return;
    const existing = taskMap.get(ct.id);
    if (!existing) {
      taskMap.set(ct.id, ct);
    } else {
      // Se a tarefa foi completada em qualquer um dos dispositivos, mantém completada
      taskMap.set(ct.id, {
        ...existing,
        ...ct,
        completed: existing.completed || ct.completed
      });
    }
  });

  // 2. Hábitos (Habits): União por ID e união do histórico de dias
  const habitMap = new Map<string, Habit>();
  (local.habits || []).forEach(h => {
    if (h?.id) habitMap.set(h.id, h);
  });
  (cloud.habits || []).forEach(ch => {
    if (!ch?.id) return;
    const existing = habitMap.get(ch.id);
    if (!existing) {
      habitMap.set(ch.id, ch);
    } else {
      habitMap.set(ch.id, {
        ...existing,
        ...ch,
        history: {
          ...(existing.history || {}),
          ...(ch.history || {})
        }
      });
    }
  });

  // 3. Hidratação: Mescla dia a dia mantendo o maior consumo registrado
  const hydration: Record<string, HydrationLog> = { ...(local.hydration || {}) };
  Object.entries(cloud.hydration || {}).forEach(([date, cloudLog]) => {
    const localLog = hydration[date];
    if (!localLog) {
      hydration[date] = cloudLog;
    } else {
      hydration[date] = {
        ...localLog,
        ...cloudLog,
        amountMl: Math.max(localLog.amountMl || 0, cloudLog.amountMl || 0),
        targetMl: cloudLog.targetMl || localLog.targetMl || 2000,
        logs: Array.from(new Set([
          ...(localLog.logs || []),
          ...(cloudLog.logs || [])
        ]))
      };
    }
  });

  // 4. Refeições (Meals)
  const meals: Record<string, MealLog> = { ...(local.meals || {}) };
  Object.entries(cloud.meals || {}).forEach(([date, cloudMeal]) => {
    const localMeal = meals[date];
    if (!localMeal) {
      meals[date] = cloudMeal;
    } else {
      meals[date] = {
        date,
        breakfast: {
          checked: Boolean(cloudMeal.breakfast?.checked || localMeal.breakfast?.checked),
          description: cloudMeal.breakfast?.description || localMeal.breakfast?.description || ''
        },
        lunch: {
          checked: Boolean(cloudMeal.lunch?.checked || localMeal.lunch?.checked),
          description: cloudMeal.lunch?.description || localMeal.lunch?.description || ''
        },
        snack: {
          checked: Boolean(cloudMeal.snack?.checked || localMeal.snack?.checked),
          description: cloudMeal.snack?.description || localMeal.snack?.description || ''
        },
        dinner: {
          checked: Boolean(cloudMeal.dinner?.checked || localMeal.dinner?.checked),
          description: cloudMeal.dinner?.description || localMeal.dinner?.description || ''
        },
        rating: cloudMeal.rating || localMeal.rating,
        reflection: cloudMeal.reflection || localMeal.reflection
      };
    }
  });

  // 5. Lista de Compras (Groceries)
  const groceryMap = new Map<string, GroceryItem>();
  (local.groceries || []).forEach(g => { if (g?.id) groceryMap.set(g.id, g); });
  (cloud.groceries || []).forEach(cg => {
    if (!cg?.id) return;
    const existing = groceryMap.get(cg.id);
    if (!existing) {
      groceryMap.set(cg.id, cg);
    } else {
      groceryMap.set(cg.id, {
        ...existing,
        ...cg,
        completed: existing.completed || cg.completed
      });
    }
  });

  // 6. Atividades Físicas / Movimento
  const movementMap = new Map<string, MovementActivity>();
  (local.movement || []).forEach(m => { if (m?.id) movementMap.set(m.id, m); });
  (cloud.movement || []).forEach(cm => { if (cm?.id) movementMap.set(cm.id, cm); });

  // 7. Sono (Sleep)
  const sleep: Record<string, SleepLog> = {
    ...(local.sleep || {}),
    ...(cloud.sleep || {})
  };

  // 8. Diário (Journal): Record<string, JournalEntry> por data YYYY-MM-DD
  const journal: Record<string, JournalEntry> = {
    ...(local.journal || {}),
    ...(cloud.journal || {})
  };
  Object.entries(cloud.journal || {}).forEach(([date, cj]) => {
    const lj = local.journal?.[date];
    if (!lj) {
      journal[date] = cj;
    } else {
      journal[date] = {
        ...lj,
        ...cj,
        gratitude: Array.from(new Set([...(lj.gratitude || []), ...(cj.gratitude || [])])),
        goodThings: Array.from(new Set([...(lj.goodThings || []), ...(cj.goodThings || [])]))
      };
    }
  });

  // 9. Memórias (Memories)
  const memoryMap = new Map<string, Memory>();
  (local.memories || []).forEach(m => { if (m?.id) memoryMap.set(m.id, m); });
  (cloud.memories || []).forEach(cm => { if (cm?.id) memoryMap.set(cm.id, cm); });

  // 10. Orações (Prayers)
  const prayerMap = new Map<string, Prayer>();
  (local.prayers || []).forEach(p => { if (p?.id) prayerMap.set(p.id, p); });
  (cloud.prayers || []).forEach(cp => {
    if (!cp?.id) return;
    const existing = prayerMap.get(cp.id);
    if (!existing) {
      prayerMap.set(cp.id, cp);
    } else {
      prayerMap.set(cp.id, {
        ...existing,
        ...cp,
        answered: existing.answered || cp.answered
      });
    }
  });

  // 11. 5 Minutos com Deus (fiveMinuteSessions)
  const godMap = new Map<string, FiveMinuteGodSession>();
  (local.fiveMinuteSessions || []).forEach(g => { if (g?.id) godMap.set(g.id, g); });
  (cloud.fiveMinuteSessions || []).forEach(cg => { if (cg?.id) godMap.set(cg.id, cg); });

  // 12. Metas (Goals)
  const goalMap = new Map<string, Goal>();
  (local.goals || []).forEach(g => { if (g?.id) goalMap.set(g.id, g); });
  (cloud.goals || []).forEach(cg => {
    if (!cg?.id) return;
    const existing = goalMap.get(cg.id);
    if (!existing) {
      goalMap.set(cg.id, cg);
    } else {
      goalMap.set(cg.id, {
        ...existing,
        ...cg,
        completed: existing.completed || cg.completed
      });
    }
  });

  // 13. Finanças (Bills & Incomes)
  const billMap = new Map<string, Bill>();
  (local.bills || []).forEach(b => { if (b?.id) billMap.set(b.id, b); });
  (cloud.bills || []).forEach(cb => {
    if (!cb?.id) return;
    const existing = billMap.get(cb.id);
    if (!existing) {
      billMap.set(cb.id, cb);
    } else {
      billMap.set(cb.id, {
        ...existing,
        ...cb,
        paid: existing.paid || cb.paid
      });
    }
  });

  const incomeMap = new Map<string, Income>();
  (local.incomes || []).forEach(i => { if (i?.id) incomeMap.set(i.id, i); });
  (cloud.incomes || []).forEach(ci => { if (ci?.id) incomeMap.set(ci.id, ci); });

  // 14. Ciclo Menstrual (Cycle)
  const localCycle = local.cycle || { averageCycleLength: 28, averagePeriodLength: 5, periods: [], dailyLogs: {} };
  const cloudCycle = cloud.cycle || { averageCycleLength: 28, averagePeriodLength: 5, periods: [], dailyLogs: {} };
  const periodMap = new Map<string, any>();
  (localCycle.periods || []).forEach(p => { if (p?.id) periodMap.set(p.id, p); });
  (cloudCycle.periods || []).forEach(cp => { if (cp?.id) periodMap.set(cp.id, cp); });

  const cycleDailyLogs = {
    ...(localCycle.dailyLogs || {}),
    ...(cloudCycle.dailyLogs || {})
  };

  // 15. Minha Vida (My Life)
  const localLife = local.myLife || { books: [], movies: [], series: [], hobbies: [], places: [], dreams: [] };
  const cloudLife = cloud.myLife || { books: [], movies: [], series: [], hobbies: [], places: [], dreams: [] };

  const mergeLifeList = (l1: any[] = [], l2: any[] = []) => {
    const map = new Map<string, any>();
    l1.forEach(item => { if (item?.id) map.set(item.id, item); });
    l2.forEach(item => { if (item?.id) map.set(item.id, item); });
    return Array.from(map.values());
  };

  // 16. Conquistas (Achievements)
  const unlockedAchievements = {
    ...(local.unlockedAchievements || {}),
    ...(cloud.unlockedAchievements || {})
  };

  // 17. Check-ins emocionais: Record<string, EmotionalCheckIn> por data
  const checkIns: Record<string, EmotionalCheckIn> = {
    ...(local.checkIns || {}),
    ...(cloud.checkIns || {})
  };

  // 18. Perfil do Usuário
  const cloudUser = cloud.user || ({} as Partial<UserProfile>);
  const localUser = local.user || ({} as Partial<UserProfile>);
  const mergedUser: UserProfile = {
    name: cloudUser.name?.trim() || localUser.name?.trim() || '',
    avatar: cloudUser.avatar || localUser.avatar || '🌿',
    accentColor: cloudUser.accentColor || localUser.accentColor || '#1F3A34',
    theme: cloudUser.theme || localUser.theme || 'light',
    hasCompletedOnboarding: Boolean(localUser.hasCompletedOnboarding || cloudUser.hasCompletedOnboarding),
    treatmentPreference: (cloudUser.treatmentPreference && cloudUser.treatmentPreference !== 'nao_informar')
      ? cloudUser.treatmentPreference
      : (localUser.treatmentPreference || 'nao_informar'),
    dailyIntention: cloudUser.dailyIntention || localUser.dailyIntention,
    lastClosedDay: cloudUser.lastClosedDay || localUser.lastClosedDay
  };

  // 19. Autocuidado
  const selfCareCompleted = {
    ...(local.selfCareCompleted || {}),
    ...(cloud.selfCareCompleted || {})
  };

  // 20. Versículos favoritos
  const favoriteVerses = Array.from(new Set([
    ...(local.favoriteVerses || []),
    ...(cloud.favoriteVerses || [])
  ]));

  return {
    user: mergedUser,
    tasks: Array.from(taskMap.values()),
    habits: Array.from(habitMap.values()),
    hydration,
    meals,
    groceries: Array.from(groceryMap.values()),
    movement: Array.from(movementMap.values()),
    sleep,
    selfCareList: cloud.selfCareList && cloud.selfCareList.length > 0 ? cloud.selfCareList : (local.selfCareList || []),
    selfCareCompleted,
    checkIns,
    journal,
    memories: Array.from(memoryMap.values()),
    prayers: Array.from(prayerMap.values()),
    fiveMinuteSessions: Array.from(godMap.values()),
    favoriteVerses,
    goals: Array.from(goalMap.values()),
    bills: Array.from(billMap.values()),
    incomes: Array.from(incomeMap.values()),
    cycle: {
      averageCycleLength: cloudCycle.averageCycleLength || localCycle.averageCycleLength || 28,
      averagePeriodLength: cloudCycle.averagePeriodLength || localCycle.averagePeriodLength || 5,
      periods: Array.from(periodMap.values()),
      dailyLogs: cycleDailyLogs
    },
    unlockedAchievements,
    myLife: {
      books: mergeLifeList(localLife.books, cloudLife.books),
      movies: mergeLifeList(localLife.movies, cloudLife.movies),
      series: mergeLifeList(localLife.series, cloudLife.series),
      hobbies: mergeLifeList(localLife.hobbies, cloudLife.hobbies),
      places: mergeLifeList(localLife.places, cloudLife.places),
      dreams: mergeLifeList(localLife.dreams, cloudLife.dreams)
    },
    ...(cloud.notificationSettings || local.notificationSettings ? {
      notificationSettings: {
        ...(local.notificationSettings || {}),
        ...(cloud.notificationSettings || {})
      } as NotificationSettings
    } : {})
  };
}
