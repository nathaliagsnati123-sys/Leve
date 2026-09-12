import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Moon, Sparkles, CheckCircle2, Heart, Droplets, Sprout, Activity, Zap, Target, Shield } from 'lucide-react';
import { getTodayDateString } from '../../services/storage';
import { isSectionHidden } from '../../utils/sections';
import { normalizeTreatmentPreference } from '../../utils/treatment';
import confetti from 'canvas-confetti';

export const DayClosingModal: React.FC = () => {
  const { isDayClosingOpen, setIsDayClosingOpen, data, saveJournalEntry, showToast } = useApp();
  const [takeaway, setTakeaway] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isDayClosingOpen) return null;

  const treatmentPreference = data.user?.treatmentPreference;
  const pref = normalizeTreatmentPreference(treatmentPreference);
  const hiddenSections = data.user?.hiddenSections || [];

  const todayStr = getTodayDateString();
  const todayTasks = (data.tasks || []).filter((t) => t.date === todayStr);
  const completedTasks = todayTasks.filter((t) => t.completed).length;

  const completedHabits = (data.habits || []).filter((h) => !!h.history?.[todayStr]).length;
  const totalHabits = (data.habits || []).length;

  const waterToday = data.hydration?.[todayStr]?.amountMl || 0;
  const waterTarget = data.hydration?.[todayStr]?.targetMl || 2000;

  const movementToday = (data.movement || []).filter((m) => m.date === todayStr).length;
  const selfCareCount = (data.selfCareCompleted?.[todayStr] || []).length;
  const prayersToday = (data.prayers || []).filter((p) => p.date === todayStr).length;

  const showTasksCard = !isSectionHidden('my-day', hiddenSections, treatmentPreference);
  const showHabitsCard = !isSectionHidden('habits', hiddenSections, treatmentPreference);
  const showWaterCard = !isSectionHidden('hydration', hiddenSections, treatmentPreference);
  const showSelfCareCard = !isSectionHidden('self-care', hiddenSections, treatmentPreference);
  const showMovementCard = !isSectionHidden('movement', hiddenSections, treatmentPreference);
  const showSpiritualityCard = !isSectionHidden('spirituality', hiddenSections, treatmentPreference);

  const handleFinish = () => {
    if (takeaway.trim()) {
      const existingEntry = data.journal[todayStr] || {
        date: todayStr,
        gratitude: ['', '', ''],
        goodThings: ['', '', '']
      };
      saveJournalEntry({
        ...existingEntry,
        specialMoment: takeaway.trim()
      });
    }

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#4EAA8F', '#73D1B4', '#E8F5F1', '#D4AF37']
      });
    } catch {
      // safe fallback
    }

    setIsCompleted(true);
  };

  const handleClose = () => {
    setIsDayClosingOpen(false);
    setIsCompleted(false);
    setTakeaway('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-5 sm:p-7 space-y-5 my-8 text-stone-900 dark:text-stone-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
              pref === 'masculino'
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
            }`}>
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold">
                {pref === 'masculino' ? 'Fechamento do Dia' : 'Seu dia chegou ao fim 🌙'}
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                {pref === 'masculino'
                  ? 'Balanço da sua execução, disciplina e recarga.'
                  : 'Você fez o que conseguiu hoje. E isso é suficiente.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 bg-stone-100 dark:bg-stone-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isCompleted ? (
          <div className="space-y-4">
            {/* Daily highlights summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {showTasksCard && (
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Tarefas</span>
                  </div>
                  <p className="text-sm font-bold">{completedTasks} de {todayTasks.length}</p>
                  <p className="text-[10px] text-stone-400">concluídas</p>
                </div>
              )}

              {showHabitsCard && (
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                    {pref === 'masculino' ? <Target className="w-3.5 h-3.5" /> : <Sprout className="w-3.5 h-3.5" />}
                    <span>{pref === 'masculino' ? 'Disciplina' : 'Hábitos'}</span>
                  </div>
                  <p className="text-sm font-bold">{completedHabits} de {totalHabits}</p>
                  <p className="text-[10px] text-stone-400">{pref === 'masculino' ? 'executados' : 'cultivados'}</p>
                </div>
              )}

              {showWaterCard && (
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
                  <div className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-400 font-semibold mb-1">
                    <Droplets className="w-3.5 h-3.5" />
                    <span>Água</span>
                  </div>
                  <p className="text-sm font-bold">{waterToday} ml</p>
                  <p className="text-[10px] text-stone-400">meta: {waterTarget} ml</p>
                </div>
              )}

              {showSelfCareCard && (
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
                  <div className={`flex items-center gap-1.5 font-semibold mb-1 ${
                    pref === 'masculino' ? 'text-stone-700 dark:text-stone-300' : 'text-rose-700 dark:text-rose-400'
                  }`}>
                    {pref === 'masculino' ? <Zap className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5" />}
                    <span>{pref === 'masculino' ? 'Recarga' : 'Autocuidado'}</span>
                  </div>
                  <p className="text-sm font-bold">{selfCareCount} ações</p>
                  <p className="text-[10px] text-stone-400">{pref === 'masculino' ? 'concluídas' : 'por você'}</p>
                </div>
              )}

              {showMovementCard && (
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold mb-1">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Treino</span>
                  </div>
                  <p className="text-sm font-bold">{movementToday} registro(s)</p>
                  <p className="text-[10px] text-stone-400">atividade física</p>
                </div>
              )}

              {showSpiritualityCard && (
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
                  <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold mb-1">
                    {pref === 'masculino' ? <Shield className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{pref === 'masculino' ? 'Fé & Oração' : 'Momento Fé'}</span>
                  </div>
                  <p className="text-sm font-bold">{prayersToday > 0 ? (pref === 'masculino' ? 'Concluído' : 'Realizado 🙏') : 'Silêncio'}</p>
                  <p className="text-[10px] text-stone-400">conexão interior</p>
                </div>
              )}
            </div>

            {/* Reflection question */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300">
                {pref === 'masculino'
                  ? 'Qual foi o principal aprendizado ou conquista de hoje?'
                  : 'O que você gostaria de levar deste dia?'}
              </label>
              <textarea
                value={takeaway}
                onChange={(e) => setTakeaway(e.target.value)}
                rows={3}
                placeholder={
                  pref === 'masculino'
                    ? 'Uma vitória, aprendizado estratégico ou ponto de melhoria para amanhã...'
                    : 'Um aprendizado, um sentimento bom ou um agradecimento que fica no seu coração...'
                }
                className="w-full p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50 resize-none"
              />
            </div>

            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-2.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] text-xs sm:text-sm font-semibold transition shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Moon className="w-4 h-4 text-emerald-300" />
                <span>{pref === 'masculino' ? 'Encerrar o dia' : 'Encerrar meu dia'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              pref === 'masculino'
                ? 'bg-stone-100 dark:bg-stone-800 text-emerald-600 dark:text-emerald-400'
                : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-3xl'
            }`}>
              {pref === 'masculino' ? <CheckCircle2 className="w-9 h-9" /> : '🕊️'}
            </div>
            <div className="space-y-2 max-w-sm mx-auto">
              <h4 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
                {pref === 'masculino' ? 'Missão cumprida por hoje.' : 'Descanse com o coração leve.'}
              </h4>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 italic leading-relaxed">
                {pref === 'masculino'
                  ? '"Descanse com a mente tranquila e recarregada. Amanhã seguimos com foco e disciplina."'
                  : '"Você não precisa fazer tudo hoje. Amanhã é uma nova oportunidade cheia de frescor e novas chances."'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="mt-4 px-6 py-2.5 rounded-full bg-[#1F3A34] text-white text-xs sm:text-sm font-medium hover:bg-[#162A25] transition cursor-pointer"
            >
              {pref === 'masculino' ? 'Concluir e descansar' : 'Boa noite e até amanhã ✨'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
