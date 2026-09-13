import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, Check, Star, Sparkles, Brain, Moon, Droplets, 
  Sprout, Heart, ChevronRight, CheckCircle2, Trash2, X, RefreshCw,
  Bell, BookOpen, Feather
} from 'lucide-react';
import { MyDayDetailsModal, MyDayModalType } from '../modals/MyDayDetailsModal';
import { getTodayDateString, formatDateToBrazilian } from '../../services/storage';
import { 
  SCRIPTURE_VERSES, 
  getSelfCareSuggestions, 
  getRandomMotivationalQuote 
} from '../../services/quotesAndVerses';
import { HOTMART_CHECKOUT, buildHotmartUrl } from '../../services/authorization';
import { Priority, Task } from '../../types';
import { isSectionHidden } from '../../utils/sections';
import { 
  normalizeTreatmentPreference, 
  adaptTextToGender, 
  getGreetingSubtitle, 
  getSelfCareSectionTitle, 
  getGratitudeWidgetTitle, 
  getGratitudePlaceholder, 
  getEndDayButtonLabel 
} from '../../utils/treatment';

export const MyDayView: React.FC = () => {
  const { 
    data, 
    addTask,
    deleteTask,
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
    showToast,
    updateTask,
    notificationSettings
  } = useApp();

  const { user, hasLeveAccess, refreshEntitlements, isCheckingEntitlements } = useAuth();
  const [isRefreshingPlan, setIsRefreshingPlan] = useState(false);

  const handleRefreshPlan = async () => {
    setIsRefreshingPlan(true);
    try {
      await refreshEntitlements();
    } finally {
      setIsRefreshingPlan(false);
    }
  };

  const especialCheckoutUrl = buildHotmartUrl(HOTMART_CHECKOUT.ESPECIAL, user?.email);
  const todayStr = getTodayDateString();

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

  const treatmentPreference = data.user?.treatmentPreference;
  const pref = normalizeTreatmentPreference(treatmentPreference);
  const hiddenSections = data.user?.hiddenSections || [];

  // Extrai o primeiro nome para uma saudação personalizada e afetiva como no mockup ("Bom dia, Nathe!")
  const rawName = data.user?.name?.trim();
  const firstName = rawName 
    ? rawName.split(' ')[0] 
    : (pref === 'masculino' ? 'Amigo' : 'Nathe');

  // Dynamic motivational quote
  const [dailyQuote, setDailyQuote] = useState<string>(() => {
    const previous = typeof window !== 'undefined' ? sessionStorage.getItem('leve_last_motivational_quote') || '' : '';
    const newQuote = getRandomMotivationalQuote(previous, treatmentPreference);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('leve_last_motivational_quote', newQuote);
    }
    return newQuote;
  });

  const shuffleMotivationalQuote = () => {
    const next = getRandomMotivationalQuote(dailyQuote, treatmentPreference);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('leve_last_motivational_quote', next);
    }
    setDailyQuote(next);
  };

  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const rawVerse = SCRIPTURE_VERSES[dayOfYear % SCRIPTURE_VERSES.length];
  const dailyVerse = {
    ...rawVerse,
    verse: adaptTextToGender(rawVerse.verse, treatmentPreference)
  };

  const selfCareList = getSelfCareSuggestions(treatmentPreference);
  const dailySelfCare = selfCareList[dayOfYear % selfCareList.length];

  // Visibilidade das seções pagas (somente para quem tem LEVE Especial ou VIP)
  const showHabits = hasLeveAccess && !isSectionHidden('habits', hiddenSections, treatmentPreference);
  const showHydration = hasLeveAccess && !isSectionHidden('hydration', hiddenSections, treatmentPreference);
  const showSelfCare = hasLeveAccess && !isSectionHidden('self-care', hiddenSections, treatmentPreference);
  const showSpirituality = hasLeveAccess && !isSectionHidden('spirituality', hiddenSections, treatmentPreference);
  const showJournal = hasLeveAccess && !isSectionHidden('journal', hiddenSections, treatmentPreference);

  const gratitudePlaceholder = getGratitudePlaceholder(treatmentPreference);
  const endDayButtonLabel = getEndDayButtonLabel(treatmentPreference);

  // Formulário rápido de prioridade
  const [isAddingPriority, setIsAddingPriority] = useState(false);
  const [newPriorityTitle, setNewPriorityTitle] = useState('');
  const [newPriorityLevel, setNewPriorityLevel] = useState<Priority>('high');

  // Modal com todos os itens cadastrados ao clicar na setinha
  const [detailsModalType, setDetailsModalType] = useState<MyDayModalType | null>(null);

  // Gratidão rápida
  const [quickGratitude, setQuickGratitude] = useState('');

  // Tarefas de hoje (inclui tarefas do dia de hoje e tarefas sem data definida)
  const todayTasks = useMemo(() => {
    return data.tasks.filter((t) => !t.date || t.date === todayStr);
  }, [data.tasks, todayStr]);

  // Prioridades do dia (tarefas explicitamente marcadas com isPriority para hoje ou gerais)
  const priorityTasks = useMemo(() => {
    return data.tasks
      .filter((t) => Boolean(t.isPriority) && (!t.date || t.date === todayStr))
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return 0;
      })
      .slice(0, 3);
  }, [data.tasks, todayStr]);

  const handleAddPriority = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPriorityTitle.trim()) return;

    addTask({
      title: newPriorityTitle.trim(),
      date: todayStr,
      priority: newPriorityLevel,
      isPriority: true,
      category: 'Geral',
      repeat: 'none'
    });

    setNewPriorityTitle('');
    setIsAddingPriority(false);
    showToast('Prioridade adicionada ao seu dia! ⭐', 'success');
  };

  // Água
  const water = data.hydration[todayStr] || { date: todayStr, amountMl: 0, targetMl: 2000, logs: [] };
  const waterPercent = Math.min(100, Math.round((water.amountMl / water.targetMl) * 100));

  // Autocuidado
  const isSelfCareDone = (data.selfCareCompleted[todayStr] || []).includes(dailySelfCare.text);

  // Gratidão rápida
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
    showToast(pref === 'masculino' ? 'Registro salvo no seu caderno.' : 'Gratidão registrada no seu caderno! 🤍');
  };

  // Cálculo SVG do anel de progresso circular compacto
  const circleRadius = 18;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (todayCompletionPercentage / 100) * circumference;

  return (
    <div className="space-y-3.5 max-w-4xl mx-auto pb-12">
      {/* 1. Welcome & Greeting Banner (Versão mais compacta, elegante e harmoniosa) */}
      <section className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0c201a] via-[#112e25] to-[#091713] text-white p-3 sm:px-4.5 sm:py-3 border border-emerald-900/50 shadow-xs">
        {/* Folhagem botânica suave decorativa ao fundo */}
        <svg 
          className="absolute -right-4 -top-4 w-32 h-32 opacity-15 pointer-events-none text-emerald-400" 
          viewBox="0 0 100 100" 
          fill="currentColor"
        >
          <path d="M50 0 C70 30 90 40 100 60 C80 65 65 60 50 100 C45 70 35 50 0 50 C25 45 40 30 50 0 Z" />
        </svg>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg">{greetingEmoji}</span>
              <h1 className="font-serif text-base sm:text-lg font-bold tracking-tight text-white">
                {greeting}, <span className="text-[#4ADE80] font-semibold">{firstName}</span>!
              </h1>
            </div>

            <div className="flex items-center gap-1.5">
              <p className="font-serif italic text-emerald-100/90 text-xs leading-snug">
                "{dailyQuote}" 🍃
              </p>
              <button
                type="button"
                onClick={shuffleMotivationalQuote}
                className="p-0.5 text-emerald-300/70 hover:text-white hover:bg-white/10 rounded transition shrink-0 cursor-pointer"
                title="Trocar frase de motivação"
                aria-label="Trocar frase de motivação"
              >
                <RefreshCw className="w-2.5 h-2.5" />
              </button>
            </div>

            <div className="pt-0.5">
              <button
                id="my-day-brain-dump-btn"
                onClick={() => setIsBrainDumpOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-100 border border-emerald-600/40 text-[11px] font-semibold transition cursor-pointer shadow-2xs group"
                title="Tirar da cabeça e descarregar pensamentos"
              >
                <Brain className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Tirar da cabeça</span>
              </button>
            </div>
          </div>

          {/* Anel de Progresso Circular compacto à direita */}
          <div className="flex items-center gap-2.5 shrink-0 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-xl backdrop-blur-xs self-start sm:self-center">
            <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
              <svg className="w-11 h-11 transform -rotate-90">
                <circle
                  cx="22"
                  cy="22"
                  r={circleRadius}
                  className="stroke-emerald-950/90"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                <circle
                  cx="22"
                  cy="22"
                  r={circleRadius}
                  className="stroke-emerald-400 transition-all duration-700 ease-out"
                  strokeWidth="3.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-[11px] font-bold text-white">
                {todayCompletionPercentage}%
              </span>
            </div>

            <div className="space-y-0.5">
              <p className="text-[11px] font-bold text-white tracking-tight">Progresso do dia</p>
              <p className="text-[10px] text-emerald-200/80 leading-tight">
                {todayCompletionPercentage === 100 
                  ? 'Dia completo com leveza! ✨' 
                  : todayCompletionPercentage > 50 
                  ? 'Mais da metade realizada 🌱' 
                  : 'Dando um passo de cada vez 🌿'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Grid Bento Sincronizada (2 Colunas Limpas e Balanceadas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        
        {/* CARD 1: Prioridades do Dia */}
        <section className="bg-white dark:bg-[#121A17] rounded-2xl p-4 border border-stone-200/80 dark:border-white/5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-100 dark:border-stone-800/80">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <h2 className="font-serif text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                  Prioridades do Dia
                </h2>
              </div>
              <button
                onClick={() => setIsAddingPriority(!isAddingPriority)}
                className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800/90 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 flex items-center justify-center transition cursor-pointer"
                title="Adicionar prioridade"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Formulário rápido inline para nova prioridade */}
            {isAddingPriority && (
              <form onSubmit={handleAddPriority} className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
                <input
                  type="text"
                  value={newPriorityTitle}
                  onChange={(e) => setNewPriorityTitle(e.target.value)}
                  placeholder="Nome do foco prioritário..."
                  autoFocus
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-700 text-stone-900 dark:text-stone-100 focus:outline-none"
                />
                <div className="flex items-center justify-between gap-1 text-[10px]">
                  <div className="flex items-center gap-1">
                    {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewPriorityLevel(p)}
                        className={`px-2 py-0.5 rounded font-bold uppercase transition ${
                          newPriorityLevel === p
                            ? p === 'high' 
                              ? 'bg-rose-500 text-white' 
                              : p === 'medium' 
                              ? 'bg-amber-500 text-white' 
                              : 'bg-stone-600 text-white'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                        }`}
                      >
                        {p === 'high' ? 'Alta' : p === 'medium' ? 'Média' : 'Baixa'}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingPriority(false)}
                      className="px-2 py-1 text-stone-500 hover:text-stone-700 text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!newPriorityTitle.trim()}
                      className="px-2.5 py-1 rounded bg-[#1F3A34] text-white text-xs font-semibold disabled:opacity-50"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Lista de Prioridades */}
            <div className="space-y-2">
              {priorityTasks.length > 0 ? (
                priorityTasks.map((t) => (
                  <div 
                    key={t.id} 
                    className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-stone-50/70 dark:bg-stone-850/50 hover:bg-stone-100 dark:hover:bg-stone-800/70 transition border border-stone-100 dark:border-stone-800/60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
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

                      <span 
                        onClick={() => openEditTaskModal(t)}
                        className={`text-xs sm:text-sm font-medium truncate cursor-pointer ${
                          t.completed 
                            ? 'line-through text-stone-400 dark:text-stone-500' 
                            : 'text-stone-800 dark:text-stone-200'
                        }`}
                      >
                        {t.title}
                      </span>
                    </div>

                    {/* Tag de Prioridade Elegante */}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                      t.priority === 'high'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        : t.priority === 'medium'
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        : 'bg-stone-500/15 text-stone-600 dark:text-stone-300 border border-stone-500/30'
                    }`}>
                      {t.priority === 'high' ? 'ALTA' : t.priority === 'medium' ? 'MÉDIA' : 'BAIXA'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">
                    Nenhum foco prioritário definido ainda.
                  </p>
                  <button
                    onClick={() => setIsAddingPriority(true)}
                    className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Definir uma prioridade</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDetailsModalType('priorities')}
            className="pt-2 text-xs text-stone-400 hover:text-emerald-600 dark:text-stone-400 dark:hover:text-emerald-400 flex items-center justify-between w-full border-t border-stone-100 dark:border-stone-800/80 transition cursor-pointer group"
          >
            <span className="group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Ver todas ({priorityTasks.length})
            </span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </section>

        {/* CARD 2: Tarefas de Hoje (N) */}
        <section className="bg-white dark:bg-[#121A17] rounded-2xl p-4 border border-stone-200/80 dark:border-white/5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-100 dark:border-stone-800/80">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="font-serif text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                  Tarefas de Hoje ({todayTasks.length})
                </h2>
              </div>
              <button
                onClick={openNewTaskModal}
                className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800/90 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 flex items-center justify-center transition cursor-pointer"
                title="Adicionar tarefa"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {todayTasks.length > 0 ? (
                todayTasks.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-stone-50/70 dark:bg-stone-850/50 hover:bg-stone-100 dark:hover:bg-stone-800/70 transition border border-stone-100 dark:border-stone-800/60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
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

                      <div 
                        onClick={() => openEditTaskModal(t)}
                        className="cursor-pointer min-w-0"
                      >
                        <p className={`text-xs sm:text-sm font-medium truncate ${
                          t.completed 
                            ? 'line-through text-stone-400 dark:text-stone-500' 
                            : 'text-stone-800 dark:text-stone-200'
                        }`}>
                          {t.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {t.category && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                              {t.category}
                            </span>
                          )}
                          {t.priority === 'high' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400">
                              ALTA
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">
                    Nenhuma tarefa agendada para hoje.
                  </p>
                  <button
                    onClick={openNewTaskModal}
                    className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar tarefa</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDetailsModalType('tasks')}
            className="pt-2 text-xs text-stone-400 hover:text-emerald-600 dark:text-stone-400 dark:hover:text-emerald-400 flex items-center justify-between w-full border-t border-stone-100 dark:border-stone-800/80 transition cursor-pointer group"
          >
            <span className="group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Ver todas as tarefas ({todayTasks.length})
            </span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </section>

        {/* CARD 3: Hábitos de Hoje (Apenas na versão paga) */}
        {showHabits && (
          <section className="bg-white dark:bg-[#121A17] rounded-2xl p-4 border border-stone-200/80 dark:border-white/5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-100 dark:border-stone-800/80">
                <div className="flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="font-serif text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                    Hábitos de Hoje
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsModalType('habits')}
                  className="text-xs text-stone-400 hover:text-emerald-600 dark:text-stone-400 dark:hover:text-emerald-400 flex items-center gap-0.5 transition cursor-pointer group"
                >
                  <span className="group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Ver todos ({data.habits.length})
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="space-y-2">
                {data.habits.length > 0 ? (
                  data.habits.slice(0, 3).map((h) => {
                    const isDone = Array.isArray(h.history)
                      ? h.history.includes(todayStr)
                      : Boolean(h.history?.[todayStr]);
                    const habitName = h.name || (h as any).title || 'Hábito';
                    return (
                      <div
                        key={h.id}
                        onClick={() => toggleHabitCompletion(h.id, todayStr)}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-stone-50/70 dark:bg-stone-850/50 hover:bg-stone-100 dark:hover:bg-stone-800/70 transition border border-stone-100 dark:border-stone-800/60 cursor-pointer"
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 transition flex items-center justify-center shrink-0 ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-stone-400 dark:border-stone-500 text-transparent'
                          }`}
                        >
                          {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={`text-xs sm:text-sm font-medium truncate ${
                          isDone 
                            ? 'line-through text-stone-400 dark:text-stone-500' 
                            : 'text-stone-800 dark:text-stone-200'
                        }`}>
                          {habitName}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-stone-400 dark:text-stone-500 py-3 text-center">
                    Nenhum hábito cadastrado ainda.
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setActiveTab('habits')}
              className="pt-2 text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 w-full border-t border-stone-100 dark:border-stone-800/80 transition cursor-pointer font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar hábito</span>
            </button>
          </section>
        )}

        {/* CARD 4: Minha Água (Apenas na versão paga) */}
        {showHydration && (
          <section className="bg-white dark:bg-[#121A17] rounded-2xl p-4 border border-stone-200/80 dark:border-white/5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-100 dark:border-stone-800/80">
                <div className="flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-cyan-500" />
                  <h2 className="font-serif text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                    Minha Água
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsModalType('hydration')}
                  className="text-xs text-stone-400 hover:text-cyan-600 dark:text-stone-400 dark:hover:text-cyan-400 flex items-center gap-0.5 transition cursor-pointer group"
                >
                  <span className="group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    Detalhes
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-bold font-serif text-cyan-600 dark:text-cyan-400">
                    {water.amountMl}
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    / {water.targetMl} ml
                  </span>
                </div>

                {/* Barra de progresso de hidratação */}
                <div className="w-full h-2 bg-cyan-950/30 dark:bg-cyan-950/50 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${waterPercent}%` }}
                  />
                </div>
              </div>

              {/* Botões de Ação Rápida */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  id="my-day-add-water-250"
                  onClick={() => addWater(250)}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition cursor-pointer text-center"
                >
                  + 250 ml
                </button>
                <button
                  id="my-day-add-water-500"
                  onClick={() => addWater(500)}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition cursor-pointer text-center"
                >
                  + 500 ml
                </button>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('settings')}
              className="pt-2 text-xs text-stone-400 hover:text-stone-600 dark:text-stone-400 dark:hover:text-stone-300 flex items-center gap-1 w-full border-t border-stone-100 dark:border-stone-800/80 transition cursor-pointer"
            >
              <Bell className="w-3 h-3 text-cyan-500" />
              <span>Lembrete</span>
              <ChevronRight className="w-3 h-3 ml-auto" />
            </button>
          </section>
        )}

        {/* CARD 5: Autocuidado de Hoje (Apenas na versão paga) */}
        {showSelfCare && (
          <section className="bg-white dark:bg-[#121A17] rounded-2xl p-4 border border-stone-200/80 dark:border-white/5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 pb-2.5 border-b border-stone-100 dark:border-stone-800/80">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                <h2 className="font-serif text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                  Autocuidado de Hoje
                </h2>
              </div>

              {/* Card Interno Suave */}
              <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                    isSelfCareDone ? 'bg-rose-500 border-rose-500 text-white' : 'border-stone-400 dark:border-stone-600'
                  }`}>
                    {isSelfCareDone && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <p className={`text-xs sm:text-sm font-semibold ${isSelfCareDone ? 'line-through text-stone-400 dark:text-stone-500' : 'text-stone-900 dark:text-stone-100'}`}>
                      {dailySelfCare.text}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                      Pequeno gesto de carinho e presença para você.
                    </p>
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => toggleSelfCareItem(dailySelfCare.text)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer shadow-2xs ${
                      isSelfCareDone 
                        ? 'bg-rose-600 text-white' 
                        : 'bg-white hover:bg-stone-100 text-stone-900 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-100 border border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    {isSelfCareDone ? 'Concluído ✓' : 'Marcar'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CARD 6: Momento com Deus (Apenas na versão paga) */}
        {showSpirituality && (
          <section className="bg-white dark:bg-[#121A17] rounded-2xl p-4 border border-stone-200/80 dark:border-white/5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-100 dark:border-stone-800/80">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="font-serif text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                    Momento com Deus
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsModalType('spirituality')}
                  className="p-1 text-stone-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition cursor-pointer"
                  title="Ver palavra completa e meditação"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <p className="font-serif italic text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed line-clamp-3">
                  "{dailyVerse.verse}"
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                  {dailyVerse.reference}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsFiveMinGodOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-200 text-xs font-semibold border border-emerald-700/40 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fazer os 5 Minutos com Deus</span>
            </button>
          </section>
        )}

      </div>

      {/* CARD 7: Uma coisa boa que aconteceu hoje (Apenas na versão paga) */}
      {showJournal && (
        <section className="bg-white dark:bg-[#121A17] rounded-2xl p-4 border border-stone-200/80 dark:border-white/5 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2">
            <Feather className="w-4 h-4 text-emerald-500" />
            <h3 className="font-serif text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
              Uma coisa boa que aconteceu hoje 🤍
            </h3>
          </div>
          <form onSubmit={handleSaveQuickGratitude} className="flex gap-2">
            <input
              type="text"
              value={quickGratitude}
              onChange={(e) => setQuickGratitude(e.target.value)}
              placeholder="Ex: Um abraço apertado, o sol na janela, uma conquista..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600/50"
            />
            <button
              type="submit"
              disabled={!quickGratitude.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-xs font-semibold disabled:opacity-40 transition cursor-pointer shrink-0"
            >
              Guardar
            </button>
          </form>
        </section>
      )}

      {/* Convite Discreto para o LEVE Especial (Aparece apenas na versão gratuita) */}
      {!hasLeveAccess && (
        <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 dark:from-amber-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 border border-amber-200/70 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Desbloqueie a rotina completa com o LEVE Especial</span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Cultive hábitos diários, acompanhe hidratação, pratique autocuidado, momentos com Deus e reflexões diretamente no seu Meu Dia.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
            <a
              href={especialCheckoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Conhecer o LEVE Especial</span>
            </a>
            <button
              type="button"
              onClick={handleRefreshPlan}
              disabled={isRefreshingPlan || isCheckingEntitlements}
              className="px-3 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Já comprou? Atualize seu acesso"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshingPlan || isCheckingEntitlements ? 'animate-spin' : ''}`} />
              <span>Já é assinante?</span>
            </button>
          </div>
        </section>
      )}

      {/* Botão de Fechamento de Dia Estilo Pílula Sofisticada (Como no mockup) */}
      <div className="pt-2 text-center">
        <button
          onClick={() => setIsDayClosingOpen(true)}
          className="w-full sm:w-auto px-7 py-3 rounded-full bg-stone-100 hover:bg-white text-stone-900 dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 font-semibold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
        >
          <Moon className="w-4 h-4 text-indigo-600" />
          <span>Encerrar o dia com gratidão e descanso</span>
          <ChevronRight className="w-4 h-4 text-stone-500 ml-1" />
        </button>
      </div>

      {/* Caixinha Modal que abre ao clicar na setinha mostrando tudo que foi cadastrado */}
      <MyDayDetailsModal
        type={detailsModalType}
        onClose={() => setDetailsModalType(null)}
      />
    </div>
  );
};
