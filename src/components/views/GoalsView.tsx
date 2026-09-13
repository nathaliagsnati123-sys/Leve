import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Target, Plus, Check, ChevronRight, ArrowLeft,
  Trash2, Sparkles, X, Camera, Upload,
  Edit3, Eye, ImagePlus, Calendar, ListChecks, Search,
  Folder, Maximize2
} from 'lucide-react';
import { Goal, GoalCategory, GoalStep } from '../../types';
import { formatDateToBrazilian } from '../../services/storage';
import confetti from 'canvas-confetti';

// Utilitário de compressão de foto de meta preservando proporção original (Instagram 4:5, Stories 9:16, Feed 1:1 ou 16:9)
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
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

interface CategoryPalette {
  accent: string;
  badge: string;
  border: string;
  bgSoft: string;
}

const CATEGORY_PALETTES: Record<string, CategoryPalette> = {
  'Espiritualidade': {
    accent: '#6D28D9',
    badge: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
    border: 'border-purple-500/30 hover:border-purple-500',
    bgSoft: 'bg-purple-50/70 dark:bg-purple-950/20',
  },
  'Saúde e corpo': {
    accent: '#1F3A34',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    border: 'border-emerald-500/30 hover:border-emerald-500',
    bgSoft: 'bg-emerald-50/70 dark:bg-emerald-950/20',
  },
  'Estudos e mente': {
    accent: '#1D4ED8',
    badge: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
    border: 'border-blue-500/30 hover:border-blue-500',
    bgSoft: 'bg-blue-50/70 dark:bg-blue-950/20',
  },
  'Finanças': {
    accent: '#B45309',
    badge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    border: 'border-amber-500/30 hover:border-amber-500',
    bgSoft: 'bg-amber-50/70 dark:bg-amber-950/20',
  },
  'Casa e rotina': {
    accent: '#0F766E',
    badge: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800',
    border: 'border-teal-500/30 hover:border-teal-500',
    bgSoft: 'bg-teal-50/70 dark:bg-teal-950/20',
  },
  'Relacionamentos': {
    accent: '#BE185D',
    badge: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    border: 'border-rose-500/30 hover:border-rose-500',
    bgSoft: 'bg-rose-50/70 dark:bg-rose-950/20',
  },
  'Projetos pessoais': {
    accent: '#4338CA',
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
    border: 'border-indigo-500/30 hover:border-indigo-500',
    bgSoft: 'bg-indigo-50/70 dark:bg-indigo-950/20',
  },
};

const getCategoryPalette = (category: string): CategoryPalette => {
  return CATEGORY_PALETTES[category] || {
    accent: '#1F3A34',
    badge: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
    border: 'border-stone-300 hover:border-stone-400',
    bgSoft: 'bg-stone-50 dark:bg-stone-850',
  };
};

