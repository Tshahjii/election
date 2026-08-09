import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import Checkbox from '@mui/material/Checkbox';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

// project imports
import MainCard from 'components/cards/MainCard';
import ChosenSelect from 'components/ChosenSelect';
import PaginationFooter from 'components/PaginationFooter';
import apiClient from 'api/client';
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
  useRestoreUrbanExemptEmployeeMutation,
  useRestoreRuralExemptEmployeeMutation,
  useCreateUrbanTeamsMutation,
  useCreateRuralTeamsMutation,
  useApplyUrbanTargetedDutyMutation,
  useApplyRuralTargetedDutyMutation,
  useApplyUrbanDutyMutation,
  useApplyRuralDutyMutation,
  useGetExemptEmployeeLogsQuery
} from 'store/apiSlice';

// assets
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import AssignmentIndOutlined from '@mui/icons-material/AssignmentIndOutlined';
import PrintOutlined from '@mui/icons-material/PrintOutlined';
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined';
const SearchTextField = ({ value, onChange, ...props }: any) => {
  const [localValue, setLocalValue] = useState(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (localValue === value) return;
    const timer = setTimeout(() => {
      onChangeRef.current(localValue);
    }, 350);
    return () => clearTimeout(timer);
  }, [localValue, value]);

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
  onRestoreExempt: (logId: number | number[]) => Promise<void>;
  loading: boolean;
  restoreLoading: boolean;
  exemptedLogs?: any[];
}

