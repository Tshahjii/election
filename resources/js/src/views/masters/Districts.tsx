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
import FileUploadOutlined from '@mui/icons-material/FileUploadOutlined';
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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

export default function Districts() {
  const dispatch = useDispatch();
  const { t, tl } = useAppPreferences();
  const { user } = useSelector((state: any) => state.auth);

  const [filters, setFilters] = useState({ search: '', status: '', country_id: '', state_id: '' });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [modal, setModal] = useState({ open: false, mode: 'create', row: null });
  const [deleteRow, setDeleteRow] = useState(null);
  const [form, setForm] = useState({ country_id: '', state_id: '', name: '', district_code: '', status: 1 });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canCreate = hasPermission(user, 'masters.districts.create');
  const canEdit = hasPermission(user, 'masters.districts.edit');
  const canDelete = hasPermission(user, 'masters.districts.delete');

  const { data: optionsData } = useGetOptionsQuery();
  const options = useMemo(() => optionsData || { countries: [], states: [] }, [optionsData]);

  const debouncedFilters = useDebounce(filters, 400);

  const { data: listData, isFetching: loading } = useGetMastersQuery({
    type: 'districts',
    params: {
      search: debouncedFilters.search || undefined,
      status: debouncedFilters.status === '' ? undefined : debouncedFilters.status,
      country_id: debouncedFilters.country_id || undefined,
      state_id: debouncedFilters.state_id || undefined,
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

  const formStateOptions = useMemo(() => {
    if (!form.country_id) return options.states;
    return options.states.filter((state: any) => Number(state.country_id) === Number(form.country_id));
  }, [form.country_id, options.states]);

  const rows = useMemo(() => {
    return listData?.data || [];
  }, [listData]);

  const totalRows = listData?.total || 0;

  const exportTitle = `${t('masters.districts') || 'Districts'} Report`;
  const exportColumns = useMemo(
    () => [
      { key: '__sno', label: t('common.sno') || 'S.No.' },
      { key: 'name', label: tl('Name') },
      { key: 'district_code', label: tl('Code') },
      { key: 'state_name', label: tl('State') },
      { key: 'country_name', label: tl('Country') },
      { key: 'attachment_url', label: t('common.attachment') || 'Attachment' },
      { key: 'status_label', label: t('common.status') || 'Status' }
    ],
    [t, tl]
  );

  const handleGetRows = async () => {
    const result = await triggerExportQuery({
      type: 'districts',
      params: {
        search: debouncedFilters.search || undefined,
        status: debouncedFilters.status === '' ? undefined : debouncedFilters.status,
        country_id: debouncedFilters.country_id || undefined,
        state_id: debouncedFilters.state_id || undefined,
        page: 1,
        per_page: Math.max(Number(listData?.total || 0), 10000)
      }
    }).unwrap();

    const rawRows = result?.data || [];
    return rawRows.map((row, index) => ({
      ...row,
      __sno: index + 1,
      country_name: row.country_name || countriesById.get(Number(row.country_id)) || '-',
      state_name: row.state_name || statesById.get(Number(row.state_id)) || '-',
      status_label: Number(row.status) === 1 ? t('common.active') : t('common.inactive')
    }));
  };

  const handleSearchFilterChange = (value: string) => {
    setFilters((current) => ({ ...current, search: value }));
    setPage(1);
  };

  const handleOpenCreate = () => {
    const defaultCountry = options.countries.length === 1 ? options.countries[0].id : '';
    setForm({ country_id: defaultCountry, state_id: '', name: '', district_code: '', status: 1 });
    setAttachment(null);
    setErrors({});
    setModal({ open: true, mode: 'create', row: null });
  };

  const handleOpenEdit = (row) => {
    setForm({
      country_id: row.country_id || '',
      state_id: row.state_id || '',
      name: row.name || '',
      district_code: row.district_code || '',
      status: Number(row.status)
    });
    setAttachment(null);
    setErrors({});
    setModal({ open: true, mode: 'edit', row });
  };

  const handleCloseModal = () => {
    setModal({ open: false, mode: 'create', row: null });
    setAttachment(null);
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
      }
      return next;
    });
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    const clientErrors: Record<string, string> = {};
    if (!form.country_id) {
      clientErrors.country_id = 'Country is required.';
    }
    if (!form.state_id) {
      clientErrors.state_id = 'State is required.';
    }
    if (!form.name || form.name.trim() === '') {
      clientErrors.name = 'District Name is required.';
    }

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      dispatch(showNotification({ message: 'Please correct the validation errors in the form.', severity: 'error' }));
      return;
    }

    const formData = new FormData();
    formData.append('country_id', String(form.country_id));
    formData.append('state_id', String(form.state_id));
    formData.append('name', form.name);
    formData.append('district_code', form.district_code);
    formData.append('status', String(form.status));
    if (attachment) {
      formData.append('attachment', attachment);
    }

    try {
      if (modal.mode === 'edit') {
        await updateMaster({ type: 'districts', id: modal.row.id, data: formData }).unwrap();
      } else {
        await createMaster({ type: 'districts', data: formData }).unwrap();
      }
      dispatch(showNotification({ message: `${t('masters.district') || 'District'} saved successfully.` }));
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

  const handleAttachmentChange = (event: any) => {
    const file = event.target.files?.[0] || null;

    if (file && !IMAGE_MIME_TYPES.includes(file.type)) {
      dispatch(showNotification({ message: 'Logo must be a JPG, PNG or WebP image.', severity: 'error' }));
      event.target.value = '';
      setAttachment(null);
      return;
    }

    setAttachment(file);
  };

  const handleDelete = async () => {
    if (!deleteRow) return;

    try {
      await deleteMaster({ type: 'districts', id: deleteRow.id }).unwrap();
      dispatch(showNotification({ message: `${t('masters.district') || 'District'} deleted successfully.` }));
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
            {t('masters.managePrefix')} {(t('masters.districts') || 'Districts').toLowerCase()} {t('masters.manageSuffix')}
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <DownloadMenu title={exportTitle} columns={exportColumns} getRowsLazy={handleGetRows} disabled={loading} />
          {canCreate && (
            <Button variant="contained" color="primary" startIcon={<AddOutlined />} onClick={handleOpenCreate} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
              {t('common.create')} {t('masters.district') || 'District'}
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
              label={`${t('common.search')} ${t('masters.districts') || 'Districts'}`}
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
                options={[{ value: '', label: t('field.country') }, ...options.countries.map((country: any) => ({ value: country.id, label: country.name }))]}
                onChange={(event) => {
                  setFilters((current) => ({ ...current, country_id: event.target.value, state_id: '' }));
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
                options={[{ value: '', label: t('common.allStates') }, ...filterStateOptions.map((state: any) => ({ value: state.id, label: state.name }))]}
                onChange={(event) => {
                  setFilters((current) => ({ ...current, state_id: event.target.value }));
                  setPage(1);
                }}
              />
            </FormControl>
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
          <Grid size={{ xs: 12, md: 2 }}>
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
        title={`${t('masters.districts') || 'Districts'} (${totalRows})`}
        sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: '0 14px 36px rgba(15, 23, 42, 0.07)', overflow: 'hidden' }}
        headerSX={{ p: 2, '& .MuiCardHeader-title': { fontSize: '1rem' } }}
        contentSX={{ p: 2, '&:last-child': { pb: 2 } }}
      >
        <TableContainer sx={{ '&::-webkit-scrollbar': { height: 8 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 8 } }}>
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'bg.100' }}>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{t('common.sno')}</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>State</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Country</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{t('common.attachment')}</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{t('common.status')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{t('common.action')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={`districts-${row.id}`} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell>{(page - 1) * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{row.name || '-'}</TableCell>
                  <TableCell>{row.district_code || '-'}</TableCell>
                  <TableCell>{row.state_name || statesById.get(Number(row.state_id)) || '-'}</TableCell>
                  <TableCell>{row.country_name || countriesById.get(Number(row.country_id)) || '-'}</TableCell>
                  <TableCell>
                    {row.attachment_url ? (
                      <Button component="a" href={row.attachment_url} target="_blank" rel="noreferrer" size="small" startIcon={<InsertDriveFileOutlined />}>
                        {t('common.view')}
                      </Button>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={Number(row.status) === 1 ? t('common.active') : t('common.inactive')} size="small" color={Number(row.status) === 1 ? 'success' : 'error'} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 0.5 }}>
                      {canEdit && (
                        <IconButton size="small" color="success" aria-label={`edit ${t('masters.district') || 'District'}`} onClick={() => handleOpenEdit(row)}>
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton size="small" color="error" aria-label={`delete ${t('masters.district') || 'District'}`} onClick={() => setDeleteRow(row)}>
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
              {modal.mode === 'edit' ? t('common.update') : t('common.create')} {t('masters.district') || 'District'}
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ pt: 0.5 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth required error={!!errors.country_id}>
                  <ChosenSelect
                    required
                    label={tl('Country')}
                    value={form.country_id}
                    placeholder={t('field.country')}
                    options={options.countries.map((country: any) => ({ value: country.id, label: country.name }))}
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
                    options={formStateOptions.map((state: any) => ({ value: state.id, label: state.name }))}
                    onChange={handleFormChange('state_id')}
                    error={!!errors.state_id}
                    helperText={errors.state_id}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  label={tl('District Name')}
                  value={form.name}
                  onChange={handleFormChange('name')}
                  error={!!errors.name}
                  helperText={errors.name}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={tl('District Code')}
                  value={form.district_code}
                  onChange={handleFormChange('district_code')}
                  error={!!errors.district_code}
                  helperText={errors.district_code}
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
              <Grid size={{ xs: 12, sm: 12 }}>
                <Button component="label" fullWidth variant="outlined" size="small" startIcon={<FileUploadOutlined />} sx={{ minHeight: 40, justifyContent: 'flex-start' }}>
                  {attachment?.name || t('common.uploadLogo')}
                  <input hidden type="file" accept={IMAGE_MIME_TYPES.join(',')} onChange={handleAttachmentChange} />
                </Button>
                {modal.row?.attachment_url && !attachment && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                    {t('common.existingFile')}
                  </Typography>
                )}
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
        <DialogTitle>{t('common.delete')} {t('masters.district') || 'District'}</DialogTitle>
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
