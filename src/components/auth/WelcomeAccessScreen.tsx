import React, { useState } from 'react';
import { 
  ArrowRight, ArrowLeft, Check, Sparkles, UserPlus, LogIn, 
  Lock, Mail, User, Eye, EyeOff, ShieldCheck, RefreshCw 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { TreatmentPreference } from '../../types';
import { TREATMENT_OPTIONS, normalizeTreatmentPreference } from '../../utils/treatment';
import { trackPixelEvent } from '../../utils/pixel';
import { translateAuthError } from '../../utils/authErrors';

interface WelcomeAccessScreenProps {
  onOpenLogin?: () => void;
  onOpenSignup?: () => void;
}

export const WelcomeAccessScreen: React.FC<WelcomeAccessScreenProps> = () => {
  const { login, signup, resetPassword } = useAuth();
  const { data, updateUser, startTour, showToast } = useApp();

  // Step 1, 2, 3: Apresentação | Step 4: Login ou Cadastro
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [authMode, setAuthMode] = useState<'signup' | 'login' | 'reset'>('signup');

  // Form states
  const [name, setName] = useState(data.user.name || '');
  const [avatar, setAvatar] = useState(data.user.avatar || '🌿');
  const [treatmentPreference, setTreatmentPreference] = useState<TreatmentPreference>(() => {
    return normalizeTreatmentPreference(data.user.treatmentPreference || 'feminino');
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const avatarOptions = ['🌿', '🌸', '✨', '🕊️', '☀️', '🪴', '☕', '🌻', '🧘‍♀️', '🌊'];

  // Pular direto para o Login para quem já tem conta
  const handleGoToLogin = () => {
    setAuthMode('login');
    setStep(4);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Cadastro de nova conta
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMessage('Por favor, digite como você gostaria de ser chamado(a).');
      return;
    }

    if (!email || !password) {
      setErrorMessage('Por favor, informe seu e-mail e crie uma senha.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signup(email, password, cleanName, treatmentPreference, avatar);
      setIsSubmitting(false);

      if (res.success) {
        // Pixel Meta
        trackPixelEvent('CompleteRegistration');
        trackPixelEvent('Lead');

        // Salvar permanentemente nome, avatar e forma de tratamento
        updateUser({
          name: cleanName,
          avatar,
          treatmentPreference,
          hasCompletedOnboarding: true
        });

        showToast('Conta criada com sucesso! Boas-vindas ao LEVE.', 'success');

        // Inicia automaticamente o Tour do App para quem acabou de criar a conta
        setTimeout(() => {
          startTour();
        }, 600);
      } else {
        setErrorMessage(translateAuthError(res.error) || 'Não foi possível criar a conta. Verifique os dados.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(translateAuthError(err?.message) || 'Erro ao realizar cadastro.');
    }
  };

  // Login de conta existente
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Por favor, informe seu e-mail e senha.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(email, password);
      setIsSubmitting(false);

      if (res.success) {
        updateUser({
          hasCompletedOnboarding: true
        });
        showToast('Boas-vindas de volta ao LEVE!', 'success');
      } else {
        setErrorMessage(translateAuthError(res.error) || 'E-mail ou senha incorretos.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(translateAuthError(err?.message) || 'Erro ao entrar na conta.');
    }
  };

  // Recuperação de senha
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email) {
      setErrorMessage('Por favor, informe seu e-mail cadastrado.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPassword(email);
      setIsSubmitting(false);
      if (res.success) {
        setSuccessMessage('Link de recuperação enviado para seu e-mail.');
        showToast('Link de recuperação enviado!', 'info');
      } else {
        setErrorMessage(translateAuthError(res.error) || 'Erro ao solicitar recuperação.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(translateAuthError(err?.message) || 'Erro ao solicitar recuperação.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAF8] dark:bg-[#121915] text-stone-800 dark:text-stone-100 flex flex-col justify-between transition-colors duration-200">
      {/* Glow ambiente sutil no topo */}
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-emerald-100/40 via-emerald-50/20 to-transparent dark:from-emerald-950/20 dark:via-emerald-950/5 dark:to-transparent pointer-events-none" />

      {/* Barra superior com logo e atalho direto para login */}
      <header className="relative z-10 max-w-5xl mx-auto w-full px-5 sm:px-8 pt-6 sm:pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-xs ring-1 ring-stone-200 dark:ring-stone-700 bg-white">
            <img src="/app-icon.png" alt="LEVE" className="w-full h-full object-cover" />
          </div>
          <span className="font-serif tracking-widest text-xl font-bold text-[#1F3A34] dark:text-emerald-300">
            LEVE
          </span>
        </div>

        {step < 4 ? (
          <button
            type="button"
            onClick={handleGoToLogin}
            className="text-xs sm:text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white px-3.5 py-1.5 rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-800/60 transition cursor-pointer"
          >
            Já tem conta? <span className="underline underline-offset-4 text-emerald-800 dark:text-emerald-400">Entrar</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-xs sm:text-sm font-semibold text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 transition cursor-pointer"
          >
            Ver apresentação
          </button>
        )}
      </header>

      {/* Conteúdo principal */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        <div className="w-full max-w-lg bg-white/95 dark:bg-[#1A231F]/95 backdrop-blur-md rounded-3xl p-6 sm:p-9 border border-stone-200/80 dark:border-stone-800 shadow-xl shadow-stone-900/5 text-stone-900 dark:text-stone-100 transition-all">

          {/* ============================================================ */}
          {/* SLIDE 1: Apresentação - Bem-vinda ao LEVE                     */}
          {/* ============================================================ */}
          {step === 1 && (
            <div className="space-y-6 text-center animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-3xl bg-[#1F3A34] text-emerald-100 flex items-center justify-center mx-auto shadow-md">
                <span className="font-serif italic text-3xl font-bold">L</span>
              </div>

              <div className="space-y-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                  Bem-vinda ao LEVE
                </h1>
                <p className="font-serif text-base sm:text-lg text-stone-600 dark:text-stone-300 italic">
                  “Tire da cabeça. Coloque em ordem.”
                </p>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto pt-2 leading-relaxed">
                  Uma central pessoal e acolhedora para organizar a sua rotina, cuidar da mente e focar no que realmente importa.
                </p>
              </div>

              {/* Indicador de passos */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <span className="w-6 h-1.5 rounded-full bg-[#1F3A34] dark:bg-emerald-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] active:scale-[0.99] font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span>Conhecer o LEVE</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ============================================================ */}
          {/* SLIDE 2: Apresentação - Sua mente livre                      */}
          {/* ============================================================ */}
          {step === 2 && (
            <div className="space-y-6 text-center animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mx-auto text-3xl shadow-xs">
                🧠
              </div>

              <div className="space-y-2">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                  Sua mente livre
                </h2>
                <p className="font-serif text-base sm:text-lg text-stone-600 dark:text-stone-300 italic">
                  “Sua vida não precisa ficar toda na sua cabeça.”
                </p>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto pt-2 leading-relaxed">
                  Descarregue tarefas, anotações, compromissos e pendências em um só lugar seguro, sem ruído e sereno.
                </p>
              </div>

              {/* Indicador de passos */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
                <span className="w-6 h-1.5 rounded-full bg-[#1F3A34] dark:bg-emerald-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-3 px-5 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-semibold transition cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] active:scale-[0.99] font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SLIDE 3: Apresentação - Cuidado integral                     */}
          {/* ============================================================ */}
          {step === 3 && (
            <div className="space-y-6 text-center animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-3xl bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 flex items-center justify-center mx-auto text-3xl shadow-xs">
                🌱
              </div>

              <div className="space-y-2">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                  Cuidado integral
                </h2>
                <p className="font-serif text-base sm:text-lg text-stone-600 dark:text-stone-300 italic">
                  “Organize. Cuide. Reflita. Viva.”
                </p>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto pt-2 leading-relaxed">
                  Água, hábitos, sono, espiritualidade, alimentação e gratidão. Um ritmo leve, no seu tempo e sem pressão.
                </p>
              </div>

              {/* Indicador de passos */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
                <span className="w-6 h-1.5 rounded-full bg-[#1F3A34] dark:bg-emerald-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-3 px-5 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-semibold transition cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] active:scale-[0.99] font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>Começar no LEVE</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SLIDE 4: Após a apresentação: Fazer Login ou Criar Conta     */}
          {/* ============================================================ */}
          {step === 4 && (
            <div className="space-y-5 text-left animate-in fade-in duration-200">
              <div className="text-center space-y-1">
                <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
                  {authMode === 'signup' && 'Crie sua conta no LEVE'}
                  {authMode === 'login' && 'Acesse sua conta'}
                  {authMode === 'reset' && 'Recuperar senha'}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                  {authMode === 'signup' && 'Personalize seu perfil e guarde tudo com segurança.'}
                  {authMode === 'login' && 'Entre para sincronizar suas anotações e rotina.'}
                  {authMode === 'reset' && 'Informe seu e-mail para receber as instruções.'}
                </p>
              </div>

              {/* Alternar abas: Criar Conta vs Já tenho conta */}
              <div className="flex rounded-2xl bg-stone-100 dark:bg-stone-800/80 p-1">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setErrorMessage(null); setSuccessMessage(null); }}
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
                  onClick={() => { setAuthMode('login'); setErrorMessage(null); setSuccessMessage(null); }}
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

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300">
                  {successMessage}
                </div>
              )}

              {/* FORMULÁRIO 1: CRIAR CONTA */}
              {authMode === 'signup' && (
                <form onSubmit={handleSignUpSubmit} className="space-y-4">
                  {/* 1. Nome preferido */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Como prefere ser chamado(a)? <span className="text-emerald-700 dark:text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Nathália, Lu, Gui..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                      />
                    </div>
                    <p className="text-[10px] text-stone-400">
                      Seu nome e ícone ficarão sempre salvos até que você deseje alterar.
                    </p>
                  </div>

                  {/* 2. Preferência de Tratamento: Feminino, Masculino, Desejo não informar */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Preferência de tratamento
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {TREATMENT_OPTIONS.map((opt) => {
                        const isSelected = treatmentPreference === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setTreatmentPreference(opt.id)}
                            className={`py-2 px-2 rounded-xl border text-xs font-medium transition cursor-pointer text-center ${
                              isSelected
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-950 dark:text-emerald-100 font-semibold ring-1 ring-emerald-600/30'
                                : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750'
                            }`}
                          >
                            <span className="block truncate">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Ícone do Perfil */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Escolha um ícone para seu perfil
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {avatarOptions.map((av) => (
                        <button
                          key={av}
                          type="button"
                          onClick={() => setAvatar(av)}
                          className={`w-9 h-9 rounded-2xl text-lg flex items-center justify-center transition cursor-pointer ${
                            avatar === av
                              ? 'bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-600 scale-105 shadow-xs'
                              : 'bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. E-mail */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Seu e-mail <span className="text-emerald-700 dark:text-emerald-400">*</span>
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

                  {/* 5. Senha */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Crie uma senha <span className="text-emerald-700 dark:text-emerald-400">*</span>
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

                  {/* Botão de Envio */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-5 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] active:scale-[0.99] font-semibold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                        <span>Criando sua conta...</span>
                      </>
                    ) : (
                      <>
                        <span>Criar minha conta e começar</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* FORMULÁRIO 2: ENTRAR (LOGIN) */}
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
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                        Sua senha
                      </label>
                      <button
                        type="button"
                        onClick={() => { setAuthMode('reset'); setErrorMessage(null); setSuccessMessage(null); }}
                        className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Esqueci a senha
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Sua senha"
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

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-5 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] active:scale-[0.99] font-semibold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                        <span>Entrando...</span>
                      </>
                    ) : (
                      <>
                        <span>Entrar na Minha Conta</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* FORMULÁRIO 3: RECUPERAR SENHA */}
              {authMode === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Seu e-mail cadastrado
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

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('login'); setErrorMessage(null); setSuccessMessage(null); }}
                      className="py-3 px-4 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-semibold transition cursor-pointer"
                    >
                      Voltar ao Login
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 px-5 rounded-2xl bg-[#1F3A34] text-white hover:bg-[#162A25] active:scale-[0.99] font-semibold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <span>Enviar link de recuperação</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Botão sutil para voltar aos slides */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-[11px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Rever apresentação do LEVE</span>
                </button>
              </div>

            </div>
          )}

          {/* Calming reassure badge */}
          <div className="pt-5 flex items-center justify-center gap-2 text-[11px] text-stone-400 dark:text-stone-500 border-t border-stone-100 dark:border-stone-800/80 mt-6">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Acesso individual protegido e seguro</span>
          </div>

        </div>
      </main>

      {/* Rodapé discreto */}
      <footer className="relative z-10 py-4 text-center text-xs text-stone-400 dark:text-stone-500">
        <p>LEVE • Clareza e serenidade para os seus dias</p>
      </footer>
    </div>
  );
};
