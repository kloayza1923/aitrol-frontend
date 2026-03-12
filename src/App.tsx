import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useSettings } from '@/providers/SettingsProvider';
import { AppRouting } from '@/routing';
import { PathnameProvider } from '@/providers';
import { Toaster } from 'sileo';
import { MUIThemeProvider } from '@/providers/MUIThemeProvider';
import { ReduxProvider } from '@/providers/ReduxProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
const { BASE_URL } = import.meta.env;

const AppContent = () => {
  const { settings } = useSettings();

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(settings.themeMode);
  }, [settings]);

  return (
    <MUIThemeProvider>
      <PathnameProvider>
        <AppRouting />
      </PathnameProvider>
      <Toaster position="top-center" />
    </MUIThemeProvider>
  );
};

const App = () => {
  return (
    <BrowserRouter
      basename={BASE_URL}
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true
      }}
    >
      <ErrorBoundary>
        <ReduxProvider>
          <AppContent />
        </ReduxProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export { App };
