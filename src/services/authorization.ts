// ============================================================================
// Sistema Centralizado de Autorização e Planos Comerciais - LEVE
// ============================================================================

import { parseBoolean } from './supabase';

export type PlanTier = 'free' | 'special' | 'vip';

export const PLAN_LABELS: Record<PlanTier, string> = {
  free: 'LEVE Gratuito',
  special: 'LEVE Especial',
  vip: 'LEVE VIP'
};

export type AppFeature = 
  | 'my-day'
  | 'calendar'
  | 'habits'
  | 'journal'
  | 'spirituality'
  | 'goals'
  | 'hydration'
  | 'nutrition'
  | 'movement'
  | 'sleep'
  | 'self-care'
  | 'bills'
  | 'cycle'
  | 'progress'
  | 'my-life'
  | 'lia'
  | 'settings';

export const FEATURE_NAMES: Record<AppFeature | string, string> = {
  'my-day': 'Meu Dia',
  'calendar': 'Calendário & Semana',
  'habits': 'Meus Hábitos',
  'journal': 'Meu Caderno & Gratidão',
  'spirituality': 'Fé & Momento com Deus',
  'goals': 'Minhas Metas',
  'my-life': 'Minha Vida',
  'hydration': 'Minha Água',
  'nutrition': 'Alimentação & Compras',
  'movement': 'Meu Movimento',
  'sleep': 'Meu Sono',
  'self-care': 'Meu Autocuidado',
  'bills': 'Contas & Pendências',
  'cycle': 'Ciclo & Menstruação',
  'progress': 'Meu Progresso',
  'lia': 'Levia • Mentora IA',
  'settings': 'Configurações'
};

/**
 * Determina o plano comercial do usuário com base no usuário autenticado e no registro de user_entitlements:
 * - Sem usuário autenticado -> 'free' (LEVE Gratuito)
 * - Sem registro de entitlements -> 'free' (LEVE Gratuito)
 * - VIP ('vip'): lia_access === true OU plan_name/plan === 'vip'/'completo'
 * - Especial ('special'): special_access === true OU leve_access === true OU plan_name/plan === 'special'/'especial'
 * - Gratuito ('free'): padrão seguro
 */
export function determineUserPlan(user: any | null, entitlements: any | null): PlanTier {
  if (!user) {
    return 'free';
  }

  if (!entitlements) {
    return 'free';
  }

  // 1. Verificação explícita do campo de plano do banco
  const rawPlan = (
    entitlements.plan_name ||
    entitlements.plan ||
    entitlements.plano ||
    ''
  ).toString().trim().toLowerCase();

  if (
    rawPlan === 'vip' ||
    rawPlan === 'leve vip' ||
    rawPlan === 'completo' ||
    rawPlan === 'leve completo'
  ) {
    return 'vip';
  }

  if (
    rawPlan === 'special' ||
    rawPlan === 'especial' ||
    rawPlan === 'leve especial'
  ) {
    // Se também tiver lia_access ativado, eleva para VIP
    if (parseBoolean(entitlements.lia_access)) {
      return 'vip';
    }
    return 'special';
  }

  if (
    rawPlan === 'free' ||
    rawPlan === 'gratuito' ||
    rawPlan === 'leve gratuito'
  ) {
    // Verifica se possui alguma flag de upgrade concedida individualmente
    if (parseBoolean(entitlements.lia_access)) return 'vip';
    if (parseBoolean(entitlements.special_access) || parseBoolean(entitlements.leve_access)) return 'special';
    return 'free';
  }

  // 2. Verificação pelas colunas booleanas de permissão (user_entitlements)
  const hasLia = parseBoolean(entitlements.lia_access);
  const hasSpecial = parseBoolean(entitlements.special_access);
  const hasLeve = parseBoolean(entitlements.leve_access);

  if (hasLia) {
    return 'vip';
  }

  if (hasSpecial || hasLeve) {
    return 'special';
  }

  return 'free';
}

/**
 * Retorna o plano comercial mínimo necessário para acessar o recurso:
 * - 'my-day' e 'settings': 'free'
 * - 'lia': 'vip'
 * - todas as outras áreas: 'special'
 */
export function getRequiredPlan(feature: AppFeature | string): PlanTier {
  if (feature === 'my-day' || feature === 'settings') {
    return 'free';
  }
  if (feature === 'lia') {
    return 'vip';
  }
  return 'special';
}

/**
 * Função centralizada de autorização do LEVE.
 * 
 * REGRAS:
 * 🆓 GRATUITO:
 * - "Meu Dia" = LIBERADO
 * - Todas as outras áreas = BLOQUEADAS
 * - LEVIA = BLOQUEADA
 * 
 * ⭐ ESPECIAL:
 * - "Meu Dia" = LIBERADO
 * - Todas as outras áreas = LIBERADAS
 * - LEVIA = BLOQUEADA
 * 
 * 👑 VIP:
 * - "Meu Dia" = LIBERADO
 * - Todas as outras áreas = LIBERADAS
 * - LEVIA = LIBERADA
 */
export function canAccess(feature: AppFeature | string, plan: PlanTier): boolean {
  // 'my-day' é sempre liberado mesmo para usuários gratuitos ou visitantes
  if (feature === 'my-day' || feature === 'settings') {
    return true;
  }

  // LEVIA é exclusiva do plano VIP
  if (feature === 'lia') {
    return plan === 'vip';
  }

  // Todas as demais áreas exigem plano Especial ou VIP
  return plan === 'special' || plan === 'vip';
}

export function getPlanLabel(plan: PlanTier): string {
  return PLAN_LABELS[plan] || 'LEVE Gratuito';
}

export function getFeatureDisplayName(feature: AppFeature | string): string {
  return FEATURE_NAMES[feature] || feature;
}
