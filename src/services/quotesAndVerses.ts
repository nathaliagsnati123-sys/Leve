import { ScriptureVerse, Achievement, SelfCareAction } from '../types';

export const MOTIVATIONAL_QUOTES: string[] = [
  "Você não precisa fazer tudo hoje. Apenas comece por uma coisa.",
  "Um passo pequeno ainda é um passo.",
  "Você não precisa dar conta de tudo ao mesmo tempo.",
  "Começar também é progresso.",
  "Faça o possível com o dia que você tem.",
  "Seu ritmo também é válido.",
  "Você já chegou mais longe do que imagina.",
  "Respire fundo. A vida acontece nos pequenos instantes de calma.",
  "Hoje, priorize a sua paz mental acima da urgência dos outros.",
  "Cuidar de você não é egoísmo, é a base para cuidar de tudo ao redor.",
  "Tudo bem desacelerar quando o corpo e o coração pedem descanso.",
  "A clareza vem quando colocamos os pensamentos no papel.",
  "Seja gentil com você mesma durante todo o processo.",
  "O dia de hoje é um convite para recomeçar com leveza."
];

export const REFLECTION_QUESTIONS: string[] = [
  "O que fez você sorrir hoje?",
  "O que você gostaria de deixar para trás?",
  "Qual pequena vitória você teve hoje?",
  "O que você gostaria de fazer mais por você?",
  "Qual pessoa tornou seu dia melhor?",
  "O que você está carregando que poderia deixar ir?",
  "Que conselho você daria para você mesma agora?",
  "O que você quer lembrar deste momento da sua vida?",
  "Qual foi o momento de maior paz do seu dia?",
  "O que você aprendeu sobre si mesma esta semana?",
  "Por qual detalhe sutil do seu dia você é grata hoje?",
  "O que traria mais leveza para a sua rotina amanhã?"
];

export const SCRIPTURE_VERSES: ScriptureVerse[] = [
  {
    id: 'verse-1',
    reference: 'Mateus 11:28',
    verse: 'Venham a mim, todos os que estão cansados e sobrecarregados, e eu darei descanso a vocês.',
    reflection: 'Você não precisa carregar todo o peso do mundo em seus ombros. Quando o cansaço bater, entregue suas preocupações e encontre repouso.',
    theme: 'Descanso e Paz'
  },
  {
    id: 'verse-2',
    reference: 'Filipenses 4:6-7',
    verse: 'Não andem ansiosos por coisa alguma, mas em tudo, pela oração e súplicas, e com ação de graças, apresentem seus pedidos a Deus.',
    reflection: 'A ansiedade quer antecipar o amanhã. A oração nos ancora na certeza de que o presente está sob o cuidado generoso de Deus.',
    theme: 'Calma e Oração'
  },
  {
    id: 'verse-3',
    reference: 'Salmos 46:10',
    verse: 'Aquietai-vos e sabei que eu sou Deus.',
    reflection: 'No silêncio encontramos a força que o barulho do dia a dia tenta nos roubar. Pare alguns instantes e respire.',
    theme: 'Silêncio Interior'
  },
  {
    id: 'verse-4',
    reference: 'Lamentações 3:22-23',
    verse: 'As misericórdias do Senhor são a causa de não sermos consumidos; renovam-se a cada manhã; grande é a sua fidelidade.',
    reflection: 'Cada amanhecer traz uma página em branco. O que ontem parecia difícil ganha nova luz e novas oportunidades hoje.',
    theme: 'Esperança e Recomeço'
  },
  {
    id: 'verse-5',
    reference: 'Salmos 23:1-2',
    verse: 'O Senhor é o meu pastor; de nada terei falta. Em verdes pastagens me faz repousar e me conduz a águas tranquilas.',
    reflection: 'Permita-se ser conduzida a um lugar de serenidade. Há tempo para agir e há tempo para repousar junto a águas calmas.',
    theme: 'Provisão e Cuidado'
  },
  {
    id: 'verse-6',
    reference: 'Isaías 40:29',
    verse: 'Ele fortalece o cansado e dá grande vigor ao que está sem forças.',
    reflection: 'Reconhecer nosso cansaço não é fraqueza, é o primeiro passo para receber renovo e acolhimento verdadeiro.',
    theme: 'Força e Renovo'
  },
  {
    id: 'verse-7',
    reference: 'Provérbios 16:3',
    verse: 'Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos.',
    reflection: 'Ao planejar seus dias, coloque suas intenções nas mãos de Deus com amor e simplicidade de coração.',
    theme: 'Propósito e Planos'
  }
];

