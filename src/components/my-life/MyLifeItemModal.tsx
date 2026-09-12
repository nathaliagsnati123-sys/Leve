import React, { useState, useEffect } from 'react';
import { 
  X, Star, Heart, BookOpen, Film, Tv, Palette, MapPin, 
  Compass, Music, Camera, Activity, Utensils, Coffee, Scissors, Dumbbell, Sparkles 
} from 'lucide-react';
import { 
  MyLifeBook, MyLifeMovie, MyLifeSeries, MyLifeHobby, 
  MyLifePlace, MyLifeDream, BookStatus, MovieStatus, 
  SeriesStatus, HobbyStatus, PlaceStatus, DreamStatus 
} from '../../types';

export type ModalCategory = 'books' | 'movies' | 'series' | 'hobbies' | 'places' | 'dreams';

interface MyLifeItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: ModalCategory;
  initialItem?: any;
  onSave: (category: ModalCategory, item: any) => void;
}

const HOBBY_ICONS = [
  { id: 'BookOpen', label: 'Livro / Leitura', icon: BookOpen },
  { id: 'Palette', label: 'Artes / Pintura', icon: Palette },
  { id: 'Music', label: 'Música / Instrumento', icon: Music },
  { id: 'Camera', label: 'Fotografia', icon: Camera },
  { id: 'Activity', label: 'Movimento / Dança', icon: Activity },
  { id: 'Utensils', label: 'Culinária / Confeitaria', icon: Utensils },
  { id: 'Coffee', label: 'Café & Chá', icon: Coffee },
  { id: 'Scissors', label: 'Costura & Artesanato', icon: Scissors },
  { id: 'Dumbbell', label: 'Exercício & Esporte', icon: Dumbbell },
  { id: 'Sparkles', label: 'Autocuidado', icon: Sparkles },
];

const HOBBY_COLORS = [
  { hex: '#1F3A34', name: 'Verde LEVE' },
  { hex: '#4A7C59', name: 'Verde Sálvia' },
  { hex: '#8C6D46', name: 'Terracota' },
  { hex: '#A65B6F', name: 'Rosa Suave' },
  { hex: '#3B6E8C', name: 'Azul Sereno' },
  { hex: '#6B4E71', name: 'Lavanda / Violeta' },
];

const DREAM_CATEGORIES = [
  'Viagem',
  'Aprendizado & Estudos',
  'Estilo de Vida',
  'Carreira & Propósito',
  'Espiritual',
  'Experiência',
  'Casa & Conforto',
  'Outro'
];

