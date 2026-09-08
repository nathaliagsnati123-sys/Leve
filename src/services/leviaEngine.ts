import { AppData, Task, Habit, Goal, TreatmentPreference } from '../types';
import { LeviaProposedAction, LeviaChatMessage } from '../types/levia';

// Helper to calculate relative dates based on current day
export function getRelativeDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getNextWeekdayDate(targetWeekday: number): string {
  // 0: Domingo, 1: Segunda, 2: Terça, 3: Quarta, 4: Quinta, 5: Sexta, 6: Sábado
  const d = new Date();
  const currentDay = d.getDay();
  let distance = targetWeekday - currentDay;
  if (distance <= 0) {
    distance += 7;
  }
  d.setDate(d.getDate() + distance);
  return d.toISOString().split('T')[0];
}

export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return 'Sem data';
  const today = getTodayDate();
  const tomorrow = getRelativeDate(1);
  if (dateStr === today) return 'Hoje';
  if (dateStr === tomorrow) return 'Amanhã';

  try {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
}

export interface LeviaProcessResult {
  reply: string;
  proposedActions?: LeviaProposedAction[];
  isConfirmation?: boolean;
  isRejection?: boolean;
}

/**
 * Motor inteligente da LEVIA para interpretação em linguagem natural (PT-BR),
 * garantindo alinhamento ao conceito: "Você fala. A LEVIA organiza."
 */
