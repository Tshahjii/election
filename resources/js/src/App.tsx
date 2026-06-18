import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

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
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={10}
            containerStyle={{ top: 18, right: 18 }}
          />
        </AppErrorBoundary>
      </ThemeCustomization>
    </AppPreferencesProvider>
  );
}

export default App;
