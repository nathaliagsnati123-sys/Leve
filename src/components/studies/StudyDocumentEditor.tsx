import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  CheckSquare,
  Minus,
  Lightbulb,
  BookOpen,
  Eye,
  Edit3,
  Columns,
  Star,
  CheckCircle2,
  Trash2,
  Sparkles,
  Save,
  Check,
  ChevronDown
} from 'lucide-react';
import { StudySubject, StudySummary, StudyReviewStatus } from '../../types';
import { STUDY_TEMPLATES, getSubjectColor } from './studyUtils';
import { StudyDeleteConfirmModal } from './StudyDeleteConfirmModal';

interface StudyDocumentEditorProps {
  subject: StudySubject;
  initialDocument: StudySummary;
  onSave: (doc: StudySummary) => void;
  onDelete: (id: string) => void;
  onBackToSubject: () => void;
  onBackToOverview: () => void;
  isMale?: boolean;
}

export const StudyDocumentEditor: React.FC<StudyDocumentEditorProps> = ({
  subject,
  initialDocument,
  onSave,
  onDelete,
  onBackToSubject,
  onBackToOverview,
  isMale = false,
}) => {
  const [title, setTitle] = useState(initialDocument.title);
  const [content, setContent] = useState(initialDocument.content);
  const [reviewStatus, setReviewStatus] = useState<StudyReviewStatus>(initialDocument.reviewStatus || 'novo');
  const [favorite, setFavorite] = useState<boolean>(Boolean(initialDocument.favorite));

  // Editor mode: 'edit' | 'preview' | 'split'
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTemplatesMenuOpen, setIsTemplatesMenuOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstMount = useRef(true);

  const palette = getSubjectColor(subject.color);

  // Sync state with prop if document changes from outside
  useEffect(() => {
    setTitle(initialDocument.title);
    setContent(initialDocument.content);
    setReviewStatus(initialDocument.reviewStatus || 'novo');
    setFavorite(Boolean(initialDocument.favorite));
    setSaveStatus('saved');
  }, [initialDocument.id]);

  // Debounced Autosave
  const triggerAutoSave = useCallback(
    (newTitle: string, newContent: string, newStatus: StudyReviewStatus, newFav: boolean) => {
      setSaveStatus('saving');

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        onSave({
          ...initialDocument,
          title: newTitle.trim() || 'Documento sem título',
          content: newContent,
          reviewStatus: newStatus,
          favorite: newFav,
          updatedAt: new Date().toISOString(),
        });
        setSaveStatus('saved');
      }, 800);
    },
    [initialDocument, onSave]
  );

  // Handle Title Change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    triggerAutoSave(val, content, reviewStatus, favorite);
  };

  // Handle Content Change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    triggerAutoSave(title, val, reviewStatus, favorite);
  };

  // Handle Status Toggle
  const handleStatusChange = (status: StudyReviewStatus) => {
    setReviewStatus(status);
    triggerAutoSave(title, content, status, favorite);
  };

  // Handle Favorite Toggle
  const handleFavoriteToggle = () => {
    const next = !favorite;
    setFavorite(next);
    triggerAutoSave(title, content, reviewStatus, next);
  };

  // Text Insertion Helper for Toolbar
  const insertFormatting = (before: string, after: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultText;

    const replacement = `${before}${selectedText}${after}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);

    setContent(newContent);
    triggerAutoSave(title, newContent, reviewStatus, favorite);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 10);
  };

  const insertBlock = (blockText: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      const nextContent = content ? `${content}\n\n${blockText}` : blockText;
      setContent(nextContent);
      triggerAutoSave(title, nextContent, reviewStatus, favorite);
      return;
    }

    const start = textarea.selectionStart;
    const before = content.substring(0, start);
    const after = content.substring(start);
    const needLeadingNewline = before.length > 0 && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '';

    const newContent = `${before}${needLeadingNewline}${blockText}\n${after}`;
    setContent(newContent);
    triggerAutoSave(title, newContent, reviewStatus, favorite);

    setTimeout(() => {
      textarea.focus();
      const pos = start + needLeadingNewline.length + blockText.length;
      textarea.setSelectionRange(pos, pos);
    }, 10);
  };

  // Keyboard Shortcuts: Ctrl+B, Ctrl+I, Ctrl+S
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      insertFormatting('**', '**', 'texto em negrito');
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      insertFormatting('*', '*', 'texto em itálico');
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      onSave({
        ...initialDocument,
        title: title.trim() || 'Documento sem título',
        content,
        reviewStatus,
        favorite,
        updatedAt: new Date().toISOString(),
      });
      setSaveStatus('saved');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      insertFormatting('  ', '');
    }
  };

  // Toggle checklist checkbox from reading view
  const handleToggleChecklist = (lineIndex: number) => {
    const lines = content.split('\n');
    const targetLine = lines[lineIndex];
    if (!targetLine) return;

    if (targetLine.includes('- [ ]')) {
      lines[lineIndex] = targetLine.replace('- [ ]', '- [x]');
    } else if (targetLine.includes('- [x]') || targetLine.includes('- [X]')) {
      lines[lineIndex] = targetLine.replace(/- \[[xX]\]/, '- [ ]');
    }

    const newContent = lines.join('\n');
    setContent(newContent);
    triggerAutoSave(title, newContent, reviewStatus, favorite);
  };

  // Render formatted study content for Preview and Reading Mode
  const renderFormattedContent = () => {
    if (!content.trim()) {
      return (
        <div className="py-16 text-center text-stone-400 space-y-2">
          <BookOpen className="w-10 h-10 mx-auto opacity-40" />
          <p className="text-sm font-medium">Este documento de estudo ainda está vazio.</p>
          <p className="text-xs">Mude para o Modo Edição acima para começar a escrever.</p>
        </div>
      );
    }

    const lines = content.split('\n');
    return (
      <div className="space-y-3 font-sans text-stone-800 dark:text-stone-200 leading-relaxed">
        {lines.map((rawLine, idx) => {
          const line = rawLine;

          // H1
          if (line.startsWith('# ')) {
            return (
              <h1 key={idx} className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 pt-3 pb-1 border-b border-stone-200 dark:border-stone-800">
                {line.replace('# ', '')}
              </h1>
            );
          }

          // H2
          if (line.startsWith('## ')) {
            return (
              <h2 key={idx} className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 pt-3 pb-0.5">
                {line.replace('## ', '')}
              </h2>
            );
          }

          // H3
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="font-serif text-lg font-bold text-stone-800 dark:text-stone-200 pt-2">
                {line.replace('### ', '')}
              </h3>
            );
          }

          // Horizontal Rule
          if (line.trim() === '---' || line.trim() === '***') {
            return <hr key={idx} className="my-4 border-stone-200 dark:border-stone-800" />;
          }

          // Callout / Highlight box
          if (line.startsWith('> 💡') || line.startsWith('> ⚠️') || line.startsWith('>')) {
            const clean = line.replace(/^>\s*/, '');
            return (
              <div
                key={idx}
                className="my-3 p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-sm font-medium shadow-2xs"
              >
                {renderInlineStyles(clean)}
              </div>
            );
          }

          // Checklist line: - [ ] or - [x]
          if (/^[-*]\s*\[[ xX]\]\s*/.test(line)) {
            const isChecked = /^[-*]\s*\[[xX]\]\s*/.test(line);
            const text = line.replace(/^[-*]\s*\[[ xX]\]\s*/, '');
            return (
              <div
                key={idx}
                onClick={() => handleToggleChecklist(idx)}
                className="flex items-start gap-3 py-1 cursor-pointer group select-none"
              >
                <div className={`mt-0.5 p-0.5 rounded-lg border transition ${
                  isChecked
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 group-hover:border-emerald-500'
                }`}>
                  <Check className={`w-3.5 h-3.5 ${isChecked ? 'opacity-100' : 'opacity-0'}`} />
                </div>
                <span className={`text-sm sm:text-base leading-relaxed ${
                  isChecked ? 'line-through text-stone-400 dark:text-stone-500' : 'text-stone-800 dark:text-stone-200'
                }`}>
                  {renderInlineStyles(text)}
                </span>
              </div>
            );
          }

          // Bullet List
          if (/^[-*]\s+/.test(line)) {
            const text = line.replace(/^[-*]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2.5 py-0.5 pl-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 dark:bg-emerald-400 mt-2 shrink-0" />
                <span className="text-sm sm:text-base">{renderInlineStyles(text)}</span>
              </div>
            );
          }

          // Numbered List
          if (/^\d+\.\s+/.test(line)) {
            const match = line.match(/^(\d+)\.\s+(.*)/);
            if (match) {
              return (
                <div key={idx} className="flex items-start gap-2.5 py-0.5 pl-2">
                  <span className="font-bold text-xs text-stone-500 dark:text-stone-400 mt-1 shrink-0 min-w-4">
                    {match[1]}.
                  </span>
                  <span className="text-sm sm:text-base">{renderInlineStyles(match[2])}</span>
                </div>
              );
            }
          }

          // Empty line
          if (!line.trim()) {
            return <div key={idx} className="h-2" />;
          }

          // Normal Paragraph
          return (
            <p key={idx} className="text-sm sm:text-base leading-relaxed">
              {renderInlineStyles(line)}
            </p>
          );
        })}
      </div>
    );
  };

  // Helper for bold, italic and underline inline styles
  const renderInlineStyles = (text: string): React.ReactNode => {
    // Process bold **text**
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|<u>[^<]+<\/u>)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-stone-900 dark:text-stone-100">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('<u>') && part.endsWith('</u>')) {
        return <u key={i} className="underline">{part.slice(3, -4)}</u>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-16">
      {/* 1. BREADCRUMBS & TOP NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
          <button
            onClick={onBackToOverview}
            className="text-stone-500 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition cursor-pointer flex items-center gap-1.5"
          >
            <span>Caderno de Estudos</span>
          </button>

          <span className="text-stone-300 dark:text-stone-600">/</span>

          <button
            onClick={onBackToSubject}
            className="font-medium text-stone-700 dark:text-stone-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition cursor-pointer flex items-center gap-1.5"
          >
            <span>{subject.icon || '📚'}</span>
            <span>{subject.name}</span>
          </button>

          <span className="text-stone-300 dark:text-stone-600">/</span>

          <span className="font-semibold text-stone-900 dark:text-stone-100 truncate max-w-[200px]">
            {title || 'Documento sem título'}
          </span>
        </div>

        {/* Back and Autosave Status */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Autosave badge */}
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            {saveStatus === 'saving' ? (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Salvando...</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>Salvo automaticamente</span>
              </span>
            )}
          </div>

          {/* Return Button */}
          <button
            onClick={onBackToSubject}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para {subject.name}</span>
          </button>
        </div>
      </div>

      {/* 2. DOCUMENT METADATA TOOLBAR */}
      <div className="bg-white dark:bg-stone-900 px-4 py-3 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Status Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 mr-1 hidden sm:inline">
            Status:
          </span>
          {(['novo', 'em_revisao', 'revisado', 'dominado'] as StudyReviewStatus[]).map((st) => {
            const labels: Record<StudyReviewStatus, string> = {
              novo: 'Novo',
              em_revisao: 'Em Revisão',
              revisado: 'Revisado',
              dominado: 'Dominado'
            };
            const isSelected = reviewStatus === st;
            return (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition cursor-pointer ${
                  isSelected
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                }`}
              >
                {labels[st]}
              </button>
            );
          })}
        </div>

        {/* Favorite & Mode Toggles */}
        <div className="flex items-center gap-2">
          {/* Favorite */}
          <button
            onClick={handleFavoriteToggle}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              favorite
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-500 border-amber-200 dark:border-amber-800'
                : 'bg-stone-50 dark:bg-stone-800 text-stone-400 border-stone-200 dark:border-stone-700 hover:text-amber-500'
            }`}
            title={favorite ? 'Remover dos favoritos' : 'Marcar como favorito'}
          >
            <Star className={`w-4 h-4 ${favorite ? 'fill-amber-500' : ''}`} />
          </button>

          {/* View Mode: Edit, Preview, Split */}
          <div className="flex items-center p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700">
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'edit'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>

            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Modo Leitura</span>
            </button>

            <button
              onClick={() => setViewMode('split')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
              title="Editor e Leitura lado a lado"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Lado a Lado</span>
            </button>
          </div>

          {/* Delete Document Button */}
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
            title="Excluir documento"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. GOOGLE DOCS STYLE FORMATTING TOOLBAR (Visible in Edit & Split mode) */}
      {(viewMode === 'edit' || viewMode === 'split') && (
        <div className="bg-white dark:bg-stone-900 p-2.5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-wrap items-center gap-1 sm:gap-2">
          {/* Headings */}
          <div className="flex items-center gap-1 border-r border-stone-200 dark:border-stone-800 pr-2">
            <button
              type="button"
              onClick={() => insertBlock('# Título 1')}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              title="Título Principal (H1)"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => insertBlock('## Subtítulo 2')}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              title="Subtítulo (H2)"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => insertBlock('### Tópico 3')}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              title="Tópico (H3)"
            >
              H3
            </button>
          </div>

          {/* Text Style: Bold, Italic, Underline */}
          <div className="flex items-center gap-1 border-r border-stone-200 dark:border-stone-800 pr-2">
            <button
              type="button"
              onClick={() => insertFormatting('**', '**', 'negrito')}
              className="p-1.5 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              title="Negrito (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('*', '*', 'itálico')}
              className="p-1.5 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              title="Itálico (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('<u>', '</u>', 'sublinhado')}
              className="p-1.5 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              title="Sublinhado"
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-1 border-r border-stone-200 dark:border-stone-800 pr-2">
            <button
              type="button"
              onClick={() => insertBlock('- Item da lista')}
              className="p-1.5 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              title="Lista com marcadores"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertBlock('1. Primeiro item\n2. Segundo item')}
              className="p-1.5 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              title="Lista numerada"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertBlock('- [ ] Tópico para revisar')}
              className="p-1.5 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              title="Checklist / Tarefa de revisão"
            >
              <CheckSquare className="w-4 h-4" />
            </button>
          </div>

          {/* Important Callout / Divider */}
          <div className="flex items-center gap-1 border-r border-stone-200 dark:border-stone-800 pr-2">
            <button
              type="button"
              onClick={() => insertBlock('> 💡 **Atenção / Ponto Importante:**\n> Escreva aqui o conceito mais cobrado.')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 transition cursor-pointer"
              title="Destaque de Informação Importante"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Destaque</span>
            </button>

            <button
              type="button"
              onClick={() => insertBlock('---')}
              className="p-1.5 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              title="Linha Divisória / Separador"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Templates Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTemplatesMenuOpen(!isTemplatesMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Modelos Prontos</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isTemplatesMenuOpen && (
              <div className="absolute left-0 mt-1 w-64 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 p-2 z-30 animate-in fade-in duration-150">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 py-1">
                  Inserir Estrutura Pronta
                </div>
                {STUDY_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setIsTemplatesMenuOpen(false);
                      if (content.trim() && !window.confirm('Substituir ou anexar modelo ao documento atual? Clique OK para anexar ao final.')) {
                        return;
                      }
                      const next = content.trim() ? `${content}\n\n${tmpl.content}` : tmpl.content;
                      setContent(next);
                      triggerAutoSave(title, next, reviewStatus, favorite);
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition space-y-0.5 cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                      {tmpl.name}
                    </div>
                    <div className="text-[11px] text-stone-400 leading-tight">
                      {tmpl.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. MAIN WRITING SHEET / GOOGLE DOCS CANVAS */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-sm overflow-hidden">
        {/* Document Header Title (Google Docs Style) */}
        <div className="p-6 sm:p-10 border-b border-stone-100 dark:border-stone-800/80">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Título do Documento de Estudo..."
            className="w-full font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600 bg-transparent border-none focus:outline-none focus:ring-0"
          />
        </div>

        {/* View Mode Body */}
        {viewMode === 'edit' && (
          <div className="p-6 sm:p-10">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder="Escreva aqui suas anotações, resumos, explicações, tópicos das aulas ou revisões para a prova...

Dicas de formatação rápida:
• Use # para Título e ## para Subtítulo
• Use **palavra** para negrito
• Use - [ ] para criar checklists de revisão
• Use > 💡 para caixas de destaque importantes"
              rows={22}
              className="w-full bg-transparent resize-y border-none focus:outline-none focus:ring-0 font-sans text-base sm:text-lg leading-relaxed text-stone-800 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-600 min-h-[500px]"
            />
          </div>
        )}

        {viewMode === 'preview' && (
          <div className="p-6 sm:p-10 min-h-[500px]">
            {renderFormattedContent()}
          </div>
        )}

        {viewMode === 'split' && (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-200 dark:divide-stone-800">
            <div className="p-6 sm:p-8">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-3">
                Área de Edição
              </div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                rows={20}
                className="w-full bg-transparent resize-y border-none focus:outline-none focus:ring-0 font-sans text-sm sm:text-base leading-relaxed text-stone-800 dark:text-stone-200 min-h-[450px]"
              />
            </div>

            <div className="p-6 sm:p-8 bg-stone-50/40 dark:bg-stone-900/40">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-3">
                Visualização Formatada
              </div>
              {renderFormattedContent()}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <StudyDeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => onDelete(initialDocument.id)}
        title="Excluir este documento?"
        message={`Tem certeza que deseja excluir o documento "${title || 'sem título'}"? Essa ação não poderá ser desfeita.`}
        confirmButtonText="Excluir Documento"
      />
    </div>
  );
};
