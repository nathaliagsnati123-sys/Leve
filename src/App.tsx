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
import { useAuth } from './context/AuthContext';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, toastMessage } = useApp();
  const { user, canAccessFeature, isCheckingEntitlements, isLoading } = useAuth();

  useEffect(() => {
    trackPixelPageView(activeTab);
  }, [activeTab]);

  const renderActiveView = () => {
    // 1. "Meu Dia" é SEMPRE liberado para qualquer plano e visitantes
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
      <FiveMinuteGodModal />
      <AuthModal />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#1F3A34] text-white text-xs sm:text-sm font-medium shadow-xl border border-emerald-800/40 animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}
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
