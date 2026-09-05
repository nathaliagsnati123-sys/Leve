import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, Send, RefreshCw, Heart, Bot, ShieldCheck, 
  Lock, ArrowRight, MessageSquare, Compass, Sun, Moon 
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'lia';
  text: string;
  timestamp: string;
}

const LIA_INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'lia',
    text: 'Olá, querida! Eu sou a Lia, sua mentora e companheira de leveza. Como está o seu coração e a sua mente hoje? Se houver coisas demais acumuladas na sua cabeça, podemos organizar juntos, um passo de cada vez.',
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
  const [messages, setMessages] = useState<ChatMessage[]>(LIA_INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // Resposta contextual e acolhedora da Lia
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

  // Se o usuário não tem lia_access liberado em user_entitlements
  if (!hasLiaAccess) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-800 to-[#1F3A34] text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-8 h-8 text-emerald-300" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Recurso Lia Access
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
              Conheça a Lia
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
              Lia é a sua mentora e companheira de leveza com inteligência artificial. Ela ajuda a descomprimir a mente, sugerir pausas intencionais, planejar seu dia sem ansiedade e trazer reflexões de paz.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-800 text-left space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-stone-300">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>Status do seu plano: <code>lia_access = false</code></span>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              O acesso à Lia é concedido a usuárias que possuem a permissão <strong>lia_access</strong> ativada na sua conta (<code>user_entitlements</code>).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => refreshEntitlements()}
              disabled={isCheckingEntitlements}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1F3A34] hover:bg-[#172D28] text-white text-xs font-semibold transition shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingEntitlements ? 'animate-spin' : ''}`} />
              <span>Verificar Permissões</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Se o usuário possui lia_access liberado
  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#1F3A34] via-[#264A41] to-[#152723] text-white p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight">Lia</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 uppercase tracking-wider">
                  Lia Access Ativo
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-light">
                Sua mentora diária de leveza, organização e acolhimento.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col h-[520px] overflow-hidden">
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
              <span className="ml-1">Lia está refletindo...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar bg-stone-50/50 dark:bg-stone-900/50">
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
            placeholder="Converse com a Lia ou tire um peso da mente..."
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
