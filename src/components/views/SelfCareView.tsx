import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Heart, Sparkles, Check, Plus, Trash2, Smile } from 'lucide-react';
import { SELF_CARE_SUGGESTIONS } from '../../services/quotesAndVerses';
import { getTodayDateString } from '../../services/storage';

export const SelfCareView: React.FC = () => {
  const { data, toggleSelfCareItem, showToast } = useApp();
  const todayStr = getTodayDateString();

  const completedToday = data.selfCareCompleted?.[todayStr] || [];

  const [customAction, setCustomAction] = useState('');
  const [activeCategory, setActiveCategory] = useState<'Todos' | 'Corpo' | 'Mente' | 'Coração'>('Todos');

  const filteredSuggestions = activeCategory === 'Todos'
    ? SELF_CARE_SUGGESTIONS
    : SELF_CARE_SUGGESTIONS.filter((s) => s.category === activeCategory);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAction.trim()) return;

    toggleSelfCareItem(customAction.trim());
    setCustomAction('');
    showToast('Ação de autocuidado registrada para você hoje! ❤️');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
            <Heart className="w-6 h-6 fill-rose-300 dark:fill-rose-700" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              Meu Autocuidado
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Pequenas pausas para se acolher com amor, gentileza e carinho.
            </p>
          </div>
        </div>

        <div className="text-xs text-stone-500 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-2 rounded-2xl border border-rose-200 dark:border-rose-900">
          Hoje: <strong>{completedToday.length}</strong> {completedToday.length === 1 ? 'gesto de amor' : 'gestos de amor'} por você
        </div>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2">
        {(['Todos', 'Corpo', 'Mente', 'Coração'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeCategory === cat
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Suggestions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filteredSuggestions.map((item, idx) => {
          const isDone = completedToday.includes(item.text);

          return (
            <div
              key={idx}
              onClick={() => toggleSelfCareItem(item.text)}
              className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-3 ${
                isDone
                  ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-rose-300'
              }`}
            >
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500">
                  {item.category}
                </span>
                <p className="text-xs sm:text-sm font-semibold pt-1">
                  {item.text}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                <span className="text-[11px] text-stone-400">
                  {isDone ? 'Feito hoje ❤️' : 'Toque para marcar'}
                </span>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                  isDone ? 'bg-rose-600 text-white' : 'border border-stone-300'
                }`}>
                  {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Self Care Input */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-2">
        <h3 className="font-serif text-sm font-bold text-stone-900 dark:text-stone-100">
          Fez outro gesto de carinho por você hoje?
        </h3>
        <form onSubmit={handleAddCustom} className="flex gap-2">
          <input
            type="text"
            value={customAction}
            onChange={(e) => setCustomAction(e.target.value)}
            placeholder="Ex: Comprei flores para a mesa, fiz uma pausa para olhar o céu..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
          />
          <button
            type="submit"
            disabled={!customAction.trim()}
            className="px-5 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-40"
          >
            Registrar
          </button>
        </form>
      </div>
    </div>
  );
};
