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
  parseBoolean,
  UserEntitlements,
  SUPABASE_URL,
  getSupabaseDiagnostics,
  SupabaseAuthDiagnostics
} from '../services/supabase';
import { AppData } from '../types';
import { translateAuthError } from '../utils/authErrors';

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
  signup: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  syncDataNow: (data: AppData) => Promise<boolean>;
  pullCloudData: () => Promise<AppData | null>;

  // Entitlements & Access Control (user_entitlements)
  entitlements: UserEntitlements | null;
  isCheckingEntitlements: boolean;
  hasLeveAccess: boolean; // leve_access || special_access
  hasLiaAccess: boolean; // lia_access
  refreshEntitlements: () => Promise<UserEntitlements | null>;
  userProfile: any | null;
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
      }
    } catch {}
  }, []);

  // Check current session on mount and subscribe to auth state changes
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      setIsLoading(true);
      const configured = isSupabaseConfigured();
      setIsConfigured(configured);

      if (!configured) {
        setIsLoading(false);
        setSyncStatus('local-only');
        return;
      }

      try {
        const currentSession = await supabaseGetSession();
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user || null);
          setSyncStatus(currentSession?.user ? 'synced' : 'local-only');
          if (currentSession?.user) {
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

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabaseSignIn(email, password);
      if (error) {
        return { success: false, error: translateAuthError(error.message) };
      }
      if (data?.user) {
        setUser(data.user);
        setSession(data.session);
        setSyncStatus('synced');
        await loadEntitlements(data.user.id, data.session);
        await loadProfile(data.user.id);
        return { success: true };
      }
      return { success: false, error: 'Não foi possível autenticar o usuário.' };
    } catch (err: any) {
      console.error('[AuthContext] Exceção capturada durante login:', err);
      return { success: false, error: translateAuthError(err?.message) || 'Erro ao realizar login' };
    } finally {
      setIsLoading(false);
    }
  }, [loadEntitlements, loadProfile]);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabaseSignUp(email, password, name);
      if (error) {
        return { success: false, error: translateAuthError(error.message) };
      }
      if (data?.user) {
        setUser(data.user);
        setSession(data.session);
        const needsConfirmation = !data.session;
        if (data.session) {
          await loadEntitlements(data.user.id, data.session);
          await loadProfile(data.user.id);
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
      setIsLoading(false);
    }
  }, [loadEntitlements, loadProfile]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabaseSignOut();
      setUser(null);
      setSession(null);
      setEntitlements(null);
      setUserProfile(null);
      setSyncStatus('local-only');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncDataNow = useCallback(async (data: AppData) => {
    if (!user) return false;
    setSyncStatus('syncing');
    const { success } = await syncUserDataToSupabase(user.id, data);
    if (success) {
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
      return true;
    } else {
      setSyncStatus('error');
      return false;
    }
  }, [user]);

  const pullCloudData = useCallback(async (): Promise<AppData | null> => {
    if (!user) return null;
    const { data } = await fetchUserDataFromSupabase(user.id);
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

  // Regras de autorização:
  // - Se não estiver logado: modo demonstração / local preservado sem bloquear a interface
  // - Se estiver logado: deve ter leve_access ou special_access para acessar o LEVE completo
  const hasLeveAccess = !user || Boolean(
    parseBoolean(entitlements?.leve_access) || 
    parseBoolean(entitlements?.special_access)
  );

  // lia_access libera a Lia
  const hasLiaAccess = Boolean(parseBoolean(entitlements?.lia_access));

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
        entitlements,
        isCheckingEntitlements,
        hasLeveAccess,
        hasLiaAccess,
        refreshEntitlements,
        userProfile
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
