// Tela de Primeiro Acesso / Definição de Senha Definitiva - LEVE
import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Check, ShieldCheck, ArrowRight, LogOut, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const ForcePasswordChangeScreen: React.FC = () => {
  const { user, completeFirstAccess, logout } = useAuth();
  const { showToast } = useApp();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasMinLength = newPassword.length >= 6;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = hasMinLength && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newPassword) {
      setErrorMessage('Por favor, informe sua nova senha.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await completeFirstAccess(newPassword);
      setIsSubmitting(false);

      if (res.success) {
        showToast('Senha definitiva definida com sucesso! Bem-vinda ao LEVE.', 'success');
      } else {
        setErrorMessage(res.error || 'Não foi possível atualizar a senha. Tente novamente.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Erro ao definir nova senha.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Sessão encerrada.', 'info');
    } catch {}
  };

  const userEmail = user?.email || '';

  return (
    <div className="min-h-screen bg-[#F9FAF8] dark:bg-[#121915] text-stone-800 dark:text-stone-100 flex flex-col justify-between transition-colors duration-200">
      {/* Glow suave no topo */}
      <div className="absolute top-0 inset-x-0 h-72 bg-gradient-to-b from-emerald-100/30 via-emerald-50/15 to-transparent dark:from-emerald-950/20 dark:via-emerald-950/5 dark:to-transparent pointer-events-none" />

      {/* Header com logo */}
      <header className="relative z-10 max-w-4xl mx-auto w-full px-6 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-xs ring-1 ring-stone-200 dark:ring-stone-700 bg-white">
            <img src="/app-icon.png" alt="LEVE" className="w-full h-full object-cover" />
          </div>
          <span className="font-serif tracking-widest text-xl font-bold text-[#1F3A34] dark:text-emerald-300">
            LEVE
          </span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 px-3 py-1.5 rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-800/60 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair da conta
        </button>
      </header>

      {/* Conteúdo Central */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md bg-white/95 dark:bg-[#1A231F]/95 backdrop-blur-md rounded-3xl p-6 sm:p-9 border border-stone-200/80 dark:border-stone-800 shadow-xl shadow-stone-900/5 text-stone-900 dark:text-stone-100">
          
          {/* Ícone de destaque */}
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#1F3A34] dark:text-emerald-300 ring-1 ring-emerald-200/80 dark:ring-emerald-800/60 flex items-center justify-center mx-auto mb-5 shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <div className="text-center space-y-2 mb-6">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
              Defina sua Senha Definitiva
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              Bem-vinda ao seu primeiro acesso ao LEVE! Crie sua senha pessoal definitiva para acessar sua rotina com total privacidade e segurança.
            </p>
          </div>

          {/* Badge com e-mail confirmado */}
          {userEmail && (
            <div className="mb-6 px-3.5 py-2.5 rounded-xl bg-stone-100/80 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60 flex items-center justify-between text-xs">
              <span className="text-stone-500 dark:text-stone-400 font-medium">Acesso para:</span>
              <span className="font-semibold text-stone-800 dark:text-stone-200 truncate max-w-[200px]">
                {userEmail}
              </span>
            </div>
          )}

          {/* Alerta de erro */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nova Senha */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  required
                  autoFocus
                  className="w-full pl-10 pr-11 py-3 bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3A34] dark:focus:ring-emerald-500 transition"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmação de Senha */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                  className="w-full pl-10 pr-11 py-3 bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3A34] dark:focus:ring-emerald-500 transition"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
                  aria-label={showConfirmPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Requisitos de Validação */}
            <div className="pt-1 pb-2 space-y-1.5 text-xs">
              <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-stone-400 dark:text-stone-500'}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${hasMinLength ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' : 'bg-stone-200 dark:bg-stone-800'}`}>
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>Mínimo de 6 caracteres</span>
              </div>
              <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-stone-400 dark:text-stone-500'}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordsMatch ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' : 'bg-stone-200 dark:bg-stone-800'}`}>
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>As senhas coincidem</span>
              </div>
            </div>

            {/* Botão de envio */}
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="w-full py-3.5 px-4 bg-[#1F3A34] hover:bg-[#162925] text-emerald-100 font-semibold rounded-xl text-sm transition shadow-md shadow-[#1F3A34]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Salvando nova senha...</span>
                </>
              ) : (
                <>
                  <span>Salvar Senha e Entrar no LEVE</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>
      </main>

      {/* Footer simples */}
      <footer className="relative z-10 max-w-4xl mx-auto w-full px-6 py-6 text-center text-xs text-stone-400 dark:text-stone-500">
        LEVE • Organização & Autocuidado com leveza e intenção
      </footer>
    </div>
  );
};
