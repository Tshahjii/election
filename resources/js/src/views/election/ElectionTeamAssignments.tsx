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
import { showNotification } from 'store/slices/notificationSlice';
import { useAppPreferences } from 'contexts/AppPreferences';
import {
  useGetOptionsQuery,
  useGetUrbanDashboardQuery,
  useGetRuralDashboardQuery,
  useLazySearchEmployeesQuery,
  useSaveUrbanAssignmentsMutation,
  useSaveRuralAssignmentsMutation,
  useExemptUrbanEmployeeMutation,
  useExemptRuralEmployeeMutation
} from 'store/apiSlice';

// assets
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';

interface ElectionTeamAssignmentsProps {
  type: 'Nagar Panchayat' | 'Nagari Nikay';
}

const surfaceSx = {
  border: '1px solid',
  borderColor: 'rgba(148, 163, 184, 0.22)',
  borderRadius: 3,
  boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.97), rgba(255,255,255,0.92))'
};

const buttonSx = {
  borderRadius: 2,
  minHeight: 42,
  px: 2.75,
  textTransform: 'none',
  fontWeight: 700
};

export default function ElectionTeamAssignments({ type }: ElectionTeamAssignmentsProps) {
  const dispatch = useDispatch();

  const [selectedCityId, setSelectedCityId] = useState<number | ''>('');
  const [teamSearch, setTeamSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  const [activeTeam, setActiveTeam] = useState<any | null>(null);
  const [modalAssignments, setModalAssignments] = useState<Record<number, any | null>>({});
  const [exemptEmployeeId, setExemptEmployeeId] = useState<string>('');

  const { t } = useAppPreferences();
  const isUrban = type === 'Nagar Panchayat';

  // 1. Fetch cities options
  const { data: optionsData } = useGetOptionsQuery();

  const filteredCities = useMemo(() => {
    if (!optionsData) return [];
    return type === 'Nagar Panchayat' ? (optionsData.np_cities || []) : (optionsData.rp_cities || []);
  }, [optionsData, type]);

  // 2. Fetch dashboard data (urban vs rural)
  const hasSearch = teamSearch.trim() || employeeSearch.trim();
  const skipQuery = !selectedCityId && !hasSearch;
  const queryParams = selectedCityId ? { city_id: Number(selectedCityId) } : {};

  const urbanQuery = useGetUrbanDashboardQuery(queryParams, {
    skip: !isUrban || skipQuery
  });
  const ruralQuery = useGetRuralDashboardQuery(queryParams, {
    skip: isUrban || skipQuery
  });

  const queryResult = isUrban ? urbanQuery : ruralQuery;
  const dashboardData = queryResult.data;
  const loading = queryResult.isFetching;

  // 3. Autocomplete search employees lazy query
  const [triggerSearchEmployees, { data: searchOptionsData, isFetching: searchLoading }] = useLazySearchEmployeesQuery();
  const searchOptions = searchOptionsData || [];

  // 4. Mutations
  const [saveUrbanAssignments, { isLoading: saveUrbanLoading }] = useSaveUrbanAssignmentsMutation();
  const [saveRuralAssignments, { isLoading: saveRuralLoading }] = useSaveRuralAssignmentsMutation();
  const saveAssignments = isUrban ? saveUrbanAssignments : saveRuralAssignments;
  const saveLoading = isUrban ? saveUrbanLoading : saveRuralLoading;

  const [exemptUrbanEmployee, { isLoading: exemptUrbanLoading }] = useExemptUrbanEmployeeMutation();
  const [exemptRuralEmployee, { isLoading: exemptRuralLoading }] = useExemptRuralEmployeeMutation();
  const exemptEmployee = isUrban ? exemptUrbanEmployee : exemptRuralEmployee;
  const exemptLoading = isUrban ? exemptUrbanLoading : exemptRuralLoading;

  const postHeaders = useMemo(() => {
    if (type === 'Nagar Panchayat') {
      return [
        `P0 (${t('election.presidingOfficer')})`,
        `P1 (${t('election.pollingOfficer1')})`,
        `P2 (${t('election.pollingOfficer2')})`,
        `P3 (${t('election.pollingOfficer3')})`
      ];
    }
    return [
      `P0 (${t('election.presidingOfficer')})`,
      `P1 (${t('election.pollingOfficer1')})`,
      `P2 (${t('election.pollingOfficer2')})`,
      `P3 (${t('election.pollingOfficer3')})`,
      `P4 (${t('election.pollingOfficer4')})`
    ];
  }, [type, t]);

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

    return dashboardData.teams.filter((team: any) => {
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

  const handleExemptEmployee = async () => {
    const trimmed = String(exemptEmployeeId).trim();
    if (!trimmed) {
      dispatch(showNotification({ message: t('election.enterEmpId'), severity: 'error' }));
      return;
    }

    try {
      const response = await exemptEmployee({ emp_code: trimmed }).unwrap();
      dispatch(showNotification({ message: response.message || t('election.exemptSuccess'), severity: 'success' }));
      setExemptEmployeeId('');
    } catch (err: any) {
      const errMsg = err.data?.message || err.message || t('election.exemptFailed');
      dispatch(showNotification({ message: errMsg, severity: 'error' }));
    }
  };

  const handleOpenAssignModal = (team: any) => {
    setActiveTeam(team);
    const initial: Record<number, any | null> = {};
    (team.posts || []).forEach((post: any) => {
      initial[post.post_mapping_id] = post.emp_id ? { id: post.emp_id, name: post.employee_name, emp_code: post.employee_code } : null;
    });
    setModalAssignments(initial);
    triggerSearchEmployees({ q: '' });
  };

  const handleSaveModalAssignments = async () => {
    if (!activeTeam) return;

    const payload = Object.keys(modalAssignments).map((key) => ({
      post_mapping_id: Number(key),
      emp_id: modalAssignments[Number(key)] ? modalAssignments[Number(key)].id : null
    }));

    try {
      const response = await saveAssignments({ assignments: payload }).unwrap();
      dispatch(showNotification({ message: response.message || t('election.saveSuccess'), severity: 'success' }));
      setActiveTeam(null);
    } catch (error: any) {
      const errMsg = error.data?.message || error.message || t('election.saveFailed');
      dispatch(showNotification({ message: errMsg, severity: 'error' }));
    }
  };

  useEffect(() => {
    setSelectedCityId('');
    setTeamSearch('');
    setEmployeeSearch('');
    setActiveTeam(null);
  }, [type]);

  useEffect(() => {
    setTeamSearch('');
    setEmployeeSearch('');
  }, [selectedCityId]);

  return (
    <Stack sx={{ gap: 3 }}>
      {/* Heading removed to avoid duplicate titles when embedded in dashboard */}

      <Card sx={{ ...surfaceSx, p: { xs: 2, sm: 2.5 } }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <ChosenSelect
                label={isUrban ? t('election.selectNpCity') : t('election.selectRnCity')}
                placeholder={t('election.chooseCity')}
                value={selectedCityId}
                options={filteredCities.map((city: any) => ({ value: city.id, label: city.karyalay_name || city.city_name }))}
                onChange={(event) => setSelectedCityId(event.target.value)}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label={t('election.searchTeam')}
              placeholder={t('election.searchTeamPlaceholder')}
              value={teamSearch}
              onChange={(event) => setTeamSearch(event.target.value)}
              disabled={loading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label={t('election.searchEmp')}
              placeholder={t('election.searchEmpPlaceholder2')}
              value={employeeSearch}
              onChange={(event) => setEmployeeSearch(event.target.value)}
              disabled={loading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
        <Box sx={{ ...surfaceSx, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: { xs: 4, sm: 7 }, borderStyle: 'dashed', textAlign: 'center' }}>
          <PeopleAltOutlined style={{ fontSize: '44px', color: '#64748b', marginBottom: '14px' }} />
          <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 600 }}>
            {t('election.searchIntro')}
          </Typography>
        </Box>
      )}

      {!loading && (teamSearch.trim() || employeeSearch.trim()) && (
        <MainCard title={`${isUrban ? t('menu.nagarPanchayat') : t('menu.nagariNikay')} ${t('election.teamAssignments')}`} sx={surfaceSx} contentSX={{ p: 0 }}>
          {searchedTeams.length > 0 ? (
            <TableContainer>
              <Table size="small" sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell align="center" sx={{ width: 90, fontWeight: 800, whiteSpace: 'nowrap' }}>
                      {t('election.teamId')}
                    </TableCell>
                    <TableCell sx={{ minWidth: 170, fontWeight: 800 }}>{t('election.stationWard')}</TableCell>
                    {postHeaders.map((header) => (
                      <TableCell key={header} sx={{ minWidth: 190, fontWeight: 800 }}>
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {searchedTeams.map((team: any) => (
                    <TableRow key={team.team_id} hover>
                      <TableCell align="center">
                        <Chip label={team.padded_team_id} color="primary" variant="outlined" size="small" style={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {team.polling_station_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('masters.ward')} {team.ward_no} - {team.ward_name}
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
                              {t('election.notAssigned')}
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
                {t('election.noTeamRecord')}
              </Typography>
            </Box>
          )}
        </MainCard>
      )}


      <Dialog open={Boolean(activeTeam)} onClose={() => setActiveTeam(null)} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ pb: 1.5, borderBottom: '1px solid', borderColor: 'divider', fontWeight: 700 }}>
          {t('election.assignMembers')} - {t('election.teamId')} {activeTeam?.padded_team_id}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {activeTeam && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {t('field.pollingStationName')}: {activeTeam.polling_station_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('masters.ward')} {activeTeam.ward_no} - {activeTeam.ward_name}
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
                            triggerSearchEmployees({ q: newInputValue });
                          }
                        }}
                        loading={searchLoading}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder={t('election.searchEmpPlaceholder')}
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
          <Button onClick={() => setActiveTeam(null)} color="inherit" disabled={saveLoading} sx={{ borderRadius: 1.5 }}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveModalAssignments}
            disabled={saveLoading}
            startIcon={saveLoading ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
            sx={{ borderRadius: 1.5 }}
          >
            {t('election.saveAssignments')}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Exempt Employee Card */}
      <MainCard title={t('election.exemptTitle')} sx={{ ...surfaceSx, mt: 2 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label={t('election.searchEmp')}
              placeholder={t('election.searchEmpPlaceholderExempt')}
              value={exemptEmployeeId}
              onChange={(e) => setExemptEmployeeId(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack direction="row" spacing={2} sx={{ justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
              <Button
                fullWidth
                type="button"
                variant="contained"
                color="secondary"
                disabled={exemptLoading}
                onClick={handleExemptEmployee}
                sx={{ ...buttonSx, width: { xs: '100%', md: 'auto' } }}
              >
                {exemptLoading ? <CircularProgress size={18} color="inherit" /> : t('election.exemptBtn')}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </MainCard>
    </Stack>
  );
}
