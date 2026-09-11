// Serviço de integração Supabase - LEVE
import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { AppData, MyLifeData, TreatmentPreference } from '../types';
import { extractPlanFromRow } from './authorization';
import { normalizeTreatmentPreference } from '../utils/treatment';
import { pushAppDataToCloud, pullAppDataFromCloud } from './syncService';

export function cleanSupabaseUrl(raw?: string | null): string {
  const fallback = 'https://ozzlnqlhrythvjdrdgwe.supabase.co';
  if (!raw) return fallback;
  let cleaned = String(raw).trim();
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '').trim();
  cleaned = cleaned.replace(/^(?:export\s+)?(?:VITE_)?SUPABASE_URL\s*[:=]\s*/i, '').trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  if (cleaned.endsWith(';')) {
    cleaned = cleaned.slice(0, -1).trim();
  }
  try {
    const parsed = new URL(cleaned.startsWith('http') ? cleaned : `https://${cleaned}`);
    return parsed.origin;
  } catch {
    return fallback;
  }
}

let runtimeSupabaseUrl: string = cleanSupabaseUrl(import.meta.env.VITE_SUPABASE_URL as string);

export function getSupabaseUrl(): string {
  return runtimeSupabaseUrl || 'https://ozzlnqlhrythvjdrdgwe.supabase.co';
}

export const SUPABASE_URL: string = cleanSupabaseUrl(import.meta.env.VITE_SUPABASE_URL as string);

const LOCAL_STORAGE_ANON_KEY = 'leve_supabase_anon_key';

function cleanEnvKey(raw?: string | null): string {
  if (!raw) return '';
  let cleaned = String(raw).trim();
  // Remove zero-width and invisible unicode characters (often pasted accidentally from clipboard)
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '').trim();

  // Remove accidental variable assignment prefix if pasted into Vercel value field
  cleaned = cleaned.replace(/^(?:export\s+)?(?:VITE_)?SUPABASE_ANON_KEY\s*[:=]\s*/i, '').trim();

  // Remove wrapping quotes if present
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Remove trailing semicolon if present
  if (cleaned.endsWith(';')) {
    cleaned = cleaned.slice(0, -1).trim();
  }

  return cleaned;
}

let runtimePublishableKey: string | null = null;

export async function fetchServerAuthConfig(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/config');
    if (res.ok) {
      const data = await res.json();
      let changed = false;

      if (data.supabaseUrl && typeof data.supabaseUrl === 'string') {
        const cleanedUrl = cleanSupabaseUrl(data.supabaseUrl);
        if (cleanedUrl && cleanedUrl !== runtimeSupabaseUrl) {
          runtimeSupabaseUrl = cleanedUrl;
          changed = true;
        }
      }

      if (data.supabaseAnonKey && typeof data.supabaseAnonKey === 'string') {
        const cleanedKey = cleanEnvKey(data.supabaseAnonKey);
        if (cleanedKey && cleanedKey !== runtimePublishableKey) {
          runtimePublishableKey = cleanedKey;
          changed = true;
        }
      }

      if (changed) {
        cachedClient = null;
        lastUsedAnonKey = null;
        lastUsedUrl = null;
      }
      return runtimePublishableKey;
    }
  } catch {
    // Graceful offline fallback
  }
  return null;
}

export function getSupabaseAnonKey(): string {
  // 1. Chave verificada recebida do servidor via /api/auth/config (resolve inversão de chaves)
  if (runtimePublishableKey) return runtimePublishableKey;

  // 2. Chave armazenada localmente se houver
  if (typeof window !== 'undefined') {
    try {
      const stored = cleanEnvKey(localStorage.getItem(LOCAL_STORAGE_ANON_KEY));
      if (stored) return stored;
    } catch {}
  }

  // 3. Chave do ambiente Vite
  const envKey = cleanEnvKey(
    import.meta.env.VITE_SUPABASE_ANON_KEY as string
  );

  if (envKey) return envKey;

  return '';
}

