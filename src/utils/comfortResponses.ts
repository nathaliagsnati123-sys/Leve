import { TreatmentPreference } from '../types';

interface ComfortResponse {
  mensagem: string;
  sugestao: string;
}

export function getComfortResponseLocally(
  text: string,
  treatment: TreatmentPreference = 'nao_informar',
  userName?: string
): ComfortResponse {
  const lower = text.toLowerCase();
  const nameGreeting = userName ? `${userName.trim()}, ` : '';

  // 1. Cansaço / Exaustão / Sobrecarga
  if (
    lower.includes('cansad') ||
    lower.includes('exaust') ||
    lower.includes('sobrecarreg') ||
    lower.includes('pesad') ||
    lower.includes('dormir') ||
    lower.includes('sono') ||
    lower.includes('sem energia') ||
    lower.includes('acabada') ||
    lower.includes('acabado')
  ) {
    return {
      mensagem: `🌿 ${nameGreeting}respira fundo. Você não precisa resolver tudo de uma vez, nem carregar o peso do mundo nas costas. Seu corpo e sua mente também precisam de pausa. Hoje é um dia para diminuir o ritmo com gentileza.`,
      sugestao: '💡 Escolha apenas uma pequena coisa para fazer com calma ou, se for possível agora, beba um copo d\'água, solte os ombros e descanse 10 minutos sem culpa. O restante pode esperar.'
    };
  }

  // 2. Ansiedade / Mente acelerada / Preocupação / Medo
  if (
    lower.includes('ansios') ||
    lower.includes('preocup') ||
    lower.includes('medo') ||
    lower.includes('desespero') ||
    lower.includes('apavorad') ||
    lower.includes('angust') ||
    lower.includes('nervos') ||
    lower.includes('acelerad') ||
    lower.includes('tempo')
  ) {
    return {
      mensagem: `🌿 ${nameGreeting}inspira e solta o ar bem devagar. É normal se sentir assim quando muitas ideias disputam espaço na mente ao mesmo tempo. Você está segura(o) neste momento, e esse sentimento não é para sempre.`,
      sugestao: '💡 Olhe ao seu redor e encontre 3 coisas tranquilas no seu ambiente. Beba um gole d\'água devagar e foque apenas no próximo passo mais imediato, deixando o futuro para quando ele chegar.'
    };
  }

  // 3. Muita coisa para fazer / Lista interminável / Desorganização
  if (
    lower.includes('muita coisa') ||
    lower.includes('demais') ||
    lower.includes('nao dou conta') ||
    lower.includes('não dou conta') ||
    lower.includes('perdida') ||
    lower.includes('perdido') ||
    lower.includes('bagun') ||
    lower.includes('atrasad') ||
    lower.includes('pendenc') ||
    lower.includes('tarefas')
  ) {
    return {
      mensagem: `🌿 ${nameGreeting}tirar tudo isso da cabeça e colocar em palavras já foi o primeiro ato de cuidado. Ter muitas demandas não significa que você tenha que executá-las ao mesmo tempo. Um passo de cada vez basta.`,
      sugestao: '💡 Dê uma pausa mental neste instante. Quando estiver pronta(o), escolha uma única tarefa fácil para tirar da frente, ou simplesmente feche este aplicativo por meia hora e tome um banho quente.'
    };
  }

  // 4. Tristeza / Desânimo / Frustração
  if (
    lower.includes('triste') ||
    lower.includes('desanimad') ||
    lower.includes('chora') ||
    lower.includes('vazio') ||
    lower.includes('sozinha') ||
    lower.includes('sozinho') ||
    lower.includes('decep') ||
    lower.includes('ruim')
  ) {
    return {
      mensagem: `🌿 ${nameGreeting}acolha o que você está sentindo com carinho. Dias mais cinzentos fazem parte da nossa humanidade, e está tudo bem não estar 100% forte hoje. Você é valiosa(o) e respeitar seus sentimentos é um ato de coragem.`,
      sugestao: '💡 Faça algo que traga um mínimo de conforto sensorial: prepare um chá quentinho, coloque uma música calma ou apenas fique em silêncio debaixo de uma coberta confortável.'
    };
  }

  // 5. Autocobrança / Culpa / Perfeccionismo
  if (
    lower.includes('culpa') ||
    lower.includes('deveria') ||
    lower.includes('perfeic') ||
    lower.includes('fracass') ||
    lower.includes('errad') ||
    lower.includes('insufic')
  ) {
    return {
      mensagem: `🌿 ${nameGreeting}seja mais gentil com você mesma(o). Você está fazendo o melhor que pode com as energias e recursos que tem no momento. Perfeição não existe, mas a sua dedicação sim.`,
      sugestao: '💡 Lembre-se de algo bom que você já concluiu essa semana, por menor que tenha parecido. Reconheça seu esforço e dê a si uma folga mental hoje.'
    };
  }

  // Resposta padrão serena e acolhedora
  return {
    mensagem: `🌿 ${nameGreeting}obrigada por ter colocado para fora. Escrever é esvaziar a mente do peso excessivo. Guarde a certeza de que você não precisa ter todas as respostas nem todas as soluções agora.`,
    sugestao: '💡 Faça uma pausa consciente: expire longamente duas vezes, beba um copo d\'água e escolha fazer algo agradável e leve nos próximos minutos.'
  };
}
