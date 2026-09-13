import { 
  Sun, Calendar, Sprout, BookOpen, HeartHandshake, Target, 
  Droplets, Utensils, Activity, Moon, Heart, Receipt, 
  BarChart3, Sparkles, Film, LucideIcon, Zap, Shield,
  GraduationCap, Dumbbell
} from 'lucide-react';
import { ActiveTab } from '../context/AppContext';
import { normalizeTreatmentPreference } from './treatment';

export interface AppSectionDefinition {
  id: ActiveTab;
  label: string;
  description: string;
  group: 'principal' | 'wellness' | 'management';
  groupLabel: string;
  icon: LucideIcon;
  badge?: string;
  canHide: boolean;
}

export const APP_SECTIONS: AppSectionDefinition[] = [
  // Grupo Principal
  {
    id: 'my-day',
    label: 'Meu Dia',
    description: 'Rotina diária, hábitos prioritários, tarefas e foco do dia (tela inicial essencial).',
    group: 'principal',
    groupLabel: 'Principal',
    icon: Sun,
    canHide: false
  },
  {
    id: 'calendar',
    label: 'Calendário & Semana',
    description: 'Visão do mês, semanas e planejamento de compromissos futuros.',
    group: 'principal',
    groupLabel: 'Principal',
    icon: Calendar,
    canHide: true
  },
  {
    id: 'habits',
    label: 'Meus Hábitos',
    description: 'Acompanhamento de rotinas, consistência e frequência diária.',
    group: 'principal',
    groupLabel: 'Principal',
    icon: Sprout,
    canHide: true
  },
  {
    id: 'journal',
    label: 'Meu Caderno & Gratidão',
    description: 'Diário reflexivo, motivos de gratidão e memórias do coração.',
    group: 'principal',
    groupLabel: 'Principal',
    icon: BookOpen,
    canHide: true
  },
  {
    id: 'spirituality',
    label: 'Fé & Momento com Deus',
    description: 'Orações diárias, devocionais, versículos e 5 Minutos com Deus.',
    group: 'principal',
    groupLabel: 'Principal',
    icon: HeartHandshake,
    canHide: true
  },
  {
    id: 'goals',
    label: 'Minhas Metas',
    description: 'Objetivos pessoais, prazos e passos práticos para cada conquista.',
    group: 'principal',
    groupLabel: 'Principal',
    icon: Target,
    canHide: true
  },
  {
    id: 'studies',
    label: 'Caderno de Estudos',
    description: 'Matérias organizadas, documentos de estudo, resumos e anotações completas.',
    group: 'principal',
    groupLabel: 'Principal',
    icon: GraduationCap,
    canHide: true
  },
  {
    id: 'my-life',
    label: 'Entretenimento & Lazer',
    description: 'Livros, filmes, séries, hobbies, lugares para visitar e sonhos.',
    group: 'principal',
    groupLabel: 'Principal',
    icon: Film,
    canHide: true
  },
  {
    id: 'lia',
    label: 'LEVIA • Assistente',
    description: 'Assistente pessoal inteligente para organizar pensamentos e tarefas.',
    group: 'principal',
    groupLabel: 'Principal',
    icon: Sparkles,
    badge: 'VIP',
    canHide: true
  },

  // Grupo Corpo & Cuidado
  {
    id: 'hydration',
    label: 'Minha Água',
    description: 'Meta de ingestão de água, registros rápidos e hidratação.',
    group: 'wellness',
    groupLabel: 'Corpo & Cuidado',
    icon: Droplets,
    canHide: true
  },
  {
    id: 'nutrition',
    label: 'Alimentação & Compras',
    description: 'Registro de refeições leves e lista prática de compras de mercado.',
    group: 'wellness',
    groupLabel: 'Corpo & Cuidado',
    icon: Utensils,
    canHide: true
  },
  {
    id: 'movement',
    label: 'Registro de Atividades',
    description: 'Registro de caminhadas, corridas, passos e atividades físicas.',
    group: 'wellness',
    groupLabel: 'Corpo & Cuidado',
    icon: Activity,
    canHide: true
  },
  {
    id: 'workouts',
    label: 'Fichas de Treino',
    description: 'Fichas personalizadas, rotinas, exercícios de musculação, ballet e flexibilidade.',
    group: 'wellness',
    groupLabel: 'Corpo & Cuidado',
    icon: Dumbbell,
    canHide: true
  },
  {
    id: 'sleep',
    label: 'Meu Sono',
    description: 'Controle de sono, descanso noturno e avaliação da qualidade.',
    group: 'wellness',
    groupLabel: 'Corpo & Cuidado',
    icon: Moon,
    canHide: true
  },
  {
    id: 'self-care',
    label: 'Meu Autocuidado',
    description: 'Pequenas ações de carinho, pausas conscientes e bem-estar.',
    group: 'wellness',
    groupLabel: 'Corpo & Cuidado',
    icon: Heart,
    canHide: true
  },
  {
    id: 'cycle',
    label: 'Ciclo & Menstruação',
    description: 'Previsão de fases menstruais, registros de sintomas e humor.',
    group: 'wellness',
    groupLabel: 'Corpo & Cuidado',
    icon: Sparkles,
    canHide: true
  },

  // Grupo Controle & Avanço
  {
    id: 'bills',
    label: 'Contas & Pendências',
    description: 'Controle de despesas, contas a pagar e vencimentos do mês.',
    group: 'management',
    groupLabel: 'Controle & Avanço',
    icon: Receipt,
    canHide: true
  },
  {
    id: 'progress',
    label: 'Meu Progresso',
    description: 'Gráficos de evolução, consistência e conquistas desbloqueadas.',
    group: 'management',
    groupLabel: 'Controle & Avanço',
    icon: BarChart3,
    canHide: true
  }
];

