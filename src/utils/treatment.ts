// Utilitário de tratamento de gênero e linguagem inclusiva - LEVE
import { TreatmentPreference } from '../types';

export const TREATMENT_OPTIONS: { 
  id: TreatmentPreference; 
  label: string; 
  badge: string; 
  description: string; 
}[] = [
  { 
    id: 'feminino', 
    label: 'Feminino', 
    badge: 'ela/dela',
    description: '' 
  },
  { 
    id: 'masculino', 
    label: 'Masculino', 
    badge: 'ele/dele',
    description: '' 
  },
  { 
    id: 'nao_informar', 
    label: 'Prefiro não informar', 
    badge: 'neutro',
    description: '' 
  }
];

/**
 * Retorna a preferência normalizada de tratamento.
 * Suporta 'feminino', 'masculino' e 'nao_informar' (com alias para 'neutro').
 */
export function normalizeTreatmentPreference(raw?: string | null): TreatmentPreference {
  if (!raw) return 'nao_informar';
  const val = String(raw).trim().toLowerCase();
  if (val === 'feminino' || val === 'female' || val === 'ela' || val === 'ela/dela') return 'feminino';
  if (val === 'masculino' || val === 'male' || val === 'ele' || val === 'ele/dele') return 'masculino';
  if (val === 'neutro' || val === 'neutral' || val === 'elu' || val === 'elu/delu') return 'nao_informar';
  if (
    val === 'nao_informar' || 
    val === 'none' || 
    val === 'not_specified' || 
    val === 'prefiro_nao_informar' || 
    val === 'prefiro não informar' ||
    val === 'desejo não informar' ||
    val === 'desejo_nao_informar'
  ) return 'nao_informar';
  return 'nao_informar';
}

export function isMasculine(preference?: TreatmentPreference | string | null): boolean {
  return normalizeTreatmentPreference(preference) === 'masculino';
}

export function isFeminine(preference?: TreatmentPreference | string | null): boolean {
  return normalizeTreatmentPreference(preference) === 'feminino';
}

export function isNeutral(preference?: TreatmentPreference | string | null): boolean {
  return normalizeTreatmentPreference(preference) === 'nao_informar';
}

/**
 * Retorna um termo adaptado ao gênero configurado pelo usuário.
 */
export function getGenderedTerm(
  preference: TreatmentPreference | undefined | null,
  feminine: string,
  masculine: string,
  neutral: string
): string {
  const pref = normalizeTreatmentPreference(preference);
  if (pref === 'feminino') return feminine;
  if (pref === 'masculino') return masculine;
  return neutral;
}

/**
 * Adapta inteligentemente textos, reflexões e frases de acordo com o gênero
 */
