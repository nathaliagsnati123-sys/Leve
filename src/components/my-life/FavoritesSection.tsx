import React, { useState } from 'react';
import { Heart, BookOpen, Film, Tv, Palette, MapPin, Compass, Star } from 'lucide-react';
import { MyLifeData } from '../../types';

interface FavoritesSectionProps {
  myLife: MyLifeData;
  onNavigateToCategory: (category: 'books' | 'movies' | 'series' | 'hobbies' | 'places' | 'dreams') => void;
  onToggleFavorite: (category: 'books' | 'movies' | 'series' | 'hobbies' | 'places' | 'dreams', id: string) => void;
}

export const FavoritesSection: React.FC<FavoritesSectionProps> = ({
  myLife,
  onNavigateToCategory,
  onToggleFavorite
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const favBooks = (myLife.books || []).filter((b) => b.favorite).map((i) => ({ ...i, itemType: 'books' as const }));
  const favMovies = (myLife.movies || []).filter((m) => m.favorite).map((i) => ({ ...i, itemType: 'movies' as const }));
  const favSeries = (myLife.series || []).filter((s) => s.favorite).map((i) => ({ ...i, itemType: 'series' as const }));
  const favHobbies = (myLife.hobbies || []).filter((h) => h.favorite).map((i) => ({ ...i, itemType: 'hobbies' as const }));
  const favPlaces = (myLife.places || []).filter((p) => p.favorite).map((i) => ({ ...i, itemType: 'places' as const }));
  const favDreams = (myLife.dreams || []).filter((d) => d.favorite).map((i) => ({ ...i, itemType: 'dreams' as const }));

  const allFavorites = [
    ...favBooks,
    ...favMovies,
    ...favSeries,
    ...favHobbies,
    ...favPlaces,
    ...favDreams
  ];

  const displayedFavorites = allFavorites.filter((item) => {
    if (filterType === 'all') return true;
    return item.itemType === filterType;
  });

  const getItemBadge = (itemType: string) => {
    switch (itemType) {
      case 'books': return { label: 'Livro', icon: BookOpen, color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-200' };
      case 'movies': return { label: 'Filme', icon: Film, color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/40 border-blue-200' };
      case 'series': return { label: 'Série', icon: Tv, color: 'text-purple-700 bg-purple-50 dark:bg-purple-950/40 border-purple-200' };
      case 'hobbies': return { label: 'Hobby', icon: Palette, color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200' };
      case 'places': return { label: 'Lugar', icon: MapPin, color: 'text-teal-700 bg-teal-50 dark:bg-teal-950/40 border-teal-200' };
      case 'dreams': return { label: 'Sonho', icon: Compass, color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-200' };
      default: return { label: 'Item', icon: Heart, color: 'text-stone-700 bg-stone-50 border-stone-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
            filterType === 'all'
              ? 'bg-[#1F3A34] text-white shadow-xs'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/80 dark:hover:bg-stone-700'
          }`}
        >
          Todos ({allFavorites.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('books')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
            filterType === 'books'
              ? 'bg-[#1F3A34] text-white shadow-xs'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/80 dark:hover:bg-stone-700'
          }`}
        >
          Livros ({favBooks.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('movies')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
            filterType === 'movies'
              ? 'bg-[#1F3A34] text-white shadow-xs'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/80 dark:hover:bg-stone-700'
          }`}
        >
          Filmes ({favMovies.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('series')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
            filterType === 'series'
              ? 'bg-[#1F3A34] text-white shadow-xs'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/80 dark:hover:bg-stone-700'
          }`}
        >
          Séries ({favSeries.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('hobbies')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
            filterType === 'hobbies'
              ? 'bg-[#1F3A34] text-white shadow-xs'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/80 dark:hover:bg-stone-700'
          }`}
        >
          Hobbies ({favHobbies.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('places')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
            filterType === 'places'
              ? 'bg-[#1F3A34] text-white shadow-xs'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/80 dark:hover:bg-stone-700'
          }`}
        >
          Lugares ({favPlaces.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('dreams')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
            filterType === 'dreams'
              ? 'bg-[#1F3A34] text-white shadow-xs'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/80 dark:hover:bg-stone-700'
          }`}
        >
          Sonhos ({favDreams.length})
        </button>
      </div>

      {displayedFavorites.length === 0 ? (
        <div className="text-center py-14 px-4 bg-white/70 dark:bg-stone-900/60 rounded-3xl border border-stone-200/70 dark:border-stone-800/80">
          <Heart className="w-10 h-10 mx-auto text-rose-300 dark:text-rose-900/60 mb-3" />
          <h3 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">
            Nenhum item marcado como favorito ainda
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1 mb-4">
            Toque no ícone de coração em qualquer livro, filme, série, hobby, lugar ou sonho para destacá-lo aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedFavorites.map((item: any) => {
            const badge = getItemBadge(item.itemType);
            const BadgeIcon = badge.icon;
            const title = item.title || item.name;
            const subtitle = item.author || item.genre || item.city || item.category || item.description;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-stone-900 rounded-2xl p-4 sm:p-5 border border-stone-200/70 dark:border-stone-800/80 hover:border-emerald-300 dark:hover:border-emerald-800/60 transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.color}`}>
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => onToggleFavorite(item.itemType, item.id)}
                      className="p-1 text-rose-500 hover:text-stone-400 transition cursor-pointer"
                      title="Remover dos favoritos"
                    >
                      <Heart className="w-4 h-4 fill-rose-500" />
                    </button>
                  </div>

                  <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 line-clamp-2">
                    {title}
                  </h4>

                  {subtitle && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                      {subtitle}
                    </p>
                  )}

                  {item.rating && item.rating > 0 && (
                    <div className="flex items-center gap-0.5 mt-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= item.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-stone-200 dark:text-stone-700'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-2.5 pt-2.5 border-t border-stone-100 dark:border-stone-800 line-clamp-2 italic">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onNavigateToCategory(item.itemType)}
                    className="text-xs font-semibold text-[#1F3A34] dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Ver na aba {badge.label} →
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
