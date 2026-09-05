import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { MobileMenuDrawer } from './components/common/MobileMenuDrawer';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';

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
import { EntitlementLockScreen } from './components/common/EntitlementLockScreen';
import { useAuth } from './context/AuthContext';

const AppContent: React.FC = () => {
  const { activeTab, toastMessage } = useApp();
  const { user, hasLeveAccess, isCheckingEntitlements, isLoading } = useAuth();

  const renderActiveView = () => {
    // Se o usuário estiver logado e não possuir leve_access nem special_access
    if (user && !hasLeveAccess) {
      if (isCheckingEntitlements || isLoading) {
        return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-[#1F3A34] dark:text-emerald-400 animate-spin" />
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Verificando permissões...</p>
          </div>
        );
      }
      return <EntitlementLockScreen />;
    }

    switch (activeTab) {
      case 'my-day':
        return <MyDayView />;
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
      case 'lia':
        return <LiaView />;
      case 'settings':
        return <SettingsView />;
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
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 gap-6">
        {/* Desktop Left Sidebar */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <Sidebar />
        </aside>

        {/* Dynamic Center View Container */}
        <main className="flex-1 min-w-0 pb-safe pb-8 md:pb-6">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Menu Drawer (All options identical to desktop) */}
      <MobileMenuDrawer />

      {/* PWA Discreet Installation Banner */}
      <PWAInstallBanner />

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
