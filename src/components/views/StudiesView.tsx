import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  GraduationCap, Plus, Search, FolderPlus, FileText, 
  BookOpen, Folder, ArrowRight, Sparkles, Star
} from 'lucide-react';
import { StudySubject, StudySummary } from '../../types';
import { normalizeTreatmentPreference } from '../../utils/treatment';
import { syncStudiesToSupabase } from '../../services/supabase';

// Study subcomponents
import { StudySubjectCard } from '../studies/StudySubjectCard';
import { SubjectDetailView } from '../studies/SubjectDetailView';
import { StudyDocumentEditor } from '../studies/StudyDocumentEditor';
import { StudySubjectModal } from '../studies/StudySubjectModal';
import { StudyDeleteConfirmModal } from '../studies/StudyDeleteConfirmModal';
import { STUDY_SUGGESTIONS, extractTextPreview, getSubjectColor } from '../studies/studyUtils';

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
    showToast 
  } = useApp();

  const pref = normalizeTreatmentPreference(data.user?.treatmentPreference);
  const isMale = pref === 'masculino';

  const studiesData = data.studies || { subjects: [], summaries: [] };
  const subjects = studiesData.subjects || [];
  const summaries = studiesData.summaries || [];

  // Navigation hierarchy:
  // 'overview' -> Grid of Subjects (Caderno de Estudos)
  // 'subject'  -> Exclusive area for a specific subject (Documents inside subject)
  // 'document' -> Google Docs style document editor/reader
  const [currentLevel, setCurrentLevel] = useState<'overview' | 'subject' | 'document'>('overview');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

  // Global search query
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Modals state
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<StudySubject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<StudySubject | null>(null);

  // Active Subject and Active Document
  const currentSubject = useMemo(() => {
    return subjects.find(s => s.id === selectedSubjectId) || null;
  }, [subjects, selectedSubjectId]);

  const activeDocument = useMemo(() => {
    return summaries.find(d => d.id === activeDocumentId) || null;
  }, [summaries, activeDocumentId]);

  // Documents inside current subject
  const currentSubjectDocuments = useMemo(() => {
    if (!selectedSubjectId) return [];
    return summaries.filter(d => d.subjectId === selectedSubjectId);
  }, [summaries, selectedSubjectId]);

  // Helper to trigger cloud sync when changes occur
  const triggerCloudSync = useCallback((nextSubjects: StudySubject[], nextSummaries: StudySummary[]) => {
    if (data.user?.id) {
      syncStudiesToSupabase(data.user.id, {
        subjects: nextSubjects,
        summaries: nextSummaries,
      }).catch(err => console.warn('Sync error:', err));
    }
  }, [data.user?.id]);

  // --- NAVIGATION HANDLERS ---
  const handleOpenSubject = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setActiveDocumentId(null);
    setCurrentLevel('subject');
    setGlobalSearchQuery('');
  };

  const handleOpenDocument = (doc: StudySummary) => {
    setSelectedSubjectId(doc.subjectId);
    setActiveDocumentId(doc.id);
    setCurrentLevel('document');
  };

  const handleBackToSubject = () => {
    setActiveDocumentId(null);
    setCurrentLevel('subject');
  };

  const handleBackToOverview = () => {
    setSelectedSubjectId(null);
    setActiveDocumentId(null);
    setCurrentLevel('overview');
    setGlobalSearchQuery('');
  };

  // --- SUBJECT ACTIONS ---
  const handleOpenNewSubject = () => {
    setEditingSubject(null);
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (subj: StudySubject) => {
    setEditingSubject(subj);
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (form: { name: string; color: string; icon: string; description?: string }) => {
    if (editingSubject) {
      const updated: StudySubject = {
        ...editingSubject,
        name: form.name,
        color: form.color,
        icon: form.icon,
        description: form.description,
        updatedAt: new Date().toISOString(),
      };
      updateStudySubject(updated);
      const nextSubjects = subjects.map(s => s.id === updated.id ? updated : s);
      triggerCloudSync(nextSubjects, summaries);
      showToast('Matéria atualizada com sucesso!');
    } else {
      const newSubject: Omit<StudySubject, 'id' | 'createdAt'> = {
        name: form.name,
        color: form.color,
        icon: form.icon,
        description: form.description,
      };
      addStudySubject(newSubject);
      showToast(`Matéria "${form.name}" criada com sucesso!`);
    }
    setIsSubjectModalOpen(false);
  };

  const handleConfirmDeleteSubject = () => {
    if (!subjectToDelete) return;
    const subjectId = subjectToDelete.id;
    deleteStudySubject(subjectId);

    // If currently viewing this subject, return to overview
    if (selectedSubjectId === subjectId) {
      handleBackToOverview();
    }

    const nextSubjects = subjects.filter(s => s.id !== subjectId);
    const nextSummaries = summaries.filter(s => s.subjectId !== subjectId);
    triggerCloudSync(nextSubjects, nextSummaries);

    showToast(`Matéria "${subjectToDelete.name}" excluída.`);
    setSubjectToDelete(null);
  };

  // --- DOCUMENT ACTIONS ---
  const handleCreateDocument = () => {
    if (!selectedSubjectId) return;

    // Create a new empty document inside the subject and open it directly
    const defaultDocTitle = 'Documento de Estudo';
    const now = new Date().toISOString();
    const newDocId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newDoc: StudySummary = {
      id: newDocId,
      subjectId: selectedSubjectId,
      title: defaultDocTitle,
      content: '',
      reviewStatus: 'novo',
      favorite: false,
      createdAt: now,
      updatedAt: now,
    };

    addStudySummary(newDoc);
    setActiveDocumentId(newDocId);
    setCurrentLevel('document');
    showToast('Novo documento criado. Comece a escrever suas anotações!');
  };

  const handleSaveDocument = (doc: StudySummary) => {
    updateStudySummary(doc);
    const nextSummaries = summaries.map(s => s.id === doc.id ? doc : s);
    triggerCloudSync(subjects, nextSummaries);
  };

  const handleDeleteDocument = (docId: string) => {
    deleteStudySummary(docId);
    if (activeDocumentId === docId) {
      handleBackToSubject();
    }
    const nextSummaries = summaries.filter(s => s.id !== docId);
    triggerCloudSync(subjects, nextSummaries);
    showToast('Documento excluído.');
  };

  // --- SEARCH RESULTS (WHEN IN OVERVIEW) ---
  const searchResults = useMemo(() => {
    if (!globalSearchQuery.trim()) return null;
    const q = globalSearchQuery.toLowerCase();

    const matchedSubjects = subjects.filter(s => 
      s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q)
    );

    const matchedDocs = summaries.filter(d => 
      (d.title || '').toLowerCase().includes(q) || (d.content || '').toLowerCase().includes(q)
    );

    return {
      subjects: matchedSubjects,
      docs: matchedDocs,
    };
  }, [globalSearchQuery, subjects, summaries]);

  // --- RENDER LEVEL 3: DOCUMENT EDITOR ---
  if (currentLevel === 'document' && currentSubject && activeDocument) {
    return (
      <StudyDocumentEditor
        subject={currentSubject}
        initialDocument={activeDocument}
        onSave={handleSaveDocument}
        onDelete={handleDeleteDocument}
        onBackToSubject={handleBackToSubject}
        onBackToOverview={handleBackToOverview}
        isMale={isMale}
      />
    );
  }

  // --- RENDER LEVEL 2: SUBJECT EXCLUSIVE AREA ---
  if (currentLevel === 'subject' && currentSubject) {
    return (
      <SubjectDetailView
        subject={currentSubject}
        documents={currentSubjectDocuments}
        onOpenDocument={handleOpenDocument}
        onCreateDocument={handleCreateDocument}
        onEditSubject={() => handleOpenEditSubject(currentSubject)}
        onDeleteSubject={() => setSubjectToDelete(currentSubject)}
        onDeleteDocument={handleDeleteDocument}
        onToggleFavorite={toggleSummaryFavorite}
        onBackToOverview={handleBackToOverview}
        isMale={isMale}
      />
    );
  }

  // --- RENDER LEVEL 1: CADERNO DE ESTUDOS (OVERVIEW) ---
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              Caderno de Estudos
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Organize suas matérias, documentos e anotações como no Google Drive, de forma leve e pessoal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-new-study-subject"
            onClick={handleOpenNewSubject}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-white shadow-xs transition cursor-pointer ${
              isMale ? 'bg-[#1F3A34] hover:bg-[#162924]' : 'bg-[#1F3A34] hover:bg-[#162924]'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Nova Matéria</span>
          </button>
        </div>
      </div>

      {/* 2. Search Bar across the entire notebook */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={globalSearchQuery}
          onChange={(e) => setGlobalSearchQuery(e.target.value)}
          placeholder="🔎 Buscar no caderno por matéria, documento ou anotação..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-2xs placeholder:text-stone-400"
        />
        {globalSearchQuery && (
          <button
            onClick={() => setGlobalSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
          >
            ✕ Limpar
          </button>
        )}
      </div>

      {/* 3. Global Search Results View (when searching) */}
      {searchResults && (
        <div className="space-y-6 bg-stone-50/60 dark:bg-stone-900/40 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Resultados da busca por "{globalSearchQuery}"
            </h2>
            <button
              onClick={() => setGlobalSearchQuery('')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Voltar a todas as matérias
            </button>
          </div>

          {/* Matérias Encontradas */}
          {searchResults.subjects.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                Matérias ({searchResults.subjects.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {searchResults.subjects.map(subj => {
                  const count = summaries.filter(s => s.subjectId === subj.id).length;
                  return (
                    <StudySubjectCard
                      key={subj.id}
                      subject={subj}
                      documentsCount={count}
                      onOpen={() => handleOpenSubject(subj.id)}
                      onEdit={() => handleOpenEditSubject(subj)}
                      onDelete={() => setSubjectToDelete(subj)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Documentos Encontrados */}
          {searchResults.docs.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                Documentos & Anotações ({searchResults.docs.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchResults.docs.map(doc => {
                  const subj = subjects.find(s => s.id === doc.subjectId);
                  const preview = extractTextPreview(doc.content, 110);
                  const palette = getSubjectColor(subj?.color);
                  return (
                    <div
                      key={doc.id}
                      onClick={() => handleOpenDocument(doc)}
                      className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-500 shadow-2xs hover:shadow-xs transition cursor-pointer flex flex-col justify-between space-y-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-stone-400" />
                          <span className="font-serif text-sm font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                            {doc.title || 'Documento sem título'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                          {preview}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px]">
                        {subj && (
                          <span className={`px-2 py-0.5 rounded-full border ${palette.badge}`}>
                            {subj.icon || '📚'} {subj.name}
                          </span>
                        )}
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <span>Abrir</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {searchResults.subjects.length === 0 && searchResults.docs.length === 0 && (
            <div className="py-10 text-center text-stone-400 space-y-1">
              <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
                Nenhuma matéria ou documento encontrado com "{globalSearchQuery}"
              </p>
              <p className="text-xs">Tente buscar por outras palavras-chave ou crie uma nova matéria.</p>
            </div>
          )}
        </div>
      )}

      {/* 4. Normal Overview: Grid of Subjects */}
      {!searchResults && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Minhas Matérias ({subjects.length})
            </h2>
            {subjects.length > 0 && (
              <button
                onClick={handleOpenNewSubject}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>+ Adicionar Matéria</span>
              </button>
            )}
          </div>

          {subjects.length === 0 ? (
            /* Friendly Empty State with 1-click suggestions */
            <div className="bg-white dark:bg-stone-900 p-8 sm:p-12 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 text-center space-y-5">
              <div className="w-14 h-14 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 mx-auto flex items-center justify-center">
                <BookOpen className="w-7 h-7" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                  Comece o seu Caderno de Estudos
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                  Crie matérias para organizar seus resumos e anotações. Dentro de cada matéria, você poderá criar quantos documentos de estudo precisar.
                </p>
              </div>

              {/* 1-Click Quick Creation from user suggestions */}
              <div className="space-y-2 pt-1 max-w-lg mx-auto">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  Criar rapidamente uma matéria sugerida:
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                  {STUDY_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug.name}
                      onClick={() => {
                        addStudySubject({
                          name: sug.name,
                          icon: sug.icon,
                          color: sug.color,
                          description: `Caderno de estudos para ${sug.name}.`,
                        });
                        showToast(`Matéria "${sug.name}" criada com sucesso!`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-semibold transition cursor-pointer"
                    >
                      <span>{sug.icon}</span>
                      <span>{sug.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleOpenNewSubject}
                  className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-white shadow-xs transition cursor-pointer ${
                    isMale ? 'bg-[#1F3A34] hover:bg-[#162924]' : 'bg-[#1F3A34] hover:bg-[#162924]'
                  }`}
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Criar Matéria Personalizada</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {subjects.map((subj) => {
                const count = summaries.filter(s => s.subjectId === subj.id).length;
                return (
                  <StudySubjectCard
                    key={subj.id}
                    subject={subj}
                    documentsCount={count}
                    onOpen={() => handleOpenSubject(subj.id)}
                    onEdit={() => handleOpenEditSubject(subj)}
                    onDelete={() => setSubjectToDelete(subj)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Modals */}
      {/* Subject Modal (Create / Edit) */}
      <StudySubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        onSave={handleSaveSubject}
        initialSubject={editingSubject}
        isMale={isMale}
      />

      {/* Delete Subject Confirmation Modal */}
      <StudyDeleteConfirmModal
        isOpen={Boolean(subjectToDelete)}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={handleConfirmDeleteSubject}
        title={`Excluir matéria "${subjectToDelete?.name}"?`}
        message={`Todos os documentos e anotações vinculados a "${subjectToDelete?.name}" serão excluídos permanentemente. Essa ação não poderá ser desfeita.`}
        confirmButtonText="Excluir Matéria e Documentos"
      />
    </div>
  );
};
