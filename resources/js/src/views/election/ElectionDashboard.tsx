import { memo, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useDispatch } from 'react-redux';

import AssignmentTurnedInOutlined from '@mui/icons-material/AssignmentTurnedInOutlined';
import HowToVoteOutlined from '@mui/icons-material/HowToVoteOutlined';
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import ChosenSelect from 'components/ChosenSelect';
import MainCard from 'components/cards/MainCard';
import { useAppPreferences } from 'contexts/AppPreferences';
import {
  useApplyRuralDutyMutation,
  useApplyUrbanDutyMutation,
  useCreateRuralTeamsMutation,
  useCreateUrbanTeamsMutation,
  useGetOptionsQuery,
  useGetRuralDashboardQuery,
  useGetUrbanDashboardQuery
} from 'store/apiSlice';
import { showNotification } from 'store/slices/notificationSlice';
import ElectionTeamAssignments from './ElectionTeamAssignments';

interface ElectionDashboardProps {
  type: 'Nagar Panchayat' | 'Nagari Nikay';
}

type Tone = 'primary' | 'success' | 'info' | 'warning' | 'error';

const surfaceSx = {
  border: '1px solid',
  borderColor: 'rgba(148, 163, 184, 0.22)',
  borderRadius: 3,
  boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.97), rgba(255,255,255,0.92))'
};

const actionButtonSx = {
  borderRadius: 2,
  minHeight: 42,
  px: 2.75,
  textTransform: 'none',
  fontWeight: 700,
  boxShadow: '0 12px 24px rgba(67, 56, 202, 0.22)'
};

const tableHeadCellSx = {
  color: 'text.dark',
  fontWeight: 800,
  whiteSpace: 'nowrap'
};

const MetricCard = memo(function MetricCard({
  label,
  value,
  icon,
  tone = 'primary'
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: Tone;
}) {
  return (
    <Card sx={{ ...surfaceSx, height: '100%', p: { xs: 2, sm: 2.4 } }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, minHeight: 78 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, lineHeight: 1.45 }}>
            {label}
          </Typography>
          <Typography variant="h3" sx={{ mt: 0.5, color: tone === 'error' ? 'error.main' : 'text.dark', fontWeight: 800, lineHeight: 1.15 }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2.2,
            bgcolor: `${tone}.lighter`,
            color: `${tone}.main`
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Card>
  );
});

