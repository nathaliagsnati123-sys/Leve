import React, { useState, useRef } from 'react';
import { Folder, MoreVertical, Edit3, Trash2, ChevronRight, Camera, ImagePlus, Maximize2 } from 'lucide-react';
import { StudySubject } from '../../types';
import { getSubjectColor, compressImageFile } from './studyUtils';

interface StudySubjectCardProps {
  subject: StudySubject;
  documentsCount: number;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateCover?: (newCoverUrl?: string) => void;
}

export const StudySubjectCard: React.FC<StudySubjectCardProps> = ({
  subject,
  documentsCount,
  onOpen,
  onEdit,
  onDelete,
  onUpdateCover,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Modo de exibição da imagem: 'cover' ou 'contain'
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('contain');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const palette = getSubjectColor(subject.color);
  const coverPhoto = subject.coverUrl || subject.imageUrl;

  React.useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = () => setMenuOpen(false);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, [menuOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateCover) return;

    setIsUploading(true);
    try {
      const compressed = await compressImageFile(file);
      onUpdateCover(compressed);
    } catch (err) {
      console.error('Erro ao comprimir imagem de capa:', err);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveCover = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateCover) {
      onUpdateCover(undefined);
    }
  };

  const toggleFitMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFitMode((prev) => (prev === 'cover' ? 'contain' : 'cover'));
  };

  return (
    <div
      onClick={onOpen}
      className={`group relative bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 p-4 sm:p-4.5 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden hover:-translate-y-1 ${palette.border} w-full`}
    >
      {/* Input invisível para upload direto da foto de capa */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Lombada/faixa de caderno na lateral esquerda para dar aspecto visual de caderno físico */}
      <div 
        className="absolute top-0 bottom-0 left-0 w-2 transition-all group-hover:w-2.5 z-20"
        style={{ backgroundColor: palette.accent }}
      />

      {/* Linha sutil de costura de caderno ao lado da lombada */}
      <div className="absolute top-0 bottom-0 left-2.5 w-px border-r border-dashed border-stone-300/40 dark:border-stone-700/40 z-20" />

      {/* Conteúdo Principal do Card */}
      <div className="pl-1.5 space-y-3.5">
        {coverPhoto ? (
          /* ========================================================================= */
          /* CAPA HORIZONTAL / DEITADA (PROPORÇÃO 16:9 - PADRÃO VÍDEO / BANNER / FEED) */
          /* Suporta perfeitamente: 16:9, 1200x630, 4:5, 9:16 Stories e 1:1 Quadrado    */
          /* ========================================================================= */
          <div className="relative w-full aspect-[16/9] sm:aspect-[16/10] rounded-2xl overflow-hidden bg-stone-950 border border-stone-100 dark:border-stone-800 shadow-inner group/cover">
            {/* 1. Camada de Fundo Ambiente Desfocado (Garante que fotos de qualquer proporção preencham de forma harmônica) */}
            <img
              src={coverPhoto}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-60 dark:opacity-45 pointer-events-none"
            />

            {/* 2. Camada Principal da Imagem */}
            <img
              src={coverPhoto}
              alt={`Capa de ${subject.name}`}
              className={`relative z-10 w-full h-full ${
                fitMode === 'contain' ? 'object-contain' : 'object-cover object-center'
              } group-hover:scale-102 transition-transform duration-500`}
            />

            {/* Gradiente de proteção para textos e botões */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/15 to-black/40 pointer-events-none" />

            {/* Ícone da matéria em destaque sobre a capa */}
            <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
              <span className="text-lg sm:text-xl px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white shadow-xs border border-white/10">
                {subject.icon || '📚'}
              </span>
            </div>

            {/* Botões de Ação Rápida no Topo da Capa */}
            <div 
              className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 group-hover/cover:opacity-100 transition-opacity" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Alternar modo de ajuste (Preencher vs Mostrar inteira) */}
              <button
                type="button"
                onClick={toggleFitMode}
                className="p-1.5 rounded-xl bg-black/60 hover:bg-black/85 text-white backdrop-blur-md transition cursor-pointer shadow-xs"
                title={fitMode === 'cover' ? 'Ver imagem inteira' : 'Preencher capa'}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {onUpdateCover && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-1.5 rounded-xl bg-white/90 hover:bg-white text-stone-900 backdrop-blur-md transition cursor-pointer shadow-xs"
                  title="Trocar foto de capa"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}

              {onUpdateCover && (
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="p-1.5 rounded-xl bg-rose-600/85 hover:bg-rose-600 text-white backdrop-blur-md transition cursor-pointer shadow-xs"
                  title="Remover foto de capa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Rodapé da Capa: Contagem de Documentos */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between text-white text-[11px] font-semibold">
              <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-xs">
                {documentsCount} {documentsCount === 1 ? 'documento' : 'documentos'}
              </span>

              <span className="text-[10px] text-white/80 font-normal px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-xs">
                Caderno
              </span>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* CAPA HORIZONTAL / DEITADA SEM FOTO (DESIGN ELEGANTE DE CADERNO)           */
          /* ========================================================================= */
          <div className="relative w-full aspect-[16/9] sm:aspect-[16/10] rounded-2xl overflow-hidden bg-gradient-to-b from-stone-50 to-stone-100/80 dark:from-stone-850 dark:to-stone-900 border border-stone-200/70 dark:border-stone-800 p-3.5 sm:p-4 flex flex-col justify-between">
            {/* Linhas pautadas decorativas de caderno */}
            <div className="absolute inset-0 opacity-15 dark:opacity-10 pointer-events-none bg-[radial-gradient(#78716c_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Topo: Ícone + Ações */}
            <div className="relative z-10 flex items-start justify-between">
              <div className="text-3xl p-2 rounded-2xl bg-white dark:bg-stone-800 shadow-xs border border-stone-200/80 dark:border-stone-700 transition-transform group-hover:scale-105">
                {subject.icon || '📚'}
              </div>

              {/* Ações e Menu */}
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {onUpdateCover && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-1.5 text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-white dark:hover:bg-stone-800 rounded-xl transition cursor-pointer shadow-2xs"
                    title="Adicionar foto de capa"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-white dark:hover:bg-stone-800 rounded-xl transition cursor-pointer shadow-2xs"
                    title="Opções da matéria"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onEdit();
                        }}
                        className="w-full px-3.5 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 text-left cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-stone-400" />
                        <span>Editar Matéria</span>
                      </button>
                      {onUpdateCover && (
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            fileInputRef.current?.click();
                          }}
                          className="w-full px-3.5 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 text-left cursor-pointer"
                        >
                          <ImagePlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Adicionar Foto de Capa</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete();
                        }}
                        className="w-full px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 text-left cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Excluir Matéria</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Centro: Botão amigável de adicionar foto deitada/horizontal */}
            <div className="relative z-10 my-auto text-center py-1" onClick={(e) => e.stopPropagation()}>
              {onUpdateCover && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-semibold hover:text-emerald-700 dark:hover:text-emerald-400 border border-stone-200/80 dark:border-stone-700 shadow-2xs hover:shadow-xs transition cursor-pointer"
                >
                  <ImagePlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Adicionar Capa</span>
                </button>
              )}
            </div>

            {/* Base: Badge com contagem de documentos */}
            <div className="relative z-10 flex items-center justify-between">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${palette.badge}`}>
                {documentsCount} {documentsCount === 1 ? 'documento' : 'documentos'}
              </span>
              <span className="text-[10px] text-stone-400 font-medium">
                Caderno de Estudos
              </span>
            </div>
          </div>
        )}

        {/* Nome da Matéria e Descrição */}
        <div className="space-y-1">
          <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors line-clamp-1">
            {subject.name}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed min-h-[2rem]">
            {subject.description || 'Caderno pessoal de anotações, resumos e documentos de aula.'}
          </p>
        </div>
      </div>

      {/* Rodapé do Card com Seta pro Lado */}
      <div className="pl-1.5 pt-3 mt-1 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition">
        <div className="flex items-center gap-1.5 font-medium">
          <Folder className="w-3.5 h-3.5 opacity-70" />
          <span>Abrir caderno</span>
        </div>
        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-stone-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400" />
      </div>
    </div>
  );
};
