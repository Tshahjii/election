import { RouterProvider } from 'react-router-dom';

// project imports
import { AppPreferencesProvider } from 'contexts/AppPreferences';
import AppErrorBoundary from 'components/AppErrorBoundary';
import CalendarReminderProvider from 'components/calendar/CalendarReminderProvider';
import GlobalSnackbar from './components/GlobalSnackbar';
import ThemeCustomization from './themes';

import router from 'routes';

function App() {
  return (
    <AppPreferencesProvider>
      <ThemeCustomization>
        <AppErrorBoundary>
          <RouterProvider router={router} />
          <CalendarReminderProvider />
          <GlobalSnackbar />
        </AppErrorBoundary>
      </ThemeCustomization>
    </AppPreferencesProvider>
  );
}

export default App;
