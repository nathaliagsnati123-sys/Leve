import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Search, CheckSquare, Sprout, Target, BookOpen, HeartHandshake, Image, ShoppingBag, Receipt, ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import { JournalEntry } from '../../types';

export const SearchModal: React.FC = () => {
  const { 
    isSearchOpen, 
    setIsSearchOpen, 
    data, 
    setActiveTab, 
    setEditingTask, 
    setIsTaskModalOpen 
  } = useApp();

  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const matches: {
      type: string;
      icon: React.ComponentType<{ className?: string }>;
      title: string;
      subtitle?: string;
      action: () => void;
    }[] = [];

    // Search tasks
    data.tasks.forEach((t) => {
      if (t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)) {
        matches.push({
          type: 'Tarefa',
          icon: CheckSquare,
          title: t.title,
          subtitle: `${t.category} • ${t.date}`,
          action: () => {
            setEditingTask(t);
            setIsTaskModalOpen(true);
            setIsSearchOpen(false);
          }
        });
      }
    });

    // Search habits
    data.habits.forEach((h) => {
      if (h.name.toLowerCase().includes(q) || h.category.toLowerCase().includes(q)) {
        matches.push({
          type: 'Hábito',
          icon: Sprout,
          title: `${h.icon} ${h.name}`,
          subtitle: `${h.category} • Meta semanal: ${h.targetDaysPerWeek} dias`,
          action: () => {
            setActiveTab('habits');
            setIsSearchOpen(false);
          }
        });
      }
    });

    // Search goals
    (data.goals || []).forEach((g) => {
      if (g.name.toLowerCase().includes(q) || (g.description && g.description.toLowerCase().includes(q))) {
        matches.push({
          type: 'Meta',
          icon: Target,
          title: g.name,
          subtitle: `${g.category} • ${(g.steps || []).length} passos`,
          action: () => {
            setActiveTab('goals');
            setIsSearchOpen(false);
          }
        });
      }
    });

    // Search journal / notes
    (Object.values(data.journal || {}) as JournalEntry[]).forEach((j) => {
      const texts = [
        ...(j.gratitude || []),
        ...(j.goodThings || []),
        j.specialMoment || '',
        j.doneForMe || '',
        j.mindDump || ''
      ].join(' ').toLowerCase();

      if (texts.includes(q)) {
        matches.push({
          type: 'Caderno',
          icon: BookOpen,
          title: `Registro de ${j.date}`,
          subtitle: j.specialMoment || (j.gratitude && j.gratitude[0]) || 'Anotações diárias',
          action: () => {
            setActiveTab('journal');
            setIsSearchOpen(false);
          }
        });
      }
    });

    // Search memories
    data.memories.forEach((m) => {
      if (m.title.toLowerCase().includes(q) || m.text.toLowerCase().includes(q)) {
        matches.push({
          type: 'Memória',
          icon: Image,
          title: m.title,
          subtitle: m.date,
          action: () => {
            setActiveTab('journal');
            setIsSearchOpen(false);
          }
        });
      }
    });

    // Search prayers
    data.prayers.forEach((p) => {
      if (p.content.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) {
        matches.push({
          type: 'Oração',
          icon: HeartHandshake,
          title: p.content.slice(0, 45) + '...',
          subtitle: `${p.category} • ${p.date}`,
          action: () => {
            setActiveTab('spirituality');
            setIsSearchOpen(false);
          }
        });
      }
    });

    // Search groceries
    data.groceries.forEach((g) => {
      if (g.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q)) {
        matches.push({
          type: 'Compras',
          icon: ShoppingBag,
          title: g.name,
          subtitle: g.category,
          action: () => {
            setActiveTab('nutrition');
            setIsSearchOpen(false);
          }
        });
      }
    });

    // Search bills
    (data.bills || []).forEach((b) => {
      if (b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q)) {
        matches.push({
          type: 'Conta',
          icon: Receipt,
          title: b.name,
          subtitle: `R$ ${b.amount.toFixed(2)} • Vence: ${b.dueDate}`,
          action: () => {
            setActiveTab('bills');
            setIsSearchOpen(false);
          }
        });
      }
    });

    // Search incomes / receitas
    (data.incomes || []).forEach((inc) => {
      if (inc.description.toLowerCase().includes(q) || inc.category.toLowerCase().includes(q) || (inc.notes && inc.notes.toLowerCase().includes(q))) {
        matches.push({
          type: 'Ganho / Receita',
          icon: TrendingUp,
          title: inc.description,
          subtitle: `R$ ${inc.amount.toFixed(2)} • ${inc.category} (${inc.received ? 'Recebido' : 'A receber'})`,
          action: () => {
            setActiveTab('bills');
            setIsSearchOpen(false);
          }
        });
      }
    });

    // Search cycle & feminine care keywords
    if (['ciclo', 'menstrua', 'periodo', 'tpm', 'ovula', 'folicular', 'lutea', 'colica', 'humor'].some(k => q.includes(k))) {
      matches.push({
        type: 'Saúde Feminina',
        icon: Sparkles,
        title: 'Meu Ciclo & Menstruação',
        subtitle: 'Fases, fluxo, previsão e registros diários de bem-estar',
        action: () => {
          setActiveTab('cycle');
          setIsSearchOpen(false);
        }
      });
    }

    return matches;
  }, [query, data, setActiveTab, setEditingTask, setIsTaskModalOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-4 pt-16 sm:pt-20 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Search Bar */}
        <div className="flex items-center gap-3 p-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850">
          <Search className="w-5 h-5 text-stone-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tarefas, hábitos, metas, notas, orações..."
            className="flex-1 bg-transparent text-sm sm:text-base text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              Limpar
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-1">
          {query.trim() && results.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs sm:text-sm">
              <p>Nenhum resultado encontrado para "{query}".</p>
              <p className="text-xs text-stone-400 mt-1">Tente palavras mais simples como "mercado", "água" ou "estudo".</p>
            </div>
          ) : results.length > 0 ? (
            results.map((res, i) => {
              const Icon = res.icon;
              return (
                <button
                  key={i}
                  onClick={res.action}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800/80 transition text-left group"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                          {res.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 font-medium">
                          {res.type}
                        </span>
                      </div>
                      {res.subtitle && (
                        <p className="text-[11px] text-stone-400 truncate mt-0.5">{res.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-stone-400">
              Digite para buscar em todas as áreas do LEVE.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
