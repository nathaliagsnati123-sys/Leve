import React, { useState } from 'react';
import { 
  Bell, BellRing, BellOff, Droplets, CheckSquare, Sparkles, 
  Clock, Volume2, Moon, Sun, ShieldCheck, AlertCircle, Check 
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
    updateNotificationSettings({ enabled });
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      await sendTestNotification();
    } finally {
      setTimeout(() => setIsTesting(false), 1000);
    }
  };

  const handlePlaySoundPreview = () => {
    playZenBellSound();
  };

  const isGranted = notificationPermission === 'granted';
  const isDenied = notificationPermission === 'denied';
  const isDefault = notificationPermission === 'default';
  const isUnsupported = notificationPermission === 'unsupported';

  return (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>Notificações & Lembretes</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Receba avisos acolhedores para beber água, cumprir tarefas no horário e cultivar seus hábitos.
            </p>
          </div>
        </div>

        {/* Global Master Toggle */}
        <label className="flex items-center gap-2.5 cursor-pointer self-start sm:self-auto bg-stone-50 dark:bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
          <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
            {notificationSettings.enabled ? 'Ativadas' : 'Pausadas'}
          </span>
          <input
            type="checkbox"
            checked={notificationSettings.enabled}
            onChange={(e) => handleToggleGlobal(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-10 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-stone-600 peer-checked:bg-emerald-700 relative"></div>
        </label>
      </div>

      {/* Permission Status Banner */}
      <div className="p-4 rounded-2xl border transition-all">
        {isGranted && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
            <div className="flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                <strong>Permissão autorizada:</strong> seu navegador e dispositivo estão prontos para receber lembretes do LEVE.
              </span>
            </div>
            <button
              type="button"
              onClick={handleTestNotification}
              disabled={isTesting}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-60 shrink-0"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{isTesting ? 'Enviando...' : 'Testar Agora'}</span>
            </button>
          </div>
        )}

        {isDefault && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/60 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/50">
            <div className="flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Permissão do dispositivo:</strong> autorize o LEVE a enviar notificações para ser lembrado mesmo se estiver fora do app.
              </span>
            </div>
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F3A34] hover:bg-[#162A25] text-white text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
            >
              <BellRing className="w-3.5 h-3.5 text-emerald-300" />
              <span>Ativar no Dispositivo</span>
            </button>
          </div>
        )}

        {isDenied && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-50/50 dark:bg-rose-950/30 p-3.5 rounded-xl border border-rose-200 dark:border-rose-800/50">
            <div className="flex items-center gap-2.5 text-xs text-rose-900 dark:text-rose-200">
              <BellOff className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>
                <strong>Notificações bloqueadas pelo navegador:</strong> Para reativar, clique no ícone de ajustes/cadeado na barra de endereços do seu navegador e permita notificações para o site.
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
          <div className="flex items-center gap-2.5 text-xs text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/50 p-3 rounded-xl border border-stone-200 dark:border-stone-700">
            <AlertCircle className="w-4 h-4 text-stone-400 shrink-0" />
            <span>
              Lembretes visuais e sonoros funcionarão normalmente enquanto você estiver com o aplicativo aberto.
            </span>
          </div>
        )}
      </div>

      {/* Preferences List */}
      <div className="space-y-4">
        {/* 1. Lembrete de Água */}
        <div className="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                  Lembrete para Beber Água
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Avisa você periodicamente até atingir sua meta de hidratação do dia.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.hydrationEnabled}
                onChange={(e) => updateNotificationSettings({ hydrationEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-stone-600 peer-checked:bg-emerald-700"></div>
            </label>
          </div>

          {notificationSettings.hydrationEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <label className="block text-stone-600 dark:text-stone-400 font-medium mb-1">
                  Frequência do Lembrete
                </label>
                <select
                  value={notificationSettings.hydrationIntervalMinutes || 90}
                  onChange={(e) => updateNotificationSettings({ hydrationIntervalMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value={45}>A cada 45 minutos (Frequente)</option>
                  <option value={60}>A cada 1 hora</option>
                  <option value={90}>A cada 1 hora e meia (Recomendado)</option>
                  <option value={120}>A cada 2 horas</option>
                  <option value={180}>A cada 3 horas</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-stone-600 dark:text-stone-400 font-medium mb-1">
                    Horário inicial
                  </label>
                  <input
                    type="time"
                    value={notificationSettings.hydrationStartTime || '08:00'}
                    onChange={(e) => updateNotificationSettings({ hydrationStartTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-stone-600 dark:text-stone-400 font-medium mb-1">
                    Horário final
                  </label>
                  <input
                    type="time"
                    value={notificationSettings.hydrationEndTime || '22:00'}
                    onChange={(e) => updateNotificationSettings({ hydrationEndTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Lembrete de Tarefas */}
        <div className="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                  Lembrete de Tarefas Agendadas
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Avisa você antes do horário marcado de uma tarefa de hoje.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.tasksEnabled}
                onChange={(e) => updateNotificationSettings({ tasksEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-stone-600 peer-checked:bg-emerald-700"></div>
            </label>
          </div>

          {notificationSettings.tasksEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <label className="block text-stone-600 dark:text-stone-400 font-medium mb-1">
                  Antecedência do aviso de tarefa
                </label>
                <select
                  value={notificationSettings.taskReminderMinutesBefore ?? 10}
                  onChange={(e) => updateNotificationSettings({ taskReminderMinutesBefore: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value={0}>No horário exato da tarefa</option>
                  <option value={5}>5 minutos antes</option>
                  <option value={10}>10 minutos antes (Recomendado)</option>
                  <option value={15}>15 minutos antes</option>
                  <option value={30}>30 minutos antes</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-stone-600 dark:text-stone-400 font-medium">
                    Resumo matinal de tarefas
                  </label>
                  <input
                    type="checkbox"
                    checked={notificationSettings.dailyTasksSummaryEnabled}
                    onChange={(e) => updateNotificationSettings({ dailyTasksSummaryEnabled: e.target.checked })}
                    className="accent-emerald-700 w-3.5 h-3.5 rounded"
                  />
                </div>
                <input
                  type="time"
                  disabled={!notificationSettings.dailyTasksSummaryEnabled}
                  value={notificationSettings.dailyTasksSummaryTime || '08:30'}
                  onChange={(e) => updateNotificationSettings({ dailyTasksSummaryTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. Lembretes de Hábitos & Autocuidado */}
        <div className="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                  Lembrete de Hábitos & Autocuidado
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Avisa sobre hábitos pendentes pela manhã e ao final do dia.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.habitsEnabled}
                onChange={(e) => updateNotificationSettings({ habitsEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-stone-600 peer-checked:bg-emerald-700"></div>
            </label>
          </div>

          {notificationSettings.habitsEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <label className="block text-stone-600 dark:text-stone-400 font-medium mb-1">
                  Lembrete da Manhã
                </label>
                <input
                  type="time"
                  value={notificationSettings.morningHabitsReminderTime || '08:00'}
                  onChange={(e) => updateNotificationSettings({ morningHabitsReminderTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-stone-600 dark:text-stone-400 font-medium mb-1">
                  Lembrete da Noite
                </label>
                <input
                  type="time"
                  value={notificationSettings.eveningHabitsReminderTime || '20:30'}
                  onChange={(e) => updateNotificationSettings({ eveningHabitsReminderTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. Espiritualidade & Fechamento do Dia */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Espiritualidade */}
          <div className="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <span>🕊️</span>
                <span>Momento com Deus</span>
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.spiritualityEnabled}
                  onChange={(e) => updateNotificationSettings({ spiritualityEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-stone-600 peer-checked:bg-emerald-700"></div>
              </label>
            </div>
            {notificationSettings.spiritualityEnabled && (
              <input
                type="time"
                value={notificationSettings.spiritualityReminderTime || '07:30'}
                onChange={(e) => updateNotificationSettings({ spiritualityReminderTime: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100"
              />
            )}
          </div>

          {/* Fechamento do Dia */}
          <div className="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <span>🌙</span>
                <span>Fechamento do Dia</span>
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.dayClosingEnabled}
                  onChange={(e) => updateNotificationSettings({ dayClosingEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-stone-600 peer-checked:bg-emerald-700"></div>
              </label>
            </div>
            {notificationSettings.dayClosingEnabled && (
              <input
                type="time"
                value={notificationSettings.dayClosingReminderTime || '21:30'}
                onChange={(e) => updateNotificationSettings({ dayClosingReminderTime: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100"
              />
            )}
          </div>
        </div>

        {/* 5. Som Suave Relaxante */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-stone-200/70 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                Som Suave (Sino Zen)
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                Toque relaxante e discreto ao receber lembretes.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePlaySoundPreview}
              title="Ouvir demonstração do som zen"
              className="px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
            >
              Ouvir som
            </button>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.soundEnabled}
                onChange={(e) => updateNotificationSettings({ soundEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-stone-600 peer-checked:bg-emerald-700"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