function ExemptEmployeeForm({ onExempt, onRestoreExempt, loading, restoreLoading, exemptedLogs = [] }: ExemptEmployeeFormProps) {
  const { t } = useAppPreferences();
  const [empCodeInput, setEmpCodeInput] = useState('');
  const [reason, setReason] = useState('');
  const [scope, setScope] = useState<'both' | 'urban' | 'rural'>('both');

  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [selectedExemptLogIds, setSelectedExemptLogIds] = useState<number[]>([]);

  const [triggerSearch, { data: dbEmployees = [], isFetching: isSearching }] = useLazySearchEmployeesQuery();

  const handleSearch = async () => {
    const trimmed = empCodeInput.trim();
    if (!trimmed) return;
    await triggerSearch({ q: trimmed, include_all: 1 }).unwrap();
    setHasSearched(true);
  };

  const codeItems = useMemo(() => {
    if (!empCodeInput.trim()) return [];
    return empCodeInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  }, [empCodeInput]);

  const searchedResults = useMemo(() => {
    if (!hasSearched || codeItems.length === 0) return [];

    return codeItems.map((code) => {
      const lower = code.toLowerCase();
      const cleanNum = lower.replace(/^nic/, '');
      const paddedCode = isNaN(Number(cleanNum)) ? lower : `nic${String(cleanNum).padStart(4, '0')}`;

      // 1. Check in exempt logs
      const exemptRecord = exemptedLogs.find((log: any) => {
        const logCode = String(log.emp_code || '').toLowerCase();
        const logEmpId = String(log.employee_id || '');
        const logEmpCode = String(log.employee?.emp_code || '').toLowerCase();

        return (
          logCode === lower ||
          logCode === paddedCode ||
          logEmpCode === lower ||
          logEmpCode === paddedCode ||
          logEmpId === lower
        );
      });

      if (exemptRecord) {
        return {
          code: exemptRecord.emp_code || code.toUpperCase(),
          employee: exemptRecord.employee,
          status: 'exempted',
          urbanPost: exemptRecord.urban_post,
          ruralPost: exemptRecord.rural_post,
          exemptReason: exemptRecord.urban_reason || exemptRecord.rural_reason || '-',
          logId: exemptRecord.id
        };
      }

      // 2. Check in dbEmployees
      const dbMatch = dbEmployees.find((emp: any) => {
        const empCodeStr = String(emp.emp_code || '').toLowerCase();
        const empIdStr = String(emp.id || '');
        const empNameStr = String(emp.name || '').toLowerCase();

        return (
          empCodeStr === lower ||
          empCodeStr === paddedCode ||
          empIdStr === lower ||
          empNameStr.includes(lower)
        );
      });

      if (dbMatch) {
        const uAssign = dbMatch.urban_assignment;
        const rAssign = dbMatch.rural_assignment;
        const hasDuty = Boolean(uAssign || rAssign);

        return {
          code: dbMatch.emp_code || code.toUpperCase(),
          employee: dbMatch,
          status: hasDuty ? 'assigned' : 'available',
          urbanPost: uAssign ? `${uAssign.post_name} (Team #${uAssign.padded_team_id})` : null,
          ruralPost: rAssign ? `${rAssign.post_name} (Team #${rAssign.padded_team_id})` : null,
          urbanAssignment: uAssign,
          ruralAssignment: rAssign,
          exemptReason: '-',
          logId: null
        };
      }

      // 3. Not found
      return {
        code: code.toUpperCase(),
        employee: null,
        status: 'not_found',
        urbanPost: null,
        ruralPost: null,
        exemptReason: '-',
        logId: null
      };
    });
  }, [hasSearched, codeItems, exemptedLogs, dbEmployees]);

  const { availableResults, exemptedResults, notFoundResults } = useMemo(() => {
    const available: any[] = [];
    const exempted: any[] = [];
    const notFound: any[] = [];

    searchedResults.forEach((item) => {
      if (item.status === 'available' || item.status === 'assigned') {
        available.push(item);
      } else if (item.status === 'exempted') {
        exempted.push(item);
      } else {
        notFound.push(item);
      }
    });

    return { availableResults: available, exemptedResults: exempted, notFoundResults: notFound };
  }, [searchedResults]);

  const availableCodesKey = useMemo(() => availableResults.map((r) => r.code).join(','), [availableResults]);

  const availableExemptLogIds = useMemo(() => {
    return exemptedResults.map((r) => r.logId).filter((id): id is number => typeof id === 'number' && id > 0);
  }, [exemptedResults]);

  const exemptedLogIdsKey = useMemo(() => availableExemptLogIds.join(','), [availableExemptLogIds]);

  useEffect(() => {
    if (hasSearched && availableResults.length > 0) {
      setSelectedCodes(availableResults.map((r) => r.code));
    } else {
      setSelectedCodes([]);
    }
  }, [hasSearched, availableCodesKey]);

  useEffect(() => {
    if (hasSearched && availableExemptLogIds.length > 0) {
      setSelectedExemptLogIds(availableExemptLogIds);
    } else {
      setSelectedExemptLogIds([]);
    }
  }, [hasSearched, exemptedLogIdsKey]);

  const isAllAvailableSelected = availableResults.length > 0 && selectedCodes.length === availableResults.length;
  const isSomeAvailableSelected = selectedCodes.length > 0 && selectedCodes.length < availableResults.length;

  const isAllExemptSelected = availableExemptLogIds.length > 0 && selectedExemptLogIds.length === availableExemptLogIds.length;
  const isSomeExemptSelected = selectedExemptLogIds.length > 0 && selectedExemptLogIds.length < availableExemptLogIds.length;

  const handleSelectAllAvailable = (checked: boolean) => {
    if (checked) {
      setSelectedCodes(availableResults.map((r) => r.code));
    } else {
      setSelectedCodes([]);
    }
  };

  const handleToggleCode = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSelectAllExempt = (checked: boolean) => {
    if (checked) {
      setSelectedExemptLogIds(availableExemptLogIds);
    } else {
      setSelectedExemptLogIds([]);
    }
  };

  const handleToggleExemptLogId = (logId: number | null) => {
    if (!logId) return;
    setSelectedExemptLogIds((prev) =>
      prev.includes(logId) ? prev.filter((id) => id !== logId) : [...prev, logId]
    );
  };

  const handleExemptSubmit = async () => {
    if (selectedCodes.length === 0) return;
    const codesString = selectedCodes.join(',');
    await onExempt(codesString, reason, scope);

    setEmpCodeInput('');
    setReason('');
    setScope('both');
    setHasSearched(false);
    setSelectedCodes([]);
  };

  const handleBulkRestoreExempt = async () => {
    if (selectedExemptLogIds.length === 0) return;
    await onRestoreExempt(selectedExemptLogIds);
    setSelectedExemptLogIds([]);
  };

  return (
    <MainCard title={t('election.exemptTitle') || 'कर्मचारी को असाइनमेंट से छूट दें'} sx={(theme) => ({ ...getSurfaceSx(theme) })}>
      <Grid container spacing={2} sx={{ alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <TextField
            fullWidth
            size="small"
            label={t('election.searchEmp') || 'कर्मचारी आईडी / कोड खोजें'}
            placeholder={t('election.searchEmpPlaceholderExempt') || 'कर्मचारी आईडी या कोड दर्ज करें (जैसे NIC001, NIC002)'}
            value={empCodeInput}
            onChange={(e) => {
              setEmpCodeInput(e.target.value);
              setHasSearched(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Button
            fullWidth
            type="button"
            variant="contained"
            color="primary"
            disabled={isSearching || !empCodeInput.trim()}
            onClick={handleSearch}
            startIcon={isSearching ? <CircularProgress size={18} color="inherit" /> : <SearchOutlined />}
            sx={{ ...buttonSx, height: 40 }}
          >
            {isSearching ? 'खोजा जा रहा है...' : 'कर्मचारी खोजें'}
          </Button>
        </Grid>
      </Grid>

      {hasSearched && (
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          {/* Warning for IDs not found in DB */}
          {notFoundResults.length > 0 && (
            <Box sx={{ mb: 3, p: 1.5, bgcolor: 'warning.lighter', border: '1px solid', borderColor: 'warning.main', borderRadius: 2 }}>
              <Typography variant="subtitle2" color="warning.dark" sx={{ fontWeight: 700 }}>
                ⚠️ निम्नलिखित कर्मचारी कोड डेटाबेस में नहीं मिले: {notFoundResults.map((r) => r.code).join(', ')}
              </Typography>
            </Box>
          )}

          {/* TABLE 1: Duty Assigned / Available Employees (To Be Exempted) */}
          {availableResults.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={availableResults.length} color="success" size="small" sx={{ fontWeight: 800 }} />
                  1. ड्यूटी में लगे / उपलब्ध कर्मचारी (जिन्हें छूट देनी है)
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    चयनित कर्मचारी: {selectedCodes.length} / {availableResults.length}
                  </Typography>
                  <Button
                    variant="contained"
                    color="secondary"
                    size="small"
                    disabled={loading || selectedCodes.length === 0}
                    onClick={handleExemptSubmit}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlined sx={{ fontSize: 16 }} />}
                    sx={{ borderRadius: 1.5, textTransform: 'none', px: 2, py: 0.5, fontSize: '0.8125rem', fontWeight: 700 }}
                  >
                    {loading ? (
                      'प्रक्रिया जारी है...'
                    ) : (
                      `छूट दें (${selectedCodes.length} चयनित)`
                    )}
                  </Button>
                </Box>
              </Box>

              <Grid container spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <ChosenSelect
                    label={t('election.exemptScopeLabel') || 'छूट का दायरा (Scope)'}
                    value={scope}
                    options={[
                      { value: 'both', label: t('election.exemptScopeBoth') || 'दोनों (शहरी और ग्रामीण)' },
                      { value: 'urban', label: t('election.exemptScopeUrban') || 'केवल शहरी (Urban)' },
                      { value: 'rural', label: t('election.exemptScopeRural') || 'केवल ग्रामीण (Rural)' }
                    ]}
                    onChange={(e) => setScope(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('election.exemptReasonLabel') || 'छूट का कारण'}
                    placeholder={t('election.exemptReasonPlaceholder') || 'ड्यूटी से हटाने का कारण दर्ज करें...'}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>

              <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'bg.100' }}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={isAllAvailableSelected}
                          indeterminate={isSomeAvailableSelected}
                          onChange={(e) => handleSelectAllAvailable(e.target.checked)}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ width: 60, fontWeight: 800 }}>{t('common.sno') || 'क्र.सं.'}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{t('election.empCode') || 'कर्मचारी कोड'}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{t('election.empName') || 'कर्मचारी नाम'}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{t('masters.designation') || 'पदनाम'}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800 }}>{t('election.urbanPost') || 'शहरी ड्यूटी पद'}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800 }}>{t('election.ruralPost') || 'ग्रामीण ड्यूटी पद'}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{t('election.exemptReasonLabel') || 'छूट का कारण'}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800 }}>{t('common.status') || 'स्थिति'}</TableCell>
                      <TableCell align="center" sx={{ width: 140, fontWeight: 800 }}>{t('common.action') || 'कार्रवाई'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {availableResults.map((item, idx) => {
                      const isChecked = selectedCodes.includes(item.code);
                      const isDutyAssigned = item.status === 'assigned';

                      return (
                        <TableRow
                          key={item.code + idx}
                          hover
                          selected={isChecked}
                          onClick={() => handleToggleCode(item.code)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              size="small"
                              checked={isChecked}
                              onChange={() => handleToggleCode(item.code)}
                            />
                          </TableCell>
                          <TableCell align="center">{idx + 1}</TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {item.code}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.employee?.name || '-'}</TableCell>
                          <TableCell>
                            {item.employee?.designation?.designation || item.employee?.designation?.name || '-'}
                          </TableCell>
                          <TableCell align="center">
                            {item.urbanAssignment ? (
                              <Chip
                                label={`${item.urbanAssignment.post_name} (Team #${item.urbanAssignment.padded_team_id})`}
                                color="warning"
                                size="small"
                                variant="outlined"
                                style={{ fontWeight: 600 }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">N/A</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {item.ruralAssignment ? (
                              <Chip
                                label={`${item.ruralAssignment.post_name} (Team #${item.ruralAssignment.padded_team_id})`}
                                color="info"
                                size="small"
                                variant="outlined"
                                style={{ fontWeight: 600 }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">N/A</Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 180, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {reason || '-'}
                          </TableCell>
                          <TableCell align="center">
                            {isDutyAssigned ? (
                              <Chip
                                label="ड्यूटी लगी हुई है (Duty Assigned)"
                                color="warning"
                                variant="filled"
                                size="small"
                                sx={{ fontWeight: 700 }}
                              />
                            ) : (
                              <Chip
                                label={t('election.statusAvailable') || 'ड्यूटी के लिए उपलब्ध'}
                                color="success"
                                variant="outlined"
                                size="small"
                                sx={{ fontWeight: 700 }}
                              />
                            )}
                          </TableCell>
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outlined"
                              color="secondary"
                              size="small"
                              disabled={loading}
                              onClick={() => onExempt(item.code, reason, scope)}
                              sx={{ borderRadius: 1.5, textTransform: 'none', px: 1.5, py: 0.5, fontSize: '0.75rem', fontWeight: 700 }}
                            >
                              छूट दें
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* TABLE 2: Already Exempted Employees (Removed from Duty) */}
          {exemptedResults.length > 0 && (
            <Box sx={{ mt: availableResults.length > 0 ? 4 : 0, pt: availableResults.length > 0 ? 3 : 0, borderTop: availableResults.length > 0 ? '1px solid' : 'none', borderColor: 'divider' }}>
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={exemptedResults.length} color="error" size="small" sx={{ fontWeight: 800 }} />
                  2. छूट प्राप्त कर्मचारी (ड्यूटी से हटाए गए रिकॉर्ड्स)
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    चयनित कर्मचारी: {selectedExemptLogIds.length} / {availableExemptLogIds.length}
                  </Typography>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    disabled={restoreLoading || selectedExemptLogIds.length === 0}
                    onClick={handleBulkRestoreExempt}
                    startIcon={restoreLoading ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlined sx={{ fontSize: 16 }} />}
                    sx={{ borderRadius: 1.5, textTransform: 'none', px: 2, py: 0.5, fontSize: '0.8125rem', fontWeight: 700 }}
                  >
                    {restoreLoading ? (
                      'प्रक्रिया जारी है...'
                    ) : (
                      `${t('election.restoreExemptBtn') || 'छूट से हटाएं'} (${selectedExemptLogIds.length} चयनित)`
                    )}
                  </Button>
                </Box>
              </Box>

              <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'bg.100' }}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={isAllExemptSelected}
                          indeterminate={isSomeExemptSelected}
                          onChange={(e) => handleSelectAllExempt(e.target.checked)}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ width: 60, fontWeight: 800 }}>{t('common.sno') || 'क्र.सं.'}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{t('election.empCode') || 'कर्मचारी कोड'}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{t('election.empName') || 'कर्मचारी नाम'}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{t('masters.designation') || 'पदनाम'}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800 }}>{t('election.urbanPost') || 'शहरी ड्यूटी पद'}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800 }}>{t('election.ruralPost') || 'ग्रामीण ड्यूटी पद'}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{t('election.exemptReasonLabel') || 'छूट का कारण'}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800 }}>{t('common.status') || 'स्थिति'}</TableCell>
                      <TableCell align="center" sx={{ width: 140, fontWeight: 800 }}>{t('common.action') || 'कार्रवाई'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {exemptedResults.map((item, idx) => {
                      const isChecked = item.logId ? selectedExemptLogIds.includes(item.logId) : false;
                      return (
                        <TableRow
                          key={item.code + idx}
                          hover
                          selected={isChecked}
                          onClick={() => item.logId && handleToggleExemptLogId(item.logId)}
                          sx={{ cursor: item.logId ? 'pointer' : 'default' }}
                        >
                          <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              size="small"
                              checked={isChecked}
                              disabled={!item.logId}
                              onChange={() => item.logId && handleToggleExemptLogId(item.logId)}
                            />
                          </TableCell>
                          <TableCell align="center">{idx + 1}</TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {item.code}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.employee?.name || '-'}</TableCell>
                          <TableCell>
                            {item.employee?.designation?.designation || item.employee?.designation?.name || '-'}
                          </TableCell>
                          <TableCell align="center">
                            {item.urbanPost ? (
                              <Chip label={item.urbanPost} color="warning" size="small" variant="outlined" style={{ fontWeight: 600 }} />
                            ) : (
                              <Typography variant="caption" color="text.secondary">N/A</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {item.ruralPost ? (
                              <Chip label={item.ruralPost} color="info" size="small" variant="outlined" style={{ fontWeight: 600 }} />
                            ) : (
                              <Typography variant="caption" color="text.secondary">N/A</Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 180, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {item.exemptReason}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={t('election.statusExempted') || 'छूट प्राप्त (Exempted)'}
                              color="error"
                              variant="filled"
                              size="small"
                              sx={{ fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            {item.logId && (
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                disabled={restoreLoading}
                                onClick={() => onRestoreExempt(item.logId)}
                                startIcon={<DeleteOutlined sx={{ fontSize: 16 }} />}
                                sx={{ borderRadius: 1.5, textTransform: 'none', px: 1.5, py: 0.5, fontSize: '0.75rem', fontWeight: 700 }}
                              >
                                {t('election.restoreExemptBtn') || 'छूट से हटाएं'}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {availableResults.length === 0 && exemptedResults.length === 0 && notFoundResults.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">कोई कर्मचारी नहीं मिला।</Typography>
            </Box>
          )}
        </Box>
      )}
    </MainCard>
  );
}

interface TeamAttendanceListProps {
  teams: any[];
  cityName: string;
  districtName?: string;
  isUrban: boolean;
  postHeaders: string[];
}

function TeamAttendanceList({ teams, cityName, districtName, isUrban, postHeaders }: TeamAttendanceListProps) {
  const { t } = useAppPreferences();
  const [filterTeam, setFilterTeam] = useState('');

  const todayFormattedDate = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const effectiveCityName = useMemo(() => {
    if (cityName && cityName.trim()) return cityName;
    if (teams && teams.length > 0) {
      return teams[0]?.karyalay_name || teams[0]?.city_name || '';
    }
    return '';
  }, [cityName, teams]);

  const effectiveDistrictName = useMemo(() => {
    if (districtName && districtName.trim()) return districtName;
    if (teams && teams.length > 0 && teams[0]?.district_name) return teams[0].district_name;
    return '';
  }, [districtName, teams]);

  const defaultPostLabels = [
    'P0 - पीठासीन अधिकारी',
    'P1 - प्रथम मतदान अधिकारी',
    'P2 - द्वितीय मतदान अधिकारी',
    'P3 - तृतीय मतदान अधिकारी',
    'P4 - चतुर्थ मतदान अधिकारी'
  ];

  const filteredTeams = useMemo(() => {
    const rawTerm = filterTeam.trim().toLowerCase();
    if (!rawTerm) return teams;
    const cleanTerm = rawTerm.replace(/^team\s*/i, '').trim();

    return teams.filter((teamItem: any) => {
      const padded = String(teamItem.padded_team_id || '').toLowerCase();
      const raw = String(teamItem.team_id || '').toLowerCase();
      const ps = String(teamItem.polling_station_name || '').toLowerCase();

      if (/^\d+$/.test(cleanTerm)) {
        return Number(teamItem.team_id) === Number(cleanTerm) || padded === cleanTerm || padded === cleanTerm.padStart(4, '0');
      }

      return padded.includes(rawTerm) || raw.includes(rawTerm) || ps.includes(rawTerm);
    });
  }, [teams, filterTeam]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Stack spacing={2}>

      <Card className="no-print" sx={(theme) => ({ ...getSurfaceSx(theme), p: 2 })}>
        <Grid container spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.3 }}>
              {t('election.attendanceSheetTitle')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('election.attendanceSheetDesc')}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', gap: 1.5, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <TextField
              size="small"
              placeholder={t('election.searchTeamOrBooth')}
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handlePrint}
              startIcon={<PrintOutlined />}
              sx={{ borderRadius: 2, px: 2.5, py: 0.8, fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              प्रिंट / PDF
            </Button>
          </Grid>
        </Grid>
      </Card>

      {filteredTeams.length === 0 ? (
        <MainCard title="कोई रिकॉर्ड नहीं" sx={getSurfaceSx}>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">उपस्थिति पत्रक के लिए कोई टीम नहीं मिली। कृपया शहर चुनें या टीमें जनरेट करें।</Typography>
          </Box>
        </MainCard>
      ) : (
        <Box className="print-attendance-sheet-area">
          {/* Official Government Order Header (Visible on Screen & Print) */}
          <Box
            className="print-official-header"
            sx={(theme) => ({
              mb: 1.5,
              px: 2,
              py: 1.2,
              bgcolor: 'background.paper',
              border: '1.5px solid',
              borderColor: theme.palette.mode === 'dark' ? 'primary.main' : 'grey.400',
              borderRadius: 1.5,
              textAlign: 'center',
              '@media print': {
                border: '1.5px solid #000',
                mb: 1,
                py: 1,
                px: 1.5,
                pageBreakInside: 'avoid',
                breakInside: 'avoid'
              }
            })}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '0.95rem', sm: '1.15rem' },
                color: 'text.primary',
                fontFamily: 'serif, "Noto Serif Devanagari", sans-serif',
                mb: 0.2
              }}
            >
              कार्यालय कलेक्टर एवं जिला निर्वाचन अधिकारी {effectiveDistrictName} {effectiveCityName ? `(${effectiveCityName})` : ''}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
                mt: 0.8,
                pt: 0.6,
                borderTop: '1px dashed',
                borderColor: 'divider'
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.primary' }}>
                विषय: निकाय निर्वाचन - मतदान दल उपस्थिति पत्रक
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.primary' }}>
                {effectiveDistrictName ? `${effectiveDistrictName}, ` : ''}दिनांक: {todayFormattedDate}
              </Typography>
            </Box>
          </Box>

          {filteredTeams.map((team: any, tIdx: number) => (
            <Box
              key={team.team_id || tIdx}
              className="print-card"
              sx={(theme) => ({
                mb: 1.5,
                border: '1.5px solid',
                borderColor: theme.palette.mode === 'dark' ? 'divider' : 'grey.300',
                borderRadius: 1.5,
                overflow: 'hidden',
                bgcolor: 'background.paper',
                '@media print': {
                  mb: 1,
                  border: '1.5px solid #000',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid'
                }
              })}
            >
              {/* Header Strip (Left: Only Dal Code, Right: Empty) */}
              <Box
                sx={(theme) => ({
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'primary.lighter',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  px: 1.5,
                  py: 0.4,
                  display: 'flex',
                  alignItems: 'center'
                })}
              >
                <Typography
                  variant="subtitle2"
                  sx={(theme) => ({
                    fontWeight: 800,
                    fontSize: '0.825rem',
                    color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.dark'
                  })}
                >
                  दल क्रमांक: #{team.padded_team_id}
                </Typography>
              </Box>

              {/* Grid 4 columns per team */}
              <Grid container spacing={0.8} className="print-grid-row" sx={{ p: 0.8 }}>
                {team.posts && team.posts.length > 0 ? (
                  team.posts.map((post: any, pIdx: number) => {
                    const postLabel = defaultPostLabels[pIdx] || post.post_name;
                    const isAssigned = Boolean(post.emp_id && post.employee_name);

                    return (
                      <Grid key={post.post_mapping_id || pIdx} className="print-grid-col" size={{ xs: 12, sm: 6, md: 3 }}>
                        <Box
                          sx={(theme) => ({
                            border: '1px solid',
                            borderColor: theme.palette.mode === 'dark' ? 'divider' : 'grey.300',
                            borderRadius: 1.5,
                            overflow: 'hidden',
                            bgcolor: 'background.paper',
                            height: 165,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          })}
                        >
                          {/* Data Section (Fixed 110px Height - Zero Alignment Shift) */}
                          <Box
                            sx={(theme) => ({
                              p: 0.8,
                              height: 110,
                              boxSizing: 'border-box',
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fafafa',
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            })}
                          >
                            <Box sx={{ borderBottom: '1px dashed', borderColor: 'divider', pb: 0.3, mb: 0.3 }}>
                              <Typography
                                variant="caption"
                                sx={(theme) => ({
                                  fontWeight: 800,
                                  color: theme.palette.mode === 'dark' ? 'primary.light' : 'secondary.main',
                                  fontSize: '0.725rem',
                                  display: 'block'
                                })}
                              >
                                {postLabel}
                              </Typography>
                            </Box>

                            {isAssigned ? (
                              <Box sx={{ lineHeight: 1.25 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.8125rem', color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {post.employee_name}
                                  </Typography>
                                  {post.gender && (
                                    <Typography variant="caption" sx={{ fontSize: '0.675rem', color: 'text.secondary', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                      {post.gender} {post.age ? `(${post.age})` : ''}
                                    </Typography>
                                  )}
                                </Box>
                                <Typography
                                  variant="caption"
                                  sx={(theme) => ({
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    color: theme.palette.mode === 'dark' ? 'info.light' : 'primary.main',
                                    display: 'block',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  })}
                                >
                                  कोड: {post.employee_code} | पद: {post.designation || '-'}
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: '0.675rem', color: 'text.secondary', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  कार्यालय: {post.office_name || '-'} {post.office_code && post.office_code !== '-' ? `(${post.office_code})` : ''}
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.primary', fontWeight: 600, display: 'block', mt: 0.1 }}>
                                  मो.: {post.mobile || '-'}
                                </Typography>
                              </Box>
                            ) : (
                              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography variant="caption" color="error.main" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>
                                  [ पद रिक्त ]
                                </Typography>
                              </Box>
                            )}
                          </Box>

                          {/* Signature Section - Clean Box (Left Center Aligned) */}
                          <Box
                            sx={{
                              height: 48,
                              boxSizing: 'border-box',
                              px: 1.2,
                              bgcolor: 'background.paper',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start'
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.725rem',
                                color: 'text.secondary',
                                fontWeight: 600,
                                '@media print': {
                                  display: 'none'
                                }
                              }}
                            >
                              हस्ताक्षर
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })
                ) : (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">कोई पद नहीं मिला।</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          ))}
        </Box>
      )}
    </Stack>
  );
}

interface TeamReportCardsProps {
  teams: any[];
  cityName: string;
  districtName: string;
  isUrban: boolean;
  postHeaders: string[];
}

function TeamReportCards({ teams, cityName, districtName, isUrban, postHeaders }: TeamReportCardsProps) {
  const dispatch = useDispatch();
  const { t } = useAppPreferences();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');

  const STORAGE_KEY = `election_training_schedule_config_${isUrban ? 'urban' : 'rural'}`;

  // Initial load from localStorage if present
  const savedConfig = useMemo(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }, [STORAGE_KEY]);

  const [orderNo, setOrderNo] = useState(() => savedConfig?.orderNo || '5114');

  const [trainingRows, setTrainingRows] = useState(() => savedConfig?.trainingRows || [
    {
      id: 1,
      purpose: '(1) प्रशिक्षण-प्रथम चक्र (पीठासीन अधिकारी तथा मतदान अधिकारी क्रमांक 1 के लिये)',
      date: '11/01/2025',
      time: 'प्रातः 11:00 बजे से 01:00 बजे तक',
      venue: 'भिलाई इंस्टीट्यूट ऑफ टेक्नोलॉजी, दुर्ग'
    },
    {
      id: 2,
      purpose: '(2) प्रशिक्षण-द्वितीय चक्र (पीठासीन अधिकारी तथा सभी मतदान अधिकारियों के लिये)',
      date: '',
      time: '',
      venue: ''
    },
    {
      id: 3,
      purpose: '(3) मतदान सामग्री प्राप्त करने तथा मतदान केन्द्र के लिए प्रस्थान हेतु',
      date: '',
      time: '',
      venue: ''
    }
  ]);

  const [isSavingDb, setIsSavingDb] = useState(false);

  // Fetch training schedule from MySQL Database (District-Wise)
  useEffect(() => {
    let isMounted = true;
    const fetchDbSchedules = async () => {
      try {
        const endpoint = isUrban ? '/api/urban-election/training-schedules' : '/api/rural-election/training-schedules';
        const cityIdParam = teams && teams.length > 0 ? teams[0]?.city_id : null;
        const districtIdParam = teams && teams.length > 0 ? teams[0]?.district_id : null;
        const res = await apiClient.get(endpoint, {
          params: { city_id: cityIdParam, district_id: districtIdParam, election_type: isUrban ? 'urban' : 'rural' }
        });
        if (isMounted && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setTrainingRows(res.data.map((item: any, idx: number) => ({
            id: item.id || idx + 1,
            purpose: item.purpose || '',
            date: item.date || '',
            time: item.time || '',
            venue: item.venue || ''
          })));
        }
      } catch (e) {
        console.error('Could not load training schedule from DB', e);
      }
    };
    fetchDbSchedules();
    return () => { isMounted = false; };
  }, [isUrban, teams]);

  // Automatically save training schedule to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          orderNo,
          trainingRows
        })
      );
    } catch (e) {
      console.error('Failed to save training schedule to localStorage', e);
    }
  }, [STORAGE_KEY, orderNo, trainingRows]);

  const handleSaveToDb = async () => {
    try {
      setIsSavingDb(true);
      const endpoint = isUrban ? '/api/urban-election/training-schedules' : '/api/rural-election/training-schedules';
      const cityIdParam = teams && teams.length > 0 ? teams[0]?.city_id : null;
      const districtIdParam = teams && teams.length > 0 ? teams[0]?.district_id : null;
      await apiClient.post(endpoint, {
        city_id: cityIdParam,
        district_id: districtIdParam,
        election_type: isUrban ? 'urban' : 'rural',
        schedules: trainingRows
      });
      dispatch(showNotification({ message: t('election.dbSaveSuccess'), severity: 'success' }));
    } catch (e: any) {
      console.error('Error saving training schedule to DB', e);
      dispatch(showNotification({ message: e?.response?.data?.message || t('election.dbSaveError'), severity: 'error' }));
    } finally {
      setIsSavingDb(false);
    }
  };

  const handleUpdateTrainingRow = (id: number, field: string, value: string) => {
    setTrainingRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleAddTrainingRow = () => {
    const nextId = trainingRows.length > 0 ? Math.max(...trainingRows.map((r) => r.id)) + 1 : 1;
    setTrainingRows((prev) => [
      ...prev,
      {
        id: nextId,
        purpose: `(${nextId}) `,
        date: '',
        time: '',
        venue: ''
      }
    ]);
  };

  const handleRemoveTrainingRow = (id: number) => {
    setTrainingRows((prev) => prev.filter((r) => r.id !== id));
  };

  const todayFormattedDate = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const effectiveCityName = useMemo(() => {
    if (cityName && cityName.trim()) return cityName;
    if (teams && teams.length > 0) return teams[0]?.karyalay_name || teams[0]?.city_name || '';
    return '';
  }, [cityName, teams]);

  const effectiveDistrictName = useMemo(() => {
    if (districtName && districtName.trim()) return districtName;
    if (teams && teams.length > 0 && teams[0]?.district_name) return teams[0].district_name;
    return '';
  }, [districtName, teams]);

  const filteredTeams = useMemo(() => {
    return teams.filter((t: any) => {
      if (selectedTeamId !== 'all' && String(t.team_id) !== String(selectedTeamId) && String(t.padded_team_id) !== String(selectedTeamId)) {
        return false;
      }
      if (!searchTerm.trim()) return true;
      const rawTerm = searchTerm.trim().toLowerCase();
      const cleanTerm = rawTerm.replace(/^team\s*/i, '').trim();
      const padded = String(t.padded_team_id || '').toLowerCase();
      const raw = String(t.team_id || '').toLowerCase();
      const ps = String(t.polling_station_name || '').toLowerCase();

      // If user typed a number (e.g. 1, 0001, team1), match exact team_id / padded_team_id
      if (/^\d+$/.test(cleanTerm)) {
        return Number(t.team_id) === Number(cleanTerm) || padded === cleanTerm || padded === cleanTerm.padStart(4, '0');
      }

      const empMatch = (t.posts || []).some((p: any) =>
        String(p.employee_name || '').toLowerCase().includes(rawTerm) ||
        String(p.employee_code || '').toLowerCase().includes(rawTerm)
      );

      return padded.includes(rawTerm) || raw.includes(rawTerm) || ps.includes(rawTerm) || empMatch;
    });
  }, [teams, searchTerm, selectedTeamId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Stack spacing={2.5}>
      {/* Control & Filter Card (Screen Only) */}
      <Card className="no-print" sx={(theme) => ({ ...getSurfaceSx(theme), p: 2 })}>
        <Grid container spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label={t('election.orderNo')}
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <ChosenSelect
                label={t('election.selectTeam')}
                value={selectedTeamId}
                options={[
                  { value: 'all', label: t('election.allTeams') },
                  ...teams.map((teamItem: any) => ({
                    value: teamItem.team_id,
                    label: `${t('election.teamNo')}: #${teamItem.padded_team_id} ${teamItem.polling_station_name ? `(${teamItem.polling_station_name})` : ''}`
                  }))
                ]}
                onChange={(e) => setSelectedTeamId(e.target.value)}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              placeholder={t('election.searchTeamOrBooth')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handlePrint}
              startIcon={<PrintOutlined />}
              sx={{ borderRadius: 2, px: 2.5, py: 0.8, fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              {t('election.printOrderPdf')}
            </Button>
          </Grid>
        </Grid>

        {/* Dynamic Training & Departure Schedule Controls */}
        <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              📋 {t('election.scheduleControlsTitle')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="success"
                size="small"
                onClick={handleSaveToDb}
                disabled={isSavingDb}
                sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700 }}
              >
                💾 {isSavingDb ? t('election.savingToDb') : t('election.saveToDb')}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={handleAddTrainingRow}
                sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700 }}
              >
                {t('election.addTrainingRow')}
              </Button>
            </Box>
          </Box>

          <Stack spacing={1.5}>
            {trainingRows.map((row, index) => (
              <Grid container spacing={1.5} key={row.id} sx={{ alignItems: 'center', bgcolor: 'action.hover', p: 1.2, borderRadius: 1.5 }}>
                <Grid size={{ xs: 12, md: 4.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={`प्रयोजन ${index + 1} (किसे / किसके साथ बुलाना है)`}
                    value={row.purpose}
                    onChange={(e) => handleUpdateTrainingRow(row.id, 'purpose', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'background.paper' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="तारीख (Date - कब होगा)"
                    placeholder="DD/MM/YYYY"
                    value={row.date}
                    onChange={(e) => handleUpdateTrainingRow(row.id, 'date', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'background.paper' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="समय (Time - किस समय)"
                    placeholder="प्रातः 11:00..."
                    value={row.time}
                    onChange={(e) => handleUpdateTrainingRow(row.id, 'time', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'background.paper' } }}
                  />
                </Grid>
                <Grid size={{ xs: 10, sm: 3, md: 2.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="स्थान/परिसर (Venue - कहाँ होगा)"
                    placeholder="प्रशिक्षण केंद्र..."
                    value={row.venue}
                    onChange={(e) => handleUpdateTrainingRow(row.id, 'venue', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'background.paper' } }}
                  />
                </Grid>
                {trainingRows.length > 1 && (
                  <Grid size={{ xs: 2, sm: 1, md: 0.5 }} sx={{ textAlign: 'right' }}>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleRemoveTrainingRow(row.id)}
                      sx={{ minWidth: 32, p: 0.5, borderRadius: 1 }}
                    >
                      <DeleteOutlined fontSize="small" />
                    </Button>
                  </Grid>
                )}
              </Grid>
            ))}
          </Stack>
        </Box>
      </Card>

      {/* Official Government Order Sheet Layout (Matches Image Exactly) */}
      {filteredTeams.length === 0 ? (
        <MainCard title="कोई रिकॉर्ड नहीं" sx={getSurfaceSx}>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">नियुक्ति आदेश के लिए कोई दल नहीं मिला। कृपया शहर या दल चुनें।</Typography>
          </Box>
        </MainCard>
      ) : (
        <Stack spacing={4} className="print-attendance-sheet-area">
          {filteredTeams.flatMap((team: any, tIdx: number) => {
            const posts = team.posts && team.posts.length > 0 ? team.posts : [{}];
            const p0 = posts[0] || {};
            const p1 = posts[1] || {};
            const pollingOfficers = posts.slice(1);

            const getTitlePrefix = (emp: any) => {
              if (!emp || !emp.employee_name) return '';
              const name = String(emp.employee_name).trim();
              const empTitle = emp.title || emp.salutation || emp.emp_title;
              if (empTitle && String(empTitle).trim()) {
                const t = String(empTitle).trim();
                return t.endsWith('.') || t.endsWith(' ') ? t : `${t} `;
              }
              const empGender = emp.gender || emp.sex;
              if (empGender && (String(empGender).toLowerCase() === 'female' || String(empGender).toLowerCase() === 'f')) {
                return 'श्रीमती ';
              }
              if (/^(श्री|श्रीमती|सुश्री|डॉ\.|डाॉ\.|Mr\.|Mrs\.|Ms\.|Dr\.)/i.test(name)) {
                return '';
              }
              return 'श्री ';
            };

            const formatEmpDetails = (emp: any) => {
              if (!emp || !emp.employee_name) return '[ पद रिक्त ]';
              const prefix = getTitlePrefix(emp);
              const nameStr = `${prefix}${emp.employee_name}`;
              const codeStr = emp.employee_code ? ` [${emp.employee_code}]` : '';
              const mobStr = emp.mobile && emp.mobile !== '-' ? ` [${emp.mobile}]` : '';
              const desigStr = emp.designation && emp.designation !== '-' ? `, ${emp.designation}` : '';
              const officeStr = emp.office_name && emp.office_name !== '-' ? `, ${emp.office_name}` : '';
              return `${nameStr}${codeStr}${mobStr}${desigStr}${officeStr}`;
            };

            const getPostDutyLabel = (post: any, index: number) => {
              const name = post?.post_name || '';
              if (name.includes('P0') || name.includes('पीठासीन') || index === 0) return 'पीठासीन अधिकारी';
              if (name.includes('P1') || index === 1) return 'प्रथम मतदान अधिकारी';
              if (name.includes('P2') || index === 2) return 'द्वितीय मतदान अधिकारी';
              if (name.includes('P3') || index === 3) return 'तृतीय मतदान अधिकारी';
              if (name.includes('P4') || index === 4) return 'चतुर्थ मतदान अधिकारी';
              return name || `मतदान अधिकारी क्रमांक ${index}`;
            };

            return posts.map((memberPost: any, pIdx: number) => (
              <Box
                key={`${team.team_id || tIdx}-${memberPost.post_mapping_id || pIdx}`}
                className="print-card appointment-order-card"
                sx={(theme) => ({
                  bgcolor: 'background.paper',
                  border: '1.5px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'divider' : 'grey.400',
                  borderRadius: 1.5,
                  p: { xs: 2, sm: 3 },
                  color: 'text.primary',
                  fontFamily: 'serif, "Noto Serif Devanagari", sans-serif',
                  lineHeight: 1.4,
                  boxSizing: 'border-box',
                  '@media print': {
                    border: '1.5px solid #000',
                    p: '6mm 10mm !important',
                    m: '0 !important',
                    boxShadow: 'none',
                    pageBreakAfter: 'always !important',
                    breakAfter: 'page !important',
                    pageBreakInside: 'avoid !important',
                    breakInside: 'avoid !important',
                    height: '284mm !important',
                    minHeight: '284mm !important',
                    maxHeight: '284mm !important',
                    boxSizing: 'border-box !important',
                    display: 'flex !important',
                    flexDirection: 'column !important',
                    justifyContent: 'space-between !important'
                  }
                })}
              >
                {/* Document Header */}
                <Typography
                  variant="h6"
                  align="center"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '0.95rem', sm: '1.1rem' },
                    fontFamily: 'inherit',
                    mb: 0.3
                  }}
                >
                  कार्यालय कलेक्टर एवं जिला निर्वाचन अधिकारी {effectiveDistrictName} {effectiveCityName ? `(${effectiveCityName})` : ''}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3, fontWeight: 700, fontSize: '0.8rem' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', fontFamily: 'inherit' }}>
                    आदेश क्रमांक: {orderNo}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', fontFamily: 'inherit' }}>
                    {effectiveDistrictName ? `${effectiveDistrictName}, ` : ''}{todayFormattedDate}
                  </Typography>
                </Box>

                <Typography variant="subtitle1" align="center" sx={{ fontWeight: 800, textDecoration: 'underline', my: 0.3, fontSize: '0.95rem', fontFamily: 'inherit' }}>
                  आदेश
                </Typography>

                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.3, fontSize: '0.78rem', fontFamily: 'inherit' }}>
                  विषय: निर्वाचन में पीठासीन अधिकारी/मतदान अधिकारी के रूप में नियुक्ति।
                </Typography>

                <Typography variant="body2" sx={{ mb: 0.6, textAlign: 'justify', lineHeight: 1.35, fontSize: '0.73rem', fontFamily: 'inherit' }}>
                  छत्तीसगढ़ नगरपालिका निर्वाचन नियम, 1994 के नियम 17 के अंतर्गत, आगामी नगरपालिका निर्वाचन में, एतद् द्वारा, नीचे दी हुई सारणी के स्तंभ (1) में उल्लिखित अधिकारी को पीठासीन अधिकारी तथा स्तंभ (2) में उल्लिखित अधिकारियों को मतदान अधिकारी नियुक्त किया जाता है:-
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.78rem', fontFamily: 'inherit' }}>
                    सारणी
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.85rem', fontFamily: 'inherit' }}>
                    दल क्रमांक: {team.padded_team_id || team.team_id}
                  </Typography>
                </Box>

                {/* Primary Table (Matches Screenshot Exactly) */}
                <TableContainer sx={{ border: '1.5px solid #000', mb: 0.8 }}>
                  <Table size="small" sx={{ '& td, & th': { border: '1px solid #000', color: '#000', p: 0.4, verticalAlign: 'top', fontFamily: 'inherit' } }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.03)' }}>
                        <TableCell width="30%" align="center" sx={{ fontWeight: 800, fontSize: '0.73rem' }}>
                          पीठासीन अधिकारी
                        </TableCell>
                        <TableCell width="45%" align="center" sx={{ fontWeight: 800, fontSize: '0.73rem' }}>
                          मतदान अधिकारियों के नाम
                        </TableCell>
                        <TableCell width="25%" align="center" sx={{ fontWeight: 800, fontSize: '0.73rem' }}>
                          पीठासीन अधिकारी की अनुपस्थिति में अधिकृत मतदान अधिकारी का नाम
                        </TableCell>
                      </TableRow>
                      <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                        <TableCell align="center" sx={{ fontWeight: 700, py: 0.1, fontSize: '0.68rem' }}>(1)</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, py: 0.1, fontSize: '0.68rem' }}>(2)</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, py: 0.1, fontSize: '0.68rem' }}>(3)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        {/* Col 1: P0 */}
                        <TableCell sx={{ fontSize: '0.72rem', lineHeight: 1.3 }}>
                          {formatEmpDetails(p0)}
                        </TableCell>
                        {/* Col 2: P1, P2, P3 */}
                        <TableCell sx={{ fontSize: '0.72rem', lineHeight: 1.3 }}>
                          {pollingOfficers.map((po: any, idx: number) => (
                            <Box key={idx} sx={{ mb: idx < pollingOfficers.length - 1 ? 0.3 : 0 }}>
                              ({idx + 1}) {formatEmpDetails(po)}
                            </Box>
                          ))}
                        </TableCell>
                        {/* Col 3: Authorized P1 */}
                        <TableCell sx={{ fontSize: '0.72rem', lineHeight: 1.3 }}>
                          {formatEmpDetails(p1)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Instructions Paragraphs (Matches Screenshot Text) */}
                <Stack spacing={0.4} sx={{ fontSize: '0.72rem', lineHeight: 1.35, mb: 0.8, fontFamily: 'inherit' }}>
                  <Typography variant="body2" sx={{ fontSize: 'inherit', fontFamily: 'inherit' }}>
                    2. उस स्थिति में जबकि पीठासीन अधिकारी किसी अपरिहार्य कारण से मतदान केन्द्र से अनुपस्थित रहने के लिये बाध्य हो, उसकी अनुपस्थिति के दौरान उसके कृत्यों का पालन करने के लिए सारणी के स्तंभ क्रमांक (3) में उल्लिखित मतदान अधिकारी को प्राधिकृत किया जाता है।
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: 'inherit', fontFamily: 'inherit' }}>
                    3. (1) मतदान दल को उस मतदान केन्द्र की जानकारी जहां पर ड्यूटी की जानी है, प्रस्थान के ठीक पूर्व दी जाएगी। दल को मतदान केन्द्र तक ले जाने और वहां से वापस लाने के लिए आवश्यक परिवहन व्यवस्था की जाएगी।
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: 'inherit', fontFamily: 'inherit' }}>
                    3. (2) मतदान तारीख को प्रातः 8:00 बजे से अपराह्न 5:00 बजे तक होगा।
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: 'inherit', fontFamily: 'inherit', fontWeight: 700 }}>
                    4. पीठासीन अधिकारी तथा मतदान अधिकारी - 1 तथा 2 एवं 3 प्रशिक्षण तथा निर्वाचन ड्यूटी आदि के लिये निम्नानुसार उपस्थित हों:-
                  </Typography>
                </Stack>

                {/* Training Schedule Table (Matches Screenshot Exactly & Dynamic) */}
                <TableContainer sx={{ border: '1.5px solid #000', mb: 0.8 }}>
                  <Table size="small" sx={{ '& td, & th': { border: '1px solid #000', color: '#000', p: 0.3, verticalAlign: 'middle', fontFamily: 'inherit' } }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.03)' }}>
                        <TableCell width="38%" align="center" sx={{ fontWeight: 800, fontSize: '0.72rem' }}>प्रयोजन</TableCell>
                        <TableCell width="14%" align="center" sx={{ fontWeight: 800, fontSize: '0.72rem' }}>तारीख</TableCell>
                        <TableCell width="22%" align="center" sx={{ fontWeight: 800, fontSize: '0.72rem' }}>समय</TableCell>
                        <TableCell width="26%" align="center" sx={{ fontWeight: 800, fontSize: '0.72rem' }}>स्थान/परिसर (जहां उपस्थित होना है)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody sx={{ fontSize: '0.7rem' }}>
                      {trainingRows.map((tr: any, rIdx: number) => (
                        <TableRow key={tr.id || rIdx}>
                          <TableCell sx={{ fontWeight: 600, py: 0.3 }}>
                            {tr.purpose}
                          </TableCell>
                          <TableCell align="center" sx={{ py: 0.3 }}>{tr.date || ''}</TableCell>
                          <TableCell align="center" sx={{ py: 0.3 }}>{tr.time || ''}</TableCell>
                          <TableCell align="center" sx={{ py: 0.3 }}>{tr.venue || ''}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* District Election Officer Signature */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.6, mb: 0.8 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, fontFamily: 'inherit', textAlign: 'center', fontSize: '0.825rem' }}>
                    जिला निर्वाचन अधिकारी
                  </Typography>
                </Box>

                <Box sx={{ borderTop: '1px dashed #000', my: 0.6 }} />

                {/* Acknowledgement Slip (पावती - Matches Bottom Slip of Image) */}
                <Box sx={{ pt: 0.3, fontFamily: 'inherit' }}>
                  <Typography variant="subtitle2" align="center" sx={{ fontWeight: 800, textDecoration: 'underline', mb: 0.4, fontSize: '0.825rem', fontFamily: 'inherit' }}>
                    पावती
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.35, mb: 0.8, fontSize: '0.73rem', fontFamily: 'inherit' }}>
                    {effectiveCityName || 'नगरपालिका'} के मतदान दल क्रमांक {team.padded_team_id || team.team_id} में {getPostDutyLabel(memberPost, pIdx)} के रूप में मेरी नियुक्ति से संबंधित आदेश क्रमांक {orderNo} तारीख {todayFormattedDate} मुझे प्राप्त हो गया है।
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 0.8 }}>
                    <Box sx={{ lineHeight: 1.35 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.73rem', fontFamily: 'inherit' }}>
                        स्थान :
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.73rem', fontFamily: 'inherit' }}>
                        तारीख :
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.73rem', fontFamily: 'inherit', textAlign: 'right' }}>
                      {formatEmpDetails(memberPost)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ));
          })}
        </Stack>
      )}
    </Stack>
  );
}

