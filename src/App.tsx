import React, { useEffect, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { trackPixelPageView } from './utils/pixel';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { MobileMenuDrawer } from './components/common/MobileMenuDrawer';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { RefreshCw } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EntitlementLockScreen } from './components/common/EntitlementLockScreen';

// 1. A tela principal de rotina ("Meu Dia") é carregada de forma direta para abertura instantânea (0ms)
import { MyDayView } from './components/views/MyDayView';

// 2. Todas as demais telas secundárias são divididas em chunks leves sob demanda (Code Splitting)
const CalendarView = lazy(() => import('./components/views/CalendarView').then(m => ({ default: m.CalendarView })));
const HabitsView = lazy(() => import('./components/views/HabitsView').then(m => ({ default: m.HabitsView })));
const JournalView = lazy(() => import('./components/views/JournalView').then(m => ({ default: m.JournalView })));
const SpiritualityView = lazy(() => import('./components/views/SpiritualityView').then(m => ({ default: m.SpiritualityView })));
const GoalsView = lazy(() => import('./components/views/GoalsView').then(m => ({ default: m.GoalsView })));
const HydrationView = lazy(() => import('./components/views/HydrationView').then(m => ({ default: m.HydrationView })));
const NutritionView = lazy(() => import('./components/views/NutritionView').then(m => ({ default: m.NutritionView })));
const MovementView = lazy(() => import('./components/views/MovementView').then(m => ({ default: m.MovementView })));
const SleepView = lazy(() => import('./components/views/SleepView').then(m => ({ default: m.SleepView })));
const SelfCareView = lazy(() => import('./components/views/SelfCareView').then(m => ({ default: m.SelfCareView })));
const BillsView = lazy(() => import('./components/views/BillsView').then(m => ({ default: m.BillsView })));
const CycleView = lazy(() => import('./components/views/CycleView').then(m => ({ default: m.CycleView })));
const ProgressView = lazy(() => import('./components/views/ProgressView').then(m => ({ default: m.ProgressView })));
const SettingsView = lazy(() => import('./components/views/SettingsView').then(m => ({ default: m.SettingsView })));
const LiaView = lazy(() => import('./components/views/LiaView').then(m => ({ default: m.LiaView })));
const MyLifeView = lazy(() => import('./components/views/MyLifeView').then(m => ({ default: m.MyLifeView })));
const WorkoutView = lazy(() => import('./components/views/WorkoutView').then(m => ({ default: m.WorkoutView })));
const StudiesView = lazy(() => import('./components/views/StudiesView').then(m => ({ default: m.StudiesView })));

// Tela de boas-vindas / login
const WelcomeAccessScreen = lazy(() => import('./components/auth/WelcomeAccessScreen').then(m => ({ default: m.WelcomeAccessScreen })));

// Modais globais carregados sob demanda apenas quando ativados pelo usuário
const BrainDumpModal = lazy(() => import('./components/modals/BrainDumpModal').then(m => ({ default: m.BrainDumpModal })));
const TaskModal = lazy(() => import('./components/modals/TaskModal').then(m => ({ default: m.TaskModal })));
const DayClosingModal = lazy(() => import('./components/modals/DayClosingModal').then(m => ({ default: m.DayClosingModal })));
const SearchModal = lazy(() => import('./components/modals/SearchModal').then(m => ({ default: m.SearchModal })));
const AchievementsModal = lazy(() => import('./components/modals/AchievementsModal').then(m => ({ default: m.AchievementsModal })));
const CelebrationModal = lazy(() => import('./components/modals/CelebrationModal').then(m => ({ default: m.CelebrationModal })));
const OnboardingModal = lazy(() => import('./components/modals/OnboardingModal').then(m => ({ default: m.OnboardingModal })));
const AppTourModal = lazy(() => import('./components/modals/AppTourModal').then(m => ({ default: m.AppTourModal })));
const FiveMinuteGodModal = lazy(() => import('./components/modals/FiveMinuteGodModal').then(m => ({ default: m.FiveMinuteGodModal })));
const AuthModal = lazy(() => import('./components/modals/AuthModal').then(m => ({ default: m.AuthModal })));

const ViewLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
    <RefreshCw className="w-5 h-5 text-[#1F3A34] dark:text-emerald-400 animate-spin" />
  </div>
);

