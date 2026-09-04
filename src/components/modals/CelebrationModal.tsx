import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Award, Sparkles, Check, Heart } from 'lucide-react';

export const CelebrationModal: React.FC = () => {
  const {
    celebrationAchievement,
    closeCelebration,
    setIsAchievementsOpen,
    data
  } = useApp();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCelebration();
      }
    };
    if (celebrationAchievement) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [celebrationAchievement, closeCelebration]);

  if (!celebrationAchievement) return null;

  const userName = data.user?.name || 'amiga';

  const handleViewAllAchievements = () => {
    closeCelebration();
    setIsAchievementsOpen(true);
  };

  return (
    <div
      id="celebration-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onClick={closeCelebration}
    >
      <div
        id="celebration-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-amber-200/80 dark:border-amber-800/60 shadow-2xl p-6 sm:p-7 text-stone-900 dark:text-stone-100 text-center overflow-hidden animate-in zoom-in-95 duration-300"
      >
        {/* Soft celebratory decorative background glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-amber-200/40 dark:bg-amber-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-emerald-200/40 dark:bg-emerald-500/10 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="close-celebration-btn"
          onClick={closeCelebration}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 transition"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Floating Confetti Particle Accents */}
        <div className="flex justify-center gap-2 mb-2 select-none text-base sm:text-lg animate-bounce duration-1000">
          <span>✨</span>
          <span>🎉</span>
          <span>🌟</span>
          <span>💫</span>
          <span>✨</span>
        </div>

        {/* Badge Icon Circle */}
        <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 p-1 shadow-lg shadow-amber-500/20 mb-4 flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-white dark:bg-stone-900 flex items-center justify-center text-4xl sm:text-5xl">
            {celebrationAchievement.icon}
          </div>
        </div>

        {/* Micro Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-300/60 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 text-[11px] font-bold tracking-wider uppercase mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Recompensa Desbloqueada!</span>
        </div>

        {/* Big Congratulations Title */}
        <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50 mt-1">
          Parabéns, {userName}! 🎉
        </h2>

        {/* Achievement Card Content */}
        <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <span className="text-xl">{celebrationAchievement.icon}</span>
            <h3 className="font-serif text-base sm:text-lg font-bold text-amber-950 dark:text-amber-100">
              {celebrationAchievement.title}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed pl-7">
            {celebrationAchievement.description}
          </p>
        </div>

        {/* Uplifting Warm Message */}
        <p className="font-serif italic text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-4 leading-relaxed max-w-sm mx-auto">
          "Cada pequeno passo que você dá com calma constrói uma rotina mais harmoniosa, organizada e cheia de paz." 🤍
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <button
            id="celebration-confirm-btn"
            onClick={closeCelebration}
            className="flex-1 py-3 px-4 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-xs sm:text-sm transition shadow-md shadow-[#1F3A34]/20 flex items-center justify-center gap-2 group"
          >
            <span>Continuar com leveza</span>
            <Sparkles className="w-4 h-4 text-emerald-300 group-hover:rotate-12 transition-transform" />
          </button>

          <button
            id="celebration-view-all-btn"
            onClick={handleViewAllAchievements}
            className="py-3 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1.5"
          >
            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Ver Conquistas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