export function processLeviaInputLocally(
  userInput: string,
  appData: AppData,
  pendingActions?: LeviaProposedAction[]
): LeviaProcessResult {
  const trimmed = userInput.trim();
  const lower = trimmed.toLowerCase();

  // 1. Tratamento e Saudação respeitosa
  const treatment: TreatmentPreference = appData.user?.treatmentPreference || 'nao_informar';
  const userName = appData.user?.name ? appData.user.name.split(' ')[0] : '';

  // 2. Detecção de confirmação pelo usuário (ex: "sim", "pode salvar", "salvar", "confirmo", "salve", "ok", "quero")
  const confirmationWords = [
    'sim', 'pode salvar', 'salvar', 'salve', 'confirmo', 'confirmar', 'pode ser', 
    'com certeza', 'quero', 'por favor', 'salva', 'ótimo', 'maravilha', 'perfeito',
    'pode organizar', 'organize', 'gravar', 'claro'
  ];
  
  const isDirectConfirmation = confirmationWords.some((w) => 
    lower === w || lower.startsWith(w + ' ') || lower.endsWith(' ' + w) || lower === 'sim!' || lower === 'salvar!'
  );

  if (isDirectConfirmation && pendingActions && pendingActions.length > 0) {
    return {
      reply: `Tudo pronto! Seus itens foram organizados e salvos no LEVE com sucesso. 🌿\n\nVocê já pode vê-los no seu dia a dia. Se tiver mais pensamentos para descarregar, estou por aqui!`,
      isConfirmation: true
    };
  }

  // 3. Detecção de recusa/cancelamento
  const rejectionWords = ['não', 'nao', 'cancela', 'cancelar', 'não salva', 'nao salva', 'descarte', 'deixa pra lá', 'esquece'];
  const isDirectRejection = rejectionWords.some((w) => lower === w || lower.startsWith(w + ' '));

  if (isDirectRejection && pendingActions && pendingActions.length > 0) {
    return {
      reply: `Tudo bem! Cancelei e não salvei nenhuma alteração. Quando quiser tentar novamente ou mudar alguma coisa, só me falar.`,
      isRejection: true
    };
  }

  // 4. Pedido de consulta ou organização de "Meu Dia" / Prioridades
  if (
    lower.includes('meu dia') || 
    lower.includes('o que tenho para fazer') || 
    lower.includes('minhas prioridades') || 
    lower.includes('o que preciso fazer hoje') ||
    lower.includes('como está meu dia') ||
    lower.includes('organizar meu dia')
  ) {
    const today = getTodayDate();
    const todayTasks = appData.tasks.filter((t) => !t.completed && (t.date === today || !t.date));
    const highPriority = todayTasks.filter((t) => t.priority === 'high');
    const otherTasks = todayTasks.filter((t) => t.priority !== 'high');

    if (todayTasks.length === 0) {
      return {
        reply: `Seu dia está livre de tarefas pendentes no momento! ☀️\n\nQue tal aproveitar para focar em autocuidado, dar um passo em alguma meta ou descansar a mente? Se quiser registrar o que tem em mente, basta me falar.`
      };
    }

    let replyText = `Aqui está uma visão clara para o seu dia, sem sobrecarga:\n\n`;
    replyText += `🎯 **Suas prioridades principais (foco primeiro nestas):**\n`;
    
    const topThree = [...highPriority, ...otherTasks].slice(0, 3);
    topThree.forEach((t, i) => {
      const timeInfo = t.time ? ` às ${t.time}` : '';
      replyText += `${i + 1}. **${t.title}**${timeInfo} (${t.category})\n`;
    });

    const remaining = todayTasks.length - topThree.length;
    if (remaining > 0) {
      replyText += `\nVocê ainda tem outras ${remaining} tarefa(s) registrada(s). Respire fundo: termine essas 3 primeiro com tranquilidade antes de olhar para as outras.`;
    } else {
      replyText += `\nCom apenas essas tarefas, seu dia fica leve e possível de cumprir. Um passo de cada vez!`;
    }

    return { reply: replyText };
  }

  // 5. Verificação de Conclusão de Tarefa
  if (
    lower.startsWith('concluí ') || 
    lower.startsWith('conclui ') || 
    lower.startsWith('terminei ') || 
    lower.startsWith('feita ') ||
    lower.startsWith('finalizei ') ||
    lower.includes('marcar como concluída')
  ) {
    const query = lower
      .replace(/^(concluí|conclui|terminei|feita|finalizei|marcar como concluída|marcar como feita)\s*(a|o)?\s*/i, '')
      .replace(/tarefa/i, '')
      .trim();

    if (query) {
      const matchedTask = appData.tasks.find(
        (t) => !t.completed && t.title.toLowerCase().includes(query)
      );

      if (matchedTask) {
        const action: LeviaProposedAction = {
          id: `act-${Date.now()}-complete`,
          type: 'complete_task',
          title: `Concluir tarefa: "${matchedTask.title}"`,
          categoryBadge: 'Tarefa',
          details: {
            date: matchedTask.date,
            displayDate: formatDateBR(matchedTask.date),
            priority: matchedTask.priority,
            category: matchedTask.category
          },
          payload: { taskId: matchedTask.id }
        };

        return {
          reply: `Parabéns pelo progresso! Encontrei a tarefa:\n• **${matchedTask.title}** (${matchedTask.category})\n\nQuer que eu marque como concluída no seu LEVE?`,
          proposedActions: [action]
        };
      }
    }
  }

  // 6. Extração estruturada de múltiplos itens (Brain Dump / Tarefas / Hábitos / Metas / Minha Vida)
  const actions: LeviaProposedAction[] = [];

  // 6.1. Minha Vida: Livros
  // Ex: "Quero começar a ler Harry Potter", "Livro para ler: O Pequeno Príncipe"
  const bookRegex = /(?:ler|leitura|livro(?: para ler)?)\s+(?:o livro\s+)?([A-Z0-9À-Úa-z0-9\s'":.-]+?)(?=(?:,\s*|\.\s*|;\s*|\be\s+também|\be\s+quero|$))/i;
  const bookMatch = trimmed.match(bookRegex);
  if (bookMatch && !lower.includes('tenho que ler para a faculdade') && !lower.includes('estudar')) {
    const rawTitle = bookMatch[1].replace(/^(começar a ler|aquele|um)\s+/i, '').trim();
    if (rawTitle.length >= 3 && !['aquele livro', 'um livro', 'o livro'].includes(rawTitle.toLowerCase())) {
      actions.push({
        id: `act-${Date.now()}-book`,
        type: 'add_my_life_book',
        title: rawTitle,
        categoryBadge: 'Minha Vida',
        details: {
          category: 'Livros',
          status: 'Quero ler'
        },
        payload: {
          title: rawTitle,
          author: '',
          status: 'want_to_read',
          favorite: false
        }
      });
    } else if (['aquele livro', 'o livro', 'livro'].includes(rawTitle.toLowerCase())) {
      actions.push({
        id: `act-${Date.now()}-book`,
        type: 'add_my_life_book',
        title: 'Leitura desejada',
        categoryBadge: 'Minha Vida',
        details: {
          category: 'Livros',
          status: 'Quero ler'
        },
        payload: {
          title: 'Leitura desejada',
          author: '',
          status: 'want_to_read',
          favorite: false
        }
      });
    }
  }

  // 6.2. Minha Vida: Lugares para conhecer / viajar
  // Ex: "Quero conhecer a Argentina algum dia", "Viajar para a Itália"
  const placeRegex = /(?:conhecer|visitar|viajar para|ir para)\s+(?:a|o|as|os)?\s*([A-ZÀ-Ú][a-zà-úA-ZÀ-Ú\s]+?)(?=(?:,\s*|\.\s*|;\s*|\balgum dia|\bum dia|\be\s+|$))/i;
  const placeMatch = trimmed.match(placeRegex);
  if (placeMatch && !lower.includes('médico') && !lower.includes('dentista')) {
    const placeName = placeMatch[1].trim();
    if (placeName.length >= 3 && !['trabalho', 'casa', 'faculdade'].includes(placeName.toLowerCase())) {
      actions.push({
        id: `act-${Date.now()}-place`,
        type: 'add_my_life_place',
        title: placeName,
        categoryBadge: 'Minha Vida',
        details: {
          category: 'Lugares',
          status: 'Quero visitar'
        },
        payload: {
          name: placeName,
          status: 'want_to_visit',
          favorite: false
        }
      });
    }
  }

  // 6.3. Minha Vida: Sonhos e desejos
  // Ex: "Meu sonho é fazer uma viagem internacional", "Sonho: abrir meu ateliê"
  const dreamRegex = /(?:meu sonho é|sonho em|sonho:|quero muito um dia)\s+([^,.;]+)/i;
  const dreamMatch = trimmed.match(dreamRegex);
  if (dreamMatch) {
    const dreamTitle = dreamMatch[1].trim();
    if (dreamTitle.length >= 4) {
      actions.push({
        id: `act-${Date.now()}-dream`,
        type: 'add_my_life_dream',
        title: dreamTitle,
        categoryBadge: 'Minha Vida',
        details: {
          category: 'Sonhos & Desejos',
          status: 'Quero realizar'
        },
        payload: {
          title: dreamTitle,
          status: 'want_to_realize',
          favorite: false
        }
      });
    }
  }

  // 6.4. Hábitos
  // Ex: "Criar hábito de caminhar todo dia", "Quero criar o hábito de beber água 2L", "academia terça e quinta"
  const habitRegex = /(?:criar o? hábito de|hábito de|criar hábito:|começar a ter o hábito de)\s+([^,.;]+)/i;
  const habitMatch = trimmed.match(habitRegex);
  if (habitMatch) {
    const habitName = habitMatch[1].trim();
    actions.push({
      id: `act-${Date.now()}-habit`,
      type: 'create_habit',
      title: habitName,
      categoryBadge: 'Hábito',
      details: {
        frequency: 'Diário (ou dias definidos)',
        category: 'Saúde & Rotina'
      },
      payload: {
        name: habitName,
        icon: '🌱',
        category: 'Saúde',
        frequency: 'daily',
        targetDaysPerWeek: 7,
        timeOfDay: 'anytime'
      }
    });
  }

  // 6.5. Metas
  // Ex: "Meta de juntar 5000 reais", "Minha meta é aprender inglês até o fim do ano"
  const goalRegex = /(?:minha meta é|meta de|meta:|criar meta:?)\s+([^,.;]+)/i;
  const goalMatch = trimmed.match(goalRegex);
  if (goalMatch) {
    const goalTitle = goalMatch[1].trim();
    actions.push({
      id: `act-${Date.now()}-goal`,
      type: 'create_goal',
      title: goalTitle,
      categoryBadge: 'Meta',
      details: {
        category: 'Projetos pessoais',
        steps: ['Definir primeiro passo prático', 'Acompanhar progresso semanal']
      },
      payload: {
        name: goalTitle,
        category: 'Projetos pessoais',
        steps: [
          { id: `st-1`, title: 'Primeiro passo prático', completed: false },
          { id: `st-2`, title: 'Revisar evolução', completed: false }
        ]
      }
    });
  }

  // 6.6. Contas / Boletos
  // Ex: "Tenho que pagar a conta de luz amanhã", "Pagar fatura do cartão dia 15"
  const billRegex = /(?:pagar|vence a?|conta de|boleto de)\s+(conta de [a-z0-9]+|luz|água|aluguel|internet|cartão|fatura)(?:\s+(?:no valor de\s+)?(?:R\$\s*)?(\d+(?:[.,]\d{2})?))?/i;
  const billMatch = trimmed.match(billRegex);
  if (billMatch && !actions.some(a => a.type === 'create_bill')) {
    const billName = billMatch[1].toLowerCase().includes('conta') ? billMatch[1] : `Conta de ${billMatch[1]}`;
    const amount = billMatch[2] ? parseFloat(billMatch[2].replace(',', '.')) : 0;
    
    // Determina data
    let dueDate = getTodayDate();
    if (lower.includes('amanhã') || lower.includes('amanha')) {
      dueDate = getRelativeDate(1);
    }

    actions.push({
      id: `act-${Date.now()}-bill`,
      type: 'create_bill',
      title: billName.charAt(0).toUpperCase() + billName.slice(1),
      categoryBadge: 'Conta',
      details: {
        date: dueDate,
        displayDate: formatDateBR(dueDate),
        amount: amount > 0 ? amount : undefined,
        category: 'Contas básicas'
      },
      payload: {
        name: billName.charAt(0).toUpperCase() + billName.slice(1),
        amount,
        dueDate,
        category: 'Contas básicas',
        status: 'pendente'
      }
    });
  }

  // 6.7. Decomposição de tarefas naturais cotidianas (ex: "tenho que...", "preciso...", "lembrar de...")
  // Suporta listas separadas por vírgula, "e", "também", quebras de linha
  const phrases = splitNaturalPhrases(trimmed);

  for (const phrase of phrases) {
    const pLower = phrase.toLowerCase().trim();
    if (!pLower || pLower.length < 4) continue;

    // Se a frase já foi consumida por livro/lugar/sonho/hábito/conta, pula
    if (
      (bookMatch && phrase.includes(bookMatch[1])) ||
      (placeMatch && phrase.includes(placeMatch[1])) ||
      (dreamMatch && phrase.includes(dreamMatch[1])) ||
      (habitMatch && phrase.includes(habitMatch[1])) ||
      (billMatch && phrase.includes(billMatch[1]))
    ) {
      continue;
    }

    // Identifica se é tarefa / compromisso
    const taskData = parseTaskPhrase(phrase);
    if (taskData) {
      actions.push({
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'create_task',
        title: taskData.title,
        categoryBadge: taskData.time ? 'Compromisso' : 'Tarefa',
        details: {
          date: taskData.date,
          displayDate: taskData.displayDate,
          time: taskData.time,
          priority: taskData.priority,
          category: taskData.category
        },
        payload: {
          title: taskData.title,
          date: taskData.date,
          time: taskData.time,
          priority: taskData.priority,
          category: taskData.category,
          repeat: 'none',
          notes: 'Organizado pela LEVIA'
        }
      });
    }
  }

  // Se identificamos ações estruturadas para propor ao usuário
  if (actions.length > 0) {
    let reply = `Entendi. Posso organizar assim para você:\n\n`;
    actions.forEach((act) => {
      let extra = '';
      if (act.details?.displayDate) {
        extra += ` — ${act.details.displayDate}`;
      }
      if (act.details?.time) {
        extra += ` às ${act.details.time}`;
      }
      if (act.details?.priority === 'high') {
        extra += ` (prioridade alta)`;
      }
      if (act.categoryBadge === 'Minha Vida') {
        extra += ` → item de Minha Vida (${act.details?.category || 'Geral'})`;
      } else if (act.categoryBadge === 'Hábito') {
        extra += ` → novo hábito`;
      } else if (act.categoryBadge === 'Conta') {
        extra += ` → conta a pagar`;
      } else if (act.categoryBadge === 'Meta') {
        extra += ` → meta com etapas`;
      } else {
        if (!extra) extra = ` — sem data definida`;
      }

      reply += `• **${act.title}**${extra}\n`;
    });

    reply += `\nQuer que eu salve no seu LEVE?`;

    return {
      reply,
      proposedActions: actions
    };
  }

  // Se for uma mensagem de desabafo ou pensamentos gerais sem ações claras
  if (lower.includes('cabeça cheia') || lower.includes('muita coisa') || lower.includes('ansiosa') || lower.includes('ansioso') || lower.includes('sobrecarregada') || lower.includes('sobrecarregado')) {
    return {
      reply: `Respire fundo. Quando tudo parece urgente, nada é prioridade. Vamos tirar isso da cabeça juntos?\n\nEscreva ou fale aqui exatamente o que está te preocupando ou o que você precisa fazer hoje e nesta semana, mesmo que pareça bagunçado. Eu vou separar o que é tarefa, o que é compromisso e o que pode esperar.`
    };
  }

  // Resposta padrão gentil e orientada à ação da LEVIA
  return {
    reply: `Entendi o que você me disse. Se quiser transformar isso em tarefas, compromissos ou metas, pode me dizer o que precisa ser feito (por exemplo: "tenho que fazer tal coisa amanhã às 15h" ou "preciso resolver X, Y e Z").\n\nEu organizo tudo e peço sua confirmação antes de salvar no LEVE!`
  };
}

/**
 * Divide frases em linguagem natural respeitando conjunções como ", e", "e também", ";", quebras de linha
 */
function splitNaturalPhrases(text: string): string[] {
  // Limpa prefixos como "Estou com várias coisas na cabeça. Preciso..."
  let cleaned = text
    .replace(/^estou com várias coisas na cabeça\.?\s*/i, '')
    .replace(/^tenho várias coisas para fazer\.?\s*/i, '')
    .replace(/^vamos organizar:?\s*/i, '');

  // Substitui separadores comuns
  const parts = cleaned
    .split(/(?:,|\.|\n|;|(?:\be\s+também\b)|(?:\be\s+lembrar\s+de\b)|(?:\be\s+preciso\b)|(?:\be\s+tenho\s+que\b))/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);

  return parts;
}

/**
 * Converte uma frase natural em objeto de tarefa
 */
function parseTaskPhrase(phrase: string): {
  title: string;
  date: string;
  displayDate: string;
  time?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
} | null {
  const pLower = phrase.toLowerCase().trim();

  // Limpa verbos auxiliares de início
  let cleanedTitle = phrase
    .replace(/^(tenho que|preciso|devo|lembrar de|não esquecer de|marcar|agendar|fazer|resolver)\s+/i, '')
    .trim();

  if (!cleanedTitle || cleanedTitle.length < 3) return null;

  // Extração de horário (ex: às 19h, 19:00, 14h30, à noite, de manhã, à tarde)
  let time: string | undefined = undefined;
  const timeRegex = /(?:às|as|à|ás)\s*(\d{1,2})(?:h|:(\d{2}))?/i;
  const timeMatch = phrase.match(timeRegex);
  if (timeMatch) {
    const hours = timeMatch[1].padStart(2, '0');
    const minutes = timeMatch[2] ? timeMatch[2] : '00';
    time = `${hours}:${minutes}`;
    cleanedTitle = cleanedTitle.replace(timeRegex, '').trim();
  } else if (pLower.includes('à noite') || pLower.includes('a noite')) {
    time = '20:00';
    cleanedTitle = cleanedTitle.replace(/(?:à|a)\s+noite/i, '').trim();
  } else if (pLower.includes('de manhã') || pLower.includes('pela manhã')) {
    time = '09:00';
    cleanedTitle = cleanedTitle.replace(/(?:de|pela)\s+manhã/i, '').trim();
  } else if (pLower.includes('à tarde') || pLower.includes('a tarde') || pLower.includes('pela tarde')) {
    time = '14:30';
    cleanedTitle = cleanedTitle.replace(/(?:à|a|pela)\s+tarde/i, '').trim();
  }

  // Extração de data
  let date = getTodayDate();
  let displayDate = 'Hoje';

  if (pLower.includes('amanhã') || pLower.includes('amanha')) {
    date = getRelativeDate(1);
    displayDate = 'Amanhã';
    cleanedTitle = cleanedTitle.replace(/amanh[aã]/i, '').trim();
  } else if (pLower.includes('depois de amanhã') || pLower.includes('depois de amanha')) {
    date = getRelativeDate(2);
    displayDate = formatDateBR(date);
    cleanedTitle = cleanedTitle.replace(/depois de amanh[aã]/i, '').trim();
  } else if (pLower.includes('segunda')) {
    date = getNextWeekdayDate(1);
    displayDate = 'Segunda-feira';
    cleanedTitle = cleanedTitle.replace(/segunda(?:-feira)?/i, '').trim();
  } else if (pLower.includes('terça') || pLower.includes('terca')) {
    date = getNextWeekdayDate(2);
    displayDate = 'Terça-feira';
    cleanedTitle = cleanedTitle.replace(/ter[cç]a(?:-feira)?/i, '').trim();
  } else if (pLower.includes('quarta')) {
    date = getNextWeekdayDate(3);
    displayDate = 'Quarta-feira';
    cleanedTitle = cleanedTitle.replace(/quarta(?:-feira)?/i, '').trim();
  } else if (pLower.includes('quinta')) {
    date = getNextWeekdayDate(4);
    displayDate = 'Quinta-feira';
    cleanedTitle = cleanedTitle.replace(/quinta(?:-feira)?/i, '').trim();
  } else if (pLower.includes('sexta')) {
    date = getNextWeekdayDate(5);
    displayDate = 'Sexta-feira';
    cleanedTitle = cleanedTitle.replace(/sexta(?:-feira)?/i, '').trim();
  } else if (pLower.includes('sábado') || pLower.includes('sabado')) {
    date = getNextWeekdayDate(6);
    displayDate = 'Sábado';
    cleanedTitle = cleanedTitle.replace(/s[aá]bado/i, '').trim();
  } else if (pLower.includes('domingo')) {
    date = getNextWeekdayDate(0);
    displayDate = 'Domingo';
    cleanedTitle = cleanedTitle.replace(/domingo/i, '').trim();
  } else if (pLower.includes('sem data') || pLower.includes('algum dia')) {
    date = '';
    displayDate = 'Sem data definida';
    cleanedTitle = cleanedTitle.replace(/(sem data|algum dia)/i, '').trim();
  }

  // Prioridade
  let priority: 'low' | 'medium' | 'high' = 'medium';
  if (pLower.includes('urgente') || pLower.includes('importante') || pLower.includes('prioridade')) {
    priority = 'high';
    cleanedTitle = cleanedTitle.replace(/(urgente|importante|prioridade)/i, '').trim();
  }

  // Categoria
  let category = 'Pessoal';
  if (pLower.includes('trabalho') || pLower.includes('reunião') || pLower.includes('cliente') || pLower.includes('chefe')) {
    category = 'Trabalho';
  } else if (pLower.includes('faculdade') || pLower.includes('estudar') || pLower.includes('aula') || pLower.includes('prova') || pLower.includes('curso')) {
    category = 'Estudos';
  } else if (pLower.includes('dentista') || pLower.includes('médico') || pLower.includes('médica') || pLower.includes('exame') || pLower.includes('remédio') || pLower.includes('academia') || pLower.includes('treino')) {
    category = 'Saúde';
  } else if (pLower.includes('comprar') || pLower.includes('mercado') || pLower.includes('supermercado') || pLower.includes('ração') || pLower.includes('casa') || pLower.includes('limpar') || pLower.includes('lavar')) {
    category = 'Casa';
  } else if (pLower.includes('pagar') || pLower.includes('banco') || pLower.includes('fatura') || pLower.includes('conta')) {
    category = 'Financeiro';
  }

  // Limpeza final do título
  cleanedTitle = cleanedTitle
    .replace(/^[\s—–-]+/, '')
    .replace(/[\s—–-]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Se o título estiver vazio ou for apenas "estudar", capitalise
  if (cleanedTitle.length < 2) return null;
  cleanedTitle = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);

  return {
    title: cleanedTitle,
    date,
    displayDate,
    time,
    priority,
    category
  };
}
