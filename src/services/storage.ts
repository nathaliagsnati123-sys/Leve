import { AppData, Task, Habit, HydrationLog, MealLog, GroceryItem, MovementActivity, SleepLog, JournalEntry, Memory, Prayer, FiveMinuteGodSession, Goal, Bill, UserProfile } from '../types';
import { DEFAULT_SELF_CARE_ACTIONS } from './quotesAndVerses';

const STORAGE_KEY = 'leve_app_data_v1';

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
    name: 'Nathália',
    avatar: '🌿',
    accentColor: '#1F3A34',
    theme: 'light',
    hasCompletedOnboarding: false,
    dailyIntention: 'Ter mais calma e paciência comigo mesma 🕊️'
  },
  tasks: [
    {
      id: 't-1',
      title: 'Organizar documentos e papéis da semana',
      date: getTodayDateString(),
      time: '10:00',
      priority: 'high',
      category: 'Trabalho',
      repeat: 'none',
      completed: true,
      completedAt: new Date().toISOString()
    },
    {
      id: 't-2',
      title: 'Comprar frutas frescas e castanhas no mercado',
      date: getTodayDateString(),
      time: '14:30',
      priority: 'medium',
      category: 'Casa',
      repeat: 'none',
      completed: true,
      completedAt: new Date().toISOString()
    },
    {
      id: 't-3',
      title: 'Fazer 20 minutos de caminhada ao ar livre',
      date: getTodayDateString(),
      time: '17:00',
      priority: 'medium',
      category: 'Saúde',
      repeat: 'daily',
      completed: false
    },
    {
      id: 't-4',
      title: 'Ler 1 capítulo do livro com uma xícara de chá',
      date: getTodayDateString(),
      time: '20:30',
      priority: 'low',
      category: 'Pessoal',
      repeat: 'none',
      completed: false
    },
    {
      id: 't-5',
      title: 'Separar roupas para doação com carinho',
      date: getTodayDateString(),
      priority: 'low',
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
      history: {
        [getTodayDateString()]: true
      }
    },
    {
      id: 'h-2',
      name: 'Momentos de oração e silêncio',
      icon: '🙏',
      frequency: 'daily',
      targetDaysPerWeek: 7,
      category: 'Espiritualidade',
      createdAt: getTodayDateString(),
      history: {
        [getTodayDateString()]: true
      }
    },
    {
      id: 'h-3',
      name: 'Caminhada ou alongamento',
      icon: '🏃',
      frequency: 'daily',
      targetDaysPerWeek: 5,
      category: 'Saúde',
      createdAt: getTodayDateString(),
      history: {
        [getTodayDateString()]: false
      }
    },
    {
      id: 'h-4',
      name: 'Ler 10 páginas com calma',
      icon: '📖',
      frequency: 'daily',
      targetDaysPerWeek: 6,
      category: 'Pessoal',
      createdAt: getTodayDateString(),
      history: {
        [getTodayDateString()]: true
      }
    },
    {
      id: 'h-5',
      name: 'Desconectar do celular às 22h',
      icon: '🌙',
      frequency: 'daily',
      targetDaysPerWeek: 7,
      category: 'Autocuidado',
      createdAt: getTodayDateString(),
      history: {
        [getTodayDateString()]: false
      }
    }
  ],
  hydration: {
    [getTodayDateString()]: {
      date: getTodayDateString(),
      amountMl: 1400,
      targetMl: 2000,
      cupSizeMl: 300,
      logs: [
        { time: '08:15', amount: 300 },
        { time: '10:30', amount: 300 },
        { time: '12:45', amount: 500 },
        { time: '15:10', amount: 300 }
      ]
    }
  },
  meals: {
    [getTodayDateString()]: {
      date: getTodayDateString(),
      breakfast: { checked: true, description: 'Ovos mexidos, torrada integral e café fresco' },
      lunch: { checked: true, description: 'Arroz, feijão, frango grelhado e salada colorida' },
      snack: { checked: false, description: 'Fruta com iogurte' },
      dinner: { checked: false, description: '' },
      rating: 'bem',
      reflection: 'Mastiguei com calma e bebi água antes das refeições.'
    }
  },
  groceries: [
    { id: 'g-1', name: 'Maçãs e bananas', category: 'Frutas e Verduras', completed: true, quantity: '1kg' },
    { id: 'g-2', name: 'Espinafre e rúcula', category: 'Frutas e Verduras', completed: false, quantity: '2 maços' },
    { id: 'g-3', name: 'Leite vegetal de amêndoas', category: 'Laticínios', completed: true, quantity: '1L' },
    { id: 'g-4', name: 'Ovos caipiras', category: 'Proteínas', completed: false, quantity: '1 dúzia' },
    { id: 'g-5', name: 'Azeite de oliva extravirgem', category: 'Básicos', completed: false }
  ],
  movement: [
    {
      id: 'm-1',
      date: getTodayDateString(),
      type: 'Caminhada',
      durationMinutes: 30,
      notes: 'Caminhada tranquila respirando ar puro no parque.'
    }
  ],
  sleep: {
    [getTodayDateString()]: {
      date: getTodayDateString(),
      bedTime: '23:15',
      wakeTime: '07:00',
      durationHours: 7.75,
      rating: 'bem',
      notes: 'Dormi profundamente após ler um pouco.'
    }
  },
  selfCareList: DEFAULT_SELF_CARE_ACTIONS,
  selfCareCompleted: {
    [getTodayDateString()]: ['sc-1', 'sc-2', 'sc-4']
  },
  checkIns: {
    [getTodayDateString()]: {
      date: getTodayDateString(),
      mood: 'bem',
      needs: ['Me organizar', 'Ter um momento de paz', 'Cuidar de mim'],
      note: 'Me sentindo animada para colocar a semana em ordem sem pressa.'
    }
  },
  journal: {
    [getTodayDateString()]: {
      date: getTodayDateString(),
      gratitude: [
        'A brisa fresca que entra pela janela pela manhã',
        'Uma conversa acolhedora que tive hoje',
        'Poder ter uma alimentação saudável e nutritiva'
      ],
      goodThings: [
        'Consegui terminar uma tarefa que estava adiando',
        'Preparei uma refeição com muito carinho',
        'Tirei 15 minutos de silêncio para respirar'
      ],
      specialMoment: 'Um café quentinho no meio da tarde apreciando o silêncio.',
      doneForMe: 'Tomei um banho relaxante sem pressa e passei hidratante na pele.',
      mindDump: 'Preciso confiar mais no processo. As coisas vão se ajeitando um passo por vez.',
      mood: '🙂 Bem'
    }
  },
  memories: [
    {
      id: 'mem-1',
      title: 'Café da manhã na varanda',
      text: 'Hoje o dia amanheceu ensolarado e tranquilo. Sentei para tomar café ouvindo os passarinhos e senti uma paz imensa.',
      date: getTodayDateString()
    }
  ],
  prayers: [
    {
      id: 'p-1',
      date: getTodayDateString(),
      content: 'Senhor, abençoe a minha família, acalme o meu coração diante das incertezas e me dê sabedoria para conduzir este dia com serenidade e fé.',
      category: 'família',
      answered: false
    }
  ],
  devotionals: [],
  singleMeals: [],
  sleepList: [],
  fiveMinuteSessions: [],
  favoriteVerses: ['verse-1', 'verse-2'],
  goals: [
    {
      id: 'goal-1',
      name: 'Criar uma rotina matinal leve e consciente',
      description: 'Acordar 30 minutos antes para respirar, orar e começar o dia sem telas.',
      category: 'Autocuidado',
      deadline: '2026-10-30',
      completed: false,
      steps: [
        { id: 's-1', title: 'Deixar o celular fora do alcance da cama', completed: true },
        { id: 's-2', title: 'Beber 1 copo grande de água logo ao acordar', completed: true },
        { id: 's-3', title: 'Fazer 5 minutos de oração ou silêncio', completed: true },
        { id: 's-4', title: 'Tomar café sentada à mesa sem pressa', completed: false }
      ]
    },
    {
      id: 'goal-2',
      name: 'Organizar finanças e poupar com tranquilidade',
      description: 'Registrar todas as despesas e manter um fundo de paz de espírito.',
      category: 'Financeiro',
      deadline: '2026-12-31',
      completed: false,
      steps: [
        { id: 's-2-1', title: 'Cadastrar todas as contas fixas no aplicativo', completed: true },
        { id: 's-2-2', title: 'Definir teto semanal para compras supérfluas', completed: false },
        { id: 's-2-3', title: 'Guardar 10% de reserva no início do mês', completed: false }
      ]
    }
  ],
  bills: [
    {
      id: 'b-1',
      name: 'Internet Fibra',
      amount: 119.90,
      dueDate: getTodayDateString(),
      category: 'Casa',
      status: 'pendente'
    },
    {
      id: 'b-2',
      name: 'Energia Elétrica',
      amount: 145.50,
      dueDate: '2026-09-15',
      category: 'Casa',
      status: 'pendente'
    },
    {
      id: 'b-3',
      name: 'Curso de Especialização',
      amount: 180.00,
      dueDate: '2026-09-02',
      category: 'Estudos',
      status: 'paga',
      paid: true
    }
  ],
  incomes: [
    {
      id: 'inc-1',
      description: 'Salário Mensal',
      amount: 3200.00,
      date: getTodayDateString(),
      category: 'Salário',
      received: true,
      notes: 'Depósito em conta corrente'
    },
    {
      id: 'inc-2',
      description: 'Projeto Freelance',
      amount: 650.00,
      date: '2026-09-15',
      category: 'Freelance / Serviços',
      received: false,
      notes: 'Previsão de entrega do projeto'
    }
  ],
  cycle: {
    averageCycleLength: 28,
    averagePeriodLength: 5,
    periods: [
      {
        id: 'period-1',
        startDate: '2026-08-12',
        endDate: '2026-08-16',
        flow: 'moderado',
        notes: 'Ciclo calmo com cólica leve no 1º dia.'
      }
    ],
    dailyLogs: {
      '2026-09-03': {
        date: '2026-09-03',
        symptoms: ['Disposição boa'],
        mood: ['Tranquila', 'Focada'],
        energyLevel: 4,
        notes: 'Dia produtivo e com mente calma.'
      }
    }
  },
  unlockedAchievements: {
    first_task: new Date().toISOString(),
    first_habit: new Date().toISOString(),
    first_prayer: new Date().toISOString(),
    first_gratitude: new Date().toISOString()
  }
};

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveAppData(INITIAL_APP_DATA);
      return INITIAL_APP_DATA;
    }
    const parsed = JSON.parse(raw) as AppData;
    // Ensure all critical top-level properties exist
    return {
      ...INITIAL_APP_DATA,
      ...parsed,
      user: { ...INITIAL_APP_DATA.user, ...parsed.user },
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
      incomes: parsed.incomes || INITIAL_APP_DATA.incomes || [],
      cycle: parsed.cycle || INITIAL_APP_DATA.cycle || {
        averageCycleLength: 28,
        averagePeriodLength: 5,
        periods: [],
        dailyLogs: {}
      },
      unlockedAchievements: parsed.unlockedAchievements || {}
    };
  } catch (err) {
    console.error('Failed to parse saved AppData, using fallback', err);
    return INITIAL_APP_DATA;
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
  localStorage.removeItem(STORAGE_KEY);
  saveAppData(INITIAL_APP_DATA);
}