export function saveStoredAnonKey(key: string): void {
  try {
    const cleaned = cleanEnvKey(key);
    if (!cleaned) {
      localStorage.removeItem(LOCAL_STORAGE_ANON_KEY);
    } else {
      localStorage.setItem(LOCAL_STORAGE_ANON_KEY, cleaned);
    }
    // Invalidate cached client to recreate with new key
    cachedClient = null;
    lastUsedAnonKey = null;
    lastUsedUrl = null;
  } catch {}
}

let cachedClient: SupabaseClient | null = null;
let lastUsedAnonKey: string | null = null;
let lastUsedUrl: string | null = null;

export function getSupabase(): SupabaseClient | null {
  const anonKey = getSupabaseAnonKey();
  const targetUrl = getSupabaseUrl();

  if (!anonKey || !targetUrl) {
    cachedClient = null;
    lastUsedAnonKey = null;
    lastUsedUrl = null;
    return null;
  }

  if (!cachedClient || lastUsedAnonKey !== anonKey || lastUsedUrl !== targetUrl) {
    try {
      cachedClient = createClient(targetUrl, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        }
      });
      lastUsedAnonKey = anonKey;
      lastUsedUrl = targetUrl;
    } catch (err) {
      console.error('[Supabase Client] Falha na inicialização do cliente:', err);
      return null;
    }
  }

  return cachedClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseAnonKey());
}

export interface SupabaseAuthDiagnostics {
  hasSupabaseUrl: boolean;
  hasSupabaseAnonKey: boolean;
  isClientInitialized: boolean;
  urlDomain: string;
  keyPrefix: string;
  keyLength: number;
}

/**
 * Diagnóstico seguro: informa apenas a existência das variáveis (true/false),
 * domínio, prefixo (ex: 'sb_publishable_...') e tamanho da chave em caracteres,
 * SEM NUNCA expor o valor completo ou segredos.
 */
export function getSupabaseDiagnostics(): SupabaseAuthDiagnostics {
  const key = getSupabaseAnonKey();
  let domain = 'não configurado';
  try {
    if (SUPABASE_URL) {
      domain = new URL(SUPABASE_URL).hostname;
    }
  } catch {
    domain = 'inválido';
  }

  let prefix = 'nenhum';
  if (key) {
    if (key.startsWith('sb_publishable_')) {
      prefix = 'sb_publishable_...';
    } else if (key.startsWith('sb_secret_')) {
      prefix = 'sb_secret_...';
    } else if (key.startsWith('eyJ')) {
      prefix = 'jwt_legacy (eyJ...)';
    } else {
      prefix = key.slice(0, 10) + '...';
    }
  }

  return {
    hasSupabaseUrl: Boolean(SUPABASE_URL && SUPABASE_URL.trim()),
    hasSupabaseAnonKey: Boolean(key && key.trim()),
    isClientInitialized: Boolean(getSupabase()),
    urlDomain: domain,
    keyPrefix: prefix,
    keyLength: key ? key.length : 0,
  };
}

/**
 * Teste seguro de ping em runtime contra a API de autenticação do Supabase.
 * Retorna status e mensagem de erro traduzida sem expor tokens ou credenciais.
 */
export async function verifySupabaseConnection(): Promise<{
  ok: boolean;
  status: number;
  message: string;
}> {
  const key = getSupabaseAnonKey();
  if (!key || !SUPABASE_URL) {
    return {
      ok: false,
      status: 0,
      message: 'Chave ou URL do Supabase não configurada.',
    };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      method: 'GET',
      headers: {
        apikey: key,
      },
    });

    if (res.ok) {
      return { ok: true, status: res.status, message: 'Conexão ativa e chave aceita pelo Supabase!' };
    }

    const text = await res.text();
    let msg = `Erro HTTP ${res.status}`;
    try {
      const parsed = JSON.parse(text);
      if (parsed.message) msg = parsed.message;
    } catch {}

    return { ok: false, status: res.status, message: msg };
  } catch (err: any) {
    return { ok: false, status: 0, message: err?.message || 'Falha na conexão de rede.' };
  }
}

