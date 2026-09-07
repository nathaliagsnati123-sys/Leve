import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp, ActiveTab } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  ChevronLeft, ChevronRight, Sun, Calendar, Sprout, 
  BookOpen, HeartHandshake, Target, Droplets, Utensils, 
  Activity, Moon, Heart, Receipt, BarChart3, Settings, 
  Sparkles, Compass, Lock 
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const { canAccessFeature } = useAuth();

  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollStart, setScrollStart] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);

  const navItems = [
    { id: 'my-day' as ActiveTab, label: 'Meu Dia', icon: Sun },
    { id: 'calendar' as ActiveTab, label: 'Calendário', icon: Calendar },
    { id: 'habits' as ActiveTab, label: 'Hábitos', icon: Sprout },
    { id: 'journal' as ActiveTab, label: 'Caderno', icon: BookOpen },
    { id: 'spirituality' as ActiveTab, label: 'Espiritualidade', icon: HeartHandshake },
    { id: 'goals' as ActiveTab, label: 'Metas', icon: Target },
    { id: 'hydration' as ActiveTab, label: 'Água', icon: Droplets },
    { id: 'nutrition' as ActiveTab, label: 'Alimentação', icon: Utensils },
    { id: 'movement' as ActiveTab, label: 'Movimento', icon: Activity },
    { id: 'sleep' as ActiveTab, label: 'Sono', icon: Moon },
    { id: 'self-care' as ActiveTab, label: 'Autocuidado', icon: Heart },
    { id: 'bills' as ActiveTab, label: 'Finanças', icon: Receipt },
    { id: 'cycle' as ActiveTab, label: 'Ciclo', icon: Activity },
    { id: 'my-life' as ActiveTab, label: 'Minha Vida', icon: Compass },
    { id: 'progress' as ActiveTab, label: 'Evolução', icon: BarChart3 },
    { id: 'lia' as ActiveTab, label: 'Levia • IA', icon: Sparkles, badge: 'VIP' },
    { id: 'settings' as ActiveTab, label: 'Configurações', icon: Settings },
  ];

  // Check scroll bounds to enable/disable arrow buttons
  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScroll();

    // ResizeObserver to recheck bounds on viewport change
    const resizeObserver = new ResizeObserver(() => checkScroll());
    resizeObserver.observe(el);

    el.addEventListener('scroll', checkScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      el.removeEventListener('scroll', checkScroll);
    };
  }, [checkScroll]);

  // Center active tab smoothly on change
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const activeEl = el.querySelector<HTMLElement>(`[data-tab-id="${activeTab}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    // Update scroll buttons after movement
    setTimeout(checkScroll, 300);
  }, [activeTab, checkScroll]);

  // Scroll with arrows
  const handleScroll = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const distance = direction === 'left' ? -240 : 240;
    el.scrollBy({ left: distance, behavior: 'smooth' });
    setTimeout(checkScroll, 250);
  };

  // Mouse Drag-to-Scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollStart(el.scrollLeft);
    setHasDragged(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const el = containerRef.current;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.3;
    if (Math.abs(walk) > 4) {
      setHasDragged(true);
    }
    el.scrollLeft = scrollStart - walk;
    checkScroll();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <nav 
      aria-label="Navegação rápida de opções"
      className="relative flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-stone-100/70 dark:bg-stone-900/60 backdrop-blur-md rounded-2xl border border-stone-200/70 dark:border-stone-800/80 shadow-xs mb-4 select-none"
    >
      {/* Setinha para a esquerda */}
      <button
        type="button"
        id="navbar-scroll-left-btn"
        onClick={() => handleScroll('left')}
        disabled={!canScrollLeft}
        aria-label="Rolar opções para a esquerda"
        title="Rolar opções para a esquerda"
        className={`w-8 h-8 rounded-full border transition-all duration-200 shrink-0 flex items-center justify-center cursor-pointer ${
          canScrollLeft
            ? 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-stone-700 hover:border-emerald-300 active:scale-90 shadow-xs'
            : 'opacity-25 pointer-events-none text-stone-400 dark:text-stone-600 border-stone-200/50 dark:border-stone-800'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Draggable & Scrollable Options Row */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={`flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-1 scroll-smooth w-full touch-pan-x ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isLocked = !canAccessFeature(item.id);

          return (
            <button
              key={item.id}
              type="button"
              data-tab-id={item.id}
              id={`navbar-option-${item.id}`}
              onClick={() => {
                if (hasDragged) return;
                setActiveTab(item.id);
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 select-none cursor-pointer ${
                isActive
                  ? 'bg-[#1F3A34] text-white shadow-xs scale-[1.02]'
                  : 'bg-white/80 dark:bg-stone-850/80 text-stone-700 dark:text-stone-300 border border-stone-200/70 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 hover:border-emerald-300/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-300' : 'text-stone-500 dark:text-stone-400'}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                  isActive
                    ? 'bg-amber-400/20 text-amber-200'
                    : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800'
                }`}>
                  {item.badge}
                </span>
              )}
              {isLocked && !item.badge && (
                <Lock className="w-3 h-3 text-stone-400 dark:text-stone-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Setinha para a direita */}
      <button
        type="button"
        id="navbar-scroll-right-btn"
        onClick={() => handleScroll('right')}
        disabled={!canScrollRight}
        aria-label="Rolar opções para a direita"
        title="Rolar opções para a direita"
        className={`w-8 h-8 rounded-full border transition-all duration-200 shrink-0 flex items-center justify-center cursor-pointer ${
          canScrollRight
            ? 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-stone-700 hover:border-emerald-300 active:scale-90 shadow-xs'
            : 'opacity-25 pointer-events-none text-stone-400 dark:text-stone-600 border-stone-200/50 dark:border-stone-800'
        }`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
};


