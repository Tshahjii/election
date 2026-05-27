import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { alpha, useTheme } from '@mui/material/styles';
import { Avatar, Box, Button, Container, Stack, Typography } from '@mui/material';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import { useAppPreferences } from 'contexts/AppPreferences';

export function ErrorView({ message }: { message?: string }) {
  const theme = useTheme();
  const { t } = useAppPreferences();
  const displayMessage = message || t('error.message');

  return (
    <Container maxWidth="md" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', py: 4 }}>
      <Box
        sx={{
          width: 1,
          textAlign: 'center',
          py: { xs: 4, sm: 5 },
          px: { xs: 2.5, sm: 4 },
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: `0 18px 48px ${alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.3 : 0.12)}`
        }}
      >
        <Stack sx={{ alignItems: 'center', gap: 2.25 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: alpha(theme.palette.error.main, 0.12), color: 'error.main' }}>
            <ErrorOutlineOutlined sx={{ fontSize: 36 }} />
          </Avatar>
          <Box>
            <Typography variant="h2" component="h1" gutterBottom>
              {t('error.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {displayMessage}
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.25, width: { xs: 1, sm: 'auto' } }}>
            <Button fullWidth variant="outlined" color="inherit" startIcon={<RefreshOutlined />} onClick={() => window.location.reload()}>
              {t('error.reload')}
            </Button>
            <Button fullWidth component={Link} to="/" variant="contained" color="primary" startIcon={<HomeOutlined />}>
              {t('error.login')}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
}

export default function RouteError() {
  const error = useRouteError();
  const routeError = error as any;
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : routeError?.message;

  return <ErrorView message={message} />;
}