export function adaptTextToGender(text: string, preference?: TreatmentPreference | string | null): string {
  if (!text) return '';
  const pref = normalizeTreatmentPreference(preference);

  if (pref === 'masculino') {
    return text
      .replace(/\bvocê mesma\b/gi, 'você mesmo')
      .replace(/\bsi mesma\b/gi, 'si mesmo')
      .replace(/\bmesma\b/g, 'mesmo')
      .replace(/\bgrata\b/g, 'grato')
      .replace(/\bGrata\b/g, 'Grato')
      .replace(/\bfocada\b/g, 'focado')
      .replace(/\bFocada\b/g, 'Focado')
      .replace(/\bpronta\b/g, 'pronto')
      .replace(/\bPronta\b/g, 'Pronto')
      .replace(/\bdescansada\b/g, 'descansado')
      .replace(/\bDescansada\b/g, 'Descansado')
      .replace(/\bcansada\b/g, 'cansado')
      .replace(/\bCansada\b/g, 'Cansado')
      .replace(/\bacolhida\b/g, 'acolhido')
      .replace(/\bAcolhida\b/g, 'Acolhido')
      .replace(/\bdeterminada\b/g, 'determinado')
      .replace(/\bDeterminada\b/g, 'Determinado')
      .replace(/\bsobrecarregada\b/g, 'sobrecarregado')
      .replace(/\bSobrecarregada\b/g, 'Sobrecarregado')
      .replace(/\bsozinha\b/g, 'sozinho')
      .replace(/\bSozinha\b/g, 'Sozinho')
      .replace(/\bconectada\b/g, 'conectado')
      .replace(/\bConectada\b/g, 'Conectado')
      .replace(/\bdisposta\b/g, 'disposto')
      .replace(/\bDisposta\b/g, 'Disposto')
      .replace(/\bbem-vinda\b/gi, 'bem-vindo')
      .replace(/\bBem-vinda\b/gi, 'Bem-vindo')
      .replace(/\bquerida\b/gi, 'meu amigo');
  }

  if (pref === 'nao_informar') {
    return text
      .replace(/\bcom você mesma\b/gi, 'consigo')
      .replace(/\bcom você mesmo\b/gi, 'consigo')
      .replace(/\bpara você mesma\b/gi, 'a si')
      .replace(/\bpara você mesmo\b/gi, 'a si')
      .replace(/\bsobre si mesma\b/gi, 'sobre si')
      .replace(/\bsobre si mesmo\b/gi, 'sobre si')
      .replace(/\bsi mesma\b/gi, 'si')
      .replace(/\bsi mesmo\b/gi, 'si')
      .replace(/\bSeja grata\b/g, 'Cultive a gratidão')
      .replace(/\bseja grata\b/g, 'cultive a gratidão')
      .replace(/\bSeja grato\b/g, 'Cultive a gratidão')
      .replace(/\bseja grato\b/g, 'cultive a gratidão')
      .replace(/\bgrata\b/g, 'com gratidão')
      .replace(/\bgrato\b/g, 'com gratidão')
      .replace(/\bfocada\b/g, 'com foco')
      .replace(/\bfocado\b/g, 'com foco')
      .replace(/\bpronta\b/g, 'a postos')
      .replace(/\bpronto\b/g, 'a postos')
      .replace(/\bdescansada\b/g, 'com descanso')
      .replace(/\bdescansado\b/g, 'com descanso')
      .replace(/\bcansada\b/g, 'com cansaço')
      .replace(/\bcansado\b/g, 'com cansaço')
      .replace(/\bacolhida\b/g, 'em paz')
      .replace(/\bacolhido\b/g, 'em paz')
      .replace(/\bsobrecarregada\b/g, 'com sobrecarga')
      .replace(/\bsobrecarregado\b/g, 'com sobrecarga')
      .replace(/\bsozinha\b/g, 'em solidão')
      .replace(/\bsozinho\b/g, 'em solidão')
      .replace(/\bbem-vinda\b/gi, 'boas-vindas')
      .replace(/\bBem-vinda\b/gi, 'Boas-vindas')
      .replace(/\bbem-vindo\b/gi, 'boas-vindas')
      .replace(/\bBem-vindo\b/gi, 'Boas-vindas')
      .replace(/\bquerida\b/gi, 'você')
      .replace(/\bquerido\b/gi, 'você');
  }

  // Padrão feminino
  return text;
}

/**
 * Boas-vindas adaptadas ao gênero do usuário.
 * Ex: "Bem-vinda de volta, Nathália!" ou "Bem-vindo de volta, Lucas!" ou "Boas-vindas!"
 */
export function getWelcomeTitle(preference?: TreatmentPreference | null, name?: string | null): string {
  const cleanName = name?.trim();
  const namePart = cleanName ? `, ${cleanName}` : '';
  const pref = normalizeTreatmentPreference(preference);

  if (pref === 'masculino') {
    return `Bem-vindo${namePart}!`;
  }
  if (pref === 'feminino') {
    return `Bem-vinda${namePart}! 🌿`;
  }
  return cleanName ? `Boas-vindas, ${cleanName}!` : 'Boas-vindas ao LEVE!';
}

/**
 * Subtítulo do Banner do Meu Dia adaptado
 */
export function getGreetingSubtitle(preference?: TreatmentPreference | null): string {
  const pref = normalizeTreatmentPreference(preference);
  if (pref === 'masculino') return '— Disciplina & Foco';
  if (pref === 'feminino') return '— Lembrete de leveza';
  return '— Momento de clareza';
}

/**
 * Título do Widget de Autocuidado
 */
export function getSelfCareSectionTitle(preference?: TreatmentPreference | null): string {
  const pref = normalizeTreatmentPreference(preference);
  if (pref === 'masculino') return 'Recarga & Disciplina';
  if (pref === 'feminino') return 'Autocuidado de Hoje';
  return 'Autocuidado de Hoje';
}

/**
 * Título do Widget de Gratidão do Meu Dia
 */
export function getGratitudeWidgetTitle(preference?: TreatmentPreference | null): string {
  const pref = normalizeTreatmentPreference(preference);
  if (pref === 'masculino') return 'Vitória do dia ou aprendizado';
  if (pref === 'feminino') return 'Uma coisa boa que aconteceu hoje 🤍';
  return 'Uma coisa boa que aconteceu hoje';
}

/**
 * Placeholder do Widget de Gratidão
 */
export function getGratitudePlaceholder(preference?: TreatmentPreference | null): string {
  const pref = normalizeTreatmentPreference(preference);
  if (pref === 'masculino') return 'Ex: Meta difícil executada, treino feito, foco mantido sem distrações...';
  if (pref === 'feminino') return 'Ex: Um abraço apertado, o sol na janela, o café quentinho...';
  return 'Ex: Uma conversa agradável, o ar fresco, uma meta alcançada...';
}

