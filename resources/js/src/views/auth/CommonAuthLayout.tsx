import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// material-ui
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';

// project imports
import AppControls from 'components/AppControls';
import MainCard from 'components/cards/MainCard';
import { useAppPreferences } from 'contexts/AppPreferences';

// assets
import Logo from 'assets/images/logo-dark.svg';
import HowToVoteOutlined from '@mui/icons-material/HowToVoteOutlined';
import SecurityOutlined from '@mui/icons-material/SecurityOutlined';
import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined';

// ==============================|| COMMON AUTH LAYOUT ||============================== //

export default function CommonAuthLayout({ title, subHeading, footerLink, children }: any) {
  const theme = useTheme();
  const { t } = useAppPreferences();

  return (
    <Grid
      container
      sx={{
        minHeight: '100vh',
        px: 2,
        py: { xs: 3, md: 6 },
        bgcolor: 'background.default',
        backgroundImage:
          theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.12)} 0%, transparent 42%, ${alpha(theme.palette.success.main, 0.12)} 100%)`
            : 'linear-gradient(135deg, rgba(255,153,51,0.16) 0%, rgba(255,255,255,0) 38%, rgba(19,136,8,0.14) 100%)'
      }}
    >
      <Box
        sx={{
          position: { xs: 'static', sm: 'fixed' },
          top: { sm: 16 },
          right: { sm: 16 },
          zIndex: 1,
          width: { xs: 1, sm: 'auto' },
          display: 'flex',
          justifyContent: 'flex-end',
          mb: { xs: 2, sm: 0 }
        }}
      >
        <AppControls />
      </Box>
      <Grid size={{ xs: 12, lg: 10, xl: 9 }} sx={{ width: 1, maxWidth: 1180, mx: 'auto' }}>
        <Grid container spacing={{ xs: 3, md: 4 }} sx={{ width: 1, mx: 'auto', alignItems: 'stretch', justifyContent: 'center' }}>
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box
              sx={{
                height: 1,
                minHeight: 560,
                borderRadius: 2,
                color: 'common.white',
                p: { md: 4, lg: 5 },
                position: 'relative',
                overflow: 'hidden',
                bgcolor: '#103c5c',
                backgroundImage: 'linear-gradient(145deg, #103c5c 0%, #1f5f75 54%, #276749 100%)'
              }}
            >
              <Box sx={{ position: 'absolute', inset: 0, opacity: 0.18, backgroundImage: 'radial-gradient(circle at 20% 20%, #ffffff 0 2px, transparent 2px)', backgroundSize: '32px 32px' }} />
              <Stack sx={{ position: 'relative', height: 1, justifyContent: 'space-between', gap: 4 }}>
                <Stack sx={{ gap: 3 }}>
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 54,
                        height: 54,
                        borderRadius: 1.5,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: 'rgba(255,255,255,0.14)',
                        border: '1px solid rgba(255,255,255,0.24)'
                      }}
                    >
                      <HowToVoteOutlined sx={{ fontSize: 32 }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ color: 'common.white', fontWeight: 700 }}>
                        {t('app.name')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.78)' }}>
                        {t('auth.subtitle')}
                      </Typography>
                    </Box>
                  </Stack>

                  <Typography variant="h1" sx={{ color: 'common.white', maxWidth: 480, lineHeight: 1.12 }}>
                    {t('auth.heroTitle')}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.82)', maxWidth: 520 }}>
                    {t('auth.heroBody')}
                  </Typography>
                </Stack>

                <Stack sx={{ gap: 2 }}>
                  <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={t('auth.mobileOtpLogin')} sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.14)' }} />
                    <Chip label={t('auth.roleBasedAccess')} sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.14)' }} />
                  </Stack>
                  <Stack direction="row" sx={{ gap: 2 }}>
                    <SecurityOutlined />
                    <Box>
                      <Typography variant="subtitle1" sx={{ color: 'common.white' }}>
                        {t('auth.protectedSession')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.74)' }}>
                        {t('auth.protectedSessionBody')}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Stack>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 8, md: 5, lg: 4 }}>
            <Stack sx={{ gap: 2, height: 1, justifyContent: 'center' }}>
              <Box
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  color: 'primary.main'
                }}
              >
                <HowToVoteOutlined />
                  <Typography variant="h4" sx={{ minWidth: 0, textAlign: 'center' }}>
                    {t('app.name')}
                  </Typography>
              </Box>

        <MainCard
          sx={{
            overflow: 'visible',
            display: 'flex',
            position: 'relative',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 18px 45px rgba(16, 60, 92, 0.14)',
            '& .MuiCardContent-root': { flexGrow: 1, flexBasis: { xs: 'auto', sm: '50%' }, width: { xs: '100%', sm: '50%' } },
            maxWidth: 475,
            margin: '0 auto',
            '&:before': {
              content: '""',
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: 5,
              background: 'linear-gradient(90deg, #ff9933 0%, #ffffff 50%, #138808 100%)'
            }
          }}
          contentSX={{ flexGrow: 1, flexBasis: { xs: 'auto', sm: '50%' }, width: { xs: '100%', sm: '50%' }, px: { xs: 2.5, sm: 4 }, pt: { xs: 4, sm: 5 } }}
        >
          <Stack direction="column" sx={{ mb: 2, gap: 3.5, justifyContent: 'center' }}>
            <Stack
              direction={{ xs: 'column-reverse', sm: 'row' }}
              sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: { xs: 2, sm: 1 } }}
            >
              <Box>
                <Chip
                  icon={<VerifiedUserOutlined />}
                  label={t('auth.officialLogin')}
                  size="small"
                  sx={{ mb: 1.5, bgcolor: alpha(theme.palette.success.main, 0.12), color: 'success.dark', '& .MuiChip-icon': { color: 'success.dark' } }}
                />
                <Typography color="text.primary" gutterBottom variant="h2">
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {subHeading}
                </Typography>
              </Box>
              <Link to="/">
                <CardMedia component="img" image={Logo} alt="logo" />
              </Link>
            </Stack>

            {children}
          </Stack>
          {footerLink && (
            <Typography variant="subtitle2" color="text.secondary" component={Link} to={footerLink.link} sx={{ textDecoration: 'none' }}>
              {footerLink.title}
            </Typography>
          )}
        </MainCard>
            </Stack>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}

CommonAuthLayout.propTypes = {
  title: PropTypes.string,
  subHeading: PropTypes.string,
  footerLink: PropTypes.object,
  children: PropTypes.node
};