// Log seguro em runtime no navegador para verificação rápida no console
if (typeof window !== 'undefined') {
  try {
    const diag = getSupabaseDiagnostics();
    console.info('[LEVE Supabase Auth Diagnostic]', {
      hasSupabaseUrl: diag.hasSupabaseUrl,
      hasSupabaseAnonKey: diag.hasSupabaseAnonKey,
      keyPrefix: diag.keyPrefix,
      keyLength: diag.keyLength,
      isClientInitialized: diag.isClientInitialized,
      urlDomain: diag.urlDomain,
    });
  } catch {}
}

// --------------------------------------------------------
// Auth Actions
// --------------------------------------------------------

export async function supabaseSignUp(
  email: string, 
  password: string, 
  name?: string,
  treatmentPreference: TreatmentPreference = 'nao_informar',
  avatar?: string
) {
  const client = getSupabase();
  if (!client) {
    const diag = getSupabaseDiagnostics();
    console.warn('[Supabase Auth] Cadastro sem cliente inicializado:', diag);
    return {
      data: null,
      error: new Error(
        !diag.hasSupabaseAnonKey
          ? 'Serviço de autenticação temporariamente indisponível (chave não detectada).'
          : 'Serviço de autenticação temporariamente indisponível.'
      )
    };
  }

  const normalizedPref = normalizeTreatmentPreference(treatmentPreference);
  const cleanEmail = email.trim().toLowerCase();
  const cleanAvatar = avatar ? avatar.trim() : '';

  try {
    const res = await client.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: name ? name.trim() : '',
          full_name: name ? name.trim() : '',
          avatar: cleanAvatar,
          treatment_preference: normalizedPref
        }
      }
    });

    // Se o usuário foi criado, vincular diretamente à tabela profiles
    if (res.data?.user) {
      try {
        await saveUserProfileToSupabase(res.data.user.id, {
          name: name ? name.trim() : '',
          full_name: name ? name.trim() : '',
          avatar: cleanAvatar,
          treatment_preference: normalizedPref
        });
      } catch {}
    }

    return res;
  } catch (err: any) {
    console.error('[Supabase Auth] Exceção em signUp:', err);
    return { data: null, error: err };
  }
}

export async function supabaseSignIn(email: string, password: string) {
  const client = getSupabase();
  if (!client) {
    const diag = getSupabaseDiagnostics();
    console.warn('[Supabase Auth] Login sem cliente inicializado:', diag);
    return {
      data: null,
      error: new Error(
        !diag.hasSupabaseAnonKey
          ? 'Serviço de autenticação temporariamente indisponível (chave não detectada).'
          : 'Serviço de autenticação temporariamente indisponível.'
      )
    };
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const res = await client.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    return res;
  } catch (err: any) {
    console.error('[Supabase Auth] Exceção em signInWithPassword:', err);
    return { data: null, error: err };
  }
}

export async function supabaseSignOut() {
  const client = getSupabase();
  if (!client) return { error: null };

  try {
    return await client.auth.signOut();
  } catch (err: any) {
    return { error: err };
  }
}

export async function supabaseResetPassword(email: string) {
  const client = getSupabase();
  if (!client) {
    const diag = getSupabaseDiagnostics();
    console.warn('[Supabase Auth] Recuperação de senha sem cliente inicializado:', diag);
    return {
      data: null,
      error: new Error(
        !diag.hasSupabaseAnonKey
          ? 'Serviço de autenticação temporariamente indisponível (chave não detectada).'
          : 'Serviço de autenticação temporariamente indisponível.'
      )
    };
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const redirectUrl = window.location.origin;
    const res = await client.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl
    });
    return res;
  } catch (err: any) {
    console.error('[Supabase Auth] Exceção em resetPasswordForEmail:', err);
    return { data: null, error: err };
  }
}

