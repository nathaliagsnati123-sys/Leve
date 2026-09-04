import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, Calendar, Heart, Moon, Sun, 
  Droplet, Smile, Plus, Trash2, Edit3, 
  Info, Check, X, ShieldAlert, Coffee, 
  Activity, ArrowRight, Settings
} from 'lucide-react';
import { formatDateToBrazilian, getTodayDateString } from '../../services/storage';
import { MenstrualPeriod, FlowIntensity, CycleDailyLog } from '../../types';

export const CycleView: React.FC = () => {
  const { 
    data, 
    addPeriod, 
    updatePeriod, 
    deletePeriod, 
    updateCycleDailyLog, 
    updateCycleSettings,
    showToast 
  } = useApp();

  const todayStr = getTodayDateString();
  const cycleData = data.cycle || {
    averageCycleLength: 28,
    averagePeriodLength: 5,
    periods: [],
    dailyLogs: {}
  };

  const periods = (cycleData.periods || []).slice().sort((a, b) => b.startDate.localeCompare(a.startDate));
  const latestPeriod = periods[0];

  // Calculations for current cycle day and predicted next period
  let currentCycleDay: number | null = null;
  let nextPeriodDateStr: string | null = null;
  let daysUntilNextPeriod: number | null = null;
  let currentPhase: 'menstrual' | 'folicular' | 'ovulatoria' | 'lutea' = 'folicular';

  if (latestPeriod) {
    const startMs = new Date(latestPeriod.startDate + 'T00:00:00').getTime();
    const todayMs = new Date(todayStr + 'T00:00:00').getTime();
    const diffDays = Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays >= 1) {
      currentCycleDay = diffDays;
      const cycleLen = cycleData.averageCycleLength || 28;

      // Predicted next start
      const nextDate = new Date(startMs + cycleLen * 24 * 60 * 60 * 1000);
      nextPeriodDateStr = nextDate.toISOString().split('T')[0];
      daysUntilNextPeriod = Math.ceil((nextDate.getTime() - todayMs) / (1000 * 60 * 60 * 24));

      // Phase calculation
      const periodLen = cycleData.averagePeriodLength || 5;
      if (diffDays <= periodLen) {
        currentPhase = 'menstrual';
      } else if (diffDays <= 12) {
        currentPhase = 'folicular';
      } else if (diffDays <= 16) {
        currentPhase = 'ovulatoria';
      } else {
        currentPhase = 'lutea';
      }
    }
  }

  // Daily log state for today
  const todayLog = cycleData.dailyLogs?.[todayStr] || {
    date: todayStr,
    symptoms: [],
    mood: [],
    energyLevel: 3
  };

  const [isPeriodActiveToday, setIsPeriodActiveToday] = useState(
    todayLog.isPeriodDay ?? (currentPhase === 'menstrual')
  );
  const [selectedFlow, setSelectedFlow] = useState<FlowIntensity>(todayLog.flow || 'moderado');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(todayLog.symptoms || []);
  const [selectedMoods, setSelectedMoods] = useState<string[]>(todayLog.mood || []);
  const [energyLevel, setEnergyLevel] = useState<number>(todayLog.energyLevel || 3);
  const [dailyNotes, setDailyNotes] = useState<string>(todayLog.notes || '');

  // Modals
  const [isAddPeriodModalOpen, setIsAddPeriodModalOpen] = useState(false);
  const [newStartDate, setNewStartDate] = useState(todayStr);
  const [newEndDate, setNewEndDate] = useState('');
  const [newFlow, setNewFlow] = useState<FlowIntensity>('moderado');
  const [newNotes, setNewNotes] = useState('');

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [avgCycle, setAvgCycle] = useState(cycleData.averageCycleLength || 28);
  const [avgPeriod, setAvgPeriod] = useState(cycleData.averagePeriodLength || 5);

  const symptomOptions = [
    'Cólicas leves', 'Cólicas fortes', 'Dor lombar', 'Inchaço abdominal',
    'Sensibilidade nos seios', 'Dor de cabeça', 'Acne / Oleosidade',
    'Cansaço / Fadiga', 'Desejo de doces', 'Retenção de líquidos'
  ];

  const moodOptions = [
    'Tranquila & Em paz', 'Sensível / Emotiva', 'Criativa & Disposta',
    'Irritada / Impaciente', 'Introspectiva', 'Carinhosa',
    'Ansiosa', 'Focada & Confiante'
  ];

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) => 
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const toggleMood = (mood: string) => {
    setSelectedMoods((prev) => 
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  };

  const handleSaveDailyLog = (e: React.FormEvent) => {
    e.preventDefault();
    updateCycleDailyLog(todayStr, {
      isPeriodDay: isPeriodActiveToday,
      flow: isPeriodActiveToday ? selectedFlow : undefined,
      symptoms: selectedSymptoms,
      mood: selectedMoods,
      energyLevel,
      notes: dailyNotes.trim() || undefined
    });
  };

  const handleSavePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStartDate) return;

    addPeriod({
      startDate: newStartDate,
      endDate: newEndDate || undefined,
      flow: newFlow,
      notes: newNotes.trim() || undefined
    });

    setIsAddPeriodModalOpen(false);
    setNewStartDate(todayStr);
    setNewEndDate('');
    setNewNotes('');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateCycleSettings({
      averageCycleLength: Number(avgCycle) || 28,
      averagePeriodLength: Number(avgPeriod) || 5
    });
    setIsSettingsModalOpen(false);
  };

  // Phase metadata
  const phaseInfo = {
    menstrual: {
      name: 'Fase Menstrual',
      tagline: 'Momento de recolhimento, pausa e acolhimento',
      color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-900',
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
      description: 'Seus hormônios estão em níveis mais baixos. É hora de respeitar seu ritmo, descansar sem culpa e se envolver em calor e aconchego.',
      tips: [
        'Priorize chás quentinhos como camomila, erva-doce ou gengibre para aliviar cólicas.',
        'Faça refeições ricas em ferro (feijão, lentilhas, folhas verdes escuras).',
        'Alongamentos leves e descanso são melhores que treinos intensos agora.'
      ]
    },
    folicular: {
      name: 'Fase Folicular',
      tagline: 'Momento de renovação, energia em alta e novas ideias',
      color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      description: 'O estrogênio está subindo! Você se sente mais disposta, motivada e receptiva a começar novos projetos, estudos ou hábitos.',
      tips: [
        'Excelente momento para planejar metas da semana e iniciar novos desafios.',
        'Boa fase para treinos mais vigorosos e atividades sociais.',
        'Alimentos frescos, ricos em vitamina C e proteínas leves apoiam sua energia.'
      ]
    },
    ovulatoria: {
      name: 'Fase Ovulatória',
      tagline: 'Momento de brilho, vitalidade e magnetismo',
      color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-900',
      badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-200',
      description: 'Seu pico de fertilidade, confiança e comunicação. Sua energia atinge o auge e você se sente mais comunicativa e segura.',
      tips: [
        'Aproveite para conversas importantes, apresentações ou encontros especiais.',
        'Mantenha boa hidratação e priorize gorduras boas (abacate, azeite, castanhas).',
        'Sua força física está alta — aproveite essa vitalidade com leveza.'
      ]
    },
    lutea: {
      name: 'Fase Lútea / Pré-Menstrual',
      tagline: 'Momento de introspecção, auto-gentileza e limites saudáveis',
      color: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-900',
      badgeColor: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200',
      description: 'A progesterona domina. Seu corpo desacelera e suas emoções pedem mais paciência. Estabeleça limites gentis e não se cobre perfeição.',
      tips: [
        'Magnésio e chocolate 70% ajudam na TPM e na produção de serotonina.',
        'Evite excesso de sal para reduzir retenção de líquidos e inchaço.',
        'Respire fundo e proteja seu espaço mental de sobrecargas desnecessárias.'
      ]
    }
  };

  const activePhaseData = phaseInfo[currentPhase];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              Meu Ciclo & Bem-Estar Feminino
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Acompanhe sua menstruação, conheça suas fases e viva em paz com os ritmos do seu corpo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            title="Ajustar duração média do ciclo"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsAddPeriodModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Ciclo</span>
          </button>
        </div>
      </div>

      {/* Cycle Status Hero Card */}
      <div className={`p-6 rounded-3xl border shadow-xs transition-colors ${activePhaseData.color}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${activePhaseData.badgeColor}`}>
                {activePhaseData.name}
              </span>
              {currentCycleDay && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/70 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300">
                  Dia {currentCycleDay} do ciclo
                </span>
              )}
            </div>

            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              {activePhaseData.tagline}
            </h2>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              {activePhaseData.description}
            </p>
          </div>

          {/* Quick Metrics / Next Prediction */}
          <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-white/40 dark:border-stone-800 space-y-2 flex-shrink-0 min-w-[240px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Próxima Menstruação
            </span>
            {nextPeriodDateStr ? (
              <div>
                <p className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                  {formatDateToBrazilian(nextPeriodDateStr)}
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                  {daysUntilNextPeriod !== null && daysUntilNextPeriod > 0
                    ? `Previsão: daqui a ~${daysUntilNextPeriod} dias`
                    : daysUntilNextPeriod === 0
                    ? 'Previsto para hoje'
                    : 'Pode estar atrasada ou iniciando'}
                </p>
              </div>
            ) : (
              <p className="text-xs text-stone-500 italic">
                Cadastre sua última menstruação para prever a próxima.
              </p>
            )}

            {latestPeriod && (
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-500">
                Último início: {formatDateToBrazilian(latestPeriod.startDate)}
              </div>
            )}
          </div>
        </div>

        {/* Visual Cycle Phase Timeline */}
        <div className="mt-6 pt-4 border-t border-stone-200/60 dark:border-stone-800/60">
          <div className="grid grid-cols-4 gap-1.5 sm:gap-3 text-center">
            <div className={`p-2 sm:p-3 rounded-2xl transition ${currentPhase === 'menstrual' ? 'bg-white dark:bg-stone-800 shadow-xs ring-2 ring-rose-500' : 'opacity-60'}`}>
              <div className="flex items-center justify-center mb-1 text-rose-600">
                <Droplet className="w-4 h-4" />
              </div>
              <p className="text-[11px] sm:text-xs font-bold text-stone-800 dark:text-stone-200">1. Menstrual</p>
              <p className="text-[10px] text-stone-500">Dias 1-5</p>
            </div>

            <div className={`p-2 sm:p-3 rounded-2xl transition ${currentPhase === 'folicular' ? 'bg-white dark:bg-stone-800 shadow-xs ring-2 ring-emerald-500' : 'opacity-60'}`}>
              <div className="flex items-center justify-center mb-1 text-emerald-600">
                <Sun className="w-4 h-4" />
              </div>
              <p className="text-[11px] sm:text-xs font-bold text-stone-800 dark:text-stone-200">2. Folicular</p>
              <p className="text-[10px] text-stone-500">Dias 6-12</p>
            </div>

            <div className={`p-2 sm:p-3 rounded-2xl transition ${currentPhase === 'ovulatoria' ? 'bg-white dark:bg-stone-800 shadow-xs ring-2 ring-amber-500' : 'opacity-60'}`}>
              <div className="flex items-center justify-center mb-1 text-amber-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-[11px] sm:text-xs font-bold text-stone-800 dark:text-stone-200">3. Ovulatória</p>
              <p className="text-[10px] text-stone-500">Dias 13-16</p>
            </div>

            <div className={`p-2 sm:p-3 rounded-2xl transition ${currentPhase === 'lutea' ? 'bg-white dark:bg-stone-800 shadow-xs ring-2 ring-indigo-500' : 'opacity-60'}`}>
              <div className="flex items-center justify-center mb-1 text-indigo-600">
                <Moon className="w-4 h-4" />
              </div>
              <p className="text-[11px] sm:text-xs font-bold text-stone-800 dark:text-stone-200">4. Lútea (TPM)</p>
              <p className="text-[10px] text-stone-500">Dias 17-28</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Today's Check-in & Self-Care Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Symptom & Mood Logger */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100">
                Como você está se sentindo hoje?
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Registro diário de sintomas, humor e energia ({formatDateToBrazilian(todayStr)})
              </p>
            </div>
            <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300">
              <Heart className="w-4 h-4" />
            </span>
          </div>

          <form onSubmit={handleSaveDailyLog} className="space-y-4">
            {/* Period status toggle */}
            <div className="p-3.5 rounded-2xl bg-[#FBF9F5] dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200">
                  Está menstruada hoje?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPeriodActiveToday(true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      isPeriodActiveToday
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Sim 🩸
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPeriodActiveToday(false)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      !isPeriodActiveToday
                        ? 'bg-[#1F3A34] text-white shadow-xs'
                        : 'bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              {isPeriodActiveToday && (
                <div className="space-y-1.5 pt-2 border-t border-stone-200/60 dark:border-stone-700">
                  <label className="text-xs font-medium text-stone-600 dark:text-stone-300">
                    Intensidade do fluxo:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['spotting', 'leve', 'moderado', 'intenso'] as FlowIntensity[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setSelectedFlow(f)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-medium capitalize transition ${
                          selectedFlow === f
                            ? 'bg-rose-600 text-white font-semibold shadow-xs'
                            : 'bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-rose-50'
                        }`}
                      >
                        {f === 'spotting' ? 'Escasso' : f}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Energy Level Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-stone-700 dark:text-stone-300">
                  Nível de Disposição / Energia:
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {energyLevel === 1 && '😴 Muito baixa / Exausta'}
                  {energyLevel === 2 && '🥱 Baixa / Preciso desacelerar'}
                  {energyLevel === 3 && '🙂 Equilibrada'}
                  {energyLevel === 4 && '⚡ Boa disposição'}
                  {energyLevel === 5 && '✨ Energia radiante'}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={energyLevel}
                onChange={(e) => setEnergyLevel(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>

            {/* Physical Symptoms Multi-select */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-300">
                Sintomas físicos:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {symptomOptions.map((symp) => {
                  const isSelected = selectedSymptoms.includes(symp);
                  return (
                    <button
                      key={symp}
                      type="button"
                      onClick={() => toggleSymptom(symp)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        isSelected
                          ? 'bg-rose-100 dark:bg-rose-900/80 text-rose-900 dark:text-rose-100 font-semibold ring-1 ring-rose-400'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{symp}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mood Multi-select */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-300">
                Humor & Emoções:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {moodOptions.map((m) => {
                  const isSelected = selectedMoods.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMood(m)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        isSelected
                          ? 'bg-indigo-100 dark:bg-indigo-900/80 text-indigo-900 dark:text-indigo-100 font-semibold ring-1 ring-indigo-400'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{m}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily note */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Anotações do seu dia / Desabafo carinhoso:
              </label>
              <textarea
                value={dailyNotes}
                onChange={(e) => setDailyNotes(e.target.value)}
                placeholder="Como foi seu dia hoje? Algum sentimento especial ou cuidado que você dedicou a si mesma?"
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-xs sm:text-sm font-semibold transition shadow-xs flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Registro de Hoje</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Self-Care Tips For Current Phase */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
              <Coffee className="w-5 h-5 text-rose-600" />
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                Cuidados para a {activePhaseData.name}
              </h3>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-stone-600 dark:text-stone-300">
              {activePhaseData.tips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 flex-shrink-0" />
                  <p className="leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-xs text-rose-900 dark:text-rose-200">
              <p className="font-semibold mb-1">🌸 Lembrete carinhoso:</p>
              <p>
                Você não precisa produzir o tempo todo na mesma intensidade. As mulheres são cíclicas, assim como a lua e as estações.
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Configurações do Seu Ciclo
            </span>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-stone-600 dark:text-stone-400">Duração média do ciclo:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">{cycleData.averageCycleLength} dias</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-600 dark:text-stone-400">Duração média do fluxo:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">{cycleData.averagePeriodLength} dias</span>
            </div>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="w-full text-center text-xs text-rose-600 dark:text-rose-400 font-semibold pt-2 hover:underline"
            >
              Alterar médias personalizadas
            </button>
          </div>
        </div>
      </div>

      {/* Cycle History Section */}
      <div className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-rose-600" />
            <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100">
              Histórico de Menstruações
            </h3>
          </div>
          <span className="text-xs text-stone-400">{periods.length} ciclos registrados</span>
        </div>

        {periods.length > 0 ? (
          <div className="space-y-3">
            {periods.map((p) => {
              let durationDays: number | null = null;
              if (p.endDate) {
                const s = new Date(p.startDate + 'T00:00:00').getTime();
                const e = new Date(p.endDate + 'T00:00:00').getTime();
                durationDays = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
              }

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-stone-50/70 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                        {formatDateToBrazilian(p.startDate)}
                        {p.endDate ? ` até ${formatDateToBrazilian(p.endDate)}` : ' (em andamento)'}
                      </span>
                      {durationDays && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-medium">
                          {durationDays} dias de fluxo
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-stone-700 text-stone-600 dark:text-stone-300 capitalize">
                        Fluxo {p.flow}
                      </span>
                    </div>

                    {p.notes && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 italic">
                        "{p.notes}"
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm('Excluir este registro de ciclo?')) deletePeriod(p.id);
                    }}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-stone-400 italic py-6 text-center">
            Nenhum ciclo cadastrado ainda. Clique em "+ Registrar Ciclo" para iniciar o acompanhamento! 🌸
          </p>
        )}
      </div>

      {/* Modal: Add New Period */}
      {isAddPeriodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4 my-8 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-600" />
                <h3 className="font-serif text-lg font-bold">Registrar Menstruação</h3>
              </div>
              <button
                onClick={() => setIsAddPeriodModalOpen(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 bg-stone-100 dark:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePeriod} className="space-y-3.5 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  Data de início (1º dia de sangramento)
                </label>
                <input
                  type="date"
                  required
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  Data de término (opcional se ainda estiver menstruada)
                </label>
                <input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  Intensidade predominante do fluxo
                </label>
                <select
                  value={newFlow}
                  onChange={(e) => setNewFlow(e.target.value as FlowIntensity)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-500/50 capitalize"
                >
                  <option value="spotting">Escasso (Spotting)</option>
                  <option value="leve">Leve</option>
                  <option value="moderado">Moderado</option>
                  <option value="intenso">Intenso</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  Observações sobre este ciclo (opcional)
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ex: Cólica no 1º dia, fluxo desceu no horário esperado..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPeriodModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  Salvar Ciclo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cycle Settings */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4 my-8 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-serif text-lg font-bold">Personalizar Médias do Ciclo</h3>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 bg-stone-100 dark:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  Duração média do seu ciclo (dias)
                </label>
                <p className="text-[11px] text-stone-400">
                  Geralmente entre 26 e 32 dias (a média padrão é 28 dias).
                </p>
                <input
                  type="number"
                  min={20}
                  max={45}
                  required
                  value={avgCycle}
                  onChange={(e) => setAvgCycle(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  Duração média da menstruação (dias de fluxo)
                </label>
                <p className="text-[11px] text-stone-400">
                  Geralmente entre 3 e 7 dias (a média padrão é 5 dias).
                </p>
                <input
                  type="number"
                  min={2}
                  max={12}
                  required
                  value={avgPeriod}
                  onChange={(e) => setAvgPeriod(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold"
                >
                  Salvar Ajustes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
