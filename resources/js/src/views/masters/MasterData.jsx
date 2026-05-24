import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

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
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
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
import apiClient from 'api/client';
import MainCard from 'components/cards/MainCard';
import PaginationFooter from 'components/PaginationFooter';
import { showNotification } from 'store/slices/notificationSlice';
import { fetchAuthUser } from 'store/slices/authSlice';
import { hasPermission } from 'utils/access';

// assets
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import FileUploadOutlined from '@mui/icons-material/FileUploadOutlined';
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MASTER_TYPES = [
  {
    key: 'countries',
    module: 'masters.countries',
    label: 'Countries',
    title: 'Country',
    primaryKey: 'id',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'iso2', label: 'ISO2' },
      { key: 'iso3', label: 'ISO3' },
      { key: 'phone_code', label: 'Phone Code' },
      { key: 'currency', label: 'Currency' },
      { key: 'nationality', label: 'Nationality' }
    ],
    fields: [
      { key: 'name', label: 'Country Name', required: true },
      { key: 'iso2', label: 'ISO2', required: true, maxLength: 2 },
      { key: 'iso3', label: 'ISO3', maxLength: 3 },
      { key: 'phone_code', label: 'Phone Code' },
      { key: 'currency', label: 'Currency' },
      { key: 'currency_symbol', label: 'Currency Symbol' },
      { key: 'nationality', label: 'Nationality' }
    ]
  },
  {
    key: 'states',
    module: 'masters.states',
    label: 'States',
    title: 'State',
    primaryKey: 'id',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'state_code', label: 'Code' },
      { key: 'country_name', label: 'Country' }
    ],
    fields: [
      { key: 'country_id', label: 'Country', type: 'country', required: true },
      { key: 'name', label: 'State Name', required: true },
      { key: 'state_code', label: 'State Code' }
    ]
  },
  {
    key: 'districts',
    module: 'masters.districts',
    label: 'Districts',
    title: 'District',
    primaryKey: 'id',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'district_code', label: 'Code' },
      { key: 'state_name', label: 'State' },
      { key: 'country_name', label: 'Country' }
    ],
    fields: [
      { key: 'country_id', label: 'Country', type: 'country', required: true },
      { key: 'state_id', label: 'State', type: 'state', required: true },
      { key: 'name', label: 'District Name', required: true },
      { key: 'district_code', label: 'District Code' }
    ]
  },
  {
    key: 'offices',
    module: 'masters.offices',
    label: 'Offices',
    title: 'Office',
    primaryKey: 'ofc_id',
    columns: [
      { key: 'office_code', label: 'Code' },
      { key: 'office_name', label: 'Name' },
      { key: 'company_name', label: 'Department' },
      { key: 'office_type_label', label: 'Type' },
      { key: 'district', label: 'District' },
      { key: 'state', label: 'State' }
    ],
    fields: [
      { key: 'office_code', label: 'Office Code' },
      { key: 'office_name', label: 'Office Name', required: true },
      { key: 'company_name', label: 'Department' },
      { key: 'office_type', label: 'Office Type', type: 'office_type' },
      { key: 'ofc_parent_id', label: 'Parent Office ID', type: 'number' },
      { key: 'district', label: 'District' },
      { key: 'state', label: 'State' },
      { key: 'country', label: 'Country' }
    ]
  }
];

export { MASTER_TYPES };

const defaultForm = {
  status: 1,
  office_type: 1,
  ofc_parent_id: 0
};

function getApiError(error) {
  const errors = error.response?.data?.errors;
  if (errors) {
    return Object.values(errors).flat().join(' ');
  }

  return error.response?.data?.message || 'Unable to complete request.';
}

