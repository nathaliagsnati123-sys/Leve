import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowRight, ArrowLeft, Sparkles, User, HeartHandshake, Smile
} from 'lucide-react';
import { TreatmentPreference } from '../../types';
import { TREATMENT_OPTIONS, normalizeTreatmentPreference } from '../../utils/treatment';
import { trackPixelEvent } from '../../utils/pixel';
import { 
  isPresentationAlreadyCompleted, markPresentationCompleted, 
  saveUserIdentity 
} from '../../services/storage';

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen, updateUser, data, showToast } = useApp();

  const presentationAlreadyDone = isPresentationAlreadyCompleted();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Estados de personalização (sem email e sem senha)
  const [name, setName] = useState(data.user.name || '');
  const [avatar, setAvatar] = useState(data.user.avatar || '🌿');
  const [treatmentPreference, setTreatmentPreference] = useState<TreatmentPreference>(() => {
    return normalizeTreatmentPreference(data.user.treatmentPreference || 'feminino');
  });

  if (!isOnboardingOpen || presentationAlreadyDone) return null;

  const avatarOptions = ['🌿', '🌸', '✨', '🕊️', '☀️', '🪴', '☕', '🌻', '🧘‍♀️', '🌊', '📖', '🤍'];

  // Concluir personalização e começar no LEVE
  const handleFinishOnboarding = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanName = name.trim();
    markPresentationCompleted();

    // Track Pixel
    trackPixelEvent('CompleteRegistration');

    saveUserIdentity({
      name: cleanName,
      avatar,
      treatmentPreference,
      hasCompletedOnboarding: true
    });

    updateUser({
      name: cleanName,
      avatar,
      treatmentPreference,
      hasCompletedOnboarding: true
    });

    setIsOnboardingOpen(false);
    showToast(cleanName ? `Boas-vindas ao LEVE, ${cleanName}! ✨` : 'Boas-vindas ao LEVE! ✨', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F9FAF8]/95 dark:bg-[#121815]/95 backdrop-blur-md p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-2xl p-6 sm:p-8 space-y-6 text-center text-stone-900 dark:text-stone-100 my-auto">
        
        {/* Step 1: Apresentação - Boas-vindas */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-[#1F3A34] text-emerald-100 flex items-center justify-center mx-auto shadow-md">
              <span className="font-serif italic text-3xl">L</span>
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold">
                Bem-vinda ao LEVE
              </h2>
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 font-medium">
                Tire da cabeça. Coloque em ordem.
              </p>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto pt-2 leading-relaxed">
                Uma central pessoal e acolhedora para organizar a sua rotina, cuidar da mente e focar no que realmente importa.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span>Conhecer o LEVE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Apresentação - Sua mente livre */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mx-auto text-3xl shadow-xs">
              🧠
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold">
                Sua mente livre
              </h2>
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 font-medium">
                Sua vida não precisa ficar toda na sua cabeça.
              </p>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto pt-2 leading-relaxed">
                Descarregue tarefas, anotações, compromissos e pendências em um só lugar seguro, sem ruído e sereno.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-semibold transition cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Apresentação - Cuidado integral */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 flex items-center justify-center mx-auto text-3xl shadow-xs">
              🌱
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold">
                Cuidado integral
              </h2>
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 font-medium">
                Organize. Cuide. Reflita. Viva.
              </p>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto pt-2 leading-relaxed">
                Água, hábitos, sono, espiritualidade, alimentação e gratidão. Um ritmo leve, no seu tempo e sem pressão.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3 px-4 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-semibold transition cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Apresentação - Conheça a LEVIA */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 flex items-center justify-center mx-auto text-3xl shadow-xs">
              ✨
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-900/60 text-[11px] font-semibold text-amber-800 dark:text-amber-300 mb-1">
                <span>Inteligência & Acolhimento</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold">
                Conheça a LEVIA
              </h2>
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 font-medium italic">
                “Você fala. A LEVIA organiza.”
              </p>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto pt-2 leading-relaxed">
                Sua assistente inteligente para tirar as pendências da cabeça. Conte tarefas, compromissos ou desabafe em linguagem natural — a LEVIA estrutura tudo e respeita o seu tempo.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="py-3 px-4 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-semibold transition cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span>Personalizar & Começar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Personalização Simples e Direta (SEM email e SEM senha) */}
        {step === 5 && (
          <form onSubmit={handleFinishOnboarding} className="space-y-5 text-left animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mx-auto text-2xl mb-2">
                🌸
              </div>
              <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
                Personalize seu LEVE
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                Deixe o aplicativo com o seu jeito para uma rotina mais acolhedora.
              </p>
            </div>

            {/* 1. Nome */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Seu Nome
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como gostaria de ser chamada?"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                />
              </div>
            </div>

            {/* 2. Tratamento */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Como prefere que o LEVE fale com você?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TREATMENT_OPTIONS.map((opt) => {
                  const isSel = treatmentPreference === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTreatmentPreference(opt.id)}
                      className={`py-2 px-2 rounded-xl text-center border transition cursor-pointer flex items-center justify-center ${
                        isSel
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-600/30'
                          : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      <span className="text-xs font-semibold">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Avatar */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Escolha seu símbolo
              </label>
              <div className="flex flex-wrap gap-2 justify-center p-2 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                {avatarOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAvatar(opt)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition cursor-pointer ${
                      avatar === opt
                        ? 'bg-white dark:bg-stone-700 border-2 border-emerald-600 shadow-xs scale-110'
                        : 'hover:bg-stone-200/50 dark:hover:bg-stone-700/50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Botão de Conclusão */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>Começar a Usar o LEVE</span>
              </button>
            </div>
          </form>
        )}

        {/* Step indicator dots */}
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <span
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? 'w-6 bg-[#1F3A34] dark:bg-emerald-400' : 'w-1.5 bg-stone-200 dark:bg-stone-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
