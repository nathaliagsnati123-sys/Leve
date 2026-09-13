import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Target, Plus, Check, CheckCircle2, ChevronRight, 
  Trash2, Sparkles, X, Flag, Image as ImageIcon, Camera, Upload
} from 'lucide-react';
import { Goal, GoalCategory, GoalStep } from '../../types';
import { formatDateToBrazilian, getTodayDateString } from '../../services/storage';
import confetti from 'canvas-confetti';

export const GoalsView: React.FC = () => {
  const { data, addGoal, updateGoal, deleteGoal, showToast } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<GoalCategory>('Saúde e corpo');
  const [targetDate, setTargetDate] = useState('');
  const [motivation, setMotivation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [steps, setSteps] = useState<{ id: string; title: string; completed: boolean }[]>([
    { id: '1', title: '', completed: false }
  ]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione um arquivo de imagem válido (JPG, PNG, etc).', 'info');
      return;
    }

    setIsProcessingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 900;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const widthRatio = MAX_WIDTH / width;
            const heightRatio = MAX_HEIGHT / height;
            const ratio = Math.min(widthRatio, heightRatio);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context not available');

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);

          setImageUrl(compressedDataUrl);
          showToast('Foto adicionada com sucesso! ✨');
          setIsProcessingPhoto(false);
        } catch (err) {
          console.error('Error processing goal image:', err);
          showToast('Erro ao processar imagem. Tente uma foto menor.', 'info');
          setIsProcessingPhoto(false);
        }
      };
      img.onerror = () => {
        showToast('Não foi possível carregar a imagem selecionada.', 'info');
        setIsProcessingPhoto(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (e.target) {
      e.target.value = '';
    }
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

  const handleOpenEdit = (g: Goal) => {
    setEditingGoalId(g.id);
    setName(g.name);
    setCategory(g.category);
    setTargetDate(g.targetDate || '');
    setMotivation(g.motivation || '');
    setImageUrl(g.imageUrl || g.image || '');
    setSteps(g.steps && g.steps.length > 0 ? g.steps : [{ id: '1', title: '', completed: false }]);
    setIsModalOpen(true);
  };

  const handleAddStepField = () => {
    setSteps([...steps, { id: Date.now().toString(), title: '', completed: false }]);
  };

  const handleRemoveStepField = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleStepTextChange = (index: number, text: string) => {
    const updated = [...steps];
    updated[index].title = text;
    setSteps(updated);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const validSteps: GoalStep[] = steps
      .filter((s) => s.title.trim().length > 0)
      .map((s) => ({
        id: s.id || Math.random().toString(),
        title: s.title.trim(),
        completed: s.completed
      }));

    const cleanImg = imageUrl.trim() || undefined;

    if (editingGoalId) {
      const existing = data.goals.find((g) => g.id === editingGoalId);
      if (existing) {
        updateGoal({
          ...existing,
          name: name.trim(),
          category,
          targetDate: targetDate || undefined,
          motivation: motivation.trim() || undefined,
          imageUrl: cleanImg,
          image: cleanImg,
          steps: validSteps
        });
      }
    } else {
      addGoal({
        name: name.trim(),
        category,
        targetDate: targetDate || undefined,
        motivation: motivation.trim() || undefined,
        imageUrl: cleanImg,
        image: cleanImg,
        status: 'in-progress',
        steps: validSteps
      });
    }

    setIsModalOpen(false);
  };

  const handleToggleStep = (goal: Goal, stepId: string) => {
    const updatedSteps = goal.steps.map((s) =>
      s.id === stepId ? { ...s, completed: !s.completed } : s
    );

    const allDone = updatedSteps.length > 0 && updatedSteps.every((s) => s.completed);

    if (allDone && goal.status !== 'completed') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // fallback
      }
      showToast(`Parabéns! Você alcançou a meta "${goal.name}"! 🎉✨`);
    }

    updateGoal({
      ...goal,
      steps: updatedSteps,
      status: allDone ? 'completed' : 'in-progress'
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              Minhas Metas & Objetivos
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Transforme grandes sonhos em pequenos passos diários e possíveis.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] text-xs sm:text-sm font-semibold transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Criar nova meta</span>
        </button>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {(data.goals || []).map((goal) => {
          const steps = goal.steps || [];
          const totalSteps = steps.length;
          const completedSteps = steps.filter((s) => s.completed).length;
          const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
          const isCompleted = goal.status === 'completed' || (totalSteps > 0 && completedSteps === totalSteps);

          return (
            <div
              key={goal.id}
              className={`rounded-3xl border transition overflow-hidden ${
                isCompleted
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60'
                  : 'bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800 shadow-xs'
              }`}
            >
              {(goal.imageUrl || goal.image) && (
                <div className="relative w-full h-40 sm:h-48 overflow-hidden bg-stone-100 dark:bg-stone-850">
                  <img
                    src={goal.imageUrl || goal.image}
                    alt={goal.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
              )}

              <div className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                        {goal.category}
                      </span>
                      {isCompleted && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          Alcançada 🎉
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 mt-1">
                      {goal.name}
                    </h3>
                    {goal.motivation && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 italic mt-0.5">
                        "Por que: {goal.motivation}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {goal.targetDate && (
                      <div className="text-right text-xs text-stone-400">
                        <span>Prazo: </span>
                        <span className="font-semibold text-stone-700 dark:text-stone-300">
                          {formatDateToBrazilian(goal.targetDate)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 pl-2 border-l border-stone-200 dark:border-stone-800">
                      <button
                        onClick={() => handleOpenEdit(goal)}
                        className="text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 px-2 py-1 rounded"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Excluir meta "${goal.name}"?`)) deleteGoal(goal.id);
                        }}
                        className="p-1 text-stone-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-stone-500 font-medium">
                    <span>Progresso ({completedSteps} de {totalSteps} passos)</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Steps Checklist */}
                {(goal.steps || []).length > 0 && (
                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      Passos práticos:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(goal.steps || []).map((step) => (
                        <div
                          key={step.id}
                          onClick={() => handleToggleStep(goal, step.id)}
                          className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2.5 transition text-xs ${
                            step.completed
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-stone-400 line-through'
                              : 'bg-stone-50/60 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:border-emerald-400'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 ${
                            step.completed ? 'bg-emerald-600 text-white' : 'border border-stone-300'
                          }`}>
                            {step.completed && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="truncate">{step.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4 my-8 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-serif text-lg font-bold">
                {editingGoalId ? 'Editar Meta' : 'Nova Meta'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 bg-stone-100 dark:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-3.5 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  Nome da meta
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Aprender a falar espanhol ou Correr 5km..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-stone-700 dark:text-stone-300">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GoalCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
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

                <div className="space-y-1">
                  <label className="font-medium text-stone-700 dark:text-stone-300">Prazo estimado</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-stone-700 dark:text-stone-300">
                  Por que quero alcançar isso? (Motivação)
                </label>
                <input
                  type="text"
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="Ex: Para ter mais energia para brincar com meus filhos..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                />
              </div>

              {/* Photo attachment field */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1.5 text-xs sm:text-sm">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Foto de inspiração ou lembrete visual</span>
                  </label>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-medium"
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
                  <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 group max-h-48 bg-stone-100 dark:bg-stone-900">
                    <img
                      src={imageUrl}
                      alt="Prévia da meta"
                      className="w-full h-44 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white/90 text-stone-800 text-xs font-semibold hover:bg-white flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Trocar foto
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="px-3 py-1.5 rounded-xl bg-rose-600/90 text-white text-xs font-semibold hover:bg-rose-700 flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="w-full py-4 border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-stone-500 hover:text-emerald-700 dark:hover:text-emerald-400 bg-stone-50/50 dark:bg-stone-850 transition cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium">
                      {isProcessingPhoto ? 'Processando imagem...' : 'Clique para adicionar uma foto (mural de visualização)'}
                    </span>
                    <span className="text-[10px] text-stone-400">JPG, PNG ou WebP</span>
                  </button>
                )}
              </div>

              {/* Steps fields */}
              <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-stone-700 dark:text-stone-300">
                    Passos práticos para alcançar
                  </label>
                  <button
                    type="button"
                    onClick={handleAddStepField}
                    className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    + Adicionar passo
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-stone-400 w-4">{idx + 1}.</span>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => handleStepTextChange(idx, e.target.value)}
                        placeholder={`Passo ${idx + 1}...`}
                        className="flex-1 px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                      />
                      {steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStepField(idx)}
                          className="p-1 text-stone-400 hover:text-rose-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold"
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
