import React from 'react';
import { Folder, MoreVertical, Edit3, Trash2, FileText, ChevronRight } from 'lucide-react';
import { StudySubject } from '../../types';
import { getSubjectColor } from './studyUtils';

interface StudySubjectCardProps {
  subject: StudySubject;
  documentsCount: number;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const StudySubjectCard: React.FC<StudySubjectCardProps> = ({
  subject,
  documentsCount,
  onOpen,
  onEdit,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const palette = getSubjectColor(subject.color);

  React.useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = () => setMenuOpen(false);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, [menuOpen]);

  return (
    <div
      onClick={onOpen}
      className={`group relative bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden hover:-translate-y-0.5 ${palette.border}`}
    >
      {/* Top folder accent stripe */}
      <div 
        className="absolute top-0 left-0 right-0 h-1.5 transition-all group-hover:h-2"
        style={{ backgroundColor: palette.accent }}
      />

      {/* Card Header: Icon, Badge, and Action Menu */}
      <div className="flex items-start justify-between gap-2 pt-1">
        <div className="flex items-center gap-3">
          <div className="text-3xl p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-100 dark:border-stone-700/50 flex items-center justify-center transition-transform group-hover:scale-105">
            {subject.icon || '📚'}
          </div>
          <div>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${palette.badge}`}>
              {documentsCount} {documentsCount === 1 ? 'documento' : 'documentos'}
            </span>
          </div>
        </div>

        {/* Options Menu Button */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition cursor-pointer"
            title="Opções da matéria"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
                className="w-full px-3.5 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 text-left cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-stone-400" />
                <span>Editar Matéria</span>
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="w-full px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 text-left cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Excluir Matéria</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Subject Name and Description */}
      <div className="my-4 space-y-1">
        <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors line-clamp-1">
          {subject.name}
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed min-h-[2rem]">
          {subject.description || 'Caderno pessoal de anotações, resumos e documentos de aula.'}
        </p>
      </div>

      {/* Card Footer */}
      <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition">
        <div className="flex items-center gap-1.5 font-medium">
          <Folder className="w-3.5 h-3.5 opacity-70" />
          <span>Abrir pasta de estudos</span>
        </div>
        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};
