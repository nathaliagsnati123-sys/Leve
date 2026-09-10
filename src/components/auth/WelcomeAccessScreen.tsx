import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Heart, UserPlus, LogIn } from 'lucide-react';

interface WelcomeAccessScreenProps {
  onOpenLogin: () => void;
  onOpenSignup: () => void;
}

export const WelcomeAccessScreen: React.FC<WelcomeAccessScreenProps> = ({
  onOpenLogin,
  onOpenSignup
}) => {
  return (
    <div className="min-h-screen bg-[#F9FAF8] dark:bg-[#121915] text-stone-800 dark:text-stone-100 flex flex-col justify-between transition-colors duration-200">
      {/* Subtle top organic ambient leaf decorative glow */}
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-emerald-100/40 via-emerald-50/20 to-transparent dark:from-emerald-950/20 dark:via-emerald-950/5 dark:to-transparent pointer-events-none" />

      {/* Top minimal bar with logo */}
      <header className="relative z-10 max-w-5xl mx-auto w-full px-5 sm:px-8 pt-6 sm:pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-xs ring-1 ring-stone-200 dark:ring-stone-700 bg-white">
            <img src="/app-icon.png" alt="LEVE" className="w-full h-full object-cover" />
          </div>
          <span className="font-serif tracking-widest text-xl font-bold text-[#1F3A34] dark:text-emerald-300">
            LEVE
          </span>
        </div>

        <button
          onClick={onOpenLogin}
          className="text-xs sm:text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white px-3.5 py-1.5 rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-800/60 transition"
        >
          Já tem conta? <span className="underline underline-offset-4 text-emerald-800 dark:text-emerald-400">Entrar</span>
        </button>
      </header>

      {/* Main hero card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-lg bg-white/95 dark:bg-[#1A231F]/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-stone-200/80 dark:border-stone-800 shadow-xl shadow-stone-900/5 text-center space-y-6">
          
          {/* Calm decorative pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Sua rotina em paz e leveza</span>
          </div>

          {/* Core required titles */}
          <div className="space-y-3">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50 leading-tight">
              Bem-vinda ao LEVE
            </h1>
            <p className="font-serif text-lg sm:text-xl text-stone-600 dark:text-stone-300 italic">
              “Tire da cabeça. Coloque em ordem.”
            </p>
          </div>

          <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
            Um espaço seguro e acolhedor para organizar suas tarefas, compromissos e ideias no seu próprio ritmo, sem cobrança ou sobrecarga.
          </p>

          {/* Action buttons */}
          <div className="pt-2 space-y-3 max-w-xs mx-auto">
            {/* Entrar */}
            <button
              id="welcome-login-btn"
              onClick={onOpenLogin}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#1F3A34] hover:bg-[#162924] active:scale-[0.99] text-white font-semibold text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-emerald-300" />
              <span>Entrar</span>
            </button>

            {/* Criar minha conta */}
            <button
              id="welcome-signup-btn"
              onClick={onOpenSignup}
              className="w-full py-3.5 px-5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200/80 dark:hover:bg-stone-700/80 active:scale-[0.99] text-stone-800 dark:text-stone-100 font-semibold text-sm sm:text-base border border-stone-300/80 dark:border-stone-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              <span>Criar minha conta</span>
            </button>
          </div>

          {/* Calming reassure badge */}
          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-stone-400 dark:text-stone-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Acesso individual protegido e seguro</span>
          </div>
        </div>
      </main>

      {/* Subtle bottom footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-stone-400 dark:text-stone-500">
        <p>LEVE • Clareza e serenidade para os seus dias</p>
      </footer>
    </div>
  );
};
