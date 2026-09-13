import React, { useState, useEffect, useRef } from 'react';
import { X, FolderPlus, Palette, Smile, Camera, Upload, Trash2, ImagePlus } from 'lucide-react';
import { StudySubject } from '../../types';
import { STUDY_COLORS, STUDY_ICONS, STUDY_SUGGESTIONS, getSubjectColor, compressImageFile } from './studyUtils';

interface StudySubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subject: { name: string; color: string; icon: string; description?: string; coverUrl?: string }) => void;
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
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialSubject) {
      setName(initialSubject.name || '');
      setColor(initialSubject.color || 'emerald');
      setIcon(initialSubject.icon || '📚');
      setDescription(initialSubject.description || '');
      setCoverUrl(initialSubject.coverUrl || initialSubject.imageUrl || '');
    } else {
      setName('');
      setColor('emerald');
      setIcon('📚');
      setDescription('');
      setCoverUrl('');
    }
  }, [initialSubject, isOpen]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    try {
      const compressed = await compressImageFile(file);
      setCoverUrl(compressed);
    } catch (err) {
      console.error('Erro ao comprimir imagem de capa:', err);
    } finally {
      setIsProcessingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      color,
      icon,
      description: description.trim() || undefined,
      coverUrl: coverUrl || undefined,
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

          {/* Foto de Capa da Matéria */}
          <div className="space-y-2 pt-1 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
                <Camera className="w-3.5 h-3.5 text-stone-400" />
                <span>Foto de Capa do Caderno (opcional)</span>
              </div>
              {coverUrl && (
                <button
                  type="button"
                  onClick={() => setCoverUrl('')}
                  className="text-xs text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remover capa</span>
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

            {coverUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 group h-44 w-full bg-stone-950">
                {/* Fundo ambiente desfocado */}
                <img
                  src={coverUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-50 pointer-events-none"
                />
                <img
                  src={coverUrl}
                  alt="Capa da matéria"
                  className="relative z-10 w-full h-full object-contain"
                />
                <div className="absolute inset-0 z-20 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white/95 text-stone-900 text-xs font-semibold hover:bg-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
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
                  <span className="text-xs font-medium animate-pulse">Otimizando foto de capa...</span>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-full bg-white dark:bg-stone-800 flex items-center justify-center shadow-xs">
                      <ImagePlus className="w-4.5 h-4.5 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Escolher foto de capa para o caderno
                    </span>
                    <span className="text-[11px] text-stone-400 text-center max-w-sm px-2">
                      Compatível com Instagram (Feed 4:5 e 1:1), Stories/Reels (9:16) ou horizontal (16:9). O app ajusta tudo automaticamente!
                    </span>
                  </>
                )}
              </button>
            )}
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