export async function supabaseUpdatePassword(newPassword: string) {
  const client = getSupabase();
  if (!client) {
    const diag = getSupabaseDiagnostics();
    console.warn('[Supabase Auth] Atualização de senha sem cliente inicializado:', diag);
    return {
      data: null,
      error: new Error(
        !diag.hasSupabaseAnonKey
          ? 'Serviço de autenticação temporariamente indisponível (chave não detectada).'
          : 'Serviço de autenticação temporariamente indisponível.'
      )
    };
  }

  try {
    return await client.auth.updateUser({
      password: newPassword
    });
  } catch (err: any) {
    console.error('[Supabase Auth] Exceção em updateUser password:', err);
    return { data: null, error: err };
  }
}

export async function supabaseGetSession(): Promise<Session | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data } = await client.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}

export async function supabaseGetUser(): Promise<User | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data } = await client.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
}

export function onSupabaseAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  const client = getSupabase();
  if (!client) {
    return { unsubscribe: () => {} };
  }

  const { data: { subscription } } = client.auth.onAuthStateChange(callback);
  return {
    unsubscribe: () => {
      subscription.unsubscribe();
    }
  };
}

// --------------------------------------------------------
// Cloud Database Syncing (PostgreSQL via Supabase)
// --------------------------------------------------------

/**
 * Saves or updates user application data in the multi-device cloud store and Supabase.
 * Fallback to local storage is always maintained.
 */
export async function syncUserDataToSupabase(
  userId: string, 
  data: AppData, 
  userEmail?: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId && !userEmail) {
    return { success: false, error: 'Usuário não autenticado ou e-mail ausente.' };
  }

  let cloudSuccess = false;

  // 1. Sincroniza diretamente na nuvem central para múltiplos dispositivos
  try {
    const cloudRes = await pushAppDataToCloud(data, { email: userEmail, userId });
    if (cloudRes.success) {
      cloudSuccess = true;
    }
  } catch (cloudErr) {
    console.warn('[syncUserData] Falha ao enviar para cloud sync store:', cloudErr);
  }

  // 2. Tenta também sincronizar no Supabase se houver conexão e tabela
  const client = getSupabase();
  if (client && userId) {
    try {
      const payload = {
        user_id: userId,
        data: data,
        updated_at: new Date().toISOString()
      };

      const { error } = await client
        .from('leve_user_data')
        .upsert(payload, { onConflict: 'user_id' });

      if (!error) {
        cloudSuccess = true;
      }
    } catch {}
  }

  return { success: cloudSuccess || true };
}

/**
 * Fetches user data from cloud sync store or Supabase for the authenticated user/email.
 */
export async function fetchUserDataFromSupabase(
  userId: string, 
  userEmail?: string,
  since = 0
): Promise<{ data: AppData | null; error?: string }> {
  if (!userId && !userEmail) {
    return { data: null, error: 'Usuário não autenticado' };
  }

  // 1. Tentar carregar do cloud sync store multi-dispositivo
  try {
    const cloudRes = await pullAppDataFromCloud({ email: userEmail, userId }, since);
    if (cloudRes.hasUpdates && cloudRes.data) {
      return { data: cloudRes.data };
    }
  } catch (err) {
    console.warn('[fetchUserData] Falha ao puxar da nuvem:', err);
  }

  // 2. Fallback para tabela Supabase se existir
  const client = getSupabase();
  if (client && userId) {
    try {
      const { data, error } = await client
        .from('leve_user_data')
        .select('data')
        .eq('user_id', userId)
        .maybeSingle();

      if (data && data.data) {
        return { data: data.data as AppData };
      }
    } catch {}
  }

  return { data: null };
}

/**
 * Dedicated sync for Minha Vida categories with Supabase.
 * Respects RLS - each record is strictly constrained by user_id = auth.uid().
 */
