// Tela de Bloqueio por Permissão (Entitlement) - LEVE
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, RefreshCw, LogOut, MessageCircle, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { parseBoolean } from '../../services/supabase';

export const EntitlementLockScreen: React.FC = () => {
  const { user, entitlements, refreshEntitlements, logout, isCheckingEntitlements } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshEntitlements();
    } finally {
      setIsRefreshing(false);
    }
  };

  const isLeveActive = parseBoolean(entitlements?.leve_access);
  const isSpecialActive = parseBoolean(entitlements?.special_access);
  const isLiaActive = parseBoolean(entitlements?.lia_access);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-lg w-full bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/90 dark:border-stone-800 shadow-xl space-y-6 text-center">
        {/* Icon & Heading */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
            Acesso Pendente no LEVE
          </span>
          <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100 pt-1">
            Plano ainda não ativado
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
            Olá, <strong>{user?.email}</strong>! Sua conta está conectada com sucesso, mas as permissões do seu plano no <strong>user_entitlements</strong> ainda não incluem acesso liberado ao LEVE.
          </p>
        </div>

        {/* Entitlements Details */}
        <div className="p-4 rounded-2xl bg-[#F9FAF8] dark:bg-stone-850 border border-stone-200/80 dark:border-stone-800 text-left space-y-2.5">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Status das suas permissões:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 ${
              isLeveActive 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200' 
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500'
            }`}>
              <span className="font-semibold">leve_access</span>
              <span className="text-[10px] uppercase font-bold">{isLeveActive ? 'Liberado' : 'Bloqueado'}</span>
            </div>

            <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 ${
              isSpecialActive 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200' 
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500'
            }`}>
              <span className="font-semibold">special_access</span>
              <span className="text-[10px] uppercase font-bold">{isSpecialActive ? 'Liberado' : 'Bloqueado'}</span>
            </div>

            <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 ${
              isLiaActive 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200' 
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500'
            }`}>
              <span className="font-semibold">lia_access</span>
              <span className="text-[10px] uppercase font-bold">{isLiaActive ? 'Liberado' : 'Bloqueado'}</span>
            </div>
          </div>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 text-center pt-1">
            * Para liberar o LEVE completo, a coluna <code>leve_access</code> ou <code>special_access</code> deve ser <code>true</code>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || isCheckingEntitlements}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing || isCheckingEntitlements ? 'animate-spin' : ''}`} />
            <span>Verificar Novamente</span>
          </button>

          <button
            type="button"
            onClick={() => logout()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-stone-500" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
