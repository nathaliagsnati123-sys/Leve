import React, { useState } from 'react';
import { Compass, Sparkles, Heart, Plus, Edit2, Trash2, CheckCircle2, ArrowRight } from 'lucide-react';
import { MyLifeDream, DreamStatus } from '../../types';

interface DreamsSectionProps {
  dreams: MyLifeDream[];
  onAdd: () => void;
  onEdit: (dream: MyLifeDream) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const DreamsSection: React.FC<DreamsSectionProps> = ({
  dreams,
  onAdd,
  onEdit,
  onDelete,
  onToggleFavorite
}) => {
  const [filter, setFilter] = useState<'all' | DreamStatus | 'favorites'>('all');

  const filtered = dreams.filter((d) => {
    if (filter === 'all') return true;
    if (filter === 'favorites') return d.favorite;
    return d.status === filter;
  });

  const getStatusLabel = (status: DreamStatus) => {
    switch (status) {
      case 'want_to_realize': return 'Quero realizar';
      case 'in_progress': return 'Em andamento';
      case 'completed': return 'Realizado ✨';
    }
  };

  const getStatusColor = (status: DreamStatus) => {
    switch (status) {
      case 'in_progress': 
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'completed': 
        return 'bg-[#1F3A34] text-white border-[#1F3A34]';
      case 'want_to_realize': 
        return 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action and filter bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
              filter === 'all'
                ? 'bg-[#1F3A34] text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/80 dark:hover:bg-stone-700'
            }`}
          >
            Todos ({dreams.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('want_to_realize')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
              filter === 'want_to_realize'
                ? 'bg-[#1F3A34] text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/80 dark:hover:bg-stone-700'
            }`}
          >
            Quero realizar ({dreams.filter((d) => d.status === 'want_to_realize').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('in_progress')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
              filter === 'in_progress'
                ? 'bg-[#1F3A34] text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/80 dark:hover:bg-stone-700'
            }`}
          >
            Em andamento ({dreams.filter((d) => d.status === 'in_progress').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
              filter === 'completed'
                ? 'bg-[#1F3A34] text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/80 dark:hover:bg-stone-700'
            }`}
          >
            Realizados ({dreams.filter((d) => d.status === 'completed').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('favorites')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
              filter === 'favorites'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/80 dark:hover:bg-stone-700'
            }`}
          >
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>Favoritos ({dreams.filter((d) => d.favorite).length})</span>
          </button>
        </div>

        {/* Add button */}
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Sonho</span>
        </button>
      </div>

      {/* Grid of Dreams */}
      {filtered.length === 0 ? (
        <div className="text-center py-14 px-4 bg-white/70 dark:bg-stone-900/60 rounded-3xl border border-stone-200/70 dark:border-stone-800/80">
          <Compass className="w-10 h-10 mx-auto text-stone-400 dark:text-stone-600 mb-3" />
          <h3 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">
            Nenhum sonho registrado
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1 mb-4">
            Coloque no papel suas aspirações, viagens dos sonhos, projetos de vida e pequenas vitórias que deseja alcançar.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F3A34] text-white text-xs font-medium shadow-xs transition hover:bg-[#162A25] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar o primeiro sonho</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dream) => (
            <div
              key={dream.id}
              className="group bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/70 dark:border-stone-800/80 hover:border-emerald-300 dark:hover:border-emerald-800/60 transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Header line with Category + Status + Favorite */}
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {dream.category && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/70 dark:border-stone-700">
                        {dream.category}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(dream.status)}`}>
                      {getStatusLabel(dream.status)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleFavorite(dream.id)}
                    className="p-1 text-stone-300 dark:text-stone-600 hover:text-rose-500 transition cursor-pointer"
                    title={dream.favorite ? 'Remover dos favoritos' : 'Favoritar'}
                  >
                    <Heart className={`w-4 h-4 ${dream.favorite ? 'text-rose-500 fill-rose-500' : ''}`} />
                  </button>
                </div>

                {/* Optional Image */}
                {dream.imageUrl && (
                  <div className="h-32 w-full rounded-xl overflow-hidden mb-3 bg-stone-100 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700">
                    <img
                      src={dream.imageUrl}
                      alt={dream.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Title */}
                <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  {dream.title}
                </h4>

                {/* Description */}
                {dream.description && (
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                    {dream.description}
                  </p>
                )}

                {/* Next step / Pequena meta */}
                {dream.nextStep && (
                  <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-0.5">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>Próximo Passo Prático</span>
                    </div>
                    <p className="text-xs text-stone-700 dark:text-stone-200 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{dream.nextStep}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-1.5 pt-3 mt-4 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => onEdit(dream)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(dream.id)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
