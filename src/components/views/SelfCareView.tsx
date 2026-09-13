import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Heart, Zap, Check, Plus, Trash2, Edit3, Sparkles, X } from 'lucide-react';
import { getTodayDateString } from '../../services/storage';
import { normalizeTreatmentPreference } from '../../utils/treatment';
import { SelfCareAction } from '../../types';

export const SelfCareView: React.FC = () => {
  const { 
    data, 
    toggleSelfCareAction, 
    addCustomSelfCareAction, 
    updateSelfCareAction, 
    deleteSelfCareAction, 
    showToast 
  } = useApp();

  const todayStr = getTodayDateString();
  const pref = normalizeTreatmentPreference(data.user?.treatmentPreference);
  const isMale = pref === 'masculino';

  const completedToday = data.selfCareCompleted?.[todayStr] || [];
  const userActions: SelfCareAction[] = data.selfCareList || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<SelfCareAction | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState(isMale ? 'Foco & Energia' : 'Corpo');
  const [activeCategory, setActiveCategory] = useState<string>('Todos');

  // Quick inline add
  const [quickTitle, setQuickTitle] = useState('');

  const categories = isMale 
    ? ['Foco & Energia', 'Corpo', 'Mente', 'Descanso', 'Rotina', 'Outro']
    : ['Corpo', 'Mente', 'Coração', 'Descanso', 'Rotina', 'Outro'];

  // Distinct categories from user's actual items
  const userCategories = Array.from(new Set(userActions.map(a => a.category || (isMale ? 'Recarga' : 'Cuidado'))));

  const filteredActions = activeCategory === 'Todos'
    ? userActions
    : userActions.filter(a => (a.category || (isMale ? 'Recarga' : 'Cuidado')) === activeCategory);

  const title = isMale ? 'Recarga & Força' : 'Meu Autocuidado';
  const subtitle = isMale
    ? 'Suas pausas, hábitos de recuperação e recarga de energia de acordo com a sua rotina e realidade.'
    : pref === 'feminino'
    ? 'Suas pausas de acolhimento, cuidado e carinho de acordo com a sua vida e a sua realidade.'
    : 'Suas práticas de cuidado e equilíbrio de acordo com o seu dia a dia.';

  const handleOpenAdd = () => {
    setEditingAction(null);
    setFormTitle('');
    setFormCategory(isMale ? 'Foco & Energia' : 'Corpo');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (action: SelfCareAction) => {
    setEditingAction(action);
    setFormTitle(action.title);
    setFormCategory(action.category || (isMale ? 'Foco & Energia' : 'Corpo'));
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Por favor, informe a ação ou hábito.');
      return;
    }

    if (editingAction) {
      updateSelfCareAction({
        ...editingAction,
        title: formTitle.trim(),
        category: formCategory.trim() || undefined
      });
    } else {
      addCustomSelfCareAction(formTitle.trim(), formCategory.trim());
    }

    setIsModalOpen(false);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    addCustomSelfCareAction(quickTitle.trim(), isMale ? 'Foco & Energia' : 'Cuidado');
    setQuickTitle('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className={`p-3.5 rounded-2xl ${
            isMale
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
          }`}>
            {isMale ? (
              <Zap className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
            ) : (
              <Heart className="w-6 h-6 fill-rose-300 dark:fill-rose-700 text-rose-700 dark:text-rose-300" />
            )}
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`text-xs px-3.5 py-2 rounded-2xl border ${
            isMale
              ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 font-medium'
              : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 font-medium'
          }`}>
            Hoje: <strong>{completedToday.length}</strong> de <strong>{userActions.length}</strong> feitos
          </div>

          <button
            id="btn-add-selfcare-action"
            onClick={handleOpenAdd}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold text-white shadow-xs transition cursor-pointer shrink-0 ${
              isMale ? 'bg-[#1F3A34] hover:bg-[#162924]' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Ação</span>
          </button>
        </div>
      </div>

      {/* Quick Add Bar */}
      <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-2">
        <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
          {isMale
            ? 'Adicionar o que você faz para recarregar as energias e focar na sua vida:'
            : 'Adicionar o que você faz para se cuidar no seu dia a dia:'}
        </label>
        <form onSubmit={handleQuickAdd} className="flex gap-2">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder={
              isMale
                ? 'Ex: Banho relaxante, 15 min sem celular, alongamento na cadeira, leitura tranquila...'
                : 'Ex: Fazer skincare com calma, preparar um chá quentinho, parar 10 min para respirar...'
            }
            className="flex-1 px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className={`px-5 py-2.5 rounded-2xl text-white text-xs sm:text-sm font-semibold disabled:opacity-40 cursor-pointer transition shrink-0 ${
              isMale ? 'bg-[#1F3A34] hover:bg-[#162924]' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            Salvar
          </button>
        </form>
      </div>

      {/* Category filters if user has multiple categories */}
      {userCategories.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-stone-400 font-medium">Categorias:</span>
          {['Todos', ...userCategories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeCategory === cat
                  ? isMale
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                    : 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* List of User's Actions */}
      {userActions.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 p-8 sm:p-12 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 text-center space-y-4">
          <div className={`w-16 h-16 mx-auto rounded-3xl flex items-center justify-center ${
            isMale ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
          }`}>
            {isMale ? <Zap className="w-8 h-8" /> : <Heart className="w-8 h-8" />}
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
              {isMale
                ? 'Nenhuma ação de recarga cadastrada'
                : 'Nenhum momento de autocuidado cadastrado'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              {isMale
                ? 'Este é o seu espaço pessoal de recuperação. Adicione as coisas reais que você costuma fazer para descansar, recuperar a força e clarear a mente.'
                : 'Este é o seu espaço de cuidado. Adicione os momentos reais que fazem sentido para a sua vida, seja um banho relaxante, uma pausa para um chá ou cuidar da pele.'}
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-white shadow-xs transition cursor-pointer ${
              isMale ? 'bg-[#1F3A34] hover:bg-[#162924]' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Minha Primeira Ação</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {filteredActions.map((item) => {
            const isDone = completedToday.includes(item.id) || completedToday.includes(item.title);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-3xl border transition flex flex-col justify-between space-y-3 relative group ${
                  isDone
                    ? isMale
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700'
                }`}
              >
                {/* Card Top */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500">
                      {item.category || (isMale ? 'Recarga' : 'Cuidado')}
                    </span>

                    {/* Edit & Delete icons */}
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(item);
                        }}
                        className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSelfCareAction(item.id);
                        }}
                        className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p 
                    onClick={() => toggleSelfCareAction(item.id)}
                    className="text-xs sm:text-sm font-semibold pt-1 leading-snug cursor-pointer select-none"
                  >
                    {item.title}
                  </p>
                </div>

                {/* Card Bottom: Toggle done */}
                <div 
                  onClick={() => toggleSelfCareAction(item.id)}
                  className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800/80 cursor-pointer select-none"
                >
                  <span className="text-[11px] text-stone-400">
                    {isDone 
                      ? isMale ? 'Concluído hoje ✓' : 'Feito hoje ❤️' 
                      : 'Toque para marcar'}
                  </span>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                    isDone 
                      ? isMale ? 'bg-emerald-700 text-white' : 'bg-rose-600 text-white' 
                      : 'border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800'
                  }`}>
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                {editingAction 
                  ? 'Editar Ação' 
                  : isMale ? 'Adicionar Ação de Recarga & Força' : 'Adicionar Ação de Autocuidado'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  O que você faz? *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={
                    isMale 
                      ? 'Ex: Banho relaxante, leitura, desconectar 1h antes de dormir...' 
                      : 'Ex: Skincare noturno, banho morno, chá relaxante, respirar com calma...'
                  }
                  className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Categoria
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-2xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-2xl text-xs font-semibold text-white shadow-xs transition cursor-pointer ${
                    isMale ? 'bg-[#1F3A34] hover:bg-[#162924]' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {editingAction ? 'Salvar Alterações' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
