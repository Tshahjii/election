import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';

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
import PaginationFooter from 'components/PaginationFooter';
import { showNotification } from 'store/slices/notificationSlice';
import { useAppPreferences } from 'contexts/AppPreferences';
import TableSortLabel from '@mui/material/TableSortLabel';
import {
  useGetOptionsQuery,
  useGetUrbanDashboardQuery,
  useGetRuralDashboardQuery,
  useLazySearchEmployeesQuery,
  useSaveUrbanAssignmentsMutation,
  useSaveRuralAssignmentsMutation,
  useExemptUrbanEmployeeMutation,
  useExemptRuralEmployeeMutation,
  useCreateUrbanTeamsMutation,
  useCreateRuralTeamsMutation,
  useApplyUrbanTargetedDutyMutation,
  useApplyRuralTargetedDutyMutation,
  useGetExemptEmployeeLogsQuery
} from 'store/apiSlice';

// assets
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
const SearchTextField = ({ value, onChange, ...props }: any) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [localValue, onChange, value]);

  return (
    <TextField
      {...props}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
    />
  );
};

interface ElectionTeamAssignmentsProps {
  type: 'Nagar Panchayat' | 'Nagari Nikay';
}

const getSurfaceSx = (theme: any) => ({
  border: '1px solid',
  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(148, 163, 184, 0.22)',
  borderRadius: 3,
  boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 18px 45px rgba(15, 23, 42, 0.08)',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(180deg, rgba(17, 28, 46, 0.95), rgba(12, 20, 34, 0.9))'
    : 'linear-gradient(180deg, rgba(255,255,255,0.97), rgba(255,255,255,0.92))'
});

const buttonSx = {
  borderRadius: 2,
  minHeight: 42,
  px: 2.75,
  textTransform: 'none',
  fontWeight: 700
};

interface ExemptEmployeeFormProps {
  onExempt: (empCode: string, reason: string, scope: 'both' | 'urban' | 'rural') => Promise<void>;
  loading: boolean;
}

