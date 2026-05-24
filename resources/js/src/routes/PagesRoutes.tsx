import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import MinimalLayout from 'layouts/minimalLayout';
import RouteError from 'components/RouteError';

// pages
const LoginPage = Loadable(lazy(() => import('views/auth/Login')));

// ==============================|| PAGES ROUTES ||============================== //

const PagesRoutes = {
  path: '/',
  element: <MinimalLayout />,
  errorElement: <RouteError />,
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
