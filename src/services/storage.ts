// Armazenamento Local e Persistência - LEVE
import { AppData, Task, Habit, HydrationLog, MealLog, GroceryItem, MovementActivity, SleepLog, JournalEntry, Memory, Prayer, FiveMinuteGodSession, Goal, Bill, UserProfile } from '../types';
import { DEFAULT_SELF_CARE_ACTIONS } from './quotesAndVerses';

const STORAGE_KEY = 'leve_app_data_v3';
const OLD_STORAGE_KEY_V2 = 'leve_app_data_v2';
const OLD_STORAGE_KEY_V1 = 'leve_app_data_v1';

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateToBrazilian(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  const weekdays = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado'
  ];
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  
  const weekday = weekdays[date.getDay()];
  const monthName = months[date.getMonth()];
  
  return `${weekday}, ${day} de ${monthName}`;
}

export const INITIAL_APP_DATA: AppData = {
  user: {
    name: '',
    avatar: '🌿',
    accentColor: '#1F3A34',
    theme: 'light',
    hasCompletedOnboarding: false,
    treatmentPreference: 'neutro',
    dailyIntention: 'Ter mais calma e paciência no meu caminhar 🕊️'
  },
  tasks: [
    {
      id: 't-prioridade-1',
      title: 'Fazer atividades da escola',
      date: getTodayDateString(),
      time: '14:00',
      priority: 'high',
      category: 'Estudos',
      repeat: 'none',
      completed: false
    },
    {
      id: 't-tarefa-1',
      title: 'Terminar de arrumar o quarto',
      date: getTodayDateString(),
      time: '16:00',
      priority: 'medium',
      category: 'Casa',
      repeat: 'none',
      completed: false
    }
  ],
  habits: [
    {
      id: 'h-1',
      name: 'Beber 2 litros de água',
      icon: '💧',
      frequency: 'daily',
      targetDaysPerWeek: 7,
      category: 'Saúde',
      createdAt: getTodayDateString(),
      history: {}
    }
  ],
  hydration: {
    [getTodayDateString()]: {
      date: getTodayDateString(),
      amountMl: 0,
      targetMl: 2000,
      cupSizeMl: 250,
      logs: []
    }
  },
  meals: {},
  groceries: [
    { id: 'g-1', name: 'Comprar frutas frescas', category: 'Frutas e Verduras', completed: false, quantity: '1kg' }
  ],
  movement: [],
  sleep: {},
  selfCareList: DEFAULT_SELF_CARE_ACTIONS,
  selfCareCompleted: {},
  checkIns: {},
  journal: {},
  memories: [],
  prayers: [
    {
      id: 'p-1',
      date: getTodayDateString(),
      content: 'Senhor, abençoe o meu dia e me dê serenidade.',
      category: 'paz',
      answered: false
    }
  ],
  devotionals: [],
  singleMeals: [],
  sleepList: [],
  fiveMinuteSessions: [],
  favoriteVerses: ['verse-1'],
  goals: [
    {
      id: 'goal-1',
      name: 'Exemplo de meta pessoal',
      description: 'Defina aqui algo especial que queira conquistar com tranquilidade.',
      category: 'Pessoal',
      deadline: '2026-12-31',
      completed: false,
      steps: [
        { id: 's-1', title: 'Primeiro passo simples', completed: false }
      ]
    }
  ],
  bills: [
    {
      id: 'b-1',
      name: 'Conta de Exemplo',
      amount: 50.00,
      dueDate: getTodayDateString(),
      category: 'Casa',
      status: 'pendente'
    }
  ],
  incomes: [],
  cycle: {
    averageCycleLength: 28,
    averagePeriodLength: 5,
    periods: [],
    dailyLogs: {}
  },
  unlockedAchievements: {},
  myLife: {
    books: [],
    movies: [],
    series: [],
    hobbies: [],
    places: [],
    dreams: []
  }
};

export const USER_IDENTITY_KEY = 'leve_user_identity_v1';

export interface PersistentUserIdentity {
  name: string;
  avatar: string;
  treatmentPreference?: any;
}

export function getSavedUserIdentity(): PersistentUserIdentity | null {
  try {
    const raw = localStorage.getItem(USER_IDENTITY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          name: typeof parsed.name === 'string' ? parsed.name : '',
          avatar: typeof parsed.avatar === 'string' && parsed.avatar ? parsed.avatar : '🌿',
          treatmentPreference: parsed.treatmentPreference || 'nao_informar'
        };
      }
    }
  } catch {}
  return null;
}

