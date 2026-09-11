// ============================================================================
// Sistema Centralizado de Autorização e Planos Comerciais - LEVE
// ============================================================================

/**
 * Converte com precisão valores do Postgres/Supabase para booleano real:
 * Suporta boolean (true/false), strings ('true', 't', '1', 'yes', 'sim') e números (1/0).
 */
export function parseBoolean(value: any): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    return (
      trimmed === 'true' || 
      trimmed === 't' || 
      trimmed === '1' || 
      trimmed === 'yes' || 
      trimmed === 'sim' ||
      trimmed === 'active' ||
      trimmed === 'ativo' ||
      trimmed === 's'
    );
  }
  return false;
}

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
export interface ExtractedPlanBooleans {
  isVip: boolean;
  isSpecial: boolean;
  isGratuito: boolean;
  tier: PlanTier;
  planName: 'gratuito' | 'especial' | 'vip';
}

/**
 * Avalia com rigor absoluto os 3 campos da tabela user_entitlements
 * definidos e alterados manualmente pela administradora diretamente no Supabase:
 *
 * GRATUITO:
 * "leve gratuito" = true
 * leve_especial = false
 * leve_vip = false
 *
 * ESPECIAL:
 * "leve gratuito" = false
 * leve_especial = true
 * leve_vip = false
 *
 * VIP:
 * "leve gratuito" = false
 * leve_especial = false
 * leve_vip = true
 */
export function extractPlanFromRow(row: any): ExtractedPlanBooleans {
  if (!row) {
    return {
      isVip: false,
      isSpecial: false,
      isGratuito: true,
      tier: 'free',
      planName: 'gratuito'
    };
  }

  // 1. Extração segura dos 3 campos especificados (suporte a coluna com espaço "leve gratuito" ou underline leve_gratuito)
  const rawVip = row.leve_vip !== undefined ? row.leve_vip : (row['leve vip'] !== undefined ? row['leve vip'] : row.vip);
  const rawSpecial = row.leve_especial !== undefined ? row.leve_especial : (row['leve especial'] !== undefined ? row['leve especial'] : row.especial);
  const rawGratuito = row['leve gratuito'] !== undefined ? row['leve gratuito'] : (row.leve_gratuito !== undefined ? row.leve_gratuito : row.gratuito);

  const vipBool = parseBoolean(rawVip);
  const specialBool = parseBoolean(rawSpecial);
  const gratuitoBool = parseBoolean(rawGratuito);

  // 2. Respeito estrito às regras manuais da administradora:
  // VIP: "leve gratuito" = false, leve_especial = false, leve_vip = true
  if (vipBool) {
    return {
      isVip: true,
      isSpecial: false,
      isGratuito: false,
      tier: 'vip',
      planName: 'vip'
    };
  }

  // ESPECIAL: "leve gratuito" = false, leve_especial = true, leve_vip = false
  if (specialBool) {
    return {
      isVip: false,
      isSpecial: true,
      isGratuito: false,
      tier: 'special',
      planName: 'especial'
    };
  }

  // GRATUITO: "leve gratuito" = true, leve_especial = false, leve_vip = false
  if (gratuitoBool) {
    return {
      isVip: false,
      isSpecial: false,
      isGratuito: true,
      tier: 'free',
      planName: 'gratuito'
    };
  }

  // 3. Fallback textual caso a administradora tenha preenchido apenas o campo descritivo plan_name/plan/plano
  const rawPlan = String(row.plan_name || row.plan || row.plano || '').toLowerCase().trim();
  if (rawPlan === 'vip' || rawPlan.includes('vip') || rawPlan.includes('completo')) {
    return {
      isVip: true,
      isSpecial: false,
      isGratuito: false,
      tier: 'vip',
      planName: 'vip'
    };
  }

  if (rawPlan === 'especial' || rawPlan.includes('especial') || rawPlan === 'special') {
    return {
      isVip: false,
      isSpecial: true,
      isGratuito: false,
      tier: 'special',
      planName: 'especial'
    };
  }

  // Padrão do LEVE: Gratuito
  return {
    isVip: false,
    isSpecial: false,
    isGratuito: true,
    tier: 'free',
    planName: 'gratuito'
  };
}

export function determineUserPlan(user: any | null, entitlements: any | null): PlanTier {
  if (!user) {
    return 'free';
  }

  // 1. Extração prioritária a partir do registro de entitlements
  if (entitlements) {
    const extracted = extractPlanFromRow(entitlements);
    if (extracted.tier === 'vip' || extracted.tier === 'special') {
      return extracted.tier;
    }
  }

  // 2. Extração a partir do user_metadata do usuário autenticado no Supabase Auth
  const meta = user.user_metadata || {};
  const appMeta = user.app_metadata || {};
  const metaPlan = extractPlanFromRow({
    leve_vip: meta.leve_vip ?? appMeta.leve_vip,
    leve_especial: meta.leve_especial ?? appMeta.leve_especial,
    plan_name: meta.plan || meta.plan_name || appMeta.plan || appMeta.plan_name,
    'leve vip': meta['leve vip'] ?? appMeta['leve vip'],
    'leve especial': meta['leve especial'] ?? appMeta['leve especial']
  });

  if (metaPlan.tier === 'vip' || metaPlan.tier === 'special') {
    return metaPlan.tier;
  }

  // 3. Padrão: LEVE Gratuito
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
