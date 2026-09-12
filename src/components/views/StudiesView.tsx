import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  GraduationCap, BookOpen, Plus, Search, Star, Trash2, Edit3, 
  CheckCircle2, Clock, Tag, Filter, FolderPlus, FileText, 
  ChevronRight, Sparkles, BookMarked, Eye, X, Check
} from 'lucide-react';
import { StudySubject, StudySummary, StudyReviewStatus } from '../../types';
import { getTodayDateString, formatDateToBrazilian } from '../../services/storage';
import { normalizeTreatmentPreference } from '../../utils/treatment';

const COLOR_PALETTES = [
  { id: 'emerald', name: 'Esmeralda', bg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
  { id: 'blue', name: 'Azul', bg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300', badge: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' },
  { id: 'purple', name: 'Violeta', bg: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-300', badge: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800' },
  { id: 'rose', name: 'Rosa', bg: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300', badge: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800' },
  { id: 'amber', name: 'Âmbar', bg: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', badge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
  { id: 'teal', name: 'Turquesa', bg: 'bg-teal-500', text: 'text-teal-700 dark:text-teal-300', badge: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800' },
  { id: 'indigo', name: 'Índigo', bg: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-300', badge: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800' },
  { id: 'stone', name: 'Neutro', bg: 'bg-stone-500', text: 'text-stone-700 dark:text-stone-300', badge: 'bg-stone-100 text-stone-800 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700' },
];

export const StudiesView: React.FC = () => {
  const { 
    data, 
    addStudySubject, 
    updateStudySubject, 
    deleteStudySubject,
    addStudySummary, 
    updateStudySummary, 
    deleteStudySummary,
    toggleSummaryFavorite, 
    updateSummaryReviewStatus,
    showToast 
  } = useApp();

  const pref = normalizeTreatmentPreference(data.user?.treatmentPreference);
  const isMale = pref === 'masculino';

  const studiesData = data.studies || { subjects: [], summaries: [] };
  const subjects = studiesData.subjects || [];
  const summaries = studiesData.summaries || [];

  // Filter & Search states
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Subject Modal (Create / Edit)
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<StudySubject | null>(null);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    color: 'emerald',
    description: ''
  });

  // Summary Modal (Create / Edit)
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [editingSummary, setEditingSummary] = useState<StudySummary | null>(null);
  const [summaryForm, setSummaryForm] = useState({
    subjectId: '',
    title: '',
    content: '',
    keyConceptsInput: '',
    reviewStatus: 'novo' as StudyReviewStatus,
    favorite: false
  });

  // Reading / Study Mode Modal
  const [readingSummary, setReadingSummary] = useState<StudySummary | null>(null);

  // Filtered summaries
  const filteredSummaries = useMemo(() => {
    return summaries.filter((item) => {
      // Filter by subject
      if (selectedSubjectId !== 'all' && item.subjectId !== selectedSubjectId) {
        return false;
      }
      // Filter by status
      if (statusFilter === 'favorite' && !item.favorite) {
        return false;
      }
      if (statusFilter !== 'all' && statusFilter !== 'favorite' && item.reviewStatus !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesContent = item.content.toLowerCase().includes(q);
        const matchesTags = (item.keyConcepts || []).some(k => k.toLowerCase().includes(q));
        return matchesTitle || matchesContent || matchesTags;
      }
      return true;
    });
  }, [summaries, selectedSubjectId, statusFilter, searchQuery]);

  // Subject helpers
  const getSubject = (id: string) => subjects.find(s => s.id === id);
  const getSubjectBadgeStyle = (subject?: StudySubject) => {
    const pal = COLOR_PALETTES.find(p => p.id === subject?.color) || COLOR_PALETTES[0];
    return pal.badge;
  };

  // Open Subject Modal
  const handleOpenNewSubject = () => {
    setEditingSubject(null);
    setSubjectForm({
      name: '',
      color: 'emerald',
      description: ''
    });
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (subj: StudySubject) => {
    setEditingSubject(subj);
    setSubjectForm({
      name: subj.name,
      color: subj.color || 'emerald',
      description: subj.description || ''
    });
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name.trim()) {
      showToast('Por favor, informe o nome da matéria / caderno.');
      return;
    }

    if (editingSubject) {
      updateStudySubject({
        ...editingSubject,
        name: subjectForm.name.trim(),
        color: subjectForm.color,
        description: subjectForm.description.trim() || undefined
      });
    } else {
      addStudySubject({
        name: subjectForm.name.trim(),
        color: subjectForm.color,
        description: subjectForm.description.trim() || undefined
      });
    }
    setIsSubjectModalOpen(false);
  };

  // Open Summary Modal
  const handleOpenNewSummary = (preselectedSubjectId?: string) => {
    if (subjects.length === 0) {
      showToast('Crie primeiro um caderno ou matéria para guardar os seus resumos!');
      handleOpenNewSubject();
      return;
    }

    setEditingSummary(null);
    setSummaryForm({
      subjectId: preselectedSubjectId || (selectedSubjectId !== 'all' ? selectedSubjectId : subjects[0].id),
      title: '',
      content: '',
      keyConceptsInput: '',
      reviewStatus: 'novo',
      favorite: false
    });
    setIsSummaryModalOpen(true);
  };

  const handleOpenEditSummary = (summary: StudySummary) => {
    setEditingSummary(summary);
    setSummaryForm({
      subjectId: summary.subjectId,
      title: summary.title,
      content: summary.content,
      keyConceptsInput: (summary.keyConcepts || []).join(', '),
      reviewStatus: summary.reviewStatus,
      favorite: Boolean(summary.favorite)
    });
    setIsSummaryModalOpen(true);
  };

  const handleSaveSummary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summaryForm.title.trim()) {
      showToast('Por favor, digite o título do resumo.');
      return;
    }
    if (!summaryForm.subjectId) {
      showToast('Por favor, selecione a matéria / caderno.');
      return;
    }

    const keyConcepts = summaryForm.keyConceptsInput
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    if (editingSummary) {
      updateStudySummary({
        ...editingSummary,
        subjectId: summaryForm.subjectId,
        title: summaryForm.title.trim(),
        content: summaryForm.content.trim(),
        keyConcepts,
        reviewStatus: summaryForm.reviewStatus,
        favorite: summaryForm.favorite
      });
    } else {
      addStudySummary({
        subjectId: summaryForm.subjectId,
        title: summaryForm.title.trim(),
        content: summaryForm.content.trim(),
        keyConcepts,
        reviewStatus: summaryForm.reviewStatus,
        favorite: summaryForm.favorite
      });
    }
    setIsSummaryModalOpen(false);
  };

  const getStatusBadge = (status?: StudyReviewStatus) => {
    switch (status) {
      case 'dominado':
        return { label: 'Dominado', classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
      case 'em_revisao':
        return { label: 'Em Revisão', classes: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
      case 'revisado':
        return { label: 'Revisado', classes: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' };
      case 'novo':
      default:
        return { label: 'Novo', classes: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className={`p-3.5 rounded-2xl ${
            isMale 
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' 
              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
          }`}>
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              {isMale ? 'Cadernos & Estudos' : 'Meus Cadernos & Estudos'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Crie cadernos por matéria, faça resumos organizados e revise seus conteúdos no seu ritmo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            id="btn-create-notebook"
            onClick={handleOpenNewSubject}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Novo Caderno</span>
          </button>

          <button
            id="btn-create-study-summary"
            onClick={() => handleOpenNewSummary()}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-white shadow-xs transition cursor-pointer shrink-0 ${
              isMale ? 'bg-[#1F3A34] hover:bg-[#162924]' : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Novo Resumo</span>
          </button>
        </div>
      </div>

      {/* Cadernos / Notebooks Row */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Cadernos por Matéria ({subjects.length})
          </h2>
          {subjects.length > 0 && (
            <button
              onClick={handleOpenNewSubject}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              + Adicionar Caderno
            </button>
          )}
        </div>

        {subjects.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-stone-400 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Você ainda não criou nenhum caderno de estudos
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                Crie um caderno para cada matéria que você estuda (como Português, Biologia, Direito, Inglês ou Concursos) e organize seus resumos dentro dele.
              </p>
            </div>
            <button
              onClick={handleOpenNewSubject}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold text-white transition cursor-pointer ${
                isMale ? 'bg-[#1F3A34]' : 'bg-amber-600'
              }`}
            >
              <FolderPlus className="w-4 h-4" />
              <span>Criar Primeiro Caderno</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {/* "All" button */}
            <div
              onClick={() => setSelectedSubjectId('all')}
              className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                selectedSubjectId === 'all'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-xs'
                  : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200/80 dark:border-stone-800 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <BookMarked className="w-5 h-5 opacity-80" />
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  selectedSubjectId === 'all' ? 'bg-white/20 text-white dark:bg-stone-900/20 dark:text-stone-900' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}>
                  {summaries.length}
                </span>
              </div>
              <div>
                <div className="font-serif text-sm font-bold truncate">Todos os Cadernos</div>
                <div className={`text-[11px] ${selectedSubjectId === 'all' ? 'text-white/70 dark:text-stone-900/70' : 'text-stone-400'}`}>
                  Ver todos os resumos
                </div>
              </div>
            </div>

            {/* Individual Subject Cards */}
            {subjects.map((subj) => {
              const count = summaries.filter(s => s.subjectId === subj.id).length;
              const isSelected = selectedSubjectId === subj.id;
              const palette = COLOR_PALETTES.find(p => p.id === subj.color) || COLOR_PALETTES[0];

              return (
                <div
                  key={subj.id}
                  onClick={() => setSelectedSubjectId(subj.id)}
                  className={`group relative p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? `${palette.bg} text-white border-transparent shadow-xs`
                      : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200/80 dark:border-stone-800 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-3 h-3 rounded-full ${isSelected ? 'bg-white' : palette.bg}`} />
                    <div className="flex items-center gap-1">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}>
                        {count}
                      </span>
                      
                      {/* Edit subject button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditSubject(subj);
                        }}
                        className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition ${
                          isSelected ? 'text-white/80 hover:text-white' : 'text-stone-400 hover:text-stone-600'
                        }`}
                        title="Editar caderno"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>

                      {/* Delete subject button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Deseja excluir o caderno "${subj.name}" e todos os resumos dele?`)) {
                            deleteStudySubject(subj.id);
                            if (selectedSubjectId === subj.id) setSelectedSubjectId('all');
                          }
                        }}
                        className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition ${
                          isSelected ? 'text-white/80 hover:text-white' : 'text-stone-400 hover:text-rose-500'
                        }`}
                        title="Excluir caderno"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="font-serif text-sm font-bold truncate">{subj.name}</div>
                    <div className={`text-[11px] truncate ${isSelected ? 'text-white/70' : 'text-stone-400'}`}>
                      {subj.description || `${count} ${count === 1 ? 'resumo' : 'resumos'}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, conceito ou palavra-chave..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-2xs"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'favorite', label: 'Favoritos ⭐' },
            { id: 'novo', label: 'Novos' },
            { id: 'em_revisao', label: 'Em Revisão' },
            { id: 'dominado', label: 'Dominados' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200/80 dark:border-stone-800 hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summaries List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Resumos Encontrados ({filteredSummaries.length})
          </div>
          {selectedSubjectId !== 'all' && (
            <button
              onClick={() => handleOpenNewSummary(selectedSubjectId)}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              + Adicionar Resumo neste Caderno
            </button>
          )}
        </div>

        {filteredSummaries.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 p-8 sm:p-12 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 text-center space-y-3">
            <FileText className="w-8 h-8 text-stone-400 mx-auto" />
            <div className="space-y-1 max-w-sm mx-auto">
              <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                {searchQuery || statusFilter !== 'all'
                  ? 'Nenhum resumo encontrado com estes filtros'
                  : 'Nenhum resumo cadastrado neste caderno ainda'}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {searchQuery || statusFilter !== 'all'
                  ? 'Tente ajustar os termos de busca ou mudar a categoria de status.'
                  : 'Faça o seu primeiro resumo com os principais conceitos da matéria para revisar quando quiser.'}
              </p>
            </div>
            {(!searchQuery && statusFilter === 'all') && (
              <button
                onClick={() => handleOpenNewSummary()}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-white shadow-xs transition cursor-pointer ${
                  isMale ? 'bg-[#1F3A34] hover:bg-[#162924]' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Escrever Primeiro Resumo</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSummaries.map((summary) => {
              const subj = getSubject(summary.subjectId);
              const badgeStyle = getSubjectBadgeStyle(subj);
              const status = getStatusBadge(summary.reviewStatus);

              return (
                <div
                  key={summary.id}
                  className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-stone-300 dark:hover:border-stone-700 transition"
                >
                  <div className="space-y-3">
                    {/* Top Row: Subject badge & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {subj && (
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${badgeStyle}`}>
                            {subj.name}
                          </span>
                        )}
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg ${status.classes}`}>
                          {status.label}
                        </span>
                      </div>

                      {/* Favorite Button */}
                      <button
                        onClick={() => toggleSummaryFavorite(summary.id)}
                        className={`p-1.5 rounded-xl transition cursor-pointer ${
                          summary.favorite
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                            : 'text-stone-300 hover:text-amber-500'
                        }`}
                        title={summary.favorite ? 'Remover dos favoritos' : 'Favoritar resumo'}
                      >
                        <Star className={`w-4 h-4 ${summary.favorite ? 'fill-amber-500' : ''}`} />
                      </button>
                    </div>

                    {/* Summary Title & Preview */}
                    <div className="space-y-1.5 cursor-pointer" onClick={() => setReadingSummary(summary)}>
                      <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 line-clamp-1 hover:text-emerald-700 dark:hover:text-emerald-400 transition">
                        {summary.title}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-3 leading-relaxed whitespace-pre-line">
                        {summary.content}
                      </p>
                    </div>

                    {/* Key Concepts Tags */}
                    {(summary.keyConcepts || []).length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {summary.keyConcepts?.map((concept, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                          >
                            #{concept}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800/80">
                    {/* Reading Mode Button */}
                    <button
                      onClick={() => setReadingSummary(summary)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Abrir para Estudar</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Quick cycle status */}
                      <button
                        onClick={() => {
                          const current = summary.reviewStatus || 'novo';
                          const nextStatus: Record<StudyReviewStatus, StudyReviewStatus> = {
                            novo: 'em_revisao',
                            em_revisao: 'dominado',
                            revisado: 'dominado',
                            dominado: 'em_revisao'
                          };
                          updateSummaryReviewStatus(summary.id, nextStatus[current]);
                        }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer text-[11px]"
                        title="Alternar status de revisão"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEditSummary(summary)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                        title="Editar resumo"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (window.confirm(`Deseja excluir o resumo "${summary.title}"?`)) {
                            deleteStudySummary(summary.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                        title="Excluir resumo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reading / Study Mode Full Modal */}
      {readingSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-stone-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-stone-100 dark:border-stone-800 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {getSubject(readingSummary.subjectId) && (
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${getSubjectBadgeStyle(getSubject(readingSummary.subjectId))}`}>
                      {getSubject(readingSummary.subjectId)?.name}
                    </span>
                  )}
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg ${getStatusBadge(readingSummary.reviewStatus).classes}`}>
                    {getStatusBadge(readingSummary.reviewStatus).label}
                  </span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 pt-1">
                  {readingSummary.title}
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleSummaryFavorite(readingSummary.id)}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    readingSummary.favorite ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' : 'text-stone-400 hover:text-amber-500'
                  }`}
                  title="Favoritar"
                >
                  <Star className={`w-5 h-5 ${readingSummary.favorite ? 'fill-amber-500' : ''}`} />
                </button>
                <button
                  onClick={() => setReadingSummary(null)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Reading Content */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
              {/* Key concepts */}
              {(readingSummary.keyConcepts || []).length > 0 && (
                <div className="flex items-center gap-2 flex-wrap p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-800">
                  <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Conceitos-chave:</span>
                  {readingSummary.keyConcepts?.map((k, i) => (
                    <span key={i} className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 shadow-2xs">
                      #{k}
                    </span>
                  ))}
                </div>
              )}

              {/* Text content formatted */}
              <div className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-line font-sans">
                {readingSummary.content}
              </div>
            </div>

            {/* Modal Footer (Actions) */}
            <div className="p-4 sm:p-5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Status de Estudo:</span>
                <select
                  value={readingSummary.reviewStatus}
                  onChange={(e) => {
                    const next = e.target.value as StudyReviewStatus;
                    updateSummaryReviewStatus(readingSummary.id, next);
                    setReadingSummary({ ...readingSummary, reviewStatus: next });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold"
                >
                  <option value="novo">Novo</option>
                  <option value="em_revisao">Em Revisão</option>
                  <option value="revisado">Revisado</option>
                  <option value="dominado">Dominado</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const curr = readingSummary;
                    setReadingSummary(null);
                    handleOpenEditSummary(curr);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  Editar Resumo
                </button>
                <button
                  onClick={() => {
                    updateSummaryReviewStatus(readingSummary.id, 'dominado');
                    setReadingSummary(null);
                    showToast('Parabéns! Conteúdo marcado como dominado! 🎓');
                  }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold text-white cursor-pointer ${
                    isMale ? 'bg-[#1F3A34] hover:bg-[#162924]' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  Marcar como Dominado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subject Modal (Create / Edit Caderno) */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                {editingSubject ? 'Editar Caderno de Matéria' : 'Criar Novo Caderno'}
              </h3>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Nome da Matéria / Disciplina *
                </label>
                <input
                  type="text"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="Ex: Português, Biologia, Inglês, Direito..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Cor do Caderno
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PALETTES.map((pal) => (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => setSubjectForm({ ...subjectForm, color: pal.id })}
                      className={`w-7 h-7 rounded-full ${pal.bg} flex items-center justify-center transition cursor-pointer ${
                        subjectForm.color === pal.id ? 'ring-2 ring-offset-2 ring-stone-900 dark:ring-stone-100' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={pal.name}
                    >
                      {subjectForm.color === pal.id && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Descrição ou Objetivo (opcional)
                </label>
                <textarea
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  rows={2}
                  placeholder="Ex: Resumos para o vestibular, provas da faculdade ou concurso..."
                  className="w-full px-4 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 rounded-2xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-2xl text-xs font-semibold text-white shadow-xs transition cursor-pointer ${
                    isMale ? 'bg-[#1F3A34] hover:bg-[#162924]' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {editingSubject ? 'Salvar Alterações' : 'Criar Caderno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary Modal (Create / Edit Resumo) */}
      {isSummaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-stone-900 w-full max-w-xl max-h-[90vh] rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                {editingSummary ? 'Editar Resumo' : 'Novo Resumo de Estudo'}
              </h3>
              <button
                onClick={() => setIsSummaryModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSummary} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Caderno / Matéria *
                  </label>
                  <select
                    value={summaryForm.subjectId}
                    onChange={(e) => setSummaryForm({ ...summaryForm, subjectId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    required
                  >
                    {subjects.map((subj) => (
                      <option key={subj.id} value={subj.id}>{subj.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Status de Revisão
                  </label>
                  <select
                    value={summaryForm.reviewStatus}
                    onChange={(e) => setSummaryForm({ ...summaryForm, reviewStatus: e.target.value as StudyReviewStatus })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="novo">Novo</option>
                    <option value="em_revisao">Em Revisão</option>
                    <option value="revisado">Revisado</option>
                    <option value="dominado">Dominado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Título do Resumo / Tema *
                </label>
                <input
                  type="text"
                  value={summaryForm.title}
                  onChange={(e) => setSummaryForm({ ...summaryForm, title: e.target.value })}
                  placeholder="Ex: Figuras de Linguagem - Metáfora e Metonímia"
                  className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Conceitos-chave / Tags (separados por vírgula)
                </label>
                <input
                  type="text"
                  value={summaryForm.keyConceptsInput}
                  onChange={(e) => setSummaryForm({ ...summaryForm, keyConceptsInput: e.target.value })}
                  placeholder="Ex: Gramática, Prova 1, Fórmulas, Importante"
                  className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Conteúdo do Resumo *
                </label>
                <textarea
                  value={summaryForm.content}
                  onChange={(e) => setSummaryForm({ ...summaryForm, content: e.target.value })}
                  rows={8}
                  placeholder="Escreva aqui seu resumo, tópicos principais, explicações simples, exemplos práticos e fórmulas..."
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-y leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk-fav"
                  checked={summaryForm.favorite}
                  onChange={(e) => setSummaryForm({ ...summaryForm, favorite: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="chk-fav" className="text-xs text-stone-700 dark:text-stone-300 cursor-pointer select-none">
                  Marcar este resumo como favorito / destaque ⭐
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsSummaryModalOpen(false)}
                  className="px-4 py-2 rounded-2xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-2xl text-xs font-semibold text-white shadow-xs transition cursor-pointer ${
                    isMale ? 'bg-[#1F3A34] hover:bg-[#162924]' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {editingSummary ? 'Salvar Resumo' : 'Salvar no Caderno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
