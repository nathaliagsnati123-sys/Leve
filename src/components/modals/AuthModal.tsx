// Modal de Autenticação Supabase - LEVE
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Mail, Lock, User, Cloud, CheckCircle, AlertCircle, 
  ArrowRight, LogOut, RefreshCw, ShieldCheck, Sparkles,
  Eye, EyeOff, ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { translateAuthError } from '../../utils/authErrors';
import { parseBoolean } from '../../services/supabase';
import { HOTMART_CHECKOUT, buildHotmartUrl } from '../../services/authorization';
import { TreatmentPreference } from '../../types';
import { TREATMENT_OPTIONS, normalizeTreatmentPreference } from '../../utils/treatment';

export const AuthModal: React.FC = () => {
  const { 
    user, 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    authTab, 
    setAuthTab, 
    login, 
    signup, 
    logout, 
    resetPassword, 
    syncStatus, 
    lastSyncedAt, 
    syncDataNow, 
    supabaseUrl, 
    isConfigured,
    diagnostics,
    entitlements,
    refreshEntitlements,
    userProfile,
    isCheckingEntitlements,
    plan,
    planLabel,
    hasLeveAccess,
    hasLiaAccess,
    treatmentPreference: authTreatmentPref,
    updateTreatmentPreference
  } = useAuth();

  const { data, showToast, updateUser } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [treatmentPreference, setTreatmentPreference] = useState<TreatmentPreference>(() => {
    return normalizeTreatmentPreference(data.user?.treatmentPreference || 'nao_informar');
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Por favor, preencha seu e-mail e senha.');
      return;
    }

    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      showToast('Boas-vindas de volta! Conta sincronizada.', 'success');
      handleClose();
    } else {
      setErrorMessage(translateAuthError(res.error) || 'Erro ao entrar. Verifique seus dados.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    const res = await signup(email, password, name, treatmentPreference);
    setIsSubmitting(false);

    if (res.success) {
      updateUser({
        name: name.trim() || data.user.name,
        treatmentPreference
      });
      setSuccessMessage(res.message || 'Conta criada com sucesso!');
      showToast('Conta criada com sucesso!', 'success');
      // If session was immediately established, sync initial data
      if (user) {
        syncDataNow(data);
        setTimeout(handleClose, 1200);
      }
    } else {
      setErrorMessage(translateAuthError(res.error) || 'Não foi possível criar a conta.');
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email) {
      setErrorMessage('Por favor, digite o e-mail cadastrado para recuperação.');
      return;
    }

    setIsSubmitting(true);
    const res = await resetPassword(email);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(res.message || 'Link de recuperação enviado com sucesso!');
      showToast('Link de recuperação enviado para seu e-mail.', 'info');
    } else {
      setErrorMessage(translateAuthError(res.error) || 'Não foi possível enviar o e-mail de recuperação.');
    }
  };

  const handleManualSync = async () => {
    setIsSubmitting(true);
    const success = await syncDataNow(data);
    setIsSubmitting(false);
    if (success) {
      showToast('Dados sincronizados com sucesso!', 'success');
    } else {
      showToast('Erro ao sincronizar. Seus dados estão salvos localmente.', 'info');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="relative w-full max-w-md bg-[#FAF9F5] dark:bg-[#161C19] rounded-3xl shadow-2xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-stone-200/60 dark:border-stone-800/60 bg-[#F4F2EB] dark:bg-[#121714]">
          <button 
            id="auth-modal-close-btn"
            onClick={handleClose}
            className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm ring-1 ring-stone-300 dark:ring-stone-700 bg-white shrink-0">
              <img src="/app-icon.png" alt="LEVE" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="font-serif text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug">
                {user ? 'Minha Conta' : 'Acesse de qualquer dispositivo sem perder nada'}
              </h2>
              {user && (
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Sincronização em nuvem e autenticação segura
                </p>
              )}
            </div>
          </div>

          {/* Connected User Badge if logged in */}
          {user && (
            <div className="mt-3 flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-medium truncate">{user.email}</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full shrink-0">
                Sessão Ativa
              </span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-stone-800 dark:text-stone-200">
          
          {/* Feedback messages */}
          {errorMessage && (
            <motion.div 
              id="auth-error-alert"
              initial={{ opacity: 0, y: -6 }} 
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{translateAuthError(errorMessage)}</div>
            </motion.div>
          )}

          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }} 
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">{successMessage}</div>
            </motion.div>
          )}

          {/* USER LOGGED IN VIEW */}
          {user ? (
            <div className="space-y-4">
              {/* Informação do Plano Disponível do Cliente */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1A211D] border border-stone-200/80 dark:border-stone-800/80 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                        Plano Ativo
                      </span>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                        {planLabel}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      plan === 'vip'
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : plan === 'special'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${plan === 'vip' ? 'bg-amber-500' : plan === 'special' ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                      {plan === 'vip' ? 'VIP' : plan === 'special' ? 'Especial' : 'Gratuito'}
                    </span>

                    <button
                      type="button"
                      onClick={() => refreshEntitlements()}
                      disabled={isCheckingEntitlements}
                      title="Atualizar informações do plano"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCheckingEntitlements ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Recursos e Acessos Inclusos no Plano */}
                <div className="pt-2.5 border-t border-stone-100 dark:border-stone-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Meu Dia (Rotina essencial diária)</span>
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      Liberado
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                      <CheckCircle className={`w-3.5 h-3.5 ${hasLeveAccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-300 dark:text-stone-600'}`} />
                      <span>Todas as áreas LEVE (Hábitos, Metas, Finanças, etc.)</span>
                    </span>
                    <span className={`text-[11px] font-semibold ${hasLeveAccess ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-400 dark:text-stone-500'}`}>
                      {hasLeveAccess ? 'Liberado' : 'Requer Especial ou VIP'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                      <CheckCircle className={`w-3.5 h-3.5 ${hasLiaAccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-300 dark:text-stone-600'}`} />
                      <span>LEVIA • Mentora de Inteligência Artificial</span>
                    </span>
                    <span className={`text-[11px] font-semibold ${hasLiaAccess ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                      {hasLiaAccess ? 'Liberado' : 'Exclusivo VIP'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Oferta de Upgrade Exclusiva para Especial */}
              {plan === 'special' && (
                <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/80 space-y-2.5 text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-300">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                        Quer ter a LEVIA?
                      </h4>
                      <p className="text-[10px] text-amber-800/80 dark:text-amber-400">
                        Upgrade exclusivo Especial → VIP
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                    Você já tem o LEVE Especial. Faça o upgrade e ative a LEVIA por apenas R$16,00.
                  </p>

                  <a
                    id="auth-modal-upgrade-levia-btn"
                    href={buildHotmartUrl(HOTMART_CHECKOUT.UPGRADE_LEVIA, user?.email)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>Ativar LEVIA por R$16,00</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>
                </div>
              )}

              {/* Opções de Aquisição para Usuários Gratuitos */}
              {plan === 'free' && (
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-850/80 border border-stone-200/80 dark:border-stone-800 space-y-2.5 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      Desbloquear Recursos
                    </span>
                  </div>

                  <div className="space-y-2">
                    <a
                      id="auth-modal-buy-especial-btn"
                      href={buildHotmartUrl(HOTMART_CHECKOUT.ESPECIAL, user?.email)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3.5 rounded-xl bg-[#1F3A34] hover:bg-[#182E29] text-white font-semibold text-xs flex items-center justify-between shadow-2xs transition cursor-pointer"
                    >
                      <span>Adquirir LEVE Especial</span>
                      <span className="font-bold text-emerald-300">R$ 49,90</span>
                    </a>

                    <a
                      id="auth-modal-buy-vip-btn"
                      href={buildHotmartUrl(HOTMART_CHECKOUT.VIP_DIRECT, user?.email)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-between shadow-2xs transition cursor-pointer"
                    >
                      <span>Assinar LEVE VIP (com LEVIA)</span>
                      <span className="font-bold text-amber-200">R$ 65,90</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Preferência de Tratamento */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1A211D] border border-stone-200/80 dark:border-stone-800/80 space-y-2.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Preferência de Tratamento
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {TREATMENT_OPTIONS.map((opt) => {
                    const currentPref = data.user?.treatmentPreference || authTreatmentPref || 'nao_informar';
                    const isSelected = currentPref === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={async () => {
                          updateUser({ treatmentPreference: opt.id });
                          if (user) {
                            try {
                              await updateTreatmentPreference(opt.id);
                            } catch (err) {
                              console.warn('Erro ao atualizar preferência:', err);
                            }
                          }
                          showToast(`Tratamento atualizado para: ${opt.label}`);
                        }}
                        className={`py-2 px-1.5 rounded-xl border text-xs font-medium transition cursor-pointer text-center ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-950 dark:text-emerald-100 font-semibold ring-1 ring-emerald-600/30'
                            : 'bg-stone-50 dark:bg-stone-850 border-stone-200 dark:border-stone-750 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        <span className="block truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-stone-400 dark:text-stone-500">
                  Como a LEVIA e o LEVE se comunicam com você.
                </p>
              </div>

              {/* Sync and Logout Actions */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  id="auth-manual-sync-btn"
                  onClick={handleManualSync}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1F3A34] text-white hover:bg-[#182E29] transition font-medium text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                  <span>Sincronizar Meus Dados Agora</span>
                </button>

                {lastSyncedAt && (
                  <p className="text-[10px] text-center text-stone-400 dark:text-stone-500">
                    Última sincronização: {lastSyncedAt.toLocaleTimeString('pt-BR')}
                  </p>
                )}

                <button
                  id="auth-logout-btn"
                  onClick={async () => {
                    await logout();
                    showToast('Você saiu da sua conta.', 'info');
                    handleClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition font-medium text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair desta Conta</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-stone-100/80 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800/60 text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Seus dados continuam disponíveis offline neste dispositivo e são salvos na nuvem quando conectado.</span>
              </div>
            </div>
          ) : (
            /* USER NOT LOGGED IN */
            <div className="space-y-4">
              {/* Navigation Tabs (Entrar / Criar Conta / Recuperar) */}
              <div className="flex items-center p-1 rounded-xl bg-stone-200/70 dark:bg-stone-800/70 text-xs font-medium">
                <button
                  id="tab-login-btn"
                  onClick={() => { setAuthTab('login'); setErrorMessage(null); setSuccessMessage(null); }}
                  className={`flex-1 py-1.5 rounded-lg transition text-center cursor-pointer ${
                    authTab === 'login' 
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs font-semibold' 
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  Entrar
                </button>
                <button
                  id="tab-signup-btn"
                  onClick={() => { setAuthTab('signup'); setErrorMessage(null); setSuccessMessage(null); }}
                  className={`flex-1 py-1.5 rounded-lg transition text-center cursor-pointer ${
                    authTab === 'signup' 
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs font-semibold' 
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  Criar Conta
                </button>
                <button
                  id="tab-reset-btn"
                  onClick={() => { setAuthTab('reset'); setErrorMessage(null); setSuccessMessage(null); }}
                  className={`flex-1 py-1.5 rounded-lg transition text-center cursor-pointer ${
                    authTab === 'reset' 
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs font-semibold' 
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  Recuperar
                </button>
              </div>

              {/* TAB 1: ENTRAR (LOGIN) */}
              {authTab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-3.5">
                  <div>
                    <label htmlFor="login-email" className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Seu E-mail
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        id="login-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="exemplo@email.com"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1E2522] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1F3A34]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="login-password" className="text-xs font-medium text-stone-700 dark:text-stone-300">
                        Sua Senha
                      </label>
                      <button
                        type="button"
                        onClick={() => setAuthTab('reset')}
                        className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Esqueci a senha
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                      <input
                        id="login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Sua senha segura"
                        className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-white dark:bg-[#1E2522] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1F3A34]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition cursor-pointer"
                        title={showLoginPassword ? 'Ocultar senha' : 'Ver senha'}
                        aria-label={showLoginPassword ? 'Ocultar senha' : 'Ver senha'}
                      >
                        {showLoginPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    id="submit-login-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#1F3A34] text-white hover:bg-[#182E29] transition font-medium text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Entrando...</span>
                      </>
                    ) : (
                      <>
                        <span>Entrar na Minha Conta</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* TAB 2: CRIAR CONTA (CADASTRO) */}
              {authTab === 'signup' && (
                <form onSubmit={handleSignup} className="space-y-3.5">
                  <div>
                    <label htmlFor="signup-name" className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Como gostaria de ser chamado(a)?
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        id="signup-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1E2522] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1F3A34]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                      Preferência de tratamento
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {TREATMENT_OPTIONS.map((opt) => {
                        const isSelected = treatmentPreference === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setTreatmentPreference(opt.id)}
                            className={`py-2 px-1.5 rounded-xl border text-xs font-medium transition cursor-pointer text-center ${
                              isSelected
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-950 dark:text-emerald-100 font-semibold ring-1 ring-emerald-600/30'
                                : 'bg-white dark:bg-[#1E2522] border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                            }`}
                          >
                            <span className="block truncate">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">
                      Como a LEVIA e o LEVE conversam com você (feminino, masculino ou neutro).
                    </p>
                  </div>

                  <div>
                    <label htmlFor="signup-email" className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Seu E-mail
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        id="signup-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="exemplo@email.com"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1E2522] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1F3A34]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="signup-password" className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Crie uma Senha (mínimo 6 caracteres)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                      <input
                        id="signup-password"
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="No mínimo 6 caracteres"
                        className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-white dark:bg-[#1E2522] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1F3A34]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition cursor-pointer"
                        title={showSignupPassword ? 'Ocultar senha' : 'Ver senha'}
                        aria-label={showSignupPassword ? 'Ocultar senha' : 'Ver senha'}
                      >
                        {showSignupPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    id="submit-signup-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#1F3A34] text-white hover:bg-[#182E29] transition font-medium text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Criando conta...</span>
                      </>
                    ) : (
                      <>
                        <span>Criar Conta</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* TAB 3: RECUPERAR SENHA */}
              {authTab === 'reset' && (
                <form onSubmit={handleReset} className="space-y-3.5">
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    Digite seu e-mail cadastrado. Enviaremos um link seguro para você redefinir sua senha com tranquilidade.
                  </p>

                  <div>
                    <label htmlFor="reset-email" className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Seu E-mail Cadastrado
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        id="reset-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="exemplo@email.com"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1E2522] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1F3A34]"
                      />
                    </div>
                  </div>

                  <button
                    id="submit-reset-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#1F3A34] text-white hover:bg-[#182E29] transition font-medium text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <span>Enviar Link de Recuperação</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Footer info & Safe Diagnostic */}
        <div className="px-6 py-2.5 bg-[#F4F2EB] dark:bg-[#121714] border-t border-stone-200/60 dark:border-stone-800/60 text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
          <span>Sincronização Segura em Nuvem</span>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-stone-400">
            <span className={diagnostics.hasSupabaseUrl ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}>
              URL={diagnostics.hasSupabaseUrl ? 'OK' : 'Não'}
            </span>
            <span>•</span>
            <span className={diagnostics.hasSupabaseAnonKey ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}>
              Chave={diagnostics.hasSupabaseAnonKey ? `${diagnostics.keyPrefix} (${diagnostics.keyLength}c)` : 'Não'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
