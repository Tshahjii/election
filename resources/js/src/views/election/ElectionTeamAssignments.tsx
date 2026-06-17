import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
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
import Autocomplete from '@mui/material/Autocomplete';

// project imports
import MainCard from 'components/cards/MainCard';
import ChosenSelect from 'components/ChosenSelect';
import apiClient from 'api/client';
import { showNotification } from 'store/slices/notificationSlice';

// assets
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';

interface ElectionTeamAssignmentsProps {
  type: 'Nagar Panchayat' | 'Nagari Nikay';
}

export default function ElectionTeamAssignments({ type }: ElectionTeamAssignmentsProps) {
  const dispatch = useDispatch();
  const apiPrefix = type === 'Nagar Panchayat' ? '/urban-election' : '/rural-election';

  const postHeaders = useMemo(() => {
    if (type === 'Nagar Panchayat') {
      return ['P0 (Presiding Officer)', 'P1 (Officer 1)', 'P2 (Officer 2)', 'P3 (Officer 3)'];
    }
    return ['P0 (Presiding Officer)', 'P1 (Officer 1)', 'P2 (Officer 2)', 'P3 (Officer 3)', 'P4 (Officer 4)'];
  }, [type]);

  const [cities, setCities] = useState<any[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | ''>('');
  const [teamSearch, setTeamSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<{ city_id?: number | null; teams: any[] } | null>(null);

  const [activeTeam, setActiveTeam] = useState<any | null>(null);
  const [modalAssignments, setModalAssignments] = useState<Record<number, any | null>>({});
  const [searchOptions, setSearchOptions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [exemptEmployeeId, setExemptEmployeeId] = useState<string>('');
  const [exemptLoading, setExemptLoading] = useState(false);

  const filteredCities = useMemo(() => {
    if (type === 'Nagar Panchayat') {
      return cities.filter((city) => city.city_type === 'urban');
    }
    return cities.filter((city) => city.city_type === 'rural');
  }, [cities, type]);

  const searchedTeams = useMemo(() => {
    const teamTerms = teamSearch
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    const employeeTerms = employeeSearch
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    if (!dashboardData) return [];

    return dashboardData.teams.filter((team) => {
      const padded = String(team.padded_team_id || '').toLowerCase();
      const raw = String(team.team_id || '').toLowerCase();
      const postMatches = Array.isArray(team.posts)
        ? team.posts.some((post: any) => {
            const employeeCode = String(post.employee_code || '').toLowerCase();
            const employeeName = String(post.employee_name || '').toLowerCase();
            const employeeId = String(post.emp_id || '').toLowerCase();
            return (
              employeeTerms.some((term) => employeeCode.includes(term) || employeeName.includes(term) || employeeId.includes(term))
            );
          })
        : false;

      const teamHit = teamTerms.length > 0 && teamTerms.some((term) => padded.includes(term) || raw.includes(term));
      const employeeHit = employeeTerms.length > 0 && postMatches;

      if (teamTerms.length > 0 && employeeTerms.length > 0) {
        return teamHit && employeeHit;
      }
      if (teamTerms.length > 0) {
        return teamHit;
      }
      if (employeeTerms.length > 0) {
        return employeeHit;
      }

      return false;
    });
  }, [dashboardData, teamSearch, employeeSearch]);

  const fetchCities = async () => {
    try {
      const response = await apiClient.get('/masters/options');
      setCities(response.data.cities || []);
    } catch (error) {
      dispatch(showNotification({ message: 'Failed to load cities.', severity: 'error' }));
    }
  };

  const loadDashboardData = async (cityId?: number | null) => {
    setLoading(true);
    try {
      const params = cityId ? { city_id: cityId } : {};
      const response = await apiClient.get(`${apiPrefix}/dashboard-data`, { params });
      setDashboardData(response.data);
    } catch (error) {
      dispatch(showNotification({ message: 'Failed to fetch team assignments.', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

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

  const handleExemptEmployee = async () => {
    const trimmed = String(exemptEmployeeId).trim();
    if (!trimmed) {
      dispatch(showNotification({ message: 'Please enter Employee ID or Code.', severity: 'error' }));
      return;
    }

    setExemptLoading(true);
    try {
      const response = await apiClient.post(`${apiPrefix}/exempt-employee`, {
        emp_code: trimmed
      });

      dispatch(showNotification({ message: response.data.message, severity: 'success' }));
      setExemptEmployeeId('');

      setDashboardData((prev) => {
        if (!prev) return prev;
        const normalized = trimmed.toLowerCase();
        return {
          ...prev,
          teams: prev.teams.map((team: any) => ({
            ...team,
            posts: (team.posts || []).map((post: any) => {
              const codeMatch = String(post.employee_code || '').toLowerCase() === normalized;
              const idMatch = String(post.emp_id || '').toLowerCase() === normalized;
              return codeMatch || idMatch
                ? { ...post, emp_id: null, employee_code: '', employee_name: '' }
                : post;
            })
          }))
        };
      });

      await loadDashboardData(selectedCityId ? Number(selectedCityId) : undefined);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to exempt employee.';
      dispatch(showNotification({ message: errMsg, severity: 'error' }));
    } finally {
      setExemptLoading(false);
    }
  };

  const handleOpenAssignModal = (team: any) => {
    setActiveTeam(team);
    const initial: Record<number, any | null> = {};
    (team.posts || []).forEach((post: any) => {
      initial[post.post_mapping_id] = post.emp_id ? { id: post.emp_id, name: post.employee_name, emp_code: post.employee_code } : null;
    });
    setModalAssignments(initial);
    fetchSearchEmployees('');
  };

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
    } catch (error) {
      dispatch(showNotification({ message: 'Failed to save assignments.', severity: 'error' }));
    } finally {
      setSaveLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    setSelectedCityId('');
    setTeamSearch('');
    setEmployeeSearch('');
    setDashboardData(null);
    setActiveTeam(null);
  }, [type]);

  useEffect(() => {
    setTeamSearch('');
    setEmployeeSearch('');
    if (selectedCityId) {
      loadDashboardData(Number(selectedCityId));
    } else {
      setDashboardData(null);
    }
  }, [selectedCityId]);

  useEffect(() => {
    const hasSearch = teamSearch.trim() || employeeSearch.trim();
    if (!hasSearch) return;

    if (!selectedCityId && !dashboardData) {
      loadDashboardData();
    }
  }, [teamSearch, employeeSearch, selectedCityId, dashboardData]);

  return (
    <Stack sx={{ gap: 3 }}>
      {/* Heading removed to avoid duplicate titles when embedded in dashboard */}

      <Card sx={{ p: 2.5, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <ChosenSelect
                label={`Select ${type} City`}
                placeholder="Choose a city..."
                value={selectedCityId}
                options={filteredCities.map((city) => ({ value: city.id, label: city.karyalay_name || city.city_name }))}
                onChange={(event) => setSelectedCityId(event.target.value)}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Search Team ID"
              placeholder="Example: 0001, 0002 or 1, 2"
              value={teamSearch}
              onChange={(event) => setTeamSearch(event.target.value)}
              disabled={loading}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Search Employee ID/Code"
              placeholder="Example: NIC001 or 123"
              value={employeeSearch}
              onChange={(event) => setEmployeeSearch(event.target.value)}
              disabled={loading}
            />
          </Grid>
        </Grid>
      </Card>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && !teamSearch.trim() && !employeeSearch.trim() && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 7, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
          <PeopleAltOutlined style={{ fontSize: '44px', color: 'gray', marginBottom: '14px' }} />
          <Typography variant="h5" color="text.secondary">
            Search by Team ID or Employee ID/Code. City selection is optional.
          </Typography>
        </Box>
      )}

      {!loading && (teamSearch.trim() || employeeSearch.trim()) && (
        <MainCard title={`${type} Polling Team Assignments`} sx={{ borderRadius: 2, boxShadow: '0 10px 30px rgba(16, 60, 92, 0.08)' }}>
          {searchedTeams.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" style={{ width: '80px', fontWeight: 700 }}>
                      Team ID
                    </TableCell>
                    <TableCell style={{ minWidth: '150px', fontWeight: 700 }}>Polling Station / Ward</TableCell>
                    {postHeaders.map((header) => (
                      <TableCell key={header} style={{ fontWeight: 700 }}>
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {searchedTeams.map((team) => (
                    <TableRow key={team.team_id} hover>
                      <TableCell align="center">
                        <Chip label={team.padded_team_id} color="primary" variant="outlined" size="small" style={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {team.polling_station_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Ward {team.ward_no} - {team.ward_name}
                        </Typography>
                      </TableCell>
                      {team.posts.map((post: any) => (
                        <TableCell key={post.post_mapping_id}>
                          {post.emp_id ? (
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.main' }}>
                              {post.employee_name} ({post.employee_code})
                            </Typography>
                          ) : (
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main', fontStyle: 'italic' }}>
                              Not Assigned
                            </Typography>
                          )}
                        </TableCell>
                      ))}
                      {/* Actions removed as requested */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5" color="text.secondary">
                Is Team ID ka record nahi mila.
              </Typography>
            </Box>
          )}
        </MainCard>
      )}


      <Dialog open={Boolean(activeTeam)} onClose={() => setActiveTeam(null)} maxWidth="sm" fullWidth>
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
                        onChange={(event, newValue) => {
                          setModalAssignments((prev) => ({
                            ...prev,
                            [post.post_mapping_id]: newValue
                          }));
                        }}
                        onInputChange={(event, newInputValue, reason) => {
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
      {/* Exempt Employee Card */}
      <MainCard title="Exempt Employee from Assignments" sx={{ mt: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Employee ID or Code"
              placeholder="Enter employee id or code (e.g. NIC001)"
              value={exemptEmployeeId}
              onChange={(e) => setExemptEmployeeId(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
              <Button
                type="button"
                variant="contained"
                color="secondary"
                disabled={exemptLoading}
                onClick={handleExemptEmployee}
              >
                {exemptLoading ? <CircularProgress size={18} color="inherit" /> : 'Exempt Employee'}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </MainCard>
    </Stack>
  );
}
