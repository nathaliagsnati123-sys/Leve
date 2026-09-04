import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Plus, Sprout, Check, Flame, Award, Trash2, Edit3, 
  Smile, Sparkles, X, ChevronRight, Info 
} from 'lucide-react';
import { getTodayDateString, getPastDaysList } from '../../services/storage';
import { Habit, HabitCategory, HabitTimeOfDay } from '../../types';

export const HabitsView: React.FC = () => {
  const { data, toggleHabitCompletion, addHabit, updateHabit, deleteHabit, showToast } = useApp();
  const todayStr = getTodayDateString();

  // Past 7 days for the weekly tracker
  const past7Days = getPastDaysList(7); // includes today and past 6 days, in chronological order

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🌱');
  const [category, setCategory] = useState<HabitCategory>('Saúde');
  const [targetDays, setTargetDays] = useState(7);
  const [timeOfDay, setTimeOfDay] = useState<HabitTimeOfDay>('anytime');
  const [motivation, setMotivation] = useState('');

  const emojiOptions = ['🌱', '💧', '📖', '🚶', '🙏', '🛏️', '✨', '🧘', '🍎', '💤', '☀️', '🍵'];

  const handleOpenNew = () => {
    setEditingHabitId(null);
    setName('');
    setIcon('🌱');
    setCategory('Saúde');
    setTargetDays(7);
    setTimeOfDay('anytime');
    setMotivation('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (h: Habit) => {
    setEditingHabitId(h.id);
    setName(h.name);
    setIcon(h.icon);
    setCategory(h.category);
    setTargetDays(h.targetDaysPerWeek);
    setTimeOfDay(h.timeOfDay);
    setMotivation(h.motivation || '');
    setIsFormOpen(true);
  };

  const handleSaveHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingHabitId) {
      const existing = data.habits.find((h) => h.id === editingHabitId);
      if (existing) {
        updateHabit({
          ...existing,
          name: name.trim(),
          icon,
          category,
          targetDaysPerWeek: targetDays,
          timeOfDay,
          motivation: motivation.trim() || undefined
        });
      }
    } else {
      addHabit({
        name: name.trim(),
        icon,
        category,
        targetDaysPerWeek: targetDays,
        timeOfDay,
        motivation: motivation.trim() || undefined
      });
    }

    setIsFormOpen(false);
  };

  const calculateStreak = (habit: Habit): number => {
    let streak = 0;
    const checkDate = new Date();
    // If today is completed or not yet checked
    const todayChecked = !!habit.history[getTodayDateString()];
    if (todayChecked) streak++;

    // check previous days
    for (let i = 1; i <= 365; i++) {
      const prev = new Date();
      prev.setDate(checkDate.getDate() - i);
      const dStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;
      if (habit.history[dStr]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const calculateConsistency = (habit: Habit): number => {
    // Check past 30 days
    const days30 = getPastDaysList(30);
    const count = days30.filter((d) => !!habit.history[d]).length;
    return Math.round((count / 30) * 100);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              Meus Hábitos
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Pequenas sementes diárias que florescem com carinho e sem pressão.
            </p>
          </div>
        </div>

        <button
          id="habits-new-btn"
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] text-xs sm:text-sm font-semibold transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Criar hábito</span>
        </button>
      </div>

      {/* Gentle Motivation Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-3 text-xs text-stone-700 dark:text-stone-300">
        <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <p>
          Lembre-se: não há problema em falhar um dia. O segredo da constância é voltar com ternura no dia seguinte.
        </p>
      </div>

      {/* Habits List with Weekly Grid */}
      <div className="space-y-4">
        {data.habits.map((habit) => {
          const streak = calculateStreak(habit);
          const consistency = calculateConsistency(habit);

          return (
            <div
              key={habit.id}
              className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-xl">
                    {habit.icon}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-stone-900 dark:text-stone-100">
                      {habit.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[10px] font-medium">
                        {habit.category}
                      </span>
                      <span>Meta: {habit.targetDaysPerWeek}x/semana</span>
                      {habit.motivation && (
                        <span className="hidden md:inline italic truncate max-w-xs">
                          • "{habit.motivation}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {/* Streak pill */}
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-800">
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>{streak} {streak === 1 ? 'dia' : 'dias'}</span>
                  </div>

                  {/* Consistency */}
                  <div className="text-xs text-stone-400 text-right">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">{consistency}%</span>
                    <span className="hidden sm:inline"> (30d)</span>
                  </div>

                  {/* Edit / Delete actions */}
                  <div className="flex items-center gap-1 pl-2 border-l border-stone-200 dark:border-stone-800">
                    <button
                      onClick={() => handleOpenEdit(habit)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                      title="Editar hábito"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Deseja excluir o hábito "${habit.name}"?`)) {
                          deleteHabit(habit.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Excluir hábito"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Weekly Tracker Grid (Past 7 days) */}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                <span className="text-[11px] text-stone-400 font-medium block mb-2">
                  Últimos 7 dias (toque para marcar ou desmarcar):
                </span>
                <div className="grid grid-cols-7 gap-2 text-center">
                  {past7Days.map((dStr) => {
                    const isDone = !!habit.history[dStr];
                    const isToday = dStr === todayStr;
                    const dateObj = new Date(dStr + 'T12:00:00');
                    const dayInitial = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][dateObj.getDay()];
                    const dayNum = dateObj.getDate();

                    return (
                      <button
                        key={dStr}
                        onClick={() => toggleHabitCompletion(habit.id, dStr)}
                        className={`p-2 rounded-2xl border transition flex flex-col items-center justify-between gap-1.5 ${
                          isDone
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : isToday
                            ? 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 text-stone-700 dark:text-stone-300'
                            : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/40 text-stone-500 hover:border-stone-400'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold opacity-80">{dayInitial}</span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isDone ? 'bg-white/20' : ''
                        }`}>
                          {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : dayNum}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Habit Create / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4 my-8 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-serif text-lg font-bold">
                {editingHabitId ? 'Editar Hábito' : 'Novo Hábito'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 bg-stone-100 dark:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHabit} className="space-y-3.5 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  Nome do hábito
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Ler 10 páginas, Caminhar 20 min..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                />
              </div>

              {/* Emoji picker */}
              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  Ícone
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {emojiOptions.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setIcon(em)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition ${
                        icon === em
                          ? 'bg-emerald-100 dark:bg-emerald-950 ring-2 ring-emerald-600'
                          : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categoria */}
              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as HabitCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                >
                  <option value="Saúde">Saúde</option>
                  <option value="Mente">Mente</option>
                  <option value="Produtividade">Produtividade</option>
                  <option value="Espiritualidade">Espiritualidade</option>
                  <option value="Autocuidado">Autocuidado</option>
                </select>
              </div>

              {/* Frequency */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-stone-700 dark:text-stone-300">
                    Dias por semana
                  </label>
                  <select
                    value={targetDays}
                    onChange={(e) => setTargetDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <option key={num} value={num}>
                        {num === 7 ? 'Todos os dias (7x)' : `${num}x por semana`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-stone-700 dark:text-stone-300">
                    Horário sugerido
                  </label>
                  <select
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value as HabitTimeOfDay)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                  >
                    <option value="anytime">Livre</option>
                    <option value="morning">Manhã</option>
                    <option value="afternoon">Tarde</option>
                    <option value="evening">Noite</option>
                  </select>
                </div>
              </div>

              {/* Motivation */}
              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  Por que este hábito é importante para mim?
                </label>
                <input
                  type="text"
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="Ex: Para ter mais disposição e clareza mental..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold"
                >
                  Salvar hábito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
