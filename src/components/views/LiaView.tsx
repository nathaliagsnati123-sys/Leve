// Visualização da Assistente Levia - LEVE
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, Send, Heart, Bot, ShieldCheck, 
  ArrowRight, MessageSquare, Compass, Sun, Moon,
  ChevronLeft, ChevronRight 
} from 'lucide-react';
import { EntitlementLockScreen } from '../common/EntitlementLockScreen';

interface ChatMessage {
  id: string;
  sender: 'user' | 'lia';
  text: string;
  timestamp: string;
}

const LEVIA_INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'lia',
    text: 'Olá, querida! Eu sou a Levia, sua mentora e companheira de leveza. Como está o seu coração e a sua mente hoje? Se houver coisas demais acumuladas na sua cabeça, podemos organizar juntos, um passo de cada vez.',
    timestamp: 'Agora'
  }
];

const PROMPT_SUGGESTIONS = [
  '🌿 Organizar minha mente para o dia',
  '🕊️ Uma oração ou palavra de paz',
  '✨ Me ajude a escolher minhas 3 prioridades',
  '🌸 Um lembrete gentil de autocuidado'
];

export const LiaView: React.FC = () => {
  const { hasLiaAccess, entitlements, refreshEntitlements, isCheckingEntitlements } = useAuth();
  const { data, showToast } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>(LEVIA_INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggestions scroll state
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [canScrollSugLeft, setCanScrollSugLeft] = useState(false);
  const [canScrollSugRight, setCanScrollSugRight] = useState(false);

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
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Resposta contextual e acolhedora da Levia
    setTimeout(() => {
      let reply = '';
      const lower = text.toLowerCase();

      if (lower.includes('prioridade') || lower.includes('organizar') || lower.includes('mente')) {
        const pendingTasks = data.tasks.filter((t) => !t.completed).slice(0, 3);
        if (pendingTasks.length > 0) {
          reply = `Olhando para o seu dia, sugiro respirar fundo e focar em apenas uma coisa primeiro: "${pendingTasks[0].title}". Quando concluir, as outras duas tarefas principais ganharão espaço natural. Lembre-se: produtividade não é volume, é paz de espírito.`;
        } else {
          reply = 'Quando a cabeça está cheia, o melhor remédio é tirar tudo para o papel ou para a ferramenta "Tirar da Cabeça". Que tal escolhermos apenas 1 tarefa inegociável para hoje e permitir que o resto flua com calma?';
        }
      } else if (lower.includes('oração') || lower.includes('paz') || lower.includes('deus')) {
        reply = 'Coloque a mão sobre o peito e respire fundo por 4 segundos... "Aquietai-vos e sabei que eu sou Deus" (Salmos 46:10). Você não precisa carregar o mundo hoje. Entregue as incertezas e acolha a graça deste momento.';
      } else if (lower.includes('autocuidado') || lower.includes('cansada') || lower.includes('descanso')) {
        reply = 'Seu corpo e sua alma são sagrados. Que tal uma pausa agora para beber um copo d\'água gelada, alongar os ombros e fechar os olhos por 2 minutos sem tela? O descanso também faz parte do progresso.';
      } else {
        reply = `Estou aqui com você, ${data.user.name || 'amiga'}. Cada dia tem seu próprio ritmo e o seu é precioso. O que quer que esteja acontecendo, vamos com calma, um detalhe de cada vez. Como posso te apoiar agora?`;
      }

      const liaMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'lia',
        text: reply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, liaMsg]);
      setIsTyping(false);
    }, 1100);
  };

  // Se o usuário não tem plano VIP com acesso à Levia
  if (!hasLiaAccess) {
    return <EntitlementLockScreen feature="lia" />;
  }

  // Se o usuário possui lia_access liberado
  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-8">
      {/* Chat Container */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col h-[580px] overflow-hidden">
        {/* Compact Header Bar */}
        <div className="px-5 py-3.5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-emerald-100 flex items-center justify-center text-xs font-serif font-bold shadow-xs">
              L
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-sm font-bold text-stone-900 dark:text-stone-100">Levia</h2>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Mentora Ativa
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Sua mentora diária de leveza, organização e acolhimento
              </p>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {m.sender === 'lia' && (
                <div className="w-8 h-8 rounded-full bg-emerald-800 text-emerald-100 flex items-center justify-center text-xs font-serif font-bold shrink-0 shadow-xs">
                  L
                </div>
              )}
              <div
                className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#1F3A34] text-white rounded-tr-none'
                    : 'bg-[#F9FAF8] dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200/70 dark:border-stone-700/60 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                <span className={`block text-[10px] mt-1.5 ${m.sender === 'user' ? 'text-emerald-200/80 text-right' : 'text-stone-400 dark:text-stone-500'}`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-stone-400 text-xs italic pl-10">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1">Levia está refletindo...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips with Arrows */}
        <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center gap-1.5 bg-stone-50/50 dark:bg-stone-900/50">
          <button
            type="button"
            onClick={() => handleSugScroll('left')}
            disabled={!canScrollSugLeft}
            aria-label="Rolar sugestões para a esquerda"
            className={`w-6 h-6 rounded-full border transition-all duration-150 shrink-0 flex items-center justify-center cursor-pointer ${
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
                className="text-[11px] whitespace-nowrap px-3 py-1.5 rounded-full bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-900 transition shrink-0 cursor-pointer"
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
            className={`w-6 h-6 rounded-full border transition-all duration-150 shrink-0 flex items-center justify-center cursor-pointer ${
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
            placeholder="Converse com a Levia ou tire um peso da mente..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border-none text-xs sm:text-sm text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700/50 placeholder:text-stone-400"
          />
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isTyping}
            className="p-2.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162B25] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            title="Enviar mensagem"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
