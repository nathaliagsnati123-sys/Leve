import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Droplets, Plus, RotateCcw, Check, Sparkles, Trophy } from 'lucide-react';
import { getTodayDateString, getPastDaysList, formatDateToBrazilian } from '../../services/storage';

export const HydrationView: React.FC = () => {
  const { data, addWater, resetWater, setWaterTarget } = useApp();
  const todayStr = getTodayDateString();

  const currentWater = data.hydration[todayStr] || {
    date: todayStr,
    amountMl: 0,
    targetMl: 2000,
    logs: []
  };

  const [targetInput, setTargetInput] = useState(currentWater.targetMl.toString());
  const [isEditingTarget, setIsEditingTarget] = useState(false);

  const percent = Math.min(100, Math.round((currentWater.amountMl / currentWater.targetMl) * 100));

  // Visual glass count: 250ml per glass
  const totalGlasses = Math.ceil(currentWater.targetMl / 250);
  const filledGlasses = Math.floor(currentWater.amountMl / 250);

  const past7Days = getPastDaysList(7);

  const handleUpdateTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(targetInput, 10);
    if (!isNaN(val) && val > 0) {
      setWaterTarget(val);
      setIsEditingTarget(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              Minha Água
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Acompanhe seu consumo diário e hidrate seu corpo com leveza.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditingTarget ? (
            <form onSubmit={handleUpdateTarget} className="flex items-center gap-2">
              <input
                type="number"
                step="50"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                className="w-24 px-3 py-1.5 rounded-xl border border-cyan-300 dark:border-cyan-700 bg-white dark:bg-stone-800 text-xs text-center font-bold"
              />
              <span className="text-xs text-stone-500">ml</span>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-cyan-700 text-white text-xs font-semibold"
              >
                Salvar
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsEditingTarget(true)}
              className="text-xs text-cyan-700 dark:text-cyan-400 font-semibold hover:underline"
            >
              Meta: {currentWater.targetMl} ml (alterar)
            </button>
          )}
        </div>
      </div>

      {/* Main Hydration Card */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-xs text-center space-y-6">
        {/* Progress Ring / Number */}
        <div className="space-y-2">
          <div className="w-32 h-32 mx-auto rounded-full border-4 border-cyan-100 dark:border-cyan-950 flex flex-col items-center justify-center relative shadow-inner bg-cyan-50/30 dark:bg-cyan-950/20">
            <span className="text-3xl font-serif font-bold text-cyan-900 dark:text-cyan-100">
              {percent}%
            </span>
            <span className="text-[11px] text-cyan-700 dark:text-cyan-400">
              {currentWater.amountMl} / {currentWater.targetMl} ml
            </span>
          </div>

          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 pt-2 font-medium">
            {percent >= 100 ? (
              <span className="text-emerald-600 font-bold flex items-center justify-center gap-1.5">
                <Trophy className="w-4 h-4" />
                Parabéns! Meta de hidratação de hoje alcançada! 💧✨
              </span>
            ) : (
              `Faltam ${Math.max(0, currentWater.targetMl - currentWater.amountMl)} ml para atingir sua meta.`
            )}
          </p>
        </div>

        {/* Visual Glasses Grid */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Copos virtuais (250 ml cada)
          </span>
          <div className="flex items-center justify-center gap-2.5 flex-wrap max-w-md mx-auto pt-1">
            {Array.from({ length: totalGlasses }).map((_, i) => {
              const isFilled = i < filledGlasses;
              return (
                <button
                  key={i}
                  onClick={() => addWater(250)}
                  className={`w-10 h-12 rounded-b-xl rounded-t-sm border-2 transition-transform active:scale-95 flex items-center justify-center text-sm ${
                    isFilled
                      ? 'bg-cyan-500 border-cyan-600 text-white shadow-xs'
                      : 'border-cyan-200 dark:border-cyan-800 bg-cyan-50/40 dark:bg-cyan-950/30 text-cyan-300'
                  }`}
                  title={isFilled ? 'Copo cheio' : 'Clique para adicionar 250ml'}
                >
                  💧
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => addWater(200)}
            className="px-4 py-2 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200 text-xs font-semibold hover:bg-cyan-100"
          >
            + 200 ml (copo pequeno)
          </button>
          <button
            onClick={() => addWater(250)}
            className="px-4 py-2.5 rounded-2xl bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-700 shadow-xs"
          >
            + 250 ml (copo padrão)
          </button>
          <button
            onClick={() => addWater(300)}
            className="px-4 py-2 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200 text-xs font-semibold hover:bg-cyan-100"
          >
            + 300 ml (caneca)
          </button>
          <button
            onClick={() => addWater(500)}
            className="px-4 py-2.5 rounded-2xl bg-cyan-700 text-white text-xs font-semibold hover:bg-cyan-800 shadow-xs"
          >
            + 500 ml (garrafinha)
          </button>
          <button
            onClick={() => {
              if (window.confirm('Deseja zerar a água registrada hoje?')) resetWater();
            }}
            className="px-3 py-2 rounded-2xl text-stone-400 hover:text-stone-600 text-xs flex items-center gap-1"
            title="Zerar dia"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Zerar</span>
          </button>
        </div>
      </div>

      {/* Past 7 Days History */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
        <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
          Últimos 7 dias de hidratação
        </h3>

        <div className="grid grid-cols-7 gap-2 text-center">
          {past7Days.map((dStr) => {
            const h = data.hydration[dStr];
            const amt = h ? h.amountMl : 0;
            const tgt = h ? h.targetMl : 2000;
            const p = Math.min(100, Math.round((amt / tgt) * 100));
            const dateObj = new Date(dStr + 'T12:00:00');
            const dayInitial = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][dateObj.getDay()];

            return (
              <div
                key={dStr}
                className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60 flex flex-col items-center justify-between gap-2"
              >
                <span className="text-[10px] font-bold text-stone-400 uppercase">{dayInitial}</span>
                <div className="w-8 h-16 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden flex flex-col justify-end p-0.5">
                  <div
                    className="w-full bg-cyan-500 rounded-full transition-all duration-300"
                    style={{ height: `${p}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-stone-600 dark:text-stone-300">{amt}ml</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
