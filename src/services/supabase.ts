// Serviço de integração Supabase - LEVE
import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { AppData } from '../types';

export const SUPABASE_URL: string = 
  (import.meta.env.VITE_SUPABASE_URL as string)?.trim() || 
  'https://ozzlnqlhrythvjdrdgwe.supabase.co';

const LOCAL_STORAGE_ANON_KEY = 'leve_supabase_anon_key';

function cleanEnvKey(raw?: string | null): string {
  if (!raw) return '';
  let cleaned = String(raw).trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

export function getSupabaseAnonKey(): string {
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
  } catch {}
}

let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const anonKey = getSupabaseAnonKey();
  if (!anonKey) {
    return null;
  }

  if (!cachedClient) {
    try {
      cachedClient = createClient(SUPABASE_URL, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage
        }
      });
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
}

/**
 * Diagnóstico seguro: informa apenas a existência das variáveis (true/false) e
 * o domínio público, sem nunca expor chaves ou valores sensíveis.
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

  return {
    hasSupabaseUrl: Boolean(SUPABASE_URL && SUPABASE_URL.trim()),
    hasSupabaseAnonKey: Boolean(key && key.trim()),
    isClientInitialized: Boolean(getSupabase()),
    urlDomain: domain,
  };
}

// Log seguro em runtime no navegador para verificação rápida no console
if (typeof window !== 'undefined') {
  try {
    const diag = getSupabaseDiagnostics();
    console.info('[LEVE Supabase Auth Diagnostic]', {
      hasSupabaseUrl: diag.hasSupabaseUrl,
      hasSupabaseAnonKey: diag.hasSupabaseAnonKey,
      isClientInitialized: diag.isClientInitialized,
      urlDomain: diag.urlDomain,
    });
  } catch {}
}

// --------------------------------------------------------
// Auth Actions
// --------------------------------------------------------

export async function supabaseSignUp(email: string, password: string, name?: string) {
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

  try {
    const res = await client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name ? name.trim() : '',
          full_name: name ? name.trim() : ''
        }
      }
    });
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

  try {
    const res = await client.auth.signInWithPassword({
      email: email.trim(),
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

  try {
    const redirectUrl = window.location.origin;
    const res = await client.auth.resetPasswordForEmail(email.trim(), {
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
 * Saves or updates user application data in Supabase table `leve_user_data`.
 * Fallback to local storage is always maintained.
 */
export async function syncUserDataToSupabase(userId: string, data: AppData): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client || !userId) {
    return { success: false, error: 'Usuário não autenticado ou Supabase desconectado.' };
  }

  try {
    // Attempt upsert in table `leve_user_data`
    const payload = {
      user_id: userId,
      data: data,
      updated_at: new Date().toISOString()
    };

    const { error } = await client
      .from('leve_user_data')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      // If table doesn't exist yet, we log friendly guidance so app doesn't break
      console.warn('Supabase sync note: table leve_user_data may not exist yet or RLS policy pending.', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Could not sync to Supabase:', err);
    return { success: false, error: err.message || 'Erro de conexão' };
  }
}

/**
 * Fetches user data from Supabase for the authenticated user.
 */
export async function fetchUserDataFromSupabase(userId: string): Promise<{ data: AppData | null; error?: string }> {
  const client = getSupabase();
  if (!client || !userId) {
    return { data: null, error: 'Supabase não conectado' };
  }

  try {
    const { data, error } = await client
      .from('leve_user_data')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch note:', error.message);
      return { data: null, error: error.message };
    }

    if (data && data.data) {
      return { data: data.data as AppData };
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
  leve_access: boolean;
  special_access: boolean;
  lia_access: boolean;
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
 * - `leve_access === true` ou `special_access === true`: Libera o LEVE completo
 * - `lia_access === true`: Libera a assistente Lia
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
      return { data: null, error: lastError?.message || 'Nenhum registro de permissão encontrado.' };
    }

    // Identificar e consolidar permissões ativas
    const activeRow = rows.find(r => 
      parseBoolean(r.leve_access ?? r.leveAccess ?? r.leve) ||
      parseBoolean(r.special_access ?? r.specialAccess ?? r.special) ||
      parseBoolean(r.lia_access ?? r.liaAccess ?? r.lia)
    ) || rows[0];

    // Se houver múltiplos registros vinculados à conta, consolida os acessos concedidos
    const hasLeve = rows.some(r => parseBoolean(r.leve_access ?? r.leveAccess ?? r.leve));
    const hasSpecial = rows.some(r => parseBoolean(r.special_access ?? r.specialAccess ?? r.special));
    const hasLia = rows.some(r => parseBoolean(r.lia_access ?? r.liaAccess ?? r.lia));

    const entitlements: UserEntitlements = {
      ...activeRow,
      id: activeRow.id,
      user_id: activeRow.user_id || effectiveUserId,
      leve_access: hasLeve,
      special_access: hasSpecial,
      lia_access: hasLia
    };

    return { data: entitlements };
  } catch (err: any) {
    console.error('Exceção ao consultar user_entitlements:', err);
    return { data: null, error: err.message || 'Erro de conexão' };
  }
}

/**
 * Consulta o perfil do usuário gerado pelo trigger no banco (tabela profiles)
 */
export async function fetchUserProfile(userId: string): Promise<{ data: any | null; error?: string }> {
  const client = getSupabase();
  if (!client || !userId) return { data: null };

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

    return { data: res.data || null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}
