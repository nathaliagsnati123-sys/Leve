import React from 'react';
import { useApp } from '../../context/AppContext';
import { TrendingUp, Flame, Award, CheckCircle2, Droplets, Target, Calendar, Sparkles } from 'lucide-react';
import { getPastDaysList, formatDateToBrazilian } from '../../services/storage';

export const ProgressView: React.FC = () => {
  const { data, setIsAchievementsOpen } = useApp();

  const totalTasksCompleted = (data.tasks || []).filter((t) => t.completed).length;
  const totalHabits = (data.habits || []).length;
  const totalGoalsReached = (data.goals || []).filter((g) => g.status === 'completed' || g.completed).length;
  const unlockedBadgesCount = Object.keys(data.unlockedAchievements || {}).length;

  const past7Days = getPastDaysList(7);

  // Calculate gentle streak from habit consistency
  const streakDays = Math.max(
    1,
    (data.habits || []).reduce((max, h) => {
      let current = 0;
      for (const day of past7Days) {
        if (h.history?.[day]) current++;
        else break;
      }
      return Math.max(max, current);
    }, 1)
  );

  // Daily task completion count for past 7 days
  const dailyTaskCompletion = past7Days.map((d) => {
    const count = (data.tasks || []).filter((t) => t.completed && t.date === d).length;
    const dateObj = new Date(d + 'T12:00:00');
    const label = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dateObj.getDay()];
    return { date: d, label, count };
  });

  const maxTaskCount = Math.max(...dailyTaskCompletion.map((d) => d.count), 4);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              Meu Progresso & Constância
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Celebre cada passo dado. Cada pequena escolha diária importa.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAchievementsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-semibold hover:bg-amber-100"
        >
          <Award className="w-4 h-4 text-amber-600" />
          <span>Ver Minhas Conquistas ({unlockedBadgesCount})</span>
        </button>
      </div>

      {/* Gentle encouragement banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 p-5 rounded-3xl border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-3">
        <span className="text-2xl">🌿</span>
        <div className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed">
          <strong>Lembre-se:</strong> Progresso não é ser perfeita todos os dias. Progresso é voltar a cuidar de si mesma com carinho sempre que a vida ficar pesada.
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-stone-400 text-xs">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Sequência Atual</span>
          </div>
          <p className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
            {streakDays} {streakDays === 1 ? 'dia' : 'dias'}
          </p>
          <span className="text-[10px] text-stone-400">De consistência e presença</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-stone-400 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Tarefas Concluídas</span>
          </div>
          <p className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
            {totalTasksCompleted}
          </p>
          <span className="text-[10px] text-stone-400">Tiradas da mente e feitas</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-stone-400 text-xs">
            <Target className="w-4 h-4 text-indigo-500" />
            <span>Metas Alcançadas</span>
          </div>
          <p className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
            {totalGoalsReached}
          </p>
          <span className="text-[10px] text-stone-400">Sonhos materializados</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-stone-400 text-xs">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Medalhas</span>
          </div>
          <p className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
            {unlockedBadgesCount}
          </p>
          <span className="text-[10px] text-stone-400">Marcos de autocuidado</span>
        </div>
      </div>

      {/* 7-Day Completed Tasks Chart */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
          Tarefas Realizadas nos Últimos 7 Dias
        </h3>

        <div className="flex items-end justify-between gap-3 h-44 pt-6 px-4">
          {dailyTaskCompletion.map((day) => {
            const heightPercent = maxTaskCount > 0 ? Math.round((day.count / maxTaskCount) * 100) : 0;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                  {day.count}
                </span>
                <div className="w-full max-w-[36px] bg-stone-100 dark:bg-stone-800 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                  <div
                    className="w-full bg-[#1F3A34] rounded-t-xl transition-all duration-300"
                    style={{ height: `${Math.max(8, heightPercent)}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-stone-400 uppercase">
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Habits overview */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
          Seus Hábitos Cadastrados ({totalHabits})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {(data.habits || []).map((h) => {
            const completedDaysCount = past7Days.filter((d) => !!h.history?.[d]).length;
            const consistencyRate = Math.round((completedDaysCount / 7) * 100);

            return (
              <div
                key={h.id}
                className="p-4 rounded-2xl border border-stone-200/70 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/40 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-900 dark:text-stone-100 font-serif">
                    {h.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    {completedDaysCount}/7 dias
                  </span>
                </div>

                <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${consistencyRate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
