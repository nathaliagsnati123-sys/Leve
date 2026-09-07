import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  BookOpen, Film, Tv, Palette, MapPin, Compass, Heart, 
  Sparkles, Search, Plus, Sparkle 
} from 'lucide-react';
import { MyLifeLockedScreen } from '../my-life/MyLifeLockedScreen';
import { MyLifeItemModal, ModalCategory } from '../my-life/MyLifeItemModal';
import { BooksSection } from '../my-life/BooksSection';
import { MoviesSection } from '../my-life/MoviesSection';
import { SeriesSection } from '../my-life/SeriesSection';
import { HobbiesSection } from '../my-life/HobbiesSection';
import { PlacesSection } from '../my-life/PlacesSection';
import { DreamsSection } from '../my-life/DreamsSection';
import { FavoritesSection } from '../my-life/FavoritesSection';

export type MyLifeTab = 'books' | 'movies' | 'series' | 'hobbies' | 'places' | 'dreams' | 'favorites';

export const MyLifeView: React.FC = () => {
  const { 
    data, 
    addMyLifeBook, updateMyLifeBook, deleteMyLifeBook,
    addMyLifeMovie, updateMyLifeMovie, deleteMyLifeMovie,
    addMyLifeSeries, updateMyLifeSeries, deleteMyLifeSeries,
    addMyLifeHobby, updateMyLifeHobby, deleteMyLifeHobby,
    addMyLifePlace, updateMyLifePlace, deleteMyLifePlace,
    addMyLifeDream, updateMyLifeDream, deleteMyLifeDream,
    toggleMyLifeFavorite
  } = useApp();

  const { hasLeveAccess, user } = useAuth();
  const [demoBypass, setDemoBypass] = useState(false);
  const [activeTab, setActiveTab] = useState<MyLifeTab>('books');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState<ModalCategory>('books');
  const [editingItem, setEditingItem] = useState<any>(null);

  // Check access: must have hasLeveAccess or bypassed for demo/testing
  if (!hasLeveAccess && !demoBypass) {
    return <MyLifeLockedScreen onBypassDemo={() => setDemoBypass(true)} />;
  }

  const myLife = data.myLife || {
    books: [],
    movies: [],
    series: [],
    hobbies: [],
    places: [],
    dreams: []
  };

  const totalFavoritesCount = 
    (myLife.books || []).filter((b) => b.favorite).length +
    (myLife.movies || []).filter((m) => m.favorite).length +
    (myLife.series || []).filter((s) => s.favorite).length +
    (myLife.hobbies || []).filter((h) => h.favorite).length +
    (myLife.places || []).filter((p) => p.favorite).length +
    (myLife.dreams || []).filter((d) => d.favorite).length;

  const handleOpenAdd = (category: ModalCategory) => {
    setModalCategory(category);
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: ModalCategory, item: any) => {
    setModalCategory(category);
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSaveModal = (category: ModalCategory, payload: any) => {
    if (editingItem?.id) {
      if (category === 'books') updateMyLifeBook(payload);
      else if (category === 'movies') updateMyLifeMovie(payload);
      else if (category === 'series') updateMyLifeSeries(payload);
      else if (category === 'hobbies') updateMyLifeHobby(payload);
      else if (category === 'places') updateMyLifePlace(payload);
      else if (category === 'dreams') updateMyLifeDream(payload);
    } else {
      if (category === 'books') addMyLifeBook(payload);
      else if (category === 'movies') addMyLifeMovie(payload);
      else if (category === 'series') addMyLifeSeries(payload);
      else if (category === 'hobbies') addMyLifeHobby(payload);
      else if (category === 'places') addMyLifePlace(payload);
      else if (category === 'dreams') addMyLifeDream(payload);
    }
  };

  // Filter items by search query if user typed anything
  const q = searchQuery.toLowerCase().trim();
  const searchFilter = (item: any) => {
    if (!q) return true;
    const title = (item.title || item.name || '').toLowerCase();
    const sub = (item.author || item.genre || item.city || item.category || item.description || item.notes || '').toLowerCase();
    return title.includes(q) || sub.includes(q);
  };

  const currentBooks = (myLife.books || []).filter(searchFilter);
  const currentMovies = (myLife.movies || []).filter(searchFilter);
  const currentSeries = (myLife.series || []).filter(searchFilter);
  const currentHobbies = (myLife.hobbies || []).filter(searchFilter);
  const currentPlaces = (myLife.places || []).filter(searchFilter);
  const currentDreams = (myLife.dreams || []).filter(searchFilter);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200/80 dark:border-stone-800 pb-6">
        <div className="space-y-1.5">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Minha Vida 🌿
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-xl leading-relaxed">
            Guarde tudo aquilo que faz parte de você: suas leituras, filmes, séries, hobbies, lugares que sonha em visitar e desejos para a sua caminhada.
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar em Minha Vida..."
            className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
            >
              limpar
            </button>
          )}
        </div>
      </div>

      {/* Category Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('books')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition shrink-0 cursor-pointer ${
            activeTab === 'books'
              ? 'bg-[#1F3A34] text-white shadow-sm'
              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Livros</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'books' ? 'bg-white/20 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
          }`}>
            {myLife.books?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('movies')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition shrink-0 cursor-pointer ${
            activeTab === 'movies'
              ? 'bg-[#1F3A34] text-white shadow-sm'
              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Filmes</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'movies' ? 'bg-white/20 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
          }`}>
            {myLife.movies?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('series')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition shrink-0 cursor-pointer ${
            activeTab === 'series'
              ? 'bg-[#1F3A34] text-white shadow-sm'
              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Séries</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'series' ? 'bg-white/20 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
          }`}>
            {myLife.series?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hobbies')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition shrink-0 cursor-pointer ${
            activeTab === 'hobbies'
              ? 'bg-[#1F3A34] text-white shadow-sm'
              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Hobbies</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'hobbies' ? 'bg-white/20 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
          }`}>
            {myLife.hobbies?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('places')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition shrink-0 cursor-pointer ${
            activeTab === 'places'
              ? 'bg-[#1F3A34] text-white shadow-sm'
              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Lugares</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'places' ? 'bg-white/20 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
          }`}>
            {myLife.places?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dreams')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition shrink-0 cursor-pointer ${
            activeTab === 'dreams'
              ? 'bg-[#1F3A34] text-white shadow-sm'
              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Sonhos</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'dreams' ? 'bg-white/20 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
          }`}>
            {myLife.dreams?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition shrink-0 cursor-pointer ${
            activeTab === 'favorites'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850'
          }`}
        >
          <Heart className={`w-4 h-4 ${activeTab === 'favorites' ? 'fill-white' : 'text-rose-500 fill-rose-500'}`} />
          <span>Favoritos</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'favorites' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200'
          }`}>
            {totalFavoritesCount}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="pt-2">
        {activeTab === 'books' && (
          <BooksSection
            books={currentBooks}
            onAdd={() => handleOpenAdd('books')}
            onEdit={(book) => handleOpenEdit('books', book)}
            onDelete={deleteMyLifeBook}
            onToggleFavorite={(id) => toggleMyLifeFavorite('books', id)}
          />
        )}

        {activeTab === 'movies' && (
          <MoviesSection
            movies={currentMovies}
            onAdd={() => handleOpenAdd('movies')}
            onEdit={(movie) => handleOpenEdit('movies', movie)}
            onDelete={deleteMyLifeMovie}
            onToggleFavorite={(id) => toggleMyLifeFavorite('movies', id)}
          />
        )}

        {activeTab === 'series' && (
          <SeriesSection
            series={currentSeries}
            onAdd={() => handleOpenAdd('series')}
            onEdit={(serie) => handleOpenEdit('series', serie)}
            onDelete={deleteMyLifeSeries}
            onToggleFavorite={(id) => toggleMyLifeFavorite('series', id)}
          />
        )}

        {activeTab === 'hobbies' && (
          <HobbiesSection
            hobbies={currentHobbies}
            onAdd={() => handleOpenAdd('hobbies')}
            onEdit={(hobby) => handleOpenEdit('hobbies', hobby)}
            onDelete={deleteMyLifeHobby}
            onToggleFavorite={(id) => toggleMyLifeFavorite('hobbies', id)}
          />
        )}

        {activeTab === 'places' && (
          <PlacesSection
            places={currentPlaces}
            onAdd={() => handleOpenAdd('places')}
            onEdit={(place) => handleOpenEdit('places', place)}
            onDelete={deleteMyLifePlace}
            onToggleFavorite={(id) => toggleMyLifeFavorite('places', id)}
          />
        )}

        {activeTab === 'dreams' && (
          <DreamsSection
            dreams={currentDreams}
            onAdd={() => handleOpenAdd('dreams')}
            onEdit={(dream) => handleOpenEdit('dreams', dream)}
            onDelete={deleteMyLifeDream}
            onToggleFavorite={(id) => toggleMyLifeFavorite('dreams', id)}
          />
        )}

        {activeTab === 'favorites' && (
          <FavoritesSection
            myLife={myLife}
            onNavigateToCategory={(cat) => setActiveTab(cat)}
            onToggleFavorite={(cat, id) => toggleMyLifeFavorite(cat, id)}
          />
        )}
      </div>

      {/* Gentle LEVIA AI tip footer */}
      <div className="mt-12 p-4 rounded-2xl bg-gradient-to-r from-emerald-50/50 via-stone-50/50 to-emerald-50/50 dark:from-stone-900/60 dark:via-stone-850/60 dark:to-stone-900/60 border border-emerald-100 dark:border-stone-800 flex items-center justify-between gap-4 text-xs text-stone-600 dark:text-stone-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-[#1F3A34] dark:text-emerald-300 shrink-0">
            <Sparkle className="w-4 h-4" />
          </div>
          <p>
            <strong>Com a Levia:</strong> Você pode conversar com a sua assistente e pedir: <em>"Levia, anote o livro que terminei ontem"</em> ou <em>"Levia, me lembre do meu sonho de viajar para Roma"</em>.
          </p>
        </div>
      </div>

      {/* Modal for adding/editing */}
      <MyLifeItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={modalCategory}
        initialItem={editingItem}
        onSave={handleSaveModal}
      />
    </div>
  );
};
