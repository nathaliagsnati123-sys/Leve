import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, ArrowRight, Check, Heart, Feather, Sparkles, Shield, BookOpen, Compass, Target } from 'lucide-react';
import { SCRIPTURE_VERSES } from '../../services/quotesAndVerses';
import { getTodayDateString } from '../../services/storage';
import { normalizeTreatmentPreference, adaptTextToGender } from '../../utils/treatment';

export const FiveMinuteGodModal: React.FC = () => {
  const { isFiveMinGodOpen, setIsFiveMinGodOpen, saveFiveMinuteSession, data } = useApp();
  const [step, setStep] = useState(1);
  const [gratitude, setGratitude] = useState('');
  const [surrender, setSurrender] = useState('');
  const [petition, setPetition] = useState('');
  const [reflection, setReflection] = useState('');

  const pref = normalizeTreatmentPreference(data.user?.treatmentPreference);

  // Daily verse picker based on date
  const dayIndex = new Date().getDate() % SCRIPTURE_VERSES.length;
  const rawVerse = SCRIPTURE_VERSES[dayIndex];
  const currentVerse = {
    ...rawVerse,
    verse: adaptTextToGender(rawVerse.verse, pref),
    reflection: adaptTextToGender(rawVerse.reflection, pref)
  };

  if (!isFiveMinGodOpen) return null;

  const handleFinish = () => {
    saveFiveMinuteSession({
      date: getTodayDateString(),
      gratitude,
      surrender,
      petition,
      scriptureReference: `${currentVerse.reference} - "${currentVerse.verse}"`,
      reflection
    });
    handleClose();
  };

  const handleClose = () => {
    setIsFiveMinGodOpen(false);
    setStep(1);
    setGratitude('');
    setSurrender('');
    setPetition('');
    setReflection('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-8 space-y-6 text-stone-900 dark:text-stone-100">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            <span>{pref === 'masculino' ? '5 Minutos com Deus • Oração & Foco' : '5 Minutos com Deus'}</span>
            <span>•</span>
            <span>Etapa {step} de 5</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 bg-stone-100 dark:bg-stone-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Silêncio */}
        {step === 1 && (
          <div className="space-y-6 text-center py-4 animate-in fade-in">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto text-3xl ${
              pref === 'masculino'
                ? 'bg-stone-100 dark:bg-stone-800 text-emerald-600 dark:text-emerald-400'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
            }`}>
              {pref === 'masculino' ? <Shield className="w-8 h-8" /> : '🕊️'}
            </div>
            <div className="space-y-2 max-w-sm mx-auto">
              <h3 className="font-serif text-2xl font-bold">
                {pref === 'masculino' ? '1 — Silêncio e Postura' : '1 — Silêncio interior'}
              </h3>
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed font-serif italic">
                {pref === 'masculino'
                  ? '"Respire fundo. Desconecte dos ruídos e distrações para centrar sua mente diante de Deus."'
                  : '"Respire fundo. Desacelere o coração e silencie o que está ao seu redor por alguns segundos."'}
              </p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 rounded-full bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-sm transition flex items-center gap-2 mx-auto cursor-pointer"
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Gratidão */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2">
              {pref === 'masculino' ? (
                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <span className="text-2xl">🤍</span>
              )}
              <h3 className="font-serif text-xl font-bold">
                {pref === 'masculino' ? '2 — Gratidão e Reconhecimento' : '2 — Gratidão'}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
              {pref === 'masculino'
                ? 'Pelo que você é grato a Deus hoje? Reconheça suas conquistas e provisão.'
                : 'Por quais coisas você gostaria de agradecer a Deus hoje?'}
            </p>
            <textarea
              rows={4}
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              placeholder={
                pref === 'masculino'
                  ? 'Pela saúde, força para trabalhar, superação de desafios e proteção da família...'
                  : 'Agradeço pela minha vida, pelo pão de cada dia, por superar um momento difícil...'
              }
              className="w-full p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50 resize-none"
            />
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setStep(1)}
                className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-full bg-[#1F3A34] text-white hover:bg-[#162A25] font-medium text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span>Próximo passo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Entrega */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2">
              {pref === 'masculino' ? (
                <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <span className="text-2xl">🙏</span>
              )}
              <h3 className="font-serif text-xl font-bold">
                {pref === 'masculino' ? '3 — Entrega e Alívio de Cargas' : '3 — Entrega'}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
              {pref === 'masculino'
                ? 'Quais cobranças, incertezas ou pressões você entrega nas mãos de Deus agora?'
                : 'O que você gostaria de entregar a Deus hoje? Preocupações, pesos ou incertezas?'}
            </p>
            <textarea
              rows={4}
              value={surrender}
              onChange={(e) => setSurrender(e.target.value)}
              placeholder={
                pref === 'masculino'
                  ? 'Entrego as incertezas financeiras, a pressão por resultados e o cansaço mental...'
                  : 'Entrego a ansiedade com o trabalho, o medo de errar, a saúde de quem amo...'
              }
              className="w-full p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50 resize-none"
            />
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setStep(2)}
                className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-5 py-2.5 rounded-full bg-[#1F3A34] text-white hover:bg-[#162A25] font-medium text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span>Próximo passo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Pedido */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2">
              {pref === 'masculino' ? (
                <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <span className="text-2xl">🌱</span>
              )}
              <h3 className="font-serif text-xl font-bold">
                {pref === 'masculino' ? '4 — Direcionamento e Pedido' : '4 — Pedido'}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
              {pref === 'masculino'
                ? 'O que você pede a Deus para conduzir suas batalhas com honra e firmeza?'
                : 'Existe algo que você gostaria de pedir a Deus com humildade de coração?'}
            </p>
            <textarea
              rows={4}
              value={petition}
              onChange={(e) => setPetition(e.target.value)}
              placeholder={
                pref === 'masculino'
                  ? 'Peço sabedoria nas decisões, disciplina diária, força moral, paciência e retidão...'
                  : 'Peço sabedoria, paz no lar, clareza para tomar decisões e paciência...'
              }
              className="w-full p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50 resize-none"
            />
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setStep(3)}
                className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(5)}
                className="px-5 py-2.5 rounded-full bg-[#1F3A34] text-white hover:bg-[#162A25] font-medium text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span>Próximo passo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Reflexão */}
        {step === 5 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2">
              {pref === 'masculino' ? (
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <span className="text-2xl">📖</span>
              )}
              <h3 className="font-serif text-xl font-bold">5 — Reflexão na Palavra</h3>
            </div>
            
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 dark:text-emerald-400">
                {currentVerse.reference}
              </span>
              <p className="font-serif italic text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
                "{currentVerse.verse}"
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-400 pt-1">
                {currentVerse.reflection}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300">
                {pref === 'masculino'
                  ? 'Como você aplica esse princípio prático no seu dia?'
                  : 'O que essa mensagem significa para você hoje?'}
              </label>
              <textarea
                rows={3}
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder={
                  pref === 'masculino'
                    ? 'Manter a constância, agir com retidão e não me desviar do meu propósito...'
                    : 'Essa mensagem me lembra que posso respirar com calma e descansar...'
                }
                className="w-full p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50 resize-none"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setStep(4)}
                className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleFinish}
                className="px-6 py-2.5 rounded-full bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer"
              >
                {pref === 'masculino' ? (
                  <>
                    <Shield className="w-4 h-4 text-emerald-300" />
                    <span>Concluir Oração & Foco</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                    <span>Concluir meu momento</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <span
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? 'w-6 bg-emerald-700' : 'w-1.5 bg-stone-200 dark:bg-stone-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
