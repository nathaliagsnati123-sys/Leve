import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Plus, Check, Star, Sparkles, Brain, Moon, Droplets, 
  Sprout, Heart, HeartHandshake, ChevronRight, Clock, 
  Filter, CheckCircle2, ArrowRight, Trash2, X
} from 'lucide-react';
import { getTodayDateString, formatDateToBrazilian } from '../../services/storage';
import { MOTIVATIONAL_QUOTES, SCRIPTURE_VERSES, SELF_CARE_SUGGESTIONS } from '../../services/quotesAndVerses';
import { Priority, Task } from '../../types';

export const MyDayView: React.FC = () => {
  const { 
    data, 
    addTask,
    deleteTask,
    deleteHabit,
    toggleTaskCompleted, 
    openNewTaskModal, 
    openEditTaskModal,
    setIsBrainDumpOpen,
    setIsDayClosingOpen,
    setIsFiveMinGodOpen,
    addWater,
    toggleHabitCompletion,
    toggleSelfCareItem,
    saveJournalEntry,
    todayCompletionPercentage,
    setActiveTab,
    showToast
  } = useApp();

  const todayStr = getTodayDateString();
  const todayBrazilian = formatDateToBrazilian(todayStr);

  // Dynamic greeting based on time of day
  const currentHour = new Date().getHours();
  let greeting = 'Bom dia';
  let greetingEmoji = '☀️';
  if (currentHour >= 12 && currentHour < 18) {
    greeting = 'Boa tarde';
    greetingEmoji = '🌤️';
  } else if (currentHour >= 18 || currentHour < 5) {
    greeting = 'Boa noite';
    greetingEmoji = '🌙';
  }

  // Pick deterministic quote of the day
  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const dailyQuote = MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
  const dailyVerse = SCRIPTURE_VERSES[dayOfYear % SCRIPTURE_VERSES.length];
  const dailySelfCare = SELF_CARE_SUGGESTIONS[dayOfYear % SELF_CARE_SUGGESTIONS.length];

  // Tasks for today
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [quickGratitude, setQuickGratitude] = useState('');

  // Priorities of the day state
  const [isAddingPriority, setIsAddingPriority] = useState(false);
  const [newPriorityTitle, setNewPriorityTitle] = useState('');
  const [newPriorityCategory, setNewPriorityCategory] = useState<string>('Trabalho');
  const [newPriorityTime, setNewPriorityTime] = useState('');

  const todayTasks = data.tasks.filter((t) => t.date === todayStr);

  const filteredTasks = todayTasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  // Priorities of the day (up to 3: tasks flagged high priority or prioritized tasks)
  const priorityTasks = [...todayTasks]
    .sort((a, b) => {
      // Pending tasks first, then by priority weight
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const pMap: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
      return pMap[b.priority] - pMap[a.priority];
    })
    .filter((t) => t.priority === 'high' || !t.completed)
    .slice(0, 3);

  const handleAddPriority = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPriorityTitle.trim()) return;

    addTask({
      title: newPriorityTitle.trim(),
      date: todayStr,
      priority: 'high',
      category: newPriorityCategory || 'Trabalho',
      repeat: 'none',
      time: newPriorityTime.trim() || undefined
    });

    setNewPriorityTitle('');
    setNewPriorityTime('');
    setIsAddingPriority(false);
    showToast('Prioridade adicionada ao seu dia! ⭐', 'success');
  };

  const handleDeletePriority = (taskId: string, taskTitle: string) => {
    deleteTask(taskId);
    showToast(`Prioridade "${taskTitle.length > 20 ? taskTitle.slice(0, 20) + '...' : taskTitle}" apagada.`, 'info');
  };

  // Water data
  const water = data.hydration[todayStr] || { date: todayStr, amountMl: 0, targetMl: 2000, logs: [] };
  const waterPercent = Math.min(100, Math.round((water.amountMl / water.targetMl) * 100));

  // Self care completed
  const isSelfCareDone = (data.selfCareCompleted[todayStr] || []).includes(dailySelfCare.text);

  // Quick gratitude submit
  const handleSaveQuickGratitude = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickGratitude.trim()) return;
    const existing = data.journal[todayStr] || {
      date: todayStr,
      gratitude: ['', '', ''],
      goodThings: ['', '', '']
    };
    const newGrat = [...existing.gratitude];
    newGrat[0] = quickGratitude.trim();
    saveJournalEntry({
      ...existing,
      gratitude: newGrat
    });
    setQuickGratitude('');
    showToast('Gratidão registrada no seu caderno! 🤍');
  };

  return (
    <div className="space-y-4 sm:space-y-5 max-w-5xl mx-auto pb-10">
      {/* 1. Welcome & Greeting Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1F3A34] via-[#24463E] to-[#162924] text-white p-4 sm:p-5 shadow-xs">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 sm:space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">{greetingEmoji}</span>
              <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-emerald-50">
                {greeting}, {data.user.name || 'amiga'}!
              </h1>
            </div>
            <p className="font-serif italic text-emerald-100/90 text-xs sm:text-sm max-w-xl leading-relaxed">
              "{dailyQuote}"
            </p>
            <p className="text-[10px] uppercase tracking-widest text-emerald-300 font-semibold">
              — Lembrete de leveza
            </p>
          </div>

          <div className="flex-shrink-0 flex items-center gap-2">
            <button
              id="my-day-brain-dump-btn"
              onClick={() => setIsBrainDumpOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 text-xs font-semibold transition group shadow-xs"
              title="Tirar da cabeça e descarregar pensamentos"
            >
              <Brain className="w-3.5 h-3.5 text-emerald-300 group-hover:scale-110 transition-transform" />
              <span>Tirar da cabeça</span>
            </button>
          </div>
        </div>

        {/* Progress Bar of the Day */}
        <div className="mt-3.5 pt-3 border-t border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-emerald-200 text-xs">Progresso do dia:</span>
            <span className="font-bold text-white text-xs sm:text-sm">{todayCompletionPercentage}%</span>
            <span className="text-emerald-300/80 text-[10px] sm:text-[11px]">
              {todayCompletionPercentage === 100 
                ? 'Dia completo com leveza! ✨' 
                : todayCompletionPercentage > 50 
                ? 'Mais da metade realizada no seu ritmo 🌱' 
                : 'Dando um passo de cada vez 🌿'}
            </span>
          </div>
          <div className="w-full sm:w-44 h-1.5 bg-emerald-950/80 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-200 rounded-full transition-all duration-500"
              style={{ width: `${todayCompletionPercentage}%` }}
            />
          </div>
        </div>
      </section>

      {/* 2. Main Priorities for Today */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl p-3.5 sm:p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <h2 className="font-serif text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
              Prioridades do Dia
            </h2>
            {priorityTasks.length > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold">
                {priorityTasks.filter((t) => t.completed).length}/{priorityTasks.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="add-priority-btn"
              onClick={() => setIsAddingPriority(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 text-xs font-semibold transition"
              title="Adicionar uma prioridade para hoje"
            >
              <Plus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Adicionar prioridade</span>
            </button>
          </div>
        </div>

        {/* Inline form to add new priority */}
        {isAddingPriority && (
          <form
            onSubmit={handleAddPriority}
            className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                Nova Prioridade de Hoje
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAddingPriority(false);
                  setNewPriorityTitle('');
                }}
                className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              autoFocus
              value={newPriorityTitle}
              onChange={(e) => setNewPriorityTitle(e.target.value)}
              placeholder="O que é essencial realizar hoje? (Ex: Entregar relatório, ligar para médico...)"
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />

            <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Category selector */}
                <select
                  value={newPriorityCategory}
                  onChange={(e) => setNewPriorityCategory(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200"
                >
                  <option value="Trabalho">Trabalho</option>
                  <option value="Pessoal">Pessoal</option>
                  <option value="Casa">Casa</option>
                  <option value="Saúde">Saúde</option>
                  <option value="Espiritual">Espiritual</option>
                  <option value="Outros">Outros</option>
                </select>

                {/* Optional time input */}
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-600 dark:text-stone-300">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <input
                    type="time"
                    value={newPriorityTime}
                    onChange={(e) => setNewPriorityTime(e.target.value)}
                    className="bg-transparent border-none p-0 text-xs focus:ring-0 text-stone-700 dark:text-stone-200"
                    placeholder="Horário"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingPriority(false);
                    setNewPriorityTitle('');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newPriorityTitle.trim()}
                  className="px-4 py-1.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] disabled:opacity-50 text-xs font-semibold transition shadow-xs"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Priority tasks grid */}
        {priorityTasks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {priorityTasks.map((t, idx) => (
              <div
                key={t.id}
                className={`group relative p-2.5 sm:p-3 rounded-xl border transition flex flex-col justify-between gap-1.5 ${
                  t.completed 
                    ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20' 
                    : 'border-stone-200/70 dark:border-stone-700/60 bg-stone-50/60 dark:bg-stone-800/40 hover:border-amber-400 dark:hover:border-amber-600'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Foco {idx + 1}
                  </span>

                  {/* Actions: delete priority and toggle complete */}
                  <div className="flex items-center gap-1">
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePriority(t.id, t.title);
                      }}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center"
                      title="Apagar prioridade"
                      aria-label={`Apagar prioridade ${t.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Complete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskCompleted(t.id);
                      }}
                      className="p-1 touch-manipulation flex items-center justify-center min-w-[34px] min-h-[34px]"
                      title={t.completed ? 'Marcar como pendente' : 'Concluir prioridade'}
                      aria-label={t.completed ? 'Marcar como pendente' : 'Concluir prioridade'}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 transition flex items-center justify-center flex-shrink-0 ${
                          t.completed
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'border-stone-300 dark:border-stone-600 hover:border-emerald-500 text-transparent'
                        }`}
                      >
                        {t.completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  </div>
                </div>

                <div 
                  onClick={() => openEditTaskModal(t)}
                  className="cursor-pointer space-y-0.5"
                >
                  <p className={`text-xs sm:text-sm font-semibold transition line-clamp-2 ${
                    t.completed 
                      ? 'line-through text-stone-400 dark:text-stone-500' 
                      : 'text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400'
                  }`}>
                    {t.title}
                  </p>
                  <span className="text-[10px] text-stone-400 block">
                    {t.category} {t.time ? `• ${t.time}` : ''}
                  </span>
                </div>
              </div>
            ))}

            {/* Empty slots for up to 3 focuses */}
            {priorityTasks.length < 3 && (
              <button
                type="button"
                onClick={() => setIsAddingPriority(true)}
                className="p-2.5 rounded-xl border-2 border-dashed border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-600/60 bg-transparent hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition flex flex-row sm:flex-col items-center justify-center text-center gap-1 text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 min-h-[52px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">
                  + Adicionar foco {priorityTasks.length + 1}
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/30 border border-stone-200/60 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <p className="text-xs text-stone-500">
              Você ainda não definiu as prioridades de hoje. Foque no que traz mais leveza e resultado!
            </p>
            <button
              onClick={() => setIsAddingPriority(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1F3A34] text-white hover:bg-[#162A25] text-xs font-semibold transition shadow-xs flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar 1ª prioridade</span>
            </button>
          </div>
        )}
      </section>

      {/* 3. Main Tasks Block */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl p-3.5 sm:p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h2 className="font-serif text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
              Tarefas de Hoje ({todayTasks.filter((t) => t.completed).length}/{todayTasks.length})
            </h2>
            <p className="text-[11px] text-stone-400">
              Tudo o que você planejou para o seu dia
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter pills */}
            <div className="flex items-center p-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-xs text-stone-600 dark:text-stone-300">
              <button
                onClick={() => setFilter('all')}
                className={`px-2 py-1 rounded-md font-medium transition ${
                  filter === 'all' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : ''
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-2 py-1 rounded-md font-medium transition ${
                  filter === 'pending' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : ''
                }`}
              >
                Pendentes
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-2 py-1 rounded-md font-medium transition ${
                  filter === 'completed' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : ''
                }`}
              >
                Concluídas
              </button>
            </div>

            <button
              id="my-day-add-task-btn"
              onClick={openNewTaskModal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1F3A34] text-white hover:bg-[#162A25] text-xs font-semibold transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova tarefa</span>
            </button>
          </div>
        </div>

        {/* Tasks list */}
        {filteredTasks.length > 0 ? (
          <div className="space-y-2">
            {filteredTasks.map((task) => {
              const priorityColors: Record<Priority, string> = {
                high: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
                medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
                low: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              };
              const priorityLabels: Record<Priority, string> = {
                high: 'Alta',
                medium: 'Média',
                low: 'Baixa'
              };

              return (
                <div
                  key={task.id}
                  className={`group p-2.5 sm:p-3 rounded-xl border transition flex items-center justify-between gap-2.5 ${
                    task.completed
                      ? 'bg-stone-50/70 dark:bg-stone-850/40 border-stone-200/50 dark:border-stone-800 text-stone-400 dark:text-stone-500'
                      : 'bg-white dark:bg-stone-800/80 border-stone-200/80 dark:border-stone-700 text-stone-900 dark:text-stone-100 hover:border-emerald-300 dark:hover:border-emerald-700'
                  }`}
                >
                  <div 
                    className="flex items-center gap-3 truncate flex-1 cursor-pointer select-none"
                    onClick={() => toggleTaskCompleted(task.id)}
                  >
                    {/* Checkbox with generous touch target for mobile */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskCompleted(task.id);
                      }}
                      className="p-2 -m-2 touch-manipulation flex items-center justify-center min-w-[44px] min-h-[44px] flex-shrink-0"
                      aria-label={task.completed ? "Desmarcar tarefa como concluída" : "Marcar tarefa como concluída"}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition flex-shrink-0 ${
                          task.completed
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'border-2 border-stone-300 dark:border-stone-600 hover:border-emerald-500 bg-stone-50/40 dark:bg-stone-700/40'
                        }`}
                      >
                        {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                    </button>

                    <div className="truncate flex-1">
                      <p className={`text-xs sm:text-sm font-medium truncate ${task.completed ? 'line-through opacity-70' : ''}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 font-medium">
                          {task.category}
                        </span>
                        {task.time && (
                          <span className="flex items-center gap-1 text-[10px] text-stone-400">
                            <Clock className="w-3 h-3" />
                            {task.time}
                          </span>
                        )}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${priorityColors[task.priority]}`}>
                          {priorityLabels[task.priority]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditTaskModal(task)}
                      className="opacity-80 sm:opacity-0 sm:group-hover:opacity-100 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 px-2 py-1 rounded-md hover:bg-stone-100 dark:hover:bg-stone-700 transition touch-manipulation"
                      title="Editar tarefa"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                        showToast(`Tarefa "${task.title.length > 20 ? task.title.slice(0, 20) + '...' : task.title}" excluída.`, 'info');
                      }}
                      className="p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
                      title="Excluir tarefa"
                      aria-label={`Excluir tarefa ${task.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-stone-400 space-y-2">
            <p className="text-xs sm:text-sm">
              {filter === 'all' 
                ? 'Nenhuma tarefa cadastrada para hoje. Que tal planejar com calma?'
                : filter === 'pending'
                ? 'Todas as tarefas de hoje foram concluídas! Parabéns! ✨'
                : 'Nenhuma tarefa concluída ainda hoje.'}
            </p>
            {filter === 'all' && (
              <button
                onClick={openNewTaskModal}
                className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
              >
                + Adicionar primeira tarefa
              </button>
            )}
          </div>
        )}
      </section>

      {/* 4. Habits & Hydration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Habits of Today */}
        <section className="bg-white dark:bg-stone-900 rounded-2xl p-3.5 sm:p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
              <h2 className="font-serif text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                Hábitos de Hoje
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('habits')}
              className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              <span>Ver todos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {data.habits.length === 0 ? (
            <div className="text-center py-4 px-3 rounded-xl bg-stone-50/50 dark:bg-stone-850/40 border border-dashed border-stone-200 dark:border-stone-700">
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-1.5">
                Nenhum hábito cadastrado ainda.
              </p>
              <button
                onClick={() => setActiveTab('habits')}
                className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
              >
                + Criar meu primeiro hábito
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {data.habits.slice(0, 4).map((habit) => {
                const isDoneToday = !!habit.history[todayStr];
                return (
                  <div
                    key={habit.id}
                    className={`group p-2.5 rounded-xl border transition flex items-center justify-between gap-2.5 ${
                      isDoneToday
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40 text-stone-900 dark:text-stone-100'
                        : 'bg-stone-50/50 dark:bg-stone-800/50 border-stone-200/70 dark:border-stone-700/60 text-stone-800 dark:text-stone-200 hover:border-emerald-300'
                    }`}
                  >
                    <div 
                      className="flex items-center gap-2.5 flex-1 cursor-pointer select-none"
                      onClick={() => toggleHabitCompletion(habit.id, todayStr)}
                    >
                      <span className="text-lg flex-shrink-0">{habit.icon}</span>
                      <div className="truncate flex-1">
                        <p className={`text-xs sm:text-sm font-semibold truncate ${isDoneToday ? 'line-through opacity-70' : ''}`}>
                          {habit.name}
                        </p>
                        <p className="text-[10px] text-stone-400">{habit.category}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHabit(habit.id);
                          showToast(`Hábito "${habit.name}" excluído.`, 'info');
                        }}
                        className="p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition touch-manipulation opacity-80 sm:opacity-0 sm:group-hover:opacity-100 min-w-[30px] min-h-[30px] flex items-center justify-center"
                        title="Excluir hábito"
                        aria-label={`Excluir hábito ${habit.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleHabitCompletion(habit.id, todayStr)}
                        className="p-1 touch-manipulation min-w-[34px] min-h-[34px] flex items-center justify-center"
                        aria-label={isDoneToday ? "Desmarcar hábito" : "Marcar hábito como concluído"}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                          isDoneToday
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'border-2 border-stone-300 dark:border-stone-600 hover:border-emerald-500'
                        }`}>
                          {isDoneToday && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Water / Hydration Section */}
        <section className="bg-white dark:bg-stone-900 rounded-2xl p-3.5 sm:p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="w-3.5 h-3.5 text-cyan-600" />
              <h2 className="font-serif text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                Minha Água
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('hydration')}
              className="text-xs text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-0.5"
            >
              <span>Detalhes</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-900/40">
            <div>
              <p className="text-xs text-cyan-800 dark:text-cyan-300 font-medium">Consumo de Hoje</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold text-cyan-950 dark:text-cyan-100 font-serif">
                  {water.amountMl}
                </span>
                <span className="text-xs text-cyan-700 dark:text-cyan-400">
                  / {water.targetMl} ml ({waterPercent}%)
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-cyan-800/80 dark:text-cyan-300/80 mt-0.5">
                {waterPercent >= 100 
                  ? 'Meta atingida! Seu corpo agradece 💧' 
                  : `Faltam ${Math.max(0, water.targetMl - water.amountMl)} ml para a meta.`}
              </p>
            </div>

            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                id="my-day-add-water-250"
                onClick={() => addWater(250)}
                className="px-2.5 py-1 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 text-xs font-semibold transition shadow-xs"
              >
                + 250 ml (copo)
              </button>
              <button
                id="my-day-add-water-500"
                onClick={() => addWater(500)}
                className="px-2.5 py-1 rounded-lg bg-cyan-700 text-white hover:bg-cyan-800 text-xs font-semibold transition shadow-xs"
              >
                + 500 ml (garrafa)
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* 5. Self-Care & Spirituality Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Self-Care Suggestion */}
        <section className="bg-white dark:bg-stone-900 rounded-2xl p-3.5 sm:p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <h2 className="font-serif text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                Autocuidado de Hoje
              </h2>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-rose-600">
              {dailySelfCare.category}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between gap-2.5">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
                {dailySelfCare.text}
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Pequeno gesto de carinho e presença para você.
              </p>
            </div>

            <button
              onClick={() => toggleSelfCareItem(dailySelfCare.text)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 flex-shrink-0 ${
                isSelfCareDone
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-100 dark:bg-rose-900/50 text-rose-900 dark:text-rose-200 hover:bg-rose-200'
              }`}
            >
              {isSelfCareDone ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Feito</span>
                </>
              ) : (
                <span>Marcar</span>
              )}
            </button>
          </div>
        </section>

        {/* Daily Faith / Moment with God */}
        <section className="bg-white dark:bg-stone-900 rounded-2xl p-3.5 sm:p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-3.5 h-3.5 text-emerald-700" />
              <h2 className="font-serif text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                Momento com Deus
              </h2>
            </div>
            <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold uppercase tracking-wider">
              {dailyVerse.reference}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-2.5">
            <p className="font-serif italic text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
              "{dailyVerse.verse}"
            </p>

            <button
              onClick={() => setIsFiveMinGodOpen(true)}
              className="w-full py-1.5 px-3 rounded-lg bg-[#1F3A34] text-white hover:bg-[#162A25] text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Fazer os 5 Minutos com Deus</span>
            </button>
          </div>
        </section>
      </div>

      {/* 6. Quick Gratitude Widget */}
      <section className="bg-stone-100/70 dark:bg-stone-850/60 rounded-2xl p-3.5 sm:p-4 border border-stone-200/80 dark:border-stone-800 space-y-2">
        <h3 className="font-serif text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200">
          Uma coisa boa que aconteceu hoje 🤍
        </h3>
        <form onSubmit={handleSaveQuickGratitude} className="flex gap-2">
          <input
            type="text"
            value={quickGratitude}
            onChange={(e) => setQuickGratitude(e.target.value)}
            placeholder="Ex: Um abraço apertado, o sol na janela, o café quentinho..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
          />
          <button
            type="submit"
            disabled={!quickGratitude.trim()}
            className="px-3.5 py-2 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] text-xs font-semibold disabled:opacity-40 transition"
          >
            Guardar
          </button>
        </form>
      </section>

      {/* 7. Footer End Day Action */}
      <div className="pt-4 text-center">
        <button
          onClick={() => setIsDayClosingOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 text-xs sm:text-sm font-semibold hover:bg-stone-800 dark:hover:bg-stone-200 transition shadow-sm"
        >
          <Moon className="w-4 h-4 text-indigo-400 dark:text-indigo-600" />
          <span>Encerrar o dia com gratidão e descanso</span>
        </button>
      </div>
    </div>
  );
};
