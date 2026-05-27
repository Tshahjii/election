import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

// project imports
import { useAppPreferences } from 'contexts/AppPreferences';
import { handlerActiveItem, handlerDrawerOpen, useGetMenuMaster } from 'states/menu';

// assets
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// ==============================|| RESPONSIVE DRAWER - ITEM ||============================== //

export default function NavItem({ item, level = 0 }) {
  const theme = useTheme();
  const { t } = useAppPreferences();
  const { menuMaster } = useGetMenuMaster();
  const openItem = menuMaster.openedItem;

  const downLG = useMediaQuery(theme.breakpoints.down('lg'));

  const location = useLocation();

  useEffect(() => {
    if (location.pathname === item.url) handlerActiveItem(item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const itemHandler = () => {
    if (downLG) handlerDrawerOpen(false);
  };

  const Icon = item.icon;
  const itemIcon = item.icon ? <Icon color="inherit" /> : <ArrowForwardIcon color="inherit" fontSize={level > 0 ? 'inherit' : 'medium'} />;

  return (
    <ListItemButton
      id={`${item.id}-btn`}
      {...(item.url && { component: Link, to: item.url })}
      {...(item.target && { target: item.target })}
      selected={openItem === item.id}
      disabled={item.disabled}
      onClick={itemHandler}
      sx={{
        color: 'rgba(255,255,255,0.82)',
        mb: 0.625,
        borderRadius: 1,
        pl: `${level * 16}px`,
        '&:hover': { bgcolor: 'rgba(255,255,255,0.09)', color: 'common.white' },
        '&.Mui-selected': {
          color: 'common.white',
          bgcolor: 'rgba(255,255,255,0.16)',
          '& .MuiListItemIcon-root': { color: 'common.white' },
          '& .MuiSvgIcon-root': { color: 'common.white' },
          '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
        },
        ...(level === 0 && { '&.Mui-selected': { color: 'common.white' } }),
        ...(level > 1 && { bgcolor: 'transparent !important', py: 1 })
      }}
    >
      <ListItemIcon sx={{ minWidth: 34, flexShrink: 0, color: 'inherit', '& svg': { color: 'inherit', fontSize: level > 0 ? '1.25rem' : '1.35rem' } }}>{itemIcon}</ListItemIcon>
      <ListItemText
        primary={
          <Typography sx={{ pl: level > 1 ? 2 : 1.4 }} variant={openItem === item.id ? 'subtitle1' : 'body1'} color="inherit">
            {item.titleKey ? t(item.titleKey) : item.title}
          </Typography>
        }
        secondary={
          item.caption && (
            <Typography variant="caption" sx={{ ...theme.typography.subMenuCaption, pl: 2 }} display="block" gutterBottom>
              {item.captionKey ? t(item.captionKey) : item.caption}
            </Typography>
          )
        }
      />
      {item.chip && (
        <Chip
          color={item.chip.color}
          variant={item.chip.variant}
          size={item.chip.size}
          label={item.chip.label}
          avatar={typeof item.chip.avatar === 'string' ? <Avatar>{item.chip.avatar}</Avatar> : item.chip.avatar}
        />
      )}
    </ListItemButton>
  );
}

NavItem.propTypes = { item: PropTypes.any, level: PropTypes.number };