export const MyLifeItemModal: React.FC<MyLifeItemModalProps> = ({
  isOpen,
  onClose,
  category,
  initialItem,
  onSave
}) => {
  // Form states
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');
  const [seasons, setSeasons] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [favorite, setFavorite] = useState(false);
  const [dreamCategory, setDreamCategory] = useState(DREAM_CATEGORIES[0]);
  const [nextStep, setNextStep] = useState('');
  const [hobbyIcon, setHobbyIcon] = useState('BookOpen');
  const [hobbyColor, setHobbyColor] = useState('#1F3A34');
  
  // Status states
  const [bookStatus, setBookStatus] = useState<BookStatus>('want_to_read');
  const [movieStatus, setMovieStatus] = useState<MovieStatus>('want_to_watch');
  const [seriesStatus, setSeriesStatus] = useState<SeriesStatus>('want_to_watch');
  const [hobbyStatus, setHobbyStatus] = useState<HobbyStatus>('current');
  const [placeStatus, setPlaceStatus] = useState<PlaceStatus>('want_to_visit');
  const [dreamStatus, setDreamStatus] = useState<DreamStatus>('want_to_realize');

  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem.title || initialItem.name || '');
      setAuthor(initialItem.author || '');
      setYear(initialItem.year || '');
      setGenre(initialItem.genre || '');
      setSeasons(initialItem.seasons || '');
      setCity(initialItem.city || '');
      setCountry(initialItem.country || '');
      setDescription(initialItem.description || '');
      setNotes(initialItem.notes || '');
      setCoverUrl(initialItem.coverUrl || initialItem.imageUrl || '');
      setRating(initialItem.rating || 0);
      setFavorite(!!initialItem.favorite);
      setDreamCategory(initialItem.category || DREAM_CATEGORIES[0]);
      setNextStep(initialItem.nextStep || '');
      setHobbyIcon(initialItem.icon || 'BookOpen');
      setHobbyColor(initialItem.accentColor || '#1F3A34');

      if (category === 'books') setBookStatus(initialItem.status || 'want_to_read');
      if (category === 'movies') setMovieStatus(initialItem.status || 'want_to_watch');
      if (category === 'series') setSeriesStatus(initialItem.status || 'want_to_watch');
      if (category === 'hobbies') setHobbyStatus(initialItem.status || 'current');
      if (category === 'places') setPlaceStatus(initialItem.status || 'want_to_visit');
      if (category === 'dreams') setDreamStatus(initialItem.status || 'want_to_realize');
    } else {
      // Reset defaults
      setTitle('');
      setAuthor('');
      setYear('');
      setGenre('');
      setSeasons('');
      setCity('');
      setCountry('');
      setDescription('');
      setNotes('');
      setCoverUrl('');
      setRating(0);
      setFavorite(false);
      setDreamCategory(DREAM_CATEGORIES[0]);
      setNextStep('');
      setHobbyIcon('BookOpen');
      setHobbyColor('#1F3A34');
      setBookStatus('want_to_read');
      setMovieStatus('want_to_watch');
      setSeriesStatus('want_to_watch');
      setHobbyStatus('current');
      setPlaceStatus('want_to_visit');
      setDreamStatus('want_to_realize');
    }
  }, [initialItem, category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let payload: any = {
      favorite
    };

    if (initialItem?.id) {
      payload.id = initialItem.id;
      payload.createdAt = initialItem.createdAt;
    }

    if (category === 'books') {
      payload = {
        ...payload,
        title: title.trim(),
        author: author.trim(),
        coverUrl: coverUrl.trim(),
        status: bookStatus,
        rating: rating > 0 ? rating : undefined,
        notes: notes.trim()
      };
    } else if (category === 'movies') {
      payload = {
        ...payload,
        title: title.trim(),
        year: year.trim(),
        genre: genre.trim(),
        coverUrl: coverUrl.trim(),
        status: movieStatus,
        rating: rating > 0 ? rating : undefined,
        notes: notes.trim()
      };
    } else if (category === 'series') {
      payload = {
        ...payload,
        name: title.trim(),
        title: title.trim(),
        seasons: seasons.trim(),
        coverUrl: coverUrl.trim(),
        status: seriesStatus,
        rating: rating > 0 ? rating : undefined,
        notes: notes.trim()
      };
    } else if (category === 'hobbies') {
      payload = {
        ...payload,
        name: title.trim(),
        description: description.trim(),
        icon: hobbyIcon,
        accentColor: hobbyColor,
        goal: nextStep.trim(),
        status: hobbyStatus
      };
    } else if (category === 'places') {
      payload = {
        ...payload,
        name: title.trim(),
        city: city.trim(),
        country: country.trim(),
        coverUrl: coverUrl.trim(),
        notes: notes.trim(),
        status: placeStatus
      };
    } else if (category === 'dreams') {
      payload = {
        ...payload,
        title: title.trim(),
        description: description.trim(),
        imageUrl: coverUrl.trim(),
        category: dreamCategory,
        nextStep: nextStep.trim(),
        status: dreamStatus
      };
    }

    onSave(category, payload);
    onClose();
  };

  const getCategoryTitle = () => {
    switch (category) {
      case 'books': return initialItem ? 'Editar Livro' : 'Adicionar Livro';
      case 'movies': return initialItem ? 'Editar Filme' : 'Adicionar Filme';
      case 'series': return initialItem ? 'Editar Série' : 'Adicionar Série';
      case 'hobbies': return initialItem ? 'Editar Hobby' : 'Adicionar Hobby';
      case 'places': return initialItem ? 'Editar Lugar' : 'Adicionar Lugar para Conhecer';
      case 'dreams': return initialItem ? 'Editar Sonho' : 'Registrar Sonho ou Desejo';
      default: return 'Item de Entretenimento & Lazer';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200/80 dark:border-stone-800 flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800 shrink-0">
          <div className="flex items-center gap-2">
            <h2 id="modal-title" className="font-serif text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
              {getCategoryTitle()}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
          {/* Main Title / Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
              {category === 'books' && 'Título do Livro *'}
              {category === 'movies' && 'Título do Filme *'}
              {category === 'series' && 'Nome da Série *'}
              {category === 'hobbies' && 'Nome do Hobby *'}
              {category === 'places' && 'Nome do Lugar ou Ponto Turístico *'}
              {category === 'dreams' && 'Título do Sonho ou Desejo *'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                category === 'books' ? 'Ex: A Coragem de Ser Imperfeito' :
                category === 'movies' ? 'Ex: Interestelar' :
                category === 'series' ? 'Ex: Gilmore Girls' :
                category === 'hobbies' ? 'Ex: Aquarela botânica' :
                category === 'places' ? 'Ex: Costa Amalfitana' :
                'Ex: Fazer uma viagem de trem pela Suíça'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-[#FAF9F5] dark:bg-stone-850 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
            />
          </div>

          {/* Book: Author */}
          {category === 'books' && (
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                Autor(a)
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ex: Brené Brown"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-[#FAF9F5] dark:bg-stone-850 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
              />
            </div>
          )}

          {/* Movie: Year & Genre */}
          {category === 'movies' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Ano
                </label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="Ex: 2023"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-[#FAF9F5] dark:bg-stone-850 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Gênero
                </label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Ex: Drama, Comédia"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-[#FAF9F5] dark:bg-stone-850 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                />
              </div>
            </div>
          )}

          {/* Series: Seasons */}
          {category === 'series' && (
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                Temporadas
              </label>
              <input
                type="text"
                value={seasons}
                onChange={(e) => setSeasons(e.target.value)}
                placeholder="Ex: 5 temporadas, minissérie"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-[#FAF9F5] dark:bg-stone-850 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
              />
            </div>
          )}

          {/* Places: City & Country */}
          {category === 'places' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Cidade / Região
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Positano"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-[#FAF9F5] dark:bg-stone-850 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  País
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Ex: Itália"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-[#FAF9F5] dark:bg-stone-850 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                />
              </div>
            </div>
          )}

          {/* Dreams: Category & Next Step */}
          {category === 'dreams' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Categoria do Sonho
                </label>
                <select
                  value={dreamCategory}
                  onChange={(e) => setDreamCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-[#FAF9F5] dark:bg-stone-850 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                >
                  {DREAM_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Pequena meta ou próximo passo
                </label>
                <input
                  type="text"
                  value={nextStep}
                  onChange={(e) => setNextStep(e.target.value)}
                  placeholder="Ex: Guardar R$ 150 por mês para a passagem"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-[#FAF9F5] dark:bg-stone-850 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                />
              </div>
            </>
          )}

          {/* Hobbies: Description, Goal, Icon, Color */}
          {category === 'hobbies' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Pequena descrição
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Momentos calmos para desenhar plantas e folhas"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-[#FAF9F5] dark:bg-stone-850 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Meta relacionada ao hobby (opcional)
                </label>
                <input
                  type="text"
                  value={nextStep}
                  onChange={(e) => setNextStep(e.target.value)}
                  placeholder="Ex: Praticar 2 vezes na semana"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-[#FAF9F5] dark:bg-stone-850 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                />
              </div>

              {/* Hobby Icon Picker */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                  Ícone representativo
                </label>
                <div className="flex flex-wrap gap-2">
                  {HOBBY_ICONS.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = hobbyIcon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setHobbyIcon(item.id)}
                        className={`p-2 rounded-xl border flex items-center gap-1.5 transition cursor-pointer text-xs ${
                          isSelected 
                            ? 'bg-[#1F3A34] text-emerald-100 border-[#1F3A34]' 
                            : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hobby Color Accent */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                  Cor de destaque
                </label>
                <div className="flex items-center gap-2">
                  {HOBBY_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setHobbyColor(col.hex)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer border ${
                        hobbyColor === col.hex ? 'scale-125 ring-2 ring-emerald-500 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {category === 'books' && (
                <>
                  {[
                    { id: 'want_to_read', label: 'Quero ler' },
                    { id: 'reading', label: 'Lendo' },
                    { id: 'read', label: 'Já li' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setBookStatus(s.id as BookStatus)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                        bookStatus === s.id
                          ? 'bg-[#1F3A34] text-white border-[#1F3A34]'
                          : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </>
              )}

              {category === 'movies' && (
                <>
                  {[
                    { id: 'want_to_watch', label: 'Quero assistir' },
                    { id: 'watched', label: 'Assistido' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setMovieStatus(s.id as MovieStatus)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                        movieStatus === s.id
                          ? 'bg-[#1F3A34] text-white border-[#1F3A34]'
                          : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </>
              )}

              {category === 'series' && (
                <>
                  {[
                    { id: 'want_to_watch', label: 'Quero assistir' },
                    { id: 'watching', label: 'Assistindo' },
                    { id: 'finished', label: 'Finalizada' },
                    { id: 'paused', label: 'Pausada' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSeriesStatus(s.id as SeriesStatus)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                        seriesStatus === s.id
                          ? 'bg-[#1F3A34] text-white border-[#1F3A34]'
                          : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </>
              )}

              {category === 'hobbies' && (
                <>
                  {[
                    { id: 'current', label: 'Meu Hobby Atual' },
                    { id: 'wishlist', label: 'Quero experimentar' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setHobbyStatus(s.id as HobbyStatus)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                        hobbyStatus === s.id
                          ? 'bg-[#1F3A34] text-white border-[#1F3A34]'
                          : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </>
              )}

              {category === 'places' && (
                <>
                  {[
                    { id: 'want_to_visit', label: 'Quero conhecer' },
                    { id: 'visited', label: 'Já conheci' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setPlaceStatus(s.id as PlaceStatus)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                        placeStatus === s.id
                          ? 'bg-[#1F3A34] text-white border-[#1F3A34]'
                          : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </>
              )}

              {category === 'dreams' && (
                <>
                  {[
                    { id: 'want_to_realize', label: 'Quero realizar' },
                    { id: 'in_progress', label: 'Em andamento' },
                    { id: 'completed', label: 'Realizado' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setDreamStatus(s.id as DreamStatus)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                        dreamStatus === s.id
                          ? 'bg-[#1F3A34] text-white border-[#1F3A34]'
                          : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Rating (Books, Movies, Series) */}
          {(category === 'books' || category === 'movies' || category === 'series') && (
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                Avaliação (1 a 5 estrelas)
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setRating(rating === starVal ? 0 : starVal)}
                    className="p-1 text-stone-300 hover:text-amber-400 dark:text-stone-600 transition cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        rating >= starVal ? 'text-amber-400 fill-amber-400' : ''
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="text-xs text-stone-500 ml-2">
                    {rating} de 5 estrelas
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Cover / Image URL */}
          {category !== 'hobbies' && (
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                Link da Capa ou Foto (opcional)
              </label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-[#FAF9F5] dark:bg-stone-850 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
              />
            </div>
          )}

          {/* Notes / Anotações */}
          {category !== 'hobbies' && (
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                Anotações pessoais, aprendizados ou reflexões
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Escreva algo que te marcou ou que queira lembrar..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-[#FAF9F5] dark:bg-stone-850 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 resize-none"
              />
            </div>
          )}

          {/* Favorite Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setFavorite(!favorite)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition cursor-pointer w-full text-left ${
                favorite 
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200' 
                  : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${favorite ? 'text-rose-500 fill-rose-500' : ''}`} />
              <span className="font-medium text-xs">
                {favorite ? 'Marcado como Favorito Especial' : 'Marcar como Favorito'}
              </span>
            </button>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#1F3A34] hover:bg-[#162A25] text-white font-medium shadow-sm transition cursor-pointer"
            >
              {initialItem ? 'Salvar Alterações' : 'Adicionar ao Entretenimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
