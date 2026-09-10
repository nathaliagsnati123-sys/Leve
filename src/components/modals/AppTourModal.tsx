import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, Sun, Droplets, Heart, Target, Bot, ArrowRight, ArrowLeft, Check, X 
} from 'lucide-react';

interface TourStep {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  tag: string;
  tabKey?: string;
}

export const AppTourModal: React.FC = () => {
  const { isTourOpen, setIsTourOpen, data, setActiveTab, showToast } = useApp();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isTourOpen) return null;

  const tourSteps: TourStep[] = [
    {
      title: 'Meu Dia & Foco Sereno',
      subtitle: 'Sua rotina diária em ordem, sem peso',
      description: 'Defina suas tarefas com prioridades leves, registre intenções matinais e use o botão "Descarrego Mental" sempre que a cabeça estiver cheia de pensamentos soltos.',
      icon: <Sun className="w-8 h-8 text-amber-500" />,
      tag: 'Central Diária',
      tabKey: 'my-day'
    },
    {
      title: 'Hábitos, Água & Autocuidado',
      subtitle: 'Pequenos passos constantes',
      description: 'Monitore sua hidratação com um simples toque, registre hábitos saudáveis, ciclos femininos, refeições e sono de maneira acolhedora e sem cobranças punitivas.',
      icon: <Droplets className="w-8 h-8 text-sky-500" />,
      tag: 'Bem-estar Integral',
      tabKey: 'habits'
    },
    {
      title: 'Espiritualidade & Gratidão',
      subtitle: 'Nutrindo a alma todos os dias',
      description: 'Tenha um refúgio para suas orações, reflexões do diário, versículos inspiradores e a experiência guiada de "5 Minutos com Deus" para encontrar paz.',
      icon: <Heart className="w-8 h-8 text-rose-400" />,
      tag: 'Serenidade & Fé',
      tabKey: 'spirituality'
    },
    {
      title: 'Metas & Minha Vida',
      subtitle: 'Seus sonhos organizados em passos reais',
      description: 'Estruture seus grandes objetivos em etapas simples e mantenha uma lista carinhosa dos livros que quer ler, filmes, séries, hobbies e sonhos futuros.',
      icon: <Target className="w-8 h-8 text-emerald-600" />,
      tag: 'Propósito & Lazer',
      tabKey: 'my-life'
    },
    {
      title: 'LEVIA: Sua Assistente de Leveza',
      subtitle: 'Inteligência e acolhimento sempre à mão',
      description: 'Descarregue áudios ou textos com a LEVIA. Ela ajuda você a organizar pendências, desatar nós mentais e transformar confusão em tarefas simples e práticas.',
      icon: <Bot className="w-8 h-8 text-teal-600" />,
      tag: 'Apoio Inteligente',
      tabKey: 'lia'
    }
  ];

  const currentStep = tourSteps[currentStepIndex];
  const isLast = currentStepIndex === tourSteps.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      if (tourSteps[nextIndex].tabKey) {
        setActiveTab(tourSteps[nextIndex].tabKey as any);
      }
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      if (tourSteps[prevIndex].tabKey) {
        setActiveTab(tourSteps[prevIndex].tabKey as any);
      }
    }
  };

  const handleFinish = () => {
    setIsTourOpen(false);
    setActiveTab('my-day');
    const userName = data.user.name ? `, ${data.user.name}` : '';
    showToast(`Tour concluído! Aproveite o LEVE${userName}. 🌿`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header with tag & close button */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              {currentStep.tag}
            </span>
            <span className="text-xs text-stone-400 dark:text-stone-500 font-medium">
              {currentStepIndex + 1} de {tourSteps.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            title="Fechar tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 text-center">
          {/* Icon Circle */}
          <div className="w-20 h-20 rounded-3xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-center mx-auto shadow-inner">
            {currentStep.icon}
          </div>

          {/* Titles & Descriptions */}
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
              {currentStep.title}
            </h3>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
              {currentStep.subtitle}
            </p>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed pt-1">
              {currentStep.description}
            </p>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {tourSteps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentStepIndex(idx);
                  if (tourSteps[idx].tabKey) {
                    setActiveTab(tourSteps[idx].tabKey as any);
                  }
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-7 bg-[#1F3A34] dark:bg-emerald-400'
                    : 'w-2 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300'
                }`}
                title={`Ir para passo ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between gap-3 px-6 pb-6 pt-2 bg-stone-50/60 dark:bg-stone-900/60 border-t border-stone-100 dark:border-stone-800/60">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
              currentStepIndex === 0
                ? 'opacity-30 cursor-not-allowed text-stone-400'
                : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-stone-800 cursor-pointer'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Anterior</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-xs sm:text-sm transition shadow-sm cursor-pointer"
          >
            {isLast ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Começar a Usar</span>
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
  );
};