export function isSectionHidden(
  id: ActiveTab, 
  hiddenSections?: string[], 
  treatmentPreference?: string | null
): boolean {
  // 'my-day' and 'settings' can never be hidden
  if (id === 'my-day' || id === 'settings') return false;

  // Se o usuário selecionou modo masculino, a seção de ciclo menstrual é sempre ocultada
  if (id === 'cycle' && normalizeTreatmentPreference(treatmentPreference) === 'masculino') {
    return true;
  }

  if (!hiddenSections || !Array.isArray(hiddenSections)) return false;
  return hiddenSections.includes(id);
}

/**
 * Retorna as seções disponíveis para personalização, adaptadas ao gênero do usuário.
 * Para homens, remove a seção de ciclo menstrual e ajusta títulos.
 */
export function getAvailableSections(treatmentPreference?: string | null): AppSectionDefinition[] {
  const pref = normalizeTreatmentPreference(treatmentPreference);
  const isMale = pref === 'masculino';

  return APP_SECTIONS
    .filter(sec => !(isMale && sec.id === 'cycle'))
    .map(sec => {
      if (isMale && sec.id === 'self-care') {
        return {
          ...sec,
          label: 'Recarga & Força',
          description: 'Pausas estratégicas, recarga de energia física, foco e alinhamento pessoal.',
          icon: Zap
        };
      }
      if (isMale && sec.id === 'spirituality') {
        return {
          ...sec,
          label: 'Fé & Oração',
          description: 'Orações diárias, leitura da Palavra e 5 Minutos com Deus.',
          icon: Shield
        };
      }
      if (isMale && sec.id === 'habits') {
        return {
          ...sec,
          label: 'Hábitos & Disciplina',
          description: 'Constância diária, hábitos prioritários e execução.',
          icon: Target
        };
      }
      if (isMale && sec.id === 'journal') {
        return {
          ...sec,
          label: 'Diário de Gratidão',
          description: 'Registro diário de gratidão, reflexão pessoal, conquistas e clareza mental.'
        };
      }
      return sec;
    });
}
