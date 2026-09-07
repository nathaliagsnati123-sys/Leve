import React, { useState } from 'react';
import { BookOpen, Star, Heart, Plus, Edit2, Trash2 } from 'lucide-react';
import { MyLifeBook, BookStatus } from '../../types';

interface BooksSectionProps {
  books: MyLifeBook[];
  onAdd: () => void;
  onEdit: (book: MyLifeBook) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const BooksSection: React.FC<BooksSectionProps> = ({
  books,
  onAdd,
  onEdit,
  onDelete,
  onToggleFavorite
}) => {
  const [filter, setFilter] = useState<'all' | BookStatus | 'favorites'>('all');

  const filtered = books.filter((b) => {
    if (filter === 'all') return true;
    if (filter === 'favorites') return b.favorite;
    return b.status === filter;
  });

  const getStatusLabel = (status: BookStatus) => {
    switch (status) {
      case 'want_to_read': return 'Quero ler';
      case 'reading': return 'Lendo';
      case 'read': return 'Já li';
    }
  };

  const getStatusColor = (status: BookStatus) => {
    switch (status) {
      case 'reading': 
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'read': 
        return 'bg-[#1F3A34] text-white border-[#1F3A34]';
      case 'want_to_read': 
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
            Todos ({books.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('want_to_read')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
              filter === 'want_to_read'
                ? 'bg-[#1F3A34] text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/80 dark:hover:bg-stone-700'
            }`}
          >
            Quero ler ({books.filter((b) => b.status === 'want_to_read').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('reading')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
              filter === 'reading'
                ? 'bg-[#1F3A34] text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/80 dark:hover:bg-stone-700'
            }`}
          >
            Lendo ({books.filter((b) => b.status === 'reading').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('read')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
              filter === 'read'
                ? 'bg-[#1F3A34] text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/80 dark:hover:bg-stone-700'
            }`}
          >
            Já li ({books.filter((b) => b.status === 'read').length})
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
            <span>Favoritos ({books.filter((b) => b.favorite).length})</span>
          </button>
        </div>

        {/* Add button */}
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Livro</span>
        </button>
      </div>

      {/* Grid of Books */}
      {filtered.length === 0 ? (
        <div className="text-center py-14 px-4 bg-white/70 dark:bg-stone-900/60 rounded-3xl border border-stone-200/70 dark:border-stone-800/80">
          <BookOpen className="w-10 h-10 mx-auto text-stone-400 dark:text-stone-600 mb-3" />
          <h3 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">
            Nenhum livro encontrado
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1 mb-4">
            {filter === 'all'
              ? 'Organize leituras marcantes, livros que quer ler ou o que está lendo no momento.'
              : 'Nenhum livro corresponde ao filtro selecionado.'}
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F3A34] text-white text-xs font-medium shadow-xs transition hover:bg-[#162A25] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar o primeiro livro</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((book) => (
            <div
              key={book.id}
              className="group bg-white dark:bg-stone-900 rounded-2xl p-4 sm:p-5 border border-stone-200/70 dark:border-stone-800/80 hover:border-emerald-300 dark:hover:border-emerald-800/60 transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Header with image/cover + info */}
                <div className="flex gap-3">
                  {book.coverUrl ? (
                    <div className="w-16 h-22 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0 border border-stone-200/60 dark:border-stone-700">
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // fallback if URL broken
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-22 rounded-xl bg-[#F6F7F4] dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80 flex flex-col items-center justify-center p-2 text-center shrink-0">
                      <BookOpen className="w-6 h-6 text-[#1F3A34] dark:text-emerald-400 mb-1" />
                      <span className="text-[9px] text-stone-400 leading-tight line-clamp-2">
                        {book.author || 'Livro'}
                      </span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(book.status)}`}>
                        {getStatusLabel(book.status)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(book.id)}
                        className="p-1 text-stone-300 dark:text-stone-600 hover:text-rose-500 transition cursor-pointer"
                        title={book.favorite ? 'Remover dos favoritos' : 'Favoritar'}
                      >
                        <Heart className={`w-4 h-4 ${book.favorite ? 'text-rose-500 fill-rose-500' : ''}`} />
                      </button>
                    </div>

                    <h4 className="font-serif font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 line-clamp-2 mt-1">
                      {book.title}
                    </h4>
                    {book.author && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                        {book.author}
                      </p>
                    )}

                    {/* Rating stars */}
                    {book.rating && book.rating > 0 && (
                      <div className="flex items-center gap-0.5 mt-1.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= (book.rating || 0)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-stone-200 dark:text-stone-700'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {book.notes && (
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 line-clamp-3 italic bg-stone-50/50 dark:bg-stone-850/50 p-2.5 rounded-xl">
                    "{book.notes}"
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-1.5 pt-3 mt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => onEdit(book)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(book.id)}
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
