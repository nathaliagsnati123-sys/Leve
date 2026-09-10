import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Brain, 
  Calendar, 
  Heart, 
  Bot, 
  ShieldCheck, 
  X,
  Compass
} from 'lucide-react';

interface TourStep {
  badge: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  highlightText?: string;
}

export const AppTourModal: React.FC = () => {
  const { isTourOpen, setIsTourOpen, data } = useApp();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isTourOpen) return null;

  const steps: TourStep[] = [
    {
      badge: 'Passo 1 de 5 • Rotina',
      icon: <Calendar className="w-8 h-8 text-emerald-700 dark:text-emerald-300" />,
      title: 'Seu Dia com Serenidade',
      subtitle: 'Um dia de cada vez, sem sobrecarga ou culpa.',
      description: 'Na tela "Meu Dia", você visualiza suas tarefas principais, hábitos e blocos de tempo organizados por período (manhã, tarde e noite). Sem pressa e no seu ritmo.',
      highlightText: 'Dica: Conclua apenas o essencial hoje e durma com a mente tranquila.'
    },
    {
      badge: 'Passo 2 de 5 • Alívio Mental',
      icon: <Brain className="w-8 h-8 text-emerald-700 dark:text-emerald-300" />,
      title: 'Tirar da Cabeça',
      subtitle: 'Sua vida não precisa ficar toda nos seus pensamentos.',
      description: 'Sempre que sua mente estiver confusa ou cheia de pendências, clique no botão "Tirar da Cabeça". Despeje tudo o que estiver pensando e a LEVIA ajuda a transformar o caos em passos simples.',
      highlightText: 'Disponível no topo do app a qualquer momento.'
    },
    {
      badge: 'Passo 3 de 5 • Bem-Estar',
      icon: <Heart className="w-8 h-8 text-emerald-700 dark:text-emerald-300" />,
      title: 'Cuidado Integral',
      subtitle: 'Cuidar de você não é obrigação, é carinho.',
      description: 'Acompanhe água, sono, alimentação, ciclo, espiritualidade e momentos de autocuidado. Registros intuitivos e acolhedores, sem cobrança de metas perfeitas.',
      highlightText: 'Pequenas pausas fazem uma diferença imensa na sua paz diária.'
    },
    {
      badge: 'Passo 4 de 5 • Inteligência Acolhedora',
      icon: <Bot className="w-8 h-8 text-emerald-700 dark:text-emerald-300" />,
      title: 'Sua Assistente LEVIA',
      subtitle: 'Escuta afetuosa e clareza para seus dias.',
      description: 'A LEVIA é sua aliada de inteligência artificial com tom acolhedor. Converse com ela para planejar sua semana, desabafar com privacidade ou receber conselhos serenos.',
      highlightText: 'Sempre pronta para te ouvir com calma e empatia.'
    },
    {
      badge: 'Passo 5 de 5 • Seu Espaço',
      icon: <ShieldCheck className="w-8 h-8 text-emerald-700 dark:text-emerald-300" />,
      title: 'Seu Espaço Pessoal e Seguro',
      subtitle: 'Personalizado para ser exatamente como você deseja.',
      description: `Seu nome de preferência${data.user?.name ? ` (${data.user.name})` : ''}, seu ícone de perfil e sua forma de tratamento escolhida ficam salvos de forma permanente até que você decida alterá-los.`,
      highlightText: 'Você pode rever este tour quando quiser através das Configurações.'
    }
  ];

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    try {
      localStorage.setItem('leve_completed_tour', 'true');
    } catch {}
    setIsTourOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-modal-title"
        className="relative w-full max-w-lg bg-white dark:bg-[#18221D] rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col transition-all"
      >
        {/* Subtle decorative top aura */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent pointer-events-none" />

        {/* Top bar with close */}
        <div className="relative z-10 px-6 pt-5 pb-2 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/60 dark:border-emerald-800/60">
            <Compass className="w-3.5 h-3.5" />
            <span>{step.badge}</span>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            title="Pular tour"
            aria-label="Pular tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="relative z-10 px-6 sm:px-8 py-5 flex-1 flex flex-col items-center text-center space-y-4">
          {/* Icon frame */}
          <div className="w-18 h-18 rounded-3xl bg-emerald-100/70 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-center shadow-xs">
            {step.icon}
          </div>

          <div className="space-y-1.5 max-w-md">
            <h2 id="tour-modal-title" className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
              {step.title}
            </h2>
            <p className="text-xs sm:text-sm font-medium text-emerald-800 dark:text-emerald-400 italic font-serif">
              “{step.subtitle}”
            </p>
          </div>

          <p className="text-stone-600 dark:text-stone-300 text-xs sm:text-sm leading-relaxed max-w-md">
            {step.description}
          </p>

          {step.highlightText && (
            <div className="w-full max-w-md p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 text-stone-500 dark:text-stone-400 text-xs text-center">
              <span>{step.highlightText}</span>
            </div>
          )}
        </div>

        {/* Bottom controls & navigation */}
        <div className="relative z-10 px-6 sm:px-8 py-4 bg-stone-50/70 dark:bg-[#141C18]/70 border-t border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStep 
                    ? 'w-7 bg-[#1F3A34] dark:bg-emerald-400' 
                    : 'w-2 bg-stone-300 dark:bg-stone-700 hover:bg-stone-400'
                }`}
                title={`Ir para passo ${idx + 1}`}
                aria-label={`Ir para passo ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>Começar a usar o LEVE ✨</span>
                </>
              ) : (
                <>
                  <span>Próximo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
