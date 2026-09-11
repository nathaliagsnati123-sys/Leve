import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Settings, Sun, Moon, Monitor, User, LogOut, Check, Mail, HeartHandshake, Sparkles, RefreshCw,
  Copy, CheckCircle2, ShieldCheck, Layers, Link as LinkIcon, AlertTriangle, Cloud
} from 'lucide-react';
import { TreatmentPreference } from '../../types';
import { TREATMENT_OPTIONS, normalizeTreatmentPreference } from '../../utils/treatment';
import { NotificationSettingsCard } from './NotificationSettingsCard';

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

  const [manualEmail, setManualEmail] = useState('');
  const [manualPlan, setManualPlan] = useState<'especial' | 'vip'>('especial');
  const [isGrantingManual, setIsGrantingManual] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [hotmartStatus, setHotmartStatus] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/hotmart-status')
      .then(r => r.json())
      .then(setHotmartStatus)
      .catch(() => {});
  }, []);

  const handleCopyWebhook = () => {
    const url = hotmartStatus?.webhookUrl || 'https://ais-pre-3jo2rpsiwzwzzqnatbx4af-827551377597.us-east1.run.app/api/hotmart-webhook';
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    showToast('URL do Webhook copiada para a área de transferência! 📋');
    setTimeout(() => setCopiedWebhook(false), 3000);
  };

  const handleManualGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail) {
      showToast('Por favor, informe o e-mail da cliente.');
      return;
    }
    setIsGrantingManual(true);
    try {
      const res = await fetch('/api/admin/manual-grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: manualEmail.trim().toLowerCase(), plan: manualPlan })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast(`Plano ${manualPlan === 'vip' ? 'VIP' : 'Especial'} liberado com sucesso para ${manualEmail}! ✨`);
        setManualEmail('');
        if (user?.email?.toLowerCase() === manualEmail.trim().toLowerCase()) {
          await refreshEntitlements();
        }
      } else {
        showToast(resData.error || 'Erro ao liberar plano');
      }
    } catch {
      showToast('Erro de comunicação com o servidor');
    } finally {
      setIsGrantingManual(false);
    }
  };

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

  const avatarOptions = ['🌿', '🌸', '✨', '☕', '🕊️', '🧘‍♀️', '📖', '🌊', '🦋', '🌱'];

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

          <div className="space-y-1.5">
            <label className="font-medium text-stone-700 dark:text-stone-300">
              Ícone de perfil
            </label>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {avatarOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition cursor-pointer ${
                    selectedAvatar === emoji
                      ? 'bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-600 scale-105'
                      : 'bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-750'
                  }`}
                >
                  {emoji}
                </button>
              ))}
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
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Como você prefere ser tratado?</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Escolha como o LEVE e a Levia devem conversar com você. O aplicativo adapta as saudações e mensagens para você.
            </p>
          </div>
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
                <div>
                  <div className="text-xs sm:text-sm font-semibold">
                    {opt.label}
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-300 font-normal">
                    {opt.description}
                  </div>
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

      {/* 4. Conta (Apenas o e-mail cadastrado e logout / login) */}
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
                      Sincronização em Tempo Real
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                      Multi-Dispositivo
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 max-w-md">
                    O que você altera neste aparelho é salvo e compartilhado instantaneamente com todos os outros dispositivos logados com esta mesma conta.
                  </p>
                  {lastSyncedAt && (
                    <span className="text-[11px] text-stone-400 dark:text-stone-500 block pt-0.5">
                      Última sincronização: {lastSyncedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
                      showToast('Tudo sincronizado e atualizado em todos os aparelhos!');
                    } else {
                      showToast('Verificando conexão com a nuvem...', 'gentle');
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
       
      {/* Central de Automação Hotmart & Desbloqueio Imediato */}
      <div hidden className="bg-white dark:bg-stone-900
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Automação Hotmart & Liberação Imediata</span>
          </h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Serviço Ativo e Conectado
          </span>
        </div>

        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
          Quando uma cliente faz uma compra na Hotmart, o webhook sincroniza instantaneamente as permissões, 
          garantindo que o plano (Especial ou VIP) seja liberado na hora, sem depender de confirmação manual de e-mail.
        </p>

        {/* URL do Webhook da Hotmart */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200/80 dark:border-stone-700/80 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5" />
              URL Oficial do Webhook (para cadastrar na Hotmart)
            </span>
            <button
              type="button"
              onClick={handleCopyWebhook}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {copiedWebhook ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedWebhook ? 'Copiado!' : 'Copiar URL'}</span>
            </button>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 font-mono text-[11px] text-stone-700 dark:text-stone-300 break-all select-all border border-stone-200 dark:border-stone-700">
            {hotmartStatus?.webhookUrl || 'https://ais-pre-3jo2rpsiwzwzzqnatbx4af-827551377597.us-east1.run.app/api/hotmart-webhook'}
          </div>
        </div>

        {/* Ferramenta de Liberação Manual Imediata */}
        <form onSubmit={handleManualGrant} className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Liberar Plano Imediatamente para uma Cliente</span>
          </div>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
            Caso precise liberar uma cliente na hora (mesmo antes da Hotmart disparar o webhook):
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              placeholder="e-mail da cliente"
              className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            <select
              value={manualPlan}
              onChange={(e) => setManualPlan(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-800 text-stone-900 dark:text-stone-100 focus:outline-none cursor-pointer"
            >
              <option value="especial">Plano Especial (R$ 49,90)</option>
              <option value="vip">Plano VIP (R$ 65,90 ou Upgrade)</option>
            </select>
            <button
              type="submit"
              disabled={isGrantingManual}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer disabled:opacity-60 shrink-0"
            >
              {isGrantingManual ? 'Liberando...' : 'Liberar Acesso Agora'}
            </button>
          </div>
        </form>
      </div> 
    </div>
  );
};
