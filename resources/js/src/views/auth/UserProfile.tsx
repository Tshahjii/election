import { useSelector } from 'react-redux';

// material-ui
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

// project imports
import MainCard from 'components/cards/MainCard';
import { useAppPreferences } from 'contexts/AppPreferences';
import { ROLE_LABELS } from 'utils/access';

// assets
import BusinessCenterOutlined from '@mui/icons-material/BusinessCenterOutlined';
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import SecurityOutlined from '@mui/icons-material/SecurityOutlined';

const getSurfaceSx = (theme: any) => ({
  border: '1px solid',
  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(148, 163, 184, 0.18)',
  borderRadius: 3,
  boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 12px 34px rgba(15, 23, 42, 0.05)',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(180deg, rgba(20, 32, 54, 0.95), rgba(15, 24, 40, 0.9))'
    : '#ffffff'
});

export default function UserProfile() {
  const theme = useTheme();
  const { tl } = useAppPreferences();
  const { user } = useSelector((state: any) => state.auth);

  const roleLabel = ROLE_LABELS[user?.role] || user?.designation || 'User';

  return (
    <Stack sx={{ gap: 3 }}>
      <Box>
        <Typography variant="h2">{tl('User Profile')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {tl('View your account details, office assignments, and security settings')}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Basic Info Header Card */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ ...getSurfaceSx(theme), p: 4 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} sx={{ alignItems: 'center', gap: 4 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: 'primary.main',
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  boxShadow: '0 8px 24px rgba(67, 56, 202, 0.15)'
                }}
              >
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </Avatar>
              <Box sx={{ textAlign: { xs: 'center', md: 'left' }, flexGrow: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {user?.name || 'User Name'}
                </Typography>
                <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600, mb: 1.5 }}>
                  {roleLabel}
                </Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' }, gap: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>{tl('Mobile')}:</strong> {user?.mobile || '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>{tl('Email')}:</strong> {user?.email || '-'}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Detailed Scopes */}
        <Grid size={{ xs: 12, md: 6 }}>
          <MainCard
            title={
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                <BusinessCenterOutlined color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {tl('Office & Designation')}
                </Typography>
              </Stack>
            }
            sx={getSurfaceSx}
            headerSX={{ p: 2.5 }}
            contentSX={{ p: 3 }}
          >
            <Stack spacing={2.5}>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">{tl('Office Name')}</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{user?.office_info?.office_name || '-'}</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">{tl('Office Code')}</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{user?.office_info?.office_code || '-'}</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">{tl('Organization')}</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{user?.office_info?.company_name || '-'}</Typography>
              </Stack>
            </Stack>
          </MainCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <MainCard
            title={
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                <LocationOnOutlined color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {tl('Location Access Scope')}
                </Typography>
              </Stack>
            }
            sx={getSurfaceSx}
            headerSX={{ p: 2.5 }}
            contentSX={{ p: 3 }}
          >
            <Stack spacing={2.5}>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">{tl('Country')}</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{user?.country_info?.name || '-'}</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">{tl('State')}</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{user?.state_info?.name || '-'}</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">{tl('District')}</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{user?.district_info?.name || '-'}</Typography>
              </Stack>
            </Stack>
          </MainCard>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <MainCard
            title={
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                <SecurityOutlined color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {tl('Account Security')}
                </Typography>
              </Stack>
            }
            sx={getSurfaceSx}
            headerSX={{ p: 2.5 }}
            contentSX={{ p: 3 }}
          >
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">{tl('Last Active IP')}</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{user?.last_active_ip || '-'}</Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">{tl('Last Active Time')}</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {user?.last_active ? new Date(user.last_active).toLocaleString() : '-'}
                  </Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">{tl('Password Expires At')}</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {user?.password_expires_at ? new Date(user.password_expires_at).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </MainCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
