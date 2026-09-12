// Tela de Bloqueio Exclusiva para a Aba Minha Vida - LEVE
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Sparkles, BookOpen, Film, Tv, Heart, MapPin, Compass, RefreshCw, LogIn, ExternalLink, Star, Crown } from 'lucide-react';
import { HOTMART_CHECKOUT, buildHotmartUrl } from '../../services/authorization';

interface MyLifeLockedScreenProps {
  onBypassDemo?: () => void;
}

export const MyLifeLockedScreen: React.FC<MyLifeLockedScreenProps> = ({ onBypassDemo }) => {
  const { user, refreshEntitlements, setIsAuthModalOpen, isCheckingEntitlements } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshEntitlements();
    } finally {
      setIsRefreshing(false);
    }
  };

  const especialUrl = buildHotmartUrl(HOTMART_CHECKOUT.ESPECIAL, user?.email);
  const vipDirectUrl = buildHotmartUrl(HOTMART_CHECKOUT.VIP_DIRECT, user?.email);

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
            <span>Disponível nos Planos LEVE Especial & VIP</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 pt-1">
            Entretenimento & Lazer 🎬
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
            Guarde seus filmes, séries, livros, hobbies, lugares que você quer conhecer e sonhos para a sua jornada.
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
                Para liberar esta aba, sua conta precisa do <strong>LEVE Especial</strong> ou <strong>LEVE VIP</strong> ativo.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                Acesse sua conta para sincronizar seus itens com segurança:
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Todos os dados de Entretenimento & Lazer são vinculados de forma protegida e privada exclusivamente ao seu usuário logado na nuvem.
              </p>
            </div>
          )}
        </div>

        {/* Checkout Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <a
            id="btn-checkout-especial-my-life"
            href={especialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <Star className="w-4 h-4 text-amber-300" />
            <span>Adquirir LEVE Especial por R$ 49,90</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>

          <a
            id="btn-checkout-vip-from-my-life"
            href={vipDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>Ou assinar LEVE VIP com LEVIA por R$ 65,90</span>
          </a>
        </div>

        {/* Auxiliary Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-800/80">
          {user ? (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || isCheckingEntitlements}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isCheckingEntitlements ? 'animate-spin' : ''}`} />
              <span>Já comprei? Verificar permissões</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Já possui conta? Entrar</span>
            </button>
          )}

          {onBypassDemo && (
            <button
              type="button"
              onClick={onBypassDemo}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Explorar Demonstração</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
