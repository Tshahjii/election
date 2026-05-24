import { RouterProvider } from 'react-router-dom';

// project imports
import { AppPreferencesProvider } from 'contexts/AppPreferences';
import GlobalSnackbar from './components/GlobalSnackbar';
import ThemeCustomization from './themes';

import router from 'routes';

function App() {
  return (
    <AppPreferencesProvider>
      <ThemeCustomization>
        <RouterProvider router={router} />
        <GlobalSnackbar />
      </ThemeCustomization>
    </AppPreferencesProvider>
  );
}

export default App;
