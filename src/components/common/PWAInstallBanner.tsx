import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X, Share, PlusSquare } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(true); // default true until checked
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if dismissed previously
    const dismissed = localStorage.getItem('leve_pwa_banner_dismissed') === 'true';
    setIsDismissed(dismissed);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('leve_pwa_banner_dismissed', 'true');
    setIsDismissed(true);
  };

  // If already installed, or user dismissed, don't show
  if (isInstalled || isDismissed) {
    return null;
  }

  // Only show if browser allows installation (Android/Chrome/Edge/Desktop) OR if on iOS
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <div 
        id="pwa-install-banner"
        className="fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-40 animate-in slide-in-from-bottom-4 duration-300"
      >
        <div className="bg-[#1F3A34] text-white p-4 rounded-2xl shadow-xl border border-emerald-700/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/80 border border-emerald-600/40 flex-shrink-0 flex items-center justify-center text-emerald-300">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-xs sm:text-sm text-emerald-100 truncate">
                Instalar o LEVE no seu celular
              </h4>
              <p className="text-[11px] text-emerald-200/80 line-clamp-1">
                {isIOS 
                  ? 'Para instalar o LEVE: toque em Compartilhar → Adicionar à Tela de Início.'
                  : 'Abra com 1 toque na tela inicial, mais rápido e offline.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isInstallable && (
              <button
                onClick={install}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0F1E1B] font-semibold text-xs flex items-center gap-1.5 transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar LEVE</span>
              </button>
            )}

            {isIOS && (
              <button
                onClick={() => setShowIOSModal(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0F1E1B] font-semibold text-xs flex items-center gap-1.5 transition shadow-xs"
              >
                <Share className="w-3.5 h-3.5" />
                <span>Como instalar</span>
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="p-1.5 text-emerald-300/70 hover:text-white rounded-lg hover:bg-emerald-800/60 transition"
              title="Fechar aviso de instalação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal detalhado para iOS */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-2xl border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1F3A34] flex items-center justify-center text-emerald-200 font-bold text-base">
                  L
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold">Instalar o LEVE no iPhone</h3>
                  <p className="text-[11px] text-stone-500">Tela inicial sem barra de navegação</p>
                </div>
              </div>
              <button 
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 mb-4 text-xs font-medium text-emerald-900 dark:text-emerald-200">
              Para instalar o LEVE: toque em Compartilhar → Adicionar à Tela de Início.
            </div>

            <div className="space-y-3.5 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <p>
                  No Safari, toque no botão <strong>Compartilhar</strong> (ícone com quadrado e seta para cima <Share className="w-3.5 h-3.5 inline mx-0.5" />).
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <p>
                  Role as opções para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5" />).
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <p>
                  Toque em <strong>Adicionar</strong> no canto superior. O ícone do LEVE aparecerá na sua tela inicial e abrirá em tela cheia como um app!
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIOSModal(false);
                handleDismiss();
              }}
              className="mt-6 w-full rounded-2xl bg-[#1F3A34] py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#162A25] transition"
            >
              Entendi e vou adicionar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