export interface SelfCareSuggestionItem {
  text: string;
  category: 'Corpo' | 'Mente' | 'Coração';
}

export const SELF_CARE_SUGGESTIONS: SelfCareSuggestionItem[] = [
  { text: 'Tomar um banho quentinho com calma', category: 'Corpo' },
  { text: 'Passar hidratante na pele com carinho', category: 'Corpo' },
  { text: 'Beber uma caneca de chá quentinho', category: 'Corpo' },
  { text: 'Fazer 5 minutos de alongamento suave', category: 'Corpo' },
  { text: 'Comer uma refeição sentada e sem pressa', category: 'Corpo' },
  { text: 'Respirar fundo por 3 minutos em silêncio', category: 'Mente' },
  { text: 'Ler 10 páginas de um livro gostoso', category: 'Mente' },
  { text: 'Desconectar das redes sociais por 1 hora', category: 'Mente' },
  { text: 'Ouvir uma música suave que acalma o coração', category: 'Mente' },
  { text: 'Organizar um pequeno cantinho para clarear a mente', category: 'Mente' },
  { text: 'Fazer um elogio sincero para si mesma', category: 'Coração' },
  { text: 'Ligar ou mandar mensagem de carinho para quem ama', category: 'Coração' },
  { text: 'Olhar o pôr do sol ou o céu pela janela', category: 'Coração' },
  { text: 'Anotar 3 bênçãos do dia com o coração grato', category: 'Coração' },
  { text: 'Se perdoar por algo que não saiu perfeito hoje', category: 'Coração' }
];

export const DEFAULT_SELF_CARE_ACTIONS: SelfCareAction[] = [
  { id: 'sc-1', title: 'Tomei banho com calma', category: 'Corpo' },
  { id: 'sc-2', title: 'Cuidei da minha pele', category: 'Corpo' },
  { id: 'sc-3', title: 'Organizei meu espaço', category: 'Mente' },
  { id: 'sc-4', title: 'Fiz algo que gosto', category: 'Coração' },
  { id: 'sc-5', title: 'Descansei', category: 'Corpo' },
  { id: 'sc-6', title: 'Passei tempo com alguém importante', category: 'Coração' },
  { id: 'sc-7', title: 'Saí um pouco do celular', category: 'Mente' },
  { id: 'sc-8', title: 'Fiz algo por mim', category: 'Coração' }
];

export const ACHIEVEMENTS_LIST: Achievement[] = [
  { id: 'first_task', title: 'Primeira tarefa concluída', description: 'Você deu o primeiro passo para organizar seu dia.', icon: '🏅' },
  { id: 'first_habit', title: 'Primeiro hábito concluído', description: 'Plantando a semente de uma rotina mais saudável.', icon: '🌱' },
  { id: 'first_water', title: 'Meta de água atingida', description: 'Cuidou da sua hidratação com carinho.', icon: '💧' },
  { id: 'streak_3', title: '3 dias consecutivos', description: 'Constância suave e consistente.', icon: '🔥' },
  { id: 'streak_7', title: '7 dias consecutivos', description: 'Uma semana inteira cuidando de si!', icon: '🌟' },
  { id: 'streak_14', title: '14 dias consecutivos', description: 'Seus hábitos estão se transformando em leveza.', icon: '✨' },
  { id: 'first_goal', title: 'Primeira meta criada', description: 'Desenhando seus sonhos em passos claros.', icon: '🎯' },
  { id: 'goal_completed', title: 'Primeira meta concluída', description: 'Celebrando uma grande conquista alcançada.', icon: '🏆' },
  { id: 'first_gratitude', title: 'Primeiro registro de gratidão', description: 'Enxergando beleza nas pequenas coisas.', icon: '🤍' },
  { id: 'first_prayer', title: 'Primeiro momento com Deus', description: 'Reservando tempo para o silêncio e conexão espiritual.', icon: '🙏' },
  { id: 'first_journal', title: 'Primeiro dia no caderno', description: 'Tirando da cabeça e guardando no coração.', icon: '📖' },
  { id: 'fifty_tasks', title: '50 tarefas concluídas', description: 'Muitas pendências resolvidas com tranquilidade.', icon: '💪' },
  { id: 'thirty_days', title: '30 dias no LEVE', description: 'Um mês construindo uma vida mais leve e organizada.', icon: '🌈' }
];
