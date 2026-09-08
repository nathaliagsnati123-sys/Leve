// Utilitário de tratamento de gênero e linguagem inclusiva - LEVE
import { TreatmentPreference } from '../types';

export const TREATMENT_OPTIONS: { 
  id: TreatmentPreference; 
  label: string; 
  description: string; 
}[] = [
  { 
    id: 'feminino', 
    label: 'Feminino', 
    description: 'Tratamento no feminino (ela/dela)' 
  },
  { 
    id: 'masculino', 
    label: 'Masculino', 
    description: 'Tratamento no masculino (ele/dele)' 
  },
  { 
    id: 'neutro', 
    label: 'Neutro', 
    description: 'Tratamento em linguagem neutra' 
  },
  { 
    id: 'nao_informar', 
    label: 'Prefiro não informar', 
    description: 'Linguagem neutra e acolhedora' 
  }
];

/**
 * Retorna a preferência normalizada de tratamento.
 * Suporta 'feminino', 'masculino', 'neutro' e 'nao_informar'.
 */
export function normalizeTreatmentPreference(raw?: string | null): TreatmentPreference {
  if (!raw) return 'nao_informar';
  const val = String(raw).trim().toLowerCase();
  if (val === 'feminino' || val === 'female') return 'feminino';
  if (val === 'masculino' || val === 'male') return 'masculino';
  if (val === 'neutro' || val === 'neutral') return 'neutro';
  if (val === 'nao_informar' || val === 'none' || val === 'not_specified' || val === 'prefiro_nao_informar') return 'nao_informar';
  return 'nao_informar';
}

/**
 * Retorna uma saudação afetuosa e natural, sem forçar gênero.
 * Ex: "Bom dia, Nathalia! 🌿" ou "Bom dia! 🌿"
 */
export function formatGreetingWithName(greeting: string, name?: string | null): string {
  const cleanName = name?.trim();
  if (cleanName) {
    return `${greeting}, ${cleanName}! 🌿`;
  }
  return `${greeting}! 🌿`;
}

/**
 * Mensagem de boas-vindas sem presunção de gênero
 */
export function getWelcomeGreeting(name?: string | null): string {
  const cleanName = name?.trim();
  if (cleanName) {
    return `Que bom ter você aqui, ${cleanName}!`;
  }
  return 'Boas-vindas ao LEVE!';
}

/**
 * Saudação e mensagem inicial para a LEVIA respeitando estritamente a preferência do usuário.
 */
export function getLeviaInitialGreeting(name?: string | null, preference?: TreatmentPreference): string {
  const cleanName = name?.trim();
  const nameSuffix = cleanName ? `, ${cleanName}` : '';
  const pref = normalizeTreatmentPreference(preference);

  if (pref === 'feminino') {
    return `Olá${nameSuffix}! Eu sou a Levia, sua companheira de organização e leveza. Se houver coisas demais acumuladas na sua cabeça, podemos organizar tudo com calma, um passo de cada vez. Como posso te ajudar hoje?`;
  }

  if (pref === 'masculino') {
    return `Olá${nameSuffix}! Eu sou a Levia, sua companheira de organização e leveza. Se houver coisas demais acumuladas na sua cabeça, podemos organizar tudo com calma, um passo de cada vez. Como posso te ajudar hoje?`;
  }

  return `Olá${nameSuffix}! Eu sou a Levia, sua companheira de organização e leveza. Se houver coisas demais acumuladas na sua cabeça, podemos organizar tudo com calma, um passo de cada vez. Como está seu dia?`;
}

/**
 * Apoio contextual da LEVIA, respeitando a preferência configurada pelo usuário.
 */
export function getLeviaSupportReply(name?: string | null, preference?: TreatmentPreference): string {
  const cleanName = name?.trim();
  const nameSuffix = cleanName ? `, ${cleanName}` : '';
  const pref = normalizeTreatmentPreference(preference);
  
  if (pref === 'feminino') {
    return `Estou aqui com você${nameSuffix}. Cada dia tem seu próprio ritmo e o seu é precioso. O que quer que esteja acontecendo, vamos com calma, um detalhe de cada vez. Como posso te apoiar agora?`;
  }
  
  if (pref === 'masculino') {
    return `Estou aqui com você${nameSuffix}. Cada dia tem seu próprio ritmo e o seu é precioso. O que quer que esteja acontecendo, vamos com calma, um detalhe de cada vez. Como posso te apoiar agora?`;
  }

  // Padrão neutro e acolhedor (para neutro, nao_informar ou sem preferência cadastrada)
  return `Estou aqui com você${nameSuffix}. Cada dia tem seu próprio ritmo e o seu é precioso. O que quer que esteja acontecendo, vamos com calma, um detalhe de cada vez. Como posso te apoiar agora?`;
}
