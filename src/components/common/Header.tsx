import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatDateToBrazilian, getTodayDateString } from '../../services/storage';
import { Menu } from 'lucide-react';
import { UserAvatar } from './UserAvatar';

export const Header: React.FC = () => {
  const { data, setIsMobileMenuOpen } = useApp();
  const { user } = useAuth();

  // Nome da pessoa conectada (respeita o perfil salvo ou metadados da conta)
  const userName = 
    data.user.name?.trim() || 
    (user?.user_metadata?.full_name || user?.user_metadata?.name || '')?.trim() || 
    (user?.email ? user.email.split('@')[0] : '') || 
    'Meu Perfil';

  // Data serena e proporcional para celular, tablet e computador
  const dateInfo = useMemo(() => {
    const todayStr = getTodayDateString();
    const full = formatDateToBrazilian(todayStr);

    try {
      const [year, month, day] = todayStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const weekdayShort = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const monthShort = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const capitalizedWeekday = weekdayShort.charAt(0).toUpperCase() + weekdayShort.slice(1);
      const compact = `${capitalizedWeekday}, ${day} de ${monthShort}`;
      return { full, compact };
    } catch {
      return { full, compact: full };
    }
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[#F9FAF8]/95 dark:bg-[#141B18]/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 transition-colors pt-safe-header">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* 1. Nome do App & Ícone (com a data por baixo no mobile e tablet) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <button
            id="header-mobile-menu-btn"
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-1.5 -ml-1 rounded-xl text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800/60 transition active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
            title="Abrir menu"
            aria-label="Abrir menu de navegação"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-xs ring-1 ring-stone-300/80 dark:ring-stone-700 bg-white shrink-0">
              <img src="/app-icon.png" alt="LEVE" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-serif tracking-widest text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-tight">
                LEVE
              </span>
              {/* Data posicionada por baixo do nome do app no mobile e tablet */}
              <span className="lg:hidden text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-medium truncate capitalize leading-tight mt-0.5">
                <span className="sm:hidden">{dateInfo.compact}</span>
                <span className="hidden sm:inline">{dateInfo.full}</span>
              </span>
            </div>
          </div>
        </div>

        {/* 2. A Data centralizada (no computador / desktop) */}
        <div className="hidden lg:flex items-center justify-center text-center min-w-0 px-4">
          <span className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-medium truncate capitalize">
            {dateInfo.full}
          </span>
        </div>

        {/* 3. Nome da pessoa logada + foto ou avatar escolhido (apenas visualização) */}
        <div 
          id="header-user-btn"
          className="flex items-center gap-2 sm:gap-2.5 shrink-0 select-none"
          aria-label="Perfil do usuário"
        >
          <div className="flex items-center gap-1.5 max-w-[120px] sm:max-w-[200px]">
            <span className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 truncate text-right">
              {userName}
            </span>
            {user && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 shrink-0">
                VIP
              </span>
            )}
          </div>
          <div className="shrink-0">
            <UserAvatar 
              avatar={data.user.avatar} 
              name={userName} 
              size="sm" 
            />
          </div>
        </div>
      </div>
    </header>
  );
};