export function saveUserIdentity(identity: Partial<PersistentUserIdentity>): void {
  try {
    const existing = getSavedUserIdentity() || { name: '', avatar: '🌿', treatmentPreference: 'nao_informar' };
    const updated = {
      ...existing,
      ...(identity.name !== undefined ? { name: identity.name } : {}),
      ...(identity.avatar !== undefined ? { avatar: identity.avatar } : {}),
      ...(identity.treatmentPreference !== undefined ? { treatmentPreference: identity.treatmentPreference } : {})
    };
    localStorage.setItem(USER_IDENTITY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Erro ao salvar identidade permanente do usuário:', err);
  }
}

export function loadAppData(): AppData {
  try {
    // Purge old versions to ensure users get a completely fresh, zeroed start
    try {
      localStorage.removeItem(OLD_STORAGE_KEY_V1);
      localStorage.removeItem(OLD_STORAGE_KEY_V2);
    } catch {}

    const savedIdentity = getSavedUserIdentity();

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: AppData = {
        ...INITIAL_APP_DATA,
        user: {
          ...INITIAL_APP_DATA.user,
          ...(savedIdentity?.name ? { name: savedIdentity.name } : {}),
          ...(savedIdentity?.avatar ? { avatar: savedIdentity.avatar } : {}),
          ...(savedIdentity?.treatmentPreference ? { treatmentPreference: savedIdentity.treatmentPreference } : {})
        },
        unlockedAchievements: {}
      };
      saveAppData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as AppData;

    const userObj = { 
      ...INITIAL_APP_DATA.user, 
      ...parsed.user,
      ...(savedIdentity?.name && !parsed.user?.name ? { name: savedIdentity.name } : {}),
      ...(savedIdentity?.avatar && (!parsed.user?.avatar || parsed.user.avatar === '🌿') ? { avatar: savedIdentity.avatar } : {}),
      ...(savedIdentity?.treatmentPreference && (!parsed.user?.treatmentPreference || parsed.user.treatmentPreference === 'nao_informar') ? { treatmentPreference: savedIdentity.treatmentPreference } : {})
    };

    return {
      ...INITIAL_APP_DATA,
      ...parsed,
      user: userObj,
      tasks: parsed.tasks || [],
      habits: parsed.habits || [],
      hydration: parsed.hydration || {},
      meals: parsed.meals || {},
      groceries: parsed.groceries || [],
      movement: parsed.movement || [],
      sleep: parsed.sleep || {},
      selfCareList: parsed.selfCareList || DEFAULT_SELF_CARE_ACTIONS,
      selfCareCompleted: parsed.selfCareCompleted || {},
      checkIns: parsed.checkIns || {},
      journal: parsed.journal || {},
      memories: parsed.memories || [],
      prayers: parsed.prayers || [],
      devotionals: parsed.devotionals || [],
      singleMeals: parsed.singleMeals || [],
      sleepList: parsed.sleepList || [],
      fiveMinuteSessions: parsed.fiveMinuteSessions || [],
      favoriteVerses: parsed.favoriteVerses || [],
      goals: parsed.goals || [],
      bills: parsed.bills || [],
      incomes: parsed.incomes || [],
      cycle: parsed.cycle || INITIAL_APP_DATA.cycle,
      unlockedAchievements: parsed.unlockedAchievements || {},
      myLife: parsed.myLife ? {
        books: (Array.isArray(parsed.myLife.books) ? parsed.myLife.books : []).filter((i: any) => i && i.id !== 'book-1'),
        movies: (Array.isArray(parsed.myLife.movies) ? parsed.myLife.movies : []).filter((i: any) => i && i.id !== 'movie-1'),
        series: (Array.isArray(parsed.myLife.series) ? parsed.myLife.series : []).filter((i: any) => i && i.id !== 'series-1'),
        hobbies: (Array.isArray(parsed.myLife.hobbies) ? parsed.myLife.hobbies : []).filter((i: any) => i && i.id !== 'hobby-1' && i.id !== 'hobby-2'),
        places: (Array.isArray(parsed.myLife.places) ? parsed.myLife.places : []).filter((i: any) => i && i.id !== 'place-1'),
        dreams: (Array.isArray(parsed.myLife.dreams) ? parsed.myLife.dreams : []).filter((i: any) => i && i.id !== 'dream-1')
      } : INITIAL_APP_DATA.myLife
    };
  } catch (err) {
    console.error('Failed to parse saved AppData, using fallback', err);
    return INITIAL_APP_DATA;
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (data.user) {
      saveUserIdentity({
        name: data.user.name,
        avatar: data.user.avatar,
        treatmentPreference: data.user.treatmentPreference
      });
    }
  } catch (err) {
    console.error('Failed to save AppData to localStorage', err);
  }
}

export function exportDataAsJson(): void {
  const data = loadAppData();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `LEVE_backup_${getTodayDateString()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importDataFromJson(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed !== 'object' || !parsed) return false;
    saveAppData({
      ...INITIAL_APP_DATA,
      ...parsed
    });
    return true;
  } catch (e) {
    console.error('Invalid JSON import', e);
    return false;
  }
}

export function getPastDaysList(days: number): string[] {
  const result: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    result.push(`${year}-${month}-${day}`);
  }
  return result;
}

export const INITIAL_STATE = INITIAL_APP_DATA;
export const exportAppDataAsJson = exportDataAsJson;
export const importAppDataFromJson = importDataFromJson;

export function resetAllData(): void {
  try {
    localStorage.removeItem(OLD_STORAGE_KEY_V1);
    localStorage.removeItem(OLD_STORAGE_KEY_V2);
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  saveAppData({
    ...INITIAL_APP_DATA,
    unlockedAchievements: {}
  });
}
