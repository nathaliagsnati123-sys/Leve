// Visualização da Assistente Pessoal LEVIA - LEVE
// Conceito: "Você fala. A LEVIA organiza."
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, Send, CheckCircle2, XCircle, RotateCcw,
  CheckSquare, Calendar, Sprout, Target, Receipt,
  BookOpen, Compass, Clock, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { EntitlementLockScreen } from '../common/EntitlementLockScreen';
import { LeviaChatMessage, LeviaProposedAction } from '../../types/levia';
import { askLevia, executeProposedActions } from '../../services/leviaService';

const LEVIA_INITIAL_MESSAGES: LeviaChatMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'levia',
    text: 'Olá! Eu sou a LEVIA, sua assistente pessoal de organização no LEVE.\n\n“Você fala. A LEVIA organiza.”\n\nPode me contar em linguagem natural tudo o que estiver passando pela sua mente — tarefas pendentes, compromissos da semana, hábitos que deseja começar ou livros e sonhos para guardar. Eu estruturo tudo e sempre peço sua confirmação antes de salvar no seu LEVE.\n\nO que gostaria de organizar agora?',
    timestamp: 'Agora'
  }
];

const PROMPT_SUGGESTIONS = [
  '⚡ Tenho que pagar a conta de luz amanhã e estudar à noite',
  '🎯 Quais são minhas prioridades para hoje no Meu Dia?',
  '🧠 Estou com várias coisas na cabeça, vamos organizar?',
  '📚 Quero começar a ler Harry Potter',
  '✈️ Quero conhecer a Argentina algum dia',
  '🌱 Criar o hábito de caminhar todo dia',
  '📅 Semana que vem tenho compromissos importantes'
];

