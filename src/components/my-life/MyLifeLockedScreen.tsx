// Tela de Bloqueio Exclusiva para a Aba Minha Vida - LEVE
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Sparkles, BookOpen, Film, Tv, Heart, MapPin, Compass, RefreshCw, LogIn } from 'lucide-react';
import { parseBoolean } from '../../services/supabase';

interface MyLifeLockedScreenProps {
  onBypassDemo?: () => void;
}

export const MyLifeLockedScreen: React.FC<MyLifeLockedScreenProps> = ({ onBypassDemo }) => {
  const { user, entitlements, refreshEntitlements, setIsAuthModalOpen, isCheckingEntitlements } = useAuth();
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

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-xl w-full bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/90 dark:border-stone-800 shadow-xl space-y-6 text-center">
        {/* Soft Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-[#1F3A34] dark:text-emerald-300 shadow-xs">
          <Lock className="w-7 h-7" />
        </div>

        {/* Header Text */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Exclusivo Planos LEVE & LEVE Completo</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 pt-1">
            Minha Vida 🌿
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
            Guarde seus livros, filmes, séries, hobbies, lugares que você quer conhecer e sonhos para a sua jornada.
          </p>
        </div>

        {/* Feature Preview Pill Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-stone-700 dark:text-stone-300 pt-1">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/60 dark:border-stone-800">
            <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium truncate">Livros & Leituras</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/60 dark:border-stone-800">
            <Film className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium truncate">Filmes</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/60 dark:border-stone-800">
            <Tv className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium truncate">Séries</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/60 dark:border-stone-800">
            <Heart className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium truncate">Meus Hobbies</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/60 dark:border-stone-800">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium truncate">Lugares para Ir</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/60 dark:border-stone-800">
            <Compass className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium truncate">Sonhos & Desejos</span>
          </div>
        </div>

        {/* Status explanation */}
        <div className="p-4 rounded-2xl bg-[#F9FAF8] dark:bg-stone-850/80 border border-stone-200/80 dark:border-stone-800 text-left space-y-2">
          {user ? (
            <div>
              <p className="text-xs text-stone-600 dark:text-stone-300">
                Você está conectado como <strong className="text-stone-900 dark:text-stone-100">{user.email}</strong>.
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Para liberar esta aba, sua conta precisa do <strong>Plano LEVE</strong> ou <strong>Plano LEVE Completo</strong> ativo no Supabase.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                Acesse sua conta para sincronizar seus itens com segurança:
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Todos os dados de Minha Vida são vinculados de forma protegida e privada exclusivamente ao seu usuário logado na nuvem.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {user ? (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || isCheckingEntitlements}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-xs sm:text-sm font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing || isCheckingEntitlements ? 'animate-spin' : ''}`} />
              <span>Verificar Permissões</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-xs sm:text-sm font-semibold shadow-md transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Entrar com Conta LEVE</span>
            </button>
          )}

          {onBypassDemo && (
            <button
              type="button"
              onClick={onBypassDemo}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Explorar Demonstração</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
