export type Priority = 'low' | 'medium' | 'high';

export type TaskCategory = 
  | 'Estudos'
  | 'Trabalho'
  | 'Casa'
  | 'Pessoal'
  | 'Saúde'
  | 'Financeiro'
  | 'Família'
  | 'Outros'
  | string;

export type TaskRepeat = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  priority: Priority;
  isPriority?: boolean; // Somente quando marcado explicitamente aparece em Prioridades
  category: TaskCategory;
  repeat: TaskRepeat;
  completed: boolean;
  completedAt?: string;
  goalId?: string;
  notes?: string;
}

export type HabitCategory = 
  | 'Saúde' 
  | 'Espiritualidade' 
  | 'Autocuidado' 
  | 'Casa' 
  | 'Mente' 
  | 'Trabalho' 
  | 'Outros' 
  | string;

export type HabitTimeOfDay = 'morning' | 'afternoon' | 'night' | 'anytime';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  category: HabitCategory;
  frequency: 'daily' | 'weekdays' | 'weekends' | 'custom';
  targetDaysPerWeek: number;
  timeOfDay?: HabitTimeOfDay;
  motivation?: string;
  createdAt: string;
  history: Record<string, boolean>; // date string -> completed
}

export interface HydrationLog {
  date: string; // YYYY-MM-DD
  amountMl: number;
  targetMl: number;
  cupSizeMl: number;
  logs: { time: string; amount: number }[];
}

export type MealCategory = 
  | 'Café da manhã' 
  | 'Almoço' 
  | 'Lanche' 
  | 'Jantar' 
  | 'Ceia / Outro' 
  | string;

export interface SingleMealEntry {
  id: string;
  date: string;
  category: MealCategory;
  description: string;
  howIFelt?: string;
}

export interface MealLog {
  date: string;
  breakfast: { checked: boolean; description: string };
  lunch: { checked: boolean; description: string };
  snack: { checked: boolean; description: string };
  dinner: { checked: boolean; description: string };
  rating?: 'muito_bem' | 'bem' | 'mais_ou_menos' | 'poderia_melhorar';
  reflection?: string;
}

export type GroceryCategory = 
  | 'Hortifruti' 
  | 'Mercearia' 
  | 'Geladeira & Laticínios' 
  | 'Proteínas' 
  | 'Padaria' 
  | 'Limpeza & Casa' 
  | 'Frutas e Verduras'
  | 'Laticínios'
  | 'Básicos'
  | 'Casa'
  | 'Outros' 
  | string;

export interface GroceryItem {
  id: string;
  name: string;
  category: GroceryCategory;
  completed: boolean;
  quantity?: string;
}

export type MovementActivityType = 
  | 'Caminhada' 
  | 'Corrida' 
  | 'Musculação / Treino' 
  | 'Academia'
  | 'Alongamento' 
  | 'Pilates / Yoga' 
  | 'Dança' 
  | 'Bicicleta' 
  | 'Esporte' 
  | 'Outro' 
  | string;

export type MovementFeeling = 
  | 'Renovada e com energia' 
  | 'Disposta' 
  | 'Cansada mas feliz' 
  | 'Relaxada' 
  | string;

export interface MovementActivity {
  id: string;
  date: string;
  activity?: MovementActivityType;
  type?: MovementActivityType;
  durationMinutes: number;
  feeling?: MovementFeeling;
  notes?: string;
}

export type SleepQuality = 
  | 'Descansada e disposta' 
  | 'Sono picado / acordei algumas vezes' 
  | 'Cansada / precisava de mais' 
  | string;

export interface SleepLog {
  id?: string;
  date: string; // night of this date
  bedtime?: string;
  wakeTime?: string;
  bedTime?: string; // HH:mm
  hours?: number;
  durationHours?: number;
  quality?: SleepQuality;
  rating?: 'muito_mal' | 'mal' | 'normal' | 'bem' | 'muito_bem';
  notes?: string;
}

