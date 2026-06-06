import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

// project imports
import Loadable from 'components/Loadable';
import ProtectedRoute from 'components/auth/ProtectedRoute';
import MainLayout from 'layouts/MainLayout';
import RouteError from 'components/RouteError';

// pages
const DashboardDefault = Loadable(lazy(() => import('views/dashboard/default')));
const UserAccessListPage = Loadable(lazy(() => import('views/users/UserAccessList')));
const MasterDataPage = Loadable(lazy(() => import('views/masters/MasterData')));
const SamplePage = Loadable(lazy(() => import('views/pages/SamplePage')));

// new modules
const ElectionDashboardPage = Loadable(lazy(() => import('views/election/ElectionDashboard')));
const AllocationReportPage = Loadable(lazy(() => import('views/reports/AllocationReport')));
const DutyAnalyticsPage = Loadable(lazy(() => import('views/reports/DutyAnalytics')));

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
      path: 'election/nagar-panchayat',
      element: <ElectionDashboardPage type="Nagar Panchayat" />
    },
    {
      path: 'election/nagari-nikay',
      element: <ElectionDashboardPage type="Nagari Nikay" />
    },
    {
      path: 'reports/allocation',
      element: <AllocationReportPage />
    },
    {
      path: 'reports/analytics',
      element: <DutyAnalyticsPage />
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
      path: 'masters/cities',
      element: <MasterDataPage masterKey="cities" />
    },
    {
      path: 'masters/wards',
      element: <MasterDataPage masterKey="wards" />
    },
    {
      path: 'masters/polling-stations',
      element: <MasterDataPage masterKey="polling-stations" />
    },
    {
      path: 'masters/emp-types',
      element: <MasterDataPage masterKey="emp-types" />
    },
    {
      path: 'masters/designations',
      element: <MasterDataPage masterKey="designations" />
    },
    {
      path: 'masters/departments',
      element: <MasterDataPage masterKey="departments" />
    },
    {
      path: 'masters/pay-levels',
      element: <MasterDataPage masterKey="pay-levels" />
    },
    {
      path: 'hrms/master-employee',
      element: <MasterDataPage masterKey="employees" />
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
