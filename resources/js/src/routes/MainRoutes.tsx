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
const AuthSettingsPage = Loadable(lazy(() => import('views/users/AuthSettings')));
const CountriesPage = Loadable(lazy(() => import('views/masters/Countries')));
const StatesPage = Loadable(lazy(() => import('views/masters/States')));
const DistrictsPage = Loadable(lazy(() => import('views/masters/Districts')));
const OfficesPage = Loadable(lazy(() => import('views/masters/Offices')));
const NPCitiesPage = Loadable(lazy(() => import('views/masters/NPCities')));
const NPWardsPage = Loadable(lazy(() => import('views/masters/NPWards')));
const NPPollingStationsPage = Loadable(lazy(() => import('views/masters/NPPollingStations')));
const RPCitiesPage = Loadable(lazy(() => import('views/masters/RPCities')));
const RPWardsPage = Loadable(lazy(() => import('views/masters/RPWards')));
const RPPollingStationsPage = Loadable(lazy(() => import('views/masters/RPPollingStations')));
const EmpTypesPage = Loadable(lazy(() => import('views/masters/EmpTypes')));
const DesignationsPage = Loadable(lazy(() => import('views/masters/Designations')));
const DepartmentsPage = Loadable(lazy(() => import('views/masters/Departments')));
const PayLevelsPage = Loadable(lazy(() => import('views/masters/PayLevels')));
const EmployeesPage = Loadable(lazy(() => import('views/masters/Employees')));
const DistrictConfigsPage = Loadable(lazy(() => import('views/masters/DistrictConfigs')));
const UserProfilePage = Loadable(lazy(() => import('views/auth/UserProfile')));
const SamplePage = Loadable(lazy(() => import('views/pages/SamplePage')));

// new modules
const ElectionDashboardPage = Loadable(lazy(() => import('views/election/ElectionDashboard')));
const ElectionTeamAssignmentsPage = Loadable(lazy(() => import('views/election/ElectionTeamAssignments')));
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
      path: 'election/nagar-panchayat/team-assignments',
      element: <ElectionTeamAssignmentsPage type="Nagar Panchayat" />
    },
    {
      path: 'election/nagari-nikay',
      element: <ElectionDashboardPage type="Nagari Nikay" />
    },
    {
      path: 'election/nagari-nikay/team-assignments',
      element: <ElectionTeamAssignmentsPage type="Nagari Nikay" />
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
      path: 'users/auth-settings',
      element: <AuthSettingsPage />
    },
    {
      path: 'masters',
      element: <Navigate to="/admin/masters/countries" replace />
    },
    {
      path: 'masters/district-config',
      element: <DistrictConfigsPage />
    },
    {
      path: 'profile',
      element: <UserProfilePage />
    },
    {
      path: 'masters/countries',
      element: <CountriesPage />
    },
    {
      path: 'masters/states',
      element: <StatesPage />
    },
    {
      path: 'masters/districts',
      element: <DistrictsPage />
    },
    {
      path: 'masters/offices',
      element: <OfficesPage />
    },
    {
      path: 'masters/np-cities',
      element: <NPCitiesPage />
    },
    {
      path: 'masters/np-wards',
      element: <NPWardsPage />
    },
    {
      path: 'masters/np-polling-stations',
      element: <NPPollingStationsPage />
    },
    {
      path: 'masters/rp-cities',
      element: <RPCitiesPage />
    },
    {
      path: 'masters/rp-wards',
      element: <RPWardsPage />
    },
    {
      path: 'masters/rp-polling-stations',
      element: <RPPollingStationsPage />
    },
    {
      path: 'masters/emp-types',
      element: <EmpTypesPage />
    },
    {
      path: 'masters/designations',
      element: <DesignationsPage />
    },
    {
      path: 'masters/departments',
      element: <DepartmentsPage />
    },
    {
      path: 'masters/pay-levels',
      element: <PayLevelsPage />
    },
    {
      path: 'hrms/master-employee',
      element: <EmployeesPage />
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