function ExemptEmployeeForm({ onExempt, loading }: ExemptEmployeeFormProps) {
  const { t } = useAppPreferences();
  const [empCode, setEmpCode] = useState('');
  const [reason, setReason] = useState('');
  const [scope, setScope] = useState<'both' | 'urban' | 'rural'>('both');

  const handleSubmit = async () => {
    const trimmed = empCode.trim();
    if (!trimmed) {
      return;
    }
    await onExempt(trimmed, reason, scope);
    setEmpCode('');
    setReason('');
    setScope('both');
  };

  return (
    <MainCard title={t('election.exemptTitle')} sx={(theme) => ({ ...getSurfaceSx(theme) })}>
      <Grid container spacing={2} sx={{ alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            label={t('election.searchEmp')}
            placeholder={t('election.searchEmpPlaceholderExempt')}
            value={empCode}
            onChange={(e) => setEmpCode(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <ChosenSelect
            label={t('election.exemptScopeLabel') || 'Exemption Scope'}
            value={scope}
            options={[
              { value: 'both', label: t('election.exemptScopeBoth') || 'Both (Urban & Rural)' },
              { value: 'urban', label: t('election.exemptScopeUrban') || 'Urban Only' },
              { value: 'rural', label: t('election.exemptScopeRural') || 'Rural Only' }
            ]}
            onChange={(e) => setScope(e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            size="small"
            label={t('election.exemptReasonLabel')}
            placeholder={t('election.exemptReasonPlaceholder')}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <Button
            fullWidth
            type="button"
            variant="contained"
            color="secondary"
            disabled={loading}
            onClick={handleSubmit}
            sx={{ ...buttonSx, height: 40 }}
          >
            {loading ? <CircularProgress size={18} color="inherit" /> : t('election.exemptBtn')}
          </Button>
        </Grid>
      </Grid>
    </MainCard>
  );
}

export default function ElectionTeamAssignments({ type }: ElectionTeamAssignmentsProps) {
  const dispatch = useDispatch();

  const [selectedCityId, setSelectedCityId] = useState<number | ''>('');
  const [teamSearch, setTeamSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [logPage, setLogPage] = useState(1);
  const [logRowsPerPage, setLogRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>('padded_team_id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [activeTeam, setActiveTeam] = useState<any | null>(null);
  const [modalAssignments, setModalAssignments] = useState<Record<number, any | null>>({});

  const [activeTargetedDuty, setActiveTargetedDuty] = useState<{
    city_id: number;
    city_name: string;
    post_name: string;
    vacant_count: number;
  } | null>(null);

  const [targetedGender, setTargetedGender] = useState<'male' | 'female' | 'any'>('any');
  const [targetedDesignationId, setTargetedDesignationId] = useState<number | ''>('');
  const [targetedLimit, setTargetedLimit] = useState<number>(0);

  const { t } = useAppPreferences();
  const isUrban = type === 'Nagar Panchayat';

  // 1. Fetch cities options
  const { data: optionsData } = useGetOptionsQuery();

  const filteredCities = useMemo(() => {
    if (!optionsData) return [];
    return type === 'Nagar Panchayat' ? (optionsData.np_cities || []) : (optionsData.rp_cities || []);
  }, [optionsData, type]);

  // 2. Fetch dashboard data (urban vs rural)
  const skipQuery = false;
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

  const [createUrbanTeams, { isLoading: urbanCreateLoading }] = useCreateUrbanTeamsMutation();
  const [createRuralTeams, { isLoading: ruralCreateLoading }] = useCreateRuralTeamsMutation();
  const createTeams = isUrban ? createUrbanTeams : createRuralTeams;
  const createLoading = isUrban ? urbanCreateLoading : ruralCreateLoading;

  // 5. Fetch exempt employee logs
  const { data: logsData, isFetching: logsLoading } = useGetExemptEmployeeLogsQuery();
  const logs = logsData || [];

  const paginatedLogs = useMemo(() => {
    const startIndex = (logPage - 1) * logRowsPerPage;
    return logs.slice(startIndex, startIndex + logRowsPerPage);
  }, [logs, logPage, logRowsPerPage]);

  const [applyUrbanTargetedDuty, { isLoading: applyUrbanTargetedLoading }] = useApplyUrbanTargetedDutyMutation();
  const [applyRuralTargetedDuty, { isLoading: applyRuralTargetedLoading }] = useApplyRuralTargetedDutyMutation();
  const applyTargetedDuty = isUrban ? applyUrbanTargetedDuty : applyRuralTargetedDuty;
  const applyTargetedLoading = isUrban ? applyUrbanTargetedLoading : applyRuralTargetedLoading;

  const handleApplyTargetedDuty = async () => {
    if (!activeTargetedDuty) return;
    try {
      const response = await applyTargetedDuty({
        city_id: activeTargetedDuty.city_id,
        post_name: activeTargetedDuty.post_name,
        gender: targetedGender,
        designation_id: targetedDesignationId || null,
        limit: targetedLimit
      }).unwrap();

      dispatch(showNotification({ message: response.message || t('common.success'), type: 'success' }));
      setActiveTargetedDuty(null);
    } catch (error: any) {
      dispatch(showNotification({ message: error.data?.message || t('common.error'), type: 'error' }));
    }
  };

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

      return true;
    });
  }, [dashboardData, teamSearch, employeeSearch]);

  const handleRequestSort = (field: string) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
    setPage(1);
  };

  const sortedTeams = useMemo(() => {
    if (!sortField) return searchedTeams;

    return [...searchedTeams].sort((a: any, b: any) => {
      let valA: any = '';
      let valB: any = '';

      if (sortField === 'padded_team_id') {
        valA = Number(a.team_id) || 0;
        valB = Number(b.team_id) || 0;
      } else if (sortField === 'station') {
        valA = String(a.polling_station_name || '').toLowerCase();
        valB = String(b.polling_station_name || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [searchedTeams, sortField, sortOrder]);

  const paginatedTeams = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    return sortedTeams.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedTeams, page, rowsPerPage]);

  const handleExemptEmployee = async (empCode: string, reason: string, scope: 'both' | 'urban' | 'rural') => {
    try {
      const response = await exemptEmployee({ emp_code: empCode, reason, scope }).unwrap();
      dispatch(showNotification({ message: response.message || t('election.exemptSuccess'), severity: 'success' }));
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
    triggerSearchEmployees({ q: '', city_type: isUrban ? 'urban' : 'rural', city_id: team.city_id });
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
    setPage(1);
  }, [type]);

  useEffect(() => {
    setTeamSearch('');
    setEmployeeSearch('');
    setPage(1);
  }, [selectedCityId]);

  return (
    <Stack sx={{ gap: 3 }}>
      {/* City Selector and Search Card */}
      <Card sx={(theme) => ({ ...getSurfaceSx(theme), p: { xs: 2, sm: 2.5 } })}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
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
          <Grid size={{ xs: 12, md: 3 }}>
            <SearchTextField
              fullWidth
              size="small"
              label={t('election.searchTeam')}
              placeholder={t('election.searchTeamPlaceholder')}
              value={teamSearch}
              onChange={(value: string) => {
                setTeamSearch(value);
                setPage(1);
              }}
              disabled={loading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <SearchTextField
              fullWidth
              size="small"
              label={t('election.searchEmp')}
              placeholder={t('election.searchEmpPlaceholder2')}
              value={employeeSearch}
              onChange={(value: string) => {
                setEmployeeSearch(value);
                setPage(1);
              }}
              disabled={loading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <ChosenSelect
                label={t('common.rows') || 'Rows'}
                value={rowsPerPage}
                options={[10, 25, 50, 100].map((value) => ({ value, label: `${value} ${t('common.rows') || 'rows'}` }))}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setPage(1);
                }}
              />
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Vacant Duty Summary Table of Cities */}
      {!loading && !selectedCityId && !teamSearch.trim() && !employeeSearch.trim() && dashboardData?.vacant_by_city && (
        <MainCard
          title={`${isUrban ? 'Nagar Panchayat' : 'Nagari Nikay'} Vacant Duty Summary`}
          sx={getSurfaceSx}
          contentSX={{ p: 0 }}
        >
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'bg.100' }}>
                  <TableCell align="center" sx={{ width: 80, fontWeight: 800 }}>
                    {t('common.sno')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>
                    {isUrban ? t('election.selectNpCity') : t('election.selectRnCity')}
                  </TableCell>
                  {postHeaders.map((header) => (
                    <TableCell key={header} align="center" sx={{ fontWeight: 800 }}>
                      {header}
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ width: 120, fontWeight: 800 }}>
                    {t('common.action')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboardData.vacant_by_city.map((cityData: any, index: number) => (
                  <TableRow key={cityData.city_id} hover>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="text"
                        onClick={() => setSelectedCityId(cityData.city_id)}
                        sx={{
                          fontWeight: 700,
                          textAlign: 'left',
                          justifyContent: 'flex-start',
                          p: 0,
                          textTransform: 'none',
                          color: 'primary.main',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {cityData.city_name}
                      </Button>
                    </TableCell>
                    {postHeaders.map((_, idx) => {
                      const postName = `P${idx}`;
                      const count = cityData.vacant?.[postName] ?? 0;
                      const isClickable = count > 0;
                      return (
                        <TableCell key={postName} align="center">
                          <Chip
                            label={count}
                            color={count > 0 ? 'error' : 'success'}
                            variant={count > 0 ? 'filled' : 'outlined'}
                            size="small"
                            onClick={
                              isClickable
                                ? () => {
                                    setActiveTargetedDuty({
                                      city_id: cityData.city_id,
                                      city_name: cityData.city_name,
                                      post_name: postName,
                                      vacant_count: count
                                    });
                                    setTargetedGender('any');
                                    setTargetedDesignationId('');
                                    setTargetedLimit(count);
                                  }
                                : undefined
                            }
                            sx={{
                              fontWeight: 700,
                              minWidth: 42,
                              cursor: isClickable ? 'pointer' : 'default',
                              '&:hover': isClickable
                                ? {
                                    opacity: 0.85,
                                    transform: 'scale(1.05)',
                                    transition: 'all 0.2s ease-in-out'
                                  }
                                : {}
                            }}
                          />
                        </TableCell>
                      );
                    })}
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => setSelectedCityId(cityData.city_id)}
                        sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                      >
                        {t('common.view')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </MainCard>
      )}

      {!loading && (selectedCityId || teamSearch.trim() || employeeSearch.trim()) && (
        <MainCard title={`${isUrban ? t('menu.nagarPanchayat') : t('menu.nagariNikay')} ${t('election.teamAssignments')}`} sx={getSurfaceSx} contentSX={{ p: 0 }}>
          {dashboardData?.teams && dashboardData.teams.length > 0 ? (
            searchedTeams.length > 0 ? (
              <>
                <TableContainer>
                  <Table size="small" sx={{ minWidth: 900 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'bg.100' }}>
                        <TableCell align="center" sx={{ width: 90, fontWeight: 800, whiteSpace: 'nowrap' }}>
                          <TableSortLabel
                            active={sortField === 'padded_team_id'}
                            direction={sortField === 'padded_team_id' ? sortOrder : 'asc'}
                            onClick={() => handleRequestSort('padded_team_id')}
                          >
                            {t('election.teamId')}
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ minWidth: 170, fontWeight: 800 }}>
                          <TableSortLabel
                            active={sortField === 'station'}
                            direction={sortField === 'station' ? sortOrder : 'asc'}
                            onClick={() => handleRequestSort('station')}
                          >
                            {t('election.stationWard')}
                          </TableSortLabel>
                        </TableCell>
                        {postHeaders.map((header) => (
                          <TableCell key={header} sx={{ minWidth: 190, fontWeight: 800 }}>
                            {header}
                          </TableCell>
                        ))}
                        <TableCell align="center" sx={{ width: 100, fontWeight: 800 }}>
                          {t('common.action')}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedTeams.map((team: any) => (
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
                          <TableCell align="center">
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleOpenAssignModal(team)}
                              sx={{ borderRadius: 1.5 }}
                            >
                              {t('common.update')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <PaginationFooter
                    page={page}
                    rowsPerPage={rowsPerPage}
                    totalRows={searchedTeams.length}
                    onPageChange={setPage}
                  />
                </Box>
              </>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h5" color="text.secondary">
                  {t('election.noTeamRecord') || 'कोई मिलान रिकॉर्ड नहीं मिला।'}
                </Typography>
              </Box>
            )
          ) : (
            <Box sx={{ p: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Typography variant="h5" color="text.secondary">
                इस शहर के लिए अभी तक कोई मतदान टीम जनरेट नहीं की गई है।
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450 }}>
                टीम असाइनमेंट देखने और ड्यूटी लगाने से पहले आपको मतदान टीमें बनानी होंगी।
              </Typography>
              <Button
                variant="contained"
                color="primary"
                disabled={createLoading}
                onClick={async () => {
                  try {
                    const response = await createTeams({ city_id: Number(selectedCityId) }).unwrap();
                    dispatch(showNotification({ message: response.message || 'टीमें सफलतापूर्वक जनरेट की गईं।', severity: 'success' }));
                  } catch (err: any) {
                    const errMsg = err.data?.message || err.message || 'टीमें जनरेट करने में विफल।';
                    dispatch(showNotification({ message: errMsg, severity: 'error' }));
                  }
                }}
                startIcon={createLoading ? <CircularProgress size={16} color="inherit" /> : <PeopleAltOutlined />}
                sx={{ borderRadius: 1.5, mt: 1 }}
              >
                {createLoading ? 'टीमें जनरेट हो रही हैं...' : 'मतदान टीमें जनरेट करें'}
              </Button>
            </Box>
          )}
        </MainCard>
      )}

      {/* Exempt Employee Card placed at the bottom */}
      <ExemptEmployeeForm onExempt={handleExemptEmployee} loading={exemptLoading} />

      {/* Exempt Employee Logs Card */}
      <MainCard title={t('election.exemptLogsTitle') || 'Exempted Employees Log History'} sx={(theme) => ({ ...getSurfaceSx(theme) })} contentSX={{ p: 0 }}>
        {logsLoading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress />
          </Box>
        ) : logs.length > 0 ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'bg.100' }}>
                    <TableCell align="center" sx={{ width: 80, fontWeight: 800 }}>{t('common.sno') || 'S.No'}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{t('election.empCode') || 'Employee Code'}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{t('election.empName') || 'Employee Name'}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{t('masters.designation') || 'Designation'}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>{t('election.urbanPost') || 'Urban Post'}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>{t('election.ruralPost') || 'Rural Post'}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{t('election.exemptReasonLabel') || 'Reason'}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{t('election.dateTime') || 'Date & Time'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedLogs.map((log: any, idx: number) => {
                    const serialNumber = (logPage - 1) * logRowsPerPage + idx + 1;
                    const formattedDate = new Date(log.created_at).toLocaleString();
                    return (
                      <TableRow key={log.id} hover>
                        <TableCell align="center">{serialNumber}</TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{log.emp_code}</Typography>
                        </TableCell>
                        <TableCell>{log.employee?.name || '-'}</TableCell>
                        <TableCell>{log.employee?.designation?.designation || log.employee?.designation?.name || '-'}</TableCell>
                        <TableCell align="center">
                          {log.urban_post ? (
                            <Chip label={log.urban_post} color="warning" size="small" variant="outlined" style={{ fontWeight: 600 }} />
                          ) : (
                            <Typography variant="caption" color="text.secondary">N/A</Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {log.rural_post ? (
                            <Chip label={log.rural_post} color="info" size="small" variant="outlined" style={{ fontWeight: 600 }} />
                          ) : (
                            <Typography variant="caption" color="text.secondary">N/A</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 220, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {log.urban_reason && (
                            <Typography variant="body2" sx={{ fontSize: '0.825rem' }}>
                              <strong>Urban: </strong>{log.urban_reason}
                            </Typography>
                          )}
                          {log.rural_reason && (
                            <Typography variant="body2" sx={{ fontSize: '0.825rem', mt: log.urban_reason ? 0.5 : 0 }}>
                              <strong>Rural: </strong>{log.rural_reason}
                            </Typography>
                          )}
                          {!log.urban_reason && !log.rural_reason && '-'}
                        </TableCell>
                        <TableCell>{formattedDate}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <PaginationFooter
                page={logPage}
                rowsPerPage={logRowsPerPage}
                totalRows={logs.length}
                onPageChange={setLogPage}
              />
            </Box>
          </>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              {t('common.noRecords') || 'No logs found.'}
            </Typography>
          </Box>
        )}
      </MainCard>


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
                        options={searchOptions.filter((opt: any) => {
                          const currentVal = modalAssignments[post.post_mapping_id];
                          if (currentVal && currentVal.id === opt.id) return true;
                          return !Object.entries(modalAssignments).some(([key, val]: any) => 
                            Number(key) !== post.post_mapping_id && val && val.id === opt.id
                          );
                        })}
                        getOptionLabel={(option) => {
                          if (option && typeof option === 'object' && 'name' in option) {
                            const designationText = option.designation && typeof option.designation === 'object' && 'designation' in option.designation
                              ? ` - ${option.designation.designation}`
                              : '';
                            return `${option.name} (${option.emp_code || ''})${designationText}`;
                          }
                          return '';
                        }}
                        isOptionEqualToValue={(option, value) => Boolean(option && value && option.id === value.id)}
                        value={modalAssignments[post.post_mapping_id] ?? null}
                        onChange={(event, newValue) => {
                          setModalAssignments((prev) => ({
                            ...prev,
                            [post.post_mapping_id]: newValue
                          }));
                        }}
                        onOpen={() => {
                          triggerSearchEmployees({
                            q: '',
                            post_name: post.post_name,
                            city_type: isUrban ? 'urban' : 'rural',
                            city_id: activeTeam?.city_id
                          });
                        }}
                        onInputChange={(event, newInputValue, reason) => {
                          if (reason === 'input') {
                            triggerSearchEmployees({
                              q: newInputValue,
                              post_name: post.post_name,
                              city_type: isUrban ? 'urban' : 'rural',
                              city_id: activeTeam?.city_id
                            });
                          }
                        }}
                        loading={searchLoading}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder={t('election.searchEmpPlaceholder')}
                            slotProps={{
                              ...params.slotProps,
                              input: {
                                ...params.slotProps?.input,
                                endAdornment: (
                                  <>
                                    {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.slotProps?.input?.endAdornment}
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

      <Dialog
        open={Boolean(activeTargetedDuty)}
        onClose={() => setActiveTargetedDuty(null)}
        maxWidth="xs"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 2.5 } }}
      >
        <DialogTitle sx={{ pb: 1.5, borderBottom: '1px solid', borderColor: 'divider', fontWeight: 700 }}>
          {t('election.assignRandomDuties') || 'Assign Random Duties'} - {activeTargetedDuty?.post_name}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {activeTargetedDuty && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {isUrban ? t('menu.nagarPanchayat') : t('menu.nagariNikay')}: {activeTargetedDuty.city_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('election.vacantCount') || 'Vacant Count'}: {activeTargetedDuty.vacant_count}
                </Typography>
              </Box>

              {/* Gender Criteria Select */}
              <FormControl fullWidth size="small">
                <ChosenSelect
                  label={t('field.gender') || 'Gender'}
                  placeholder={t('field.genderPlaceholder') || 'Select gender'}
                  value={targetedGender}
                  options={[
                    { value: 'any', label: t('common.any') || 'Any' },
                    { value: 'male', label: t('common.male') || 'Male' },
                    { value: 'female', label: t('common.female') || 'Female' }
                  ]}
                  onChange={(e) => setTargetedGender(e.target.value)}
                  required
                />
              </FormControl>

              {/* Designation Options Select */}
              <FormControl fullWidth size="small">
                <ChosenSelect
                  label={t('field.designation') || 'Designation'}
                  placeholder={t('field.designationPlaceholder') || 'Select designation'}
                  value={targetedDesignationId}
                  options={[
                    { value: '', label: t('common.all') || 'All Designations' },
                    ...(optionsData?.designations || []).map((d: any) => ({
                      value: d.id,
                      label: d.designation
                    }))
                  ]}
                  onChange={(e) => setTargetedDesignationId(e.target.value)}
                />
              </FormControl>

              {/* Count Limit Input */}
              <TextField
                fullWidth
                size="small"
                type="number"
                label={t('election.dutyCount') || 'Number of Duties to Assign'}
                value={targetedLimit}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(activeTargetedDuty.vacant_count, Number(e.target.value)));
                  setTargetedLimit(val);
                }}
                slotProps={{
                  htmlInput: {
                    min: 1,
                    max: activeTargetedDuty.vacant_count
                  }
                }}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setActiveTargetedDuty(null)} color="inherit" disabled={applyTargetedLoading} sx={{ borderRadius: 1.5 }}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleApplyTargetedDuty}
            disabled={applyTargetedLoading}
            startIcon={applyTargetedLoading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ borderRadius: 1.5 }}
          >
            {t('common.submit') || 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
