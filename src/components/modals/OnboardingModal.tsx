import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowRight, Check, Sparkles, Feather, Heart, Smile } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen, updateUser, data } = useApp();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(data.user.avatar || '🌿');

  if (!isOnboardingOpen) return null;

  const avatars = ['🌿', '🌸', '✨', '🕊️', '☀️', '🪴', '☕', '🌻'];

  const handleFinish = () => {
    updateUser({
      name: name.trim(),
      avatar,
      hasCompletedOnboarding: true
    });
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

            <div className="space-y-3 text-left">
              <input
                type="text"
                value={name}
                autoFocus
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome ou apelido carinhoso"
                className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
              />

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-2">
                  Escolha um ícone para seu perfil
                </label>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {avatars.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`w-10 h-10 rounded-2xl text-xl flex items-center justify-center transition ${
                        avatar === av
                          ? 'bg-emerald-100 dark:bg-emerald-950 ring-2 ring-emerald-600 scale-110'
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