const AppContent: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab,
    isBrainDumpOpen,
    isTaskModalOpen,
    isDayClosingOpen,
    isSearchOpen,
    isAchievementsOpen,
    celebrationAchievement,
    isOnboardingOpen,
    isTourOpen,
    isFiveMinGodOpen
  } = useApp();
  
  const { 
    user, 
    entitlements, 
    canAccessFeature, 
    isCheckingEntitlements, 
    isLoading, 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    setAuthTab 
  } = useAuth();

  useEffect(() => {
    trackPixelPageView(activeTab);
  }, [activeTab]);

  // 1. Enquanto carrega a sessão do Supabase, exibe tela de carregamento suave
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAF8] dark:bg-[#121915] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xs ring-1 ring-stone-200 dark:ring-stone-700 bg-white">
          <img src="/app-icon.png" alt="LEVE" className="w-full h-full object-cover" />
        </div>
        <RefreshCw className="w-5 h-5 text-[#1F3A34] dark:text-emerald-400 animate-spin" />
        <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Carregando o LEVE...</p>
      </div>
    );
  }

  // 2. Se NÃO estiver autenticado: exibe a tela inicial de acesso
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F9FAF8] dark:bg-[#121915] text-stone-800 dark:text-stone-100 flex flex-col font-sans">
        <OfflineIndicator />
        <Suspense fallback={<ViewLoadingFallback />}>
          <WelcomeAccessScreen 
            onOpenLogin={() => {
              setAuthTab('login');
              setIsAuthModalOpen(true);
            }}
            onOpenSignup={() => {
              setAuthTab('signup');
              setIsAuthModalOpen(true);
            }}
          />
        </Suspense>
        <Suspense fallback={null}>
          {isAuthModalOpen && <AuthModal />}
        </Suspense>
      </div>
    );
  }

  const renderActiveView = () => {
    // 1. "Meu Dia" é síncrono e abre em 0ms
    if (activeTab === 'my-day') {
      return <MyDayView />;
    }

    // 2. Verificação de permissões apenas para primeiro acesso se ainda não houver cache
    if (user && !entitlements && isCheckingEntitlements) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 text-[#1F3A34] dark:text-emerald-400 animate-spin" />
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Verificando seu plano LEVE...</p>
        </div>
      );
    }

    // 3. Bloqueio centralizado caso o plano do usuário não tenha acesso
    if (activeTab !== 'settings' && !canAccessFeature(activeTab)) {
      return (
        <EntitlementLockScreen 
          feature={activeTab}
          onGoToFree={() => setActiveTab('my-day')}
        />
      );
    }

    // 4. Renderização com Suspense para todas as demais abas sob demanda
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        {(() => {
          switch (activeTab) {
            case 'settings':
              return <SettingsView />;
            case 'calendar':
              return <CalendarView />;
            case 'habits':
              return <HabitsView />;
            case 'journal':
              return <JournalView />;
            case 'spirituality':
              return <SpiritualityView />;
            case 'goals':
              return <GoalsView />;
            case 'hydration':
              return <HydrationView />;
            case 'nutrition':
              return <NutritionView />;
            case 'movement':
              return <MovementView />;
            case 'sleep':
              return <SleepView />;
            case 'self-care':
              return <SelfCareView />;
            case 'bills':
              return <BillsView />;
            case 'cycle':
              return <CycleView />;
            case 'progress':
              return <ProgressView />;
            case 'my-life':
              return <MyLifeView />;
            case 'workouts':
              return <WorkoutView />;
            case 'studies':
              return <StudiesView />;
            case 'lia':
              return <LiaView />;
            default:
              return <MyDayView />;
          }
        })()}
      </Suspense>
    );
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] dark:bg-stone-950 text-stone-800 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200">
      {/* Offline Status */}
      <OfflineIndicator />

      {/* Top Header */}
      <Header />

      {/* Main Body Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 gap-6 items-start">
        {/* Desktop Left Sidebar */}
        <div className="hidden md:block w-64 lg:w-72 shrink-0 sticky top-20">
          <Sidebar />
        </div>

        {/* Dynamic Center View Container */}
        <main className="flex-1 min-w-0 pb-safe pb-8 md:pb-6">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Menu Drawer (All options identical to desktop) */}
      <MobileMenuDrawer />

      {/* Global Modals - Carregados dinamicamente apenas sob demanda */}
      <Suspense fallback={null}>
        {isBrainDumpOpen && <BrainDumpModal />}
        {isTaskModalOpen && <TaskModal />}
        {isDayClosingOpen && <DayClosingModal />}
        {isSearchOpen && <SearchModal />}
        {isAchievementsOpen && <AchievementsModal />}
        {celebrationAchievement && <CelebrationModal />}
        {isOnboardingOpen && <OnboardingModal />}
        {isTourOpen && <AppTourModal />}
        {isFiveMinGodOpen && <FiveMinuteGodModal />}
        {isAuthModalOpen && <AuthModal />}
      </Suspense>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
