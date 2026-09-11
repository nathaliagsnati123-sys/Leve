import React, { useState } from 'react';
import { 
  Bell, BellRing, BellOff, ShieldCheck, AlertCircle, Volume2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playZenBellSound } from '../../services/notificationService';

export const NotificationSettingsCard: React.FC = () => {
  const { 
    notificationSettings, 
    updateNotificationSettings, 
    notificationPermission, 
    requestNotificationPermission, 
    sendTestNotification
  } = useApp();

  const [isTesting, setIsTesting] = useState(false);

  const handleToggleGlobal = (enabled: boolean) => {
    updateNotificationSettings({ 
      enabled,
      // When enabled, activate core reminder schedules automatically
      waterEnabled: enabled,
      tasksEnabled: enabled,
      habitsEnabled: enabled,
      spiritualityEnabled: enabled,
      dayClosingEnabled: enabled,
      dailyMotivationEnabled: enabled
    });
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      await sendTestNotification();
    } finally {
      setTimeout(() => setIsTesting(false), 1000);
    }
  };

  const isGranted = notificationPermission === 'granted';
  const isDenied = notificationPermission === 'denied';
  const isDefault = notificationPermission === 'default';
  const isUnsupported = notificationPermission === 'unsupported';

  return (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5">
      {/* Cabeçalho com o Switch Principal de Notificações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
              Notificações & Lembretes
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Receba avisos acolhedores e lembretes importantes ao longo do seu dia.
            </p>
          </div>
        </div>

        {/* Única Opção de Permitir Notificação */}
        <label className="flex items-center gap-3 cursor-pointer self-start sm:self-auto bg-stone-50 dark:bg-stone-800 px-3.5 py-2 rounded-2xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-750 transition">
          <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
            {notificationSettings.enabled ? 'Permitidas' : 'Desativadas'}
          </span>
          <input
            type="checkbox"
            checked={notificationSettings.enabled}
            onChange={(e) => handleToggleGlobal(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-stone-600 peer-checked:bg-emerald-700 relative"></div>
        </label>
      </div>

      {/* Status da Permissão do Dispositivo / Navegador - ocultado a pedido do usuário */}
      {notificationSettings.enabled && (
        <div className="pt-1 hidden">
          {isGranted && (
            <div className="hidden flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/50">
              <div className="flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>Notificações ativas:</strong> seu dispositivo está autorizado a receber lembretes e avisos do LEVE.
                </span>
              </div>
              <button
                type="button"
                onClick={handleTestNotification}
                disabled={isTesting}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-60 shrink-0"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{isTesting ? 'Enviando...' : 'Testar Notificação'}</span>
              </button>
            </div>
          )}

          {isDefault && (
            <div className="hidden flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/70 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/50">
              <div className="flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>Autorização necessária:</strong> autorize o LEVE no seu navegador para receber avisos mesmo com a tela fechada.
                </span>
              </div>
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
              >
                <BellRing className="w-3.5 h-3.5 text-emerald-300" />
                <span>Autorizar no Dispositivo</span>
              </button>
            </div>
          )}

          {isDenied && (
            <div className="hidden flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-50/70 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-200 dark:border-rose-800/50">
              <div className="flex items-center gap-2.5 text-xs text-rose-900 dark:text-rose-200">
                <BellOff className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>
                  <strong>Notificações bloqueadas no navegador:</strong> para permitir, clique no cadeado ou ícone de configurações ao lado do endereço do site e ative as notificações.
                </span>
              </div>
              <button
                type="button"
                onClick={handleTestNotification}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 text-xs font-medium transition cursor-pointer shrink-0"
              >
                <span>Testar In-App</span>
              </button>
            </div>
          )}

          {isUnsupported && (
            <div className="hidden p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800 text-xs text-stone-600 dark:text-stone-400">
              As notificações do sistema são exibidas na tela do app enquanto você o utiliza.
            </div>
          )}
        </div>
      )}

      {/* Som Zen Discreto */}
      {notificationSettings.enabled && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200/80 dark:border-stone-700/80">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-4 h-4 text-stone-500 dark:text-stone-400 shrink-0" />
            <span className="text-xs text-stone-700 dark:text-stone-300 font-medium">
              Som suave de sino ao receber aviso
            </span>
          </div>
          <button
            type="button"
            onClick={playZenBellSound}
            className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
          >
            Ouvir som
          </button>
        </div>
      )}
    </div>
  );
};
