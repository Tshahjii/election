// material-ui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

// third party
import { useSelector } from 'react-redux';

// project imports
import NavigationDrawer from './Navigation';
import SimpleBar from 'components/third-party/SimpleBar';

// ==============================|| DRAWER - CONTENT ||============================== //

export default function DrawerContent() {
  const contentHeight = `calc(100vh - 126px)`;
  const user = useSelector((state) => state.auth.user);
  const officeName = user?.office_info?.office_name || 'Office not assigned';

  return (
    <>
      <Toolbar />
      <Box sx={{ px: 2.25, py: 1.75, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.86)', lineHeight: 1.35, fontWeight: 500 }}>
          {officeName}
        </Typography>
      </Box>
      <SimpleBar sx={{ height: contentHeight }}>
        <Stack sx={{ minHeight: contentHeight, p: 1.25, justifyContent: 'space-between' }}>
          <NavigationDrawer />
        </Stack>
      </SimpleBar>
    </>
  );
}
