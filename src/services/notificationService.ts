// Serviço Completo de Notificações e Lembretes - LEVE
import { AppData, NotificationSettings, DEFAULT_NOTIFICATION_SETTINGS } from '../types';
import { getTodayDateString } from './storage';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Verifica se a API de Notificações é suportada no ambiente atual
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Retorna o status atual da permissão de notificações
 */
export function getNotificationPermission(): NotificationPermissionStatus {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionStatus;
}

/**
 * Toca um som suave zen de sino (harmônicos relaxantes sintetizados com Web Audio API)
 * Não necessita de arquivos externos e funciona perfeitamente sem falhas de rede.
 */
export function playZenBellSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    
    // Harmônicos afinados em frequências relaxantes (528Hz Solfeggio / 660Hz / 792Hz)
    const frequencies = [528, 660, 792];
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Volume suave e fade out agradável
      const initialGain = 0.08 / (i + 1);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(initialGain, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.45);
    });

    // Fechar o contexto após a execução
    setTimeout(() => {
      try {
        ctx.close();
      } catch {}
    }, 1600);
  } catch (e) {
    console.debug('Áudio não inicializado ou restrito pelo navegador:', e);
  }
}

/**
 * Solicita permissão ao usuário para enviar notificações
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionStatus;
  } catch (err) {
    console.warn('Erro ao solicitar permissão de notificações:', err);
    return getNotificationPermission();
  }
}

/**
 * Dispara uma notificação para o sistema operacional / navegador / PWA
 */
