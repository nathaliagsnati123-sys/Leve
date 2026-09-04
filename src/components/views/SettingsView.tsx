import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Settings, Download, Upload, Trash2, Sun, Moon, 
  Monitor, Smartphone, User, ShieldCheck 
} from 'lucide-react';
import { exportDataAsJson, importAppDataFromJson } from '../../services/storage';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const SettingsView: React.FC = () => {
  const { data, updateUser, resetData, showToast } = useApp();
  const { isInstallable, isIOS, isInstalled, installApp } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(data.user?.name || 'Nathália');
  const [selectedAvatar, setSelectedAvatar] = useState(data.user?.avatar || '🌿');

  const avatarOptions = ['🌿', '🌸', '✨', '☕', '🕊️', '🧘‍♀️', '📖', '🌊', '🦋', '🌱'];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name: name.trim(),
      avatar: selectedAvatar
    });
    showToast('Perfil atualizado com sucesso! ✨');
  };

  const handleExport = () => {
    exportDataAsJson();
    showToast('Backup exportado com sucesso! Guarde seu arquivo JSON. 📁');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = importAppDataFromJson(text);
        if (imported) {
          showToast('Backup restaurado com sucesso! Recarregando...');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          showToast('Arquivo de backup inválido. Verifique o formato JSON.');
        }
      } catch (err) {
        showToast('Erro ao importar backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm('Atenção: Deseja realmente restaurar os dados para o padrão inicial? Isso apagará seus registros locais.')) {
      resetData();
      showToast('Dados restaurados para o padrão.');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }
  };

  const currentTheme = data.user?.theme || 'light';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
            Configurações & Backup
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Personalize seu perfil, gerencie seu tema e mantenha seus dados seguros.
          </p>
        </div>
      </div>

      {/* User Profile */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-700" />
          <span>Seu Perfil</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs sm:text-sm">
          <div className="space-y-1">
            <label className="font-medium text-stone-700 dark:text-stone-300">Como prefere ser chamada(o)?</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full max-w-md px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-stone-700 dark:text-stone-300">Escolha seu ícone de perfil</label>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {avatarOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition ${
                    selectedAvatar === emoji
                      ? 'bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-600 scale-105'
                      : 'bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100'
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
              className="px-5 py-2.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-xs transition"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>

      {/* Theme selector */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
          Aparência do Aplicativo
        </h3>
        <p className="text-xs text-stone-500">
          Escolha o modo que traz mais conforto para a sua visão.
        </p>

        <div className="grid grid-cols-3 gap-3 max-w-md">
          <button
            type="button"
            onClick={() => updateUser({ theme: 'light' })}
            className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition ${
              currentTheme === 'light'
                ? 'bg-amber-50/50 dark:bg-amber-950/40 border-amber-500 text-amber-950 dark:text-amber-100 font-semibold'
                : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-600" />
            <span className="text-xs">Claro</span>
          </button>

          <button
            type="button"
            onClick={() => updateUser({ theme: 'dark' })}
            className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition ${
              currentTheme === 'dark'
                ? 'bg-emerald-950/40 border-emerald-500 text-white font-semibold'
                : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-400" />
            <span className="text-xs">Escuro</span>
          </button>

          <button
            type="button"
            onClick={() => updateUser({ theme: 'system' })}
            className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition ${
              currentTheme === 'system'
                ? 'bg-stone-100 dark:bg-stone-800 border-stone-500 text-stone-900 dark:text-white font-semibold'
                : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
            }`}
          >
            <Monitor className="w-5 h-5 text-stone-500" />
            <span className="text-xs">Sistema</span>
          </button>
        </div>
      </div>

      {/* Backup & Local Persistence */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
          <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
            Privacidade & Backup Local
          </h3>
        </div>
        <p className="text-xs text-stone-500 leading-relaxed">
          O <strong>LEVE</strong> foi projetado para respeitar 100% a sua privacidade. 
          Nenhum dado pessoal seu é enviado para servidores externos ou bancos na nuvem pagos. 
          Tudo fica guardado com carinho no seu próprio navegador e dispositivo.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Exportar Backup (JSON)</span>
          </button>

          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 transition"
          >
            <Upload className="w-4 h-4 text-stone-500" />
            <span>Importar Backup (JSON)</span>
          </button>

          <button
            onClick={handleResetData}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Restaurar padrões</span>
          </button>
        </div>
      </div>

      {/* PWA & Install status */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
        <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#1F3A34]" />
          <span>Instalar como Aplicativo (PWA)</span>
        </h3>
        <p className="text-xs text-stone-500 leading-relaxed">
          Você pode usar o LEVE no seu computador, tablet ou celular como um aplicativo de verdade, com ícone na tela inicial e funcionamento mesmo quando estiver sem internet.
        </p>
        {isInstalled ? (
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            ✓ O LEVE já está instalado e funcionando em modo aplicativo.
          </p>
        ) : isInstallable ? (
          <button
            onClick={installApp}
            className="px-5 py-2.5 rounded-xl bg-[#1F3A34] text-white hover:bg-[#162A25] text-xs font-semibold flex items-center gap-2 transition shadow-xs"
          >
            <Smartphone className="w-4 h-4 text-emerald-300" />
            <span>Instalar LEVE</span>
          </button>
        ) : isIOS ? (
          <div className="space-y-2 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50">
            <p className="text-xs font-semibold text-emerald-950 dark:text-emerald-200">
              Para instalar o LEVE: toque em Compartilhar → Adicionar à Tela de Início.
            </p>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
              No Safari do iPhone ou iPad, toque no ícone de compartilhamento na barra inferior e selecione "Adicionar à Tela de Início".
            </p>
          </div>
        ) : (
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            ✓ Aplicativo pronto para uso offline e com suporte completo a PWA.
          </p>
        )}
      </div>

      {/* About LEVE */}
      <div className="text-center py-6 space-y-2 text-stone-400 text-xs">
        <p className="font-serif text-stone-600 dark:text-stone-300 font-semibold text-sm">
          LEVE — Tire da cabeça. Coloque em ordem.
        </p>
        <p className="italic">
          "Sua vida não precisa ficar toda na sua cabeça."
        </p>
        <p className="text-[11px] pt-1">
          Versão 1.0 • Feito com amor e carinho • Custo de infraestrutura R$0
        </p>
      </div>
    </div>
  );
};
