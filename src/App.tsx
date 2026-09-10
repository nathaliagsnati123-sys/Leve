import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { trackPixelPageView } from './utils/pixel';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { MobileMenuDrawer } from './components/common/MobileMenuDrawer';
import { OfflineIndicator } from './components/common/OfflineIndicator';

// Modals
import { BrainDumpModal } from './components/modals/BrainDumpModal';
import { TaskModal } from './components/modals/TaskModal';
import { DayClosingModal } from './components/modals/DayClosingModal';
import { SearchModal } from './components/modals/SearchModal';
import { AchievementsModal } from './components/modals/AchievementsModal';
import { CelebrationModal } from './components/modals/CelebrationModal';
import { OnboardingModal } from './components/modals/OnboardingModal';
import { AppTourModal } from './components/modals/AppTourModal';
import { FiveMinuteGodModal } from './components/modals/FiveMinuteGodModal';
import { AuthModal } from './components/modals/AuthModal';
import { AuthProvider } from './context/AuthContext';

// Views
import { MyDayView } from './components/views/MyDayView';
import { CalendarView } from './components/views/CalendarView';
import { HabitsView } from './components/views/HabitsView';
import { JournalView } from './components/views/JournalView';
import { SpiritualityView } from './components/views/SpiritualityView';
import { GoalsView } from './components/views/GoalsView';
import { HydrationView } from './components/views/HydrationView';
import { NutritionView } from './components/views/NutritionView';
import { MovementView } from './components/views/MovementView';
import { SleepView } from './components/views/SleepView';
import { SelfCareView } from './components/views/SelfCareView';
import { BillsView } from './components/views/BillsView';
import { CycleView } from './components/views/CycleView';
import { ProgressView } from './components/views/ProgressView';
import { SettingsView } from './components/views/SettingsView';
import { RefreshCw } from 'lucide-react';
import { LiaView } from './components/views/LiaView';
import { MyLifeView } from './components/views/MyLifeView';
import { EntitlementLockScreen } from './components/common/EntitlementLockScreen';
import { WelcomeAccessScreen } from './components/auth/WelcomeAccessScreen';
import { useAuth } from './context/AuthContext';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const { user, canAccessFeature, isCheckingEntitlements, isLoading, setIsAuthModalOpen, setAuthTab } = useAuth();

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

  // 2. Se NÃO estiver autenticado: exibe obrigatoriamente a tela inicial de acesso
  // Não permite acesso nem navegação às áreas internas sem login/cadastro
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F9FAF8] dark:bg-[#121915] text-stone-800 dark:text-stone-100 flex flex-col font-sans">
        <OfflineIndicator />
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
        <AuthModal />
      </div>
    );
  }

  useEffect(() => {
    trackPixelPageView(activeTab);
  }, [activeTab]);

  const renderActiveView = () => {
    // 1. "Meu Dia" é a tela principal de rotina
    if (activeTab === 'my-day') {
      return <MyDayView />;
    }

    // 2. Configurações também é sempre acessível
    if (activeTab === 'settings') {
      return <SettingsView />;
    }

    // 3. Se estiver em processo de verificação das permissões no Supabase
    if (user && (isCheckingEntitlements || isLoading)) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 text-[#1F3A34] dark:text-emerald-400 animate-spin" />
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Verificando seu plano LEVE...</p>
        </div>
      );
    }

    // 4. Bloqueio centralizado caso o plano do usuário não tenha acesso
    if (!canAccessFeature(activeTab)) {
      return (
        <EntitlementLockScreen 
          feature={activeTab}
          onGoToFree={() => setActiveTab('my-day')}
        />
      );
    }

    // 5. Renderização das abas liberadas
    switch (activeTab) {
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
      case 'lia':
        return <LiaView />;
      default:
        return <MyDayView />;
    }
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

      {/* Global Modals */}
      <BrainDumpModal />
      <TaskModal />
      <DayClosingModal />
      <SearchModal />
      <AchievementsModal />
      <CelebrationModal />
      <OnboardingModal />
      <AppTourModal />
      <FiveMinuteGodModal />
      <AuthModal />
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