export default function ElectionTeamAssignments({ type }: ElectionTeamAssignmentsProps) {
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.auth);

  const [activeTab, setActiveTab] = useState<'assignments' | 'attendance' | 'reports'>('assignments');
  const [selectedStateId, setSelectedStateId] = useState<number | 'all' | ''>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | 'all' | ''>('');
  const [selectedCityId, setSelectedCityId] = useState<number | ''>('');
  const [teamSearch, setTeamSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [logPage, setLogPage] = useState(1);
  const [logRowsPerPage, setLogRowsPerPage] = useState(10);
  const [logSearch, setLogSearch] = useState('');
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
  const [targetedLimit, setTargetedLimit] = useState<number | ''>('');

  const { t } = useAppPreferences();
  const isUrban = type === 'Nagar Panchayat';

  // 1. Fetch cities options
  const { data: optionsData } = useGetOptionsQuery();
  const statesList = useMemo(() => optionsData?.states || [], [optionsData]);
  const allDistrictsList = useMemo(() => optionsData?.districts || [], [optionsData]);

  const filteredDistricts = useMemo(() => {
    if (!optionsData?.districts || !selectedStateId || (selectedStateId as any) === '') return [];
    if (selectedStateId === 'all') return optionsData.districts;
    return optionsData.districts.filter((d: any) => Number(d.state_id) === Number(selectedStateId));
  }, [optionsData, selectedStateId]);

  const isMultiDistrictUser = useMemo(() => {
    const isSuperOrSystem = Number(user?.role) === 1 || Number(user?.role) === 2 || user?.access?.is_super_admin;
    return isSuperOrSystem || allDistrictsList.length > 1;
  }, [user, allDistrictsList]);

  const filteredCities = useMemo(() => {
    if (!optionsData) return [];
    const cities = type === 'Nagar Panchayat' ? (optionsData.np_cities || []) : (optionsData.rp_cities || []);
    if (selectedDistrictId && (selectedDistrictId as any) !== 'all') {
      return cities.filter((c: any) => Number(c.district_id) === Number(selectedDistrictId));
    }
    if (selectedStateId && selectedStateId !== 'all') {
      const stateDistIds = filteredDistricts.map((d: any) => Number(d.id));
      return cities.filter((c: any) => stateDistIds.includes(Number(c.district_id)));
    }
    return cities;
  }, [optionsData, type, selectedDistrictId, selectedStateId, filteredDistricts]);

  const selectedCityObj = useMemo(() => {
    if (!selectedCityId || (selectedCityId as any) === '') return null;
    return filteredCities.find((c: any) => Number(c.id) === Number(selectedCityId));
  }, [filteredCities, selectedCityId]);

  const selectedDistrictObj = useMemo(() => {
    if (!allDistrictsList || allDistrictsList.length === 0) return null;
    if (selectedDistrictId && (selectedDistrictId as any) !== 'all') {
      return allDistrictsList.find((d: any) => Number(d.id) === Number(selectedDistrictId));
    }
    if (selectedCityObj?.district_id) {
      return allDistrictsList.find((d: any) => Number(d.id) === Number(selectedCityObj.district_id));
    }
    return allDistrictsList[0] || null;
  }, [allDistrictsList, selectedDistrictId, selectedCityObj]);

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

  const [restoreUrbanExempt, { isLoading: restoreUrbanLoading }] = useRestoreUrbanExemptEmployeeMutation();
  const [restoreRuralExempt, { isLoading: restoreRuralLoading }] = useRestoreRuralExemptEmployeeMutation();
  const restoreExemptEmployee = isUrban ? restoreUrbanExempt : restoreRuralExempt;
  const restoreLoading = isUrban ? restoreUrbanLoading : restoreRuralLoading;

  const [createUrbanTeams, { isLoading: urbanCreateLoading }] = useCreateUrbanTeamsMutation();
  const [createRuralTeams, { isLoading: ruralCreateLoading }] = useCreateRuralTeamsMutation();
  const createTeams = isUrban ? createUrbanTeams : createRuralTeams;
  const createLoading = isUrban ? urbanCreateLoading : ruralCreateLoading;

  const [applyUrbanDuty, { isLoading: applyingUrbanDuty }] = useApplyUrbanDutyMutation();
  const [applyRuralDuty, { isLoading: applyingRuralDuty }] = useApplyRuralDutyMutation();
  const dutyLoading = isUrban ? applyingUrbanDuty : applyingRuralDuty;

  const [dutyCriteria, setDutyCriteria] = useState<Record<string, string>>({
    P0: 'any',
    P1: 'any',
    P2: 'any',
    P3: 'any',
    P4: 'any'
  });

  const postOptions = useMemo(() => (isUrban ? ['P0', 'P1', 'P2', 'P3'] : ['P0', 'P1', 'P2', 'P3', 'P4']), [isUrban]);

  const updateDutyCriteria = (field: string, value: string) => {
    setDutyCriteria((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyDuty = async () => {
    try {
      const payload: any = {
        P0: dutyCriteria.P0,
        P1: dutyCriteria.P1,
        P2: dutyCriteria.P2,
        P3: dutyCriteria.P3,
        P4: dutyCriteria.P4
      };
      if (selectedCityId && (selectedCityId as any) !== 'all') payload.city_id = Number(selectedCityId);
      const response = await (isUrban ? applyUrbanDuty : applyRuralDuty)(payload).unwrap();
      dispatch(showNotification({ message: response.message || t('common.success'), severity: 'success' }));
    } catch (error: any) {
      dispatch(showNotification({ message: error?.data?.message || error?.message || t('election.applyDutyFailed'), severity: 'error' }));
    }
  };

  // 5. Fetch exempt employee logs
  const { data: logsData, isFetching: logsLoading } = useGetExemptEmployeeLogsQuery();
  const logs = logsData || [];

  const filteredLogs = useMemo(() => {
    const term = logSearch.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((log: any) => {
      const code = String(log.emp_code || '').toLowerCase();
      const name = String(log.employee?.name || '').toLowerCase();
      const desig = String(log.employee?.designation?.designation || log.employee?.designation?.name || '').toLowerCase();
      const urbanPost = String(log.urban_post || '').toLowerCase();
      const ruralPost = String(log.rural_post || '').toLowerCase();
      const uReason = String(log.urban_reason || '').toLowerCase();
      const rReason = String(log.rural_reason || '').toLowerCase();
      return (
        code.includes(term) ||
        name.includes(term) ||
        desig.includes(term) ||
        urbanPost.includes(term) ||
        ruralPost.includes(term) ||
        uReason.includes(term) ||
        rReason.includes(term)
      );
    });
  }, [logs, logSearch]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (logPage - 1) * logRowsPerPage;
    return filteredLogs.slice(startIndex, startIndex + logRowsPerPage);
  }, [filteredLogs, logPage, logRowsPerPage]);

  const [applyUrbanTargetedDuty, { isLoading: applyUrbanTargetedLoading }] = useApplyUrbanTargetedDutyMutation();
  const [applyRuralTargetedDuty, { isLoading: applyRuralTargetedLoading }] = useApplyRuralTargetedDutyMutation();
  const applyTargetedDuty = isUrban ? applyUrbanTargetedDuty : applyRuralTargetedDuty;
  const applyTargetedLoading = isUrban ? applyUrbanTargetedLoading : applyRuralTargetedLoading;

  const handleApplyTargetedDuty = async () => {
    if (!activeTargetedDuty) return;
    const finalLimit = Math.max(1, Math.min(activeTargetedDuty.vacant_count, Number(targetedLimit) || 1));
    try {
      const response = await applyTargetedDuty({
        city_id: activeTargetedDuty.city_id,
        post_name: activeTargetedDuty.post_name,
        gender: targetedGender,
        designation_id: targetedDesignationId || null,
        limit: finalLimit
      }).unwrap();

      dispatch(showNotification({ message: response.message || t('common.success'), severity: 'success' }));
      setActiveTargetedDuty(null);
    } catch (error: any) {
      dispatch(showNotification({ message: error.data?.message || error.message || t('common.error'), severity: 'error' }));
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

  const handleRestoreExempt = async (logId: number | number[]) => {
    try {
      const response = await restoreExemptEmployee({ log_id: logId }).unwrap();
      dispatch(showNotification({ message: response.message || t('election.restoreExemptSuccess'), severity: 'success' }));
    } catch (err: any) {
      const errMsg = err.data?.message || err.message || t('election.restoreExemptFailed');
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
    <Stack sx={{ gap: 2 }}>
      {/* Top Tab Switcher Bar */}
      <Card sx={(theme) => ({ ...getSurfaceSx(theme), p: 1 })}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 700,
              fontSize: '0.95rem',
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              py: 1.2,
              minHeight: 44
            }
          }}
        >
          <Tab
            label={t('election.tabAssignments')}
            value="assignments"
            icon={<PeopleAltOutlined />}
            iconPosition="start"
          />
          <Tab
            label={t('election.tabAttendance')}
            value="attendance"
            icon={<AssignmentIndOutlined />}
            iconPosition="start"
          />
          <Tab
            label={t('election.tabReports')}
            value="reports"
            icon={<AssessmentOutlined />}
            iconPosition="start"
          />
        </Tabs>
      </Card>

      {/* Shared Location Selection Bar (State, District, City) */}
      <Card sx={(theme) => ({ ...getSurfaceSx(theme), p: 2 })}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          {isMultiDistrictUser && (
            <>
              <Grid size={{ xs: 12, md: 3 }}>
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
                      setSelectedCityId('');
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth disabled={(selectedStateId as any) === ''}>
                  <ChosenSelect
                    label={t('masters.district') || 'District'}
                    placeholder={(selectedStateId as any) === '' ? 'Select State First' : 'All Districts'}
                    value={selectedDistrictId}
                    options={
                      (selectedStateId as any) === ''
                        ? []
                        : [
                            { value: 'all', label: 'All Districts' },
                            ...filteredDistricts.map((d: any) => ({ value: d.id, label: d.name }))
                          ]
                    }
                    onChange={(event) => {
                      const val = event.target.value;
                      setSelectedDistrictId(val === 'all' ? 'all' : val === '' ? '' : Number(val));
                      setSelectedCityId('');
                    }}
                  />
                </FormControl>
              </Grid>
            </>
          )}
          <Grid size={{ xs: 12, md: isMultiDistrictUser ? 6 : 12 }}>
            <FormControl fullWidth disabled={isMultiDistrictUser && (selectedStateId as any) === ''}>
              <ChosenSelect
                label={isUrban ? t('election.selectNpCity') : t('election.selectRnCity')}
                placeholder={t('election.chooseCity')}
                value={selectedCityId}
                options={filteredCities.map((city: any) => {
                  const distObj = allDistrictsList.find((d: any) => Number(d.id) === Number(city.district_id));
                  const labelPrefix = (selectedDistrictId === 'all' || selectedDistrictId === '') && distObj ? `[${distObj.name}] ` : '';
                  return { value: city.id, label: `${labelPrefix}${city.karyalay_name || city.city_name}` };
                })}
                onChange={(event) => setSelectedCityId(event.target.value)}
              />
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Tab 1 Specific Filter & Search Bar */}
      {activeTab === 'assignments' && (
        <Card sx={(theme) => ({ ...getSurfaceSx(theme), p: 2 })}>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 5 }}>
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
            <Grid size={{ xs: 12, md: 5 }}>
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
      )}

      {/* Tab 2: Team Attendance List View */}
      {activeTab === 'attendance' && (
        <TeamAttendanceList
          teams={dashboardData?.teams || []}
          cityName={selectedCityObj?.karyalay_name || dashboardData?.karyalay_name || selectedCityObj?.city_name || dashboardData?.city_name || ''}
          districtName={selectedDistrictObj?.name || selectedDistrictObj?.district_name || ''}
          isUrban={isUrban}
          postHeaders={postHeaders}
        />
      )}

      {/* Tab 3: Team Member Report Cards View */}
      {activeTab === 'reports' && (
        <TeamReportCards
          teams={dashboardData?.teams || []}
          cityName={selectedCityObj?.karyalay_name || dashboardData?.karyalay_name || selectedCityObj?.city_name || dashboardData?.city_name || ''}
          districtName={selectedDistrictObj?.name || selectedDistrictObj?.district_name || ''}
          isUrban={isUrban}
          postHeaders={postHeaders}
        />
      )}

      {/* Tab 1: Team Assignments View */}
      {activeTab === 'assignments' && (
        <>
          <MainCard title={t('election.dutyCriteria')} sx={getSurfaceSx} headerSX={{ p: { xs: 2, sm: 2.5 } }}>
        <Grid container spacing={2.5}>
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
              sx={{ borderRadius: 2, minHeight: 42, px: 2.75, textTransform: 'none', fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}
            >
              {t('election.applyDuty')}
            </Button>
          </Grid>
        </Grid>
      </MainCard>

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
      <ExemptEmployeeForm
        onExempt={handleExemptEmployee}
        onRestoreExempt={handleRestoreExempt}
        loading={exemptLoading}
        restoreLoading={restoreLoading}
        exemptedLogs={logs}
      />
      </>
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
                  const raw = e.target.value;
                  if (raw === '') {
                    setTargetedLimit('');
                    return;
                  }
                  const parsed = parseInt(raw, 10);
                  if (isNaN(parsed)) {
                    setTargetedLimit('');
                  } else if (parsed > activeTargetedDuty.vacant_count) {
                    setTargetedLimit(activeTargetedDuty.vacant_count);
                  } else {
                    setTargetedLimit(parsed);
                  }
                }}
                onBlur={() => {
                  if (targetedLimit === '' || Number(targetedLimit) < 1) {
                    setTargetedLimit(1);
                  }
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
