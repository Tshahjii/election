import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

// project imports
import MainCard from 'components/cards/MainCard';
import { useAppPreferences } from 'contexts/AppPreferences';

// assets
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import SupervisedUserCircleOutlinedIcon from '@mui/icons-material/SupervisedUserCircleOutlined';

export default function DutyAnalytics() {
  const theme = useTheme();
  const { t } = useAppPreferences();

  const deptStats = [
    { name: t('translations.educationDept') || 'शिक्षा विभाग', ratio: 78, allocated: 390, total: 500, color: '#4338ca' },
    { name: t('translations.revenueDept') || 'राजस्व विभाग', ratio: 62, allocated: 155, total: 250, color: '#0f766e' },
    { name: t('translations.forestDept') || 'वन विभाग', ratio: 35, allocated: 52, total: 150, color: '#f59e0b' },
    { name: t('translations.treasuryDept') || 'कोषागार विभाग', ratio: 90, allocated: 90, total: 100, color: '#ef4444' },
    { name: t('translations.exciseDept') || 'आबकारी विभाग', ratio: 50, allocated: 60, total: 120, color: '#7c3aed' }
  ];

  return (
    <Stack sx={{ gap: 3 }}>
      <Box>
        <Typography variant="h2" sx={{ fontWeight: 700, color: 'primary.dark' }}>{t('analytics.title')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t('analytics.subtitle')}
        </Typography>
      </Box>

      {/* KPI Cards Grid */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2.25, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)', border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{t('analytics.staffPool')}</Typography>
                <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 700 }}>1,120</Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', bgcolor: 'primary.lighter', color: 'primary.main' }}>
                <SupervisedUserCircleOutlinedIcon />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2.25, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)', border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{t('analytics.activeDeployments')}</Typography>
                <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 700, color: 'success.main' }}>747</Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', bgcolor: 'success.lighter', color: 'success.main' }}>
                <CheckCircleOutlinedIcon />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2.25, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)', border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{t('analytics.exemptedStaff')}</Typography>
                <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 700, color: 'error.main' }}>45</Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', bgcolor: 'error.lighter', color: 'error.main' }}>
                <RemoveCircleOutlineOutlinedIcon />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2.25, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)', border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{t('analytics.exemptionAppeals')}</Typography>
                <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 700, color: 'warning.main' }}>3</Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', bgcolor: 'warning.lighter', color: 'warning.main' }}>
                <AssignmentOutlinedIcon />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Ratios and Analytics Grid */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <MainCard title={t('analytics.deptRatios')} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)' }} headerSX={{ p: 2.5 }}>
            <Stack sx={{ gap: 2.5 }}>
              {deptStats.map((dept) => (
                <Box key={dept.name}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{dept.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {dept.allocated} / {dept.total} ({dept.ratio}%)
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={dept.ratio}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: dept.color,
                        borderRadius: 4
                      }
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </MainCard>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <MainCard title={t('analytics.roleStats')} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)' }} headerSX={{ p: 2.5 }}>
            <Stack sx={{ gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{t('analytics.proDeployed').replace(' Deployed', '').replace(' तैनात', '')} (PRO)</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>187 {t('analytics.proDeployed').includes('तैनात') ? 'तैनात' : 'deployed'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{t('analytics.po1Deployed').replace(' Deployed', '').replace(' तैनात', '')} (PO1)</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>224 {t('analytics.proDeployed').includes('तैनात') ? 'तैनात' : 'deployed'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{t('analytics.po2Deployed').replace(' Deployed', '').replace(' तैनात', '')} (PO2)</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>224 {t('analytics.proDeployed').includes('तैनात') ? 'तैनात' : 'deployed'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{t('analytics.moDeployed').replace(' Deployed', '').replace(' तैनात', '')} (MO)</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>112 {t('analytics.proDeployed').includes('तैनात') ? 'तैनात' : 'deployed'}</Typography>
              </Box>
            </Stack>
          </MainCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