export async function sendSystemNotification(
  title: string,
  options?: {
    body?: string;
    tag?: string;
    sound?: boolean;
  }
): Promise<boolean> {
  const perm = getNotificationPermission();

  // Toca som se configurado
  if (options?.sound !== false) {
    playZenBellSound();
  }

  if (perm !== 'granted') {
    return false;
  }

  const notificationOptions: NotificationOptions = {
    body: options?.body || '',
    icon: '/app-icon.png',
    badge: '/favicon.png',
    tag: options?.tag || 'leve-notification',
    // Vibrate padrão suave para dispositivos móveis
    ...(typeof navigator !== 'undefined' && 'vibrate' in navigator ? { vibrate: [100, 60, 100] } : {})
  };

  try {
    // Tenta primeiro via Service Worker Registration (ideal para PWA e mobile)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(title, notificationOptions);
        return true;
      }
    }

    // Fallback nativo
    new Notification(title, notificationOptions);
    return true;
  } catch (err) {
    console.warn('Erro ao disparar notificação nativa:', err);
    try {
      new Notification(title, notificationOptions);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Helper para verificar se uma chave já foi disparada hoje
 */
function hasNotifiedToday(key: string, today: string): boolean {
  try {
    const val = localStorage.getItem(`leve_notif_${key}`);
    return val === today;
  } catch {
    return false;
  }
}

/**
 * Marca que uma chave foi disparada hoje
 */
function markNotifiedToday(key: string, today: string): void {
  try {
    localStorage.setItem(`leve_notif_${key}`, today);
  } catch {}
}

/**
 * Converte horário "HH:mm" em minutos desde meia-noite
 */
function timeStringToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return -1;
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return -1;
  return h * 60 + m;
}

/**
 * Processador periódico de lembretes:
 * Checa tarefas com horário, água, hábitos, espiritualidade e fechamento do dia.
 */
export function checkAndTriggerReminders(
  data: AppData,
  onInAppNotice?: (message: string, type?: 'info' | 'success') => void
): void {
  const settings = data.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS;
  if (!settings.enabled) return;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentHour = now.getHours();
  const todayDateStr = getTodayDateString();
  const currentFormattedTime = `${String(currentHour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const notify = (title: string, body: string, tag: string) => {
    // 1. Notificação do sistema operacional/PWA
    sendSystemNotification(title, {
      body,
      tag,
      sound: settings.soundEnabled
    });

    // 2. Notificação in-app (Toast suave para quem está com o app na tela)
    if (onInAppNotice) {
      onInAppNotice(`${title} • ${body}`, 'info');
    }
  };

  // =========================================================================
  // 1. LEMBRETE DE BEBER ÁGUA
  // =========================================================================
  if (settings.hydrationEnabled) {
    const startMin = timeStringToMinutes(settings.hydrationStartTime || '08:00');
    const endMin = timeStringToMinutes(settings.hydrationEndTime || '22:00');

    // Se estiver dentro da janela de horário diurna
    if (currentMinutes >= startMin && currentMinutes <= endMin) {
      const todayHydration = data.hydration?.[todayDateStr];
      const amountMl = todayHydration?.amountMl || 0;
      const targetMl = todayHydration?.targetMl || 2000;

      // Se ainda não atingiu a meta do dia
      if (amountMl < targetMl) {
        const intervalMs = (settings.hydrationIntervalMinutes || 90) * 60 * 1000;
        let lastNotifiedWater = 0;
        try {
          lastNotifiedWater = Number(localStorage.getItem('leve_last_water_reminder_ts')) || 0;
        } catch {}

        const nowTs = Date.now();
        // Se já passou o tempo do intervalo desde a última notificação
        if (nowTs - lastNotifiedWater >= intervalMs) {
          const remainingMl = targetMl - amountMl;
          notify(
            '💧 Hora de beber água!',
            `Pausa rápida para se hidratar 🌿 Você bebeu ${amountMl}ml hoje (faltam ${remainingMl}ml).`,
            `water-${todayDateStr}-${Math.floor(nowTs / (60 * 1000))}`
          );
          try {
            localStorage.setItem('leve_last_water_reminder_ts', String(nowTs));
          } catch {}
        }
      }
    }
  }

  // =========================================================================
  // 2. LEMBRETES DE TAREFAS COM HORÁRIO MARCADO
  // =========================================================================
  if (settings.tasksEnabled && Array.isArray(data.tasks)) {
    const reminderMinutesBefore = settings.taskReminderMinutesBefore ?? 10;

    data.tasks.forEach((task) => {
      // Apenas tarefas de hoje, pendentes e com horário especificado
      if (task.date === todayDateStr && !task.completed && task.time) {
        const taskMinutes = timeStringToMinutes(task.time);
        if (taskMinutes < 0) return;

        // Verifica se estamos na janela de lembrete (ex: de 10 minutos antes até o minuto da tarefa)
        const diff = taskMinutes - currentMinutes;
        const taskKey = `task_${task.id}_${todayDateStr}`;

        if (diff >= 0 && diff <= reminderMinutesBefore && !hasNotifiedToday(taskKey, todayDateStr)) {
          const whenText = diff === 0 ? 'Agora' : `Em ${diff} min (${task.time})`;
          notify(
            `⏰ Lembrete: ${task.title}`,
            `${whenText} • ${task.category || 'Compromisso'}. Dê esse passo com calma.`,
            `task-${task.id}`
          );
          markNotifiedToday(taskKey, todayDateStr);
        }
      }
    });

    // 2.1 Resumo matinal de tarefas do dia
    if (settings.dailyTasksSummaryEnabled) {
      const summaryTime = settings.dailyTasksSummaryTime || '08:30';
      const summaryKey = `tasks_summary_${todayDateStr}`;

      if (currentFormattedTime === summaryTime && !hasNotifiedToday(summaryKey, todayDateStr)) {
        const todayTasks = data.tasks.filter((t) => t.date === todayDateStr && !t.completed);
        if (todayTasks.length > 0) {
          notify(
            '📋 Suas tarefas de hoje no LEVE',
            `Você tem ${todayTasks.length} ${todayTasks.length === 1 ? 'tarefa planejada' : 'tarefas planejadas'} para hoje. Comece com uma coisa de cada vez!`,
            `summary-${todayDateStr}`
          );
        }
        markNotifiedToday(summaryKey, todayDateStr);
      }
    }
  }

  // =========================================================================
  // 3. LEMBRETES DE HÁBITOS & AUTOCUIDADO
  // =========================================================================
  if (settings.habitsEnabled && Array.isArray(data.habits)) {
    // 3.1 Hábitos da Manhã
    const morningTime = settings.morningHabitsReminderTime || '08:00';
    const morningKey = `morning_habits_${todayDateStr}`;

    if (currentFormattedTime === morningTime && !hasNotifiedToday(morningKey, todayDateStr)) {
      const morningHabitsPending = data.habits.filter((h) => {
        const completedToday = Boolean(h.history && h.history[todayDateStr]);
        const isMorning = h.timeOfDay === 'morning' || h.timeOfDay === 'anytime';
        return isMorning && !completedToday;
      });

      if (morningHabitsPending.length > 0) {
        notify(
          '☀️ Seus hábitos da manhã',
          `Bom dia! Reserve alguns instantes para você e inicie seus hábitos com serenidade.`,
          `habits-morning-${todayDateStr}`
        );
      }
      markNotifiedToday(morningKey, todayDateStr);
    }

    // 3.2 Hábitos da Noite
    const eveningTime = settings.eveningHabitsReminderTime || '20:30';
    const eveningKey = `evening_habits_${todayDateStr}`;

    if (currentFormattedTime === eveningTime && !hasNotifiedToday(eveningKey, todayDateStr)) {
      const pendingHabits = data.habits.filter((h) => !Boolean(h.history && h.history[todayDateStr]));
      if (pendingHabits.length > 0) {
        notify(
          '🌱 Cuidando de você',
          `Você tem hábitos pendentes para hoje. Que tal dedicar alguns minutos para o seu bem-estar antes de dormir?`,
          `habits-evening-${todayDateStr}`
        );
      }
      markNotifiedToday(eveningKey, todayDateStr);
    }
  }

  // =========================================================================
  // 4. ESPIRITUALIDADE & MOMENTO COM DEUS
  // =========================================================================
  if (settings.spiritualityEnabled) {
    const spiritTime = settings.spiritualityReminderTime || '07:30';
    const spiritKey = `spirituality_${todayDateStr}`;

    if (currentFormattedTime === spiritTime && !hasNotifiedToday(spiritKey, todayDateStr)) {
      notify(
        '🕊️ Momento com Deus',
        'Faça uma pausa serena para orar, meditar no versículo do dia e acalmar o coração.',
        `spirituality-${todayDateStr}`
      );
      markNotifiedToday(spiritKey, todayDateStr);
    }
  }

  // =========================================================================
  // 5. FECHAMENTO DO DIA
  // =========================================================================
  if (settings.dayClosingEnabled) {
    const closingTime = settings.dayClosingReminderTime || '21:30';
    const closingKey = `day_closing_${todayDateStr}`;

    // Se ainda não fechou o dia
    const hasClosedToday = data.user?.lastClosedDay === todayDateStr;
    if (!hasClosedToday && currentFormattedTime === closingTime && !hasNotifiedToday(closingKey, todayDateStr)) {
      notify(
        '🌙 Fechamento do Dia',
        'Seu dia está chegando ao fim. Descarregue a mente, reconheça suas vitórias e descanse em paz.',
        `closing-${todayDateStr}`
      );
      markNotifiedToday(closingKey, todayDateStr);
    }
  }
}
