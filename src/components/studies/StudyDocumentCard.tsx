import React from 'react';
import { FileText, Star, Clock, MoreVertical, Edit3, Trash2, ArrowRight } from 'lucide-react';
import { StudySummary } from '../../types';
import { extractTextPreview } from './studyUtils';

interface StudyDocumentCardProps {
  document: StudySummary;
  onOpen: () => void;
  onRename?: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

export const StudyDocumentCard: React.FC<StudyDocumentCardProps> = ({
  document,
  onOpen,
  onRename,
  onDelete,
  onToggleFavorite,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = () => setMenuOpen(false);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, [menuOpen]);

  const preview = extractTextPreview(document.content, 140);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'dominado':
        return { label: 'Dominado', classes: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' };
      case 'em_revisao':
        return { label: 'Em Revisão', classes: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800' };
      case 'revisado':
        return { label: 'Revisado', classes: 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800' };
      case 'novo':
      default:
        return { label: 'Novo', classes: 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800' };
    }
  };

  const statusBadge = getStatusBadge(document.reviewStatus);

  const formattedDate = React.useMemo(() => {
    try {
      const date = new Date(document.updatedAt || document.createdAt);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  }, [document.updatedAt, document.createdAt]);

  return (
    <div
      onClick={onOpen}
      className="group relative bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 hover:-translate-y-0.5 hover:border-emerald-600/40 dark:hover:border-emerald-500/40"
    >
      <div className="space-y-3">
        {/* Top bar: Document Icon + Status + Favorite + Menu */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
              <FileText className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge.classes}`}>
              {statusBadge.label}
            </span>
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onToggleFavorite}
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                document.favorite
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                  : 'text-stone-300 hover:text-amber-500'
              }`}
              title={document.favorite ? 'Remover dos favoritos' : 'Favoritar documento'}
            >
              <Star className={`w-4 h-4 ${document.favorite ? 'fill-amber-500' : ''}`} />
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                title="Mais opções"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpen();
                    }}
                    className="w-full px-3.5 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 text-left cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-stone-400" />
                    <span>Abrir / Editar</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className="w-full px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 text-left cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Excluir Documento</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title & Preview */}
        <div className="space-y-1.5">
          <h4 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors line-clamp-1">
            {document.title || 'Documento sem título'}
          </h4>
          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-3 leading-relaxed">
            {preview}
          </p>
        </div>
      </div>

      {/* Footer: Date & Open indicator */}
      <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
        <div className="flex items-center gap-1.5 text-[11px]">
          <Clock className="w-3 h-3" />
          <span>Atualizado em {formattedDate}</span>
        </div>

        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 text-xs group-hover:underline">
          <span>Abrir</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </div>
  );
};
