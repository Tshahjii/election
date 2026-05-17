// material-ui
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useSelector } from 'react-redux';

// project imports
import menuItems from 'menu-items';
import NavGroup from './NavGroup';
import { filterMenuByAccess } from 'utils/access';

// ==============================|| DRAWER CONTENT - RESPONSIVE DRAWER ||============================== //

export default function NavigationDrawer() {
  const { user } = useSelector((state) => state.auth);
  const accessibleItems = filterMenuByAccess(menuItems.items, user);
  const navGroups = accessibleItems.map((item, index) => {
    switch (item.type) {
      case 'group':
        return <NavGroup key={index} item={item} />;
      default:
        return (
          <Typography key={index} variant="h6" color="error" align="center">
            Fix - Navigation Group
          </Typography>
        );
    }
  });

  return <Box sx={{ transition: 'all 0.3s ease-in-out' }}>{navGroups}</Box>;
}
