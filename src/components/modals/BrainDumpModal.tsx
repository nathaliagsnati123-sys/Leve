import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Brain, ArrowRight, Check, Plus, Sparkles } from 'lucide-react';
import { getTodayDateString } from '../../services/storage';
import { Priority, TaskCategory } from '../../types';

export const BrainDumpModal: React.FC = () => {
  const { isBrainDumpOpen, setIsBrainDumpOpen, addTask, showToast } = useApp();
  const [rawText, setRawText] = useState('');
  const [parsedItems, setParsedItems] = useState<{ text: string; category: TaskCategory; priority: Priority; added: boolean }[]>([]);

  if (!isBrainDumpOpen) return null;

  const handleProcessText = () => {
    if (!rawText.trim()) return;

    // Split by newlines, bullets, or multiple spaces/commas
    const lines = rawText
      .split(/\n|,|;/)
      .map((l) => l.replace(/^[-•*]\s*/, '').trim())
      .filter((l) => l.length > 1);

    if (lines.length === 0) return;

    setParsedItems(
      lines.map((text) => {
        // Smart category detection based on keywords
        let category: TaskCategory = 'Pessoal';
        const lower = text.toLowerCase();
        if (lower.includes('estud') || lower.includes('aula') || lower.includes('livro') || lower.includes('curso')) category = 'Estudos';
        else if (lower.includes('trabalh') || lower.includes('reun') || lower.includes('email') || lower.includes('relat')) category = 'Trabalho';
        else if (lower.includes('compr') || lower.includes('mercad') || lower.includes('limp') || lower.includes('quarto') || lower.includes('casa')) category = 'Casa';
        else if (lower.includes('medic') || lower.includes('dentist') || lower.includes('caminh') || lower.includes('trein') || lower.includes('remedi')) category = 'Saúde';
        else if (lower.includes('pag') || lower.includes('cont') || lower.includes('banco') || lower.includes('fatur')) category = 'Financeiro';

        return {
          text,
          category,
          priority: 'medium',
          added: false
        };
      })
    );
  };

  const handleAddSingleItem = (index: number) => {
    const item = parsedItems[index];
    if (item.added) return;

    addTask({
      title: item.text,
      date: getTodayDateString(),
      priority: item.priority,
      category: item.category,
      repeat: 'none'
    });

    setParsedItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, added: true } : it))
    );
  };

  const handleAddAllItems = () => {
    const toAdd = parsedItems.filter((it) => !it.added);
    toAdd.forEach((item) => {
      addTask({
        title: item.text,
        date: getTodayDateString(),
        priority: item.priority,
        category: item.category,
        repeat: 'none'
      });
    });

    setParsedItems((prev) => prev.map((it) => ({ ...it, added: true })));
    showToast(`Todas as ${toAdd.length} pendências foram transformadas em tarefas! ✨`);
  };

  const handleClose = () => {
    setIsBrainDumpOpen(false);
    setRawText('');
    setParsedItems([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-5 sm:p-7 space-y-5 my-8">
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
                Tirar da Cabeça
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                Coloque aqui tudo o que está ocupando espaço na sua mente.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 bg-stone-100 dark:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={5}
            placeholder="Exemplo: Preciso estudar pro teste, comprar presente da mãe, pagar a conta de luz, marcar dentista, arrumar meu quarto e responder mensagem da Julia..."
            className="w-full p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50 leading-relaxed resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-stone-400">
              Escreva livremente. Separe por linhas ou vírgulas.
            </span>
            <button
              onClick={handleProcessText}
              disabled={!rawText.trim()}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-[#1F3A34] text-white hover:bg-[#162A25] disabled:opacity-40 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Organizar pensamentos</span>
            </button>
          </div>
        </div>

        {/* Parsed Items List */}
        {parsedItems.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Transformar em tarefas ({parsedItems.filter((i) => !i.added).length} restantes)
              </span>
              {parsedItems.some((i) => !i.added) && (
                <button
                  onClick={handleAddAllItems}
                  className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  Adicionar todas hoje
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {parsedItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm transition ${
                    item.added
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 text-stone-400 dark:text-stone-500 line-through'
                      : 'bg-white dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                  }`}
                >
                  <div className="flex-1 truncate">
                    <p className="font-medium truncate">{item.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {item.added ? (
                    <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                      <Check className="w-4 h-4" />
                      Adicionada
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAddSingleItem(idx)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-xs font-semibold hover:bg-emerald-200 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Criar tarefa</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
          <p className="text-xs text-stone-500 italic">
            "Sua cabeça foi feita para ter ideias, não para segurar tudo."
          </p>
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 transition"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
