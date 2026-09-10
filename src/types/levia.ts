import { Priority, TaskCategory, HabitCategory, HabitTimeOfDay, GoalCategory, BillCategory } from './index';

export type LeviaActionType = 
  | 'create_task'
  | 'update_task'
  | 'complete_task'
  | 'create_habit'
  | 'create_goal'
  | 'create_bill'
  | 'add_my_life_book'
  | 'add_my_life_movie'
  | 'add_my_life_series'
  | 'add_my_life_hobby'
  | 'add_my_life_place'
  | 'add_my_life_dream';

export interface LeviaProposedAction {
  id: string;
  type: LeviaActionType;
  title: string;
  subtitle?: string;
  categoryBadge: 'Tarefa' | 'Hábito' | 'Meta' | 'Minha Vida' | 'Conta' | 'Compromisso';
  details?: {
    date?: string; // YYYY-MM-DD
    displayDate?: string;
    time?: string;
    priority?: Priority;
    isPriority?: boolean;
    category?: string;
    steps?: string[];
    amount?: number;
    author?: string;
    frequency?: string;
    status?: string;
  };
  payload: any;
  executed?: boolean;
}

export interface LeviaChatMessage {
  id: string;
  sender: 'user' | 'levia';
  text: string;
  timestamp: string;
  proposedActions?: LeviaProposedAction[];
  actionsExecuted?: boolean;
  actionsRejected?: boolean;
}
