import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import ProtectedRoute from 'components/auth/ProtectedRoute';
import MainLayout from 'layouts/MainLayout';

// pages
const DashboardDefault = Loadable(lazy(() => import('views/dashboard/default')));
const VoterListPage = Loadable(lazy(() => import('views/voters/VoterList')));
const UserAccessListPage = Loadable(lazy(() => import('views/users/UserAccessList')));
const SamplePage = Loadable(lazy(() => import('views/pages/SamplePage')));

// utils
const UtilsTypography = Loadable(lazy(() => import('views/components/Typography')));

// ==============================|| MAIN ROUTES ||============================== //

const MainRoutes = {
  path: 'admin',
  element: (
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      path: 'dashboard',
      element: <DashboardDefault />
    },
    {
      path: 'voters/list',
      element: <VoterListPage />
    },
    {
      path: 'users/access-management',
      element: <UserAccessListPage />
    },
    {
      path: 'sample-page',
      element: <SamplePage />
    },
    {
      path: 'components',
      children: [
        {
          path: 'typography',
          element: <UtilsTypography />
        }
      ]
    }
  ]
};

export default MainRoutes;