export interface SelfCareAction {
  id: string;
  title: string;
  category?: string;
  isCustom?: boolean;
}

export interface EmotionalCheckIn {
  date: string;
  mood: 'muito_bem' | 'bem' | 'normal' | 'sobrecarregada' | 'exausta';
  needs: string[];
  note?: string;
}

export interface JournalEntry {
  date: string; // YYYY-MM-DD
  gratitude: string[];
  goodThings: string[];
  specialMoment?: string;
  doneForMe?: string;
  mindDump?: string;
  dayInOneWord?: string;
  mood?: string;
  dailyQuestionAnswer?: {
    question: string;
    answer: string;
  };
}

export interface Memory {
  id: string;
  title: string;
  text: string;
  date: string;
  imageUrl?: string;
}

export type PrayerCategory = 
  | 'Família' 
  | 'Saúde' 
  | 'Gratidão' 
  | 'Decisão' 
  | 'Paz' 
  | 'Trabalho' 
  | 'agradecimento' 
  | 'família' 
  | 'trabalho' 
  | 'estudos' 
  | 'sonhos' 
  | 'dificuldades' 
  | 'pessoas' 
  | 'pedidos' 
  | 'Outros' 
  | string;

export interface Prayer {
  id: string;
  date: string;
  content: string;
  category: PrayerCategory;
  answered?: boolean;
  answeredDate?: string;
  testimony?: string;
}

export interface Devotional {
  id: string;
  date: string;
  passage: string;
  whatILearned: string;
  howToApply: string;
}

export interface FiveMinuteGodSession {
  id: string;
  date: string;
  gratitude: string;
  surrender: string;
  petition: string;
  scriptureReference: string;
  reflection: string;
}

export interface ScriptureVerse {
  id: string;
  reference: string;
  verse: string;
  reflection: string;
  theme: string;
}

export interface GoalStep {
  id: string;
  title: string;
  completed: boolean;
}

export type GoalCategory = 
  | 'Espiritualidade' 
  | 'Saúde e corpo' 
  | 'Estudos e mente' 
  | 'Finanças' 
  | 'Casa e rotina' 
  | 'Relacionamentos' 
  | 'Projetos pessoais' 
  | string;

export interface Goal {
  id: string;
  name: string;
  description?: string;
  deadline?: string;
  targetDate?: string;
  category: GoalCategory;
  motivation?: string;
  status?: 'in-progress' | 'paused' | 'completed';
  steps: GoalStep[];
  completed: boolean;
}

export type BillCategory = 
  | 'Moradia' 
  | 'Contas básicas' 
  | 'Cartão / Bancos' 
  | 'Assinaturas / Lazer' 
  | 'Educação' 
  | 'Saúde' 
  | 'Casa' 
  | 'Estudos' 
  | 'Outros' 
  | string;

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  category: BillCategory;
  status: 'vencida' | 'pendente' | 'paga';
  paid?: boolean;
}

export type IncomeCategory = 
  | 'Salário' 
  | 'Freelance / Serviços' 
  | 'Vendas' 
  | 'Renda Extra' 
  | 'Investimentos / Rendimentos' 
  | 'Presente / Benefício' 
  | 'Outros' 
  | string;

export interface Income {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: IncomeCategory;
  received: boolean;
  notes?: string;
}

export type FlowIntensity = 'spotting' | 'leve' | 'moderado' | 'intenso';

export interface MenstrualPeriod {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  flow: FlowIntensity;
  notes?: string;
}

export interface CycleDailyLog {
  date: string; // YYYY-MM-DD
  isPeriodDay?: boolean;
  flow?: FlowIntensity;
  symptoms: string[];
  mood: string[];
  energyLevel?: number; // 1 to 5
  notes?: string;
}

