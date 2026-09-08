import { AppData } from '../types';
import { LeviaProposedAction, LeviaChatMessage } from '../types/levia';
import { processLeviaInputLocally, LeviaProcessResult } from './leviaEngine';

export async function askLevia(
  message: string,
  appData: AppData,
  pendingActions?: LeviaProposedAction[]
): Promise<LeviaProcessResult> {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  // Se o usuário estiver apenas confirmando ou cancelando ações pendentes,
  // processamos de forma imediata e determinística
  const confirmationWords = [
    'sim', 'pode salvar', 'salvar', 'salve', 'confirmo', 'confirmar', 'pode ser', 
    'com certeza', 'quero', 'por favor', 'salva', 'ótimo', 'maravilha', 'perfeito',
    'pode organizar', 'organize', 'gravar', 'claro'
  ];
  const rejectionWords = ['não', 'nao', 'cancela', 'cancelar', 'não salva', 'nao salva', 'descarte', 'deixa pra lá', 'esquece'];

  const isConfirm = confirmationWords.some((w) => lower === w || lower.startsWith(w + ' '));
  const isReject = rejectionWords.some((w) => lower === w || lower.startsWith(w + ' '));

  if ((isConfirm || isReject) && pendingActions && pendingActions.length > 0) {
    return processLeviaInputLocally(message, appData, pendingActions);
  }

  // Tenta chamar o servidor com Gemini 3.8 Flash
  try {
    const response = await fetch('/api/levia/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        contextData: {
          user: appData.user,
          taskCount: appData.tasks.length,
          habitCount: appData.habits.length
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (!data.fallbackToLocal && (data.reply || (data.proposedActions && data.proposedActions.length > 0))) {
        return {
          reply: data.reply || 'Aqui está o que posso organizar:',
          proposedActions: data.proposedActions || []
        };
      }
    }
  } catch (err) {
    console.warn('LEVIA: falha na rota de IA do servidor, acionando motor inteligente local:', err);
  }

  // Fallback para o motor local
  return processLeviaInputLocally(message, appData, pendingActions);
}

/**
 * Executa as ações propostas e aprovadas pelo usuário no LEVE
 */
export function executeProposedActions(
  actions: LeviaProposedAction[],
  contextActions: {
    addTask: (task: any) => void;
    toggleTask: (id: string) => void;
    addHabit: (habit: any) => void;
    addGoal: (goal: any) => void;
    addBill: (bill: any) => void;
    addMyLifeBook: (book: any) => void;
    addMyLifeMovie: (movie: any) => void;
    addMyLifeSeries: (series: any) => void;
    addMyLifeHobby: (hobby: any) => void;
    addMyLifePlace: (place: any) => void;
    addMyLifeDream: (dream: any) => void;
    showToast: (msg: string, type?: 'success' | 'info' | 'gentle') => void;
  }
): number {
  let executedCount = 0;

  for (const act of actions) {
    try {
      switch (act.type) {
        case 'create_task':
          contextActions.addTask({
            title: act.payload.title || act.title,
            date: act.payload.date || new Date().toISOString().split('T')[0],
            time: act.payload.time || undefined,
            priority: act.payload.priority || 'medium',
            category: act.payload.category || 'Pessoal',
            repeat: act.payload.repeat || 'none',
            notes: act.payload.notes || 'Organizado pela LEVIA'
          });
          executedCount++;
          break;

        case 'complete_task':
          if (act.payload.taskId) {
            contextActions.toggleTask(act.payload.taskId);
            executedCount++;
          }
          break;

        case 'create_habit':
          contextActions.addHabit({
            name: act.payload.name || act.title,
            icon: act.payload.icon || '🌱',
            category: act.payload.category || 'Saúde',
            frequency: act.payload.frequency || 'daily',
            targetDaysPerWeek: act.payload.targetDaysPerWeek || 7,
            timeOfDay: act.payload.timeOfDay || 'anytime',
            motivation: act.payload.motivation || 'Organizado pela LEVIA'
          });
          executedCount++;
          break;

        case 'create_goal':
          contextActions.addGoal({
            name: act.payload.name || act.title,
            category: act.payload.category || 'Projetos pessoais',
            targetDate: act.payload.targetDate || undefined,
            description: act.payload.description || 'Meta organizada pela LEVIA',
            steps: act.payload.steps || [
              { id: 'st-1', title: 'Primeiro passo prático', completed: false }
            ]
          });
          executedCount++;
          break;

        case 'create_bill':
          contextActions.addBill({
            name: act.payload.name || act.title,
            amount: Number(act.payload.amount) || 0,
            dueDate: act.payload.dueDate || new Date().toISOString().split('T')[0],
            category: act.payload.category || 'Contas básicas',
            status: act.payload.status || 'pendente'
          });
          executedCount++;
          break;

        case 'add_my_life_book':
          contextActions.addMyLifeBook({
            title: act.payload.title || act.title,
            author: act.payload.author || '',
            status: act.payload.status || 'want_to_read',
            favorite: false,
            notes: act.payload.notes || 'Adicionado via LEVIA'
          });
          executedCount++;
          break;

        case 'add_my_life_movie':
          contextActions.addMyLifeMovie({
            title: act.payload.title || act.title,
            year: act.payload.year || '',
            genre: act.payload.genre || '',
            status: act.payload.status || 'want_to_watch',
            favorite: false
          });
          executedCount++;
          break;

        case 'add_my_life_series':
          contextActions.addMyLifeSeries({
            name: act.payload.name || act.payload.title || act.title,
            status: act.payload.status || 'want_to_watch',
            favorite: false
          });
          executedCount++;
          break;

        case 'add_my_life_hobby':
          contextActions.addMyLifeHobby({
            name: act.payload.name || act.title,
            status: act.payload.status || 'wishlist',
            favorite: false
          });
          executedCount++;
          break;

        case 'add_my_life_place':
          contextActions.addMyLifePlace({
            name: act.payload.name || act.title,
            status: act.payload.status || 'want_to_visit',
            favorite: false
          });
          executedCount++;
          break;

        case 'add_my_life_dream':
          contextActions.addMyLifeDream({
            title: act.payload.title || act.title,
            status: act.payload.status || 'want_to_realize',
            favorite: false
          });
          executedCount++;
          break;
      }
    } catch (e) {
      console.error('Erro ao executar ação da LEVIA:', e);
    }
  }

  if (executedCount > 0) {
    contextActions.showToast(`${executedCount} item(ns) salvo(s) no seu LEVE! 🌿`, 'success');
  }

  return executedCount;
}
