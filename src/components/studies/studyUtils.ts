// Utilitários, paletas e modelos para o Caderno de Estudos do LEVE

export interface SubjectColor {
  id: string;
  name: string;
  badge: string;
  border: string;
  bgSoft: string;
  accent: string;
  folderBg: string;
  tabBg: string;
}

export const STUDY_COLORS: SubjectColor[] = [
  {
    id: 'emerald',
    name: 'Verde LEVE',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    border: 'border-emerald-500/30 hover:border-emerald-500',
    bgSoft: 'bg-emerald-50/70 dark:bg-emerald-950/20',
    accent: '#1F3A34',
    folderBg: 'from-emerald-800 to-[#1F3A34]',
    tabBg: 'bg-emerald-700 dark:bg-emerald-800 text-white',
  },
  {
    id: 'blue',
    name: 'Azul Sereno',
    badge: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
    border: 'border-blue-500/30 hover:border-blue-500',
    bgSoft: 'bg-blue-50/70 dark:bg-blue-950/20',
    accent: '#1D4ED8',
    folderBg: 'from-blue-700 to-indigo-900',
    tabBg: 'bg-blue-600 dark:bg-blue-700 text-white',
  },
  {
    id: 'purple',
    name: 'Lavanda & Roxo',
    badge: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
    border: 'border-purple-500/30 hover:border-purple-500',
    bgSoft: 'bg-purple-50/70 dark:bg-purple-950/20',
    accent: '#6D28D9',
    folderBg: 'from-purple-700 to-purple-950',
    tabBg: 'bg-purple-600 dark:bg-purple-700 text-white',
  },
  {
    id: 'amber',
    name: 'Âmbar & Ouro',
    badge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    border: 'border-amber-500/30 hover:border-amber-500',
    bgSoft: 'bg-amber-50/70 dark:bg-amber-950/20',
    accent: '#B45309',
    folderBg: 'from-amber-600 to-amber-900',
    tabBg: 'bg-amber-600 dark:bg-amber-700 text-white',
  },
  {
    id: 'rose',
    name: 'Rosa Suave',
    badge: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    border: 'border-rose-500/30 hover:border-rose-500',
    bgSoft: 'bg-rose-50/70 dark:bg-rose-950/20',
    accent: '#BE123C',
    folderBg: 'from-rose-600 to-rose-900',
    tabBg: 'bg-rose-600 dark:bg-rose-700 text-white',
  },
  {
    id: 'teal',
    name: 'Turquesa',
    badge: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800',
    border: 'border-teal-500/30 hover:border-teal-500',
    bgSoft: 'bg-teal-50/70 dark:bg-teal-950/20',
    accent: '#0F766E',
    folderBg: 'from-teal-700 to-teal-950',
    tabBg: 'bg-teal-600 dark:bg-teal-700 text-white',
  },
  {
    id: 'indigo',
    name: 'Índigo Profundo',
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
    border: 'border-indigo-500/30 hover:border-indigo-500',
    bgSoft: 'bg-indigo-50/70 dark:bg-indigo-950/20',
    accent: '#3730A3',
    folderBg: 'from-indigo-700 to-indigo-950',
    tabBg: 'bg-indigo-600 dark:bg-indigo-700 text-white',
  },
  {
    id: 'stone',
    name: 'Tons Neutros',
    badge: 'bg-stone-100 text-stone-800 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
    border: 'border-stone-400/30 hover:border-stone-500',
    bgSoft: 'bg-stone-100/70 dark:bg-stone-800/30',
    accent: '#44403C',
    folderBg: 'from-stone-700 to-stone-900',
    tabBg: 'bg-stone-700 dark:bg-stone-600 text-white',
  },
];

export const STUDY_ICONS = [
  '📚', '⚖️', '📊', '🧮', '📝', '💼', 
  '🎯', '💡', '🏛️', '🔬', '💻', '🌐', 
  '🩺', '🎨', '🧪', '📈', '📖', '🎓',
  '🧠', '🔍', '⚙️', '✨', '🗓️', '📌'
];

export const STUDY_SUGGESTIONS = [
  { name: 'Administração', icon: '💼', color: 'emerald' },
  { name: 'Direito', icon: '⚖️', color: 'blue' },
  { name: 'Contabilidade', icon: '📊', color: 'amber' },
  { name: 'Matemática', icon: '🧮', color: 'indigo' },
  { name: 'Português', icon: '📝', color: 'teal' },
  { name: 'Marketing', icon: '📈', color: 'rose' },
  { name: 'Concurso Público', icon: '🎯', color: 'emerald' },
];

