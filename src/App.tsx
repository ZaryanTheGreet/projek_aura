import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { api } from './api';
import { JournalEntry, Exercise, CheckinInput } from './types';
import { BottomNavigation, MainTab } from './components/Navigation';
import { ThemePickerModal } from './components/ThemePickerModal';

// Screens
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { WriteJournal } from './pages/WriteJournal';
import { Trend } from './pages/Trend';
import { Result } from './pages/Result';
import { ExercisePlayer } from './pages/ExercisePlayer';
import { CareMode } from './pages/CareMode';
import { QuickCheckinSheet } from './pages/QuickCheckinSheet';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { BreakPlanner } from './pages/BreakPlanner';
import { TaskBreaker } from './pages/TaskBreaker';
import { PrintableDocument } from './pages/PrintableDocument';
import { HRLogin } from './pages/HRLogin';
import { HRDashboard } from './pages/HRDashboard';

type Screen =
  | 'landing'
  | 'login'
  | 'hr_login'
  | 'hr_dashboard'
  | 'main'
  | 'result'
  | 'exercise'
  | 'care_mode'
  | 'history'
  | 'settings'
  | 'break_planner'
  | 'task_breaker'
  | 'printable';

export const AppContent: React.FC = () => {
  // Navigation & Role State
  const [screen, setScreen] = useState<Screen>('main');
  const [currentTab, setCurrentTab] = useState<MainTab>('home');
  const [userRole, setUserRole] = useState<'employee' | 'hrd' | null>(null);

  // Active payloads
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [printableMode, setPrintableMode] = useState<'konselor' | 'data_saya'>('konselor');

  // Modals
  const [quickCheckinOpen, setQuickCheckinOpen] = useState(false);
  const [quickCheckinLoading, setQuickCheckinLoading] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);

  // Initialize storage & verify auth
  useEffect(() => {
    api.initStorage();
    const role = api.getCurrentRole();
    setUserRole(role);

    // Initial routing based on auth state
    if (role === 'hrd') {
      setScreen('hr_dashboard');
    } else if (role === 'employee') {
      setScreen('main');
    } else {
      // Default to landing page for first-time / logged-out users
      setScreen('landing');
    }
  }, []);

  // Handle Quick Check-in submit
  const handleQuickCheckinSubmit = async (input: CheckinInput) => {
    setQuickCheckinLoading(true);
    try {
      const entry = await api.postCheckin(input);
      setQuickCheckinLoading(false);
      setQuickCheckinOpen(false); // This will trigger useEffect in QuickCheckinSheet to reset state
      setActiveEntry(entry);
      setScreen('result');
    } catch {
      setQuickCheckinLoading(false);
      // Keep state on error (Issue 5)
    }
  };

  // Auth actions
  const handleLoginSuccess = async (email: string) => {
    await api.loginSimulation(email);
    setUserRole('employee');
    setScreen('main');
    setCurrentTab('home');
  };

  const handleHRLoginSuccess = () => {
    setUserRole('hrd');
    setScreen('hr_dashboard');
  };

  const handleLogout = () => {
    api.logout();
    setUserRole(null);
    setScreen('login');
  };

  // Seed helpers from login
  const handleLoadSample = () => {
    api.seedSample30Days();
    handleLoginSuccess('sample.worker@perusahaan.co.id');
  };

  const handleLoadEmpty = () => {
    api.seedEmptyUser();
    handleLoginSuccess('new.worker@perusahaan.co.id');
  };

  // Bottom Nav Visibility Check:
  // ONLY visible on employee main screen (tabs: home, write, trend)
  const isBottomNavVisible = screen === 'main' && userRole === 'employee';

  return (
    <div className="aura-root-container">
      {/* Screen 1: Landing Page */}
      {screen === 'landing' && (
        <Landing
          onStart={() => setScreen('login')}
          onLoginHR={() => setScreen('hr_login')}
        />
      )}

      {/* Screen 2: Employee Login */}
      {screen === 'login' && (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onLoadSample={handleLoadSample}
          onLoadEmpty={handleLoadEmpty}
          onNavigateToHR={() => setScreen('hr_login')}
        />
      )}

      {/* Screen 3: HR Login */}
      {screen === 'hr_login' && (
        <HRLogin
          onLoginSuccess={handleHRLoginSuccess}
          onBackToEmployee={() => setScreen('login')}
        />
      )}

      {/* Screen 4: HR Dashboard (Role guarded) */}
      {screen === 'hr_dashboard' && (
        <HRDashboard
          onLogout={handleLogout}
          onOpenThemePicker={() => setThemePickerOpen(true)}
        />
      )}

      {/* Screen 5: Employee Main Tabs (Home, Write, Trend) */}
      {screen === 'main' && (
        <>
          {currentTab === 'home' && (
            <Home
              onWriteClick={() => setCurrentTab('write')}
              onCheckinClick={() => setQuickCheckinOpen(true)}
              onOpenHistory={() => setScreen('history')}
              onOpenSettings={() => setScreen('settings')}
              onOpenCareMode={() => setScreen('care_mode')}
              onOpenBreakPlanner={() => setScreen('break_planner')}
              onLogout={handleLogout}
              onOpenThemePicker={() => setThemePickerOpen(true)}
            />
          )}

          {currentTab === 'write' && (
            <WriteJournal
              onSubmitSuccess={(entry) => {
                setActiveEntry(entry);
                if (entry.crisis_flag) {
                  setScreen('care_mode');
                } else {
                  setScreen('result');
                }
              }}
              onOpenQuickCheckin={() => setQuickCheckinOpen(true)}
            />
          )}

          {currentTab === 'trend' && (
            <Trend
              onOpenCounselorReport={() => {
                setPrintableMode('konselor');
                setScreen('printable');
              }}
            />
          )}
        </>
      )}

      {/* Screen 6: Result (Momen Wow) */}
      {screen === 'result' && activeEntry && (
        <Result
          entry={activeEntry}
          onFinish={() => {
            setScreen('main');
            setCurrentTab('home');
          }}
          onViewTrend={() => {
            setScreen('main');
            setCurrentTab('trend');
          }}
          onStartExercise={(exercise) => {
            setActiveExercise(exercise);
            setScreen('exercise');
          }}
          onOpenTaskBreaker={() => setScreen('task_breaker')}
          onOpenCounselorSummary={() => {
            setPrintableMode('konselor');
            setScreen('printable');
          }}
          onOpenCareMode={() => setScreen('care_mode')}
        />
      )}

      {/* Screen 7: Exercise Player (F1) */}
      {screen === 'exercise' && activeExercise && (
        <ExercisePlayer
          exercise={activeExercise}
          onFinish={() => {
            setScreen('main');
            setCurrentTab('home');
          }}
          onExit={() => {
            setScreen('main');
            setCurrentTab('home');
          }}
        />
      )}

      {/* Screen 8: Care Mode (Safety Priority) */}
      {screen === 'care_mode' && (
        <CareMode
          onBack={() => {
            setScreen('main');
            setCurrentTab('home');
          }}
          onOpenSettings={() => setScreen('settings')}
        />
      )}

      {/* Screen 9: History */}
      {screen === 'history' && (
        <History onBack={() => setScreen('main')} />
      )}

      {/* Screen 10: Settings */}
      {screen === 'settings' && (
        <Settings
          onBack={() => setScreen('main')}
          onOpenBreakPlanner={() => setScreen('break_planner')}
          onOpenExportData={() => {
            setPrintableMode('data_saya');
            setScreen('printable');
          }}
          onLogout={handleLogout}
        />
      )}

      {/* Screen 11: Break Planner (F6) */}
      {screen === 'break_planner' && (
        <BreakPlanner onBack={() => setScreen('main')} />
      )}

      {/* Screen 12: Task Breaker (F7) */}
      {screen === 'task_breaker' && (
        <TaskBreaker onBack={() => setScreen('main')} />
      )}

      {/* Screen 13: Printable Document (F8 & F9) */}
      {screen === 'printable' && (
        <PrintableDocument
          mode={printableMode}
          onBack={() => setScreen('main')}
        />
      )}

      {/* Bottom Navigation: exactly 3 tabs for employees */}
      {isBottomNavVisible && (
        <BottomNavigation
          currentTab={currentTab}
          onTabChange={(tab) => setCurrentTab(tab)}
        />
      )}

      {/* Quick Check-in Bottom Sheet (F3) */}
      <QuickCheckinSheet
        isOpen={quickCheckinOpen}
        onClose={() => setQuickCheckinOpen(false)}
        onSubmit={handleQuickCheckinSubmit}
        loading={quickCheckinLoading}
      />

      {/* Instant Theme Picker Sheet */}
      <ThemePickerModal
        isOpen={themePickerOpen}
        onClose={() => setThemePickerOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
