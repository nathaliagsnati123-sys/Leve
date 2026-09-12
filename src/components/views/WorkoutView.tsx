import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Dumbbell, Plus, Trash2, Edit3, CheckCircle, Clock, Calendar, 
  Flame, ChevronDown, ChevronUp, Sparkles, Activity, Award, Check
} from 'lucide-react';
import { WorkoutRoutine, WorkoutExercise } from '../../types';
import { getTodayDateString, formatDateToBrazilian } from '../../services/storage';
import { normalizeTreatmentPreference } from '../../utils/treatment';

export const WorkoutView: React.FC = () => {
  const { 
    data, 
    addWorkoutRoutine, 
    updateWorkoutRoutine, 
    deleteWorkoutRoutine, 
    completeWorkoutRoutine,
    addExerciseToRoutine, 
    updateExerciseInRoutine, 
    deleteExerciseFromRoutine,
    showToast 
  } = useApp();

  const pref = normalizeTreatmentPreference(data.user?.treatmentPreference);
  const isMale = pref === 'masculino';
  const todayStr = getTodayDateString();

  const routines: WorkoutRoutine[] = data.workoutRoutines || [];

  // State for routine creation/editing modal
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<WorkoutRoutine | null>(null);
  const [routineForm, setRoutineForm] = useState({
    title: '',
    category: isMale ? 'Musculação' : 'Ballet / Dança',
    scheduledDays: '',
    targetDurationMinutes: 45,
    notes: ''
  });

  // State for exercise modal
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<WorkoutExercise | null>(null);
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    sets: 3,
    reps: '12 repetições',
    weight: '',
    notes: ''
  });

  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Collapsed states for routine cards
  const [expandedRoutines, setExpandedRoutines] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedRoutines(prev => ({ ...prev, [id]: prev[id] === undefined ? false : !prev[id] }));
  };

  const isExpanded = (id: string) => {
    return expandedRoutines[id] !== false; // default expanded
  };

  // Pre-configured category options
  const categoryOptions = isMale
    ? ['Musculação', 'Cardio / Corrida', 'Funcional', 'Calistenia', 'Luta / Artes Marciais', 'Alongamento', 'Natação', 'Outro']
    : ['Ballet / Dança', 'Flexibilidade', 'Musculação', 'Pilates', 'Yoga', 'Corrida / Caminhada', 'Funcional', 'Alongamento', 'Outro'];

  // Filter routines
  const filteredRoutines = selectedCategory === 'Todos'
    ? routines
    : routines.filter(r => r.category === selectedCategory);

  // Total completions
  const totalWorkoutsDone = routines.reduce((acc, r) => acc + (r.timesCompleted || 0), 0);

  // Open routine modal
  const handleOpenNewRoutine = () => {
    setEditingRoutine(null);
    setRoutineForm({
      title: '',
      category: isMale ? 'Musculação' : 'Ballet / Dança',
      scheduledDays: 'Segunda, Quarta e Sexta',
      targetDurationMinutes: 45,
      notes: ''
    });
    setIsRoutineModalOpen(true);
  };

  const handleOpenEditRoutine = (routine: WorkoutRoutine) => {
    setEditingRoutine(routine);
    setRoutineForm({
      title: routine.title,
      category: routine.category,
      scheduledDays: routine.scheduledDays || '',
      targetDurationMinutes: routine.targetDurationMinutes || 45,
      notes: routine.notes || ''
    });
    setIsRoutineModalOpen(true);
  };

  const handleSaveRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineForm.title.trim()) {
      showToast('Por favor, informe o nome do treino ou atividade.');
      return;
    }

    if (editingRoutine) {
      updateWorkoutRoutine({
        ...editingRoutine,
        title: routineForm.title.trim(),
        category: routineForm.category,
        scheduledDays: routineForm.scheduledDays.trim() || undefined,
        targetDurationMinutes: Number(routineForm.targetDurationMinutes) || 45,
        notes: routineForm.notes.trim() || undefined
      });
    } else {
      addWorkoutRoutine({
        title: routineForm.title.trim(),
        category: routineForm.category,
        scheduledDays: routineForm.scheduledDays.trim() || undefined,
        targetDurationMinutes: Number(routineForm.targetDurationMinutes) || 45,
        notes: routineForm.notes.trim() || undefined,
        exercises: []
      });
    }

    setIsRoutineModalOpen(false);
  };

  // Open exercise modal
  const handleOpenNewExercise = (routineId: string) => {
    setActiveRoutineId(routineId);
    setEditingExercise(null);
    setExerciseForm({
      name: '',
      sets: 3,
      reps: '12 repetições',
      weight: '',
      notes: ''
    });
    setIsExerciseModalOpen(true);
  };

  const handleOpenEditExercise = (routineId: string, exercise: WorkoutExercise) => {
    setActiveRoutineId(routineId);
    setEditingExercise(exercise);
    setExerciseForm({
      name: exercise.name,
      sets: exercise.sets || 3,
      reps: exercise.reps || '',
      weight: exercise.weight || '',
      notes: exercise.notes || ''
    });
    setIsExerciseModalOpen(true);
  };

  const handleSaveExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoutineId) return;
    if (!exerciseForm.name.trim()) {
      showToast('Por favor, digite o nome do exercício.');
      return;
    }

    if (editingExercise) {
      updateExerciseInRoutine(activeRoutineId, {
        ...editingExercise,
        name: exerciseForm.name.trim(),
        sets: Number(exerciseForm.sets) || 1,
        reps: exerciseForm.reps.trim() || undefined,
        weight: exerciseForm.weight.trim() || undefined,
        notes: exerciseForm.notes.trim() || undefined
      });
    } else {
      addExerciseToRoutine(activeRoutineId, {
        name: exerciseForm.name.trim(),
        sets: Number(exerciseForm.sets) || 1,
        reps: exerciseForm.reps.trim() || undefined,
        weight: exerciseForm.weight.trim() || undefined,
        notes: exerciseForm.notes.trim() || undefined
      });
    }

    setIsExerciseModalOpen(false);
  };

  const handleComplete = (routine: WorkoutRoutine) => {
    completeWorkoutRoutine(routine.id, routine.targetDurationMinutes || 30);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className={`p-3.5 rounded-2xl ${
            isMale 
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' 
              : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
          }`}>
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              Fichas de Treino
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              {isMale
                ? 'Salve suas fichas de treino, exercícios, séries e rotinas de acordo com sua realidade.'
                : 'Salve suas fichas de treino, exercícios de ballet, flexibilidade ou musculação de acordo com sua rotina.'}
            </p>
          </div>
        </div>

        <button
          id="btn-create-workout-routine"
          onClick={handleOpenNewRoutine}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-white shadow-xs transition cursor-pointer shrink-0 ${
            isMale 
              ? 'bg-[#1F3A34] hover:bg-[#162924]' 
              : 'bg-rose-600 hover:bg-rose-700'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Criar Nova Ficha de Treino</span>
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">Fichas Criadas</div>
            <div className="text-lg font-bold text-stone-900 dark:text-stone-100">{routines.length}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isMale ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'}`}>
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">Treinos Executados</div>
            <div className="text-lg font-bold text-stone-900 dark:text-stone-100">{totalWorkoutsDone}</div>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">Frequência</div>
            <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
              {routines.some(r => (r.completedDates || []).includes(todayStr)) ? 'Treino feito hoje! 👏' : 'Pronto para treinar hoje'}
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      {routines.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-stone-400 dark:text-stone-500 font-medium shrink-0">Filtrar:</span>
          {['Todos', ...Array.from(new Set(routines.map(r => r.category)))].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? isMale
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                    : 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200/80 dark:border-stone-700 hover:bg-stone-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* List of Routines */}
      {routines.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 p-8 sm:p-12 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 text-center space-y-4">
          <div className={`w-16 h-16 mx-auto rounded-3xl flex items-center justify-center ${
            isMale ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
          }`}>
            <Dumbbell className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
              {isMale ? 'Nenhum treino cadastrado ainda' : 'Nenhum treino ou prática salva ainda'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              {isMale
                ? 'Crie suas fichas de treino personalizadas (musculação, corrida, mobilidade) e adicione os exercícios que você costuma fazer.'
                : 'Crie sua primeira rotina (por exemplo: Ballet - Exercícios de Flexibilidade, Pilates ou Academia) e cadastre os movimentos que deseja praticar!'}
            </p>
          </div>
          <button
            onClick={handleOpenNewRoutine}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-white shadow-xs transition cursor-pointer ${
              isMale ? 'bg-[#1F3A34] hover:bg-[#162924]' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Meu Primeiro Treino</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRoutines.map((routine) => {
            const isDoneToday = (routine.completedDates || []).includes(todayStr);
            const expanded = isExpanded(routine.id);
            const exercisesCount = (routine.exercises || []).length;

            return (
              <div 
                key={routine.id}
                className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs overflow-hidden transition"
              >
                {/* Routine Card Header */}
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800/80">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg uppercase tracking-wider ${
                        isMale 
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {routine.category}
                      </span>
                      {routine.scheduledDays && (
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-lg">
                          <Calendar className="w-3 h-3" />
                          {routine.scheduledDays}
                        </span>
                      )}
                      {routine.targetDurationMinutes && (
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-lg">
                          <Clock className="w-3 h-3" />
                          {routine.targetDurationMinutes} min
                        </span>
                      )}
                    </div>
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 truncate">
                      {routine.title}
                    </h2>
                    {routine.notes && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                        {routine.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions right side */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {/* Mark done button */}
                    <button
                      onClick={() => handleComplete(routine)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition cursor-pointer ${
                        isDoneToday
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                          : isMale
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-rose-600 hover:bg-rose-700 text-white'
                      }`}
                    >
                      {isDoneToday ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-300 stroke-[3]" />
                          <span>Feito Hoje! ({routine.timesCompleted || 1}x)</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Marcar como Feito Hoje</span>
                        </>
                      )}
                    </button>

                    {/* Edit routine */}
                    <button
                      onClick={() => handleOpenEditRoutine(routine)}
                      title="Editar ficha"
                      className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete routine */}
                    <button
                      onClick={() => {
                        if (window.confirm(`Deseja excluir a ficha "${routine.title}"?`)) {
                          deleteWorkoutRoutine(routine.id);
                        }
                      }}
                      title="Excluir ficha"
                      className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Toggle expand */}
                    <button
                      onClick={() => toggleExpand(routine.id)}
                      className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                    >
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Exercises List (Accordion body) */}
                {expanded && (
                  <div className="p-5 sm:p-6 bg-stone-50/60 dark:bg-stone-900/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                        Exercícios & Movimentos ({exercisesCount})
                      </div>
                      <button
                        onClick={() => handleOpenNewExercise(routine.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          isMale
                            ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800'
                            : 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Exercício</span>
                      </button>
                    </div>

                    {exercisesCount === 0 ? (
                      <div className="p-6 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-2">
                        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                          Nenhum exercício adicionado a esta ficha ainda.
                        </p>
                        <button
                          onClick={() => handleOpenNewExercise(routine.id)}
                          className={`text-xs font-semibold underline underline-offset-4 cursor-pointer ${
                            isMale ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          + Adicionar o primeiro exercício (ex: Espacate, Agachamento, Prancha)
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {routine.exercises.map((exercise, idx) => (
                          <div
                            key={exercise.id}
                            className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/70 dark:border-stone-800 shadow-2xs flex items-start justify-between gap-3 group"
                          >
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-stone-100 dark:bg-stone-800 text-[10px] font-bold text-stone-500 flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                                  {exercise.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 flex-wrap pl-7">
                                {exercise.sets && (
                                  <span className="font-medium text-stone-700 dark:text-stone-300">
                                    {exercise.sets} {exercise.sets === 1 ? 'série' : 'séries'}
                                  </span>
                                )}
                                {exercise.reps && (
                                  <>
                                    <span>•</span>
                                    <span>{exercise.reps}</span>
                                  </>
                                )}
                                {exercise.weight && (
                                  <>
                                    <span>•</span>
                                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                      {exercise.weight}
                                    </span>
                                  </>
                                )}
                              </div>

                              {exercise.notes && (
                                <p className="text-[11px] text-stone-400 dark:text-stone-500 pl-7 italic">
                                  "{exercise.notes}"
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition shrink-0">
                              <button
                                onClick={() => handleOpenEditExercise(routine.id, exercise)}
                                title="Editar exercício"
                                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteExerciseFromRoutine(routine.id, exercise.id)}
                                title="Remover exercício"
                                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Routine Modal (Create / Edit) */}
      {isRoutineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                {editingRoutine ? 'Editar Ficha de Treino' : 'Nova Ficha de Treino / Atividade'}
              </h3>
              <button
                onClick={() => setIsRoutineModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoutine} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Nome do Treino ou Prática *
                </label>
                <input
                  type="text"
                  value={routineForm.title}
                  onChange={(e) => setRoutineForm({ ...routineForm, title: e.target.value })}
                  placeholder={isMale ? 'Ex: Treino A - Peito e Tríceps' : 'Ex: Ballet • Flexibilidade e Alongamento'}
                  className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Modalidade / Categoria
                  </label>
                  <select
                    value={routineForm.category}
                    onChange={(e) => setRoutineForm({ ...routineForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Duração Estimada (minutos)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={routineForm.targetDurationMinutes}
                    onChange={(e) => setRoutineForm({ ...routineForm, targetDurationMinutes: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Dias ou Frequência Planejada
                </label>
                <input
                  type="text"
                  value={routineForm.scheduledDays}
                  onChange={(e) => setRoutineForm({ ...routineForm, scheduledDays: e.target.value })}
                  placeholder="Ex: Segundas e Quintas, ou Diário"
                  className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Orientações ou Observações
                </label>
                <textarea
                  value={routineForm.notes}
                  onChange={(e) => setRoutineForm({ ...routineForm, notes: e.target.value })}
                  rows={2}
                  placeholder="Ex: Começar com 5 minutos de aquecimento nas articulações..."
                  className="w-full px-4 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRoutineModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-2xl text-xs font-semibold text-white shadow-xs transition cursor-pointer ${
                    isMale ? 'bg-[#1F3A34] hover:bg-[#162924]' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {editingRoutine ? 'Salvar Alterações' : 'Criar Ficha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exercise Modal (Add / Edit) */}
      {isExerciseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                {editingExercise ? 'Editar Exercício' : 'Adicionar Exercício à Ficha'}
              </h3>
              <button
                onClick={() => setIsExerciseModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExercise} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Nome do Exercício / Movimento *
                </label>
                <input
                  type="text"
                  value={exerciseForm.name}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                  placeholder={isMale ? 'Ex: Supino Reto, Barra Fixa, Agachamento' : 'Ex: Espacate frontal, Ponte, Grand Battement'}
                  className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Séries
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={exerciseForm.sets}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, sets: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Repetições ou Tempo
                  </label>
                  <input
                    type="text"
                    value={exerciseForm.reps}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, reps: e.target.value })}
                    placeholder="Ex: 12 reps ou 45 seg"
                    className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Carga / Intensidade (opcional)
                </label>
                <input
                  type="text"
                  value={exerciseForm.weight}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, weight: e.target.value })}
                  placeholder="Ex: 15kg, Elástico roxo, ou Peso corporal"
                  className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Dica de execução / Nota
                </label>
                <input
                  type="text"
                  value={exerciseForm.notes}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, notes: e.target.value })}
                  placeholder="Ex: Manter coluna ereta e ponta dos pés estendida"
                  className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExerciseModalOpen(false)}
                  className="px-4 py-2 rounded-2xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-2xl text-xs font-semibold text-white shadow-xs transition cursor-pointer ${
                    isMale ? 'bg-[#1F3A34] hover:bg-[#162924]' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {editingExercise ? 'Salvar Exercício' : 'Adicionar Exercício'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
