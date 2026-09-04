import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Award, CheckCircle, Lock } from 'lucide-react';
import { ACHIEVEMENTS_LIST } from '../../services/quotesAndVerses';

export const AchievementsModal: React.FC = () => {
  const { isAchievementsOpen, setIsAchievementsOpen, data } = useApp();

  if (!isAchievementsOpen) return null;

  const unlockedCount = Object.keys(data.unlockedAchievements).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-5 sm:p-7 space-y-5 my-8 text-stone-900 dark:text-stone-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/70 flex items-center justify-center text-amber-700 dark:text-amber-300">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold">
                Minhas Conquistas 🏆
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                {unlockedCount} de {ACHIEVEMENTS_LIST.length} pequenos marcos alcançados
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAchievementsOpen(false)}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 bg-stone-100 dark:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gamification grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {ACHIEVEMENTS_LIST.map((ach) => {
            const isUnlocked = !!data.unlockedAchievements[ach.id];
            return (
              <div
                key={ach.id}
                className={`p-3.5 rounded-2xl border transition flex items-start gap-3 ${
                  isUnlocked
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 text-stone-800 dark:text-stone-100 shadow-xs'
                    : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200/60 dark:border-stone-800/60 text-stone-400 dark:text-stone-500 opacity-70'
                }`}
              >
                <div className="text-2xl flex-shrink-0 p-1">
                  {ach.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className={`text-xs sm:text-sm font-semibold truncate ${isUnlocked ? 'text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400'}`}>
                      {ach.title}
                    </h4>
                    {isUnlocked ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 leading-snug">
                    {ach.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 text-center">
          <p className="text-xs text-stone-500 italic">
            "Cada pequeno hábito é um voto na pessoa que você está se tornando."
          </p>
        </div>
      </div>
    </div>
  );
};
