import React from 'react';
import { useApp, ActiveTab } from '../../context/AppContext';
import { 
  Sun, Calendar, Sprout, BookOpen, HeartHandshake, Target, 
  Droplets, Utensils, Activity, Moon, Heart, Receipt, 
  BarChart3, Settings, Sparkles, Award
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    data, 
    setIsAchievementsOpen,
    todayCompletionPercentage
  } = useApp();

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

  return (
    <aside aria-label="Navegação principal" className="hidden md:flex flex-col w-64 lg:w-72 bg-[#F6F7F4] dark:bg-[#111714] border-r border-stone-200/80 dark:border-stone-800/80 min-h-screen p-4 justify-between transition-colors">
      <div className="space-y-6">
        {/* Brand header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1F3A34] text-emerald-100 flex items-center justify-center font-bold text-lg shadow-sm ring-1 ring-emerald-600/30">
              <span className="font-serif italic text-xl">L</span>
            </div>
            <div>
              <h1 className="font-serif font-bold text-xl tracking-widest text-stone-900 dark:text-stone-100">
                LEVE
              </h1>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Tire da cabeça. Coloque em ordem.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav aria-label="Seções do aplicativo" className="space-y-4 px-1 text-xs sm:text-sm overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
          {/* Main group */}
          <div>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Principal
            </span>
            <div className="mt-1 space-y-0.5">
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-link-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition text-left ${
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

          {/* Wellness group */}
          <div>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Corpo & Cuidado
            </span>
            <div className="mt-1 space-y-0.5">
              {wellnessNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-link-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition text-left ${
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

          {/* Management group */}
          <div>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Controle & Avanço
            </span>
            <div className="mt-1 space-y-0.5">
              {managementNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-link-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition text-left ${
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
        </nav>
      </div>

      {/* Footer Profile & Conquistas card */}
      <div className="pt-3 border-t border-stone-200/80 dark:border-stone-800/80 space-y-2.5">
        {/* Achievements trigger */}
        <button
          onClick={() => setIsAchievementsOpen(true)}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-left hover:bg-amber-100/60 transition"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🏆</span>
            <div>
              <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200">Minhas Conquistas</p>
              <p className="text-[10px] text-amber-700 dark:text-amber-400">{unlockedCount} medalhas desbloqueadas</p>
            </div>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
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
            onClick={() => setActiveTab('settings')}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
            title="Abrir Configurações"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