export async function syncMyLifeToSupabase(userId: string, myLife: MyLifeData): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client || !userId) {
    return { success: false, error: 'Usuário não autenticado ou Supabase indisponível.' };
  }

  try {
    // 1. Sync directly to leve_user_data JSON structure (primary single source of truth)
    // First retrieve current user data to avoid wiping other fields
    const { data: current } = await client
      .from('leve_user_data')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle();

    const mergedData = {
      ...(current?.data || {}),
      myLife
    };

    const { error } = await client
      .from('leve_user_data')
      .upsert({
        user_id: userId,
        data: mergedData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.warn('Erro ao sincronizar Minha Vida com Supabase:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Exceção ao sincronizar Minha Vida:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetches Minha Vida items from Supabase for the authenticated user.
 */
export async function fetchMyLifeFromSupabase(userId: string): Promise<{ data: MyLifeData | null; error?: string }> {
  const client = getSupabase();
  if (!client || !userId) {
    return { data: null, error: 'Usuário não conectado ao Supabase' };
  }

  try {
    const { data, error } = await client
      .from('leve_user_data')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (data?.data?.myLife) {
      return { data: data.data.myLife as MyLifeData };
    }

    return { data: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

// --------------------------------------------------------
// User Entitlements & Access Control (user_entitlements)
// --------------------------------------------------------

export interface UserEntitlements {
  id?: string;
  user_id?: string;
  email?: string;
  plan_name?: string;
  leve_gratuito: boolean;
  'leve gratuito'?: boolean;
  leve_especial: boolean;
  'leve especial'?: boolean;
  leve_vip: boolean;
  'leve vip'?: boolean;
  lia_access: boolean;
  hotmart_status?: string;
  hotmart_transaction_id?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

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

/**
 * Consulta a tabela `user_entitlements` com a sessão autenticada atual:
 * - Utiliza auth.uid() / session.user.id da sessão ativa
 * - Utiliza o token JWT de autorização Bearer da sessão atual
 * - `leve_vip === true` (ou `lia_access === true`): Libera todas as áreas + LEVIA
 * - `leve_especial === true`: Libera todas as áreas, exceto LEVIA
 * - `leve_gratuito === true`: Acesso somente ao "Meu Dia"
 */
export async function fetchUserEntitlements(
  userId?: string,
  providedSession?: Session | null
): Promise<{ data: UserEntitlements | null; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { data: null, error: 'Cliente Supabase não configurado.' };
  }

  try {
    // 1. Obter a sessão ativa e o token JWT válido
    let session: Session | null = providedSession || null;
    if (!session) {
      const { data: sessData } = await client.auth.getSession();
      session = sessData?.session || null;
    }

    // Se o token estiver prestes a expirar ou ausente, renova a sessão
    if (session) {
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      if (expiresAt && Date.now() >= expiresAt - 30000) {
        try {
          const { data: refreshData } = await client.auth.refreshSession();
          if (refreshData?.session) {
            session = refreshData.session;
          }
        } catch {}
      }
    } else {
      try {
        const { data: refreshData } = await client.auth.refreshSession();
        if (refreshData?.session) {
          session = refreshData.session;
        }
      } catch {}
    }

    let authUser: User | null = session?.user || null;
    if (!authUser) {
      const { data: userData } = await client.auth.getUser();
      authUser = userData?.user || null;
    }

    const effectiveUserId = authUser?.id || session?.user?.id || userId;
    const userEmail = authUser?.email || session?.user?.email;
    const accessToken = session?.access_token;
    const anonKey = getSupabaseAnonKey();

    if (!effectiveUserId) {
      return { data: null, error: 'Nenhum usuário autenticado encontrado.' };
    }

    let rows: any[] = [];
    let lastError: any = null;

    // ESTRATÉGIA 1: Consulta via Supabase Client padrão com filtro por user_id = auth.uid() / session.user.id
    try {
      const qUser = await client
        .from('user_entitlements')
        .select('*')
        .eq('user_id', effectiveUserId);

      if (qUser.data && qUser.data.length > 0) {
        rows = qUser.data;
      } else if (qUser.error) {
        lastError = qUser.error;
      }
    } catch (e: any) {
      lastError = e;
    }

    // ESTRATÉGIA 2: Consulta via PostgREST direto com header Authorization: Bearer <accessToken>
    // Isso garante que o Postgres receba o JWT da sessão autenticada atual para que auth.uid() funcione
    if (rows.length === 0 && accessToken && SUPABASE_URL) {
      const endpointsToTry = [
        `${SUPABASE_URL}/rest/v1/user_entitlements?select=*&user_id=eq.${effectiveUserId}`,
        `${SUPABASE_URL}/rest/v1/user_entitlements?select=*&id=eq.${effectiveUserId}`
      ];
      if (userEmail) {
        endpointsToTry.push(`${SUPABASE_URL}/rest/v1/user_entitlements?select=*&email=eq.${encodeURIComponent(userEmail)}`);
      }
      // Consulta aberta onde a política RLS avalia auth.uid() da sessão
      endpointsToTry.push(`${SUPABASE_URL}/rest/v1/user_entitlements?select=*`);

      for (const endpoint of endpointsToTry) {
        if (rows.length > 0) break;
        try {
          const resp = await fetch(endpoint, {
            headers: {
              'apikey': anonKey,
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          if (resp.ok) {
            const data = await resp.json();
            if (Array.isArray(data) && data.length > 0) {
              rows = data;
              break;
            }
          }
        } catch (err: any) {
          if (!lastError) lastError = err;
        }
      }
    }

    // ESTRATÉGIA 3: Consulta via Supabase Client por id ou email
    if (rows.length === 0) {
      try {
        const qId = await client
          .from('user_entitlements')
          .select('*')
          .eq('id', effectiveUserId);

        if (qId.data && qId.data.length > 0) {
          rows = qId.data;
        }
      } catch {}
    }

    if (rows.length === 0 && userEmail) {
      try {
        const qEmail = await client
          .from('user_entitlements')
          .select('*')
          .eq('email', userEmail);

        if (qEmail.data && qEmail.data.length > 0) {
          rows = qEmail.data;
        }
      } catch {}
    }

    // ESTRATÉGIA 4: Consulta aberta via client (RLS da sessão atual)
    if (rows.length === 0) {
      try {
        const qRls = await client
          .from('user_entitlements')
          .select('*');

        if (qRls.data && qRls.data.length > 0) {
          rows = qRls.data;
        }
      } catch {}
    }

    if (rows.length === 0) {
      // 1. Tentar verificar via API do servidor (que consulta store de compras Hotmart e Auth Admin)
      try {
        const queryParams = new URLSearchParams();
        if (userEmail) queryParams.set('email', userEmail);
        if (effectiveUserId) queryParams.set('userId', effectiveUserId);
        const serverRes = await fetch(`/api/user/entitlements?${queryParams.toString()}`);
        if (serverRes.ok) {
          const serverData = await serverRes.json();
          if (serverData && (serverData.plan_name === 'vip' || serverData.plan_name === 'especial')) {
            const serverEntitlements: UserEntitlements = {
              user_id: effectiveUserId,
              email: userEmail || '',
              plan_name: serverData.plan_name,
              leve_gratuito: serverData.leve_gratuito,
              'leve gratuito': serverData['leve gratuito'],
              leve_especial: serverData.leve_especial,
              'leve especial': serverData['leve especial'],
              leve_vip: serverData.leve_vip,
              'leve vip': serverData.leve_vip,
              lia_access: serverData.lia_access,
              hotmart_status: serverData.hotmart_status || 'approved'
            };
            return { data: serverEntitlements };
          }
        }
      } catch {}

      // 2. Verificar nos metadados do próprio usuário autenticado
      const meta = authUser?.user_metadata || {};
      const appMeta = authUser?.app_metadata || {};
      const isVip = meta.plan === 'vip' || meta.plan_name === 'vip' || meta.leve_vip === true || appMeta.leve_vip === true;
      const isSpecial = !isVip && (meta.plan === 'especial' || meta.plan_name === 'especial' || meta.leve_especial === true || appMeta.leve_especial === true);

      if (isVip || isSpecial) {
        const metaEntitlements: UserEntitlements = {
          user_id: effectiveUserId,
          email: userEmail || '',
          plan_name: isVip ? 'vip' : 'especial',
          leve_gratuito: false,
          'leve gratuito': false,
          leve_especial: isSpecial,
          'leve especial': isSpecial,
          leve_vip: isVip,
          'leve vip': isVip,
          lia_access: isVip,
          hotmart_status: 'approved'
        };
        return { data: metaEntitlements };
      }

      // Usuário autenticado sem registro em user_entitlements:
      // O app reconhece como Gratuito em memória SEM fazer inserção automática no banco,
      // garantindo controle manual absoluto da administradora e evitando sobrescritas acidentais.
      const defaultFree: UserEntitlements = {
        user_id: effectiveUserId,
        email: userEmail || '',
        plan_name: 'gratuito',
        leve_gratuito: true,
        'leve gratuito': true,
        leve_especial: false,
        'leve especial': false,
        leve_vip: false,
        'leve vip': false,
        lia_access: false,
        hotmart_status: 'gratuito'
      };

      return { data: defaultFree };
    }

    // Prioriza linha com permissão ativa (VIP > Especial > Gratuito)
    const activeRow = rows.find(r => {
      const plan = extractPlanFromRow(r);
      return plan.isVip;
    }) || rows.find(r => {
      const plan = extractPlanFromRow(r);
      return plan.isSpecial;
    }) || rows[0];

    // Se o registro foi localizado por e-mail mas ainda não estava vinculado ao user_id atual,
    // associa automaticamente a compra à conta criada posteriormente (sem exigir ação do admin)
    if (activeRow.id && effectiveUserId && (!activeRow.user_id || activeRow.user_id !== effectiveUserId)) {
      client
        .from('user_entitlements')
        .update({ user_id: effectiveUserId, updated_at: new Date().toISOString() })
        .eq('id', activeRow.id)
        .then(
          ({ error }: any) => {
            if (!error) {
              console.log('[Supabase Entitlements] Compra Hotmart vinculada automaticamente ao usuário criado:', effectiveUserId);
            }
          },
          () => {}
        );
    }

    // Extração rigorosa respeitando as regras manuais da administradora
    const planInfo = extractPlanFromRow(activeRow);

    const entitlements: UserEntitlements = {
      ...activeRow,
      id: activeRow.id,
      user_id: activeRow.user_id || effectiveUserId,
      email: activeRow.email || userEmail,
      plan_name: planInfo.planName,
      leve_gratuito: planInfo.isGratuito,
      'leve gratuito': planInfo.isGratuito,
      leve_especial: planInfo.isSpecial,
      'leve especial': planInfo.isSpecial,
      leve_vip: planInfo.isVip,
      'leve vip': planInfo.isVip,
      lia_access: planInfo.isVip,
      hotmart_status: activeRow.hotmart_status || (planInfo.isVip || planInfo.isSpecial ? 'approved' : 'gratuito'),
      hotmart_transaction_id: activeRow.hotmart_transaction_id
    };

    return { data: entitlements };
  } catch (err: any) {
    console.error('Exceção ao consultar user_entitlements:', err);
    return { data: null, error: err.message || 'Erro de conexão' };
  }
}

/**
 * Consulta o perfil do usuário gerado pelo trigger no banco (tabela profiles)
 * Se o usuário não tiver preferência cadastrada, retorna 'neutro' por padrão.
 * Nunca tenta adivinhar o gênero pelo nome.
 */
export async function fetchUserProfile(userId: string): Promise<{ data: any | null; error?: string }> {
  const client = getSupabase();
  if (!client || !userId) return { data: null };

  // 0. Cache local como fallback confiável
  let cachedPref: TreatmentPreference | null = null;
  try {
    const local = localStorage.getItem('leve_treatment_pref_' + userId) || localStorage.getItem('leve_treatment_pref_current');
    if (local) cachedPref = normalizeTreatmentPreference(local);
  } catch {}

  try {
    let res = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!res.data) {
      const alt = await client
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (alt.data) res = alt;
    }

    if (res.data) {
      const pref = normalizeTreatmentPreference(res.data.treatment_preference || cachedPref);
      return {
        data: {
          ...res.data,
          avatar: res.data.avatar || '',
          treatment_preference: pref
        }
      };
    }

    // Se a linha em profiles ainda não existir, verifica metadados de auth
    const { data: authUserData } = await client.auth.getUser();
    if (authUserData?.user && authUserData.user.id === userId) {
      const meta = authUserData.user.user_metadata || {};
      const pref = normalizeTreatmentPreference(meta.treatment_preference || cachedPref);
      return {
        data: {
          id: userId,
          user_id: userId,
          name: meta.name || meta.full_name || '',
          full_name: meta.full_name || meta.name || '',
          avatar: meta.avatar || '',
          treatment_preference: pref
        }
      };
    }

    if (cachedPref) {
      return {
        data: {
          id: userId,
          user_id: userId,
          name: '',
          full_name: '',
          avatar: '',
          treatment_preference: cachedPref
        }
      };
    }

    return { data: null };
  } catch (err: any) {
    if (cachedPref) {
      return {
        data: {
          id: userId,
          user_id: userId,
          name: '',
          full_name: '',
          avatar: '',
          treatment_preference: cachedPref
        }
      };
    }
    return { data: null, error: err.message };
  }
}

/**
 * Salva a preferência de tratamento e perfil diretamente no Supabase.
 * Salva na tabela `profiles` vinculada ao auth.uid() e respeitando RLS.
 * Também mantém os metadados de autenticação sincronizados.
 */
export async function saveUserProfileToSupabase(
  userId: string,
  profile: {
    name?: string;
    full_name?: string;
    avatar?: string;
    treatment_preference?: TreatmentPreference;
  }
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client || !userId) {
    return { success: false, error: 'Usuário não autenticado ou Supabase desconectado.' };
  }

  const treatment_preference = normalizeTreatmentPreference(profile.treatment_preference);
  const name = profile.name?.trim() || '';
  const fullName = profile.full_name?.trim() || name;
  const avatar = profile.avatar?.trim() || '';

  // Persistir em cache local imediatamente para resiliência instantânea
  try {
    localStorage.setItem('leve_treatment_pref_' + userId, treatment_preference);
    localStorage.setItem('leve_treatment_pref_current', treatment_preference);
    if (name) {
      localStorage.setItem('leve_user_name', name);
    }
    if (avatar) {
      localStorage.setItem('leve_user_avatar', avatar);
    }
  } catch {}

  let authUpdated = false;

  // 1. Atualizar user_metadata no Supabase Auth para a conta (funciona nativamente sem depender de tabelas)
  try {
    const metaPayload: Record<string, any> = {
      treatment_preference
    };
    if (name) {
      metaPayload.name = name;
      metaPayload.full_name = fullName;
    }
    if (avatar) {
      metaPayload.avatar = avatar;
    }

    const { error: authErr } = await client.auth.updateUser({
      data: metaPayload
    });
    if (!authErr) authUpdated = true;
  } catch (e) {
    console.warn('[Supabase Auth] Aviso ao atualizar user_metadata:', e);
  }

  // 2. Upsert na tabela profiles respeitando RLS se a tabela existir
  try {
    const profilePayload: Record<string, any> = {
      id: userId,
      user_id: userId,
      treatment_preference: treatment_preference,
      updated_at: new Date().toISOString()
    };
    if (name) {
      profilePayload.name = name;
      profilePayload.full_name = fullName;
    }
    if (avatar) {
      profilePayload.avatar = avatar;
    }

    const { error } = await client
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' });

    if (error) {
      // Tentativa alternativa com conflito por user_id caso a chave primária seja diferente
      await client
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'user_id' });
    }
  } catch (e: any) {
    console.warn('[Supabase Profiles] Aviso ao persistir tabela profiles:', e);
  }

  return { success: true };
}
