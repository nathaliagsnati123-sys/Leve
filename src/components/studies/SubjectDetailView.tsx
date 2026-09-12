import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  FileText,
  Edit3,
  Trash2,
  BookOpen,
  Filter,
  Sparkles,
  Folder
} from 'lucide-react';
import { StudySubject, StudySummary } from '../../types';
import { StudyDocumentCard } from './StudyDocumentCard';
import { StudyDeleteConfirmModal } from './StudyDeleteConfirmModal';
import { getSubjectColor } from './studyUtils';

interface SubjectDetailViewProps {
  subject: StudySubject;
  documents: StudySummary[];
  onOpenDocument: (doc: StudySummary) => void;
  onCreateDocument: () => void;
  onEditSubject: () => void;
  onDeleteSubject: () => void;
  onDeleteDocument: (docId: string) => void;
  onToggleFavorite: (docId: string) => void;
  onBackToOverview: () => void;
  isMale?: boolean;
}

export const SubjectDetailView: React.FC<SubjectDetailViewProps> = ({
  subject,
  documents,
  onOpenDocument,
  onCreateDocument,
  onEditSubject,
  onDeleteSubject,
  onDeleteDocument,
  onToggleFavorite,
  onBackToOverview,
  isMale = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [docToDelete, setDocToDelete] = useState<StudySummary | null>(null);
  const [isDeleteSubjectModalOpen, setIsDeleteSubjectModalOpen] = useState(false);

  const palette = getSubjectColor(subject.color);

  // Filter documents by search and status
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Status filter
      if (statusFilter === 'favorite' && !doc.favorite) return false;
      if (statusFilter !== 'all' && statusFilter !== 'favorite' && doc.reviewStatus !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (doc.title || '').toLowerCase().includes(q);
        const matchContent = (doc.content || '').toLowerCase().includes(q);
        const matchConcepts = (doc.keyConcepts || []).some(k => k.toLowerCase().includes(q));
        if (!matchTitle && !matchContent && !matchConcepts) return false;
      }

      return true;
    });
  }, [documents, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* 1. BREADCRUMBS & NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <button
            onClick={onBackToOverview}
            className="text-stone-500 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition cursor-pointer flex items-center gap-1.5"
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Caderno de Estudos</span>
          </button>

          <span className="text-stone-300 dark:text-stone-600">/</span>

          <span className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
            <span>{subject.icon || '📚'}</span>
            <span>{subject.name}</span>
          </span>
        </div>

        <button
          onClick={onBackToOverview}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Caderno</span>
        </button>
      </div>

      {/* 2. SUBJECT BANNER / EXCLUSIVE AREA HEADER */}
      <div className="relative bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 p-6 sm:p-8 shadow-xs overflow-hidden">
        {/* Top color bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-2" 
          style={{ backgroundColor: palette.accent }} 
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-100 dark:border-stone-700/60 shrink-0">
              {subject.icon || '📚'}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                  {subject.name}
                </h1>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${palette.badge}`}>
                  {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-2xl leading-relaxed">
                {subject.description || 'Área exclusiva para anotações, explicações de aula e resumos de estudo desta matéria.'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onEditSubject}
              className="p-2.5 rounded-2xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer flex items-center gap-1.5"
              title="Editar matéria"
            >
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline">Editar</span>
            </button>

            <button
              onClick={() => setIsDeleteSubjectModalOpen(true)}
              className="p-2.5 rounded-2xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer flex items-center gap-1.5"
              title="Excluir matéria"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Excluir</span>
            </button>

            <button
              id="btn-create-doc-in-subject"
              onClick={onCreateDocument}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-white shadow-xs transition cursor-pointer ${
                isMale ? 'bg-[#1F3A34] hover:bg-[#162924]' : 'bg-[#1F3A34] hover:bg-[#162924]'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Novo Documento</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & STATUS FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Buscar documentos em ${subject.name}...`}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Pills */}
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

      {/* 4. DOCUMENTS GRID */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 p-8 sm:p-14 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 text-center space-y-4">
          <FileText className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto" />
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              {searchQuery || statusFilter !== 'all'
                ? 'Nenhum documento encontrado com estes filtros'
                : `Nenhum documento criado em ${subject.name} ainda`}
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              {searchQuery || statusFilter !== 'all'
                ? 'Tente ajustar os termos de busca ou mudar a categoria de status.'
                : 'Crie seu primeiro documento para escrever anotações de aula, explicações, resumos ou tópicos de prova.'}
            </p>
          </div>

          {!searchQuery && statusFilter === 'all' && (
            <button
              onClick={onCreateDocument}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-white shadow-xs transition cursor-pointer ${
                isMale ? 'bg-[#1F3A34] hover:bg-[#162924]' : 'bg-[#1F3A34] hover:bg-[#162924]'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Criar Primeiro Documento</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <StudyDocumentCard
              key={doc.id}
              document={doc}
              onOpen={() => onOpenDocument(doc)}
              onDelete={() => setDocToDelete(doc)}
              onToggleFavorite={() => onToggleFavorite(doc.id)}
            />
          ))}
        </div>
      )}

      {/* 5. CONFIRMATION MODALS */}
      {/* Delete Document Confirmation */}
      <StudyDeleteConfirmModal
        isOpen={Boolean(docToDelete)}
        onClose={() => setDocToDelete(null)}
        onConfirm={() => {
          if (docToDelete) {
            onDeleteDocument(docToDelete.id);
            setDocToDelete(null);
          }
        }}
        title="Excluir este documento?"
        message={`Tem certeza que deseja excluir "${docToDelete?.title || 'este documento'}"? Essa ação não poderá ser desfeita.`}
        confirmButtonText="Excluir Documento"
      />

      {/* Delete Subject Confirmation */}
      <StudyDeleteConfirmModal
        isOpen={isDeleteSubjectModalOpen}
        onClose={() => setIsDeleteSubjectModalOpen(false)}
        onConfirm={() => {
          onDeleteSubject();
          setIsDeleteSubjectModalOpen(false);
        }}
        title={`Excluir matéria "${subject.name}"?`}
        message={`Todos os ${documents.length} documentos e anotações vinculados a esta matéria serão excluídos permanentemente. Essa ação não poderá ser desfeita.`}
        confirmButtonText="Excluir Matéria e Documentos"
      />
    </div>
  );
};
