// Citações, Versículos e Conquistas - LEVE
import { ScriptureVerse, Achievement, SelfCareAction } from '../types';
import { adaptTextToGender, normalizeTreatmentPreference } from '../utils/treatment';

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
  "A clareza vem quando tiramos os pesos da mente e colocamos no papel.",
  "Seja gentil com você mesma durante todo o processo.",
  "O dia de hoje é um convite para recomeçar com leveza.",
  "Permita-se viver um momento de cada vez sem cobranças excessivas.",
  "Você é suficiente exatamente como é neste instante.",
  "A paciência com você mesma é uma das formas mais bonitas de amor-próprio.",
  "Não compare o seu bastidor com o palco de outra pessoa.",
  "Grandes jornadas são feitas de pequenas pausas intencionais.",
  "Celebre as pequenas vitórias silenciosas que ninguém mais vê.",
  "Hoje é um novo dia, com novas oportunidades e misericórdias renovadas.",
  "O que importa não é a velocidade, mas a direção e a paz no coração.",
  "Solte a necessidade de controlar tudo e acolha o que o hoje traz.",
  "Menos pressa, mais presença.",
  "Deixe de lado o que não está sob o seu controle hoje.",
  "Um coração em paz é um lar seguro para os seus sonhos.",
  "Você tem a força necessária para enfrentar o que este dia pedir.",
  "Descansar não é perder tempo; é nutrir sua mente para continuar.",
  "A cada amanhecer, Deus nos dá a chance de escolher a leveza.",
  "Coloque amor no que faz hoje, por mais simples que pareça.",
  "Seja grata pelo que já tem enquanto constrói o que deseja alcançar.",
  "Tudo o que você precisa fazer agora é dar o próximo passo consciente.",
  "A sua saúde mental vale mais do que qualquer prazo ou correria.",
  "Permita-se errar, aprender e seguir em frente sem culpa.",
  "Uma rotina leve se constrói com carinho e consistência, não com rigidez."
];

/**
 * Frases motivacionais diretas, focadas em disciplina, execução e postura para homens
 */
export const MASCULINE_MOTIVATIONAL_QUOTES: string[] = [
  "Disciplina é fazer o que precisa ser feito, mesmo quando a vontade falta.",
  "Constância supera o talento e o entusiasmo inicial.",
  "Foque apenas no que está sob o seu controle. Ignore o ruído ao redor.",
  "Ação cura a incerteza e aniquila a procrastinação.",
  "Clareza gera velocidade: escolha as prioridades e execute sem rodeios.",
  "Um homem com propósito firme não se distrai com facilidades passageiras.",
  "Grandes resultados são construídos em dias comuns com disciplina silenciosa.",
  "O treino fortalece o corpo; a consistência diária forja o caráter.",
  "Menos desculpas, mais execução. Comece pelo que é difícil.",
  "O cansaço passa, mas o resultado do trabalho bem executado permanece.",
  "Controle seus impulsos antes que eles tomem o controle de você.",
  "Pequenas vitórias executadas todos os dias constroem um ímpeto inabalável.",
  "Excelência não é um ato isolado, é um hábito construído na rotina.",
  "Não espere as condições ideais. Assuma a responsabilidade e faça acontecer.",
  "Elimine as distrações antes que elas roubem os seus objetivos.",
  "Descanso estratégico faz parte da disciplina; negligência não.",
  "Seja forte para carregar suas próprias responsabilidades com dignidade.",
  "A consistência é a maior vantagem competitiva que você pode ter.",
  "Faça o difícil hoje para colher uma estrutura sólida amanhã.",
  "A autoconfiança real nasce dos compromissos que você cumpre consigo mesmo.",
  "Mantenha o foco na rota. Um passo firme de cada vez.",
  "A mente desiste antes do corpo. Respire fundo e sustente o ritmo."
];

/**
 * Retorna a frase motivacional específica do dia atual (consistente ao longo do dia)
 */
export function getDailyMotivationalQuote(dateStr?: string, treatment?: string): string {
  const pref = normalizeTreatmentPreference(treatment);
  const pool = pref === 'masculino' ? MASCULINE_MOTIVATIONAL_QUOTES : MOTIVATIONAL_QUOTES;
  
  const dateKey = dateStr || new Date().toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) % pool.length;
  }
  const quote = pool[Math.abs(hash) % pool.length];
  return adaptTextToGender(quote, treatment);
}

/**
 * Retorna uma frase motivacional aleatória adaptada ao gênero
 */
export function getRandomMotivationalQuote(excludeQuote?: string, treatment?: string): string {
  const pref = normalizeTreatmentPreference(treatment);
  const baseList = pref === 'masculino' ? MASCULINE_MOTIVATIONAL_QUOTES : MOTIVATIONAL_QUOTES;
  const pool = excludeQuote ? baseList.filter((q) => q !== excludeQuote) : baseList;
  const list = pool.length > 0 ? pool : baseList;
  const randomIndex = Math.floor(Math.random() * list.length);
  return adaptTextToGender(list[randomIndex], treatment);
}

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

