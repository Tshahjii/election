import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
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
  useGetOptionsQuery,
  useGetMastersQuery,
  useLazyGetMastersQuery,
  useCreateMasterMutation,
  useUpdateMasterMutation,
  useDeleteMasterMutation,
  useImportMasterMutation
} from 'store/apiSlice';

// assets
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import UploadFileOutlined from '@mui/icons-material/UploadFileOutlined';
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined';
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

const csvEscape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

function downloadCsvTemplate(title: string, columns: { key: string; label: string; required?: boolean }[]) {
  const headers = columns.map((column) => column.key);
  const helperRow = columns.map((column) => `${column.label}${column.required ? ' (required)' : ''}`);
  const csv = [headers, helperRow].map((row) => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'import'}-template.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function firstValue(...values: any[]) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

export default function RPCities() {
  const dispatch = useDispatch();
  const { t, tl } = useAppPreferences();
  const { user } = useSelector((state: any) => state.auth);

  const [filters, setFilters] = useState({ search: '', status: '', state_id: '', district_id: '' });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [modal, setModal] = useState({ open: false, mode: 'create', row: null });
  const [deleteRow, setDeleteRow] = useState(null);
  const [form, setForm] = useState<Record<string, any>>({ state_id: '', district_id: '', city_name: '', karyalay_name: '', status: 1 });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<any[]>([]);

  const canCreate = hasPermission(user, 'masters.cities.create');
  const canEdit = hasPermission(user, 'masters.cities.edit');
  const canDelete = hasPermission(user, 'masters.cities.delete');

  const { data: optionsData } = useGetOptionsQuery();
  const options = useMemo(() => {
    return optionsData || { states: [], districts: [] };
  }, [optionsData]);

  const debouncedFilters = useDebounce(filters, 400);

  const { data: listData, isFetching: loading } = useGetMastersQuery({
    type: 'rp-cities',
    params: {
      search: debouncedFilters.search || undefined,
      status: debouncedFilters.status === '' ? undefined : debouncedFilters.status,
      state_id: debouncedFilters.state_id || undefined,
      district_id: debouncedFilters.district_id || undefined,
      page,
      per_page: rowsPerPage
    }
  });

  const [triggerExportQuery] = useLazyGetMastersQuery();
  const [createMaster] = useCreateMasterMutation();
  const [updateMaster] = useUpdateMasterMutation();
  const [deleteMaster] = useDeleteMasterMutation();
  const [importMaster, { isLoading: importing }] = useImportMasterMutation();

  const filterDistrictOptions = useMemo(() => {
    if (!filters.state_id) return options.districts;
    return options.districts.filter((district: any) => Number(district.state_id) === Number(filters.state_id));
  }, [filters.state_id, options.districts]);

  const formDistrictOptions = useMemo(() => {
    if (!form.state_id) return [];
    return options.districts.filter((district: any) => Number(district.state_id) === Number(form.state_id));
  }, [form.state_id, options.districts]);

  const rows = useMemo(() => {
    return listData?.data || [];
  }, [listData]);

  const totalRows = listData?.total || 0;

  const exportTitle = `Nagri Nikay Cities Report`;
  const exportColumns = useMemo(
    () => [
      { key: '__sno', label: t('common.sno') || 'S.No.' },
      { key: 'city_name', label: tl('City Name') },
      { key: 'karyalay_name', label: tl('Karyalay Name') },
      { key: 'district_name', label: tl('District') },
      { key: 'state_name', label: tl('State') },
      { key: 'status_label', label: t('common.status') || 'Status' }
    ],
    [t, tl]
  );

  const handleGetRows = async () => {
    const result = await triggerExportQuery({
      type: 'rp-cities',
      params: {
        search: debouncedFilters.search || undefined,
        status: debouncedFilters.status === '' ? undefined : debouncedFilters.status,
        state_id: debouncedFilters.state_id || undefined,
        district_id: debouncedFilters.district_id || undefined,
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
    const next: Record<string, any> = { state_id: '', district_id: '', city_name: '', karyalay_name: '', status: 1 };
    const stateVal = firstValue(user?.state_id, user?.state_info?.id, user?.office_info?.state_id);
    const districtVal = firstValue(user?.district_id, user?.district_info?.id, user?.office_info?.district_id);
    if (stateVal) next.state_id = Number(stateVal);
    if (districtVal) next.district_id = Number(districtVal);

    setForm(next);
    setErrors({});
    setModal({ open: true, mode: 'create', row: null });
  };

  const handleOpenEdit = (row) => {
    setForm({
      state_id: row.state_id || '',
      district_id: row.district_id || '',
      city_name: row.city_name || '',
      karyalay_name: row.karyalay_name || '',
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
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'state_id') {
        next.district_id = '';
      }
      return next;
    });
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    const clientErrors: Record<string, string> = {};
    if (!form.state_id) clientErrors.state_id = 'State is required.';
    if (!form.district_id) clientErrors.district_id = 'District is required.';
    if (!form.city_name || form.city_name.trim() === '') clientErrors.city_name = 'City Name is required.';
    if (!form.karyalay_name || form.karyalay_name.trim() === '') clientErrors.karyalay_name = 'Karyalay Name is required.';

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      dispatch(showNotification({ message: 'Please correct the validation errors in the form.', severity: 'error' }));
      return;
    }

    try {
      if (modal.mode === 'edit') {
        await updateMaster({ type: 'rp-cities', id: modal.row.id, data: form }).unwrap();
      } else {
        await createMaster({ type: 'rp-cities', data: form }).unwrap();
      }
      dispatch(showNotification({ message: `Nagri Nikay City saved successfully.` }));
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

  const handleImportFileChange = (event: any) => {
    const file = event.target.files?.[0] || null;
    if (file && !file.name.toLowerCase().endsWith('.csv')) {
      dispatch(showNotification({ message: 'Please upload a CSV file.', severity: 'error' }));
      event.target.value = '';
      setImportFile(null);
      return;
    }
    setImportErrors([]);
    setImportFile(file);
  };

  const handleDownloadTemplate = () => {
    downloadCsvTemplate(`rp-cities-import`, [
      { key: 'state_id', label: tl('State'), required: true },
      { key: 'district_id', label: tl('District'), required: true },
      { key: 'city_name', label: tl('City Name'), required: true },
      { key: 'karyalay_name', label: tl('Karyalay Name'), required: true },
      { key: 'status', label: t('common.status') || 'Status', required: false }
    ]);
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      dispatch(showNotification({ message: 'Please choose a CSV file to import.', severity: 'error' }));
      return;
    }

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const response = await importMaster({ type: 'rp-cities', data: formData }).unwrap();
      setImportErrors(response.failed || []);
      dispatch(showNotification({ message: response.message || 'Import completed.', severity: response.failed?.length ? 'warning' : 'success' }));
      if (!response.failed?.length) {
        setImportModalOpen(false);
        setImportFile(null);
      }
    } catch (error: any) {
      const errMsg = error?.data?.message || error?.message || 'Import failed.';
      dispatch(showNotification({ message: errMsg, severity: 'error' }));
    }
  };

  const handleDelete = async () => {
    if (!deleteRow) return;

    try {
      await deleteMaster({ type: 'rp-cities', id: deleteRow.id }).unwrap();
      dispatch(showNotification({ message: `Nagri Nikay City deleted successfully.` }));
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
            {t('masters.managePrefix')} Nagri Nikay cities {t('masters.manageSuffix')}
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <DownloadMenu title={exportTitle} columns={exportColumns} getRowsLazy={handleGetRows} disabled={loading} />
          {canCreate && (
            <Button variant="outlined" color="secondary" startIcon={<UploadFileOutlined />} onClick={() => setImportModalOpen(true)} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
              Import
            </Button>
          )}
          {canCreate && (
            <Button variant="contained" color="primary" startIcon={<AddOutlined />} onClick={handleOpenCreate} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
              {t('common.create')} Nagri Nikay City
            </Button>
          )}
        </Stack>
      </Stack>

      <MainCard sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: '0 14px 36px rgba(15, 23, 42, 0.07)' }} contentSX={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <SearchTextField
              fullWidth
              size="small"
              label={`${t('common.search')} Nagri Nikay Cities`}
              value={filters.search}
              onChange={handleSearchFilterChange}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <ChosenSelect
                label={t('common.allStates')}
                value={filters.state_id}
                placeholder={t('common.allStates')}
                options={[{ value: '', label: t('common.allStates') }, ...options.states.map((s: any) => ({ value: s.id, label: s.name }))]}
                onChange={(event) => {
                  setFilters((current) => ({ ...current, state_id: event.target.value, district_id: '' }));
                  setPage(1);
                }}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <ChosenSelect
                label={t('common.allDistricts')}
                value={filters.district_id}
                placeholder={t('common.allDistricts')}
                options={[{ value: '', label: t('common.allDistricts') }, ...filterDistrictOptions.map((d: any) => ({ value: d.id, label: d.name }))]}
                onChange={(event) => {
                  setFilters((current) => ({ ...current, district_id: event.target.value }));
                  setPage(1);
                }}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
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
          <Grid size={{ xs: 12, md: 1 }}>
            <FormControl fullWidth>
              <ChosenSelect
                label={t('common.rows') || 'Rows'}
                value={rowsPerPage}
                options={[10, 25, 50, 100].map((value) => ({ value, label: `${value}` }))}
                onChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(1); }}
              />
            </FormControl>
          </Grid>
        </Grid>
      </MainCard>

      <MainCard
        title={`Nagri Nikay Cities (${totalRows})`}
        sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: '0 14px 36px rgba(15, 23, 42, 0.07)', overflow: 'hidden' }}
        headerSX={{ p: 2, '& .MuiCardHeader-title': { fontSize: '1rem' } }}
        contentSX={{ p: 2, '&:last-child': { pb: 2 } }}
      >
        <TableContainer sx={{ '&::-webkit-scrollbar': { height: 8 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 8 } }}>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'bg.100' }}>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{t('common.sno')}</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>City Name</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Karyalay Name</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>District</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>State</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{t('common.status')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{t('common.action')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={`rp-cities-${row.id}`} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell>{(page - 1) * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{row.city_name || '-'}</TableCell>
                  <TableCell>{row.karyalay_name || '-'}</TableCell>
                  <TableCell>{row.district_name || '-'}</TableCell>
                  <TableCell>{row.state_name || '-'}</TableCell>
                  <TableCell>
                    <Chip label={Number(row.status) === 1 ? t('common.active') : t('common.inactive')} size="small" color={Number(row.status) === 1 ? 'success' : 'error'} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 0.5 }}>
                      {canEdit && (
                        <IconButton size="small" color="success" aria-label={`edit city`} onClick={() => handleOpenEdit(row)}>
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton size="small" color="error" aria-label={`delete city`} onClick={() => setDeleteRow(row)}>
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

      <Dialog open={modal.open} onClose={handleCloseModal} fullWidth maxWidth="md">
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogTitle component="div" sx={{ pb: 1 }}>
            <Typography variant="h3" component="h2">
              {modal.mode === 'edit' ? t('common.update') : t('common.create')} Nagri Nikay City
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ pt: 0.5 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required error={!!errors.state_id}>
                  <ChosenSelect
                    required
                    label={tl('State')}
                    value={form.state_id}
                    placeholder={t('field.state')}
                    options={options.states.map((s: any) => ({ value: s.id, label: s.name }))}
                    onChange={handleFormChange('state_id')}
                    error={!!errors.state_id}
                    helperText={errors.state_id}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required error={!!errors.district_id}>
                  <ChosenSelect
                    required
                    label={tl('District')}
                    value={form.district_id}
                    placeholder={t('field.district')}
                    options={formDistrictOptions.map((d: any) => ({ value: d.id, label: d.name }))}
                    onChange={handleFormChange('district_id')}
                    error={!!errors.district_id}
                    helperText={errors.district_id}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label={tl('City Name')}
                  value={form.city_name}
                  onChange={handleFormChange('city_name')}
                  error={!!errors.city_name}
                  helperText={errors.city_name}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label={tl('Karyalay Name')}
                  value={form.karyalay_name}
                  onChange={handleFormChange('karyalay_name')}
                  error={!!errors.karyalay_name}
                  helperText={errors.karyalay_name}
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

      <Dialog open={importModalOpen} onClose={() => setImportModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle component="div" sx={{ pb: 1 }}>
          <Typography variant="h3" component="h2">
            Import Nagri Nikay Cities
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Upload a CSV file with the template columns. Existing duplicate values will be rejected row-wise.
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack sx={{ gap: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1 }}>
              <Button variant="outlined" startIcon={<InsertDriveFileOutlined />} onClick={handleDownloadTemplate} sx={{ borderRadius: 2, textTransform: 'none' }}>
                Download Template
              </Button>
              <Button component="label" variant="contained" startIcon={<UploadFileOutlined />} sx={{ borderRadius: 2, textTransform: 'none' }}>
                {importFile?.name || 'Choose CSV'}
                <input hidden type="file" accept=".csv,text/csv" onChange={handleImportFileChange} />
              </Button>
            </Stack>
            {importErrors.length > 0 && (
              <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'warning.light', borderRadius: 1.5, bgcolor: 'warning.lighter', maxHeight: 220, overflow: 'auto' }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Rows needing correction
                </Typography>
                <Stack sx={{ gap: 0.75 }}>
                  {importErrors.slice(0, 8).map((item, index) => (
                    <Typography key={`${item.line}-${index}`} variant="caption" color="text.secondary">
                      Line {item.line}: {(item.errors || []).join(', ')}
                    </Typography>
                  ))}
                  {importErrors.length > 8 && (
                    <Typography variant="caption" color="text.secondary">
                      +{importErrors.length - 8} more rows.
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button variant="outlined" color="inherit" onClick={() => setImportModalOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" startIcon={<UploadFileOutlined />} onClick={handleImportSubmit} disabled={importing || !importFile}>
            {importing ? 'Importing...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteRow)} onClose={() => setDeleteRow(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t('common.delete')} Nagri Nikay City</DialogTitle>
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
