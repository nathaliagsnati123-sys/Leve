import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { X, Sparkles, Send, RefreshCw, Feather, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { getComfortResponseLocally } from '../../utils/comfortResponses';

interface ReflectionResponse {
  mensagem: string;
  sugestao: string;
}

export const BrainDumpModal: React.FC = () => {
  const { isBrainDumpOpen, setIsBrainDumpOpen, data } = useApp();
  const { user } = useAuth();
  
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ReflectionResponse | null>(null);

  if (!isBrainDumpOpen) return null;

  const handleClose = () => {
    setIsBrainDumpOpen(false);
    setText('');
    setResponse(null);
    setIsLoading(false);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isLoading) return;

    setIsLoading(true);

    try {
      // 1. Tenta chamar o endpoint de acolhimento do backend com IA
      const res = await fetch('/api/tirar-da-cabeca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          treatmentPreference: data.user.treatmentPreference || 'nao_informar',
          userName: data.user.name || ''
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.mensagem && json.sugestao) {
          setResponse({
            mensagem: json.mensagem,
            sugestao: json.sugestao
          });
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Backend inacessível ou offline -> usa motor de acolhimento local imediato
    }

    // Fallback inteligente imediato sem depender de APIs externas
    const local = getComfortResponseLocally(
      text.trim(),
      data.user.treatmentPreference || 'nao_informar',
      data.user.name
    );
    setResponse(local);
    setIsLoading(false);
  };

  const handleWriteAnother = () => {
    setText('');
    setResponse(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-2xl p-5 sm:p-7 space-y-5 my-8 transition-colors">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs">
              <Feather className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
                Tirar da Cabeça
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                Coloque aqui o que está pesando.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* State 1: Input form */}
        {!response && (
          <form onSubmit={handleSend} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-stone-50/80 dark:bg-stone-850/60 border border-stone-200/70 dark:border-stone-800 text-stone-600 dark:text-stone-300 text-xs sm:text-sm leading-relaxed flex items-center gap-2.5">
              <span className="text-base">🌿</span>
              <p className="font-serif italic text-stone-700 dark:text-stone-300">
                “Você não precisa organizar. Apenas escreva.”
              </p>
            </div>

            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                autoFocus
                placeholder="Escreva livremente tudo o que está passando pela sua mente agora... Seus pensamentos, cansaço, dúvidas ou o que quer que esteja pesando."
                className="w-full p-4 rounded-2xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/30 text-stone-900 dark:text-stone-100 text-sm leading-relaxed resize-none shadow-2xs placeholder:text-stone-400"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-stone-400 dark:text-stone-500">
                Espaço confidencial de desabafo e alívio
              </span>

              <button
                type="submit"
                disabled={!text.trim() || isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F3A34] hover:bg-[#162924] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                    <span>Acolhendo seus pensamentos...</span>
                  </>
                ) : (
                  <>
                    <span>Tirar da cabeça</span>
                    <Send className="w-3.5 h-3.5 text-emerald-300" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* State 2: Empathetic response (comfort message + small suggestion) */}
        {response && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
            {/* 🌿 Uma mensagem para você */}
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                <span className="text-base">🌿</span>
                <span className="uppercase tracking-wider">Uma mensagem para você</span>
              </div>
              <p className="font-serif text-sm sm:text-base text-stone-800 dark:text-stone-100 leading-relaxed">
                {response.mensagem}
              </p>
            </div>

            {/* 💡 Uma pequena sugestão */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-300">
                <span className="text-base">💡</span>
                <span className="uppercase tracking-wider">Uma pequena sugestão</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                {response.sugestao}
              </p>
            </div>

            {/* Bottom actions */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleWriteAnother}
                className="w-full sm:w-auto text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 py-2 px-3 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer text-center"
              >
                Escrever mais um pouco
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F3A34] hover:bg-[#162924] text-white text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Respirar e guardar</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