export const STUDY_TEMPLATES = [
  {
    id: 'class_summary',
    name: 'Resumo de Aula',
    description: 'Estrutura padrão com tópicos principais, conceitos e exemplos.',
    content: `# Título da Aula: 

## 1. Visão Geral & Contexto
- Data: 
- Professor(a) / Fonte: 
- Objetivo da aula: 

## 2. Conceitos Fundamentais
- **Conceito 1:** Definição clara e direta.
- **Conceito 2:** Como se aplica na prática.

> 💡 **Ponto de Atenção para Prova:**
> Anote aqui o que o professor frisou que certamente cairá na avaliação.

## 3. Exemplos Práticos
1. Primeiro caso prático ou exercício resolvido.
2. Segundo exemplo explicativo.

## 4. Dúvidas para Revisar
- [ ] Revisar anotações sobre o conceito 1
- [ ] Fazer exercícios da lista do capítulo
`
  },
  {
    id: 'exam_revision',
    name: 'Revisão para Prova',
    description: 'Checklist de tópicos cobrados, pegadinhas e pontos de atenção.',
    content: `# Revisão Estratégica para Prova

## 🎯 Tópicos com Maior Incidência
- [ ] Tópico A (Alta prioridade)
- [ ] Tópico B (Média prioridade)
- [ ] Tópico C (Revisão rápida)

---

## ⚠️ Atenção / Pegadinhas Clássicas
> 💡 **Cuidado com a pegadinha:**
> Descreva aqui os detalhes de enunciado que costumam induzir ao erro.

## 📝 Resumo Sintético em Tópicos
- **Definição Principal:** Explicação em uma única frase simples.
- **Exceções à Regra:** Caso existam, liste abaixo:
  - Exceção 1
  - Exceção 2

## 🔄 Checklist Final
- [ ] Li os pontos-chave
- [ ] Resolvi ao menos 5 questões de fixação
- [ ] Revisei as fórmulas / artigos da lei
`
  },
  {
    id: 'concept_card',
    name: 'Ficha Conceitual',
    description: 'Para fixação rápida de teorias, leis ou fórmulas.',
    content: `# Ficha Conceitual: [Nome do Conceito]

## 📌 O que é?
Defina o conceito com suas próprias palavras de forma simples e memorável.

## ⚙️ Para que serve?
Qual a finalidade prática ou teórica deste conceito?

---

> 💡 **Palavras-chave de Associação:**
> Termo 1 • Termo 2 • Termo 3

## 📖 Exemplo do Dia a Dia
Como este conceito aparece no mundo real ou em uma questão de prova.
`
  }
];

export function getSubjectColor(colorId?: string): SubjectColor {
  return STUDY_COLORS.find(c => c.id === colorId) || STUDY_COLORS[0];
}

/**
 * Remove markdown symbols to generate a clean preview string.
 */
export function extractTextPreview(content?: string, maxLength = 120): string {
  if (!content) return 'Documento vazio. Clique para começar a escrever...';
  const clean = content
    .replace(/#+\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/<u>([^<]+)<\/u>/g, '$1')
    .replace(/>\s*💡\s*/g, '')
    .replace(/>\s*/g, '')
    .replace(/- \[[ xX]\]\s*/g, '')
    .replace(/[-*]\s+/g, '')
    .replace(/\d+\.\s+/g, '')
    .replace(/---/g, '')
    .trim();

  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength).trim() + '...';
}

/**
 * Utilitário de compressão de foto de capa para manter o app leve, rápido e sem sobrecarregar armazenamento,
 * preservando perfeitamente a proporção original da imagem (Instagram 4:5, Stories 9:16, Quadrado 1:1 ou Paisagem 16:9).
 */
export const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          // Limite de 1440px no maior lado para garantir alta nitidez em qualquer proporção (Stories, Feed ou Banner)
          const MAX_SIDE = 1440;
          let width = img.width;
          let height = img.height;

          if (width > MAX_SIDE || height > MAX_SIDE) {
            if (width > height) {
              height = Math.round((height * MAX_SIDE) / width);
              width = MAX_SIDE;
            } else {
              width = Math.round((width * MAX_SIDE) / height);
              height = MAX_SIDE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context not available');

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressedDataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
};

