import React, { useState, useMemo, useRef } from 'react';
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
  Folder,
  Camera,
  Upload,
  Eye,
  X,
  ImagePlus
} from 'lucide-react';
import { StudySubject, StudySummary } from '../../types';
import { StudyDocumentCard } from './StudyDocumentCard';
import { StudyDeleteConfirmModal } from './StudyDeleteConfirmModal';
import { getSubjectColor, compressImageFile } from './studyUtils';

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
  onUpdateCover?: (newCoverUrl?: string) => void;
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
  onUpdateCover,
  isMale = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [docToDelete, setDocToDelete] = useState<StudySummary | null>(null);
  const [isDeleteSubjectModalOpen, setIsDeleteSubjectModalOpen] = useState(false);
  const [isViewingFullCover, setIsViewingFullCover] = useState(false);
  const [isProcessingCover, setIsProcessingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const palette = getSubjectColor(subject.color);
  const coverPhoto = subject.coverUrl || subject.imageUrl;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateCover) return;

    setIsProcessingCover(true);
    try {
      const compressed = await compressImageFile(file);
      onUpdateCover(compressed);
    } catch (err) {
      console.error('Erro ao comprimir imagem de capa:', err);
    } finally {
      setIsProcessingCover(false);
      if (e.target) e.target.value = '';
    }
  };

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
      <div className="relative bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-xs overflow-hidden">
        {/* Input invisível para troca rápida de capa */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Top color bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-2 z-10" 
          style={{ backgroundColor: palette.accent }} 
        />

        {/* Foto de Capa do Caderno (se existir) */}
        {coverPhoto ? (
          <div className="relative w-full h-56 sm:h-72 overflow-hidden bg-stone-950 group/banner">
            {/* Fundo ambiente desfocado para fotos verticais e horizontais */}
            <img
              src={coverPhoto}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-xl scale-115 opacity-60 pointer-events-none"
            />
            {/* Foto principal centralizada */}
            <img
              src={coverPhoto}
              alt={`Capa de ${subject.name}`}
              className="relative z-10 w-full h-full object-cover sm:object-contain object-center group-hover/banner:scale-102 transition duration-500"
            />
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

            {/* Ações Rápidas na Capa */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
              <button
                type="button"
                onClick={() => setIsViewingFullCover(true)}
                className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ver capa ampliada</span>
              </button>

              {onUpdateCover && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingCover}
                  className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-stone-850 text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Trocar capa</span>
                </button>
              )}

              {onUpdateCover && (
                <button
                  type="button"
                  onClick={() => onUpdateCover(undefined)}
                  className="p-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs backdrop-blur-md transition cursor-pointer"
                  title="Remover capa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="absolute bottom-4 left-4 sm:left-6 z-20 flex items-center gap-2 text-white/90 text-xs font-medium">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Capa do Caderno de Estudos</span>
            </div>
          </div>
        ) : (
          /* Se não tiver capa: atalho sutil para adicionar capa */
          onUpdateCover && (
            <div className="pt-5 px-6 sm:px-8 pb-1">
              <div className="p-3.5 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300">
                    <span className="font-semibold">Caderno sem foto de capa.</span> Deseja adicionar uma foto personalizada?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingCover}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <ImagePlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Adicionar foto</span>
                </button>
              </div>
            </div>
          )
        )}

        <div className="p-6 sm:p-8">
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

      {/* Lightbox de foto de capa ampliada */}
      {isViewingFullCover && coverPhoto && (
        <div 
          onClick={() => setIsViewingFullCover(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full bg-white dark:bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800"
          >
            <div className="p-4 flex items-center justify-between border-b border-stone-100 dark:border-stone-800">
              <h4 className="font-serif font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 truncate flex items-center gap-2">
                <span>{subject.icon || '📚'}</span>
                <span>Capa de {subject.name}</span>
              </h4>
              <button
                onClick={() => setIsViewingFullCover(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 bg-stone-100 dark:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 bg-black/95 flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img
                src={coverPhoto}
                alt={`Capa de ${subject.name}`}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