export default function MasterData({ masterKey = 'countries' }) {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const { user } = useSelector((state) => state.auth);
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({ countries: [], states: [] });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: searchQuery, status: '' });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [modal, setModal] = useState({ open: false, mode: 'create', row: null });
  const [deleteRow, setDeleteRow] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [attachment, setAttachment] = useState(null);

  const master = MASTER_TYPES.find((item) => item.key === masterKey) || MASTER_TYPES[0];
  const canCreate = hasPermission(user, `${master.module}.create`);
  const canEdit = hasPermission(user, `${master.module}.edit`);
  const canDelete = hasPermission(user, `${master.module}.delete`);

  const countriesById = useMemo(() => new Map(options.countries.map((country) => [Number(country.id), country.name])), [options.countries]);
  const statesById = useMemo(() => new Map(options.states.map((state) => [Number(state.id), state.name])), [options.states]);
  const filteredStateOptions = useMemo(() => {
    if (!form.country_id) return options.states;
    return options.states.filter((state) => Number(state.country_id) === Number(form.country_id));
  }, [form.country_id, options.states]);

  const decoratedRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        country_name: countriesById.get(Number(row.country_id)) || row.country || '-',
        state_name: statesById.get(Number(row.state_id)) || row.state || '-',
        office_type_label: Number(row.office_type) === 2 ? 'Branch Office' : 'Head Office'
      })),
    [countriesById, rows, statesById]
  );

  const fetchOptions = async () => {
    const response = await apiClient.get('/masters/options');
    setOptions(response.data);
  };

  const fetchRows = async () => {
    setLoading(true);
    setRows([]);
    try {
      const response = await apiClient.get(`/masters/${master.key}`, {
        params: {
          search: filters.search || undefined,
          status: filters.status === '' ? undefined : filters.status,
          page,
          per_page: rowsPerPage
        }
      });
      setRows(response.data.data || []);
      setTotalRows(response.data.total || 0);
    } catch (error) {
      dispatch(showNotification({ message: getApiError(error), severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions().catch((error) => dispatch(showNotification({ message: getApiError(error), severity: 'error' })));
  }, [dispatch]);

  useEffect(() => {
    fetchRows();
  }, [master.key, filters.search, filters.status, page, rowsPerPage]);

  useEffect(() => {
    setFilters({ search: searchQuery, status: '' });
    setPage(1);
    setRows([]);
    setTotalRows(0);
  }, [master.key]);

  useEffect(() => {
    setFilters((current) => (current.search === searchQuery ? current : { ...current, search: searchQuery }));
    setPage(1);
  }, [searchQuery]);

  const handleSearchFilterChange = (event) => {
    const value = event.target.value;
    setFilters((current) => ({ ...current, search: value }));
    setPage(1);

    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set('search', value);
    } else {
      nextParams.delete('search');
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleOpenCreate = () => {
    setForm(defaultForm);
    setAttachment(null);
    setModal({ open: true, mode: 'create', row: null });
  };

  const handleOpenEdit = (row) => {
    setForm({
      ...defaultForm,
      ...row,
      status: Number(row.status)
    });
    setAttachment(null);
    setModal({ open: true, mode: 'edit', row });
  };

  const handleCloseModal = () => {
    setModal({ open: false, mode: 'create', row: null });
    setAttachment(null);
  };

  const handleFormChange = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'country_id') {
        next.state_id = '';
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData();
    master.fields.forEach((field) => {
      const value = form[field.key];
      if (value !== undefined && value !== null) {
        formData.append(field.key, value);
      }
    });
    formData.append('status', form.status ?? 1);

    if (attachment) {
      formData.append('attachment', attachment);
    }

    try {
      const url = modal.mode === 'edit' ? `/masters/${master.key}/${modal.row[master.primaryKey]}` : `/masters/${master.key}`;
      await apiClient.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      dispatch(showNotification({ message: `${master.title} saved successfully.` }));
      handleCloseModal();
      await fetchOptions();
      await fetchRows();
      // If states were updated, refresh authenticated user so headers reflect new state logo immediately
      if (master.key === 'states' && modal.mode === 'edit') {
        dispatch(fetchAuthUser()).catch(() => {});
      }
    } catch (error) {
      dispatch(showNotification({ message: getApiError(error), severity: 'error' }));
    }
  };

  const handleAttachmentChange = (event) => {
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
      await apiClient.delete(`/masters/${master.key}/${deleteRow[master.primaryKey]}`);
      dispatch(showNotification({ message: `${master.title} deleted successfully.` }));
      setDeleteRow(null);
      await fetchOptions();
      await fetchRows();
    } catch (error) {
      dispatch(showNotification({ message: getApiError(error), severity: 'error' }));
    }
  };

  const renderField = (field) => {
    if (field.type === 'country') {
      return (
        <FormControl fullWidth required={field.required}>
          <Select value={form[field.key] || ''} displayEmpty onChange={handleFormChange(field.key)}>
            <MenuItem value="" disabled>
              Select Country
            </MenuItem>
            {options.countries.map((country) => (
              <MenuItem key={country.id} value={country.id}>
                {country.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    if (field.type === 'state') {
      return (
        <FormControl fullWidth required={field.required}>
          <Select value={form[field.key] || ''} displayEmpty onChange={handleFormChange(field.key)}>
            <MenuItem value="" disabled>
              Select State
            </MenuItem>
            {filteredStateOptions.map((state) => (
              <MenuItem key={state.id} value={state.id}>
                {state.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    if (field.type === 'office_type') {
      return (
        <FormControl fullWidth>
          <Select value={form[field.key] || 1} onChange={handleFormChange(field.key)}>
            <MenuItem value={1}>Head Office</MenuItem>
            <MenuItem value={2}>Branch Office</MenuItem>
          </Select>
        </FormControl>
      );
    }

    return (
      <TextField
        fullWidth
        required={field.required}
        label={field.label}
        type={field.type || 'text'}
        value={form[field.key] ?? ''}
        onChange={handleFormChange(field.key)}
        slotProps={{ input: { inputProps: { maxLength: field.maxLength } } }}
      />
    );
  };

  return (
    <Stack sx={{ gap: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h2">Master</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage {master.label.toLowerCase()} master records.
          </Typography>
        </Box>
        {canCreate && (
          <Button variant="contained" startIcon={<AddOutlined />} onClick={handleOpenCreate} sx={{ bgcolor: '#103c5c', '&:hover': { bgcolor: '#0c314b' } }}>
            Create {master.title}
          </Button>
        )}
      </Stack>

      <MainCard sx={{ borderRadius: 2, boxShadow: '0 10px 30px rgba(16, 60, 92, 0.08)' }} contentSX={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              label={`Search ${master.label}`}
              value={filters.search}
              onChange={handleSearchFilterChange}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <Select
                value={filters.status}
                displayEmpty
                onChange={(event) => {
                  setFilters((current) => ({ ...current, status: event.target.value }));
                  setPage(1);
                }}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value={1}>Active</MenuItem>
                <MenuItem value={0}>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <Select value={rowsPerPage} onChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(1); }}>
                {[10, 25, 50, 100].map((value) => (
                  <MenuItem key={value} value={value}>
                    {value} rows
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </MainCard>

      <MainCard
        title={`${master.label} (${totalRows})`}
        sx={{ borderRadius: 2, boxShadow: '0 10px 30px rgba(16, 60, 92, 0.08)' }}
        headerSX={{ p: 2, '& .MuiCardHeader-title': { fontSize: '1rem' } }}
        contentSX={{ p: 2, '&:last-child': { pb: 2 } }}
      >
        <TableContainer>
          <Table sx={{ minWidth: 960 }}>
            <TableHead>
              <TableRow>
                <TableCell>S.No</TableCell>
                {master.columns.map((column) => (
                  <TableCell key={column.key}>{column.label}</TableCell>
                ))}
                <TableCell>Attachment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {decoratedRows.map((row, index) => (
                <TableRow key={`${master.key}-${row[master.primaryKey]}`} hover>
                  <TableCell>{(page - 1) * rowsPerPage + index + 1}</TableCell>
                  {master.columns.map((column) => (
                    <TableCell key={column.key}>{row[column.key] || '-'}</TableCell>
                  ))}
                  <TableCell>
                    {row.attachment_url ? (
                      <Button component="a" href={row.attachment_url} target="_blank" rel="noreferrer" size="small" startIcon={<InsertDriveFileOutlined />}>
                        View
                      </Button>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={Number(row.status) === 1 ? 'Active' : 'Inactive'} size="small" color={Number(row.status) === 1 ? 'success' : 'error'} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 0.5 }}>
                      {canEdit && (
                        <IconButton size="small" color="success" aria-label={`edit ${master.title}`} onClick={() => handleOpenEdit(row)}>
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton size="small" color="error" aria-label={`delete ${master.title}`} onClick={() => setDeleteRow(row)}>
                          <DeleteOutlineOutlined fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && decoratedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={master.columns.length + 4} align="center">
                    No records found.
                  </TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow>
                  <TableCell colSpan={master.columns.length + 4} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <PaginationFooter page={page} rowsPerPage={rowsPerPage} totalRows={totalRows} onPageChange={setPage} />
      </MainCard>

      <Dialog open={modal.open} onClose={handleCloseModal} fullWidth maxWidth="md">
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle component="div" sx={{ pb: 1 }}>
            <Typography variant="h3" component="h2">
              {modal.mode === 'edit' ? 'Update' : 'Create'} {master.title}
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ pt: 0.5 }}>
              {master.fields.map((field) => (
                <Grid key={field.key} size={{ xs: 12, sm: 6 }}>
                  {renderField(field)}
                </Grid>
              ))}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <Select value={form.status ?? 1} onChange={handleFormChange('status')}>
                    <MenuItem value={1}>Active</MenuItem>
                    <MenuItem value={0}>Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button component="label" fullWidth variant="outlined" startIcon={<FileUploadOutlined />} sx={{ minHeight: 48, justifyContent: 'flex-start' }}>
                  {attachment?.name || 'Upload Logo Image'}
                  <input hidden type="file" accept={IMAGE_MIME_TYPES.join(',')} onChange={handleAttachmentChange} />
                </Button>
                {modal.row?.attachment_url && !attachment && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                    Existing file will remain unchanged.
                  </Typography>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button variant="outlined" color="inherit" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" startIcon={<AddOutlined />} sx={{ bgcolor: '#103c5c', '&:hover': { bgcolor: '#0c314b' } }}>
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(deleteRow)} onClose={() => setDeleteRow(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete {master.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This record will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setDeleteRow(null)}>
            Cancel
          </Button>
          <Button variant="contained" color="error" startIcon={<DeleteOutlineOutlined />} onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
