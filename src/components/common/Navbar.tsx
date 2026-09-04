import React from 'react';
import { useApp, ActiveTab } from '../../context/AppContext';
import { 
  Sun, Calendar, Sprout, BookOpen, HeartHandshake, Target, 
  Menu 
} from 'lucide-react';

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, setIsMobileMenuOpen } = useApp();

  const primaryNavItems: NavItem[] = [
    { id: 'my-day', label: 'Meu Dia', icon: Sun },
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'habits', label: 'Hábitos', icon: Sprout },
    { id: 'journal', label: 'Caderno', icon: BookOpen },
    { id: 'spirituality', label: 'Fé', icon: HeartHandshake },
    { id: 'goals', label: 'Metas', icon: Target },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  const isCurrentInMore = !primaryNavItems.some((item) => item.id === activeTab);

  return (
    <nav aria-label="Navegação móvel" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F9FAF8]/95 dark:bg-[#141B18]/95 backdrop-blur-lg border-t border-stone-200/80 dark:border-stone-800/80 pb-safe transition-colors">
      <div className="grid grid-cols-7 items-center px-1 py-1.5">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => handleSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition ${
                isActive
                  ? 'text-emerald-900 dark:text-emerald-300 font-semibold'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <div className={`p-1 rounded-full transition ${isActive ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* 3 Barrinhas button / Mais Opções */}
        <button
          id="nav-item-more"
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition ${
            isCurrentInMore
              ? 'text-emerald-900 dark:text-emerald-300 font-semibold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
          title="Abrir menu completo com todas as opções"
          aria-label="Abrir menu completo com todas as opções"
        >
          <div className={`p-1 rounded-full transition ${isCurrentInMore ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300' : ''}`}>
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
};
