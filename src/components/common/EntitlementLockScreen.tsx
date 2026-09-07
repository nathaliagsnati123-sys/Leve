// ============================================================================
// Tela de Bloqueio por Plano Comercial - LEVE
// Planos: LEVE Gratuito | LEVE Especial | LEVE VIP
// ============================================================================

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { 
  Lock, 
  Sparkles, 
  Crown, 
  RefreshCw, 
  ArrowLeft, 
  CheckCircle2, 
  LogIn, 
  ShieldCheck,
  Star
} from 'lucide-react';
import { 
  PlanTier, 
  AppFeature, 
  PLAN_LABELS, 
  getFeatureDisplayName, 
  getRequiredPlan 
} from '../../services/authorization';

interface EntitlementLockScreenProps {
  feature?: AppFeature | string;
  requiredPlan?: PlanTier;
  onGoToFree?: () => void;
}

export const EntitlementLockScreen: React.FC<EntitlementLockScreenProps> = ({
  feature = 'calendar',
  requiredPlan,
  onGoToFree
}) => {
  const { user, plan, planLabel, refreshEntitlements, isCheckingEntitlements, setIsAuthModalOpen, setAuthTab } = useAuth();
  const { setActiveTab } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const effectiveRequiredPlan: PlanTier = requiredPlan || getRequiredPlan(feature);
  const isLia = feature === 'lia';
  const featureTitle = getFeatureDisplayName(feature);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshEntitlements();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGoToMyDay = () => {
    if (onGoToFree) {
      onGoToFree();
    } else {
      setActiveTab('my-day');
    }
  };

  const handleOpenLogin = () => {
    setAuthTab('login');
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="max-w-md sm:max-w-lg w-full bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/90 dark:border-stone-800 shadow-xl space-y-6 text-center">
        
        {/* Ícone de Destaque */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-700 dark:text-amber-400 shadow-xs">
          {isLia ? (
            <Crown className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          ) : (
            <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          )}
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 items-center justify-center text-[9px] text-white font-bold">
              ★
            </span>
          </span>
        </div>

        {/* Informações da Área e do Plano */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100/70 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
            {isLia ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Exclusivo LEVE VIP</span>
              </>
            ) : (
              <>
                <Star className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Disponível nos Planos Especial & VIP</span>
              </>
            )}
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 pt-1">
            {isLia ? 'Conheça a Levia' : featureTitle}
          </h2>

          <p className="text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
            {isLia
              ? 'A Levia é a sua mentora pessoal com inteligência artificial para trazer calma, sugerir pausas conscientes e planejar seu dia sem ansiedade. Este recurso é exclusivo do plano LEVE VIP.'
              : `A aba ${featureTitle} faz parte das ferramentas completas do LEVE para apoiar sua organização, rotina e bem-estar.`}
          </p>
        </div>

        {/* Quadro Comparativo de Planos (Sem jargões técnicos) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FBF9F5] dark:bg-stone-850 border border-stone-200/80 dark:border-stone-800 text-left space-y-3">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-stone-200/60 dark:border-stone-750">
            <span className="text-stone-500 dark:text-stone-400 font-medium">Seu plano atual:</span>
            <span className="font-bold text-stone-900 dark:text-stone-100 bg-white dark:bg-stone-800 px-2.5 py-0.5 rounded-full border border-stone-200 dark:border-stone-700">
              {planLabel}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Meu Dia
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                Liberado para todos
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-600" />
                Organização & Rotina Completa
              </span>
              <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                LEVE Especial & VIP
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                Levia • Mentora IA
              </span>
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                Exclusivo LEVE VIP
              </span>
            </div>
          </div>

          {user ? (
            <p className="text-[11px] text-stone-500 dark:text-stone-400 pt-1 text-center">
              Conta conectada: <strong className="text-stone-700 dark:text-stone-200">{user.email}</strong>
            </p>
          ) : (
            <p className="text-[11px] text-stone-500 dark:text-stone-400 pt-1 text-center">
              Já possui uma assinatura? Entre na sua conta para desbloquear seu acesso.
            </p>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
          {user ? (
            <>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing || isCheckingEntitlements}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isCheckingEntitlements ? 'animate-spin' : ''}`} />
                <span>Verificar Acesso</span>
              </button>

              <button
                type="button"
                onClick={handleGoToMyDay}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Ir para Meu Dia</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleOpenLogin}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-xs font-semibold shadow-md transition cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar na Minha Conta</span>
              </button>

              <button
                type="button"
                onClick={handleGoToMyDay}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Continuar no Meu Dia</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
