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

/**
 * Ofertas e Links Oficiais de Checkout da Hotmart para o LEVE
 * Produto base: J107506852L
 */
export const HOTMART_CHECKOUT = {
  // 1. LEVE ESPECIAL (R$ 49,90) - Para usuários Gratuitos liberarem todas as áreas (exceto LEVIA)
  ESPECIAL: 'https://pay.hotmart.com/J107506852L?off=nve7cj26',
  ESPECIAL_OFFER_CODE: 'nve7cj26',
  ESPECIAL_PRICE: 'R$ 49,90',
  ESPECIAL_NUMERIC_PRICE: 49.9,

  // 2. UPGRADE LEVIA / VIP 1 (R$ 16,00) - Disponível SOMENTE para usuários do LEVE Especial
  UPGRADE_LEVIA: 'https://pay.hotmart.com/J107506852L?off=0vzkb290',
  UPGRADE_OFFER_CODE: '0vzkb290',
  UPGRADE_PRICE: 'R$ 16,00',
  UPGRADE_NUMERIC_PRICE: 16.0,

  // 3. LEVE VIP DIRETO (R$ 65,90) - Para quem está no Gratuito e quer ir direto para o VIP (Todas as áreas + LEVIA)
  VIP_DIRECT: 'https://pay.hotmart.com/J107506852L?off=foybxnsq',
  VIP_OFFER_CODE: 'foybxnsq',
  VIP_PRICE: 'R$ 65,90',
  VIP_NUMERIC_PRICE: 65.9,
};

/**
 * Constrói a URL do checkout da Hotmart incluindo o e-mail do usuário autenticado como parâmetro
 * para preencher o checkout e facilitar a sincronização automática com a conta.
 */
export function buildHotmartUrl(baseUrl: string, userEmail?: string | null): string {
  if (!userEmail || !userEmail.trim()) return baseUrl;
  const cleanEmail = userEmail.trim().toLowerCase();
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}email=${encodeURIComponent(cleanEmail)}`;
}

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
  'lia': 'LEVIA • Assistente Pessoal',
  'settings': 'Configurações'
};

/**
 * Determina o plano comercial do usuário com base no usuário autenticado e no registro de user_entitlements:
 * - Sem usuário autenticado -> 'free' (LEVE Gratuito)
 * - Sem registro de entitlements -> 'free' (LEVE Gratuito)
 * - VIP ('vip'): leve_vip === true OU lia_access === true OU plan_name contendo 'vip'
 * - Especial ('special'): leve_especial === true OU plan_name contendo 'especial'/'special'
 * - Gratuito ('free'): leve_gratuito === true ou usuário sem compra
 */
export function determineUserPlan(user: any | null, entitlements: any | null): PlanTier {
  if (!user) {
    return 'free';
  }

  if (!entitlements) {
    return 'free';
  }

  // 1. Verificação prioritária de colunas de permissão do Supabase (user_entitlements)
  const isVip = parseBoolean(entitlements.leve_vip) || parseBoolean(entitlements.lia_access);
  const isSpecial = parseBoolean(entitlements.leve_especial);

  if (isVip) {
    return 'vip';
  }

  if (isSpecial) {
    return 'special';
  }

  // 2. Verificação pelo campo descritivo de plano do banco (plan_name / plan / plano)
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
    rawPlan === 'leve completo' ||
    rawPlan.includes('vip')
  ) {
    return 'vip';
  }

  if (
    rawPlan === 'special' ||
    rawPlan === 'especial' ||
    rawPlan === 'leve especial' ||
    rawPlan.includes('especial')
  ) {
    return 'special';
  }

  // 3. Usuário Gratuito padrão
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