export const GoalsView: React.FC = () => {
  const { data, addGoal, updateGoal, deleteGoal, showToast } = useApp();

  // Nível de navegação:
  // null -> Visão Geral das Metas (Cards com seta pro lado ChevronRight, sem ocupar espaço)
  // string (goalId) -> Abre a caixinha/área exclusiva da meta (idêntico ao Caderno de Estudos)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Filtros na visão geral
  const [statusFilter, setStatusFilter] = useState<'all' | 'in-progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtro de passos dentro da meta selecionada
  const [stepFilter, setStepFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Modal de edição / criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Modal de visualização de foto em tela cheia (lightbox)
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<{ url: string; title: string } | null>(null);

  // Input de passo rápido dentro da meta aberta
  const [newStepTitle, setNewStepTitle] = useState('');

  // Form states do Modal
  const [name, setName] = useState('');
  const [category, setCategory] = useState<GoalCategory>('Saúde e corpo');
  const [targetDate, setTargetDate] = useState('');
  const [motivation, setMotivation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Input direto de foto rápida no banner ou card
  const quickPhotoInputRef = useRef<HTMLInputElement>(null);
  const [targetGoalForQuickPhoto, setTargetGoalForQuickPhoto] = useState<string | null>(null);
  const [cardFitModes, setCardFitModes] = useState<Record<string, 'cover' | 'contain'>>({});

  const getGoalFitMode = (goalId: string): 'cover' | 'contain' => {
    return cardFitModes[goalId] || 'contain';
  };

  const toggleCardFitMode = (goalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCardFitModes((prev) => ({
      ...prev,
      [goalId]: (prev[goalId] || 'contain') === 'contain' ? 'cover' : 'contain',
    }));
  };

  const [steps, setSteps] = useState<{ id: string; title: string; completed: boolean }[]>([
    { id: '1', title: '', completed: false }
  ]);

  // Meta ativa selecionada
  const allGoals = data.goals || [];
  const selectedGoal = useMemo(() => {
    return allGoals.find((g) => g.id === selectedGoalId) || null;
  }, [allGoals, selectedGoalId]);

  // Upload de foto no Modal
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).', 'info');
      return;
    }

    setIsProcessingPhoto(true);
    try {
      const compressed = await compressImageFile(file);
      setImageUrl(compressed);
      showToast('Foto adicionada com sucesso! ✨');
    } catch (err) {
      console.error('Error processing goal image:', err);
      showToast('Não foi possível processar a imagem. Tente uma foto menor.', 'info');
    } finally {
      setIsProcessingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  // Upload rápido de foto para uma meta
  const handleQuickPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetGoalForQuickPhoto) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).', 'info');
      return;
    }

    try {
      const compressed = await compressImageFile(file);
      const target = allGoals.find((g) => g.id === targetGoalForQuickPhoto);
      if (target) {
        updateGoal({
          ...target,
          imageUrl: compressed,
          image: compressed
        });
        showToast('Foto de inspiração atualizada com sucesso! 📸✨');
      }
    } catch (err) {
      console.error('Error processing quick photo:', err);
      showToast('Erro ao processar imagem.', 'info');
    } finally {
      setTargetGoalForQuickPhoto(null);
      if (e.target) e.target.value = '';
    }
  };

  // Remover foto da meta
  const handleRemovePhoto = (goal: Goal) => {
    updateGoal({
      ...goal,
      imageUrl: undefined,
      image: undefined
    });
    showToast('Foto removida da meta.');
  };

  const handleOpenNew = () => {
    setEditingGoalId(null);
    setName('');
    setCategory('Saúde e corpo');
    setTargetDate('');
    setMotivation('');
    setImageUrl('');
    setSteps([{ id: '1', title: '', completed: false }]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setName(goal.name);
    setCategory(goal.category);
    setTargetDate(goal.targetDate || '');
    setMotivation(goal.motivation || '');
    setImageUrl(goal.imageUrl || goal.image || '');
    setSteps(
      goal.steps && goal.steps.length > 0
        ? goal.steps.map((s) => ({ ...s }))
        : [{ id: '1', title: '', completed: false }]
    );
    setIsModalOpen(true);
  };

  const handleAddStepField = () => {
    setSteps((prev) => [
      ...prev,
      { id: Date.now().toString(), title: '', completed: false }
    ]);
  };

  const handleStepTitleChange = (id: string, newTitle: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  const handleRemoveStepField = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Por favor, informe o nome da meta.', 'info');
      return;
    }

    const validSteps: GoalStep[] = steps
      .filter((s) => s.title.trim())
      .map((s) => ({
        id: s.id || Date.now().toString(),
        title: s.title.trim(),
        completed: s.completed || false
      }));

    if (editingGoalId) {
      const existing = allGoals.find((g) => g.id === editingGoalId);
      if (existing) {
        updateGoal({
          ...existing,
          name: name.trim(),
          category,
          targetDate: targetDate || undefined,
          motivation: motivation.trim() || undefined,
          imageUrl: imageUrl || undefined,
          image: imageUrl || undefined,
          steps: validSteps
        });
      }
    } else {
      const newId = 'goal-' + Date.now();
      addGoal({
        name: name.trim(),
        category,
        targetDate: targetDate || undefined,
        motivation: motivation.trim() || undefined,
        imageUrl: imageUrl || undefined,
        image: imageUrl || undefined,
        status: 'in-progress',
        steps: validSteps
      });
      // Abre a nova meta diretamente no estilo Caderno de Estudos
      setSelectedGoalId(newId);
    }

    setIsModalOpen(false);
  };

  const handleToggleStep = (goal: Goal, stepId: string) => {
    const nextSteps = (goal.steps || []).map((s) =>
      s.id === stepId ? { ...s, completed: !s.completed } : s
    );

    const allCompleted = nextSteps.length > 0 && nextSteps.every((s) => s.completed);

    if (allCompleted && !goal.completed) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        console.error(err);
      }
      showToast('Parabéns! Você concluiu todos os passos desta meta! 🎉');
    }

    updateGoal({
      ...goal,
      steps: nextSteps,
      status: allCompleted ? 'completed' : 'in-progress',
      completed: allCompleted
    });
  };

  // Adicionar passo rápido inline dentro da meta aberta
  const handleAddInlineStep = (goal: Goal) => {
    const title = newStepTitle.trim();
    if (!title) return;

    const newStep: GoalStep = {
      id: 'step-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title,
      completed: false
    };

    const currentSteps = goal.steps || [];
    const updatedSteps = [...currentSteps, newStep];

    updateGoal({
      ...goal,
      steps: updatedSteps,
      status: 'in-progress',
      completed: false
    });

    setNewStepTitle('');
    showToast('Passo adicionado à meta! ✨');
  };

  // Excluir passo individual
  const handleDeleteStep = (goal: Goal, stepId: string) => {
    const updatedSteps = (goal.steps || []).filter((s) => s.id !== stepId);
    const allCompleted = updatedSteps.length > 0 && updatedSteps.every((s) => s.completed);

    updateGoal({
      ...goal,
      steps: updatedSteps,
      status: allCompleted ? 'completed' : 'in-progress',
      completed: allCompleted
    });
    showToast('Passo removido.');
  };

  // Filtrar metas na visão geral
  const filteredGoals = useMemo(() => {
    return allGoals.filter((g) => {
      // Filtro de status
      const steps = g.steps || [];
      const isCompleted = g.status === 'completed' || (steps.length > 0 && steps.every((s) => s.completed));
      if (statusFilter === 'in-progress' && isCompleted) return false;
      if (statusFilter === 'completed' && !isCompleted) return false;

      // Busca por nome ou categoria
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = g.name.toLowerCase().includes(q);
        const matchCategory = g.category.toLowerCase().includes(q);
        const matchMotiv = (g.motivation || '').toLowerCase().includes(q);
        if (!matchName && !matchCategory && !matchMotiv) return false;
      }

      return true;
    });
  }, [allGoals, statusFilter, searchQuery]);

  const totalGoals = allGoals.length;
  const completedGoalsCount = allGoals.filter((g) => {
    const steps = g.steps || [];
    return g.status === 'completed' || (steps.length > 0 && steps.every((s) => s.completed));
  }).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Input invisível para upload rápido de fotos */}
      <input
        ref={quickPhotoInputRef}
        type="file"
        accept="image/*"
        onChange={handleQuickPhotoSelect}
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* NÍVEL 2: CAIXINHA DA META ABERTA (IGUAL NA PARTE DE CADERNO DE ESTUDOS)   */}
      {/* ========================================================================= */}
      {selectedGoal ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 1. BREADCRUMBS & NAVEGAÇÃO DE VOLTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
              <button
                onClick={() => setSelectedGoalId(null)}
                className="text-stone-500 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Minhas Metas</span>
              </button>

              <span className="text-stone-300 dark:text-stone-600">/</span>

              <span className="font-semibold text-stone-900 dark:text-stone-100 truncate flex items-center gap-1.5">
                <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 shrink-0">
                  {selectedGoal.category}
                </span>
                <span className="truncate">{selectedGoal.name}</span>
              </span>
            </div>

            <button
              onClick={() => setSelectedGoalId(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer self-start sm:self-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar às Metas</span>
            </button>
          </div>

          {/* 2. BANNER DA META (ESTILO CADERNO DE ESTUDOS COM FOTO DE INSPIRAÇÃO) */}
          {(() => {
            const palette = getCategoryPalette(selectedGoal.category);
            const goalPhoto = selectedGoal.imageUrl || selectedGoal.image;
            const stepsList = selectedGoal.steps || [];
            const totalSteps = stepsList.length;
            const completedSteps = stepsList.filter((s) => s.completed).length;
            const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
            const isCompleted = selectedGoal.status === 'completed' || (totalSteps > 0 && completedSteps === totalSteps);

            return (
              <div className="relative bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-xs overflow-hidden">
                {/* Faixa superior de destaque com a cor da categoria */}
                <div 
                  className="absolute top-0 left-0 right-0 h-2 z-10" 
                  style={{ backgroundColor: palette.accent }} 
                />

                {/* Foto de Visualização & Inspiração da Meta */}
                {goalPhoto ? (
                  <div className="relative w-full h-56 sm:h-72 overflow-hidden bg-stone-950 group/banner">
                    {/* Fundo ambiente desfocado com as cores da foto para qualquer proporção (Stories 9:16, Feed 4:5, Quadrado 1:1 ou Paisagem 16:9) */}
                    <img
                      src={goalPhoto}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-xl scale-115 opacity-60 pointer-events-none"
                    />
                    <img
                      src={goalPhoto}
                      alt={selectedGoal.name}
                      className="relative z-10 w-full h-full object-cover sm:object-contain object-center group-hover/banner:scale-102 transition duration-500"
                    />
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

                    {/* Botões de Ação na Foto */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoUrl({ url: goalPhoto, title: selectedGoal.name })}
                        className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver foto ampliada</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTargetGoalForQuickPhoto(selectedGoal.id);
                          quickPhotoInputRef.current?.click();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-stone-850 text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Trocar foto</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(selectedGoal)}
                        className="p-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs backdrop-blur-md transition cursor-pointer"
                        title="Remover foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="absolute bottom-4 left-4 sm:left-6 z-20 flex items-center gap-2 text-white/90 text-xs font-medium">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Mural de Inspiração & Visualização</span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-6 px-6 sm:px-8 pb-2">
                    <div className="p-4 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-850/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200">
                            Adicione uma foto de visualização a esta meta
                          </p>
                          <p className="text-xs text-stone-400">
                            Fotos de inspiração mantêm seus objetivos vivos na mente diariamente.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setTargetGoalForQuickPhoto(selectedGoal.id);
                          quickPhotoInputRef.current?.click();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0"
                      >
                        <ImagePlus className="w-4 h-4" />
                        <span>Adicionar foto</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Conteúdo Principal do Banner */}
                <div className="p-6 sm:p-8 space-y-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${palette.badge}`}>
                          {selectedGoal.category}
                        </span>
                        {isCompleted ? (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            Meta Alcançada 🎉
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                            Em andamento
                          </span>
                        )}
                        {selectedGoal.targetDate && (
                          <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Prazo: {formatDateToBrazilian(selectedGoal.targetDate)}
                          </span>
                        )}
                      </div>

                      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                        {selectedGoal.name}
                      </h1>
                    </div>

                    {/* Botões de Ação da Meta */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(selectedGoal)}
                        className="p-2.5 rounded-2xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer flex items-center gap-1.5"
                        title="Editar meta"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span className="hidden xs:inline">Editar</span>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Tem certeza que deseja excluir a meta "${selectedGoal.name}"?`)) {
                            deleteGoal(selectedGoal.id);
                            setSelectedGoalId(null);
                          }
                        }}
                        className="p-2.5 rounded-2xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer flex items-center gap-1.5"
                        title="Excluir meta"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden xs:inline">Excluir</span>
                      </button>
                    </div>
                  </div>

                  {/* Motivação ("Por que quero alcançar isso") */}
                  {selectedGoal.motivation && (
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs sm:text-sm text-amber-900 dark:text-amber-200/90 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Por que quero realizar esta meta: </span>
                        <span className="italic">"{selectedGoal.motivation}"</span>
                      </div>
                    </div>
                  )}

                  {/* Barra de Progresso Elegante */}
                  <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                    <div className="flex justify-between items-center text-xs sm:text-sm font-medium">
                      <span className="text-stone-600 dark:text-stone-400">
                        Progresso dos passos ({completedSteps} de {totalSteps} concluídos)
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {progressPercent}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 3. SEÇÃO DE PASSOS PRÁTICOS (CHECKLIST ESTILO CADERNO DE ESTUDOS) */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <ListChecks className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                    Passos Práticos para Realizar
                  </h2>
                  <p className="text-xs text-stone-400">
                    Divida grandes objetivos em pequenas vitórias diárias.
                  </p>
                </div>
              </div>

              {/* Filtros de passos */}
              {(selectedGoal.steps || []).length > 0 && (
                <div className="flex items-center gap-1.5 self-start sm:self-auto p-1 bg-stone-100/80 dark:bg-stone-800 rounded-xl text-xs">
                  <button
                    onClick={() => setStepFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      stepFilter === 'all'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                        : 'text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setStepFilter('pending')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      stepFilter === 'pending'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                        : 'text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Pendentes
                  </button>
                  <button
                    onClick={() => setStepFilter('completed')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      stepFilter === 'completed'
                        ? 'bg-white dark:bg-stone-700 text-emerald-800 dark:text-emerald-300 shadow-2xs font-semibold'
                        : 'text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Concluídos
                  </button>
                </div>
              )}
            </div>

            {/* Input Rápido de Novo Passo */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newStepTitle}
                onChange={(e) => setNewStepTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInlineStep(selectedGoal);
                  }
                }}
                placeholder="✍️ Adicionar novo passo prático (ex: Treinar 3x por semana, Fazer orçamento...)"
                className="flex-1 px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <button
                type="button"
                onClick={() => handleAddInlineStep(selectedGoal)}
                className="px-4 py-3 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar</span>
              </button>
            </div>

            {/* Lista de Passos */}
            {(() => {
              const allSteps = selectedGoal.steps || [];
              const visibleSteps = allSteps.filter((s) => {
                if (stepFilter === 'pending') return !s.completed;
                if (stepFilter === 'completed') return s.completed;
                return true;
              });

              if (visibleSteps.length === 0) {
                return (
                  <div className="py-8 text-center text-stone-400 text-xs space-y-1">
                    <p>Nenhum passo {stepFilter !== 'all' ? 'neste filtro' : 'adicionado ainda'}.</p>
                    <p className="text-[11px] text-stone-400">
                      Use o campo acima para listar os passos que você precisa dar.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-2 pt-2">
                  {visibleSteps.map((step) => (
                    <div
                      key={step.id}
                      className={`group p-3.5 sm:p-4 rounded-2xl border transition flex items-center justify-between gap-3 select-none ${
                        step.completed
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/50 text-stone-400'
                          : 'bg-white dark:bg-stone-800/60 border-stone-200/80 dark:border-stone-700 hover:border-emerald-500/50 text-stone-800 dark:text-stone-200 shadow-2xs'
                      }`}
                    >
                      <div
                        onClick={() => handleToggleStep(selectedGoal, step.id)}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      >
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition ${
                            step.completed
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'border-2 border-stone-300 dark:border-stone-600 group-hover:border-emerald-500'
                          }`}
                        >
                          {step.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <span
                          className={`text-xs sm:text-sm truncate flex-1 ${
                            step.completed ? 'line-through text-stone-400 dark:text-stone-500' : 'font-medium'
                          }`}
                        >
                          {step.title}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteStep(selectedGoal, step.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition cursor-pointer"
                        title="Remover passo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* NÍVEL 1: VISÃO GERAL DAS METAS (CARDS COM SETA PRO LADO CHEVRONRIGHT)     */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* 1. Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
                  Minhas Metas
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                  {totalGoals === 0
                    ? 'Transforme sonhos em metas visuais e pequenos passos possíveis.'
                    : `${completedGoalsCount} de ${totalGoals} metas alcançadas • Toque na meta para abrir sua área.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenNew}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Meta</span>
              </button>
            </div>
          </div>

          {/* 2. Barra de Busca e Filtros de Status (Não ocupa espaço desnecessário) */}
          {totalGoals > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Barra de busca rápida */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar meta ou categoria..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filtros de status compactos */}
              <div className="flex items-center gap-1 p-1 bg-stone-100/80 dark:bg-stone-850 rounded-2xl border border-stone-200/60 dark:border-stone-800 self-start sm:self-auto text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Todas ({totalGoals})
                </button>
                <button
                  onClick={() => setStatusFilter('in-progress')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                    statusFilter === 'in-progress'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Em andamento ({totalGoals - completedGoalsCount})
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                    statusFilter === 'completed'
                      ? 'bg-white dark:bg-stone-700 text-emerald-800 dark:text-emerald-300 shadow-2xs font-semibold'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Alcançadas ({completedGoalsCount})
                </button>
              </div>
            </div>
          )}

          {/* 3. Grid de Cards de Metas (Estilo Caderno de Estudos com Seta pro Lado) */}
          {filteredGoals.length === 0 ? (
            <div className="p-8 sm:p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
                {totalGoals === 0 ? 'Nenhuma meta cadastrada ainda' : 'Nenhuma meta encontrada'}
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                {totalGoals === 0
                  ? 'Crie sua primeira meta com foto de inspiração e passos organizados.'
                  : 'Tente limpar a busca ou mudar o filtro de status.'}
              </p>
              {totalGoals === 0 && (
                <button
                  onClick={handleOpenNew}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1F3A34] text-white text-xs font-semibold hover:bg-[#162A25] transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar minha primeira meta</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredGoals.map((goal) => {
                const palette = getCategoryPalette(goal.category);
                const stepsList = goal.steps || [];
                const totalSteps = stepsList.length;
                const completedSteps = stepsList.filter((s) => s.completed).length;
                const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
                const isCompleted = goal.status === 'completed' || (totalSteps > 0 && completedSteps === totalSteps);
                const goalPhoto = goal.imageUrl || goal.image;

                return (
                  <div
                    key={goal.id}
                    onClick={() => setSelectedGoalId(goal.id)}
                    className={`group relative bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 p-4 sm:p-4.5 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden hover:-translate-y-1 ${palette.border} w-full`}
                  >
                    {/* Lombada/faixa de destaque na lateral esquerda */}
                    <div 
                      className="absolute top-0 bottom-0 left-0 w-2 transition-all group-hover:w-2.5 z-20" 
                      style={{ backgroundColor: palette.accent }} 
                    />

                    {/* Linha sutil de costura ao lado da lombada */}
                    <div className="absolute top-0 bottom-0 left-2.5 w-px border-r border-dashed border-stone-300/40 dark:border-stone-700/40 z-20" />

                    {/* Conteúdo Principal do Card em formato Deitado / Horizontal */}
                    <div className="pl-1.5 space-y-3.5">
                      {goalPhoto ? (
                        /* ========================================================================= */
                        /* CAPA HORIZONTAL / DEITADA COM FOTO (PROPORÇÃO 16:9 / 16:10)               */
                        /* Suporta perfeitamente: 16:9, 1200x630, 4:5, 9:16 Stories e 1:1 Quadrado    */
                        /* ========================================================================= */
                        <div className="relative w-full aspect-[16/9] sm:aspect-[16/10] rounded-2xl overflow-hidden bg-stone-950 border border-stone-100 dark:border-stone-800 shadow-inner group/cover">
                          {/* 1. Camada de Fundo Ambiente Desfocado (Harmonia com qualquer proporção de foto) */}
                          <img
                            src={goalPhoto}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-60 dark:opacity-45 pointer-events-none"
                          />

                          {/* 2. Camada Principal da Imagem - Sem cortes por padrão */}
                          <img
                            src={goalPhoto}
                            alt={goal.name}
                            className={`relative z-10 w-full h-full ${
                              getGoalFitMode(goal.id) === 'cover' ? 'object-cover object-center' : 'object-contain object-center'
                            } group-hover:scale-102 transition-transform duration-500`}
                          />

                          {/* Gradiente de proteção para textos e botões */}
                          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/15 to-black/40 pointer-events-none" />

                          {/* Badges de Categoria no Topo da Foto */}
                          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-xs">
                              {goal.category}
                            </span>
                            {isCompleted && (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-600/90 text-white backdrop-blur-md shadow-xs">
                                Alcançada 🎉
                              </span>
                            )}
                          </div>

                          {/* Ações Rápidas na Foto (Hover) */}
                          <div 
                            className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 group-hover/cover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => toggleCardFitMode(goal.id, e)}
                              className="p-1.5 rounded-xl bg-black/60 hover:bg-black/85 text-white backdrop-blur-md transition cursor-pointer shadow-xs"
                              title={getGoalFitMode(goal.id) === 'cover' ? 'Ver foto inteira sem corte' : 'Preencher capa'}
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setTargetGoalForQuickPhoto(goal.id);
                                quickPhotoInputRef.current?.click();
                              }}
                              className="p-1.5 rounded-xl bg-white/90 hover:bg-white text-stone-900 backdrop-blur-md transition cursor-pointer shadow-xs"
                              title="Trocar foto"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(goal)}
                              className="p-1.5 rounded-xl bg-rose-600/85 hover:bg-rose-600 text-white backdrop-blur-md transition cursor-pointer shadow-xs"
                              title="Remover foto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Rodapé da Foto: Passos e Progresso */}
                          <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between text-white text-[11px] font-semibold">
                            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-xs">
                              {completedSteps}/{totalSteps} passos
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-600/90 text-white backdrop-blur-md shadow-xs">
                              {progressPercent}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* ========================================================================= */
                        /* CAPA HORIZONTAL / DEITADA SEM FOTO (DESIGN ELEGANTE E ATALHO DE FOTO)     */
                        /* ========================================================================= */
                        <div className="relative w-full aspect-[16/9] sm:aspect-[16/10] rounded-2xl overflow-hidden bg-gradient-to-b from-stone-50 to-stone-100/80 dark:from-stone-850 dark:to-stone-900 border border-stone-200/70 dark:border-stone-800 p-3.5 sm:p-4 flex flex-col justify-between">
                          <div className="absolute inset-0 opacity-15 dark:opacity-10 pointer-events-none bg-[radial-gradient(#78716c_1px,transparent_1px)] [background-size:16px_16px]" />

                          <div className="relative z-10 flex items-start justify-between">
                            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-stone-800 shadow-xs border border-stone-200/80 dark:border-stone-700 flex items-center justify-center text-stone-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                              <Target className="w-5.5 h-5.5" />
                            </div>

                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetGoalForQuickPhoto(goal.id);
                                  quickPhotoInputRef.current?.click();
                                }}
                                className="p-1.5 text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-white dark:hover:bg-stone-800 rounded-xl transition cursor-pointer shadow-2xs"
                                title="Adicionar foto de inspiração"
                              >
                                <Camera className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Centro: Botão amigável de adicionar foto deitada */}
                          <div className="relative z-10 my-auto text-center py-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => {
                                setTargetGoalForQuickPhoto(goal.id);
                                quickPhotoInputRef.current?.click();
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-semibold hover:text-emerald-700 dark:hover:text-emerald-400 border border-stone-200/80 dark:border-stone-700 shadow-2xs hover:shadow-xs transition cursor-pointer"
                            >
                              <ImagePlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Adicionar Foto</span>
                            </button>
                          </div>

                          {/* Base: Categoria e passos */}
                          <div className="relative z-10 flex items-center justify-between">
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${palette.badge}`}>
                              {goal.category}
                            </span>
                            <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                              {totalSteps} {totalSteps === 1 ? 'passo' : 'passos'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Informações da Meta */}
                      <div className="space-y-1">
                        <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors line-clamp-1">
                          {goal.name}
                        </h3>

                        <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed min-h-[2rem]">
                          {goal.motivation ? `"${goal.motivation}"` : 'Toque para abrir a caixinha com passos práticos e foto desta meta.'}
                        </p>
                      </div>
                    </div>

                    {/* Mini barra de progresso + Rodapé com a Seta pro Lado */}
                    <div className="pl-1.5 space-y-3 pt-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-stone-400 font-medium">
                          <span>Progresso</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">{progressPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Rodapé com a Seta pro Lado (ChevronRight) */}
                      <div className="pt-2.5 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Folder className="w-3.5 h-3.5 opacity-70" />
                          <span>Abrir meta</span>
                        </div>
                        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-stone-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE FOTO AMPLIADA (LIGHTBOX)                                         */}
      {/* ========================================================================= */}
      {previewPhotoUrl && (
        <div 
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full bg-white dark:bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800"
          >
            <div className="p-4 flex items-center justify-between border-b border-stone-100 dark:border-stone-800">
              <h4 className="font-serif font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 truncate">
                {previewPhotoUrl.title}
              </h4>
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 bg-stone-100 dark:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 bg-black/95 flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img
                src={previewPhotoUrl.url}
                alt={previewPhotoUrl.title}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE META                                         */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4 my-8 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-serif font-bold text-lg">
                {editingGoalId ? 'Editar Meta' : 'Nova Meta'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4 text-xs sm:text-sm">
              {/* Nome */}
              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  Nome da meta *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Correr minha primeira meia-maratona"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                />
              </div>

              {/* Categoria */}
              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GoalCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                >
                  <option value="Espiritualidade">Espiritualidade</option>
                  <option value="Saúde e corpo">Saúde e corpo</option>
                  <option value="Estudos e mente">Estudos e mente</option>
                  <option value="Finanças">Finanças</option>
                  <option value="Casa e rotina">Casa e rotina</option>
                  <option value="Relacionamentos">Relacionamentos</option>
                  <option value="Projetos pessoais">Projetos pessoais</option>
                </select>
              </div>

              {/* Prazo */}
              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  Data prevista / Prazo
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                />
              </div>

              {/* Motivação */}
              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  Por que essa meta importa para você?
                </label>
                <textarea
                  rows={2}
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="Ex: Para ter mais disposição e cuidar do templo do Espírito Santo..."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 resize-none"
                />
              </div>

              {/* Campo de Foto no Formulário */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1.5 text-xs sm:text-sm">
                    <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Foto de Inspiração / Mural</span>
                  </label>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-xs text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remover foto
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                {imageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 group h-44 w-full bg-stone-950">
                    {/* Fundo ambiente desfocado para fotos verticais e horizontais */}
                    <img
                      src={imageUrl}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-50 pointer-events-none"
                    />
                    <img
                      src={imageUrl}
                      alt="Pré-visualização da meta"
                      className="relative z-10 w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 z-20 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white/95 text-stone-900 text-xs font-semibold hover:bg-white transition flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Trocar foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="w-full py-5 px-3 border border-dashed border-stone-300 dark:border-stone-700 rounded-2xl hover:border-emerald-500 dark:hover:border-emerald-500 bg-stone-50/50 dark:bg-stone-850/50 hover:bg-emerald-50/30 transition flex flex-col items-center justify-center gap-1.5 text-stone-500 dark:text-stone-400 cursor-pointer"
                  >
                    {isProcessingPhoto ? (
                      <span className="text-xs font-medium animate-pulse">Processando imagem...</span>
                    ) : (
                      <>
                        <div className="w-9 h-9 rounded-full bg-white dark:bg-stone-800 flex items-center justify-center shadow-xs">
                          <ImagePlus className="w-4.5 h-4.5 text-emerald-700 dark:text-emerald-400" />
                        </div>
                        <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                          Toque para escolher uma foto de inspiração
                        </span>
                        <span className="text-[11px] text-stone-400 text-center max-w-sm px-2">
                          Compatível com Instagram (Feed 4:5 e 1:1), Stories/Reels (9:16) ou horizontal (16:9). O app ajusta tudo automaticamente!
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Passos no Formulário */}
              <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-stone-700 dark:text-stone-300">
                    Passos para realizar
                  </label>
                  <button
                    type="button"
                    onClick={handleAddStepField}
                    className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar passo
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <span className="text-xs text-stone-400 w-4">{idx + 1}.</span>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => handleStepTitleChange(step.id, e.target.value)}
                        placeholder="Ex: Pesquisar tênis adequado..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                      />
                      {steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStepField(step.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold shadow-xs cursor-pointer"
                >
                  Salvar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
