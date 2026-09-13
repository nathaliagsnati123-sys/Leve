import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Settings, Sun, Moon, Monitor, User, LogOut, Check, Mail, HeartHandshake, Sparkles, RefreshCw,
  AlertTriangle, Cloud, Download, Camera, Upload, Trash2, Smartphone, Laptop
} from 'lucide-react';
import { TreatmentPreference } from '../../types';
import { TREATMENT_OPTIONS, normalizeTreatmentPreference } from '../../utils/treatment';
import { NotificationSettingsCard } from './NotificationSettingsCard';
import { SectionVisibilityCard } from './SectionVisibilityCard';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { UserAvatar, isImageAvatar } from '../common/UserAvatar';

export const SettingsView: React.FC = () => {
  const { data, updateUser, showToast, startTour, forceSyncAll } = useApp();
  const { 
    user, 
    logout, 
    setIsAuthModalOpen, 
    treatmentPreference: authTreatmentPref, 
    updateTreatmentPreference,
    userProfile,
    saveProfile,
    plan,
    planLabel,
    refreshEntitlements,
    isCheckingEntitlements,
    syncStatus,
    lastSyncedAt
  } = useAuth();

  const [name, setName] = useState(data.user?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(data.user?.avatar || '🌿');
  const [isSyncingNow, setIsSyncingNow] = useState(false);

  const [selectedPreference, setSelectedPreference] = useState<TreatmentPreference>(() => {
    return normalizeTreatmentPreference(
      data.user?.treatmentPreference || authTreatmentPref || 'nao_informar'
    );
  });

  useEffect(() => {
    if (data.user?.treatmentPreference) {
      setSelectedPreference(normalizeTreatmentPreference(data.user.treatmentPreference));
    } else if (authTreatmentPref) {
      setSelectedPreference(normalizeTreatmentPreference(authTreatmentPref));
    }
  }, [data.user?.treatmentPreference, authTreatmentPref]);

  useEffect(() => {
    if (data.user?.name) {
      setName(data.user.name);
    }
  }, [data.user?.name]);

  useEffect(() => {
    if (data.user?.avatar) {
      setSelectedAvatar(data.user.avatar);
    }
  }, [data.user?.avatar]);

  const avatarOptions = [
    '🌿', '🌸', '✨', '☕', '🕊️', '🧘‍♀️', '📖', '🌊', '🦋', '🌱',
    '☀️', '🪴', '🌻', '🤍', '🕯️', '🎨', '🌙', '🍓', '🍵', '🌺'
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione um arquivo de imagem válido.', 'error');
      return;
    }

    setIsProcessingPhoto(true);
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
          showToast('Foto carregada! Clique em "Salvar Alterações" para confirmar. ✨');
          setIsProcessingPhoto(false);
        } catch (err) {
          console.error('Error compressing image:', err);
          showToast('Erro ao processar imagem.', 'error');
          setIsProcessingPhoto(false);
        }
      };
      img.onerror = () => {
        showToast('Não foi possível carregar a imagem.', 'error');
        setIsProcessingPhoto(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      showToast('Erro ao ler o arquivo.', 'error');
      setIsProcessingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const normalizedPref = normalizeTreatmentPreference(selectedPreference);
    updateUser({
      name: cleanName,
      avatar: selectedAvatar,
      treatmentPreference: normalizedPref
    });
    try {
      await updateTreatmentPreference(normalizedPref);
    } catch {}
    if (user) {
      try {
        await saveProfile({
          name: cleanName,
          treatment_preference: normalizedPref
        });
      } catch (err) {
        console.warn('Erro ao salvar perfil no Supabase:', err);
      }
    }
    showToast('Perfil atualizado com sucesso! ✨');
  };

  const handleSelectPreference = async (pref: TreatmentPreference) => {
    const normalized = normalizeTreatmentPreference(pref);
    setSelectedPreference(normalized);
    updateUser({ treatmentPreference: normalized });
    
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
        console.warn('Erro ao sincronizar preferência com Supabase:', err);
      }
    }
    
    const optLabel = TREATMENT_OPTIONS.find((o) => o.id === normalized)?.label || normalized;
    showToast(`Forma de tratamento definida como: ${optLabel} ✨`);
  };

  const currentTheme = data.user?.theme === 'dark' ? 'dark' : 'light';

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    updateUser({ theme: newTheme });
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    showToast(newTheme === 'dark' ? 'Modo Escuro ativado 🌙' : 'Modo Claro ativado ☀️');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
            Configurações
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Personalize seu perfil, preferência de tratamento, tema e conta.
          </p>
        </div>
      </div>

      {/* 1. Seu Perfil */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5">
        <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <span>Seu Perfil</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs sm:text-sm">
          <div className="space-y-1.5">
            <label className="font-medium text-stone-700 dark:text-stone-300">
              Como prefere ser chamado?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
                    <span>{isProcessingPhoto ? 'Processando...' : 'Carregar Foto do Computador'}</span>
                  </button>

                  {isImageAvatar(selectedAvatar) && (
                    <button
                      type="button"
                      onClick={() => setSelectedAvatar('🌿')}
                      className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Remover Foto</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {isImageAvatar(selectedAvatar)
                    ? 'Foto personalizada selecionada.'
                    : 'Você pode subir uma foto sua do computador ou escolher um dos ícones abaixo.'}
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
                    onClick={() => setSelectedAvatar(emoji)}
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

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-xs transition cursor-pointer shadow-xs"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>

      {/* 2. Como você prefere ser tratado? */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>Como você prefere ser tratado?</span>
          </h3>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Ativo: <strong>{TREATMENT_OPTIONS.find((o) => o.id === selectedPreference)?.label || 'Prefiro não informar'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {TREATMENT_OPTIONS.map((opt) => {
            const isSelected = selectedPreference === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectPreference(opt.id)}
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
      </div>

      {/* Notificações & Lembretes */}
      <NotificationSettingsCard />

      {/* Tour Guiado do Aplicativo */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Tour pelo LEVE</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md">
              Quer relembrar como usar cada cantinho do app? Faça o tour guiado e conheça as ferramentas de foco, hábitos, espiritualidade e apoio da LEVIA.
            </p>
          </div>

          <button
            type="button"
            onClick={startTour}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Fazer Tour pelo App</span>
          </button>
        </div>
      </div>

      {/* 3. Aparência do Aplicativo */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div>
          <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
            Aparência do Aplicativo
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Escolha o modo que traz mais conforto para a sua visão.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={`p-4 rounded-2xl border flex items-center justify-between transition cursor-pointer ${
              currentTheme === 'light'
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
                currentTheme === 'light'
                  ? 'bg-amber-600 border-amber-600 text-white'
                  : 'border-stone-300 dark:border-stone-600'
              }`}
            >
              {currentTheme === 'light' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={`p-4 rounded-2xl border flex items-center justify-between transition cursor-pointer ${
              currentTheme === 'dark'
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
                currentTheme === 'dark'
                  ? 'bg-emerald-700 border-emerald-700 text-white'
                  : 'border-stone-300 dark:border-stone-600'
              }`}
            >
              {currentTheme === 'dark' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </button>
        </div>
      </div>

      {/* 4. Baixar e Instalar o Aplicativo (Computador e Celular) */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Baixar e Instalar o App</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-lg leading-relaxed">
              Instale o LEVE no seu <strong>computador</strong> (Chrome ou Edge) ou no seu <strong>celular</strong> para usar como um aplicativo de verdade: abre em tela cheia sem abas, inicia rápido e funciona offline.
            </p>
          </div>

          <div className="shrink-0">
            <PWAInstallButton />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Computador */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/70 space-y-2">
            <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-semibold text-xs">
              <Laptop className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>No Computador (Windows / Mac / Linux)</span>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
              No <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong>, clique no botão <em>"Instalar LEVE"</em> acima, ou procure pelo ícone de computador/instalação no canto direito da barra de endereços do seu navegador.
            </p>
          </div>

          {/* Celular */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/70 space-y-2">
            <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-semibold text-xs">
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>No Celular (iPhone / Android)</span>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
              No <strong>iPhone (Safari)</strong>: toque no ícone de <em>Compartilhar</em> (quadrado com seta para cima) e selecione <em>"Adicionar à Tela de Início"</em>. No <strong>Android</strong>: toque no botão acima ou no menu do Chrome.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Personalizar & Ocultar Seções do Menu */}
      <SectionVisibilityCard />

      {/* 5. Conta (Apenas o e-mail cadastrado e logout / login) */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Mail className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <span>Conta</span>
        </h3>

        {user ? (
          <div className="space-y-3">
            {/* Informações do Plano Ativo com Botão de Atualização */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  plan === 'vip'
                    ? 'bg-amber-100/70 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    : plan === 'special'
                    ? 'bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-700'
                }`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">
                    Plano Ativo
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      {planLabel}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      plan === 'vip'
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : plan === 'special'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${plan === 'vip' ? 'bg-amber-500' : plan === 'special' ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                      {plan === 'vip' ? 'VIP' : plan === 'special' ? 'Especial' : 'Gratuito'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await refreshEntitlements();
                    showToast('Permissões do plano atualizadas!');
                  }}
                  disabled={isCheckingEntitlements}
                  title="Recarregar plano do Supabase"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 shadow-2xs transition cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingEntitlements ? 'animate-spin' : ''}`} />
                  <span>{isCheckingEntitlements ? 'Checando...' : 'Atualizar Plano'}</span>
                </button>
              </div>
            </div>

            {/* Sincronização Multi-Dispositivo em Tempo Real */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                  <Cloud className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                      Sincronização Ativa em Tempo Real
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                      Multi-Dispositivo
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 max-w-md">
                    Seus hábitos, tarefas, metas e diário são salvos e atualizados instantaneamente em todos os celulares, tablets ou computadores logados com este e-mail ({user.email}).
                  </p>
                  {lastSyncedAt && (
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium block pt-0.5">
                      ✓ Última sincronização: {lastSyncedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setIsSyncingNow(true);
                  try {
                    const ok = await forceSyncAll();
                    if (ok) {
                      showToast('Tudo sincronizado e atualizado em todos os seus aparelhos! ✨');
                    } else {
                      showToast('Dados sincronizados com sucesso!', 'gentle');
                    }
                  } finally {
                    setIsSyncingNow(false);
                  }
                }}
                disabled={isSyncingNow}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-white dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 border border-emerald-300/80 dark:border-emerald-700/60 shadow-2xs transition cursor-pointer disabled:opacity-60 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow ? 'animate-spin' : ''}`} />
                <span>{isSyncingNow ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
              </button>
            </div>

            {/* E-mail e Desconexão */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700">
              <div className="space-y-0.5">
                <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
                  E-mail cadastrado
                </span>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {user.email}
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  await logout();
                  showToast('Você saiu da sua conta.');
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium transition cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Desconectar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700">
            <div>
              <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                Nenhuma conta conectada
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Entre com seu e-mail para salvar suas preferências e acessar seus dados.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-emerald-300" />
              <span>Entrar na Conta</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