export interface MenstrualCycleData {
  averageCycleLength: number; // default 28
  averagePeriodLength: number; // default 5
  periods: MenstrualPeriod[];
  dailyLogs: Record<string, CycleDailyLog>; // date -> log
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export type TreatmentPreference = 'feminino' | 'masculino' | 'neutro' | 'nao_informar';

export interface UserProfile {
  name: string;
  avatar: string;
  accentColor: string;
  theme: 'light' | 'dark' | 'auto' | 'system';
  hasCompletedOnboarding: boolean;
  dailyIntention?: string;
  lastClosedDay?: string;
  treatmentPreference?: TreatmentPreference;
}

export interface UserStats {
  streakDays: number;
  tasksCompletedCount: number;
}

export interface AppData {
  user: UserProfile;
  tasks: Task[];
  habits: Habit[];
  hydration: Record<string, HydrationLog>;
  meals: Record<string, MealLog>;
  singleMeals?: SingleMealEntry[];
  groceries: GroceryItem[];
  movement: MovementActivity[];
  sleep: Record<string, SleepLog>;
  sleepList?: SleepLog[];
  selfCareList: SelfCareAction[];
  selfCareCompleted: Record<string, string[]>; // date -> actionIds
  checkIns: Record<string, EmotionalCheckIn>;
  journal: Record<string, JournalEntry>;
  memories: Memory[];
  prayers: Prayer[];
  devotionals?: Devotional[];
  fiveMinuteSessions: FiveMinuteGodSession[];
  favoriteVerses: string[]; // verse IDs
  goals: Goal[];
  bills: Bill[];
  incomes?: Income[];
  cycle?: MenstrualCycleData;
  unlockedAchievements: Record<string, string>; // achievementId -> unlockedAt ISO
  myLife?: MyLifeData;
}

// --------------------------------------------------------
// Minha Vida (My Life) Types
// --------------------------------------------------------

export type BookStatus = 'want_to_read' | 'reading' | 'read';

export interface MyLifeBook {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  status: BookStatus;
  rating?: number; // 1 to 5
  notes?: string;
  favorite: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type MovieStatus = 'want_to_watch' | 'watched';

export interface MyLifeMovie {
  id: string;
  title: string;
  year?: string;
  genre?: string;
  coverUrl?: string;
  status: MovieStatus;
  rating?: number; // 1 to 5
  notes?: string;
  favorite: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type SeriesStatus = 'want_to_watch' | 'watching' | 'finished' | 'paused';

export interface MyLifeSeries {
  id: string;
  name: string;
  title?: string;
  seasons?: string;
  coverUrl?: string;
  status: SeriesStatus;
  rating?: number; // 1 to 5
  notes?: string;
  favorite: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type HobbyStatus = 'current' | 'wishlist';

export interface MyLifeHobby {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  accentColor?: string;
  goal?: string;
  status: HobbyStatus;
  favorite: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type PlaceStatus = 'want_to_visit' | 'visited';

export interface MyLifePlace {
  id: string;
  name: string;
  city?: string;
  country?: string;
  coverUrl?: string;
  notes?: string;
  status: PlaceStatus;
  favorite: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type DreamStatus = 'want_to_realize' | 'in_progress' | 'completed';

export interface MyLifeDream {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  nextStep?: string;
  status: DreamStatus;
  favorite: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface MyLifeData {
  books: MyLifeBook[];
  movies: MyLifeMovie[];
  series: MyLifeSeries[];
  hobbies: MyLifeHobby[];
  places: MyLifePlace[];
  dreams: MyLifeDream[];
}

export type MyLifeCategory = 
  | 'books' 
  | 'movies' 
  | 'series' 
  | 'hobbies' 
  | 'places' 
  | 'dreams' 
  | 'favorites';

// Structure prepared for future Levia integration
export interface LeviaMyLifeAction {
  action: 'add' | 'update' | 'delete';
  category: 'books' | 'movies' | 'series' | 'hobbies' | 'places' | 'dreams';
  item: Partial<MyLifeBook & MyLifeMovie & MyLifeSeries & MyLifeHobby & MyLifePlace & MyLifeDream>;
  requiresConfirmation: boolean;
  confirmationMessage?: string;
}
