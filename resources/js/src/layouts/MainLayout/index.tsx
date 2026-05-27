import { useEffect, useMemo } from 'react';
import { Outlet } from 'react-router-dom';

// material-ui
import useMediaQuery from '@mui/material/useMediaQuery';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';

// project imports
import Drawer from './Drawer';
import Header from './Header';
import Breadcrumbs from 'components/Breadcrumbs';
import ChangeDefaultPasswordDialog from 'components/auth/ChangeDefaultPasswordDialog';
import { useAppPreferences } from 'contexts/AppPreferences';

import { DRAWER_WIDTH } from 'config';
import { handlerDrawerOpen, useGetMenuMaster } from 'states/menu';

// ==============================|| MAIN LAYOUT ||============================== //

export default function MainLayout() {
  const upLG = useMediaQuery((theme) => theme.breakpoints.up('lg'));

  const { menuMaster } = useGetMenuMaster();
  const { layoutDensity } = useAppPreferences();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const compact = layoutDensity === 'compact';

  useEffect(() => {
    handlerDrawerOpen(upLG);
  }, [upLG]);

  // drawer toggle handler on resize window
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const drawer = useMemo(() => <Drawer />, [drawerOpen]);

  return (
    <Stack direction="row" sx={{ width: 1 }}>
      <Header />
      {drawer}
      <Box
        component="main"
        sx={{
          minWidth: 0,
          width: { xs: 1, lg: drawerOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : 1 },
          p: compact ? { xs: 1, sm: 1.5, md: 2 } : { xs: 1, sm: 2, md: 3 },
          ml: { xs: 0, lg: 'auto' },
          minHeight: '100vh',
          bgcolor: 'background.default',
          overflowX: 'hidden'
        }}
      >
        <Toolbar />
        <Breadcrumbs />
        <Outlet />
        <ChangeDefaultPasswordDialog />
      </Box>
    </Stack>
  );
}
