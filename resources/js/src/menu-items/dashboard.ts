// assets
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import BallotOutlinedIcon from '@mui/icons-material/BallotOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PollOutlinedIcon from '@mui/icons-material/PollOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import FormatListNumberedOutlinedIcon from '@mui/icons-material/FormatListNumberedOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import CorporateFareOutlinedIcon from '@mui/icons-material/CorporateFareOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';

// ==============================|| MENU ITEMS - ELECTION DASHBOARD ||============================== //

const dashboard = {
  id: 'election',
  title: 'Election Portal',
  titleKey: 'app.name',
  caption: 'Government Operations',
  captionKey: 'app.caption',
  icon: HowToVoteOutlinedIcon,
  type: 'group',
  children: [
    {
      id: 'dashboard-overview',
      title: 'Dashboard Overview',
      titleKey: 'menu.dashboardOverview',
      type: 'item',
      icon: SpaceDashboardOutlinedIcon,
      url: '/admin/dashboard',
      permission: 'dashboard.overview.read',
      breadcrumbs: false
    },
    {
      id: 'nagar-panchayat',
      title: 'Nagar Panchayat',
      titleKey: 'menu.nagarPanchayat',
      type: 'collapse',
      icon: LocationOnOutlinedIcon,
      children: [
        { id: 'np-dashboard', title: 'Dashboard', titleKey: 'menu.dashboard', type: 'item', icon: SpaceDashboardOutlinedIcon, url: '/admin/election/nagar-panchayat', permission: 'election.nagar_panchayat.read' },
        { id: 'np-ward', title: 'Ward Master', titleKey: 'menu.masterWard', type: 'item', icon: FormatListNumberedOutlinedIcon, url: '/admin/masters/np-wards', permission: 'masters.wards.read' },
        { id: 'np-city', title: 'City Master', titleKey: 'menu.masterCity', type: 'item', icon: ApartmentOutlinedIcon, url: '/admin/masters/np-cities', permission: 'masters.cities.read' },
        { id: 'np-pollingstation', title: 'Polling Station Master', titleKey: 'menu.masterPollingStation', type: 'item', icon: BallotOutlinedIcon, url: '/admin/masters/np-polling-stations', permission: 'masters.polling_stations.read' }
      ]
    },
    {
      id: 'nagari-nikay',
      title: 'Nagri Nikay',
      titleKey: 'menu.nagariNikay',
      type: 'collapse',
      icon: ApartmentOutlinedIcon,
      children: [
        { id: 'rp-dashboard', title: 'Dashboard', titleKey: 'menu.dashboard', type: 'item', icon: SpaceDashboardOutlinedIcon, url: '/admin/election/nagari-nikay', permission: 'election.nagari_nikay.read' },
        { id: 'rp-ward', title: 'Ward Master', titleKey: 'menu.masterWard', type: 'item', icon: FormatListNumberedOutlinedIcon, url: '/admin/masters/rp-wards', permission: 'masters.wards.read' },
        { id: 'rp-city', title: 'City Master', titleKey: 'menu.masterCity', type: 'item', icon: ApartmentOutlinedIcon, url: '/admin/masters/rp-cities', permission: 'masters.cities.read' },
        { id: 'rp-pollingstation', title: 'Polling Station Master', titleKey: 'menu.masterPollingStation', type: 'item', icon: BallotOutlinedIcon, url: '/admin/masters/rp-polling-stations', permission: 'masters.polling_stations.read' }
      ]
    },
    {
      id: 'hrms',
      title: 'HRMS',
      titleKey: 'menu.hrms',
      type: 'collapse',
      icon: BusinessCenterOutlinedIcon,
      children: [
        {
          id: 'master-employee',
          title: 'Master Employee',
          titleKey: 'menu.masterEmployee',
          type: 'item',
          icon: BadgeOutlinedIcon,
          url: '/admin/hrms/master-employee',
          permission: 'hrms.employees.read'
        }
      ]
    },
    {
      id: 'masters',
      title: 'Master',
      titleKey: 'menu.master',
      type: 'collapse',
      icon: StorageOutlinedIcon,
      children: [
        { id: 'master-country', title: 'Country Master', titleKey: 'menu.masterCountry', type: 'item', icon: PublicOutlinedIcon, url: '/admin/masters/countries', permission: 'masters.countries.read' },
        { id: 'master-department', title: 'Department', titleKey: 'menu.department', type: 'item', icon: CorporateFareOutlinedIcon, url: '/admin/masters/departments', permission: 'hrms.departments.read' },
        { id: 'master-designation', title: 'Designation', titleKey: 'menu.designation', type: 'item', icon: PersonOutlineOutlinedIcon, url: '/admin/masters/designations', permission: 'hrms.designations.read' },
        { id: 'master-district', title: 'District Master', titleKey: 'menu.masterDistrict', type: 'item', icon: LocationOnOutlinedIcon, url: '/admin/masters/districts', permission: 'masters.districts.read' },
        { id: 'master-employee-type', title: 'Employee Type', titleKey: 'menu.employeeType', type: 'item', icon: BadgeOutlinedIcon, url: '/admin/masters/emp-types', permission: 'hrms.emp_types.read' },
        { id: 'master-office', title: 'Office Master', titleKey: 'menu.masterOffice', type: 'item', icon: AccountBalanceOutlinedIcon, url: '/admin/masters/offices', permission: 'masters.offices.read' },
        { id: 'master-pay-level', title: 'Pay Scale / Pay Level', titleKey: 'menu.payLevel', type: 'item', icon: PaymentsOutlinedIcon, url: '/admin/masters/pay-levels', permission: 'hrms.pay_levels.read' },
        { id: 'master-state', title: 'State Master', titleKey: 'menu.masterState', type: 'item', icon: MapOutlinedIcon, url: '/admin/masters/states', permission: 'masters.states.read' }
      ]
    },
    {
      id: 'reports',
      title: 'Reports',
      titleKey: 'menu.reports',
      type: 'collapse',
      icon: AssessmentOutlinedIcon,
      children: [
        { id: 'allocation-report', title: 'Allocation Report', titleKey: 'menu.allocationReport', type: 'item', icon: AssessmentOutlinedIcon, url: '/admin/reports/allocation', permission: 'reports.allocation.read' },
        { id: 'duty-analytics', title: 'Duty Analytics', titleKey: 'menu.dutyAnalytics', type: 'item', icon: PollOutlinedIcon, url: '/admin/reports/analytics', permission: 'reports.analytics.read' }
      ]
    },
    {
      id: 'users',
      title: 'Users',
      titleKey: 'menu.users',
      type: 'collapse',
      icon: ManageAccountsOutlinedIcon,
      children: [
        {
          id: 'access-management',
          title: 'Access Management',
          titleKey: 'menu.accessManagement',
          type: 'item',
          icon: SecurityOutlinedIcon,
          url: '/admin/users/access-management',
          permission: 'users.access.read'
        }
      ]
    }
  ]
};

export default dashboard;
