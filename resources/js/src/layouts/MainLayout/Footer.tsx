import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';

export default function Footer() {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        pt: 2,
        pb: 1.5,
        px: { xs: 2, sm: 3 },
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.4) : alpha('#ffffff', 0.6),
        backdropFilter: 'blur(8px)',
        borderRadius: 2
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
        © {new Date().getFullYear()} Election Management System. All Rights Reserved.
      </Typography>

      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
        <CodeOutlinedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            letterSpacing: '0.2px'
          }}
        >
          Designed & Developed by{' '}
          <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>
            National Informatics Centre, Durg
          </Box>
        </Typography>
      </Stack>
    </Box>
  );
}
