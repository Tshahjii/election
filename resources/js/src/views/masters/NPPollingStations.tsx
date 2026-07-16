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
  useDeleteMasterMutation
} from 'store/apiSlice';

// assets
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
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

function firstValue(...values: any[]) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

export default function NPPollingStations() {
  const dispatch = useDispatch();
  const { t, tl } = useAppPreferences();
  const { user } = useSelector((state: any) => state.auth);

  const [filters, setFilters] = useState({ search: '', status: '', state_id: '', district_id: '', city_id: '', ward_id: '' });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [modal, setModal] = useState({ open: false, mode: 'create', row: null });
  const [deleteRow, setDeleteRow] = useState(null);
  const [form, setForm] = useState<Record<string, any>>({ state_id: '', district_id: '', city_id: '', ward_id: '', polling_station_name: '', status: 1 });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canCreate = hasPermission(user, 'masters.polling_stations.create');
  const canEdit = hasPermission(user, 'masters.polling_stations.edit');
  const canDelete = hasPermission(user, 'masters.polling_stations.delete');

  const { data: optionsData } = useGetOptionsQuery();
  const options = useMemo(() => {
    return optionsData || { states: [], districts: [], np_cities: [], np_wards: [] };
  }, [optionsData]);

  const debouncedFilters = useDebounce(filters, 400);

  const { data: listData, isFetching: loading } = useGetMastersQuery({
    type: 'np-polling-stations',
    params: {
      search: debouncedFilters.search || undefined,
      status: debouncedFilters.status === '' ? undefined : debouncedFilters.status,
      state_id: debouncedFilters.state_id || undefined,
      district_id: debouncedFilters.district_id || undefined,
      city_id: debouncedFilters.city_id || undefined,
      ward_id: debouncedFilters.ward_id || undefined,
      page,
      per_page: rowsPerPage
    }
  });

  const [triggerExportQuery] = useLazyGetMastersQuery();
  const [createMaster] = useCreateMasterMutation();
  const [updateMaster] = useUpdateMasterMutation();
  const [deleteMaster] = useDeleteMasterMutation();

  const filterDistrictOptions = useMemo(() => {
    if (!filters.state_id) return options.districts;
    return options.districts.filter((d: any) => Number(d.state_id) === Number(filters.state_id));
  }, [filters.state_id, options.districts]);

  const filterCityOptions = useMemo(() => {
    if (!filters.district_id) return options.np_cities || [];
    return (options.np_cities || []).filter((c: any) => Number(c.district_id) === Number(filters.district_id));
  }, [filters.district_id, options.np_cities]);

  const filterWardOptions = useMemo(() => {
    if (!filters.city_id) return options.np_wards || [];
    return (options.np_wards || []).filter((w: any) => Number(w.city_id) === Number(filters.city_id));
  }, [filters.city_id, options.np_wards]);

  const formDistrictOptions = useMemo(() => {
    if (!form.state_id) return [];
    return options.districts.filter((d: any) => Number(d.state_id) === Number(form.state_id));
  }, [form.state_id, options.districts]);

  const formCityOptions = useMemo(() => {
    if (!form.district_id) return [];
    return (options.np_cities || []).filter((c: any) => Number(c.district_id) === Number(form.district_id));
  }, [form.district_id, options.np_cities]);

  const formWardOptions = useMemo(() => {
    if (!form.city_id) return [];
    return (options.np_wards || []).filter((w: any) => Number(w.city_id) === Number(form.city_id));
  }, [form.city_id, options.np_wards]);

  const rows = useMemo(() => {
    return listData?.data || [];
  }, [listData]);

  const totalRows = listData?.total || 0;

  const exportTitle = `Nagar Panchayat Polling Stations Report`;
  const exportColumns = useMemo(
    () => [
      { key: '__sno', label: t('common.sno') || 'S.No.' },
      { key: 'polling_station_name', label: tl('Polling Station Name') },
      { key: 'ward_name_label', label: tl('Ward') },
      { key: 'city_name_label', label: tl('City') },
      { key: 'district_name', label: tl('District') },
      { key: 'state_name', label: tl('State') },
      { key: 'status_label', label: t('common.status') || 'Status' }
    ],
    [t, tl]
  );

  const handleGetRows = async () => {
    const result = await triggerExportQuery({
      type: 'np-polling-stations',
      params: {
        search: debouncedFilters.search || undefined,
        status: debouncedFilters.status === '' ? undefined : debouncedFilters.status,
        state_id: debouncedFilters.state_id || undefined,
        district_id: debouncedFilters.district_id || undefined,
        city_id: debouncedFilters.city_id || undefined,
        ward_id: debouncedFilters.ward_id || undefined,
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
    const next: Record<string, any> = { state_id: '', district_id: '', city_id: '', ward_id: '', polling_station_name: '', status: 1 };
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
      city_id: row.city_id || '',
      ward_id: row.ward_id || '',
      polling_station_name: row.polling_station_name || '',
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
        next.city_id = '';
        next.ward_id = '';
      }
      if (field === 'district_id') {
        next.city_id = '';
        next.ward_id = '';
      }
      if (field === 'city_id') {
        next.ward_id = '';
      }
      return next;
    });
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    const clientErrors: Record<string, string> = {};
    if (!form.state_id) clientErrors.state_id = 'State is required.';
    if (!form.district_id) clientErrors.district_id = 'District is required.';
    if (!form.city_id) clientErrors.city_id = 'City is required.';
    if (!form.ward_id) clientErrors.ward_id = 'Ward is required.';
    if (!form.polling_station_name || form.polling_station_name.trim() === '') clientErrors.polling_station_name = 'Polling Station Name is required.';

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      dispatch(showNotification({ message: 'Please correct the validation errors in the form.', severity: 'error' }));
      return;
    }

    try {
      if (modal.mode === 'edit') {
        await updateMaster({ type: 'np-polling-stations', id: modal.row.id, data: form }).unwrap();
      } else {
        await createMaster({ type: 'np-polling-stations', data: form }).unwrap();
      }
      dispatch(showNotification({ message: `Nagar Panchayat Polling Station saved successfully.` }));
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

  const handleDelete = async () => {
    if (!deleteRow) return;

    try {
      await deleteMaster({ type: 'np-polling-stations', id: deleteRow.id }).unwrap();
      dispatch(showNotification({ message: `Nagar Panchayat Polling Station deleted successfully.` }));
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
            {t('masters.managePrefix')} Nagar Panchayat polling stations {t('masters.manageSuffix')}
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <DownloadMenu title={exportTitle} columns={exportColumns} getRowsLazy={handleGetRows} disabled={loading} />
          {canCreate && (
            <Button variant="contained" color="primary" startIcon={<AddOutlined />} onClick={handleOpenCreate} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
              {t('common.create')} Nagar Panchayat Polling Station
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
              label={`${t('common.search')} Nagar Panchayat Polling Stations`}
              value={filters.search}
              onChange={handleSearchFilterChange}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <ChosenSelect
                label={t('common.allStates')}
                value={filters.state_id}
                placeholder={t('common.allStates')}
                options={[{ value: '', label: t('common.allStates') }, ...options.states.map((s: any) => ({ value: s.id, label: s.name }))]}
                onChange={(event) => {
                  setFilters((current) => ({ ...current, state_id: event.target.value, district_id: '', city_id: '', ward_id: '' }));
                  setPage(1);
                }}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <ChosenSelect
                label={t('common.allDistricts')}
                value={filters.district_id}
                placeholder={t('common.allDistricts')}
                options={[{ value: '', label: t('common.allDistricts') }, ...filterDistrictOptions.map((d: any) => ({ value: d.id, label: d.name }))]}
                onChange={(event) => {
                  setFilters((current) => ({ ...current, district_id: event.target.value, city_id: '', ward_id: '' }));
                  setPage(1);
                }}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <ChosenSelect
                label={t('common.allCities')}
                value={filters.city_id}
                placeholder={t('common.allCities')}
                options={[{ value: '', label: t('common.allCities') }, ...filterCityOptions.map((c: any) => ({ value: c.id, label: c.city_name }))]}
                onChange={(event) => {
                  setFilters((current) => ({ ...current, city_id: event.target.value, ward_id: '' }));
                  setPage(1);
                }}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <ChosenSelect
                label={t('common.allWards')}
                value={filters.ward_id}
                placeholder={t('common.allWards')}
                options={[{ value: '', label: t('common.allWards') }, ...filterWardOptions.map((w: any) => ({ value: w.id, label: `${w.ward_no} - ${w.ward_name}` }))]}
                onChange={(event) => {
                  setFilters((current) => ({ ...current, ward_id: event.target.value }));
                  setPage(1);
                }}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 1 }}>
            <FormControl fullWidth>
              <ChosenSelect
                label={t('common.status')}
                value={filters.status}
                placeholder={t('common.status')}
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
        </Grid>
      </MainCard>

      <MainCard
        title={`Nagar Panchayat Polling Stations (${totalRows})`}
        sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: '0 14px 36px rgba(15, 23, 42, 0.07)', overflow: 'hidden' }}
        headerSX={{ p: 2, '& .MuiCardHeader-title': { fontSize: '1rem' } }}
        contentSX={{ p: 2, '&:last-child': { pb: 2 } }}
      >
        <TableContainer sx={{ '&::-webkit-scrollbar': { height: 8 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 8 } }}>
          <Table sx={{ minWidth: 960 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'bg.100' }}>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{t('common.sno')}</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Polling Station Name</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Ward</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>City</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>District</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>State</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{t('common.status')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{t('common.action')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={`np-polling-stations-${row.id}`} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell>{(page - 1) * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{row.polling_station_name || '-'}</TableCell>
                  <TableCell>{row.ward_name_label || '-'}</TableCell>
                  <TableCell>{row.city_name_label || '-'}</TableCell>
                  <TableCell>{row.district_name || '-'}</TableCell>
                  <TableCell>{row.state_name || '-'}</TableCell>
                  <TableCell>
                    <Chip label={Number(row.status) === 1 ? t('common.active') : t('common.inactive')} size="small" color={Number(row.status) === 1 ? 'success' : 'error'} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 0.5 }}>
                      {canEdit && (
                        <IconButton size="small" color="success" aria-label={`edit station`} onClick={() => handleOpenEdit(row)}>
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton size="small" color="error" aria-label={`delete station`} onClick={() => setDeleteRow(row)}>
                          <DeleteOutlineOutlined fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {t('common.noRecords')}
                  </TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
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
              {modal.mode === 'edit' ? t('common.update') : t('common.create')} Nagar Panchayat Polling Station
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ pt: 0.5 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
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
              <Grid size={{ xs: 12, sm: 4 }}>
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
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth required error={!!errors.city_id}>
                  <ChosenSelect
                    required
                    label={tl('City')}
                    value={form.city_id}
                    placeholder={t('field.city')}
                    options={formCityOptions.map((c: any) => ({ value: c.id, label: c.city_name }))}
                    onChange={handleFormChange('city_id')}
                    error={!!errors.city_id}
                    helperText={errors.city_id}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required error={!!errors.ward_id}>
                  <ChosenSelect
                    required
                    label={tl('Ward')}
                    value={form.ward_id}
                    placeholder={t('field.ward')}
                    options={formWardOptions.map((w: any) => ({ value: w.id, label: `${w.ward_no} - ${w.ward_name}` }))}
                    onChange={handleFormChange('ward_id')}
                    error={!!errors.ward_id}
                    helperText={errors.ward_id}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label={tl('Polling Station Name')}
                  value={form.polling_station_name}
                  onChange={handleFormChange('polling_station_name')}
                  error={!!errors.polling_station_name}
                  helperText={errors.polling_station_name}
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

      <Dialog open={Boolean(deleteRow)} onClose={() => setDeleteRow(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t('common.delete')} Nagar Panchayat Polling Station</DialogTitle>
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
