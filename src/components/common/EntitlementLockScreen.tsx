// ============================================================================
// Tela de Bloqueio por Plano Comercial - LEVE
// Planos: LEVE Gratuito (R$ 0) | LEVE Especial (R$ 49,90) | LEVE VIP (R$ 65,90)
// Upgrade LEVIA para Especial: R$ 16,00
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
  Star,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { 
  PlanTier, 
  AppFeature, 
  getFeatureDisplayName, 
  getRequiredPlan,
  HOTMART_CHECKOUT,
  buildHotmartUrl
} from '../../services/authorization';
import { trackPixelEvent } from '../../utils/pixel';

interface EntitlementLockScreenProps {
  feature?: AppFeature | string;
  requiredPlan?: PlanTier;
  onGoToFree?: () => void;
}

export const EntitlementLockScreen: React.FC<EntitlementLockScreenProps> = ({
  feature = 'calendar',
  onGoToFree
}) => {
  const { user, plan, planLabel, refreshEntitlements, isCheckingEntitlements, setIsAuthModalOpen, setAuthTab } = useAuth();
  const { setActiveTab } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isLia = feature === 'lia';
  const isSpecialUser = plan === 'special';
  const isUpgradeLiaOpportunity = isLia && isSpecialUser;
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

  // URLs oficiais da Hotmart com preenchimento opcional de e-mail do usuário autenticado
  const upgradeUrl = buildHotmartUrl(HOTMART_CHECKOUT.UPGRADE_LEVIA, user?.email);
  const especialUrl = buildHotmartUrl(HOTMART_CHECKOUT.ESPECIAL, user?.email);
  const vipDirectUrl = buildHotmartUrl(HOTMART_CHECKOUT.VIP_DIRECT, user?.email);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="max-w-md sm:max-w-lg w-full bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/90 dark:border-stone-800 shadow-xl space-y-6 text-center">
        
        {/* Ícone de Destaque */}
        <div className={`relative mx-auto w-16 h-16 rounded-2xl flex items-center justify-center shadow-xs ${
          isUpgradeLiaOpportunity 
            ? 'bg-amber-100/70 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/80 text-amber-700 dark:text-amber-300'
            : isLia 
            ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-700 dark:text-amber-400'
            : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-[#1F3A34] dark:text-emerald-300'
        }`}>
          {isLia ? (
            <Crown className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          ) : (
            <Lock className="w-7 h-7 text-[#1F3A34] dark:text-emerald-400" />
          )}
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 items-center justify-center text-[9px] text-white font-bold">
              ★
            </span>
          </span>
        </div>

        {/* Informações da Oferta / Bloqueio */}
        <div className="space-y-2">
          {/* Badge Contextual */}
          {isUpgradeLiaOpportunity ? (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Upgrade Exclusivo • Especial → VIP</span>
            </div>
          ) : isLia ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100/70 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
              <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Exclusivo LEVE VIP</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
              <Star className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Disponível no LEVE Especial</span>
            </div>
          )}

          {/* Título Oficial */}
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 pt-1">
            {isUpgradeLiaOpportunity 
              ? 'Quer ter a LEVIA?' 
              : isLia 
              ? 'Conheça a Levia' 
              : featureTitle}
          </h2>

          {/* Descrição Oficial */}
          <p className="text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
            {isUpgradeLiaOpportunity
              ? 'Você já tem o LEVE Especial. Faça o upgrade e ative a LEVIA por apenas R$16,00.'
              : isLia
              ? 'A Levia é a sua mentora pessoal com inteligência artificial para trazer calma, sugerir pausas conscientes e planejar seu dia sem ansiedade. Este recurso é exclusivo do plano LEVE VIP.'
              : `A aba ${featureTitle} faz parte das ferramentas completas do LEVE para apoiar sua organização, rotina e bem-estar.`}
          </p>
        </div>

        {/* Quadro de Benefícios / Status */}
        {isUpgradeLiaOpportunity ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 text-left space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-amber-200/60 dark:border-amber-800/40">
              <span className="text-amber-900 dark:text-amber-200 font-medium">Seu plano atual:</span>
              <span className="font-bold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-stone-800 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700/60 text-[11px]">
                LEVE Especial
              </span>
            </div>

            <div className="space-y-2 text-xs text-stone-700 dark:text-stone-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Você paga <strong>apenas a diferença</strong>: de R$ 65,90 por <strong>R$ 16,00</strong>.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mentora com inteligência artificial para organizar sua rotina num clique.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Desbloqueio VIP automático após a confirmação da Hotmart.</span>
              </div>
            </div>
          </div>
        ) : (
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
                  Liberado
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-emerald-600" />
                  Todas as áreas do LEVE
                </span>
                <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                  LEVE Especial (R$ 49,90)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  LEVIA • Mentora IA
                </span>
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  Exclusivo LEVE VIP (R$ 65,90)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Botões de Ação e Checkout */}
        <div className="space-y-3 pt-1">
          {/* CASO 1: Usuário Especial visualizando a LEVIA -> Oferta de Upgrade por R$ 16 */}
          {isUpgradeLiaOpportunity ? (
            <div className="space-y-2.5">
              <a
                id="btn-upgrade-levia-16"
                href={upgradeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackPixelEvent('InitiateCheckout', { content_name: 'Upgrade LEVIA', value: 16.0, currency: 'BRL' })}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow-lg shadow-amber-600/20 hover:shadow-xl transition-all cursor-pointer group"
              >
                <Sparkles className="w-4 h-4 text-amber-200 group-hover:rotate-12 transition-transform" />
                <span>Ativar LEVIA por R$16,00</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <p className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pagamento seguro e único via Hotmart.</span>
              </p>
            </div>
          ) : isLia ? (
            /* CASO 2: Usuário Gratuito na aba LEVIA -> VIP Direto (R$ 65,90) ou Especial (R$ 49,90) */
            <div className="space-y-2.5">
              <a
                id="btn-checkout-vip-direct"
                href={vipDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackPixelEvent('InitiateCheckout', { content_name: 'LEVE VIP Anual', value: 65.9, currency: 'BRL' })}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Assinar LEVE VIP por R$ 65,90</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <a
                id="btn-checkout-especial-secondary"
                href={especialUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackPixelEvent('InitiateCheckout', { content_name: 'LEVE Especial Vitalício', value: 49.9, currency: 'BRL' })}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition cursor-pointer"
              >
                <span>Ou adquirir LEVE Especial por R$ 49,90</span>
              </a>
            </div>
          ) : (
            /* CASO 3: Usuário Gratuito em abas do LEVE Especial (Calendário, Hábitos, Metas, Finanças, etc.) */
            <div className="space-y-2.5">
              <a
                id={`btn-checkout-especial-${feature}`}
                href={especialUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackPixelEvent('InitiateCheckout', { content_name: `LEVE Especial - ${featureTitle}`, value: 49.9, currency: 'BRL' })}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <Star className="w-4 h-4 text-amber-300" />
                <span>Adquirir LEVE Especial por R$ 49,90</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <a
                id={`btn-checkout-vip-from-${feature}`}
                href={vipDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackPixelEvent('InitiateCheckout', { content_name: `LEVE VIP - ${featureTitle}`, value: 65.9, currency: 'BRL' })}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition cursor-pointer"
              >
                <span>Ou assinar LEVE VIP com LEVIA por R$ 65,90</span>
              </a>
            </div>
          )}

          {/* Ações Auxiliares: Verificar Acesso / Entrar / Voltar */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-800/80">
            {user ? (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing || isCheckingEntitlements}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isCheckingEntitlements ? 'animate-spin' : ''}`} />
                <span>Já comprei? Atualizar acesso</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenLogin}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium transition cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Já possui conta? Entrar</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleGoToMyDay}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Meu Dia</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

