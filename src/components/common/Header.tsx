import React from 'react';
import { useApp } from '../../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import { formatDateToBrazilian, getTodayDateString } from '../../services/storage';
import { Search, Award, Menu } from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    data, 
    setIsSearchOpen, 
    setIsAchievementsOpen,
    setIsMobileMenuOpen,
    todayCompletionPercentage
  } = useApp();

  const todayBrazilian = formatDateToBrazilian(getTodayDateString());
  const unlockedCount = Object.keys(data.unlockedAchievements).length;

  return (
    <header className="sticky top-0 z-30 bg-[#F9FAF8]/95 dark:bg-[#141B18]/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 transition-colors pt-safe-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 relative flex items-center justify-between">
        {/* Left side: Hamburger 3 bars button & brand icon */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            id="header-mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-1 rounded-xl text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800/60 transition active:scale-95 flex items-center justify-center"
            title="Abrir menu com todas as opções"
            aria-label="Abrir todas as opções"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-9 h-9 rounded-xl bg-[#1F3A34] text-emerald-100 flex items-center justify-center font-bold text-base shadow-xs ring-1 ring-emerald-700/30">
            <span className="font-serif italic text-lg">L</span>
          </div>
        </div>

        {/* Center: LEVE Name & Date underneath */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="font-serif tracking-widest text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
            LEVE
          </span>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
            {todayBrazilian}
          </span>
        </div>

        {/* Action controls on right */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Achievements badge */}
          <button
            id="header-achievements-btn"
            onClick={() => setIsAchievementsOpen(true)}
            className="relative p-2 rounded-full text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800/60 transition"
            title="Minhas Conquistas"
          >
            <Award className="w-4 h-4 text-amber-700 dark:text-amber-300" />
            {unlockedCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 text-[9px] font-bold text-white flex items-center justify-center">
                {unlockedCount}
              </span>
            )}
          </button>

          {/* Search trigger */}
          <button
            id="header-search-btn"
            onClick={() => setIsSearchOpen(true)}
            className="p-2 rounded-full text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800/60 transition"
            title="Buscar tarefas, notas, orações..."
          >
            <Search className="w-4 h-4" />
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton compact />

          {/* Daily completion mini pill on larger screens */}
          <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-stone-200 dark:border-stone-800 text-xs font-medium text-stone-600 dark:text-stone-300">
            <span>Dia:</span>
            <span className="font-semibold text-emerald-800 dark:text-emerald-300">{todayCompletionPercentage}%</span>
          </div>
        </div>
      </div>
    </header>
  );
};
