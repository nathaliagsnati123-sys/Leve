import React from 'react';
import { useOnlineStatus } from '../../hooks/usePWAInstall';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-[max(env(safe-area-inset-top,0px)+8px,12px)] left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-amber-800 text-amber-50 px-3.5 py-1 text-xs font-medium shadow-md border border-amber-600/50">
      <WifiOff className="w-3.5 h-3.5 text-amber-300" />
      <span>Modo Offline — Seus dados estão salvos localmente</span>
    </div>
  );
};