/**
 * Rótulo do botão de encerramento do dia
 */
export function getEndDayButtonLabel(preference?: TreatmentPreference | null): string {
  const pref = normalizeTreatmentPreference(preference);
  if (pref === 'masculino') return 'Encerrar o dia • Balanço & Descanso';
  if (pref === 'feminino') return 'Encerrar o dia com gratidão e descanso';
  return 'Encerrar o dia com tranquilidade e descanso';
}

/**
 * Retorna uma saudação afetuosa e natural.
 */
export function formatGreetingWithName(greeting: string, name?: string | null, preference?: TreatmentPreference | null): string {
  const cleanName = name?.trim();
  const pref = normalizeTreatmentPreference(preference);
  if (pref === 'masculino') {
    return cleanName ? `${greeting}, ${cleanName}!` : `${greeting}!`;
  }
  if (cleanName) {
    return `${greeting}, ${cleanName}! 🌿`;
  }
  return `${greeting}! 🌿`;
}

/**
 * Mensagem de boas-vindas com personalização
 */
export function getWelcomeGreeting(name?: string | null, preference?: TreatmentPreference | null): string {
  const cleanName = name?.trim();
  const pref = normalizeTreatmentPreference(preference);
  if (pref === 'masculino') {
    return cleanName ? `Bem-vindo, ${cleanName}! Foco e disciplina para o seu dia.` : 'Bem-vindo! Foco e disciplina para o seu dia.';
  }
  if (pref === 'feminino') {
    return cleanName ? `Que bom ter você aqui, querida ${cleanName}!` : 'Que bom ter você aqui, bem-vinda!';
  }
  if (cleanName) {
    return `Que bom ter você aqui, ${cleanName}!`;
  }
  return 'Boas-vindas ao LEVE!';
}

/**
 * Saudação e mensagem inicial para a LEVIA respeitando a preferência do usuário.
 */
export function getLeviaInitialGreeting(name?: string | null, preference?: TreatmentPreference): string {
  const cleanName = name?.trim();
  const nameSuffix = cleanName ? `, ${cleanName}` : '';
  const pref = normalizeTreatmentPreference(preference);

  if (pref === 'masculino') {
    return `Olá${nameSuffix}! Sou a LEVIA, sua assistente de organização no LEVE.\n\n“Você fala. Eu organizo.”\n\nPode me passar tudo o que precisa ser planejado ou executado: tarefas, reuniões, metas, treino, finanças ou livros. Eu estruturo tudo com clareza e objetividade para a sua confirmação.\n\nO que vamos organizar agora?`;
  }

  if (pref === 'feminino') {
    return `Olá${nameSuffix}! Eu sou a LEVIA, sua assistente pessoal de organização no LEVE.\n\n“Você fala. A LEVIA organiza.”\n\nPode me contar em linguagem natural tudo o que estiver passando pela sua mente — tarefas pendentes, compromissos da semana, hábitos que deseja começar, autocuidado ou sonhos para guardar. Eu estruturo tudo com carinho e sempre peço sua confirmação antes de salvar no seu LEVE.\n\nO que gostaria de organizar agora?`;
  }

  return `Olá${nameSuffix}! Eu sou a LEVIA, sua assistente pessoal de organização no LEVE.\n\n“Você fala. A LEVIA organiza.”\n\nPode me contar em linguagem natural tudo o que estiver passando pela sua mente — tarefas pendentes, compromissos da semana, hábitos que deseja começar ou metas para guardar. Eu estruturo tudo e sempre peço sua confirmação antes de salvar no seu LEVE.\n\nO que gostaria de organizar agora?`;
}

/**
 * Apoio contextual da LEVIA, respeitando a preferência configurada pelo usuário.
 */
export function getLeviaSupportReply(name?: string | null, preference?: TreatmentPreference): string {
  const cleanName = name?.trim();
  const nameSuffix = cleanName ? `, ${cleanName}` : '';
  const pref = normalizeTreatmentPreference(preference);
  
  if (pref === 'masculino') {
    return `Estou à disposição${nameSuffix}. Sem complicação: defina a prioridade e vamos estruturar um passo de cada vez com foco no resultado. Como posso te apoiar agora?`;
  }

  if (pref === 'feminino') {
    return `Estou aqui com você${nameSuffix}. Cada dia tem seu próprio ritmo e o seu é precioso. O que quer que esteja acontecendo, vamos com calma, um detalhe de cada vez. Como posso te apoiar agora?`;
  }

  return `Estou aqui com você${nameSuffix}. Cada dia tem seu próprio ritmo. Vamos com calma e foco, um passo de cada vez. Como posso te apoiar agora?`;
}
