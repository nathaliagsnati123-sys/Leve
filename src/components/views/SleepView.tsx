import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Moon, Clock, Sparkles, Check, Trash2, Sun } from 'lucide-react';
import { getTodayDateString, formatDateToBrazilian } from '../../services/storage';
import { SleepQuality } from '../../types';

export const SleepView: React.FC = () => {
  const { data, updateSleep } = useApp();
  const todayStr = getTodayDateString();

  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState<SleepQuality>('Descansada e disposta');
  const [date, setDate] = useState(todayStr);

  // Calculate duration in hours
  const calculateHours = () => {
    const [bH, bM] = bedtime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);

    let diffMinutes = (wH * 60 + wM) - (bH * 60 + bM);
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // crossed midnight
    }

    return (diffMinutes / 60).toFixed(1);
  };

  const hoursDormidas = calculateHours();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSleep(date, {
      bedtime,
      wakeTime,
      hours: parseFloat(hoursDormidas),
      quality
    });
  };

  const sleepLogs = (
    Array.isArray(data.sleep)
      ? data.sleep
      : Object.values(data.sleep || {})
  ).sort((a, b) => b.date.localeCompare(a.date));

  const sleepRituals = [
    { title: 'Chá quentinho de camomila ou melissa', icon: '🍵' },
    { title: 'Desligar celular 30 minutos antes', icon: '📵' },
    { title: 'Quarto escuro e arejado', icon: '🌙' },
    { title: 'Oração ou leitura leve', icon: '📖' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
            <Moon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              Meu Sono & Descanso
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              O descanso é parte sagrada da sua saúde e da sua renovação diária.
            </p>
          </div>
        </div>
      </div>

      {/* Sleep Log Form */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
          Registrar Noite de Sono 🌙
        </h3>

        <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-stone-700 dark:text-stone-300">Data ao acordar</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-stone-700 dark:text-stone-300">Horário que dormi</label>
              <input
                type="time"
                required
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-stone-700 dark:text-stone-300">Horário que acordei</label>
              <input
                type="time"
                required
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 flex items-center justify-between">
            <span className="text-xs text-indigo-900 dark:text-indigo-200 font-medium">
              Duração calculada:
            </span>
            <span className="text-lg font-bold font-serif text-indigo-950 dark:text-indigo-100">
              {hoursDormidas} horas
            </span>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-stone-700 dark:text-stone-300">Como acordei?</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(['Descansada e disposta', 'Sono picado / acordei algumas vezes', 'Cansada / precisava de mais'] as SleepQuality[]).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuality(q)}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    quality === q
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-indigo-950 dark:text-indigo-200 font-semibold'
                      : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Noite de Sono</span>
            </button>
          </div>
        </form>
      </div>

      {/* Gentle Sleep Rituals Suggestions */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
        <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
          Rituais Suaves para um Sono Reparador 😴
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {sleepRituals.map((r, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-700/60 flex items-center gap-3 text-xs"
            >
              <span className="text-xl">{r.icon}</span>
              <span className="text-stone-700 dark:text-stone-300 font-medium">{r.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="space-y-3">
        <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
          Histórico de Noites Registradas
        </h3>

        {sleepLogs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {sleepLogs.map((s) => (
              <div
                key={s.id || s.date}
                className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-stone-900 dark:text-stone-100">
                    {formatDateToBrazilian(s.date)}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold">
                    {s.hours}h de sono
                  </span>
                </div>
                <p className="text-stone-400 text-[10px]">
                  {s.bedtime} às {s.wakeTime}
                </p>
                <p className="text-stone-600 dark:text-stone-300 italic pt-1">
                  "{s.quality}"
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-400 italic py-6 text-center">
            Nenhuma noite registrada ainda. Comece anotando como você dormiu hoje!
          </p>
        )}
      </div>
    </div>
  );
};
