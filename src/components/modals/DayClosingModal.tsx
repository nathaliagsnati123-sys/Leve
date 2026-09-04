import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Moon, Sparkles, CheckCircle2, Heart, Droplets, Sprout, Activity } from 'lucide-react';
import { getTodayDateString } from '../../services/storage';
import confetti from 'canvas-confetti';

export const DayClosingModal: React.FC = () => {
  const { isDayClosingOpen, setIsDayClosingOpen, data, saveJournalEntry, showToast } = useApp();
  const [takeaway, setTakeaway] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isDayClosingOpen) return null;

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
            <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold">
                Seu dia chegou ao fim 🌙
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                Você fez o que conseguiu hoje. E isso é suficiente.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 bg-stone-100 dark:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isCompleted ? (
          <div className="space-y-4">
            {/* Daily highlights summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tarefas</span>
                </div>
                <p className="text-sm font-bold">{completedTasks} de {todayTasks.length}</p>
                <p className="text-[10px] text-stone-400">concluídas</p>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                  <Sprout className="w-3.5 h-3.5" />
                  <span>Hábitos</span>
                </div>
                <p className="text-sm font-bold">{completedHabits} de {totalHabits}</p>
                <p className="text-[10px] text-stone-400">cultivados</p>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
                <div className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-400 font-semibold mb-1">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Água</span>
                </div>
                <p className="text-sm font-bold">{waterToday} ml</p>
                <p className="text-[10px] text-stone-400">meta: {waterTarget} ml</p>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
                <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-semibold mb-1">
                  <Heart className="w-3.5 h-3.5" />
                  <span>Autocuidado</span>
                </div>
                <p className="text-sm font-bold">{selfCareCount} ações</p>
                <p className="text-[10px] text-stone-400">por você</p>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
                <div className="flex items-center gap-1.5 text-orange-700 dark:text-orange-400 font-semibold mb-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Movimento</span>
                </div>
                <p className="text-sm font-bold">{movementToday} registro(s)</p>
                <p className="text-[10px] text-stone-400">atividade física</p>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
                <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 font-semibold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Momento Fé</span>
                </div>
                <p className="text-sm font-bold">{prayersToday > 0 ? 'Realizado 🙏' : 'Silêncio'}</p>
                <p className="text-[10px] text-stone-400">conexão interior</p>
              </div>
            </div>

            {/* Reflection question */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300">
                O que você gostaria de levar deste dia?
              </label>
              <textarea
                value={takeaway}
                onChange={(e) => setTakeaway(e.target.value)}
                rows={3}
                placeholder="Um aprendizado, um sentimento bom ou um agradecimento que fica no seu coração..."
                className="w-full p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              />
            </div>

            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-2.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] text-xs sm:text-sm font-semibold transition shadow-xs flex items-center gap-2"
              >
                <Moon className="w-4 h-4 text-emerald-300" />
                <span>Encerrar meu dia</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto text-3xl">
              🕊️
            </div>
            <div className="space-y-2 max-w-sm mx-auto">
              <h4 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
                Descanse com o coração leve.
              </h4>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 italic leading-relaxed">
                "Você não precisa fazer tudo hoje. Amanhã é uma nova oportunidade cheia de frescor e novas chances."
              </p>
            </div>
            <button
              onClick={handleClose}
              className="mt-4 px-6 py-2.5 rounded-full bg-[#1F3A34] text-white text-xs sm:text-sm font-medium hover:bg-[#162A25] transition"
            >
              Boa noite e até amanhã ✨
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
