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
      id: 'voter-management',
      title: 'Voter Management',
      titleKey: 'menu.voterManagement',
      type: 'collapse',
      icon: PeopleAltOutlinedIcon,
      children: [
        { id: 'voter-list', title: 'Voter List', titleKey: 'menu.voterList', type: 'item', icon: GroupsOutlinedIcon, url: '/admin/voters/list', permission: 'voters.list.read' },
        { id: 'voter-verification', title: 'Verification Queue', titleKey: 'menu.verificationQueue', type: 'item', icon: VerifiedUserOutlinedIcon, permission: 'voters.verification.read' },
        { id: 'voter-claims', title: 'Claims & Objections', titleKey: 'menu.claimsObjections', type: 'item', icon: FactCheckOutlinedIcon, permission: 'voters.claims.read' }
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
        { id: 'master-state', title: 'State Master', titleKey: 'menu.masterState', type: 'item', icon: MapOutlinedIcon, url: '/admin/masters/states', permission: 'masters.states.read' },
        { id: 'master-district', title: 'District Master', titleKey: 'menu.masterDistrict', type: 'item', icon: LocationOnOutlinedIcon, url: '/admin/masters/districts', permission: 'masters.districts.read' },
        { id: 'master-office', title: 'Office Master', titleKey: 'menu.masterOffice', type: 'item', icon: AccountBalanceOutlinedIcon, url: '/admin/masters/offices', permission: 'masters.offices.read' },
        { id: 'master-city', title: 'City Master', titleKey: 'menu.masterCity', type: 'item', icon: ApartmentOutlinedIcon, url: '/admin/masters/cities', permission: 'masters.cities.read' },
        { id: 'master-ward', title: 'Ward Master', titleKey: 'menu.masterWard', type: 'item', icon: FormatListNumberedOutlinedIcon, url: '/admin/masters/wards', permission: 'masters.wards.read' },
        {
          id: 'master-polling-station',
          title: 'Polling Station Master',
          titleKey: 'menu.masterPollingStation',
          type: 'item',
          icon: BallotOutlinedIcon,
          url: '/admin/masters/polling-stations',
          permission: 'masters.polling_stations.read'
        }
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
    },
    {
      id: 'polling-operations',
      title: 'Polling Operations',
      titleKey: 'menu.pollingOperations',
      type: 'collapse',
      icon: BallotOutlinedIcon,
      children: [
        { id: 'booth-map', title: 'Booth Mapping', titleKey: 'menu.boothMapping', type: 'item', icon: MapOutlinedIcon, permission: 'polling.booth_map.read' },
        { id: 'polling-stations', title: 'Polling Stations', titleKey: 'menu.pollingStations', type: 'item', icon: LocationOnOutlinedIcon, permission: 'polling.stations.read' },
        { id: 'turnout-monitor', title: 'Turnout Monitor', titleKey: 'menu.turnoutMonitor', type: 'item', icon: PollOutlinedIcon, permission: 'polling.turnout.read' }
      ]
    },
    {
      id: 'reports-security',
      title: 'Reports & Security',
      titleKey: 'menu.reportsSecurity',
      type: 'collapse',
      icon: SecurityOutlinedIcon,
      children: [
        { id: 'election-reports', title: 'Election Reports', titleKey: 'menu.electionReports', type: 'item', icon: AssessmentOutlinedIcon, permission: 'reports.election.read' },
        { id: 'audit-log', title: 'Audit Log', titleKey: 'menu.auditLog', type: 'item', icon: SecurityOutlinedIcon, permission: 'reports.audit.read' }
      ]
    }
  ]
};

export default dashboard;
