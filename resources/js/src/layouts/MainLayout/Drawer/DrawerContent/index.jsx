// material-ui
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project imports
import NavigationDrawer from './Navigation';
import SimpleBar from 'components/third-party/SimpleBar';

// assets
import HowToVoteOutlined from '@mui/icons-material/HowToVoteOutlined';

// ==============================|| DRAWER - CONTENT ||============================== //

export default function DrawerContent() {
  const contentHeight = `calc(100vh - 126px)`;

  return (
    <>
      <Box sx={{ px: 2.25, py: 2.5, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.18)'
            }}
          >
            <HowToVoteOutlined />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ color: 'common.white', lineHeight: 1.15 }}>
              Election Portal
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.68)' }}>
              District Control Room
            </Typography>
          </Box>
        </Stack>
        <Chip
          label="Official Access"
          size="small"
          sx={{ mt: 2, color: '#103c5c', bgcolor: 'common.white', fontWeight: 600 }}
        />
      </Box>
      <SimpleBar sx={{ height: contentHeight }}>
        <Stack sx={{ minHeight: contentHeight, p: 1.25, justifyContent: 'space-between' }}>
          <NavigationDrawer />
        </Stack>
      </SimpleBar>
    </>
  );
}
