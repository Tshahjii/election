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
import apiClient from 'api/client';
import { showNotification } from 'store/slices/notificationSlice';

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

  // Determine API endpoints and fields based on type (Nagar Panchayat = urban, Nagari Nikay = rural)
  const apiPrefix = type === 'Nagar Panchayat' ? '/urban-election' : '/rural-election';

  const postOptions = useMemo(() => (type === 'Nagar Panchayat' ? ['P0', 'P1', 'P2', 'P3'] : ['P0', 'P1', 'P2', 'P3', 'P4']), [type]);

  // State
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | 'all' | ''>('all');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [dutyCriteria, setDutyCriteria] = useState<Record<string, string>>({
    date_of_birth: '',
    P0: 'any',
    P1: 'any',
    P2: 'any',
    P3: 'any',
    P4: 'any'
  });

  const [dashboardData, setDashboardData] = useState<{
    stats: {
      total_wards: number;
      mapped_wards: number;
      total_booths: number;
      mapped_booths: number;
      teams_count: number;
      deployed: number;
    };
    teams: any[];
  } | null>(null);

  // Filter cities to show only matching type (Nagar Panchayat uses 'urban', Nagari Nikay uses 'rural')
  const filteredCities = useMemo(() => {
    if (type === 'Nagar Panchayat') {
      return cities.filter((city) => city.city_type === 'urban');
    }
    return cities.filter((city) => city.city_type === 'rural');
  }, [cities, type]);

  const allCityOptionLabel = type === 'Nagar Panchayat' ? 'All Nagar Panchayat Cities' : 'All Nagari Nikay Cities';

  // Load cities list on mount
  const fetchCities = async () => {
    try {
      const response = await apiClient.get('/masters/options');
      setCities(response.data.cities || []);
    } catch (error: any) {
      dispatch(showNotification({ message: 'Failed to load cities.', severity: 'error' }));
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  // Reset selected city and states when dashboard type changes
  useEffect(() => {
    setSelectedCityId('all');
    setDashboardData(null);
  }, [type]);

  // Fetch dashboard details when city is selected
  const loadDashboardData = async (cityId: number | 'all') => {
    setLoading(true);
    try {
      const params = cityId === 'all' ? {} : { city_id: cityId };
      const response = await apiClient.get(`${apiPrefix}/dashboard-data`, { params });
      setDashboardData(response.data);
    } catch (error: any) {
      dispatch(showNotification({ message: 'Failed to fetch dashboard data.', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCityId !== '') {
      loadDashboardData(selectedCityId);
    } else {
      setDashboardData(null);
    }
  }, [selectedCityId]);

  // Handler for creating team schedule
  const handleCreateTeamSchedule = async () => {
    if (selectedCityId === '') return;
    setActionLoading(true);
    try {
      const payload: any = {};
      if (selectedCityId !== 'all') {
        payload.city_id = selectedCityId;
      }
      const response = await apiClient.post(`${apiPrefix}/create-teams-scheduled`, payload);
      dispatch(showNotification({ message: response.data.message, severity: 'success' }));
      // Reload details
      await loadDashboardData(selectedCityId);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to generate team schedule.';
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
      const response = await apiClient.post(`${apiPrefix}/apply-duty`, payload);
      dispatch(showNotification({ message: response.data.message, severity: 'success' }));
      await loadDashboardData(selectedCityId);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to apply duty assignments.';
      dispatch(showNotification({ message: errMsg, severity: 'error' }));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusChip = (status: string) => {
    if (status === 'Approved' || status === 'Verified') {
      return <Chip label="Verified" color="success" size="small" variant="filled" />;
    }
    if (status === 'Disqualified') {
      return <Chip label="Disqualified" color="error" size="small" variant="filled" />;
    }
    return <Chip label="Pending" color="warning" size="small" variant="outlined" />;
  };

  const hasGeneratedTeams = Boolean(dashboardData && dashboardData.teams.length > 0);

  const updateDutyCriteria = (field: string, value: string) => {
    setDutyCriteria((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Stack sx={{ gap: 3 }}>
      <Box>
        <Typography variant="h2">{type} Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor constituency stats, wards, polling booths, and manage sequential scheduling for local {type} elections.
        </Typography>
      </Box>

      {/* City Dropdown Selection Card */}
      <Card sx={{ p: 2.5, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <ChosenSelect
                label={`Select ${type} City`}
                placeholder={`Choose a city...`}
                value={selectedCityId}
                  options={[
                    { value: 'all', label: allCityOptionLabel },
                    ...filteredCities.map((city) => ({ value: city.id, label: city.karyalay_name || city.city_name }))
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
                >
                  Create Team Scheduled
                </Button>
              </Stack>
            </Grid>
          )}
        </Grid>
      </Card>

      {/* Vacant-per-post KPI cards (placed under the city selector card) */}
      {dashboardData?.vacant_by_post && (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {postOptions.map((post) => {
            const cnt = dashboardData.vacant_by_post?.[post] ?? 0;
            return (
              <Grid key={post} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ p: 2.25, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{post} Not Assigned</Typography>
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
              <Card sx={{ p: 2.25, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Wards Scheduled</Typography>
                    <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 700 }}>{dashboardData.stats.mapped_wards} / {dashboardData.stats.total_wards}</Typography>
                  </Box>
                  <Box sx={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', bgcolor: 'primary.lighter', color: 'primary.main' }}>
                    <PlaceOutlined />
                  </Box>
                </Stack>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 2.25, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Booths Scheduled</Typography>
                    <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 700 }}>{dashboardData.stats.mapped_booths} / {dashboardData.stats.total_booths}</Typography>
                  </Box>
                  <Box sx={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', bgcolor: 'success.lighter', color: 'success.main' }}>
                    <HowToVoteOutlined />
                  </Box>
                </Stack>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 2.25, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Teams Generated</Typography>
                    <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 700 }}>{dashboardData.stats.teams_count}</Typography>
                  </Box>
                  <Box sx={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', bgcolor: 'info.lighter', color: 'info.main' }}>
                    <PeopleAltOutlined />
                  </Box>
                </Stack>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 2.25, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Deployed Officers</Typography>
                    <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 700 }}>{dashboardData.stats.deployed}</Typography>
                  </Box>
                  <Box sx={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', bgcolor: 'warning.lighter', color: 'warning.main' }}>
                    <AssignmentTurnedInOutlined />
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>

          {dashboardData && selectedCityId !== '' && (
            <>
              <MainCard title="Apply Duty Criteria" sx={{ borderRadius: 2, boxShadow: '0 10px 30px rgba(16, 60, 92, 0.08)' }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Date of Birth"
                    value={dutyCriteria.date_of_birth}
                    onChange={(event) => updateDutyCriteria('date_of_birth', event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                {postOptions.map((post) => (
                  <Grid key={post} size={{ xs: 12, sm: 6, md: 4 }}>
                    <ChosenSelect
                      label={`${post} Gender Condition`}
                      value={dutyCriteria[post] || 'any'}
                      options={[
                        { value: 'any', label: 'Any' },
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' }
                      ]}
                      onChange={(event) => updateDutyCriteria(post, String(event.target.value))}
                    />
                  </Grid>
                ))}
                <Grid size={{ xs: 12 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleApplyDuty}
                    disabled={actionLoading}
                    startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : null}
                  >
                    Apply Duty
                  </Button>
                </Grid>
              </Grid>
              </MainCard>

              {/* Team Assignments module placed under Apply Duty Criteria */}
              <Box sx={{ mt: 2 }}>
                <ElectionTeamAssignments type={type} />
              </Box>
            </>
          )}

          {/* Overview Stages */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <MainCard title="Constituency Zones Overview" sx={{ borderRadius: 2, boxShadow: '0 10px 30px rgba(16, 60, 92, 0.08)' }} contentSX={{ p: 0 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell style={{ fontWeight: 700 }}>Stage / Action</TableCell>
                        <TableCell style={{ fontWeight: 700 }}>Constituency Details</TableCell>
                        <TableCell align="right" style={{ fontWeight: 700 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow hover>
                        <TableCell sx={{ fontWeight: 600 }}>Nominations verification</TableCell>
                        <TableCell>{type} local candidates checklist validation</TableCell>
                        <TableCell align="right">{getStatusChip('Verified')}</TableCell>
                      </TableRow>
                      <TableRow hover>
                        <TableCell sx={{ fontWeight: 600 }}>Polling Booth security</TableCell>
                        <TableCell>Deployment of security personnel check for booths</TableCell>
                        <TableCell align="right">{getStatusChip('Verified')}</TableCell>
                      </TableRow>
                      <TableRow hover>
                        <TableCell sx={{ fontWeight: 600 }}>EVM configuration</TableCell>
                        <TableCell>Booth allocation and testing logs verification</TableCell>
                        <TableCell align="right">{getStatusChip('Pending')}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </MainCard>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <MainCard title="Election Timeline Details" sx={{ borderRadius: 2, boxShadow: '0 10px 30px rgba(16, 60, 92, 0.08)' }}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2">Nomination Stage</Typography>
                    <Typography variant="subtitle2" sx={{ color: 'success.main', fontWeight: 700 }}>Open</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2">Verification Checks</Typography>
                    <Typography variant="subtitle2">Active</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2">Security Staff Deployed</Typography>
                    <Typography variant="subtitle2">Yes</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                    <Typography variant="body2">Polling Date</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>15th June 2026</Typography>
                  </Box>
                </Stack>
              </MainCard>
            </Grid>
          </Grid>
        </>
      )}

      {!loading && !dashboardData && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 8, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
          <PeopleAltOutlined style={{ fontSize: '48px', color: 'gray', marginBottom: '16px' }} />
          <Typography variant="h5" color="text.secondary">Please select a city to monitor its dashboard.</Typography>
        </Box>
      )}

    </Stack>
  );
}
