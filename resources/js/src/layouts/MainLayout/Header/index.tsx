// material-ui
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

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
  position: 'fixed' as const,
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
  const theme = useTheme();
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));
  const { menuMaster } = useGetMenuMaster();
  const user = useSelector((state) => state.auth.user);
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const stateName = user?.state_info?.name || user?.office_info?.state || 'State';
  const companyName = user?.office_info?.company_name || user?.department || 'Election Department';
  const stateLogo = user?.state_info?.logo_url;
  // Common header content
  const mainHeader = (
    <Toolbar sx={{ minHeight: { xs: 72, sm: 64 }, gap: { xs: 1, sm: 1.5 }, px: { xs: 1.5, sm: 2 } }}>
      <Stack direction="row" sx={{ gap: 1.25, width: { xs: 1, md: DRAWER_WIDTH }, alignItems: 'center', minWidth: 0 }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25, minWidth: 0, flex: 1 }}>
          <Avatar
            src={stateLogo || undefined}
            alt={stateName}
            variant="rounded"
            sx={{
              width: { xs: 38, sm: 42 },
              height: { xs: 38, sm: 42 },
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
            <Typography
              sx={{
                color: 'common.white',
                fontSize: { xs: 18, sm: 22, md: 24 },
                fontWeight: 700,
                lineHeight: 1.12,
                overflowWrap: 'anywhere',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: { xs: 2, sm: 1 }
              }}
            >
              {stateName} Shasan
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.78)',
                overflowWrap: 'anywhere',
                lineHeight: 1.25,
                WebkitLineClamp: 1,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical'
              }}
            >
              {companyName}, {stateName}
            </Typography>
          </Box>
        </Stack>
        <IconButton
          edge="start"
          sx={{ flexShrink: 0, ml: { xs: 0.5, sm: 'auto' }, mr: { xs: 0, sm: 1.25 }, color: 'background.paper' }}
          aria-label="open drawer"
          onClick={() => handlerDrawerOpen(!drawerOpen)}
          size="large"
        >
          <MenuTwoToneIcon sx={{ fontSize: '1.5rem' }} />
        </IconButton>
      </Stack>
      <Box sx={{ flexGrow: { xs: 0, sm: 1 } }} />
      <Stack direction="row" sx={{ alignItems: 'center', gap: { xs: 0.5, sm: 1 }, display: { xs: 'none', sm: 'flex' } }}>
        <AppControls showTheme inverse />
        {!downSM && <Search />}
        {!downSM && <Notification />}
        {!downSM && <Profile />}
      </Stack>
    </Toolbar>
  );

  return <AppBar {...appBar}>{mainHeader}</AppBar>;
}
