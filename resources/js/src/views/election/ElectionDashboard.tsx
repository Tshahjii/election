import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

// material-ui
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';

// project imports
import MainCard from 'components/cards/MainCard';
import ChosenSelect from 'components/ChosenSelect';
import { showNotification } from 'store/slices/notificationSlice';
import { useAppPreferences } from 'contexts/AppPreferences';
import {
  useGetOptionsQuery,
  useGetUrbanDashboardQuery,
  useGetRuralDashboardQuery,
  useCreateUrbanTeamsMutation,
  useCreateRuralTeamsMutation,
  useApplyUrbanDutyMutation,
  useApplyRuralDutyMutation
} from 'store/apiSlice';

// assets
import HowToVoteOutlined from '@mui/icons-material/HowToVoteOutlined';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import AssignmentTurnedInOutlined from '@mui/icons-material/AssignmentTurnedInOutlined';
import ElectionTeamAssignments from './ElectionTeamAssignments';

interface ElectionDashboardProps {
  type: 'Nagar Panchayat' | 'Nagari Nikay';
}

export default function ElectionDashboard({ type }: ElectionDashboardProps) {
  const dispatch = useDispatch();
  const { t } = useAppPreferences();
  const isUrban = type === 'Nagar Panchayat';

  const postOptions = useMemo(() => (isUrban ? ['P0', 'P1', 'P2', 'P3'] : ['P0', 'P1', 'P2', 'P3', 'P4']), [isUrban]);

  // Filters State
  const [selectedCityId, setSelectedCityId] = useState<number | 'all' | ''>('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [dutyCriteria, setDutyCriteria] = useState<Record<string, string>>({
    date_of_birth: '',
    P0: 'any',
    P1: 'any',
    P2: 'any',
    P3: 'any',
    P4: 'any'
  });

  // RTK Query hook for options list
  const { data: optionsData } = useGetOptionsQuery();
  const cities = optionsData?.cities || [];

  // Filter cities to show only matching type (Nagar Panchayat uses 'urban', Nagari Nikay uses 'rural')
  const filteredCities = useMemo(() => {
    if (isUrban) {
      return cities.filter((city: any) => city.city_type === 'urban');
    }
    return cities.filter((city: any) => city.city_type === 'rural');
  }, [cities, isUrban]);

  const allCityOptionLabel = isUrban ? t('election.allNpCities') : t('election.allRnCities');

  // Queries for dashboard data
  const { data: urbanData, isFetching: urbanLoading } = useGetUrbanDashboardQuery(
    isUrban && selectedCityId !== '' && selectedCityId !== 'all' ? { city_id: selectedCityId } : {},
    { skip: !isUrban || selectedCityId === '' }
  );

  const { data: ruralData, isFetching: ruralLoading } = useGetRuralDashboardQuery(
    !isUrban && selectedCityId !== '' && selectedCityId !== 'all' ? { city_id: selectedCityId } : {},
    { skip: isUrban || selectedCityId === '' }
  );

  const dashboardData = isUrban ? urbanData : ruralData;
  const loading = isUrban ? urbanLoading : ruralLoading;

  // Mutations
  const [createUrbanTeams] = useCreateUrbanTeamsMutation();
  const [createRuralTeams] = useCreateRuralTeamsMutation();
  const [applyUrbanDuty] = useApplyUrbanDutyMutation();
  const [applyRuralDuty] = useApplyRuralDutyMutation();

  // Reset selected city when dashboard type changes
  useEffect(() => {
    setSelectedCityId('all');
  }, [type]);

  // Handler for creating team schedule
  const handleCreateTeamSchedule = async () => {
    if (selectedCityId === '') return;
    setActionLoading(true);
    try {
      const payload: any = {};
      if (selectedCityId !== 'all') {
        payload.city_id = selectedCityId;
      }
      const createTeamsFn = isUrban ? createUrbanTeams : createRuralTeams;
      const response = await createTeamsFn(payload).unwrap();
      dispatch(showNotification({ message: response.message, severity: 'success' }));
    } catch (error: any) {
      const errMsg = error?.data?.message || error?.message || 'Failed to generate team schedule.';
      dispatch(showNotification({ message: errMsg, severity: 'error' }));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyDuty = async () => {
    if (selectedCityId === '') return;
    setActionLoading(true);
    try {
      const payload: any = {
        date_of_birth: dutyCriteria.date_of_birth || null,
        P0: dutyCriteria.P0,
        P1: dutyCriteria.P1,
        P2: dutyCriteria.P2,
        P3: dutyCriteria.P3,
        P4: dutyCriteria.P4
      };
      if (selectedCityId !== 'all') {
        payload.city_id = selectedCityId;
      }
      const applyDutyFn = isUrban ? applyUrbanDuty : applyRuralDuty;
      const response = await applyDutyFn(payload).unwrap();
      dispatch(showNotification({ message: response.message, severity: 'success' }));
    } catch (error: any) {
      const errMsg = error?.data?.message || error?.message || 'Failed to apply duty assignments.';
      dispatch(showNotification({ message: errMsg, severity: 'error' }));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusChip = (status: string) => {
    if (status === 'Approved' || status === 'Verified') {
      return <Chip label={t('data.verified')} color="success" size="small" variant="filled" sx={{ borderRadius: 1.5 }} />;
    }
    if (status === 'Disqualified') {
      return <Chip label="अयोग्य" color="error" size="small" variant="filled" sx={{ borderRadius: 1.5 }} />;
    }
    return <Chip label={t('data.pending')} color="warning" size="small" variant="outlined" sx={{ borderRadius: 1.5 }} />;
  };

  const hasGeneratedTeams = Boolean(dashboardData && dashboardData.teams.length > 0);

  const updateDutyCriteria = (field: string, value: string) => {
    setDutyCriteria((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Stack sx={{ gap: 3 }}>
      <Box>
        <Typography variant="h2" sx={{ fontWeight: 700, color: 'primary.dark' }}>{isUrban ? t('election.npTitle') : t('election.rnTitle')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {isUrban ? t('election.npSubtitle') : t('election.rnSubtitle')}
        </Typography>
      </Box>

      {/* City Dropdown Selection Card */}
      <Card sx={{ p: 2.5, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0,0,0,0.03)', border: '1px solid', borderColor: 'divider' }}>
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
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedCityId(value === 'all' ? 'all' : value === '' ? '' : Number(value));
                  }}
              />
            </FormControl>
          </Grid>

          {selectedCityId !== '' && !hasGeneratedTeams && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack direction="row" spacing={2} sx={{ justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreateTeamSchedule}
                  disabled={actionLoading}
                  startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{ borderRadius: 2, textTransform: 'none', px: 2.5, boxShadow: '0 4px 12px rgba(67, 56, 202, 0.2)' }}
                >
                  {t('election.createSchedule')}
                </Button>
              </Stack>
            </Grid>
          )}
        </Grid>
      </Card>

      {/* Vacant-per-post KPI cards (placed under the city selector card) */}
      {dashboardData?.vacant_by_post && (
        <Grid container spacing={2}>
          {postOptions.map((post) => {
            const cnt = dashboardData.vacant_by_post?.[post] ?? 0;
            return (
              <Grid key={post} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ p: 2.25, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)', border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{post} {t('election.notAssigned')}</Typography>
                      <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 700, color: cnt > 0 ? 'error.main' : 'success.main' }}>{cnt}</Typography>
                    </Box>
                    <Box sx={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', bgcolor: cnt > 0 ? 'error.lighter' : 'success.lighter', color: cnt > 0 ? 'error.main' : 'success.main' }}>
                      <HowToVoteOutlined />
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && dashboardData && (
        <>
          {/* KPI Cards Grid */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 2.25, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)', border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{t('election.wardsScheduled')}</Typography>
                    <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 700 }}>{dashboardData.stats.mapped_wards} / {dashboardData.stats.total_wards}</Typography>
                  </Box>
                  <Box sx={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', bgcolor: 'primary.lighter', color: 'primary.main' }}>
                    <PlaceOutlined />
                  </Box>
                </Stack>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 2.25, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)', border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{t('election.boothsScheduled')}</Typography>
                    <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 700 }}>{dashboardData.stats.mapped_booths} / {dashboardData.stats.total_booths}</Typography>
                  </Box>
                  <Box sx={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', bgcolor: 'success.lighter', color: 'success.main' }}>
                    <HowToVoteOutlined />
                  </Box>
                </Stack>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 2.25, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)', border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{t('election.teamsGenerated')}</Typography>
                    <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 700 }}>{dashboardData.stats.teams_count}</Typography>
                  </Box>
                  <Box sx={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', bgcolor: 'info.lighter', color: 'info.main' }}>
                    <PeopleAltOutlined />
                  </Box>
                </Stack>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 2.25, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)', border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{t('election.deployedOfficers')}</Typography>
                    <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 700 }}>{dashboardData.stats.deployed}</Typography>
                  </Box>
                  <Box sx={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', bgcolor: 'warning.lighter', color: 'warning.main' }}>
                    <AssignmentTurnedInOutlined />
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>

          {selectedCityId !== '' && (
            <>
              <MainCard title={t('election.dutyCriteria')} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)' }} headerSX={{ p: 2.5 }}>
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
                      variant="contained"
                      color="primary"
                      onClick={handleApplyDuty}
                      disabled={actionLoading}
                      startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : null}
                      sx={{ borderRadius: 2, textTransform: 'none', px: 3, boxShadow: '0 4px 12px rgba(67, 56, 202, 0.2)' }}
                    >
                      {t('election.applyDuty')}
                    </Button>
                  </Grid>
                </Grid>
              </MainCard>

              {/* Team Assignments module placed under Apply Duty Criteria */}
              <Box sx={{ mt: 1 }}>
                <ElectionTeamAssignments type={type} />
              </Box>
            </>
          )}

          {/* Overview Stages */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <MainCard title={t('election.zonesOverview')} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)' }} headerSX={{ p: 2.5 }} contentSX={{ p: 0 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'bg.100' }}>
                        <TableCell style={{ fontWeight: 700 }}>चरण / कार्यवाही</TableCell>
                        <TableCell style={{ fontWeight: 700 }}>विवरण</TableCell>
                        <TableCell align="right" style={{ fontWeight: 700 }}>{t('common.status')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow hover>
                        <TableCell sx={{ fontWeight: 600 }}>{t('election.nominationsVerification')}</TableCell>
                        <TableCell>{t('election.localCandidates')}</TableCell>
                        <TableCell align="right">{getStatusChip('Verified')}</TableCell>
                      </TableRow>
                      <TableRow hover>
                        <TableCell sx={{ fontWeight: 600 }}>{t('election.boothSecurity')}</TableCell>
                        <TableCell>{t('election.boothSecurityDeployment')}</TableCell>
                        <TableCell align="right">{getStatusChip('Verified')}</TableCell>
                      </TableRow>
                      <TableRow hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ fontWeight: 600 }}>{t('election.evmConfig')}</TableCell>
                        <TableCell>{t('election.boothTestingLogs')}</TableCell>
                        <TableCell align="right">{getStatusChip('Pending')}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </MainCard>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <MainCard title={t('election.timeline')} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)' }} headerSX={{ p: 2.5 }}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{t('election.nominationStage')}</Typography>
                    <Typography variant="subtitle2" sx={{ color: 'success.main', fontWeight: 700 }}>{t('election.open')}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{t('election.verificationChecks')}</Typography>
                    <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 600 }}>{t('election.active')}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{t('election.securityDeployed')}</Typography>
                    <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 600 }}>{t('election.yes')}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{t('election.pollingDate')}</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.dark' }}>15th June 2026</Typography>
                  </Box>
                </Stack>
              </MainCard>
            </Grid>
          </Grid>
        </>
      )}

      {!loading && !dashboardData && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 8, border: '1px dashed', borderColor: 'divider', borderRadius: 2.5, minHeight: 220 }}>
          <PeopleAltOutlined style={{ fontSize: '48px', color: 'gray', marginBottom: '16px' }} />
          <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 500 }}>{t('election.selectMonitor')}</Typography>
        </Box>
      )}

    </Stack>
  );
}
