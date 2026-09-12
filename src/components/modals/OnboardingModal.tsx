import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowRight, ArrowLeft, Check, Sparkles, UserPlus, LogIn, 
  Lock, Mail, User, Eye, EyeOff, HeartHandshake, ShieldCheck
} from 'lucide-react';
import { TreatmentPreference } from '../../types';
import { TREATMENT_OPTIONS, normalizeTreatmentPreference } from '../../utils/treatment';
import { trackPixelEvent } from '../../utils/pixel';
import { 
  getRememberedEmail, saveRememberedEmail, 
  isPresentationAlreadyCompleted, markPresentationCompleted, 
  saveUserIdentity 
} from '../../services/storage';

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen, updateUser, data, showToast } = useApp();
  const { login, signup } = useAuth();

  const savedEmail = getRememberedEmail();
  const presentationAlreadyDone = isPresentationAlreadyCompleted();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>(() => (savedEmail ? 'login' : 'signup'));

  // Form states - criação de conta simples: apenas nome, email, senha e confirmação de senha
  const [name, setName] = useState(data.user.name || '');
  const [avatar, setAvatar] = useState(data.user.avatar || '🌿');
  const [treatmentPreference, setTreatmentPreference] = useState<TreatmentPreference>(() => {
    return normalizeTreatmentPreference(data.user.treatmentPreference || 'feminino');
  });

  const [email, setEmail] = useState(() => savedEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOnboardingOpen || presentationAlreadyDone) return null;

  const handleEmailChange = (val: string) => {
    setEmail(val);
    saveRememberedEmail(val);
  };

  const avatarOptions = ['🌿', '🌸', '✨', '🕊️', '☀️', '🪴', '☕', '🌻', '🧘‍♀️', '🌊'];

  // Finalização para criar conta
  const handleSignUpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMessage('Por favor, informe seu nome.');
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Por favor, informe seu e-mail.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor, crie uma senha.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (!confirmPassword) {
      setErrorMessage('Por favor, confirme sua senha.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem. Por favor, confira a digitação.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signup(cleanEmail, password, cleanName, treatmentPreference, avatar);
      setIsSubmitting(false);

      if (res.success) {
        // Track Pixel
        trackPixelEvent('CompleteRegistration');
        trackPixelEvent('Lead');

        // Salvar e-mail no dispositivo e marcar apresentação como concluída
        saveRememberedEmail(email);
        markPresentationCompleted();

        // Salva perfil persistente
        saveUserIdentity({
          name: cleanName,
          avatar,
          treatmentPreference,
          hasCompletedOnboarding: true
        });

        updateUser({
          name: cleanName,
          avatar,
          treatmentPreference,
          hasCompletedOnboarding: true
        });

        setIsOnboardingOpen(false);
        showToast('Conta criada com sucesso! Boas-vindas ao LEVE.', 'success');
      } else {
        setErrorMessage(res.error || 'Não foi possível criar a conta. Verifique os dados.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Erro ao realizar cadastro.');
    }
  };

  // Finalização para fazer login
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Por favor, informe seu e-mail e senha.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(email, password);
      setIsSubmitting(false);

      if (res.success) {
        saveRememberedEmail(email);
        markPresentationCompleted();

        saveUserIdentity({
          hasCompletedOnboarding: true
        });

        updateUser({
          hasCompletedOnboarding: true
        });
        setIsOnboardingOpen(false);
        showToast('Boas-vindas de volta! Conta conectada.', 'success');
      } else {
        setErrorMessage(res.error || 'E-mail ou senha incorretos.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Erro ao entrar na conta.');
    }
  };

  // Entrada como visitante / salvar perfil local e concluir apresentação
  const handleContinueAsGuest = () => {
    const cleanName = name.trim();
    markPresentationCompleted();

    saveUserIdentity({
      name: cleanName,
      avatar,
      treatmentPreference,
      hasCompletedOnboarding: true
    });

    updateUser({
      name: cleanName,
      avatar,
      treatmentPreference,
      hasCompletedOnboarding: true
    });
    setIsOnboardingOpen(false);
    showToast('Preferências salvas! Boas-vindas ao LEVE.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F9FAF8]/95 dark:bg-[#121815]/95 backdrop-blur-md p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-2xl p-6 sm:p-8 space-y-6 text-center text-stone-900 dark:text-stone-100 my-auto">
        
        {/* Step 1: Apresentação - Boas-vindas */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-[#1F3A34] text-emerald-100 flex items-center justify-center mx-auto shadow-md">
              <span className="font-serif italic text-3xl">L</span>
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold">
                Bem-vinda ao LEVE
              </h2>
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 font-medium">
                Tire da cabeça. Coloque em ordem.
              </p>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto pt-2 leading-relaxed">
                Uma central pessoal e acolhedora para organizar a sua rotina, cuidar da mente e focar no que realmente importa.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span>Conhecer o LEVE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Apresentação - Sua mente livre */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mx-auto text-3xl shadow-xs">
              🧠
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold">
                Sua mente livre
              </h2>
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 font-medium">
                Sua vida não precisa ficar toda na sua cabeça.
              </p>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto pt-2 leading-relaxed">
                Descarregue tarefas, anotações, compromissos e pendências em um só lugar seguro, sem ruído e sereno.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-semibold transition cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Apresentação - Cuidado integral */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 flex items-center justify-center mx-auto text-3xl shadow-xs">
              🌱
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold">
                Cuidado integral
              </h2>
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 font-medium">
                Organize. Cuide. Reflita. Viva.
              </p>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto pt-2 leading-relaxed">
                Água, hábitos, sono, espiritualidade, alimentação e gratidão. Um ritmo leve, no seu tempo e sem pressão.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3 px-4 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-semibold transition cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Apresentação - Conheça a LEVIA */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 flex items-center justify-center mx-auto text-3xl shadow-xs">
              ✨
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-900/60 text-[11px] font-semibold text-amber-800 dark:text-amber-300 mb-1">
                <span>Inteligência & Acolhimento</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold">
                Conheça a LEVIA
              </h2>
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 font-medium italic">
                “Você fala. A LEVIA organiza.”
              </p>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto pt-2 leading-relaxed">
                Sua assistente inteligente para tirar as pendências da cabeça. Conte tarefas, compromissos ou desabafe em linguagem natural — a LEVIA estrutura tudo e respeita o seu tempo.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="py-3 px-4 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-semibold transition cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span>Começar no LEVE</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Login ou Criar Conta */}
        {step === 5 && (
          <div className="space-y-5 text-left animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="text-center space-y-1">
              <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
                {authMode === 'signup' ? 'Crie sua conta no LEVE' : 'Acesse sua conta'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                {authMode === 'signup' 
                  ? 'Guarde suas anotações e rotina com segurança na nuvem.'
                  : 'Entre para sincronizar suas anotações e rotina.'}
              </p>
            </div>

            {/* Abas Alternar: Criar Conta vs Já tenho conta */}
            <div className="flex rounded-2xl bg-stone-100 dark:bg-stone-800/80 p-1">
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setErrorMessage(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'signup'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Criar Conta</span>
              </button>

              <button
                type="button"
                onClick={() => { setAuthMode('login'); setErrorMessage(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'login'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Já tenho conta</span>
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
                {errorMessage}
              </div>
            )}

            {/* FORM: CRIAR CONTA (Apenas nome, email, senha e confirmação de senha) */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                {/* 1. Nome */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Nome <span className="text-emerald-700 dark:text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Como gostaria de ser chamado(a)?"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                    />
                  </div>
                </div>

                {/* 2. E-mail */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    E-mail <span className="text-emerald-700 dark:text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                    />
                  </div>
                  {savedEmail && email === savedEmail && (
                    <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 pt-0.5 px-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        E-mail salvo neste aparelho
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEmailChange('')}
                        className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 underline cursor-pointer"
                      >
                        Trocar e-mail
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Senha */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Senha <span className="text-emerald-700 dark:text-emerald-400">*</span>
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 4. Confirmação de Senha */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Confirmação de Senha <span className="text-emerald-700 dark:text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Digite a senha novamente"
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Botão de Conclusão */}
                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Criando conta...</span>
                      </span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-300" />
                        <span>Criar Minha Conta e Começar</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleContinueAsGuest}
                    className="w-full py-2 text-center text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 font-medium transition cursor-pointer"
                  >
                    Ou continuar como visitante por enquanto
                  </button>
                </div>
              </form>
            )}

            {/* FORM: LOGIN */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Seu e-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                    />
                  </div>
                  {savedEmail && email === savedEmail && (
                    <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 pt-0.5 px-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        E-mail salvo neste aparelho
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEmailChange('')}
                        className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 underline cursor-pointer"
                      >
                        Trocar e-mail
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Sua senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] font-semibold text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Entrando...</span>
                      </span>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 text-emerald-300" />
                        <span>Entrar no LEVE</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleContinueAsGuest}
                    className="w-full py-2 text-center text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 font-medium transition cursor-pointer"
                  >
                    Ou continuar como visitante por enquanto
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Step indicator dots */}
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <span
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? 'w-6 bg-[#1F3A34] dark:bg-emerald-400' : 'w-1.5 bg-stone-200 dark:bg-stone-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
