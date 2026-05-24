import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

// project imports
import Loadable from 'components/Loadable';
import ProtectedRoute from 'components/auth/ProtectedRoute';
import MainLayout from 'layouts/MainLayout';
import RouteError from 'components/RouteError';

// pages
const DashboardDefault = Loadable(lazy(() => import('views/dashboard/default')));
const VoterListPage = Loadable(lazy(() => import('views/voters/VoterList')));
const UserAccessListPage = Loadable(lazy(() => import('views/users/UserAccessList')));
const MasterDataPage = Loadable(lazy(() => import('views/masters/MasterData')));
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
  errorElement: <RouteError />,
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
      path: 'masters',
      element: <Navigate to="/admin/masters/countries" replace />
    },
    {
      path: 'masters/countries',
      element: <MasterDataPage masterKey="countries" />
    },
    {
      path: 'masters/states',
      element: <MasterDataPage masterKey="states" />
    },
    {
      path: 'masters/districts',
      element: <MasterDataPage masterKey="districts" />
    },
    {
      path: 'masters/offices',
      element: <MasterDataPage masterKey="offices" />
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
