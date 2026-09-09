import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Check, Sparkles, Feather, Heart, Smile } from 'lucide-react';
import { TreatmentPreference } from '../../types';
import { TREATMENT_OPTIONS } from '../../utils/treatment';

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen, updateUser, data } = useApp();
  const { user, updateTreatmentPreference } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(data.user.avatar || '🌿');
  const [treatmentPreference, setTreatmentPreference] = useState<TreatmentPreference>(
    data.user.treatmentPreference || 'nao_informar'
  );

  if (!isOnboardingOpen) return null;

  const avatars = ['🌿', '🌸', '✨', '🕊️', '☀️', '🪴', '☕', '🌻'];

  const handleFinish = () => {
    updateUser({
      name: name.trim(),
      avatar,
      treatmentPreference,
      hasCompletedOnboarding: true
    });
    if (user) {
      updateTreatmentPreference(treatmentPreference);
    }
    setIsOnboardingOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F9FAF8]/95 dark:bg-[#121815]/95 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-2xl p-6 sm:p-8 space-y-6 text-center text-stone-900 dark:text-stone-100">
        {/* Step 1 */}
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
              <p className="text-xs text-stone-400 max-w-xs mx-auto pt-2">
                Uma central pessoal para organizar a sua vida e cuidar do que realmente importa.
              </p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 px-6 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <span>Conhecer o LEVE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto text-3xl">
              🧠
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold">
                Sua mente livre
              </h2>
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 font-medium">
                Sua vida não precisa ficar toda na sua cabeça.
              </p>
              <p className="text-xs text-stone-400 max-w-xs mx-auto pt-2 leading-relaxed">
                Descarregue tarefas, anotações, compromissos e pendências em um só lugar seguro e sereno.
              </p>
            </div>
            <button
              onClick={() => setStep(3)}
              className="w-full py-3 px-6 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center mx-auto text-3xl">
              🌱
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold">
                Cuidado integral
              </h2>
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 font-medium">
                Organize. Cuide. Reflita. Viva.
              </p>
              <p className="text-xs text-stone-400 max-w-xs mx-auto pt-2 leading-relaxed">
                Água, hábitos, sono, espiritualidade, alimentação e gratidão. Sem culpa, sem pressão.
              </p>
            </div>
            <button
              onClick={() => setStep(4)}
              className="w-full py-3 px-6 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <span>Vamos começar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-bold">
                Vamos deixar sua vida mais leve?
              </h2>
              <p className="text-xs text-stone-500">
                Como podemos chamar você no seu dia a dia?
              </p>
            </div>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">
                  Como prefere ser chamado(a)?
                </label>
                <input
                  type="text"
                  value={name}
                  autoFocus
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome ou apelido carinhoso"
                  className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">
                  Preferência de tratamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TREATMENT_OPTIONS.map((opt) => {
                    const isSelected = treatmentPreference === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTreatmentPreference(opt.id)}
                        className={`py-2 px-1.5 rounded-xl border text-xs font-medium transition cursor-pointer text-center ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-950 dark:text-emerald-100 font-semibold ring-1 ring-emerald-600/30'
                            : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750'
                        }`}
                      >
                        <span className="block truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">
                  Respeitamos sua preferência nas mensagens e com a LEVIA.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">
                  Escolha um ícone para seu perfil
                </label>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {avatars.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`w-9 h-9 rounded-2xl text-lg flex items-center justify-center transition cursor-pointer ${
                        avatar === av
                          ? 'bg-emerald-100 dark:bg-emerald-950 ring-2 ring-emerald-600 scale-105'
                          : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Entrar no meu LEVE</span>
            </button>
          </div>
        )}

        {/* Step indicator dots */}
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {[1, 2, 3, 4].map((s) => (
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
