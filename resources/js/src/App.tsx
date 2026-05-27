import { RouterProvider } from 'react-router-dom';

// project imports
import { AppPreferencesProvider } from 'contexts/AppPreferences';
import AppErrorBoundary from 'components/AppErrorBoundary';
import GlobalSnackbar from './components/GlobalSnackbar';
import ThemeCustomization from './themes';

import router from 'routes';

function App() {
  return (
    <AppPreferencesProvider>
      <ThemeCustomization>
        <AppErrorBoundary>
          <RouterProvider router={router} />
          <GlobalSnackbar />
        </AppErrorBoundary>
      </ThemeCustomization>
    </AppPreferencesProvider>
  );
}

export default App;
