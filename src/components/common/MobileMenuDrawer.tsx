import React, { useEffect } from 'react';
import { useApp, ActiveTab } from '../../context/AppContext';
import { 
  Sun, Calendar, Sprout, BookOpen, HeartHandshake, Target, 
  Droplets, Utensils, Activity, Moon, Heart, Receipt, 
  BarChart3, Settings, Brain, Sparkles, Award, X
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const MobileMenuDrawer: React.FC = () => {
  const { 
    isMobileMenuOpen, 
    setIsMobileMenuOpen,
    activeTab, 
    setActiveTab, 
    data, 
    setIsBrainDumpOpen, 
    setIsDayClosingOpen,
    setIsAchievementsOpen,
    todayCompletionPercentage
  } = useApp();

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling while drawer is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  if (!isMobileMenuOpen) return null;

  const mainNav = [
    { id: 'my-day' as ActiveTab, label: 'Meu Dia', icon: Sun },
    { id: 'calendar' as ActiveTab, label: 'Calendário & Semana', icon: Calendar },
    { id: 'habits' as ActiveTab, label: 'Meus Hábitos', icon: Sprout },
    { id: 'journal' as ActiveTab, label: 'Meu Caderno & Gratidão', icon: BookOpen },
    { id: 'spirituality' as ActiveTab, label: 'Fé & Momento com Deus', icon: HeartHandshake },
    { id: 'goals' as ActiveTab, label: 'Minhas Metas', icon: Target },
  ];

  const wellnessNav = [
    { id: 'hydration' as ActiveTab, label: 'Minha Água', icon: Droplets },
    { id: 'nutrition' as ActiveTab, label: 'Alimentação & Compras', icon: Utensils },
    { id: 'movement' as ActiveTab, label: 'Meu Movimento', icon: Activity },
    { id: 'sleep' as ActiveTab, label: 'Meu Sono', icon: Moon },
    { id: 'self-care' as ActiveTab, label: 'Meu Autocuidado', icon: Heart },
    { id: 'cycle' as ActiveTab, label: 'Ciclo & Menstruação', icon: Sparkles },
  ];

  const managementNav = [
    { id: 'bills' as ActiveTab, label: 'Contas & Pendências', icon: Receipt },
    { id: 'progress' as ActiveTab, label: 'Meu Progresso', icon: BarChart3 },
    { id: 'settings' as ActiveTab, label: 'Configurações & Backup', icon: Settings },
  ];

  const unlockedCount = Object.keys(data.unlockedAchievements).length;

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const handleOpenBrainDump = () => {
    setIsMobileMenuOpen(false);
    setIsBrainDumpOpen(true);
  };

  const handleOpenDayClosing = () => {
    setIsMobileMenuOpen(false);
    setIsDayClosingOpen(true);
  };

  const handleOpenAchievements = () => {
    setIsMobileMenuOpen(false);
    setIsAchievementsOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden flex" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div 
        onClick={() => setIsMobileMenuOpen(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Container */}
      <div className="relative z-10 w-[85vw] max-w-sm bg-[#F6F7F4] dark:bg-[#111714] text-stone-900 dark:text-stone-100 h-full flex flex-col justify-between shadow-2xl border-r border-stone-200/80 dark:border-stone-800/80 animate-in slide-in-from-left duration-250">
        
        {/* Top Header */}
        <div className="p-4 pt-safe-header border-b border-stone-200/70 dark:border-stone-800/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1F3A34] text-emerald-100 flex items-center justify-center font-bold text-lg shadow-sm ring-1 ring-emerald-600/30">
              <span className="font-serif italic text-xl">L</span>
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg tracking-widest text-stone-900 dark:text-stone-100 leading-tight">
                LEVE
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Todas as opções
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 transition"
            title="Fechar menu"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Group 1: Principal */}
          <div>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Principal
            </span>
            <div className="mt-1.5 space-y-1">
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`mobile-drawer-link-${item.id}`}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition text-left ${
                      isActive
                        ? 'bg-[#1F3A34] text-emerald-100 shadow-xs'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-stone-500 dark:text-stone-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 2: Corpo & Cuidado */}
          <div>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Corpo & Cuidado
            </span>
            <div className="mt-1.5 space-y-1">
              {wellnessNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`mobile-drawer-link-${item.id}`}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition text-left ${
                      isActive
                        ? 'bg-[#1F3A34] text-emerald-100 shadow-xs'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-stone-500 dark:text-stone-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 3: Controle & Avanço */}
          <div>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Controle & Avanço
            </span>
            <div className="mt-1.5 space-y-1">
              {managementNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`mobile-drawer-link-${item.id}`}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition text-left ${
                      isActive
                        ? 'bg-[#1F3A34] text-emerald-100 shadow-xs'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-stone-500 dark:text-stone-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Drawer Footer (User & Achievements) */}
        <div className="p-4 pb-safe border-t border-stone-200/70 dark:border-stone-800/70 space-y-2.5 bg-[#F6F7F4]/90 dark:bg-[#111714]/90">
          {/* Achievements button */}
          <button
            onClick={handleOpenAchievements}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 text-left hover:bg-amber-100/70 transition"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">🏆</span>
              <div>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">Minhas Conquistas</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-400">{unlockedCount} medalhas desbloqueadas</p>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </button>

          {/* User Mini Card */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-sm">
                {data.user.avatar || '🌿'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                  {data.user.name || 'Você'}
                </p>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                  Dia {todayCompletionPercentage}% concluído
                </p>
              </div>
            </div>
            <button
              onClick={() => handleSelectTab('settings')}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
              title="Abrir Configurações"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
