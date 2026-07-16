import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

// material-ui
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Popper from '@mui/material/Popper';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third party
import { useLocation, useNavigate } from 'react-router-dom';

// project imports
import MainCard from 'components/cards/MainCard';
import { logoutUser } from 'store/slices/authSlice';
import { ROLE_LABELS } from 'utils/access';

// assets
import AccountCircleTwoToneIcon from '@mui/icons-material/AccountCircleTwoTone';
import DraftsTwoToneIcon from '@mui/icons-material/DraftsTwoTone';
import LockOpenTwoTone from '@mui/icons-material/LockOpenTwoTone';
import MeetingRoomTwoToneIcon from '@mui/icons-material/MeetingRoomTwoTone';
import PersonTwoToneIcon from '@mui/icons-material/PersonTwoTone';
import SettingsTwoToneIcon from '@mui/icons-material/SettingsTwoTone';

const menuItems: any[] = [
  { icon: <SettingsTwoToneIcon />, label: 'Settings', path: '/admin/masters/district-config' },
  { icon: <PersonTwoToneIcon />, label: 'Profile', path: '/admin/profile' },
  { icon: <DraftsTwoToneIcon />, label: 'My Messages' },
  { icon: <LockOpenTwoTone />, label: 'Lock Screen' },
  { icon: <MeetingRoomTwoToneIcon />, label: 'Logout' }
];

// ==============================|| PROFILE ||============================== //

export default function Profile({ inverse = true }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOpen((prev) => !prev);
  };

  const handleClickAway = () => setOpen(false);

  useEffect(() => {
    const index = menuItems.findIndex((item) => item.path && location.pathname.startsWith(item.path));
    setSelectedIndex(index !== -1 ? index : null);
  }, [location.pathname]);

  const handleMenuItemClick = (index, item) => {
    setSelectedIndex(index);

    if (item.label === 'Lock Screen') {
      localStorage.setItem('is_locked', 'true');
      navigate('/lockscreen');
    } else if (item.path) {
      navigate(item.path);
    } else if (item.action) {
      item.action();
    } else if (item.label === 'Logout') {
      dispatch(logoutUser()).finally(() => navigate('/'));
    }
  };

  const canBeOpen = open && Boolean(anchorEl);
  const id = canBeOpen ? 'profile-popper' : undefined;
  const roleLabel = ROLE_LABELS[user?.role] || user?.designation || 'User';

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right', maxWidth: { sm: 150, lg: 220 } }}>
            <Typography variant="subtitle2" sx={{ color: inverse ? 'common.white' : 'text.primary', lineHeight: 1.1, overflowWrap: 'break-word' }}>
              {user?.name || 'User'}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: inverse ? 'rgba(255,255,255,0.72)' : 'text.secondary', overflowWrap: 'break-word' }}>
              {roleLabel}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClick}>
            <AccountCircleTwoToneIcon sx={{ fontSize: { xs: 22, sm: 24 }, color: inverse ? 'common.white' : 'text.primary' }} />
          </IconButton>
        </Stack>

        <Popper
          id={id}
          open={open}
          anchorEl={anchorEl}
          placement="bottom-start"
          transition
          sx={{ zIndex: 1400 }}
          modifiers={[{ name: 'offset', options: { offset: [0, 10] } }]}
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={100}>
              <MainCard content={false} sx={{ width: 250 }}>
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle1" noWrap>
                    {user?.name || 'User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                    {roleLabel}
                  </Typography>
                </Box>
                <Divider />
                <List>
                  {menuItems.map((item, index) => (
                    <ListItemButton key={item.label} selected={selectedIndex === index} onClick={() => handleMenuItemClick(index, item)}>
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  ))}
                </List>
              </MainCard>
            </Fade>
          )}
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}

Profile.propTypes = { inverse: PropTypes.bool };