export const MASCULINE_REFLECTION_QUESTIONS: string[] = [
  "Qual foi a tarefa mais difícil que você executou com sucesso hoje?",
  "Onde você sustentou a disciplina mesmo diante de distrações ou preguiça?",
  "Qual foi a decisão mais acertada que você tomou hoje?",
  "O que você precisa corrigir ou aprimorar para o dia de amanhã?",
  "Como você cuidou da sua força física e energia hoje?",
  "Qual é a sua prioridade inegociável número 1 para amanhã?",
  "O que você precisa eliminar da sua rotina para ter mais clareza e foco?"
];

export function getReflectionQuestions(treatment?: string | null): string[] {
  const pref = normalizeTreatmentPreference(treatment);
  if (pref === 'masculino') {
    return MASCULINE_REFLECTION_QUESTIONS;
  }
  return REFLECTION_QUESTIONS.map(q => adaptTextToGender(q, treatment));
}

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
  category: 'Corpo' | 'Mente' | 'Coração' | 'Foco';
}

export const FEMININE_SELF_CARE_SUGGESTIONS: SelfCareSuggestionItem[] = [
  { text: 'Tomar um banho quentinho com calma', category: 'Corpo' },
  { text: 'Passar hidratante na pele com carinho (skincare)', category: 'Corpo' },
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

export const MASCULINE_SELF_CARE_SUGGESTIONS: SelfCareSuggestionItem[] = [
  { text: 'Treino de força, flexões ou corrida', category: 'Corpo' },
  { text: 'Alongamento de postura e lombar por 5 minutos', category: 'Corpo' },
  { text: 'Ducha fria ou revigorante sem enrolação', category: 'Corpo' },
  { text: 'Alinhar barba, corte de cabelo e postura', category: 'Corpo' },
  { text: 'Refeição nutritiva com alto teor proteico', category: 'Corpo' },
  { text: 'Caminhada de 15 minutos ao ar livre sem celular', category: 'Mente' },
  { text: 'Zero redes sociais por 1 hora para limpar o foco', category: 'Mente' },
  { text: 'Leitura de 10 páginas de livro de estratégia ou história', category: 'Mente' },
  { text: '3 minutos de respiração controlada para clareza', category: 'Mente' },
  { text: 'Organizar bancada de trabalho e ferramentas', category: 'Foco' },
  { text: 'Reconhecer uma vitória silenciosa executada hoje', category: 'Foco' },
  { text: 'Ligar ou conversar com a família ou um bom amigo', category: 'Foco' },
  { text: 'Definir as 3 prioridades inegociáveis de amanhã', category: 'Foco' },
  { text: 'Desconectar de telas 30 minutos antes de dormir', category: 'Mente' },
  { text: 'Dormir no horário programado para recuperação muscular e mental', category: 'Corpo' }
];

export const NEUTRAL_SELF_CARE_SUGGESTIONS: SelfCareSuggestionItem[] = [
  { text: 'Tomar um banho relaxante e com calma', category: 'Corpo' },
  { text: 'Fazer 5 minutos de alongamento corporal', category: 'Corpo' },
  { text: 'Beber uma caneca de chá ou café com calma', category: 'Corpo' },
  { text: 'Fazer uma caminhada leve ao ar livre', category: 'Corpo' },
  { text: 'Comer uma refeição nutritiva e sem pressa', category: 'Corpo' },
  { text: 'Respirar fundo por 3 minutos em silêncio', category: 'Mente' },
  { text: 'Ler 10 páginas de um livro', category: 'Mente' },
  { text: 'Fazer uma pausa longe de todas as telas por 1 hora', category: 'Mente' },
  { text: 'Ouvir uma música que traga serenidade', category: 'Mente' },
  { text: 'Organizar o espaço ao redor para clarear a mente', category: 'Mente' },
  { text: 'Reconhecer seu próprio esforço no dia de hoje', category: 'Coração' },
  { text: 'Conversar com alguém importante para você', category: 'Coração' },
  { text: 'Observar o céu ou a natureza pela janela', category: 'Coração' },
  { text: 'Anotar 3 motivos de gratidão no seu dia', category: 'Coração' },
  { text: 'Deixar de lado a autocobrança excessiva', category: 'Coração' }
];

export const SELF_CARE_SUGGESTIONS = FEMININE_SELF_CARE_SUGGESTIONS;

export function getSelfCareSuggestions(treatmentPreference?: string | null): SelfCareSuggestionItem[] {
  const pref = normalizeTreatmentPreference(treatmentPreference);
  if (pref === 'masculino') return MASCULINE_SELF_CARE_SUGGESTIONS;
  if (pref === 'nao_informar') return NEUTRAL_SELF_CARE_SUGGESTIONS;
  return FEMININE_SELF_CARE_SUGGESTIONS;
}

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
