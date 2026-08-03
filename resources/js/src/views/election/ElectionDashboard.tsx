import { memo, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';

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
import Typography from '@mui/material/Typography';

import ChosenSelect from 'components/ChosenSelect';
import MainCard from 'components/cards/MainCard';
import { useAppPreferences } from 'contexts/AppPreferences';
import {
  useCreateRuralTeamsMutation,
  useCreateUrbanTeamsMutation,
  useGetOptionsQuery,
  useGetRuralDashboardQuery,
  useGetUrbanDashboardQuery
} from 'store/apiSlice';
import { showNotification } from 'store/slices/notificationSlice';

interface ElectionDashboardProps {
  type: 'Nagar Panchayat' | 'Nagari Nikay';
}

type Tone = 'primary' | 'success' | 'info' | 'warning' | 'error';

const getSurfaceSx = (theme: any) => ({
  border: '1px solid',
  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(148, 163, 184, 0.22)',
  borderRadius: 3,
  boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 18px 45px rgba(15, 23, 42, 0.08)',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(180deg, rgba(17, 28, 46, 0.95), rgba(12, 20, 34, 0.9))'
    : 'linear-gradient(180deg, rgba(255,255,255,0.97), rgba(255,255,255,0.92))'
});

const actionButtonSx = {
  borderRadius: 2,
  minHeight: 42,
  px: 2.75,
  textTransform: 'none',
  fontWeight: 700,
  boxShadow: '0 12px 24px rgba(67, 56, 202, 0.22)'
};

const tableHeadCellSx = {
  color: 'text.primary',
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
    <Card sx={(theme) => ({ ...getSurfaceSx(theme), height: '100%', p: { xs: 2, sm: 2.4 } })}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, minHeight: 78 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, lineHeight: 1.45 }}>
            {label}
          </Typography>
          <Typography variant="h3" sx={{ mt: 0.5, color: tone === 'error' ? 'error.main' : 'text.primary', fontWeight: 800, lineHeight: 1.15 }}>
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
  const { user } = useSelector((state: any) => state.auth);
  const { t } = useAppPreferences();
  const theme = useTheme();
  const isUrban = type === 'Nagar Panchayat';
  const postOptions = useMemo(() => (isUrban ? ['P0', 'P1', 'P2', 'P3'] : ['P0', 'P1', 'P2', 'P3', 'P4']), [isUrban]);

  const [selectedStateId, setSelectedStateId] = useState<number | 'all' | ''>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | 'all' | ''>('');
  const [selectedCityId, setSelectedCityId] = useState<number | 'all' | ''>('all');

  const { data: optionsData } = useGetOptionsQuery();
  const statesList = useMemo(() => optionsData?.states || [], [optionsData]);
  const allDistrictsList = useMemo(() => optionsData?.districts || [], [optionsData]);

  const filteredDistricts = useMemo(() => {
    if (!optionsData?.districts || !selectedStateId || selectedStateId === '') return [];
    if (selectedStateId === 'all') return optionsData.districts;
    return optionsData.districts.filter((d: any) => Number(d.state_id) === Number(selectedStateId));
  }, [optionsData, selectedStateId]);

  const isMultiDistrictUser = useMemo(() => {
    const isSuperOrSystem = Number(user?.role) === 1 || Number(user?.role) === 2 || user?.access?.is_super_admin;
    return isSuperOrSystem || allDistrictsList.length > 1;
  }, [user, allDistrictsList]);

  const filteredCities = useMemo(() => {
    if (!optionsData) return [];
    const cities = isUrban ? (optionsData.np_cities || []) : (optionsData.rp_cities || []);
    if (selectedDistrictId && selectedDistrictId !== 'all') {
      return cities.filter((c: any) => Number(c.district_id) === Number(selectedDistrictId));
    }
    if (selectedStateId && selectedStateId !== 'all') {
      const stateDistIds = filteredDistricts.map((d: any) => Number(d.id));
      return cities.filter((c: any) => stateDistIds.includes(Number(c.district_id)));
    }
    return cities;
  }, [optionsData, isUrban, selectedDistrictId, selectedStateId, filteredDistricts]);

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
  const scheduleLoading = isUrban ? creatingUrbanTeams : creatingRuralTeams;

  useEffect(() => {
    setSelectedCityId('all');
    setSelectedDistrictId('all');
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

  const getStatusChip = (status: string) => {
    if (status === 'Approved' || status === 'Verified') {
      return <Chip label={t('data.verified')} color="success" size="small" variant="filled" sx={{ borderRadius: 1.5, fontWeight: 700 }} />;
    }
    if (status === 'Disqualified') {
      return <Chip label={t('data.disqualified')} color="error" size="small" variant="filled" sx={{ borderRadius: 1.5, fontWeight: 700 }} />;
    }
    return <Chip label={t('data.pending')} color="warning" size="small" variant="outlined" sx={{ borderRadius: 1.5, fontWeight: 700 }} />;
  };

  const hasGeneratedTeams = Boolean(dashboardData && dashboardData.stats.teams_count > 0);
  const allCityOptionLabel = isUrban ? t('election.allNpCities') : t('election.allRnCities');

  return (
    <Stack sx={{ gap: { xs: 2.25, md: 3 }, px: { xs: 0, sm: 0.5 } }}>
      <Box
        sx={{
          p: { xs: 2.25, sm: 3 },
          borderRadius: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.darker}, ${theme.palette.primary.dark})`,
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

      <Card sx={(theme) => ({ ...getSurfaceSx(theme), p: { xs: 2, sm: 2.5 } })}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          {isMultiDistrictUser ? (
            <>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <ChosenSelect
                    label={t('masters.state') || 'State'}
                    placeholder="Select State"
                    value={selectedStateId}
                    options={[
                      { value: '', label: 'Select State' },
                      ...statesList.map((s: any) => ({ value: s.id, label: s.name }))
                    ]}
                    onChange={(event) => {
                      const val = event.target.value;
                      setSelectedStateId(val === '' ? '' : Number(val));
                      setSelectedDistrictId('');
                      setSelectedCityId('all');
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth disabled={selectedStateId === ''}>
                  <ChosenSelect
                    label={t('masters.district') || 'District'}
                    placeholder={selectedStateId === '' ? 'Select State First' : 'All Districts'}
                    value={selectedDistrictId}
                    options={
                      selectedStateId === ''
                        ? []
                        : [
                            { value: 'all', label: 'All Districts' },
                            ...filteredDistricts.map((d: any) => ({ value: d.id, label: d.name }))
                          ]
                    }
                    onChange={(event) => {
                      const val = event.target.value;
                      setSelectedDistrictId(val === 'all' ? 'all' : val === '' ? '' : Number(val));
                      setSelectedCityId('all');
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth disabled={selectedStateId === ''}>
                  <ChosenSelect
                    label={isUrban ? t('election.selectNpCity') : t('election.selectRnCity')}
                    placeholder={t('election.chooseCity')}
                    value={selectedCityId}
                    options={[
                      { value: 'all', label: allCityOptionLabel },
                      ...filteredCities.map((city: any) => {
                        const distObj = allDistrictsList.find((d: any) => Number(d.id) === Number(city.district_id));
                        const labelPrefix = (selectedDistrictId === 'all' || selectedDistrictId === '') && distObj ? `[${distObj.name}] ` : '';
                        return { value: city.id, label: `${labelPrefix}${city.karyalay_name || city.city_name}` };
                      })
                    ]}
                    onChange={(event) => {
                      const value = event.target.value;
                      setSelectedCityId(value === 'all' ? 'all' : value === '' ? '' : Number(value));
                    }}
                  />
                </FormControl>
              </Grid>
            </>
          ) : (
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
          )}

          {selectedCityId !== '' && !hasGeneratedTeams && (
            <Grid size={{ xs: 12, md: isMultiDistrictUser ? 4 : 6 }}>
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
        <Box sx={(theme) => ({ ...getSurfaceSx(theme), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, p: 4 })}>
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

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <MainCard title={t('election.zonesOverview')} sx={getSurfaceSx} headerSX={{ p: { xs: 2, sm: 2.5 } }} contentSX={{ p: 0 }}>
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
              <MainCard title={t('election.timeline')} sx={getSurfaceSx} headerSX={{ p: { xs: 2, sm: 2.5 } }}>
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
          sx={(theme) => ({
            ...getSurfaceSx(theme),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 4, sm: 8 },
            minHeight: 220,
            borderStyle: 'dashed',
            textAlign: 'center'
          })}
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
