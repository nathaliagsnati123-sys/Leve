import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Calendar, Clock, Tag, Repeat, Flag, Trash2, Copy, Check } from 'lucide-react';
import { Priority, TaskCategory, TaskRepeat } from '../../types';
import { getTodayDateString } from '../../services/storage';

export const TaskModal: React.FC = () => {
  const { 
    isTaskModalOpen, 
    setIsTaskModalOpen, 
    editingTask, 
    setEditingTask,
    addTask, 
    updateTask, 
    deleteTask, 
    duplicateTask 
  } = useApp();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<TaskCategory>('Pessoal');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [repeat, setRepeat] = useState<TaskRepeat>('none');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDate(editingTask.date || getTodayDateString());
      setTime(editingTask.time || '');
      setPriority(editingTask.priority || 'medium');
      const standardCategories = ['Estudos', 'Trabalho', 'Casa', 'Pessoal', 'Saúde', 'Financeiro', 'Família', 'Outros'];
      if (standardCategories.includes(editingTask.category)) {
        setCategory(editingTask.category);
        setIsCustomCategory(false);
      } else {
        setIsCustomCategory(true);
        setCustomCategory(editingTask.category);
      }
      setRepeat(editingTask.repeat || 'none');
    } else {
      setTitle('');
      setDate(getTodayDateString());
      setTime('');
      setPriority('medium');
      setCategory('Pessoal');
      setIsCustomCategory(false);
      setCustomCategory('');
      setRepeat('none');
    }
  }, [editingTask, isTaskModalOpen]);

  if (!isTaskModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategory = isCustomCategory && customCategory.trim() ? customCategory.trim() : category;

    if (editingTask) {
      updateTask({
        ...editingTask,
        title: title.trim(),
        date,
        time: time || undefined,
        priority,
        category: finalCategory,
        repeat
      });
    } else {
      addTask({
        title: title.trim(),
        date,
        time: time || undefined,
        priority,
        category: finalCategory,
        repeat
      });
    }

    handleClose();
  };

  const handleClose = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleDelete = () => {
    if (!editingTask) return;
    if (window.confirm('Deseja realmente remover esta tarefa?')) {
      deleteTask(editingTask.id);
      handleClose();
    }
  };

  const handleDuplicate = () => {
    if (!editingTask) return;
    duplicateTask(editingTask.id);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-5 sm:p-7 space-y-5 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <h3 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
            {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h3>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 bg-stone-100 dark:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* O que você precisa fazer? */}
          <div className="space-y-1.5">
            <label className="font-medium text-stone-700 dark:text-stone-300">
              O que você precisa fazer?
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Fazer revisão de biologia ou regar as plantas..."
              className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-300">
                <Calendar className="w-4 h-4 text-stone-500" />
                <span>Quando?</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-300">
                <Clock className="w-4 h-4 text-stone-500" />
                <span>Horário? (opcional)</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
              />
            </div>
          </div>

          {/* Prioridade */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-300">
              <Flag className="w-4 h-4 text-stone-500" />
              <span>Prioridade</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-medium transition ${
                  priority === 'high'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-800 dark:text-rose-300'
                    : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                }`}
              >
                <span>🔴</span>
                <span>Alta</span>
              </button>
              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-medium transition ${
                  priority === 'medium'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-800 dark:text-amber-300'
                    : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                }`}
              >
                <span>🟡</span>
                <span>Média</span>
              </button>
              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-medium transition ${
                  priority === 'low'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 dark:text-emerald-300'
                    : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                }`}
              >
                <span>🟢</span>
                <span>Baixa</span>
              </button>
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-300">
                <Tag className="w-4 h-4 text-stone-500" />
                <span>Categoria</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomCategory(!isCustomCategory)}
                className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                {isCustomCategory ? 'Usar categorias padrão' : '+ Categoria personalizada'}
              </button>
            </div>

            {isCustomCategory ? (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Ex: Reforma da casa, Proj. TCC..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
              />
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
              >
                <option value="Estudos">📚 Estudos</option>
                <option value="Trabalho">💼 Trabalho</option>
                <option value="Casa">🏠 Casa</option>
                <option value="Pessoal">❤️ Pessoal</option>
                <option value="Saúde">🏃 Saúde</option>
                <option value="Financeiro">💰 Financeiro</option>
                <option value="Família">👥 Família</option>
                <option value="Outros">📌 Outros</option>
              </select>
            )}
          </div>

          {/* Repetir? */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-300">
              <Repeat className="w-4 h-4 text-stone-500" />
              <span>Repetir?</span>
            </label>
            <select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value as TaskRepeat)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
            >
              <option value="none">Não repetir</option>
              <option value="daily">Todos os dias</option>
              <option value="weekly">Toda semana</option>
              <option value="monthly">Todo mês</option>
            </select>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-between border-t border-stone-100 dark:border-stone-800">
            {editingTask ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  title="Excluir tarefa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleDuplicate}
                  className="p-2 rounded-xl text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                  title="Duplicar tarefa"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold transition shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Salvar tarefa</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