export default function ElectionDashboard({ type }: ElectionDashboardProps) {
  const dispatch = useDispatch();
  const { t } = useAppPreferences();
  const isUrban = type === 'Nagar Panchayat';
  const postOptions = useMemo(() => (isUrban ? ['P0', 'P1', 'P2', 'P3'] : ['P0', 'P1', 'P2', 'P3', 'P4']), [isUrban]);

  const [selectedCityId, setSelectedCityId] = useState<number | 'all' | ''>('all');
  const [dutyCriteria, setDutyCriteria] = useState<Record<string, string>>({
    date_of_birth: '',
    P0: 'any',
    P1: 'any',
    P2: 'any',
    P3: 'any',
    P4: 'any'
  });

  const { data: optionsData } = useGetOptionsQuery();
  const filteredCities = useMemo(() => {
    if (!optionsData) return [];
    return isUrban ? (optionsData.np_cities || []) : (optionsData.rp_cities || []);
  }, [optionsData, isUrban]);

  const urbanQuery = useGetUrbanDashboardQuery(
    isUrban && selectedCityId !== '' && selectedCityId !== 'all' ? { city_id: selectedCityId } : {},
    { skip: !isUrban || selectedCityId === '' }
  );
  const ruralQuery = useGetRuralDashboardQuery(
    !isUrban && selectedCityId !== '' && selectedCityId !== 'all' ? { city_id: selectedCityId } : {},
    { skip: isUrban || selectedCityId === '' }
  );
  const dashboardData = isUrban ? urbanQuery.data : ruralQuery.data;
  const loading = isUrban ? urbanQuery.isFetching : ruralQuery.isFetching;

  const [createUrbanTeams, { isLoading: creatingUrbanTeams }] = useCreateUrbanTeamsMutation();
  const [createRuralTeams, { isLoading: creatingRuralTeams }] = useCreateRuralTeamsMutation();
  const [applyUrbanDuty, { isLoading: applyingUrbanDuty }] = useApplyUrbanDutyMutation();
  const [applyRuralDuty, { isLoading: applyingRuralDuty }] = useApplyRuralDutyMutation();
  const scheduleLoading = isUrban ? creatingUrbanTeams : creatingRuralTeams;
  const dutyLoading = isUrban ? applyingUrbanDuty : applyingRuralDuty;

  useEffect(() => {
    setSelectedCityId('all');
  }, [type]);

  const notifyError = (error: any, fallback: string) => {
    dispatch(showNotification({ message: error?.data?.message || error?.message || fallback, severity: 'error' }));
  };

  const handleCreateTeamSchedule = async () => {
    if (selectedCityId === '') return;
    try {
      const payload: any = selectedCityId !== 'all' ? { city_id: selectedCityId } : {};
      const response = await (isUrban ? createUrbanTeams : createRuralTeams)(payload).unwrap();
      dispatch(showNotification({ message: response.message, severity: 'success' }));
    } catch (error: any) {
      notifyError(error, t('election.scheduleFailed'));
    }
  };

  const handleApplyDuty = async () => {
    if (selectedCityId === '') return;
    try {
      const payload: any = {
        date_of_birth: dutyCriteria.date_of_birth || null,
        P0: dutyCriteria.P0,
        P1: dutyCriteria.P1,
        P2: dutyCriteria.P2,
        P3: dutyCriteria.P3,
        P4: dutyCriteria.P4
      };
      if (selectedCityId !== 'all') payload.city_id = selectedCityId;
      const response = await (isUrban ? applyUrbanDuty : applyRuralDuty)(payload).unwrap();
      dispatch(showNotification({ message: response.message, severity: 'success' }));
    } catch (error: any) {
      notifyError(error, t('election.applyDutyFailed'));
    }
  };

  const getStatusChip = (status: string) => {
    if (status === 'Approved' || status === 'Verified') {
      return <Chip label={t('data.verified')} color="success" size="small" variant="filled" sx={{ borderRadius: 1.5, fontWeight: 700 }} />;
    }
    if (status === 'Disqualified') {
      return <Chip label={t('data.disqualified')} color="error" size="small" variant="filled" sx={{ borderRadius: 1.5, fontWeight: 700 }} />;
    }
    return <Chip label={t('data.pending')} color="warning" size="small" variant="outlined" sx={{ borderRadius: 1.5, fontWeight: 700 }} />;
  };

  const updateDutyCriteria = (field: string, value: string) => {
    setDutyCriteria((prev) => ({ ...prev, [field]: value }));
  };

  const hasGeneratedTeams = Boolean(dashboardData && dashboardData.stats.teams_count > 0);
  const allCityOptionLabel = isUrban ? t('election.allNpCities') : t('election.allRnCities');

  return (
    <Stack sx={{ gap: { xs: 2.25, md: 3 }, px: { xs: 0, sm: 0.5 } }}>
      <Box
        sx={{
          p: { xs: 2.25, sm: 3 },
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.98), rgba(49, 46, 129, 0.92))',
          color: 'primary.contrastText',
          overflow: 'hidden'
        }}
      >
        <Typography variant="h2" sx={{ color: 'inherit', fontWeight: 800, fontSize: { xs: '1.45rem', sm: '1.8rem', md: '2rem' } }}>
          {isUrban ? t('election.npTitle') : t('election.rnTitle')}
        </Typography>
        <Typography variant="body1" sx={{ mt: 0.75, color: 'rgba(255,255,255,0.76)', maxWidth: 760 }}>
          {isUrban ? t('election.npSubtitle') : t('election.rnSubtitle')}
        </Typography>
      </Box>

      <Card sx={{ ...surfaceSx, p: { xs: 2, sm: 2.5 } }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <ChosenSelect
                label={isUrban ? t('election.selectNpCity') : t('election.selectRnCity')}
                placeholder={t('election.chooseCity')}
                value={selectedCityId}
                options={[
                  { value: 'all', label: allCityOptionLabel },
                  ...filteredCities.map((city: any) => ({ value: city.id, label: city.karyalay_name || city.city_name }))
                ]}
                onChange={(event) => {
                  const value = event.target.value;
                  setSelectedCityId(value === 'all' ? 'all' : value === '' ? '' : Number(value));
                }}
              />
            </FormControl>
          </Grid>

          {selectedCityId !== '' && !hasGeneratedTeams && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack direction="row" spacing={2} sx={{ justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleCreateTeamSchedule}
                  disabled={scheduleLoading}
                  startIcon={scheduleLoading ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{ ...actionButtonSx, width: { xs: '100%', md: 'auto' } }}
                >
                  {t('election.createSchedule')}
                </Button>
              </Stack>
            </Grid>
          )}
        </Grid>
      </Card>

      {dashboardData?.vacant_by_post && (
        <Grid container spacing={2}>
          {postOptions.map((post) => {
            const count = dashboardData.vacant_by_post?.[post] ?? 0;
            return (
              <Grid key={post} size={{ xs: 12, sm: 6, md: 3 }}>
                <MetricCard label={`${post} ${t('election.notAssigned')}`} value={count} icon={<HowToVoteOutlined />} tone={count > 0 ? 'error' : 'success'} />
              </Grid>
            );
          })}
        </Grid>
      )}

      {loading && (
        <Box sx={{ ...surfaceSx, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, p: 4 }}>
          <CircularProgress />
          <Typography variant="subtitle1" color="text.secondary">
            {t('election.loadingDashboard')}
          </Typography>
        </Box>
      )}

      {!loading && dashboardData && (
        <>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard label={t('election.wardsScheduled')} value={`${dashboardData.stats.mapped_wards} / ${dashboardData.stats.total_wards}`} icon={<PlaceOutlined />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard label={t('election.boothsScheduled')} value={`${dashboardData.stats.mapped_booths} / ${dashboardData.stats.total_booths}`} icon={<HowToVoteOutlined />} tone="success" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard label={t('election.teamsGenerated')} value={dashboardData.stats.teams_count} icon={<PeopleAltOutlined />} tone="info" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard label={t('election.deployedOfficers')} value={dashboardData.stats.deployed} icon={<AssignmentTurnedInOutlined />} tone="warning" />
            </Grid>
          </Grid>

          {selectedCityId !== '' && (
            <>
              <MainCard title={t('election.dutyCriteria')} sx={surfaceSx} headerSX={{ p: { xs: 2, sm: 2.5 } }}>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label={t('election.dob')}
                      value={dutyCriteria.date_of_birth}
                      onChange={(event) => updateDutyCriteria('date_of_birth', event.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  {postOptions.map((post) => (
                    <Grid key={post} size={{ xs: 12, sm: 6, md: 4 }}>
                      <ChosenSelect
                        label={`${post} ${t('election.genderCond')}`}
                        value={dutyCriteria[post] || 'any'}
                        options={[
                          { value: 'any', label: t('election.any') },
                          { value: 'male', label: t('election.male') },
                          { value: 'female', label: t('election.female') }
                        ]}
                        onChange={(event) => updateDutyCriteria(post, String(event.target.value))}
                      />
                    </Grid>
                  ))}
                  <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      onClick={handleApplyDuty}
                      disabled={dutyLoading}
                      startIcon={dutyLoading ? <CircularProgress size={20} color="inherit" /> : null}
                      sx={{ ...actionButtonSx, width: { xs: '100%', sm: 'auto' } }}
                    >
                      {t('election.applyDuty')}
                    </Button>
                  </Grid>
                </Grid>
              </MainCard>

              <Box sx={{ mt: 1 }}>
                <ElectionTeamAssignments type={type} />
              </Box>
            </>
          )}

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <MainCard title={t('election.zonesOverview')} sx={surfaceSx} headerSX={{ p: { xs: 2, sm: 2.5 } }} contentSX={{ p: 0 }}>
                <TableContainer>
                  <Table sx={{ minWidth: 640 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'bg.100' }}>
                        <TableCell sx={tableHeadCellSx}>{t('election.phaseAction')}</TableCell>
                        <TableCell sx={tableHeadCellSx}>{t('election.details')}</TableCell>
                        <TableCell align="right" sx={tableHeadCellSx}>
                          {t('common.status')}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow hover>
                        <TableCell sx={{ fontWeight: 700 }}>{t('election.nominationsVerification')}</TableCell>
                        <TableCell>{t('election.localCandidates')}</TableCell>
                        <TableCell align="right">{getStatusChip('Verified')}</TableCell>
                      </TableRow>
                      <TableRow hover>
                        <TableCell sx={{ fontWeight: 700 }}>{t('election.boothSecurity')}</TableCell>
                        <TableCell>{t('election.boothSecurityDeployment')}</TableCell>
                        <TableCell align="right">{getStatusChip('Verified')}</TableCell>
                      </TableRow>
                      <TableRow hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ fontWeight: 700 }}>{t('election.evmConfig')}</TableCell>
                        <TableCell>{t('election.boothTestingLogs')}</TableCell>
                        <TableCell align="right">{getStatusChip('Pending')}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </MainCard>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <MainCard title={t('election.timeline')} sx={surfaceSx} headerSX={{ p: { xs: 2, sm: 2.5 } }}>
                <Stack spacing={2}>
                  {[
                    [t('election.nominationStage'), t('election.open'), 'success.main'],
                    [t('election.verificationChecks'), t('election.active'), 'primary.main'],
                    [t('election.securityDeployed'), t('election.yes'), 'primary.main'],
                    [t('election.pollingDate'), t('election.pollingDateValue'), 'primary.dark']
                  ].map(([label, value, color], index) => (
                    <Box
                      key={label}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 2,
                        py: 1.2,
                        borderBottom: index === 3 ? 0 : '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {label}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ color, fontWeight: 800, textAlign: 'right' }}>
                        {value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </MainCard>
            </Grid>
          </Grid>
        </>
      )}

      {!loading && !dashboardData && (
        <Box
          sx={{
            ...surfaceSx,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 4, sm: 8 },
            minHeight: 220,
            borderStyle: 'dashed',
            textAlign: 'center'
          }}
        >
          <PeopleAltOutlined style={{ fontSize: '48px', color: '#64748b', marginBottom: '16px' }} />
          <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 600 }}>
            {t('election.selectMonitor')}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
