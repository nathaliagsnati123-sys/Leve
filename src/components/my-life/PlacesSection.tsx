import React, { useState } from 'react';
import { MapPin, Heart, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { MyLifePlace, PlaceStatus } from '../../types';

interface PlacesSectionProps {
  places: MyLifePlace[];
  onAdd: () => void;
  onEdit: (place: MyLifePlace) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const PlacesSection: React.FC<PlacesSectionProps> = ({
  places,
  onAdd,
  onEdit,
  onDelete,
  onToggleFavorite
}) => {
  const [filter, setFilter] = useState<'all' | PlaceStatus | 'favorites'>('all');

  const filtered = places.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'favorites') return p.favorite;
    return p.status === filter;
  });

  const getStatusLabel = (status: PlaceStatus) => {
    switch (status) {
      case 'want_to_visit': return 'Quero conhecer';
      case 'visited': return 'Já conheci';
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
            Todos ({places.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('want_to_visit')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
              filter === 'want_to_visit'
                ? 'bg-[#1F3A34] text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/80 dark:hover:bg-stone-700'
            }`}
          >
            Quero conhecer ({places.filter((p) => p.status === 'want_to_visit').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('visited')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
              filter === 'visited'
                ? 'bg-[#1F3A34] text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/80 dark:hover:bg-stone-700'
            }`}
          >
            Já conheci ({places.filter((p) => p.status === 'visited').length})
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
            <span>Favoritos ({places.filter((p) => p.favorite).length})</span>
          </button>
        </div>

        {/* Add button */}
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Lugar</span>
        </button>
      </div>

      {/* Grid of Places */}
      {filtered.length === 0 ? (
        <div className="text-center py-14 px-4 bg-white/70 dark:bg-stone-900/60 rounded-3xl border border-stone-200/70 dark:border-stone-800/80">
          <MapPin className="w-10 h-10 mx-auto text-stone-400 dark:text-stone-600 mb-3" />
          <h3 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">
            Nenhum lugar cadastrado
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1 mb-4">
            Guarde cidades, cafeterias, museus, praias e cantinhos especiais que você sonha em visitar.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F3A34] text-white text-xs font-medium shadow-xs transition hover:bg-[#162A25] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar o primeiro lugar</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((place) => (
            <div
              key={place.id}
              className="group bg-white dark:bg-stone-900 rounded-2xl overflow-hidden border border-stone-200/70 dark:border-stone-800/80 hover:border-emerald-300 dark:hover:border-emerald-800/60 transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Image Cover or Stylized header */}
                {place.coverUrl ? (
                  <div className="h-36 w-full overflow-hidden bg-stone-100 dark:bg-stone-800 relative">
                    <img
                      src={place.coverUrl}
                      alt={place.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute top-2.5 right-2.5">
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(place.id)}
                        className="p-1.5 rounded-full bg-white/90 dark:bg-stone-900/90 text-stone-400 hover:text-rose-500 shadow-xs transition cursor-pointer"
                      >
                        <Heart className={`w-4 h-4 ${place.favorite ? 'text-rose-500 fill-rose-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-24 w-full bg-gradient-to-br from-emerald-50 to-stone-100 dark:from-stone-850 dark:to-stone-800 flex items-center justify-between px-4 relative border-b border-stone-100 dark:border-stone-800">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-stone-800 border border-emerald-200/60 dark:border-emerald-800 flex items-center justify-center text-[#1F3A34] dark:text-emerald-400 shadow-xs">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(place.id)}
                      className="p-1.5 rounded-full bg-white dark:bg-stone-800 text-stone-400 hover:text-rose-500 shadow-xs transition cursor-pointer"
                    >
                      <Heart className={`w-4 h-4 ${place.favorite ? 'text-rose-500 fill-rose-500' : ''}`} />
                    </button>
                  </div>
                )}

                {/* Content */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      place.status === 'visited'
                        ? 'bg-[#1F3A34] text-white border-[#1F3A34]'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                    }`}>
                      {place.status === 'visited' && <CheckCircle2 className="w-2.5 h-2.5" />}
                      <span>{getStatusLabel(place.status)}</span>
                    </span>

                    {!place.coverUrl && (
                      <span className="text-[11px] text-stone-400">
                        {place.country || ''}
                      </span>
                    )}
                  </div>

                  <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 line-clamp-1">
                    {place.name}
                  </h4>

                  {(place.city || place.country) && (
                    <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        {[place.city, place.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}

                  {place.notes && (
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-2.5 pt-2.5 border-t border-stone-100 dark:border-stone-800 line-clamp-2 italic">
                      "{place.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-1.5 px-4 pb-4 pt-1">
                <button
                  type="button"
                  onClick={() => onEdit(place)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(place.id)}
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
