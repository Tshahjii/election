import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// project imports
import MainCard from 'components/cards/MainCard';
import ChosenSelect from 'components/ChosenSelect';
import DownloadMenu from 'components/DownloadMenu';
import PaginationFooter from 'components/PaginationFooter';
import { useAppPreferences } from 'contexts/AppPreferences';
import { showNotification } from 'store/slices/notificationSlice';
import { hasPermission } from 'utils/access';
import { useDebounce } from '../../hooks/useDebounce';
import {
  useGetMastersQuery,
  useLazyGetMastersQuery,
  useCreateMasterMutation,
  useUpdateMasterMutation,
  useDeleteMasterMutation,
  useGetElectionSalaryRulesQuery,
  useSaveElectionSalaryRulesMutation
} from 'store/apiSlice';

// assets
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';

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

export default function PayLevels() {
  const dispatch = useDispatch();
  const { t, tl } = useAppPreferences();
  const { user } = useSelector((state: any) => state.auth);

  const [filters, setFilters] = useState({ search: '', status: '' });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [modal, setModal] = useState({ open: false, mode: 'create', row: null });
  const [deleteRow, setDeleteRow] = useState(null);
  const [form, setForm] = useState({ level: '', min_amount_pay: '', max_amount_pay: '', grade_pay: '', status: 1 });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [salaryRulesModalOpen, setSalaryRulesModalOpen] = useState(false);
  const [salaryRules, setSalaryRules] = useState<any[]>([]);
  const [savingSalaryRules, setSavingSalaryRules] = useState(false);

  const canCreate = hasPermission(user, 'hrms.pay_levels.create');
  const canEdit = hasPermission(user, 'hrms.pay_levels.edit');
  const canDelete = hasPermission(user, 'hrms.pay_levels.delete');

  const debouncedFilters = useDebounce(filters, 400);

  const { data: listData, isFetching: loading } = useGetMastersQuery({
    type: 'pay-levels',
    params: {
      search: debouncedFilters.search || undefined,
      status: debouncedFilters.status === '' ? undefined : debouncedFilters.status,
      page,
      per_page: rowsPerPage
    }
  });

  const [triggerExportQuery] = useLazyGetMastersQuery();
  const [createMaster] = useCreateMasterMutation();
  const [updateMaster] = useUpdateMasterMutation();
  const [deleteMaster] = useDeleteMasterMutation();

  const [saveElectionSalaryRules] = useSaveElectionSalaryRulesMutation();
  const { data: salaryRulesData, isFetching: loadingSalaryRules } = useGetElectionSalaryRulesQuery(undefined, {
    skip: !salaryRulesModalOpen
  });

  useEffect(() => {
    if (salaryRulesData) {
      setSalaryRules(salaryRulesData.map((rule: any) => ({ ...rule })));
    }
  }, [salaryRulesData]);

  const rows = useMemo(() => {
    return listData?.data || [];
  }, [listData]);

  const totalRows = listData?.total || 0;

  const exportTitle = `${t('masters.payLevels') || 'Pay Scale / Pay Level'} Report`;
  const exportColumns = useMemo(
    () => [
      { key: '__sno', label: t('common.sno') || 'S.No.' },
      { key: 'level', label: tl('Level') },
      { key: 'min_amount_pay', label: tl('Min Amount Pay') },
      { key: 'max_amount_pay', label: tl('Max Amount Pay') },
      { key: 'grade_pay', label: tl('Grade Pay') },
      { key: 'status_label', label: t('common.status') || 'Status' }
    ],
    [t, tl]
  );

  const handleGetRows = async () => {
    const result = await triggerExportQuery({
      type: 'pay-levels',
      params: {
        search: debouncedFilters.search || undefined,
        status: debouncedFilters.status === '' ? undefined : debouncedFilters.status,
        page: 1,
        per_page: Math.max(Number(listData?.total || 0), 10000)
      }
    }).unwrap();

    const rawRows = result?.data || [];
    return rawRows.map((row, index) => ({
      ...row,
      __sno: index + 1,
      status_label: Number(row.status) === 1 ? t('common.active') : t('common.inactive')
    }));
  };

  const handleSearchFilterChange = (value: string) => {
    setFilters((current) => ({ ...current, search: value }));
    setPage(1);
  };

  const handleOpenCreate = () => {
    setForm({ level: '', min_amount_pay: '', max_amount_pay: '', grade_pay: '', status: 1 });
    setErrors({});
    setModal({ open: true, mode: 'create', row: null });
  };

  const handleOpenEdit = (row) => {
    setForm({
      level: row.level || '',
      min_amount_pay: row.min_amount_pay || '',
      max_amount_pay: row.max_amount_pay || '',
      grade_pay: row.grade_pay || '',
      status: Number(row.status)
    });
    setErrors({});
    setModal({ open: true, mode: 'edit', row });
  };

  const handleCloseModal = () => {
    setModal({ open: false, mode: 'create', row: null });
    setErrors({});
  };

  const handleFormChange = (field: string) => (event: any) => {
    const value = event.target.value;
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    const clientErrors: Record<string, string> = {};
    if (!form.level || form.level.trim() === '') clientErrors.level = 'Level is required.';
    if (!form.min_amount_pay || String(form.min_amount_pay).trim() === '') clientErrors.min_amount_pay = 'Min Amount Pay is required.';
    if (!form.max_amount_pay || String(form.max_amount_pay).trim() === '') clientErrors.max_amount_pay = 'Max Amount Pay is required.';
    if (!form.grade_pay || form.grade_pay.trim() === '') clientErrors.grade_pay = 'Grade Pay is required.';

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      dispatch(showNotification({ message: 'Please correct the validation errors in the form.', severity: 'error' }));
      return;
    }

    try {
      if (modal.mode === 'edit') {
        await updateMaster({ type: 'pay-levels', id: modal.row.id, data: form }).unwrap();
      } else {
        await createMaster({ type: 'pay-levels', data: form }).unwrap();
      }
      dispatch(showNotification({ message: `${t('masters.payLevel') || 'Pay Level'} saved successfully.` }));
      handleCloseModal();
    } catch (error: any) {
      const errorData = error?.data;
      if (error?.status === 422) {
        const responseErrors = errorData?.errors || {};
        const formattedErrors: Record<string, string> = {};
        Object.keys(responseErrors).forEach((key) => {
          formattedErrors[key] = Array.isArray(responseErrors[key]) ? responseErrors[key][0] : String(responseErrors[key]);
        });
        setErrors(formattedErrors);
        dispatch(showNotification({ message: 'Validation failed. Please check the marked fields.', severity: 'error' }));
      } else {
        const errMsg = errorData?.message || error?.message || 'Unable to complete request.';
        dispatch(showNotification({ message: errMsg, severity: 'error' }));
      }
    }
  };

  const handleSaveSalaryRules = async () => {
    try {
      setSavingSalaryRules(true);
      await saveElectionSalaryRules({ rules: salaryRules }).unwrap();
      dispatch(showNotification({ message: 'Election salary rules updated successfully.' }));
      setSalaryRulesModalOpen(false);
    } catch (error: any) {
      dispatch(showNotification({ message: error?.data?.message || 'Failed to save salary rules.', severity: 'error' }));
    } finally {
      setSavingSalaryRules(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteRow) return;

    try {
      await deleteMaster({ type: 'pay-levels', id: deleteRow.id }).unwrap();
      dispatch(showNotification({ message: `${t('masters.payLevel') || 'Pay Level'} deleted successfully.` }));
      setDeleteRow(null);
    } catch (error: any) {
      const errMsg = error?.data?.message || error?.message || 'Unable to complete request.';
      dispatch(showNotification({ message: errMsg, severity: 'error' }));
    }
  };

  return (
    <Stack sx={{ gap: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h2">{t('masters.master')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('masters.managePrefix')} {(t('masters.payLevels') || 'Pay scale').toLowerCase()} {t('masters.manageSuffix')}
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <DownloadMenu title={exportTitle} columns={exportColumns} getRowsLazy={handleGetRows} disabled={loading} />
          <Button
            variant="outlined"
            color="primary"
            startIcon={<SettingsOutlined />}
            onClick={() => setSalaryRulesModalOpen(true)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            {t('election.salaryRulesBtn') || 'Salary Rules'}
          </Button>
          {canCreate && (
            <Button variant="contained" color="primary" startIcon={<AddOutlined />} onClick={handleOpenCreate} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
              {t('common.create')} {t('masters.payLevel') || 'Pay Scale'}
            </Button>
          )}
        </Stack>
      </Stack>

      <MainCard sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: '0 14px 36px rgba(15, 23, 42, 0.07)' }} contentSX={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <SearchTextField
              fullWidth
              size="small"
              label={`${t('common.search')} ${t('masters.payLevels') || 'Pay Scale / Pay Level'}`}
              value={filters.search}
              onChange={handleSearchFilterChange}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <ChosenSelect
                label={t('common.status')}
                value={filters.status}
                placeholder={t('common.allStatus')}
                options={[
                  { value: '', label: t('common.allStatus') },
                  { value: 1, label: t('common.active') },
                  { value: 0, label: t('common.inactive') }
                ]}
                onChange={(event) => {
                  setFilters((current) => ({ ...current, status: event.target.value }));
                  setPage(1);
                }}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <ChosenSelect
                label={t('common.rows') || 'Rows'}
                value={rowsPerPage}
                options={[10, 25, 50, 100].map((value) => ({ value, label: `${value} ${t('common.rows') || 'rows'}` }))}
                onChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(1); }}
              />
            </FormControl>
          </Grid>
        </Grid>
      </MainCard>

      <MainCard
        title={`${t('masters.payLevels') || 'Pay Levels'} (${totalRows})`}
        sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: '0 14px 36px rgba(15, 23, 42, 0.07)', overflow: 'hidden' }}
        headerSX={{ p: 2, '& .MuiCardHeader-title': { fontSize: '1rem' } }}
        contentSX={{ p: 2, '&:last-child': { pb: 2 } }}
      >
        <TableContainer sx={{ '&::-webkit-scrollbar': { height: 8 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 8 } }}>
          <Table sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'bg.100' }}>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{t('common.sno')}</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Level</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Min Amount Pay</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Max Amount Pay</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Grade Pay</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{t('common.status')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{t('common.action')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={`pay-levels-${row.id}`} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell>{(page - 1) * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{row.level || '-'}</TableCell>
                  <TableCell>{row.min_amount_pay || '-'}</TableCell>
                  <TableCell>{row.max_amount_pay || '-'}</TableCell>
                  <TableCell>{row.grade_pay || '-'}</TableCell>
                  <TableCell>
                    <Chip label={Number(row.status) === 1 ? t('common.active') : t('common.inactive')} size="small" color={Number(row.status) === 1 ? 'success' : 'error'} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 0.5 }}>
                      {canEdit && (
                        <IconButton size="small" color="success" aria-label={`edit pay level`} onClick={() => handleOpenEdit(row)}>
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton size="small" color="error" aria-label={`delete pay level`} onClick={() => setDeleteRow(row)}>
                          <DeleteOutlineOutlined fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {t('common.noRecords')}
                  </TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {t('common.loading')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <PaginationFooter page={page} rowsPerPage={rowsPerPage} totalRows={totalRows} onPageChange={setPage} />
      </MainCard>

      <Dialog open={modal.open} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogTitle component="div" sx={{ pb: 1 }}>
            <Typography variant="h3" component="h2">
              {modal.mode === 'edit' ? t('common.update') : t('common.create')} {t('masters.payLevel') || 'Pay scale'}
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ pt: 0.5 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label={tl('Level')}
                  value={form.level}
                  onChange={handleFormChange('level')}
                  error={!!errors.level}
                  helperText={errors.level}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label={tl('Min Amount Pay')}
                  value={form.min_amount_pay}
                  onChange={handleFormChange('min_amount_pay')}
                  error={!!errors.min_amount_pay}
                  helperText={errors.min_amount_pay}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label={tl('Max Amount Pay')}
                  value={form.max_amount_pay}
                  onChange={handleFormChange('max_amount_pay')}
                  error={!!errors.max_amount_pay}
                  helperText={errors.max_amount_pay}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label={tl('Grade Pay')}
                  value={form.grade_pay}
                  onChange={handleFormChange('grade_pay')}
                  error={!!errors.grade_pay}
                  helperText={errors.grade_pay}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <ChosenSelect
                    label={t('common.status')}
                    value={form.status}
                    size="small"
                    options={[
                      { value: 1, label: t('common.active') },
                      { value: 0, label: t('common.inactive') }
                    ]}
                    onChange={handleFormChange('status')}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 1.5 }}>
            <Button variant="outlined" color="inherit" size="small" onClick={handleCloseModal}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="contained" color="primary" size="small" startIcon={<AddOutlined />}>
              {t('common.save')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={salaryRulesModalOpen}
        onClose={() => setSalaryRulesModalOpen(false)}
        fullWidth
        maxWidth="sm"
        sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}
      >
        <DialogTitle component="div" sx={{ pb: 1, pt: 2.5 }}>
          <Typography variant="h3" component="h2" sx={{ fontWeight: 700 }}>
            {t('election.salaryRulesTitle') || 'Configure Post Salary Rules'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('election.salaryRulesSubtitle') || 'Set basic pay rules for assigning employees to P0, P1, P2, P3, and P4 posts.'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {loadingSalaryRules ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2.5} sx={{ py: 1 }}>
              {salaryRules.map((rule, index) => (
                <Grid container spacing={2} key={rule.post_name} sx={{ alignItems: 'center' }}>
                  <Grid size={{ xs: 3, sm: 2 }}>
                    <Chip
                      label={rule.post_name}
                      color="primary"
                      sx={{ fontWeight: 700, borderRadius: 1.5, minWidth: 50 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 5, sm: 5 }}>
                    <FormControl fullWidth size="small">
                      <ChosenSelect
                        label={t('election.comparison') || 'Operator'}
                        value={rule.comparison_operator}
                        options={[
                          { value: 'above', label: t('election.above') || 'Above' },
                          { value: 'under', label: t('election.under') || 'Under' }
                        ]}
                        onChange={(e) => {
                          const updated = [...salaryRules];
                          updated[index] = { ...updated[index], comparison_operator: e.target.value };
                          setSalaryRules(updated);
                        }}
                      />
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 4, sm: 5 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label={t('field.basicPay') || 'Basic Pay Limit'}
                      value={rule.min_salary}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value));
                        const updated = [...salaryRules];
                        updated[index] = { ...updated[index], min_salary: val };
                        setSalaryRules(updated);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      slotProps={{
                        htmlInput: {
                          min: 0
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" size="small" onClick={() => setSalaryRulesModalOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            disabled={savingSalaryRules || loadingSalaryRules}
            startIcon={savingSalaryRules ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
            onClick={handleSaveSalaryRules}
            sx={{ borderRadius: 1.5, textTransform: 'none', px: 2.5 }}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteRow)} onClose={() => setDeleteRow(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t('common.delete')} {t('masters.payLevel') || 'Pay scale'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t('common.deleteConfirm')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setDeleteRow(null)}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" color="error" startIcon={<DeleteOutlineOutlined />} onClick={handleDelete}>
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
