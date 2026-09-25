import React, { useState } from 'react';
import { 
  KeyRound, Mail, Lock, Eye, EyeOff, CheckCircle2, 
  RefreshCw, ArrowRight, Send, AlertCircle, Sparkles, ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { TreatmentPreference } from '../../types';
import { trackPixelEvent } from '../../utils/pixel';
import { saveRememberedEmail, markPresentationCompleted, saveUserIdentity } from '../../services/storage';

interface AccessCodeFormProps {
  initialEmail?: string;
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const AccessCodeForm: React.FC<AccessCodeFormProps> = ({
  initialEmail = '',
  onSuccess,
  onSwitchToLogin
}) => {
  const { validateAccessCode, activateWithCode, resendAccessCode } = useAuth();
  const { updateUser, showToast } = useApp();

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [isValidated, setIsValidated] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1. Validar Código
  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanEmail) {
      setErrorMessage('Informe o e-mail cadastrado na compra.');
      return;
    }
    if (!cleanCode) {
      setErrorMessage('Informe o código de acesso recebido por e-mail.');
      return;
    }

    setIsValidating(true);
    try {
      const res = await validateAccessCode(cleanEmail, cleanCode);
      setIsValidating(false);

      if (res.valid) {
        setIsValidated(true);
        if (res.buyerName) {
          setBuyerName(res.buyerName);
        }
        setSuccessMessage(`Código confirmado com sucesso! ${res.buyerName ? `Olá, ${res.buyerName}.` : ''} Agora crie sua senha pessoal para concluir a ativação.`);
      } else {
        if (res.alreadyUsed) {
          setErrorMessage('Este código já foi utilizado anteriormente para ativar a conta. Você já pode fazer login normalmente.');
        } else {
          setErrorMessage(res.error || 'Código inválido ou não encontrado para este e-mail. Verifique o e-mail ou solicite o reenvio abaixo.');
        }
      }
    } catch (err: any) {
      setIsValidating(false);
      setErrorMessage(err?.message || 'Erro ao validar código no servidor.');
    }
  };

  // 2. Concluir Ativação com Senha
  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim().toUpperCase();
    const cleanPassword = password.trim();

    if (!cleanPassword) {
      setErrorMessage('Por favor, defina sua nova senha.');
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }

    if (cleanPassword !== confirmPassword.trim()) {
      setErrorMessage('As senhas digitadas não coincidem. Confira a digitação.');
      return;
    }

    setIsActivating(true);
    try {
      const res = await activateWithCode(
        cleanEmail,
        cleanCode,
        cleanPassword,
        buyerName,
        'feminino' as TreatmentPreference,
        '🌿'
      );
      setIsActivating(false);

      if (res.success) {
        trackPixelEvent('CompleteRegistration');
        saveRememberedEmail(cleanEmail);
        markPresentationCompleted();
        
        const finalName = buyerName || cleanEmail.split('@')[0];
        saveUserIdentity({
          name: finalName,
          hasCompletedOnboarding: true
        });
        updateUser({
          name: finalName,
          hasCompletedOnboarding: true
        });

        showToast('Conta ativada com sucesso! Seu acesso VIP está liberado.', 'success');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setErrorMessage(res.error || 'Não foi possível ativar sua conta. Tente novamente.');
      }
    } catch (err: any) {
      setIsActivating(false);
      setErrorMessage(err?.message || 'Erro ao registrar ativação.');
    }
  };

  // 3. Reenviar Código por e-mail
  const handleResend = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Informe seu e-mail para receber o código.');
      return;
    }

    setIsResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await resendAccessCode(cleanEmail);
      setIsResending(false);
      if (res.success) {
        setSuccessMessage(res.message || 'Código reenviado com sucesso! Verifique sua caixa de entrada e spam.');
        showToast('Código reenviado por e-mail!', 'info');
      } else {
        setErrorMessage(res.error || 'Não foi possível reenviar o código para este e-mail.');
      }
    } catch (err: any) {
      setIsResending(false);
      setErrorMessage(err?.message || 'Erro ao solicitar reenvio.');
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* Informative Header */}
      <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-stone-900 dark:text-stone-100">
              Primeiro Acesso pós-compra Hotmart
            </p>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
              Digite o e-mail utilizado na sua compra e o código de acesso que enviamos por e-mail para ativar sua conta VIP e criar sua senha.
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{successMessage}</div>
        </div>
      )}

      {!isValidated ? (
        /* ETAPA 1: DIGITAR E-MAIL E CÓDIGO */
        <form onSubmit={handleValidate} className="space-y-3.5">
          {/* Campo E-mail */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              E-mail da compra <span className="text-emerald-700 dark:text-emerald-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
              />
            </div>
          </div>

          {/* Campo Código de Acesso */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Código de Acesso Único <span className="text-emerald-700 dark:text-emerald-400">*</span>
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                placeholder="Ex: LEVE-XXXX"
                maxLength={16}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-mono text-sm tracking-wider uppercase placeholder:normal-case placeholder:font-sans placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
              />
            </div>
          </div>

          {/* Botão Validar */}
          <button
            type="submit"
            disabled={isValidating || !email || !code}
            className="w-full py-3 px-5 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] active:scale-[0.99] font-semibold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isValidating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                <span>Validando seu código...</span>
              </>
            ) : (
              <>
                <span>Validar Código e Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Opção de Reenviar Código */}
          <div className="pt-2 flex flex-col items-center gap-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              disabled={isResending}
              onClick={handleResend}
              className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isResending ? 'Enviando código...' : 'Não recebeu o código? Reenviar por e-mail'}</span>
            </button>

            {onSwitchToLogin && (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-[11px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer"
              >
                Já cadastrou sua senha anteriormente? <span className="underline">Entrar na conta</span>
              </button>
            )}
          </div>
        </form>
      ) : (
        /* ETAPA 2: CADASTRAR SENHA PESSOAL */
        <form onSubmit={handleActivate} className="space-y-3.5">
          {/* Badge de Validação Confirmada */}
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                  {buyerName ? `Olá, ${buyerName}!` : 'Código Confirmado!'}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Acesso LEVE VIP + LEVIA liberado para {email}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsValidated(false)}
              className="text-[10px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 underline cursor-pointer"
            >
              Trocar
            </button>
          </div>

          {/* Campo Nova Senha */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Crie sua senha pessoal <span className="text-emerald-700 dark:text-emerald-400">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Campo Confirmar Senha */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Confirme sua senha <span className="text-emerald-700 dark:text-emerald-400">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita sua senha"
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                title={showConfirmPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botão Finalizar Ativação */}
          <button
            type="submit"
            disabled={isActivating || !password || !confirmPassword}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] active:scale-[0.99] font-semibold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isActivating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                <span>Ativando sua conta...</span>
              </>
            ) : (
              <>
                <span>Ativar Minha Conta e Entrar</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
