import { useState } from 'react';

// material-ui
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

// third party
import { useSelector } from 'react-redux';

// project imports
import AppControls from 'components/AppControls';
import HeaderCalendar from 'components/calendar/HeaderCalendar';
import Notification from './Notification';
import Profile from './Profile';
import Search from './Search';

import { handlerDrawerOpen, useGetMenuMaster } from 'states/menu';

import MenuTwoToneIcon from '@mui/icons-material/MenuTwoTone';
import MoreVertOutlined from '@mui/icons-material/MoreVertOutlined';

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
  const downLG = useMediaQuery(theme.breakpoints.down('lg'));
  const [actionsAnchor, setActionsAnchor] = useState(null);
  const { menuMaster } = useGetMenuMaster();
  const user = useSelector((state) => state.auth.user);
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const stateName = user?.state_info?.name || user?.office_info?.state || 'State';
  const companyName = user?.office_info?.company_name || user?.department || 'Election Department';
  const stateLogo = user?.state_info?.logo_url;
  const actionsOpen = Boolean(actionsAnchor);

  const handleActionsClick = (event) => {
    setActionsAnchor((current) => (current ? null : event.currentTarget));
  };

  // Common header content
  const mainHeader = (
    <Toolbar
      sx={{
        minHeight: { xs: 64, sm: 68, lg: 72 },
        gap: { xs: 0.75, sm: 1.5 },
        px: { xs: 1.25, sm: 2 },
        py: { xs: 0.75, sm: 0.75 },
        alignItems: 'center',
        overflow: 'hidden'
      }}
    >
      <Stack direction="row" sx={{ gap: { xs: 0.75, sm: 1 }, alignItems: 'center', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: { xs: 0.75, sm: 1.25 }, minWidth: 0, flex: 1 }}>
          <Avatar
            src={stateLogo || undefined}
            alt={stateName}
            variant="rounded"
            sx={{
              width: { xs: 34, sm: 40, lg: 42 },
              height: { xs: 34, sm: 40, lg: 42 },
              bgcolor: 'common.white',
              color: 'primary.dark',
              fontWeight: 700,
              fontSize: { xs: 17, sm: 20 },
              p: stateLogo ? 0.45 : 0,
              '& img': { objectFit: 'contain' }
            }}
          >
            {stateName.charAt(0)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <Typography
              sx={{
                color: 'common.white',
                fontSize: { xs: 14, sm: 18, md: 20, lg: 24 },
                fontWeight: 700,
                lineHeight: 1.12,
                wordBreak: 'keep-all',
                overflowWrap: 'normal',
                whiteSpace: 'normal'
              }}
            >
              {stateName} Shasan
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: { xs: 'none', sm: 'block' },
                color: 'rgba(255,255,255,0.78)',
                wordBreak: 'keep-all',
                overflowWrap: 'normal',
                lineHeight: 1.25,
                whiteSpace: 'normal'
              }}
            >
              {companyName}, {stateName}
            </Typography>
          </Box>
        </Stack>
        <IconButton
          edge="end"
          sx={{
            flexShrink: 0,
            color: 'common.white',
            ml: { xs: 0.25, sm: 1 },
            width: { xs: 34, sm: 40 },
            height: { xs: 34, sm: 40 }
          }}
          aria-label="open drawer"
          onClick={() => handlerDrawerOpen(!drawerOpen)}
          size="large"
        >
          <MenuTwoToneIcon sx={{ fontSize: '1.5rem' }} />
        </IconButton>
        <IconButton
          edge="end"
          sx={{
            display: { xs: 'inline-flex', lg: 'none' },
            flexShrink: 0,
            color: 'common.white',
            width: { xs: 34, sm: 40 },
            height: { xs: 34, sm: 40 }
          }}
          aria-label="open header actions"
          onClick={handleActionsClick}
          size="large"
        >
          <MoreVertOutlined sx={{ fontSize: '1.45rem' }} />
        </IconButton>
      </Stack>
      <Box sx={{ flexGrow: { xs: 0, lg: 1 }, minWidth: { xs: 0, lg: 12 } }} />
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          gap: { xs: 0.5, sm: 1 },
          display: { xs: 'none', lg: 'flex' },
          flexShrink: 1,
          minWidth: 0
        }}
      >
        <AppControls showTheme inverse />
        {!downLG && <Search />}
        {!downLG && <HeaderCalendar inverse />}
        {!downLG && <Notification inverse />}
        {!downLG && <Profile inverse />}
      </Stack>
      <Popper open={actionsOpen} anchorEl={actionsAnchor} placement="bottom-end" sx={{ zIndex: 1400 }}>
        <ClickAwayListener onClickAway={() => setActionsAnchor(null)}>
          <Paper
            elevation={8}
            sx={{
              mt: 1,
              mr: 1,
              width: { xs: 'calc(100vw - 24px)', sm: 380 },
              maxWidth: 420,
              p: 1.5,
              borderRadius: 1.5
            }}
          >
            <Stack sx={{ gap: 1.5 }}>
              <AppControls showTheme inverse={false} />
              <Search forceField inverse={false} />
              <Divider />
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Alerts and account
                </Typography>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                  <Notification inverse={false} />
                  <HeaderCalendar inverse={false} />
                  <Profile inverse={false} />
                </Stack>
              </Stack>
            </Stack>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Toolbar>
  );

  return <AppBar {...appBar}>{mainHeader}</AppBar>;
}
