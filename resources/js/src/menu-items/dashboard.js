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
      breadcrumbs: false
    },
    {
      id: 'voter-management',
      title: 'Voter Management',
      titleKey: 'menu.voterManagement',
      type: 'collapse',
      icon: PeopleAltOutlinedIcon,
      children: [
        { id: 'voter-list', title: 'Voter List', titleKey: 'menu.voterList', type: 'item', icon: GroupsOutlinedIcon, url: '/admin/voters/list' },
        { id: 'voter-verification', title: 'Verification Queue', titleKey: 'menu.verificationQueue', type: 'item', icon: VerifiedUserOutlinedIcon },
        { id: 'voter-claims', title: 'Claims & Objections', titleKey: 'menu.claimsObjections', type: 'item', icon: FactCheckOutlinedIcon }
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
          url: '/admin/users/access-management'
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
        { id: 'booth-map', title: 'Booth Mapping', titleKey: 'menu.boothMapping', type: 'item', icon: MapOutlinedIcon },
        { id: 'polling-stations', title: 'Polling Stations', titleKey: 'menu.pollingStations', type: 'item', icon: LocationOnOutlinedIcon },
        { id: 'turnout-monitor', title: 'Turnout Monitor', titleKey: 'menu.turnoutMonitor', type: 'item', icon: PollOutlinedIcon }
      ]
    },
    {
      id: 'reports-security',
      title: 'Reports & Security',
      titleKey: 'menu.reportsSecurity',
      type: 'collapse',
      icon: SecurityOutlinedIcon,
      children: [
        { id: 'election-reports', title: 'Election Reports', titleKey: 'menu.electionReports', type: 'item', icon: AssessmentOutlinedIcon },
        { id: 'audit-log', title: 'Audit Log', titleKey: 'menu.auditLog', type: 'item', icon: SecurityOutlinedIcon }
      ]
    }
  ]
};

export default dashboard;
