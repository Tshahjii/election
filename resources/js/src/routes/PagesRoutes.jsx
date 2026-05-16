import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import MinimalLayout from 'layouts/minimalLayout';

// pages
const LoginPage = Loadable(lazy(() => import('views/auth/Login')));

// ==============================|| PAGES ROUTES ||============================== //

const PagesRoutes = {
  path: '/',
  element: <MinimalLayout />,
  children: [
    {
      children: [
        {
          path: '/',
          element: <LoginPage />
        },
        {
          path: 'login',
          element: <LoginPage />
        }
      ]
    }
  ]
};

export default PagesRoutes;
