import { createBrowserRouter } from 'react-router-dom';

// routes
import MainRoutes from './MainRoutes';
import PagesRoutes from './PagesRoutes';

// ==============================|| ROUTING RENDER ||============================== //

const router = createBrowserRouter([MainRoutes, PagesRoutes], {
  basename: import.meta.env.VITE_APP_BASE_URL
});

if (typeof window !== 'undefined') {
  window.addEventListener('app:server-error', () => {
    router.navigate('/error');
  });
}

export default router;
