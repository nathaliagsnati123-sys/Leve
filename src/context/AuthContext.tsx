// Contexto de Autenticação e Sincronização Supabase - LEVE
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import {
  isSupabaseConfigured,
  getSupabaseAnonKey,
  saveStoredAnonKey,
  supabaseSignIn,
  supabaseSignUp,
  supabaseSignOut,
  supabaseResetPassword,
  supabaseGetSession,
  supabaseGetUser,
  onSupabaseAuthStateChange,
  syncUserDataToSupabase,
  fetchUserDataFromSupabase,
  getSupabase,
  fetchUserEntitlements,
  fetchUserProfile,
  saveUserProfileToSupabase,
  parseBoolean,
  UserEntitlements,
  SUPABASE_URL,
  getSupabaseDiagnostics,
  SupabaseAuthDiagnostics,
  fetchServerAuthConfig
} from '../services/supabase';
import { AppData, TreatmentPreference } from '../types';
import { translateAuthError } from '../utils/authErrors';
import { normalizeTreatmentPreference } from '../utils/treatment';
import { saveRememberedEmail, getRememberedEmail, markPresentationCompleted } from '../services/storage';
import {
  PlanTier,
  AppFeature,
  determineUserPlan,
  canAccess,
  getPlanLabel,
  PLAN_LABELS
} from '../services/authorization';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'local-only';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  diagnostics: SupabaseAuthDiagnostics;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authTab: 'login' | 'signup' | 'reset';
  setAuthTab: (tab: 'login' | 'signup' | 'reset') => void;
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  supabaseUrl: string;
  anonKey: string;
  saveAnonKey: (key: string) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name?: string, treatmentPreference?: TreatmentPreference, avatar?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  syncDataNow: (data: AppData) => Promise<boolean>;
  pullCloudData: (since?: number) => Promise<AppData | null>;
  confirmUserEmail: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  resendConfirmation: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;

  // Entitlements & Access Control (user_entitlements)
  entitlements: UserEntitlements | null;
  isCheckingEntitlements: boolean;
  plan: PlanTier;
  planLabel: string;
  canAccessFeature: (feature: AppFeature | string) => boolean;
  hasLeveAccess: boolean; // special ou vip
  hasLiaAccess: boolean; // somente vip
  refreshEntitlements: () => Promise<UserEntitlements | null>;
  userProfile: any | null;
  treatmentPreference: TreatmentPreference;
  updateTreatmentPreference: (preference: TreatmentPreference) => Promise<boolean>;
  saveProfile: (profile: { name?: string; full_name?: string; avatar?: string; treatment_preference?: TreatmentPreference }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(isSupabaseConfigured());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup' | 'reset'>('login');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(isSupabaseConfigured() ? 'offline' : 'local-only');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [anonKey, setAnonKey] = useState<string>(getSupabaseAnonKey());

  // User Entitlements & Profile State
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);
  const [isCheckingEntitlements, setIsCheckingEntitlements] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [localTreatmentPref, setLocalTreatmentPref] = useState<TreatmentPreference | null>(() => {
    try {
      const cached = localStorage.getItem('leve_treatment_pref_current');
      if (cached) return normalizeTreatmentPreference(cached);
    } catch {}
    return null;
  });

  const loadEntitlements = useCallback(async (userId?: string, activeSession?: Session | null): Promise<UserEntitlements | null> => {
    setIsCheckingEntitlements(true);
    try {
      // 1. Primeira consulta usando a sessão autenticada atual (auth.uid() / session.user.id)
      let res = await fetchUserEntitlements(userId, activeSession);

      // 2. Se não retornou dados imediatamente, tenta mais uma vez após uma breve espera
      if (!res.data) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        res = await fetchUserEntitlements(userId, activeSession);
      }

      if (res.data) {
        setEntitlements(res.data);
        return res.data;
      } else {
        setEntitlements(null);
        return null;
      }
    } catch (err) {
      console.error('Erro ao carregar permissões:', err);
      setEntitlements(null);
      return null;
    } finally {
      setIsCheckingEntitlements(false);
    }
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const res = await fetchUserProfile(userId);
      if (res.data) {
        setUserProfile(res.data);
        if (res.data.name && res.data.name.trim()) {
          try {
            localStorage.setItem('leve_user_name', res.data.name.trim());
          } catch {}
        }
        if (res.data.avatar && res.data.avatar.trim()) {
          try {
            localStorage.setItem('leve_user_avatar', res.data.avatar.trim());
          } catch {}
        }
        if (res.data.treatment_preference) {
          const pref = normalizeTreatmentPreference(res.data.treatment_preference);
          setLocalTreatmentPref(pref);
          try {
            localStorage.setItem('leve_treatment_pref_' + userId, pref);
            localStorage.setItem('leve_treatment_pref_current', pref);
          } catch {}
        }
      }
    } catch {}
  }, []);

  // Check current session on mount and subscribe to auth state changes
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      setIsLoading(true);
      try {
        await fetchServerAuthConfig();
      } catch {}

      const configured = isSupabaseConfigured();
      setIsConfigured(configured);

      if (!configured) {
        setIsLoading(false);
        setSyncStatus('local-only');
        return;
      }

      try {
        // Handle confirmation link parameters from email (code or token_hash)
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');
          const tokenHash = urlParams.get('token_hash');
          const otpType = (urlParams.get('type') as any) || 'signup';
          const client = getSupabase();

          if (code && client) {
            try {
              await client.auth.exchangeCodeForSession(code);
              window.history.replaceState({}, document.title, window.location.pathname);
            } catch (exchangeErr) {
              console.warn('[AuthContext] Erro ao trocar code por sessão:', exchangeErr);
            }
          } else if (tokenHash && client) {
            try {
              await client.auth.verifyOtp({ token_hash: tokenHash, type: otpType });
              window.history.replaceState({}, document.title, window.location.pathname);
            } catch (otpErr) {
              console.warn('[AuthContext] Erro ao validar OTP token_hash:', otpErr);
            }
          }
        }

        const currentSession = await supabaseGetSession();
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user || null);
          setSyncStatus(currentSession?.user ? 'synced' : 'local-only');
          if (currentSession?.user) {
            if (currentSession.user.email) {
              saveRememberedEmail(currentSession.user.email);
            }
            markPresentationCompleted();
            await Promise.all([
              loadEntitlements(currentSession.user.id, currentSession),
              loadProfile(currentSession.user.id)
            ]);
          }
        }
      } catch (err) {
        console.error('Error checking Supabase session:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // Subscribe to auth events (SIGNED_IN, SIGNED_OUT, PASSWORD_RECOVERY, TOKEN_REFRESHED)
    const { unsubscribe } = onSupabaseAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user || null);
      if (newSession?.user) {
        if (newSession.user.email) {
          saveRememberedEmail(newSession.user.email);
        }
        markPresentationCompleted();
        setSyncStatus('synced');
        await Promise.all([
          loadEntitlements(newSession.user.id, newSession),
          loadProfile(newSession.user.id)
        ]);
      } else {
        setSyncStatus('local-only');
        setEntitlements(null);
        setUserProfile(null);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [loadEntitlements, loadProfile]);

  const handleSaveAnonKey = useCallback((key: string) => {
    saveStoredAnonKey(key);
    setAnonKey(key.trim());
    const configured = isSupabaseConfigured();
    setIsConfigured(configured);
    if (configured) {
      setSyncStatus('offline');
      // re-trigger session fetch
      supabaseGetSession().then((sess) => {
        setSession(sess);
        setUser(sess?.user || null);
        if (sess?.user) {
          setSyncStatus('synced');
          loadEntitlements(sess.user.id, sess);
          loadProfile(sess.user.id);
        }
      });
    } else {
      setSyncStatus('local-only');
      setUser(null);
      setSession(null);
      setEntitlements(null);
      setUserProfile(null);
    }
  }, [loadEntitlements, loadProfile]);

  const confirmUserEmail = useCallback(async (targetEmail: string) => {
    try {
      const res = await fetch('/api/auth/confirm-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail.trim().toLowerCase() })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao conectar ao servidor para liberar e-mail' };
    }
  }, []);

  const resendConfirmation = useCallback(async (targetEmail: string) => {
    try {
      const res = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail.trim().toLowerCase() })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao reenviar confirmação de e-mail' };
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Note: Do NOT set setIsLoading(true) here! AuthModal has its own isSubmitting spinner.
    // Setting isLoading=true would unmount the AuthModal and erase the error message!
    setIsCheckingEntitlements(true);

    try {
      let { data, error } = await supabaseSignIn(email, password);

      // Se der erro de e-mail não confirmado, tenta auto-confirmar via API do servidor com a service key
      if (error && error.message && (
        error.message.toLowerCase().includes('email not confirmed') ||
        error.message.toLowerCase().includes('not confirmed') ||
        error.message.toLowerCase().includes('não confirmado')
      )) {
        console.log('[AuthContext] E-mail pendente de confirmação detectado. Tentando auto-confirmar para liberar o acesso...');
        try {
          const autoRes = await fetch('/api/auth/confirm-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim().toLowerCase() })
          });
          const autoData = await autoRes.json();
          if (autoData?.success) {
            console.log('[AuthContext] Auto-confirmação bem-sucedida! Repetindo login...');
            const retryRes = await supabaseSignIn(email, password);
            data = retryRes.data;
            error = retryRes.error;
          }
        } catch (autoErr) {
          console.warn('[AuthContext] Falha na auto-confirmação silenciosa:', autoErr);
        }
      }

      if (error) {
        return { success: false, error: translateAuthError(error.message) };
      }
      if (data?.user) {
        saveRememberedEmail(email);
        markPresentationCompleted();
        setUser(data.user);
        setSession(data.session);
        setSyncStatus('synced');
        // Consulta obrigatória dos entitlements do novo usuário no Supabase
        await Promise.all([
          loadEntitlements(data.user.id, data.session),
          loadProfile(data.user.id)
        ]);
        return { success: true };
      }
      return { success: false, error: 'Não foi possível autenticar o usuário.' };
    } catch (err: any) {
      console.error('[AuthContext] Exceção capturada durante login:', err);
      return { success: false, error: translateAuthError(err?.message) || 'Erro ao realizar login' };
    } finally {
      setIsCheckingEntitlements(false);
    }
  }, [loadEntitlements, loadProfile]);

  const signup = useCallback(async (
    email: string, 
    password: string, 
    name?: string,
    preference: TreatmentPreference = 'nao_informar',
    avatar?: string
  ) => {
    // Note: Do NOT set setIsLoading(true) here! AuthModal has its own isSubmitting spinner.
    setIsCheckingEntitlements(true);

    try {
      const cleanName = name ? name.trim() : '';
      const cleanAvatar = avatar ? avatar.trim() : '';
      const { data, error } = await supabaseSignUp(email, password, cleanName, preference, cleanAvatar);
      
      if (error) {
        const errMsg = (error.message || '').toLowerCase();
        // Se a conta já existe (pré-criada pela Hotmart na hora da compra):
        if (
          errMsg.includes('already registered') || 
          errMsg.includes('already been registered') ||
          errMsg.includes('user already exists')
        ) {
          console.log('[AuthContext] Usuário pré-existente detectado. Ativando conta e vinculando senha...');
          try {
            const claimRes = await fetch('/api/auth/claim-account', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email.trim().toLowerCase(), password, name: cleanName })
            });
            if (claimRes.ok) {
              const logRes = await login(email, password);
              if (logRes.success) {
                return { 
                  success: true, 
                  message: 'Acesso liberado e compra vinculada com sucesso! Bem-vinda ao LEVE.' 
                };
              }
            }
          } catch (claimErr) {
            console.warn('[AuthContext] Falha ao reivindicar conta:', claimErr);
          }
        }
        return { success: false, error: translateAuthError(error.message) };
      }
      if (data?.user) {
        saveRememberedEmail(email);
        markPresentationCompleted();
        if (cleanName) {
          try { localStorage.setItem('leve_user_name', cleanName); } catch {}
        }
        if (cleanAvatar) {
          try { localStorage.setItem('leve_user_avatar', cleanAvatar); } catch {}
        }
        setUser(data.user);
        setSession(data.session);
        const needsConfirmation = !data.session;
        if (data.session) {
          await Promise.all([
            loadEntitlements(data.user.id, data.session),
            loadProfile(data.user.id)
          ]);
        }
        return { 
          success: true, 
          message: needsConfirmation 
            ? 'Cadastro realizado! Verifique seu e-mail para confirmar a conta.' 
            : 'Conta criada com sucesso! Perfil e permissões vinculados.' 
        };
      }
      return { success: false, error: 'Não foi possível cadastrar a conta.' };
    } catch (err: any) {
      console.error('[AuthContext] Exceção capturada durante cadastro:', err);
      return { success: false, error: translateAuthError(err?.message) || 'Erro ao realizar cadastro' };
    } finally {
      setIsCheckingEntitlements(false);
    }
  }, [loadEntitlements, loadProfile]);

  const treatmentPreference: TreatmentPreference =
    localTreatmentPref ||
    (userProfile?.treatment_preference ? normalizeTreatmentPreference(userProfile.treatment_preference) : null) ||
    (user?.user_metadata?.treatment_preference ? normalizeTreatmentPreference(user.user_metadata.treatment_preference) : null) ||
    'nao_informar';

  const updateTreatmentPreference = useCallback(async (preference: TreatmentPreference): Promise<boolean> => {
    const normalized = normalizeTreatmentPreference(preference);
    setLocalTreatmentPref(normalized);
    try {
      localStorage.setItem('leve_treatment_pref_current', normalized);
      if (user?.id) {
        localStorage.setItem('leve_treatment_pref_' + user.id, normalized);
      }
    } catch {}

    setUserProfile((prev: any) => ({
      ...(prev || {}),
      treatment_preference: normalized
    }));

    if (!user) return true;
    try {
      await saveUserProfileToSupabase(user.id, {
        name: userProfile?.name || user?.user_metadata?.name || '',
        treatment_preference: normalized
      });
      return true;
    } catch {
      return true;
    }
  }, [user, userProfile]);

  const saveProfile = useCallback(async (profile: {
    name?: string;
    full_name?: string;
    avatar?: string;
    treatment_preference?: TreatmentPreference;
  }): Promise<boolean> => {
    const normalizedPref = profile.treatment_preference 
      ? normalizeTreatmentPreference(profile.treatment_preference) 
      : undefined;

    if (normalizedPref) {
      setLocalTreatmentPref(normalizedPref);
      try {
        if (user?.id) {
          localStorage.setItem('leve_treatment_pref_' + user.id, normalizedPref);
        }
        localStorage.setItem('leve_treatment_pref_current', normalizedPref);
      } catch {}
    }

    if (profile.name && profile.name.trim()) {
      try {
        localStorage.setItem('leve_user_name', profile.name.trim());
      } catch {}
    }

    if (profile.avatar && profile.avatar.trim()) {
      try {
        localStorage.setItem('leve_user_avatar', profile.avatar.trim());
      } catch {}
    }

    setUserProfile((prev: any) => ({
      ...(prev || {}),
      ...profile,
      ...(normalizedPref ? { treatment_preference: normalizedPref } : {})
    }));

    if (!user) return true;

    try {
      const res = await saveUserProfileToSupabase(user.id, {
        ...profile,
        ...(normalizedPref ? { treatment_preference: normalizedPref } : {})
      });
      return res.success;
    } catch {
      return true;
    }
  }, [user]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Limpar imediatamente o usuário atual, perfil e todas as permissões em memória
      setUser(null);
      setSession(null);
      setEntitlements(null);
      setUserProfile(null);
      setLocalTreatmentPref(null);
      setSyncStatus('local-only');

      // 2. Encerrar sessão no Supabase Auth
      await supabaseSignOut();

      // 3. Limpeza profunda de dados temporários, LEVIA, cache de plano e dados de aplicativo
      try {
        sessionStorage.clear();
        localStorage.removeItem('levia_chat_history');
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('leve_treatment_pref_current');
        localStorage.removeItem('leve_active_tab');
        localStorage.removeItem('leve_entitlements_cache');
        localStorage.removeItem('leve_app_data_v3');
        localStorage.removeItem('leve_app_data_v2');
        localStorage.removeItem('leve_app_data_v1');
      } catch {}
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabaseResetPassword(email);
      if (error) {
        return { success: false, error: translateAuthError(error.message) };
      }
      return { 
        success: true, 
        message: 'Link de recuperação enviado para o seu e-mail! Verifique sua caixa de entrada.' 
      };
    } catch (err: any) {
      return { success: false, error: translateAuthError(err.message) || 'Erro ao solicitar recuperação' };
    }
  }, []);

  const syncDataNow = useCallback(async (data: AppData) => {
    const userEmail = user?.email || getRememberedEmail();
    const userId = user?.id || '';
    if (!userEmail && !userId) return false;
    setSyncStatus('syncing');
    const { success } = await syncUserDataToSupabase(userId, data, userEmail);
    if (success) {
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
      return true;
    } else {
      setSyncStatus('error');
      return false;
    }
  }, [user]);

  const pullCloudData = useCallback(async (since = 0): Promise<AppData | null> => {
    const userEmail = user?.email || getRememberedEmail();
    const userId = user?.id || '';
    if (!userEmail && !userId) return null;
    const { data } = await fetchUserDataFromSupabase(userId, userEmail, since);
    if (data) {
      setLastSyncedAt(new Date());
      setSyncStatus('synced');
      return data;
    }
    return null;
  }, [user]);

  const refreshEntitlements = useCallback(async (): Promise<UserEntitlements | null> => {
    setIsCheckingEntitlements(true);
    try {
      const client = getSupabase();
      let activeSession: Session | null = null;
      if (client) {
        try {
          const { data: refreshData } = await client.auth.refreshSession();
          if (refreshData?.session) {
            activeSession = refreshData.session;
          }
        } catch {}
        if (!activeSession) {
          const { data: sessData } = await client.auth.getSession();
          activeSession = sessData?.session || null;
        }
      }
      if (activeSession) {
        setSession(activeSession);
        setUser(activeSession.user);
      }
      const clientUser = await supabaseGetUser();
      const currentUserId = activeSession?.user?.id || user?.id || clientUser?.id;
      return await loadEntitlements(currentUserId, activeSession);
    } finally {
      setIsCheckingEntitlements(false);
    }
  }, [user, loadEntitlements]);

  // Recarrega permissões automaticamente quando o usuário retorna para a aba
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id) {
        refreshEntitlements();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.id, refreshEntitlements]);

  // ==========================================================================
  // Sistema Centralizado de Planos & Autorização (LEVE Gratuito, Especial, VIP)
  // ==========================================================================
  const plan: PlanTier = determineUserPlan(user, entitlements);
  const planLabel = getPlanLabel(plan);

  const canAccessFeature = useCallback(
    (feature: AppFeature | string): boolean => {
      return canAccess(feature, plan);
    },
    [plan]
  );

  // Áreas pagas gerais: requer plano Especial ou VIP
  const hasLeveAccess = plan === 'special' || plan === 'vip';

  // Levia (Mentora IA): exclusivo do plano VIP
  const hasLiaAccess = plan === 'vip';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured,
        diagnostics: getSupabaseDiagnostics(),
        isAuthModalOpen,
        setIsAuthModalOpen,
        authTab,
        setAuthTab,
        syncStatus,
        lastSyncedAt,
        supabaseUrl: SUPABASE_URL,
        anonKey,
        saveAnonKey: handleSaveAnonKey,
        login,
        signup,
        logout,
        resetPassword,
        syncDataNow,
        pullCloudData,
        confirmUserEmail,
        resendConfirmation,
        entitlements,
        isCheckingEntitlements,
        plan,
        planLabel,
        canAccessFeature,
        hasLeveAccess,
        hasLiaAccess,
        refreshEntitlements,
        userProfile,
        treatmentPreference,
        updateTreatmentPreference,
        saveProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
