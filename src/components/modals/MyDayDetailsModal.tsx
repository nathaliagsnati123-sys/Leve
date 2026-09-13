import React, { useState, useMemo } from 'react';
import { 
  X, Star, CheckCircle2, Sprout, Droplets, BookOpen, 
  Plus, Check, Trash2, Edit3, Sparkles, Clock, Flame, 
  RefreshCw, RotateCcw, AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Priority, Task, HabitCategory } from '../../types';
import { getTodayDateString } from '../../services/storage';
import { SCRIPTURE_VERSES } from '../../services/quotesAndVerses';
import { adaptTextToGender, normalizeTreatmentPreference } from '../../utils/treatment';

export type MyDayModalType = 'priorities' | 'tasks' | 'habits' | 'hydration' | 'spirituality';

interface MyDayDetailsModalProps {
  type: MyDayModalType | null;
  onClose: () => void;
}

export const MyDayDetailsModal: React.FC<MyDayDetailsModalProps> = ({ type, onClose }) => {
  const { 
    data, 
    addTask, 
    updateTask, 
    deleteTask, 
    toggleTaskCompleted,
    openNewTaskModal,
    openEditTaskModal,
    addHabit,
    deleteHabit,
    toggleHabitCompletion,
    addWater,
    resetWater,
    setIsFiveMinGodOpen,
    showToast
  } = useApp();

  const { treatmentPreference } = useAuth();
  const pref = normalizeTreatmentPreference(treatmentPreference);
  const todayStr = getTodayDateString();

  // Tarefas de hoje
  const todayTasks = data.tasks.filter((t) => !t.date || t.date === todayStr);
  const priorityTasks = todayTasks.filter((t) => Boolean(t.isPriority) === true);

  // Filtro de tarefas
  const [taskFilter, setTaskFilter] = useState<'today' | 'pending' | 'all' | 'completed'>('today');

  // Adicionar prioridade inline
  const [isAddingPriority, setIsAddingPriority] = useState(false);
  const [newPriorityTitle, setNewPriorityTitle] = useState('');
  const [newPriorityLevel, setNewPriorityLevel] = useState<Priority>('high');
  const [newPriorityCategory, setNewPriorityCategory] = useState('Geral');

  // Adicionar hábito inline
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<HabitCategory>('Saúde');

  if (!type) return null;

  // Handlers de Prioridade
  const handleCreatePriority = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPriorityTitle.trim()) return;

    addTask({
      title: newPriorityTitle.trim(),
      date: todayStr,
      priority: newPriorityLevel,
      isPriority: true,
      category: newPriorityCategory,
      repeat: 'none'
    });

    setNewPriorityTitle('');
    setIsAddingPriority(false);
    showToast('Prioridade adicionada com sucesso! ⭐', 'success');
  };

  const handleUnmarkPriority = (task: Task) => {
    updateTask({
      ...task,
      isPriority: false
    });
    showToast(`"${task.title}" removida de prioridades (mantida em tarefas).`, 'info');
  };

  // Handlers de Hábito
  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    addHabit({
      name: newHabitName.trim(),
      icon: '🌱',
      category: newHabitCategory,
      frequency: 'daily',
      targetDaysPerWeek: 7
    });

    setNewHabitName('');
    setIsAddingHabit(false);
    showToast('Novo hábito criado! 🌱', 'success');
  };

  // Água
  const water = data.hydration[todayStr] || { date: todayStr, amountMl: 0, targetMl: 2000, logs: [] };
  const waterPercent = Math.min(100, Math.round((water.amountMl / water.targetMl) * 100));

  // Versículo
  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const rawVerse = SCRIPTURE_VERSES[dayOfYear % SCRIPTURE_VERSES.length];
  const dailyVerse = {
    ...rawVerse,
    verse: adaptTextToGender(rawVerse.verse, treatmentPreference)
  };

  // Filtragem de tarefas de hoje e gerais
  const filteredTasks = useMemo(() => {
    if (taskFilter === 'today') return todayTasks;
    if (taskFilter === 'pending') return data.tasks.filter((t) => !t.completed);
    if (taskFilter === 'completed') return data.tasks.filter((t) => t.completed);
    return data.tasks;
  }, [taskFilter, todayTasks, data.tasks]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#121A17] border border-stone-200 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3 bg-stone-50/50 dark:bg-stone-900/40">
          <div className="flex items-center gap-2.5 min-w-0">
            {type === 'priorities' && (
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 fill-amber-400" />
              </div>
            )}
            {type === 'tasks' && (
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
            {type === 'habits' && (
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Sprout className="w-5 h-5" />
              </div>
            )}
            {type === 'hydration' && (
              <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                <Droplets className="w-5 h-5" />
              </div>
            )}
            {type === 'spirituality' && (
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
            )}

            <div className="min-w-0">
              <h2 className="font-serif text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 truncate">
                {type === 'priorities' && 'Todas as Prioridades de Hoje'}
                {type === 'tasks' && 'Todas as Tarefas de Hoje'}
                {type === 'habits' && 'Todos os seus Hábitos'}
                {type === 'hydration' && 'Histórico de Hidratação'}
                {type === 'spirituality' && 'Momento com Deus & Inspiração'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                {type === 'priorities' && `${priorityTasks.length} foco(s) prioritário(s) cadastrado(s)`}
                {type === 'tasks' && `${todayTasks.filter(t => t.completed).length} de ${todayTasks.length} concluída(s)`}
                {type === 'habits' && `${data.habits.length} hábito(s) cadastrado(s) na sua rotina`}
                {type === 'hydration' && `${water.amountMl} / ${water.targetMl} ml consumidos hoje`}
                {type === 'spirituality' && dailyVerse.reference}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* ==================================================== */}
          {/* 1. MODAL: PRIORIDADES                                */}
          {/* ==================================================== */}
          {type === 'priorities' && (
            <div className="space-y-3">
              {/* Botão de Adicionar Prioridade */}
              {!isAddingPriority ? (
                <button
                  type="button"
                  onClick={() => setIsAddingPriority(true)}
                  className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-800/60 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar nova prioridade para hoje</span>
                </button>
              ) : (
                <form onSubmit={handleCreatePriority} className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      Nova Prioridade
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingPriority(false)}
                      className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newPriorityTitle}
                    onChange={(e) => setNewPriorityTitle(e.target.value)}
                    placeholder="O que é essencial realizar hoje?"
                    autoFocus
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-1">
                      {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewPriorityLevel(p)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition ${
                            newPriorityLevel === p
                              ? p === 'high'
                                ? 'bg-rose-600 text-white'
                                : p === 'medium'
                                ? 'bg-amber-600 text-white'
                                : 'bg-stone-700 text-white'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          {p === 'high' ? 'Alta' : p === 'medium' ? 'Média' : 'Baixa'}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingPriority(false)}
                        className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={!newPriorityTitle.trim()}
                        className="px-3.5 py-1.5 rounded-lg bg-[#1F3A34] text-white text-xs font-semibold hover:bg-[#162A25] disabled:opacity-40 transition"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Lista Completa de Prioridades */}
              <div className="space-y-2">
                {priorityTasks.length > 0 ? (
                  priorityTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850/60 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleTaskCompleted(t.id)}
                          className={`w-5 h-5 rounded-full border-2 transition flex items-center justify-center shrink-0 cursor-pointer ${
                            t.completed
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-stone-400 dark:border-stone-500 hover:border-emerald-500 text-transparent'
                          }`}
                        >
                          {t.completed && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        <div className="min-w-0">
                          <p className={`text-xs sm:text-sm font-medium ${
                            t.completed 
                              ? 'line-through text-stone-400 dark:text-stone-500' 
                              : 'text-stone-900 dark:text-stone-100'
                          }`}>
                            {t.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                            {t.category && <span>{t.category}</span>}
                            {t.time && <span>• {t.time}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Tag de Nível */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.priority === 'high'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            : t.priority === 'medium'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            : 'bg-stone-500/15 text-stone-600 dark:text-stone-400'
                        }`}>
                          {t.priority === 'high' ? 'Alta' : t.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>

                        {/* Botão de desmarcar prioridade (mantém em tarefas) */}
                        <button
                          type="button"
                          onClick={() => handleUnmarkPriority(t)}
                          className="p-1.5 text-amber-500 hover:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-700 rounded-lg transition"
                          title="Remover de Prioridades (mantém em Tarefas)"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                        </button>

                        {/* Editar */}
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            openEditTaskModal(t);
                          }}
                          className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-700 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Excluir */}
                        <button
                          type="button"
                          onClick={() => deleteTask(t.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                          title="Apagar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center space-y-2">
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Nenhuma prioridade cadastrada para hoje ainda.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 2. MODAL: TAREFAS DE HOJE                            */}
          {/* ==================================================== */}
          {type === 'tasks' && (
            <div className="space-y-3">
              {/* Filtros de Tarefa */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center p-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-xs">
                  <button
                    onClick={() => setTaskFilter('today')}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      taskFilter === 'today' 
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs' 
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    Hoje ({todayTasks.length})
                  </button>
                  <button
                    onClick={() => setTaskFilter('pending')}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      taskFilter === 'pending' 
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs' 
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    Pendentes ({data.tasks.filter(t => !t.completed).length})
                  </button>
                  <button
                    onClick={() => setTaskFilter('all')}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      taskFilter === 'all' 
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs' 
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    Todas ({data.tasks.length})
                  </button>
                  <button
                    onClick={() => setTaskFilter('completed')}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      taskFilter === 'completed' 
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs' 
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    Concluídas ({data.tasks.filter(t => t.completed).length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openNewTaskModal();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F3A34] text-white hover:bg-[#162A25] text-xs font-semibold shadow-2xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova Tarefa</span>
                </button>
              </div>

              {/* Lista de Tarefas */}
              <div className="space-y-2">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850/60 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleTaskCompleted(t.id)}
                          className={`w-5 h-5 rounded-md border-2 transition flex items-center justify-center shrink-0 cursor-pointer ${
                            t.completed
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-stone-400 dark:border-stone-500 hover:border-emerald-500 text-transparent'
                          }`}
                        >
                          {t.completed && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        <div className="min-w-0">
                          <p className={`text-xs sm:text-sm font-medium ${
                            t.completed 
                              ? 'line-through text-stone-400 dark:text-stone-500' 
                              : 'text-stone-900 dark:text-stone-100'
                          }`}>
                            {t.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                            {t.category && (
                              <span className="px-1.5 py-0.2 rounded bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium">
                                {t.category}
                              </span>
                            )}
                            {t.time && <span>• {t.time}</span>}
                            {t.isPriority && (
                              <span className="text-amber-500 flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-amber-400" />
                                Prioridade
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {t.priority === 'high' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 uppercase">
                            Alta
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            openEditTaskModal(t);
                          }}
                          className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-700 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTask(t.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Nenhuma tarefa encontrada com o filtro selecionado.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 3. MODAL: HÁBITOS DE HOJE                            */}
          {/* ==================================================== */}
          {type === 'habits' && (
            <div className="space-y-3">
              {/* Botão de Adicionar Hábito */}
              {!isAddingHabit ? (
                <button
                  type="button"
                  onClick={() => setIsAddingHabit(true)}
                  className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-800/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar novo hábito na sua rotina</span>
                </button>
              ) : (
                <form onSubmit={handleCreateHabit} className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                      <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                      Novo Hábito Diário
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingHabit(false)}
                      className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="Ex: Ler 10 páginas, Beber água, Meditar..."
                    autoFocus
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <select
                      value={newHabitCategory}
                      onChange={(e) => setNewHabitCategory(e.target.value as HabitCategory)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-700 text-stone-800 dark:text-stone-200 text-xs focus:outline-none"
                    >
                      <option value="Saúde">Saúde</option>
                      <option value="Espiritualidade">Espiritualidade</option>
                      <option value="Autocuidado">Autocuidado</option>
                      <option value="Casa">Casa</option>
                      <option value="Mente">Mente</option>
                      <option value="Trabalho">Trabalho</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingHabit(false)}
                        className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={!newHabitName.trim()}
                        className="px-3.5 py-1.5 rounded-lg bg-[#1F3A34] text-white text-xs font-semibold hover:bg-[#162A25] disabled:opacity-40 transition"
                      >
                        Cadastrar
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Lista Completa de Hábitos */}
              <div className="space-y-2">
                {data.habits.length > 0 ? (
                  data.habits.map((h) => {
                    const habitName = h.name || (h as any).title || 'Hábito';
                    const isDoneToday = Boolean(
                      Array.isArray(h.history) 
                        ? h.history.includes(todayStr) 
                        : h.history?.[todayStr]
                    );

                    return (
                      <div
                        key={h.id}
                        className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850/60 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-3 group"
                      >
                        <div 
                          onClick={() => toggleHabitCompletion(h.id, todayStr)}
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 transition flex items-center justify-center shrink-0 ${
                              isDoneToday
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-stone-400 dark:border-stone-500 text-transparent'
                            }`}
                          >
                            {isDoneToday && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>

                          <div className="min-w-0">
                            <p className={`text-xs sm:text-sm font-medium ${
                              isDoneToday 
                                ? 'line-through text-stone-400 dark:text-stone-500' 
                                : 'text-stone-900 dark:text-stone-100'
                            }`}>
                              {habitName}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                              <span>{h.category}</span>
                              <span>• Diário</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isDoneToday
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                          }`}>
                            {isDoneToday ? 'Feito hoje ✓' : 'Pendente'}
                          </span>

                          <button
                            type="button"
                            onClick={() => deleteHabit(h.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                            title="Remover hábito"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center space-y-2">
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Você ainda não cadastrou nenhum hábito na sua rotina.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 4. MODAL: HIDRATAÇÃO                                 */}
          {/* ==================================================== */}
          {type === 'hydration' && (
            <div className="space-y-4">
              {/* Resumo visual do consumo */}
              <div className="p-4 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200/60 dark:border-cyan-900/40 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold font-serif text-cyan-700 dark:text-cyan-300">
                      {water.amountMl}
                    </span>
                    <span className="text-xs text-cyan-900/70 dark:text-cyan-200/70 font-medium ml-1">
                      / {water.targetMl} ml
                    </span>
                  </div>
                  <span className="text-xs font-bold text-cyan-800 dark:text-cyan-300">
                    {waterPercent}% da meta
                  </span>
                </div>

                <div className="w-full h-2.5 bg-cyan-200/70 dark:bg-cyan-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${waterPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-cyan-900/80 dark:text-cyan-200/80 pt-1">
                  <span>
                    {waterPercent >= 100 
                      ? 'Parabéns! Meta de hidratação batida hoje! 💧' 
                      : `Faltam ${Math.max(0, water.targetMl - water.amountMl)} ml para completar sua meta.`}
                  </span>
                </div>
              </div>

              {/* Botões Rápidos de Registro */}
              <div>
                <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
                  Adicionar copos ou garrafas de água:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => addWater(150)}
                    className="py-2 px-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/50 dark:hover:bg-cyan-900/50 text-cyan-800 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-800 text-xs font-semibold transition cursor-pointer text-center"
                  >
                    + 150 ml
                  </button>
                  <button
                    onClick={() => addWater(250)}
                    className="py-2 px-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/50 dark:hover:bg-cyan-900/50 text-cyan-800 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-800 text-xs font-semibold transition cursor-pointer text-center"
                  >
                    + 250 ml
                  </button>
                  <button
                    onClick={() => addWater(500)}
                    className="py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold transition cursor-pointer text-center shadow-2xs"
                  >
                    + 500 ml
                  </button>
                </div>
              </div>

              {/* Histórico dos registros do dia */}
              <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Registros de Hoje ({water.logs?.length || 0})</span>
                  </h3>
                  {water.amountMl > 0 && (
                    <button
                      onClick={() => resetWater()}
                      className="text-[11px] text-stone-400 hover:text-rose-600 flex items-center gap-1 transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Zerar hoje</span>
                    </button>
                  )}
                </div>

                {water.logs && water.logs.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {water.logs.slice().reverse().map((log, index) => (
                      <div
                        key={index}
                        className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-850/60 border border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs"
                      >
                        <span className="text-stone-500 dark:text-stone-400 font-medium">
                          {log.time}
                        </span>
                        <span className="font-semibold text-cyan-700 dark:text-cyan-300">
                          +{log.amount} ml
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 dark:text-stone-500 py-4 text-center">
                    Nenhum copo de água registrado hoje ainda.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 5. MODAL: MOMENTO COM DEUS                           */}
          {/* ==================================================== */}
          {type === 'spirituality' && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Palavra de Esperança & Fé</span>
                </div>

                <p className="font-serif italic text-sm sm:text-base text-stone-800 dark:text-stone-100 leading-relaxed">
                  "{dailyVerse.verse}"
                </p>

                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                  — {dailyVerse.reference}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Dedique uma pausa breve de 5 minutos para oração, gratidão e silêncio. Um momento para reconectar o coração com o que é eterno.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setIsFiveMinGodOpen(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>Iniciar 5 Minutos com Deus</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
