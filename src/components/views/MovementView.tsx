import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Activity, Plus, Clock, Smile, Trash2, Zap, Heart } from 'lucide-react';
import { getTodayDateString, formatDateToBrazilian, getPastDaysList } from '../../services/storage';
import { MovementActivity, MovementActivityType, MovementFeeling } from '../../types';

export const MovementView: React.FC = () => {
  const { data, addMovement, deleteMovement } = useApp();
  const todayStr = getTodayDateString();

  const [activity, setActivity] = useState<MovementActivityType>('Caminhada');
  const [duration, setDuration] = useState('30');
  const [date, setDate] = useState(todayStr);
  const [feeling, setFeeling] = useState<MovementFeeling>('Renovada e com energia');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(duration, 10);
    if (isNaN(mins) || mins <= 0) return;

    addMovement({
      type: activity,
      durationMinutes: mins,
      date,
      notes: feeling
    });
  };

  // Calculate total minutes in past 7 days
  const past7Days = getPastDaysList(7);
  const pastWeekMinutes = data.movement
    .filter((m) => past7Days.includes(m.date))
    .reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

  const activities: MovementActivityType[] = [
    'Caminhada', 'Corrida', 'Musculação / Treino', 'Alongamento', 'Pilates / Yoga', 'Dança', 'Bicicleta', 'Outro'
  ];

  const feelings: MovementFeeling[] = [
    'Renovada e com energia', 'Disposta', 'Cansada mas feliz', 'Relaxada'
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              Meu Movimento
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Mover o corpo é um ato de respeito e cuidado com a sua saúde.
            </p>
          </div>
        </div>

        {/* Weekly badge */}
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
          <Zap className="w-4 h-4 text-emerald-600" />
          <span>
            <strong>{pastWeekMinutes} minutos</strong> de movimento nos últimos 7 dias
          </span>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
          Registrar Atividade Física 🏃‍♀️
        </h3>

        <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-stone-700 dark:text-stone-300">Tipo de movimento</label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value as MovementActivity)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
              >
                {activities.map((act) => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-stone-700 dark:text-stone-300">Duração (minutos)</label>
              <input
                type="number"
                min="1"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-stone-700 dark:text-stone-300">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-stone-700 dark:text-stone-300">Como você se sentiu?</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {feelings.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFeeling(f)}
                  className={`p-2 rounded-xl border text-center transition ${
                    feeling === f
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-semibold'
                      : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Salvar Movimento</span>
            </button>
          </div>
        </form>
      </div>

      {/* History List */}
      <div className="space-y-3">
        <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
          Histórico de Movimento
        </h3>

        {(data.movement || []).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {(data.movement || []).map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-2 text-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100 font-serif">
                      {m.type || m.activity || 'Movimento'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                      {m.durationMinutes} min
                    </span>
                  </div>
                  <p className="text-stone-400 text-[10px] mt-0.5">
                    {formatDateToBrazilian(m.date)}
                  </p>
                  {(m.notes || m.feeling) && (
                    <p className="text-stone-600 dark:text-stone-300 italic mt-2">
                      "{m.notes || m.feeling}"
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-2 border-t border-stone-100 dark:border-stone-800">
                  <button
                    onClick={() => deleteMovement(m.id)}
                    className="text-stone-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-400 italic py-6 text-center">
            Nenhum movimento registrado ainda. Comece com uma caminhada leve de 15 minutos!
          </p>
        )}
      </div>
    </div>
  );
};