export const LiaView: React.FC = () => {
  const { hasLiaAccess } = useAuth();
  const appContext = useApp();
  const { data, showToast } = appContext;

  // Carrega histórico salvo na sessão ou inicial
  const [messages, setMessages] = useState<LeviaChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('levia_chat_history');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return LEVIA_INITIAL_MESSAGES;
  });

  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggestions scroll state
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [canScrollSugLeft, setCanScrollSugLeft] = useState(false);
  const [canScrollSugRight, setCanScrollSugRight] = useState(false);

  // Persiste histórico de mensagens na sessão
  useEffect(() => {
    try {
      sessionStorage.setItem('levia_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const checkSugScroll = () => {
    const el = suggestionsRef.current;
    if (!el) return;
    setCanScrollSugLeft(el.scrollLeft > 4);
    setCanScrollSugRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkSugScroll();
    window.addEventListener('resize', checkSugScroll);
    return () => window.removeEventListener('resize', checkSugScroll);
  }, []);

  const handleSugScroll = (dir: 'left' | 'right') => {
    if (!suggestionsRef.current) return;
    suggestionsRef.current.scrollBy({ left: dir === 'left' ? -180 : 180, behavior: 'smooth' });
    setTimeout(checkSugScroll, 200);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  // Recupera ações não confirmadas e pendentes da última mensagem
  const getLatestPendingActions = (): { messageIndex: number; actions: LeviaProposedAction[] } | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.sender === 'levia' && m.proposedActions && m.proposedActions.length > 0 && !m.actionsExecuted && !m.actionsRejected) {
        return { messageIndex: i, actions: m.proposedActions };
      }
    }
    return null;
  };

  const handleConfirmActions = (messageId: string, actionsToSave: LeviaProposedAction[]) => {
    // 1. Executa ações no AppContext
    executeProposedActions(actionsToSave, {
      addTask: appContext.addTask,
      toggleTask: appContext.toggleTask,
      addHabit: appContext.addHabit,
      addGoal: appContext.addGoal,
      addBill: appContext.addBill,
      addMyLifeBook: appContext.addMyLifeBook,
      addMyLifeMovie: appContext.addMyLifeMovie,
      addMyLifeSeries: appContext.addMyLifeSeries,
      addMyLifeHobby: appContext.addMyLifeHobby,
      addMyLifePlace: appContext.addMyLifePlace,
      addMyLifeDream: appContext.addMyLifeDream,
      showToast: appContext.showToast
    });

    // 2. Atualiza status no histórico de chat
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, actionsExecuted: true, actionsRejected: false } : m
      )
    );

    // 3. Adiciona mensagem de confirmação da LEVIA
    const confirmMsg: LeviaChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'levia',
      text: `Perfeito! Salvei ${actionsToSave.length} item(ns) no seu LEVE. 🌿\n\nVocê já pode acompanhar tudo nas respectivas abas. Sempre que tiver mais coisas para organizar, é só me falar!`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, confirmMsg]);
  };

  const handleRejectActions = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, actionsRejected: true, actionsExecuted: false } : m
      )
    );

    const rejectMsg: LeviaChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'levia',
      text: 'Sem problemas! Cancelei e nenhum dado foi alterado. Quando quiser organizar de outro jeito, só me falar.',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, rejectMsg]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isProcessing) return;

    const userMsg: LeviaChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      const pendingInfo = getLatestPendingActions();
      const result = await askLevia(text, data, pendingInfo?.actions);

      // Se o usuário confirmou via texto as ações pendentes
      if (result.isConfirmation && pendingInfo) {
        executeProposedActions(pendingInfo.actions, {
          addTask: appContext.addTask,
          toggleTask: appContext.toggleTask,
          addHabit: appContext.addHabit,
          addGoal: appContext.addGoal,
          addBill: appContext.addBill,
          addMyLifeBook: appContext.addMyLifeBook,
          addMyLifeMovie: appContext.addMyLifeMovie,
          addMyLifeSeries: appContext.addMyLifeSeries,
          addMyLifeHobby: appContext.addMyLifeHobby,
          addMyLifePlace: appContext.addMyLifePlace,
          addMyLifeDream: appContext.addMyLifeDream,
          showToast: appContext.showToast
        });

        // Marca a mensagem anterior como executada
        setMessages((prev) =>
          prev.map((m, idx) =>
            idx === pendingInfo.messageIndex ? { ...m, actionsExecuted: true } : m
          )
        );
      } else if (result.isRejection && pendingInfo) {
        setMessages((prev) =>
          prev.map((m, idx) =>
            idx === pendingInfo.messageIndex ? { ...m, actionsRejected: true } : m
          )
        );
      }

      const leviaMsg: LeviaChatMessage = {
        id: `lev-${Date.now()}`,
        sender: 'levia',
        text: result.reply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        proposedActions: result.proposedActions
      };

      setMessages((prev) => [...prev, leviaMsg]);
    } catch (err) {
      console.error('Erro no fluxo da LEVIA:', err);
      const fallbackMsg: LeviaChatMessage = {
        id: `lev-${Date.now()}`,
        sender: 'levia',
        text: 'Não consegui processar essa mensagem agora. Poderia repetir ou me dizer de forma mais simples o que você quer organizar?',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetChat = () => {
    if (window.confirm('Deseja iniciar uma nova conversa com a LEVIA? O histórico anterior será limpo.')) {
      setMessages(LEVIA_INITIAL_MESSAGES);
      sessionStorage.removeItem('levia_chat_history');
      showToast('Nova conversa iniciada com a LEVIA', 'info');
    }
  };

  const getActionIcon = (badge: string) => {
    switch (badge) {
      case 'Tarefa':
        return <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Compromisso':
        return <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'Hábito':
        return <Sprout className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'Meta':
        return <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'Conta':
        return <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'Minha Vida':
      case 'Entretenimento':
      case 'Entretenimento & Lazer':
        return <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  // Se o usuário não tem plano VIP com acesso à LEVIA
  if (!hasLiaAccess) {
    return <EntitlementLockScreen feature="lia" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      {/* Concept Banner */}
      <div className="bg-gradient-to-r from-[#1F3A34] to-[#2D4F46] rounded-2xl p-4 sm:p-5 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-bold uppercase tracking-wider">
              Exclusivo VIP
            </span>
            <span className="text-xs text-emerald-100/90 font-medium">
              “Você fala. A LEVIA organiza.”
            </span>
          </div>
          <h1 className="font-serif font-bold text-lg sm:text-xl text-white">
            LEVIA • Assistente Pessoal de Organização
          </h1>
          <p className="text-xs text-emerald-100/80 max-w-xl">
            Tire da cabeça e coloque em ordem. Diga o que precisa fazer em linguagem natural. A LEVIA estrutura suas tarefas, hábitos, contas ou leituras e sempre pede sua confirmação antes de salvar no LEVE.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition cursor-pointer shrink-0"
          title="Iniciar nova conversa limpa"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Nova conversa
        </button>
      </div>

      {/* Chat Container */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-sm flex flex-col h-[620px] overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#1F3A34] text-emerald-100 flex items-center justify-center text-sm font-serif font-bold shadow-xs">
              L
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-sm font-bold text-stone-900 dark:text-stone-100">LEVIA</h2>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Pronta para organizar
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Nunca salva nada sem sua aprovação prévia
              </p>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {m.sender === 'levia' && (
                <div className="w-8 h-8 rounded-full bg-[#1F3A34] text-emerald-100 flex items-center justify-center text-xs font-serif font-bold shrink-0 shadow-xs mt-0.5">
                  L
                </div>
              )}

              <div
                className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-4 py-3.5 text-xs sm:text-sm leading-relaxed space-y-3 ${
                  m.sender === 'user'
                    ? 'bg-[#1F3A34] text-white rounded-tr-none shadow-xs'
                    : 'bg-[#F8FAF8] dark:bg-stone-800/90 text-stone-800 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700/70 rounded-tl-none shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{m.text}</div>

                {/* Proposed Actions Card with Confirmation */}
                {m.proposedActions && m.proposedActions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-stone-200/70 dark:border-stone-700/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-stone-700 dark:text-stone-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Itens identificados ({m.proposedActions.length}):
                      </span>

                      {m.actionsExecuted && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Salvo no LEVE
                        </span>
                      )}

                      {m.actionsRejected && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-500 bg-stone-200 dark:bg-stone-700 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" />
                          Descartado
                        </span>
                      )}
                    </div>

                    {/* Actions List */}
                    <div className="space-y-1.5">
                      {m.proposedActions.map((act) => (
                        <div
                          key={act.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-700 text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div className="shrink-0 p-1 rounded-lg bg-stone-100 dark:bg-stone-800">
                              {getActionIcon(act.categoryBadge)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                                {act.title}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                                {act.details?.displayDate && (
                                  <span>📅 {act.details.displayDate}</span>
                                )}
                                {act.details?.time && (
                                  <span>⏰ {act.details.time}</span>
                                )}
                                {act.details?.priority === 'high' && (
                                  <span className="text-amber-600 font-medium">⚡ Alta</span>
                                )}
                                {act.details?.category && (
                                  <span>• {act.details.category}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 shrink-0">
                            {act.categoryBadge}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Confirmation Buttons (Only if not already decided) */}
                    {!m.actionsExecuted && !m.actionsRejected && (
                      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleConfirmActions(m.id, m.proposedActions!)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs shadow-xs transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sim, salvar no LEVE
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectActions(m.id)}
                          className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 font-medium text-xs transition cursor-pointer"
                        >
                          Não salvar
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <span className={`block text-[10px] mt-1 ${m.sender === 'user' ? 'text-emerald-200/80 text-right' : 'text-stone-400 dark:text-stone-500'}`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs pl-10">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 font-medium">A LEVIA está organizando seus pensamentos...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips with Scroll Navigation */}
        <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center gap-1.5 bg-stone-50/60 dark:bg-stone-900/60">
          <button
            type="button"
            onClick={() => handleSugScroll('left')}
            disabled={!canScrollSugLeft}
            aria-label="Rolar sugestões para a esquerda"
            className={`w-6 h-6 rounded-full border transition-all shrink-0 flex items-center justify-center cursor-pointer ${
              canScrollSugLeft
                ? 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-emerald-50'
                : 'opacity-25 pointer-events-none text-stone-400 border-transparent'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div 
            ref={suggestionsRef}
            onScroll={checkSugScroll}
            className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth w-full"
          >
            {PROMPT_SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(sug)}
                className="text-[11px] whitespace-nowrap px-3 py-1.5 rounded-full bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-300 transition shrink-0 cursor-pointer"
              >
                {sug}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleSugScroll('right')}
            disabled={!canScrollSugRight}
            aria-label="Rolar sugestões para a direita"
            className={`w-6 h-6 rounded-full border transition-all shrink-0 flex items-center justify-center cursor-pointer ${
              canScrollSugRight
                ? 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-emerald-50'
                : 'opacity-25 pointer-events-none text-stone-400 border-transparent'
            }`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Message Input Box */}
        <div className="p-3 sm:p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Fale ou digite o que está na sua cabeça (ex: tenho que pagar a conta amanhã...)"
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border-none text-xs sm:text-sm text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700/50 placeholder:text-stone-400"
          />
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isProcessing}
            className="p-2.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162B25] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            title="Enviar para a LEVIA organizar"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
