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

export default function Offices() {
  const dispatch = useDispatch();
  const { t, tl } = useAppPreferences();
  const { user } = useSelector((state: any) => state.auth);

  const [filters, setFilters] = useState({ search: '', status: '', country_id: '', state_id: '', district_id: '' });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [modal, setModal] = useState({ open: false, mode: 'create', row: null });
  const [deleteRow, setDeleteRow] = useState(null);
  const [form, setForm] = useState<Record<string, any>>({
    office_code: '',
    office_name: '',
    department_id: '',
    office_type: 1,
    ofc_parent_id: 0,
    country_id: '',
    state_id: '',
    district_id: '',
    status: 1
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canCreate = hasPermission(user, 'masters.offices.create');
  const canEdit = hasPermission(user, 'masters.offices.edit');
  const canDelete = hasPermission(user, 'masters.offices.delete');

  const { data: optionsData } = useGetOptionsQuery();
  const options = useMemo(() => {
    return optionsData || {
      countries: [], states: [], districts: [], offices: [], departments: []
    };
  }, [optionsData]);

  const debouncedFilters = useDebounce(filters, 400);

  const { data: listData, isFetching: loading } = useGetMastersQuery({
    type: 'offices',
    params: {
      search: debouncedFilters.search || undefined,
      status: debouncedFilters.status === '' ? undefined : debouncedFilters.status,
      country_id: debouncedFilters.country_id || undefined,
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

  const countriesById = useMemo(() => new Map(options.countries.map((c: any) => [Number(c.id), c.name])), [options.countries]);
  const statesById = useMemo(() => new Map(options.states.map((s: any) => [Number(s.id), s.name])), [options.states]);

  const filterStateOptions = useMemo(() => {
    if (!filters.country_id) return options.states;
    return options.states.filter((state: any) => Number(state.country_id) === Number(filters.country_id));
  }, [filters.country_id, options.states]);

  const filterDistrictOptions = useMemo(() => {
    if (!filters.state_id) return options.districts;
    return options.districts.filter((district: any) => Number(district.state_id) === Number(filters.state_id));
  }, [filters.state_id, options.districts]);

  const formStateOptions = useMemo(() => {
    if (!form.country_id) return options.states;
    return options.states.filter((state: any) => Number(state.country_id) === Number(form.country_id));
  }, [form.country_id, options.states]);

  const formDistrictOptions = useMemo(() => {
    if (!form.state_id) return [];
    return options.districts.filter((district: any) => Number(district.state_id) === Number(form.state_id));
  }, [form.state_id, options.districts]);

  const isSuperAdmin = useMemo(() => {
    return Number(user?.role) === 1 || Number(user?.role) === 2 || user?.access?.is_super_admin;
  }, [user]);

  const accessibleParentOffices = useMemo(() => {
    return isSuperAdmin ? options.offices : options.offices.filter((o: any) => Number(o.ofc_id) === Number(user?.ofc_id));
  }, [isSuperAdmin, options.offices, user]);

  const rows = useMemo(() => {
    return listData?.data || [];
  }, [listData]);

  const decoratedRows = useMemo(() => {
    return rows.map((row: any) => ({
      ...row,
      country_name: row.country_name || countriesById.get(Number(row.country_id)) || '-',
      state_name: row.state_name || statesById.get(Number(row.state_id)) || '-',
      office_type_label: Number(row.office_type) === 2 ? t('data.branchOffice') || 'Branch Office' : t('data.headOffice') || 'Head Office'
    }));
  }, [rows, countriesById, statesById, t]);

  const totalRows = listData?.total || 0;

  const exportTitle = `${t('masters.offices') || 'Offices'} Report`;
  const exportColumns = useMemo(
    () => [
      { key: '__sno', label: t('common.sno') || 'S.No.' },
      { key: 'office_code', label: tl('Code') },
      { key: 'office_name', label: tl('Name') },
      { key: 'department_name', label: tl('Department') },
      { key: 'office_type_label', label: tl('Type') },
      { key: 'district_name', label: tl('District') },
      { key: 'state_name', label: tl('State') },
      { key: 'status_label', label: t('common.status') || 'Status' }
    ],
    [t, tl]
  );

  const handleGetRows = async () => {
    const result = await triggerExportQuery({
      type: 'offices',
      params: {
        search: debouncedFilters.search || undefined,
        status: debouncedFilters.status === '' ? undefined : debouncedFilters.status,
        country_id: debouncedFilters.country_id || undefined,
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
      office_type_label: Number(row.office_type) === 2 ? t('data.branchOffice') || 'Branch Office' : t('data.headOffice') || 'Head Office',
      status_label: Number(row.status) === 1 ? t('common.active') : t('common.inactive')
    }));
  };

  const handleSearchFilterChange = (value: string) => {
    setFilters((current) => ({ ...current, search: value }));
    setPage(1);
  };

  const handleOpenCreate = () => {
    const next: Record<string, any> = {
      office_code: '',
      office_name: '',
      department_id: '',
      office_type: 1,
      ofc_parent_id: 0,
      country_id: '',
      state_id: '',
      district_id: '',
      status: 1
    };

    const countryVal = firstValue(user?.country_id, user?.country_info?.id, user?.office_info?.country_id);
    const stateVal = firstValue(user?.state_id, user?.state_info?.id, user?.office_info?.state_id);
    const districtVal = firstValue(user?.district_id, user?.district_info?.id, user?.office_info?.district_id);

    if (countryVal) next.country_id = Number(countryVal);
    if (stateVal) next.state_id = Number(stateVal);
    if (districtVal) next.district_id = Number(districtVal);

    const userDeptVal = firstValue(user?.department, user?.office_info?.company_name);
    if (userDeptVal) {
      const dept = options.departments.find(
        (item: any) =>
          Number(item.id) === Number(userDeptVal) ||
          String(item.department).toLowerCase() === String(userDeptVal).toLowerCase()
      );
      if (dept) next.department_id = dept.id;
    }

    setForm(next);
    setErrors({});
    setModal({ open: true, mode: 'create', row: null });
  };

  const handleOpenEdit = (row) => {
    setForm({
      office_code: row.office_code || '',
      office_name: row.office_name || '',
      department_id: row.department_id || '',
      office_type: Number(row.office_type || 1),
      ofc_parent_id: row.ofc_parent_id || 0,
      country_id: row.country_id || '',
      state_id: row.state_id || '',
      district_id: row.district_id || '',
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
      if (field === 'country_id') {
        next.state_id = '';
        next.district_id = '';
      }
      if (field === 'state_id') {
        next.district_id = '';
      }
      return next;
    });
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    const clientErrors: Record<string, string> = {};
    if (!form.office_name || form.office_name.trim() === '') {
      clientErrors.office_name = 'Office Name is required.';
    }
    if (!form.department_id) {
      clientErrors.department_id = 'Department is required.';
    }
    if (!form.country_id) {
      clientErrors.country_id = 'Country is required.';
    }
    if (!form.state_id) {
      clientErrors.state_id = 'State is required.';
    }
    if (!form.district_id) {
      clientErrors.district_id = 'District is required.';
    }

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      dispatch(showNotification({ message: 'Please correct the validation errors in the form.', severity: 'error' }));
      return;
    }

    const data = { ...form };

    try {
      if (modal.mode === 'edit') {
        await updateMaster({ type: 'offices', id: modal.row.ofc_id, data }).unwrap();
      } else {
        await createMaster({ type: 'offices', data }).unwrap();
      }
      dispatch(showNotification({ message: `${t('masters.office') || 'Office'} saved successfully.` }));
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
      await deleteMaster({ type: 'offices', id: deleteRow.ofc_id }).unwrap();
      dispatch(showNotification({ message: `${t('masters.office') || 'Office'} deleted successfully.` }));
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
            {t('masters.managePrefix')} {(t('masters.offices') || 'Offices').toLowerCase()} {t('masters.manageSuffix')}
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <DownloadMenu title={exportTitle} columns={exportColumns} getRowsLazy={handleGetRows} disabled={loading} />
          {canCreate && (
            <Button variant="contained" color="primary" startIcon={<AddOutlined />} onClick={handleOpenCreate} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
              {t('common.create')} {t('masters.office') || 'Office'}
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
              label={`${t('common.search')} ${t('masters.offices') || 'Offices'}`}
              value={filters.search}
              onChange={handleSearchFilterChange}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <ChosenSelect
                label={t('field.country')}
                value={filters.country_id}
                placeholder={t('field.country')}
                options={[{ value: '', label: t('field.country') }, ...options.countries.map((c: any) => ({ value: c.id, label: c.name }))]}
                onChange={(event) => {
                  setFilters((current) => ({ ...current, country_id: event.target.value, state_id: '', district_id: '' }));
                  setPage(1);
                }}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <ChosenSelect
                label={t('common.allStates')}
                value={filters.state_id}
                placeholder={t('common.allStates')}
                options={[{ value: '', label: t('common.allStates') }, ...filterStateOptions.map((s: any) => ({ value: s.id, label: s.name }))]}
                onChange={(event) => {
                  setFilters((current) => ({ ...current, state_id: event.target.value, district_id: '' }));
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
        title={`${t('masters.offices') || 'Offices'} (${totalRows})`}
        sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: '0 14px 36px rgba(15, 23, 42, 0.07)', overflow: 'hidden' }}
        headerSX={{ p: 2, '& .MuiCardHeader-title': { fontSize: '1rem' } }}
        contentSX={{ p: 2, '&:last-child': { pb: 2 } }}
      >
        <TableContainer sx={{ '&::-webkit-scrollbar': { height: 8 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 8 } }}>
          <Table sx={{ minWidth: 960 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'bg.100' }}>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{t('common.sno')}</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>District</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>State</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{t('common.status')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{t('common.action')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {decoratedRows.map((row, index) => (
                <TableRow key={`offices-${row.ofc_id}`} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell>{(page - 1) * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{row.office_code || '-'}</TableCell>
                  <TableCell>{row.office_name || '-'}</TableCell>
                  <TableCell>{row.department_name || '-'}</TableCell>
                  <TableCell>{row.office_type_label || '-'}</TableCell>
                  <TableCell>{row.district_name || '-'}</TableCell>
                  <TableCell>{row.state_name || '-'}</TableCell>
                  <TableCell>
                    <Chip label={Number(row.status) === 1 ? t('common.active') : t('common.inactive')} size="small" color={Number(row.status) === 1 ? 'success' : 'error'} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 0.5 }}>
                      {canEdit && (
                        <IconButton size="small" color="success" aria-label={`edit ${t('masters.office') || 'Office'}`} onClick={() => handleOpenEdit(row)}>
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton size="small" color="error" aria-label={`delete ${t('masters.office') || 'Office'}`} onClick={() => setDeleteRow(row)}>
                          <DeleteOutlineOutlined fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    {t('common.noRecords')}
                  </TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
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
              {modal.mode === 'edit' ? t('common.update') : t('common.create')} {t('masters.office') || 'Office'}
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ pt: 0.5 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={tl('Office Code')}
                  value={form.office_code}
                  onChange={handleFormChange('office_code')}
                  error={!!errors.office_code}
                  helperText={errors.office_code}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  label={tl('Office Name')}
                  value={form.office_name}
                  onChange={handleFormChange('office_name')}
                  error={!!errors.office_name}
                  helperText={errors.office_name}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth required error={!!errors.department_id}>
                  <ChosenSelect
                    required
                    label={tl('Department')}
                    value={form.department_id}
                    placeholder={tl('Department')}
                    options={options.departments.map((dept: any) => ({ value: dept.id, label: dept.department }))}
                    onChange={handleFormChange('department_id')}
                    error={!!errors.department_id}
                    helperText={errors.department_id}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <ChosenSelect
                    label={tl('Office Type')}
                    value={form.office_type}
                    options={[
                      { value: 1, label: t('data.headOffice') || 'Head Office' },
                      { value: 2, label: t('data.branchOffice') || 'Branch Office' }
                    ]}
                    onChange={handleFormChange('office_type')}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <ChosenSelect
                    label={tl('Parent Office')}
                    value={form.ofc_parent_id}
                    placeholder={tl('Parent Office')}
                    options={accessibleParentOffices.map((office: any) => ({ value: office.ofc_id, label: office.office_name }))}
                    onChange={handleFormChange('ofc_parent_id')}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth required error={!!errors.country_id}>
                  <ChosenSelect
                    required
                    label={tl('Country')}
                    value={form.country_id}
                    placeholder={t('field.country')}
                    options={options.countries.map((c: any) => ({ value: c.id, label: c.name }))}
                    onChange={handleFormChange('country_id')}
                    error={!!errors.country_id}
                    helperText={errors.country_id}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth required error={!!errors.state_id}>
                  <ChosenSelect
                    required
                    label={tl('State')}
                    value={form.state_id}
                    placeholder={t('field.state')}
                    options={formStateOptions.map((s: any) => ({ value: s.id, label: s.name }))}
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
        <DialogTitle>{t('common.delete')} {t('masters.office') || 'Office'}</DialogTitle>
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
