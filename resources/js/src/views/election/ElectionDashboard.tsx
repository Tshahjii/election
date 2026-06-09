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
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Autocomplete from '@mui/material/Autocomplete';

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
import SaveOutlined from '@mui/icons-material/SaveOutlined';

interface ElectionDashboardProps {
  type: 'Nagar Panchayat' | 'Nagari Nikay';
}

export default function ElectionDashboard({ type }: ElectionDashboardProps) {
  const dispatch = useDispatch();

  // Determine API endpoints and fields based on type (Nagar Panchayat = urban, Nagari Nikay = rural)
  const apiPrefix = type === 'Nagar Panchayat' ? '/urban-election' : '/rural-election';
  
  const postHeaders = useMemo(() => {
    if (type === 'Nagar Panchayat') {
      return ['P0 (Presiding Officer)', 'P1 (Officer 1)', 'P2 (Officer 2)', 'P3 (Officer 3)'];
    }
    return ['P0 (Presiding Officer)', 'P1 (Officer 1)', 'P2 (Officer 2)', 'P3 (Officer 3)', 'P4 (Officer 4)'];
  }, [type]);

  // State
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

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

  // Modal & Search States
  const [activeTeam, setActiveTeam] = useState<any | null>(null);
  const [modalAssignments, setModalAssignments] = useState<Record<number, any | null>>({});
  const [searchOptions, setSearchOptions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Filter cities to show only matching type (Nagar Panchayat uses 'urban', Nagari Nikay uses 'rural')
  const filteredCities = useMemo(() => {
    if (type === 'Nagar Panchayat') {
      return cities.filter((city) => city.city_type === 'urban');
    }
    return cities.filter((city) => city.city_type === 'rural');
  }, [cities, type]);

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
    setSelectedCityId('');
    setDashboardData(null);
    setActiveTeam(null);
  }, [type]);

  // Fetch dashboard details when city is selected
  const loadDashboardData = async (cityId: number) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`${apiPrefix}/dashboard-data`, {
        params: { city_id: cityId }
      });
      setDashboardData(response.data);
    } catch (error: any) {
      dispatch(showNotification({ message: 'Failed to fetch dashboard data.', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCityId) {
      loadDashboardData(Number(selectedCityId));
    } else {
      setDashboardData(null);
    }
  }, [selectedCityId]);

  // Handler for creating team schedule
  const handleCreateTeamSchedule = async () => {
    if (!selectedCityId) return;
    setActionLoading(true);
    try {
      const response = await apiClient.post(`${apiPrefix}/create-teams-scheduled`, {
        city_id: selectedCityId
      });
      dispatch(showNotification({ message: response.data.message, severity: 'success' }));
      // Reload details
      await loadDashboardData(Number(selectedCityId));
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to generate team schedule.';
      dispatch(showNotification({ message: errMsg, severity: 'error' }));
    } finally {
      setActionLoading(false);
    }
  };

  // Search employees from backend asynchronously
  const fetchSearchEmployees = async (query: string) => {
    setSearchLoading(true);
    try {
      const response = await apiClient.get('/masters/employees/search', {
        params: { q: query }
      });
      setSearchOptions(response.data || []);
    } catch (error) {
      console.error('Failed to search employees', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Open modal and pre-populate current assignments for the selected team
  const handleOpenAssignModal = (team: any) => {
    setActiveTeam(team);
    const initial: Record<number, any | null> = {};
    (team.posts || []).forEach((post: any) => {
      initial[post.post_mapping_id] = post.emp_id
        ? { id: post.emp_id, name: post.employee_name, emp_code: post.employee_code }
        : null;
    });
    setModalAssignments(initial);
    fetchSearchEmployees('');
  };

  // Save assignments from the modal
  const handleSaveModalAssignments = async () => {
    if (!selectedCityId || !activeTeam) return;
    setSaveLoading(true);

    const payload = Object.keys(modalAssignments).map((key) => ({
      post_mapping_id: Number(key),
      emp_id: modalAssignments[Number(key)] ? modalAssignments[Number(key)].id : null
    }));

    try {
      const response = await apiClient.post(`${apiPrefix}/save-assignments`, {
        assignments: payload
      });
      dispatch(showNotification({ message: response.data.message, severity: 'success' }));
      await loadDashboardData(Number(selectedCityId));
      setActiveTeam(null);
    } catch (error: any) {
      dispatch(showNotification({ message: 'Failed to save assignments.', severity: 'error' }));
    } finally {
      setSaveLoading(false);
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
                options={filteredCities.map((city) => ({ value: city.id, label: city.karyalay_name || city.city_name }))}
                onChange={(e) => setSelectedCityId(e.target.value)}
              />
            </FormControl>
          </Grid>
          {selectedCityId && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack direction="row" spacing={2} sx={{ justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreateTeamSchedule}
                  disabled={actionLoading}
                  startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {dashboardData && dashboardData.teams.length > 0 ? 'Regenerate Team Scheduled' : 'Create Team Scheduled'}
                </Button>
              </Stack>
            </Grid>
          )}
        </Grid>
      </Card>

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

          {/* Dynamic Team Management Form (Unhidden only if teams are generated) */}
          {dashboardData.teams.length > 0 && (
            <MainCard
              title={`${type} Polling Team Assignments`}
              sx={{ borderRadius: 2, boxShadow: '0 10px 30px rgba(16, 60, 92, 0.08)' }}
            >
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" style={{ width: '80px', fontWeight: 700 }}>Team ID</TableCell>
                      <TableCell style={{ minWidth: '150px', fontWeight: 700 }}>Polling Station / Ward</TableCell>
                      {postHeaders.map((header) => (
                        <TableCell key={header} style={{ fontWeight: 700 }}>{header}</TableCell>
                      ))}
                      <TableCell align="center" style={{ width: '100px', fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.teams.map((team) => (
                      <TableRow key={team.team_id} hover>
                        <TableCell align="center">
                          <Chip label={team.padded_team_id} color="primary" variant="outlined" size="small" style={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{team.polling_station_name}</Typography>
                          <Typography variant="caption" color="text.secondary">Ward {team.ward_no} - {team.ward_name}</Typography>
                        </TableCell>
                        {team.posts.map((post: any) => (
                          <TableCell key={post.post_mapping_id}>
                            {post.emp_id ? (
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {post.employee_name} ({post.employee_code})
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                Not Assigned
                              </Typography>
                            )}
                          </TableCell>
                        ))}
                        <TableCell align="center">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleOpenAssignModal(team)}
                          >
                            Assign
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </MainCard>
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

      {/* Assign Team Members Modal Dialog */}
      <Dialog
        open={Boolean(activeTeam)}
        onClose={() => setActiveTeam(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1.5, borderBottom: '1px solid', borderColor: 'divider', fontWeight: 700 }}>
          Assign Team Members - Team {activeTeam?.padded_team_id}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {activeTeam && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Polling Station: {activeTeam.polling_station_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ward {activeTeam.ward_no} - {activeTeam.ward_name}
                </Typography>
              </Box>

              {activeTeam.posts.map((post: any, idx: number) => {
                const headerText = postHeaders[idx] || post.post_name;
                return (
                  <Stack key={post.post_mapping_id} spacing={1}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {headerText}
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Autocomplete
                        size="small"
                        options={searchOptions}
                        getOptionLabel={(option) => `${option.name} (${option.emp_code})`}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        value={modalAssignments[post.post_mapping_id] ?? null}
                        onChange={(e, newValue) => {
                          setModalAssignments((prev) => ({
                            ...prev,
                            [post.post_mapping_id]: newValue
                          }));
                        }}
                        onInputChange={(e, newInputValue, reason) => {
                          if (reason === 'input') {
                            fetchSearchEmployees(newInputValue);
                          }
                        }}
                        loading={searchLoading}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Type to search employee name or code..."
                            slotProps={{
                              input: {
                                ...params.slotProps.input,
                                endAdornment: (
                                  <>
                                    {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.slotProps.input.endAdornment}
                                  </>
                                )
                              }
                            }}
                          />
                        )}
                      />
                    </FormControl>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setActiveTeam(null)} color="inherit" disabled={saveLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveModalAssignments}
            disabled={saveLoading}
            startIcon={saveLoading ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
          >
            Save Assignments
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
