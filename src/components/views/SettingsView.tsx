import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Settings, Sun, Moon, User, Check, HeartHandshake, 
  Upload, Trash2, Save, Sparkles, CheckCircle2
} from 'lucide-react';
import { TreatmentPreference } from '../../types';
import { TREATMENT_OPTIONS, normalizeTreatmentPreference } from '../../utils/treatment';
import { SectionVisibilityCard } from './SectionVisibilityCard';
import { UserAvatar, isImageAvatar } from '../common/UserAvatar';

export const SettingsView: React.FC = () => {
  const { data, updateUser, showToast } = useApp();
  const { 
    user,
    treatmentPreference: authTreatmentPref, 
    updateTreatmentPreference,
    saveProfile
  } = useAuth();

  // 1. Estado local de Perfil
  const [name, setName] = useState(data.user?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(data.user?.avatar || '🌿');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. Estado local de Preferência de Tratamento
  const [selectedPreference, setSelectedPreference] = useState<TreatmentPreference>(() => {
    return normalizeTreatmentPreference(
      data.user?.treatmentPreference || authTreatmentPref || 'nao_informar'
    );
  });
  const [treatmentSaved, setTreatmentSaved] = useState(false);

  // 3. Estado local de Tema / Aparência
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>(() => {
    return data.user?.theme === 'dark' ? 'dark' : 'light';
  });
  const [themeSaved, setThemeSaved] = useState(false);

  // Sincroniza estados iniciais caso mudem externamente
  useEffect(() => {
    if (data.user?.name !== undefined) {
      setName(data.user.name);
    }
  }, [data.user?.name]);

  useEffect(() => {
    if (data.user?.avatar) {
      setSelectedAvatar(data.user.avatar);
    }
  }, [data.user?.avatar]);

  useEffect(() => {
    if (data.user?.treatmentPreference) {
      setSelectedPreference(normalizeTreatmentPreference(data.user.treatmentPreference));
    }
  }, [data.user?.treatmentPreference]);

  useEffect(() => {
    if (data.user?.theme) {
      setSelectedTheme(data.user.theme === 'dark' ? 'dark' : 'light');
    }
  }, [data.user?.theme]);

  const avatarOptions = [
    '🌿', '🌸', '✨', '☕', '🕊️', '🧘‍♀️', '📖', '🌊', '🦋', '🌱',
    '☀️', '🪴', '🌻', '🤍', '🕯️', '🎨', '🌙', '🍓', '🍵', '🌺'
  ];

  // =========================================================================
  // Manipulação de Foto
  // =========================================================================
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione um arquivo de imagem válido.', 'gentle');
      return;
    }

    setIsProcessingPhoto(true);
    setProfileSaved(false);
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
          showToast('Foto carregada! Clique em "Salvar Alterações do Perfil" para confirmar. ✨');
          setIsProcessingPhoto(false);
        } catch (err) {
          console.error('Error compressing image:', err);
          showToast('Erro ao processar imagem.', 'gentle');
          setIsProcessingPhoto(false);
        }
      };
      img.onerror = () => {
        showToast('Não foi possível carregar a imagem.', 'gentle');
        setIsProcessingPhoto(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      showToast('Erro ao ler o arquivo.', 'gentle');
      setIsProcessingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  // =========================================================================
  // 1. Salvar Perfil (Nome e Avatar)
  // =========================================================================
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = name.trim();

    updateUser({
      name: cleanName,
      avatar: selectedAvatar
    });

    try {
      localStorage.setItem('leve_user_name', cleanName);
      localStorage.setItem('leve_user_avatar', selectedAvatar);
    } catch {}

    if (user) {
      try {
        await saveProfile({
          name: cleanName,
          avatar: selectedAvatar
        });
      } catch (err) {
        console.warn('Erro ao salvar perfil remoto:', err);
      }
    }

    setProfileSaved(true);
    showToast('Perfil salvo com sucesso! ✨', 'success');
    setTimeout(() => {
      setProfileSaved(false);
    }, 3500);
  };

  // =========================================================================
  // 2. Salvar Forma de Tratamento (Pronomes / Modo de Conversa)
  // =========================================================================
  const handleSaveTreatment = async () => {
    const normalized = normalizeTreatmentPreference(selectedPreference);

    updateUser({ treatmentPreference: normalized });

    try {
      localStorage.setItem('leve_treatment_preference', normalized);
      localStorage.setItem('leve_treatment_pref_current', normalized);
      if (user?.id) {
        localStorage.setItem('leve_treatment_pref_' + user.id, normalized);
      }
    } catch {}

    try {
      await updateTreatmentPreference(normalized);
    } catch (err) {
      console.warn('Erro ao salvar preferência:', err);
    }

    if (user) {
      try {
        await saveProfile({
          treatment_preference: normalized
        });
      } catch (err) {
        console.warn('Erro ao sincronizar preferência:', err);
      }
    }

    const optLabel = TREATMENT_OPTIONS.find((o) => o.id === normalized)?.label || normalized;
    setTreatmentSaved(true);
    showToast(`Forma de tratamento salva: ${optLabel} ✨`, 'success');
    setTimeout(() => {
      setTreatmentSaved(false);
    }, 3500);
  };

  // =========================================================================
  // 3. Salvar Aparência do Aplicativo (Tema Claro / Escuro)
  // =========================================================================
  const handleSaveTheme = () => {
    updateUser({ theme: selectedTheme });

    try {
      localStorage.setItem('leve_theme', selectedTheme);
      if (selectedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {}

    setThemeSaved(true);
    showToast(selectedTheme === 'dark' ? 'Modo Escuro salvo com sucesso! 🌙' : 'Modo Claro salvo com sucesso! ☀️', 'success');
    setTimeout(() => {
      setThemeSaved(false);
    }, 3500);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center gap-3.5 bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
            Configurações
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Personalize seu perfil, forma de tratamento, aparência e seções do aplicativo.
          </p>
        </div>
      </div>

      {/* =====================================================================
          1. SEU PERFIL
         ===================================================================== */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>Seu Perfil</span>
          </h3>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            Identidade visual no aplicativo
          </span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs sm:text-sm">
          <div className="space-y-1.5">
            <label className="font-medium text-stone-700 dark:text-stone-300">
              Como prefere ser chamado?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setProfileSaved(false);
              }}
              placeholder="Digite seu nome"
              className="w-full max-w-md px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
            />
          </div>

          <div className="space-y-3 pt-1">
            <label className="font-medium text-stone-700 dark:text-stone-300 block">
              Foto ou Avatar do perfil
            </label>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700">
              <div className="relative group shrink-0">
                <UserAvatar 
                  avatar={selectedAvatar} 
                  name={name} 
                  size="xl" 
                  className="w-16 h-16 text-3xl shadow-xs ring-2 ring-emerald-500/20"
                />
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="px-3.5 py-2 rounded-xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{isProcessingPhoto ? 'Processando...' : 'Carregar Foto'}</span>
                  </button>

                  {isImageAvatar(selectedAvatar) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAvatar('🌿');
                        setProfileSaved(false);
                      }}
                      className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Remover Foto</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {isImageAvatar(selectedAvatar)
                    ? 'Foto personalizada carregada. Não esqueça de salvar abaixo.'
                    : 'Você pode subir uma foto sua do celular ou computador, ou escolher um dos ícones abaixo.'}
                </p>
              </div>
            </div>

            {/* Grid de Ícones e Emojis serenos */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs text-stone-600 dark:text-stone-400">
                Ou selecione um ícone de perfil:
              </span>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {avatarOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(emoji);
                      setProfileSaved(false);
                    }}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition cursor-pointer ${
                      selectedAvatar === emoji
                        ? 'bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-600 scale-105 shadow-2xs'
                        : 'bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-750'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Botão de Salvar Alterações de Perfil */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {profileSaved ? '✅ Perfil gravado com sucesso no seu dispositivo.' : 'Clique abaixo para salvar seu nome e foto.'}
            </span>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-xs transition cursor-pointer shadow-xs"
            >
              {profileSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
                  <span>Alterações Salvas com Sucesso!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Salvar Alterações do Perfil</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* =====================================================================
          2. COMO VOCÊ QUER SER TRATADO?
         ===================================================================== */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-0.5">
            <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Como você quer ser tratado?</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Define a linguagem e pronomes de acolhimento nos diálogos com a LEVIA e mensagens diárias.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Atual: <strong>{TREATMENT_OPTIONS.find((o) => o.id === (data.user?.treatmentPreference || 'nao_informar'))?.label || 'Não informado'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {TREATMENT_OPTIONS.map((opt) => {
            const isSelected = selectedPreference === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setSelectedPreference(opt.id);
                  setTreatmentSaved(false);
                }}
                className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-600 text-emerald-950 dark:text-emerald-100 font-semibold shadow-xs ring-1 ring-emerald-600/30'
                    : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                }`}
              >
                <div className="text-xs sm:text-sm font-semibold">
                  {opt.label}
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 transition ${
                    isSelected
                      ? 'bg-emerald-700 border-emerald-700 text-white'
                      : 'border-stone-300 dark:border-stone-600'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Botão de Salvar Alterações de Tratamento */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs text-stone-500 dark:text-stone-400">
            {treatmentSaved ? '✅ Preferência de tratamento salva e garantida.' : 'Selecione a opção acima e clique em salvar.'}
          </span>

          <button
            type="button"
            onClick={handleSaveTreatment}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-xs transition cursor-pointer shadow-xs"
          >
            {treatmentSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
                <span>Alterações Salvas com Sucesso!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-emerald-300" />
                <span>Salvar Alterações de Tratamento</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* =====================================================================
          3. APARÊNCIA DO APP
         ===================================================================== */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div>
          <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Aparência do Aplicativo</span>
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Escolha entre o modo claro e o modo escuro para o seu conforto visual.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            type="button"
            onClick={() => {
              setSelectedTheme('light');
              setThemeSaved(false);
            }}
            className={`p-4 rounded-2xl border flex items-center justify-between transition cursor-pointer ${
              selectedTheme === 'light'
                ? 'bg-amber-50/80 dark:bg-stone-800 border-amber-500 text-stone-900 dark:text-stone-100 font-semibold shadow-xs ring-1 ring-amber-500/40'
                : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Sun className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold">Claro</span>
            </div>
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                selectedTheme === 'light'
                  ? 'bg-amber-600 border-amber-600 text-white'
                  : 'border-stone-300 dark:border-stone-600'
              }`}
            >
              {selectedTheme === 'light' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedTheme('dark');
              setThemeSaved(false);
            }}
            className={`p-4 rounded-2xl border flex items-center justify-between transition cursor-pointer ${
              selectedTheme === 'dark'
                ? 'bg-emerald-950/50 dark:bg-emerald-950/80 border-emerald-500 text-stone-900 dark:text-white font-semibold shadow-xs ring-1 ring-emerald-500/40'
                : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Moon className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold">Escuro</span>
            </div>
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                selectedTheme === 'dark'
                  ? 'bg-emerald-700 border-emerald-700 text-white'
                  : 'border-stone-300 dark:border-stone-600'
              }`}
            >
              {selectedTheme === 'dark' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </button>
        </div>

        {/* Botão de Salvar Alterações de Tema */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs text-stone-500 dark:text-stone-400">
            {themeSaved ? '✅ Modo visual gravado e ativo.' : 'Escolha o modo visual e confirme clicando no botão ao lado.'}
          </span>

          <button
            type="button"
            onClick={handleSaveTheme}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-xs transition cursor-pointer shadow-xs"
          >
            {themeSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
                <span>Alterações Salvas com Sucesso!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-emerald-300" />
                <span>Salvar Alterações de Aparência</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* =====================================================================
          4. PERSONALIZAR SEÇÕES DO MENU & MEU DIA
         ===================================================================== */}
      <SectionVisibilityCard />
    </div>
  );
};
