import React, { useState } from 'react';
import { 
  Heart, Plus, Edit2, Trash2, BookOpen, Palette, Music, 
  Camera, Activity, Utensils, Coffee, Scissors, Dumbbell, Sparkles, Target
} from 'lucide-react';
import { MyLifeHobby, HobbyStatus } from '../../types';

interface HobbiesSectionProps {
  hobbies: MyLifeHobby[];
  onAdd: () => void;
  onEdit: (hobby: MyLifeHobby) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  BookOpen,
  Palette,
  Music,
  Camera,
  Activity,
  Utensils,
  Coffee,
  Scissors,
  Dumbbell,
  Sparkles,
};

export const HobbiesSection: React.FC<HobbiesSectionProps> = ({
  hobbies,
  onAdd,
  onEdit,
  onDelete,
  onToggleFavorite
}) => {
  const [filter, setFilter] = useState<'all' | HobbyStatus | 'favorites'>('all');

  const filtered = hobbies.filter((h) => {
    if (filter === 'all') return true;
    if (filter === 'favorites') return h.favorite;
    return h.status === filter;
  });

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
            Todos ({hobbies.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('current')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
              filter === 'current'
                ? 'bg-[#1F3A34] text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/80 dark:hover:bg-stone-700'
            }`}
          >
            Hobbies Atuais ({hobbies.filter((h) => h.status === 'current').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('wishlist')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
              filter === 'wishlist'
                ? 'bg-[#1F3A34] text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/80 dark:hover:bg-stone-700'
            }`}
          >
            Quero experimentar ({hobbies.filter((h) => h.status === 'wishlist').length})
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
            <span>Favoritos ({hobbies.filter((h) => h.favorite).length})</span>
          </button>
        </div>

        {/* Add button */}
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Hobby</span>
        </button>
      </div>

      {/* Grid of Hobbies */}
      {filtered.length === 0 ? (
        <div className="text-center py-14 px-4 bg-white/70 dark:bg-stone-900/60 rounded-3xl border border-stone-200/70 dark:border-stone-800/80">
          <Palette className="w-10 h-10 mx-auto text-stone-400 dark:text-stone-600 mb-3" />
          <h3 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">
            Nenhum hobby cadastrado
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1 mb-4">
            Registre suas paixões, momentos de criatividade e atividades que te trazem bem-estar e leveza.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F3A34] text-white text-xs font-medium shadow-xs transition hover:bg-[#162A25] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar o primeiro hobby</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((hobby) => {
            const IconComponent = ICON_MAP[hobby.icon || 'Sparkles'] || Sparkles;
            const accentColor = hobby.accentColor || '#1F3A34';
            return (
              <div
                key={hobby.id}
                className="group bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/70 dark:border-stone-800/80 hover:border-emerald-300 dark:hover:border-emerald-800/60 transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Top line with Icon & Favorite */}
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: accentColor }}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        hobby.status === 'current'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                      }`}>
                        {hobby.status === 'current' ? 'Meu Hobby Atual' : 'Quero experimentar'}
                      </span>

                      <button
                        type="button"
                        onClick={() => onToggleFavorite(hobby.id)}
                        className="p-1 text-stone-300 dark:text-stone-600 hover:text-rose-500 transition cursor-pointer"
                        title={hobby.favorite ? 'Remover dos favoritos' : 'Favoritar'}
                      >
                        <Heart className={`w-4 h-4 ${hobby.favorite ? 'text-rose-500 fill-rose-500' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 mt-3">
                    {hobby.name}
                  </h4>

                  {hobby.description && (
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                      {hobby.description}
                    </p>
                  )}

                  {/* Goal pill */}
                  {hobby.goal && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/60 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-300 font-medium">
                      <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{hobby.goal}</span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-1.5 pt-3 mt-4 border-t border-stone-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => onEdit(hobby)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(hobby.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
