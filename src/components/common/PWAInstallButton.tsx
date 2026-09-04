import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed as PWA standalone, do not display
  if (isInstalled) {
    return null;
  }

  // Desktop / Android / Chrome flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className={`flex items-center gap-1.5 font-medium rounded-full transition shadow-xs ${
          compact
            ? 'px-2.5 py-1.5 text-xs bg-[#24463E] text-emerald-100 hover:bg-[#1C3630]'
            : 'px-3.5 py-2 text-xs sm:text-sm bg-[#1F3A34] text-white hover:bg-[#162A25]'
        }`}
        title="Instalar o LEVE no seu celular ou computador"
      >
        <Download className="w-3.5 h-3.5 text-emerald-300" />
        <span>Instalar LEVE</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-ios-guide-btn"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 font-medium rounded-full border border-stone-300 dark:border-stone-700 transition ${
            compact
              ? 'px-2.5 py-1 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              : 'px-3 py-1.5 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
          title="Instalar no iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Instalar no iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 p-6 shadow-2xl border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1F3A34] flex items-center justify-center text-emerald-200 font-bold text-sm">
                    L
                  </div>
                  <h3 className="font-serif text-lg font-semibold">Instalar LEVE no iPhone</h3>
                </div>
                <button 
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                <p className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">1</span>
                  <span>No Safari, toque no botão <strong>Compartilhar</strong> (ícone com uma seta para cima na barra inferior).</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">2</span>
                  <span>Role a lista para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">3</span>
                  <span>Toque em <strong>Adicionar</strong> no canto superior direito. Pronto! O LEVE funcionará como um aplicativo nativo.</span>
                </p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-[#1F3A34] py-2.5 text-xs sm:text-sm font-medium text-white hover:bg-[#162A25] transition"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
