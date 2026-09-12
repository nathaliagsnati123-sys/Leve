import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Heart, Sparkles, Check, Plus, Trash2, Smile, Zap } from 'lucide-react';
import { SELF_CARE_SUGGESTIONS, MASCULINE_SELF_CARE_SUGGESTIONS } from '../../services/quotesAndVerses';
import { getTodayDateString } from '../../services/storage';
import { normalizeTreatmentPreference, adaptTextToGender } from '../../utils/treatment';

export const SelfCareView: React.FC = () => {
  const { data, toggleSelfCareItem, showToast } = useApp();
  const todayStr = getTodayDateString();

  const pref = normalizeTreatmentPreference(data.user?.treatmentPreference);

  const completedToday = data.selfCareCompleted?.[todayStr] || [];

  const [customAction, setCustomAction] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todos');

  const baseSuggestions = pref === 'masculino'
    ? MASCULINE_SELF_CARE_SUGGESTIONS
    : SELF_CARE_SUGGESTIONS;

  const categories = pref === 'masculino'
    ? ['Todos', 'Corpo', 'Mente', 'Foco']
    : ['Todos', 'Corpo', 'Mente', 'Coração'];

  const filteredSuggestions = activeCategory === 'Todos'
    ? baseSuggestions
    : baseSuggestions.filter((s) => s.category === activeCategory);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAction.trim()) return;

    toggleSelfCareItem(customAction.trim());
    setCustomAction('');
    showToast(
      pref === 'masculino'
        ? 'Ação de recarga e foco registrada.'
        : 'Ação de autocuidado registrada para você hoje! ❤️'
    );
  };

  const title = pref === 'masculino' ? 'Autocuidado & Foco' : 'Meu Autocuidado';
  const subtitle = pref === 'masculino'
    ? 'Pausas estratégicas para recuperar a energia, cuidar do corpo e manter a mente focada.'
    : pref === 'feminino'
    ? 'Pequenas pausas para se acolher com amor, gentileza e carinho.'
    : 'Pausas para acolhimento, descanso e bem-estar integral.';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${
            pref === 'masculino'
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
          }`}>
            {pref === 'masculino' ? (
              <Zap className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
            ) : (
              <Heart className="w-6 h-6 fill-rose-300 dark:fill-rose-700 text-rose-700 dark:text-rose-300" />
            )}
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              {subtitle}
            </p>
          </div>
        </div>

        <div className={`text-xs px-3.5 py-2 rounded-2xl border ${
          pref === 'masculino'
            ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 font-medium'
            : 'text-stone-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900'
        }`}>
          Hoje: <strong>{completedToday.length}</strong> {
            pref === 'masculino'
              ? completedToday.length === 1 ? 'hábito executado' : 'hábitos executados'
              : completedToday.length === 1 ? 'gesto de carinho' : 'gestos de carinho'
          } por você
        </div>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeCategory === cat
                ? pref === 'masculino'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                  : 'bg-rose-600 text-white shadow-xs'
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
                  ? pref === 'masculino'
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-emerald-300 dark:hover:border-emerald-700'
              }`}
            >
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500">
                  {item.category}
                </span>
                <p className="text-xs sm:text-sm font-semibold pt-1">
                  {adaptTextToGender(item.text, pref)}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                <span className="text-[11px] text-stone-400">
                  {isDone 
                    ? pref === 'masculino' ? 'Concluído hoje' : 'Feito hoje ❤️' 
                    : 'Toque para marcar'}
                </span>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                  isDone 
                    ? pref === 'masculino' ? 'bg-emerald-700 text-white' : 'bg-rose-600 text-white' 
                    : 'border border-stone-300 dark:border-stone-700'
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
          {pref === 'masculino'
            ? 'Registrar outra pausa ou hábito de foco executado hoje:'
            : 'Fez outro gesto de carinho por você hoje?'}
        </h3>
        <form onSubmit={handleAddCustom} className="flex gap-2">
          <input
            type="text"
            value={customAction}
            onChange={(e) => setCustomAction(e.target.value)}
            placeholder={
              pref === 'masculino'
                ? 'Ex: Corrida matinal de 20 min, banho gelado, organização do escritório...'
                : 'Ex: Comprei flores para a mesa, fiz uma pausa para olhar o céu...'
            }
            className="flex-1 px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          <button
            type="submit"
            disabled={!customAction.trim()}
            className={`px-5 py-2.5 rounded-2xl text-white text-xs font-semibold disabled:opacity-40 cursor-pointer ${
              pref === 'masculino' ? 'bg-[#1F3A34] hover:bg-[#162924]' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            Registrar
          </button>
        </form>
      </div>
    </div>
  );
};
