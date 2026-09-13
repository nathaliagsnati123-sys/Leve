import React, { useState, useRef } from 'react';
import { X, Upload, Camera, Sparkles, Check, Trash2, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserAvatar, isImageAvatar } from '../common/UserAvatar';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMOJI_AVATARS = [
  '🌿', '🌸', '✨', '🕊️', '☀️', '🪴', '☕', '🌻', 
  '🧘‍♀️', '🌊', '🦋', '🌱', '🤍', '📖', '🕯️', '🎨', 
  '🌙', '🍓', '🍵', '🌺', '🍃', '💫', '🕊️', '🍂'
];

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({ isOpen, onClose }) => {
  const { data, updateUserProfile, showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentAvatar = data.user?.avatar || '🌿';
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Process and compress image to a lightweight base64 JPEG
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione um arquivo de imagem válido.', 'error');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context not available');

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          setSelectedAvatar(compressedDataUrl);
          updateUserProfile({ avatar: compressedDataUrl });
          showToast('Foto de perfil atualizada com sucesso! ✨', 'success');
          setIsProcessing(false);
          onClose();
        } catch (err) {
          console.error('Error compressing image:', err);
          showToast('Erro ao processar imagem. Tente uma foto menor.', 'error');
          setIsProcessing(false);
        }
      };
      img.onerror = () => {
        showToast('Não foi possível carregar esta imagem.', 'error');
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      showToast('Erro ao ler o arquivo.', 'error');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectEmoji = (emoji: string) => {
    setSelectedAvatar(emoji);
    updateUserProfile({ avatar: emoji });
    showToast('Avatar atualizado! ✨', 'success');
    onClose();
  };

  const handleResetAvatar = () => {
    setSelectedAvatar('🌿');
    updateUserProfile({ avatar: '🌿' });
    showToast('Avatar restaurado para o padrão.', 'info');
    onClose();
  };

  const isCustomPhoto = isImageAvatar(selectedAvatar);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-[#121A17] border border-stone-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3 bg-stone-50/60 dark:bg-stone-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                Foto ou Avatar do Perfil
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Personalize como você aparece no app
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 flex items-center justify-center transition cursor-pointer"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Preview central */}
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative group">
              <UserAvatar
                avatar={selectedAvatar}
                name={data.user?.name}
                size="xl"
                className="w-24 h-24 text-4xl shadow-md ring-4 ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
                title="Alterar foto"
              >
                <Camera className="w-6 h-6" />
                <span className="text-[10px] font-semibold">Alterar</span>
              </button>
            </div>

            <div>
              <p className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                {data.user?.name || 'Você'}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {isCustomPhoto ? 'Foto personalizada' : 'Ícone / Ilustração'}
              </p>
            </div>

            {/* Input escondido para foto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Ações de Foto */}
            <div className="flex items-center gap-2 pt-1 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-xs font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isProcessing ? 'Processando...' : 'Carregar Foto do Computador'}</span>
              </button>

              {isCustomPhoto && (
                <button
                  type="button"
                  onClick={handleResetAvatar}
                  className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                  title="Remover foto personalizada"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Remover Foto</span>
                </button>
              )}
            </div>
          </div>

          {/* Opção de escolher avatar / emoji */}
          <div className="space-y-2.5 pt-4 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Ou escolha um ícone sereno</span>
              </span>
            </div>

            <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
              {EMOJI_AVATARS.map((emoji) => {
                const isSelected = selectedAvatar === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelectEmoji(emoji)}
                    className={`h-11 rounded-2xl flex items-center justify-center text-xl transition cursor-pointer relative ${
                      isSelected
                        ? 'bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-600 scale-105 shadow-2xs'
                        : 'bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 hover:scale-105'
                    }`}
                  >
                    <span>{emoji}</span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
