import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Palette, Smile } from 'lucide-react';
import { StudySubject } from '../../types';
import { STUDY_COLORS, STUDY_ICONS, STUDY_SUGGESTIONS, getSubjectColor } from './studyUtils';

interface StudySubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subject: { name: string; color: string; icon: string; description?: string }) => void;
  initialSubject?: StudySubject | null;
  isMale?: boolean;
}

export const StudySubjectModal: React.FC<StudySubjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSubject,
  isMale = false,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('emerald');
  const [icon, setIcon] = useState('📚');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialSubject) {
      setName(initialSubject.name || '');
      setColor(initialSubject.color || 'emerald');
      setIcon(initialSubject.icon || '📚');
      setDescription(initialSubject.description || '');
    } else {
      setName('');
      setColor('emerald');
      setIcon('📚');
      setDescription('');
    }
  }, [initialSubject, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      color,
      icon,
      description: description.trim() || undefined,
    });
  };

  const selectedPalette = getSubjectColor(color);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                {initialSubject ? 'Editar Matéria' : 'Nova Matéria'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {initialSubject ? 'Altere o nome, cor ou ícone da matéria.' : 'Crie um novo caderno para organizar seus documentos de estudo.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Quick Suggestions (only when creating new) */}
          {!initialSubject && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Sugestões Rápidas
              </label>
              <div className="flex flex-wrap gap-1.5">
                {STUDY_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug.name}
                    type="button"
                    onClick={() => {
                      setName(sug.name);
                      setIcon(sug.icon);
                      setColor(sug.color);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer"
                  >
                    <span>{sug.icon}</span>
                    <span>{sug.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nome da Matéria */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Nome da Matéria <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Administração, Direito, Concurso Público..."
              className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Escolha do Ícone */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
              <Smile className="w-3.5 h-3.5 text-stone-400" />
              <span>Ícone da Matéria</span>
            </div>
            <div className="grid grid-cols-8 gap-1.5 p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-800">
              {STUDY_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`text-xl p-2 rounded-xl transition flex items-center justify-center cursor-pointer ${
                    icon === emoji
                      ? 'bg-white dark:bg-stone-700 shadow-xs ring-2 ring-emerald-500 scale-110'
                      : 'hover:bg-stone-200/60 dark:hover:bg-stone-800'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Escolha da Cor */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
              <Palette className="w-3.5 h-3.5 text-stone-400" />
              <span>Cor do Caderno</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STUDY_COLORS.map((palette) => {
                const isSelected = color === palette.id;
                return (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => setColor(palette.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-2xl border transition text-left cursor-pointer ${
                      isSelected
                        ? `${palette.bgSoft} border-stone-900 dark:border-stone-100 ring-1 ring-stone-900 dark:ring-stone-100`
                        : 'bg-white dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 hover:border-stone-300'
                    }`}
                  >
                    <div 
                      className="w-4 h-4 rounded-full shrink-0 shadow-2xs" 
                      style={{ backgroundColor: palette.accent }}
                    />
                    <span className="text-xs font-medium text-stone-800 dark:text-stone-200 truncate">
                      {palette.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Descrição Opcional */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Descrição ou Objetivo (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Foco na prova do segundo semestre, 12 capítulos..."
              className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-white shadow-xs transition cursor-pointer disabled:opacity-50 ${
                isMale ? 'bg-[#1F3A34] hover:bg-[#162924]' : 'bg-[#1F3A34] hover:bg-[#162924]'
              }`}
            >
              <FolderPlus className="w-4 h-4" />
              <span>{initialSubject ? 'Salvar Alterações' : 'Criar Matéria'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
