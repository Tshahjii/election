// material-ui
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// third party
import { useSelector } from 'react-redux';

// project imports
import AppControls from 'components/AppControls';
import Notification from './Notification';
import Profile from './Profile';
import Search from './Search';

import { DRAWER_WIDTH } from 'config';
import { handlerDrawerOpen, useGetMenuMaster } from 'states/menu';

import MenuTwoToneIcon from '@mui/icons-material/MenuTwoTone';

// AppBar props, including styles that vary based on drawer state and screen size
const appBar = {
  position: 'fixed',
  sx: (theme) => ({
    width: 1,
    zIndex: { xs: 1100, lg: 1201 },
    color: 'common.white',
    bgcolor: theme.palette.primary.dark,
    backgroundImage: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.14)',
    boxShadow: '0 2px 10px rgba(15, 45, 75, 0.18)'
  })
};

// ==============================|| MAIN LAYOUT - HEADER ||============================== //

export default function Header() {
  const { menuMaster } = useGetMenuMaster();
  const user = useSelector((state) => state.auth.user);
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const stateName = user?.state_info?.name || user?.office_info?.state || user?.state || 'State';
  const districtName = user?.state_info?.name || user?.office_info?.state || user?.state || 'State';
  const companyName = user?.office_info?.company_name || user?.department || 'Election Department';
  const stateLogo = user?.state_info?.logo_url;
console.log('User Info:', user);
  // Common header content
  const mainHeader = (
    <Toolbar>
      <Stack direction="row" sx={{ gap: 1.25, width: { xs: 1, md: DRAWER_WIDTH }, alignItems: 'center' }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25, minWidth: 0, flex: 1, display: { xs: 'none', md: 'flex' } }}>
          <Avatar
            src={stateLogo || undefined}
            alt={stateName}
            variant="rounded"
            sx={{
              width: 42,
              height: 42,
              bgcolor: 'common.white',
              color: 'primary.dark',
              fontWeight: 700,
              p: stateLogo ? 0.45 : 0,
              '& img': { objectFit: 'contain' }
            }}
          >
            {stateName.charAt(0)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography noWrap sx={{ color: 'common.white', fontSize: 24, fontWeight: 700, lineHeight: 1.12 }}>
              {stateName} Shasan
            </Typography>
            <Typography variant="caption" noWrap sx={{ display: 'block', color: 'rgba(255,255,255,0.78)' }}>
              {companyName}, {stateName}
            </Typography>
          </Box>
        </Stack>
        <IconButton
          edge="start"
          sx={{ ml: 'auto', mr: { xs: 0, sm: 1.25 }, color: 'background.paper' }}
          aria-label="open drawer"
          onClick={() => handlerDrawerOpen(!drawerOpen)}
          size="large"
        >
          <MenuTwoToneIcon sx={{ fontSize: '1.5rem' }} />
        </IconButton>
      </Stack>
      <Box sx={{ flexGrow: 1 }} />
      <Stack direction="row" sx={{ alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
        <AppControls showTheme inverse />
        <Search />
        <Notification />
        <Profile />
      </Stack>
    </Toolbar>
  );

  return <AppBar {...appBar}>{mainHeader}</AppBar>;
}
