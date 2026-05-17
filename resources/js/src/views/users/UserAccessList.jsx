import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

// material-ui
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
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
import { ROLE_LABELS } from 'utils/access';

// assets
import AddOutlined from '@mui/icons-material/AddOutlined';
import AdminPanelSettingsOutlined from '@mui/icons-material/AdminPanelSettingsOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import LockOpenOutlined from '@mui/icons-material/LockOpenOutlined';
import PhoneIphoneOutlined from '@mui/icons-material/PhoneIphoneOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';

const initialFilters = { name: '', mobile: '', user_code: '', role: '', status: '' };
const baseForm = {
  user_code: '',
  name: '',
  email: '',
  mobile: '',
  password: 'Admin@123',
  emp_type: 'Permanent',
  department: 'Election Office',
  designation: '',
  ofc_id: '',
  ofc_code: '',
  district: '',
  state: '',
  country: 'India',
  address: '',
  role: 2,
  is_active: 1
};

const baseAccessForm = {
  country_ids: [],
  state_ids: [],
  district_ids: [],
  office_ids: [],
  permissions: {}
};

function getApiError(error) {
  const errors = error.response?.data?.errors;
  if (errors) return Object.values(errors).flat().join(' ');
  return error.response?.data?.message || 'Unable to complete request.';
}

function statusLabel(value) {
  return Number(value) === 1 ? 'Active' : 'Inactive';
}

function AccessDropZone({ title, selected, items, onDropItem, onRemove }) {
  return (
    <Box
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const data = JSON.parse(event.dataTransfer.getData('application/json') || '{}');
        onDropItem(data);
      }}
      sx={{ minHeight: 116, p: 1.25, border: '1px dashed', borderColor: 'primary.main', borderRadius: 1, bgcolor: 'rgba(16,60,92,0.03)' }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Stack direction="row" sx={{ gap: 0.75, flexWrap: 'wrap' }}>
        {selected.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Drag items here
          </Typography>
        )}
        {selected.map((id) => {
          const item = items.find((option) => Number(option.id) === Number(id));
          return <Chip key={id} label={item?.name || id} onDelete={() => onRemove(id)} size="small" sx={{ bgcolor: 'success.light', color: 'success.contrastText' }} />;
        })}
      </Stack>
    </Box>
  );
}

function DraggableList({ title, items, type }) {
  return (
    <Box sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1, maxHeight: 190, overflow: 'auto' }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Stack direction="row" sx={{ gap: 0.75, flexWrap: 'wrap' }}>
        {items.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No available records.
          </Typography>
        )}
        {items.map((item) => (
          <Chip
            key={`${type}-${item.id}`}
            label={item.name}
            size="small"
            draggable
            onDragStart={(event) => event.dataTransfer.setData('application/json', JSON.stringify({ type, id: item.id }))}
            sx={{ cursor: 'grab', bgcolor: 'error.light', color: 'error.contrastText' }}
          />
        ))}
      </Stack>
    </Box>
  );
}

export default function UserAccessList() {
  const dispatch = useDispatch();
  const [filters, setFilters] = useState(initialFilters);
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({ countries: [], states: [], districts: [], offices: [], modules: [], actions: ['read', 'create', 'edit', 'delete'] });
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [modal, setModal] = useState({ open: false, mode: 'create', row: null });
  const [accessModal, setAccessModal] = useState({ open: false, row: null });
  const [deleteRow, setDeleteRow] = useState(null);
  const [form, setForm] = useState(baseForm);
  const [accessForm, setAccessForm] = useState(baseAccessForm);

  const availableStates = useMemo(() => {
    const states = accessForm.country_ids.length ? options.states.filter((state) => accessForm.country_ids.includes(state.country_id)) : options.states;
    return states.filter((state) => !accessForm.state_ids.includes(state.id));
  }, [accessForm.country_ids, accessForm.state_ids, options.states]);
  const availableDistricts = useMemo(() => {
    if (!accessForm.state_ids.length) return [];
    const districts = accessForm.state_ids.length ? options.districts.filter((district) => accessForm.state_ids.includes(district.state_id)) : options.districts;
    return districts.filter((district) => !accessForm.district_ids.includes(district.id));
  }, [accessForm.district_ids, accessForm.state_ids, options.districts]);
  const availableCountries = useMemo(() => options.countries.filter((country) => !accessForm.country_ids.includes(country.id)), [accessForm.country_ids, options.countries]);
  const availableOffices = useMemo(() => options.offices.filter((office) => !accessForm.office_ids.includes(office.id)), [accessForm.office_ids, options.offices]);

  const fetchOptions = async () => {
    const { data } = await apiClient.get('/users/access-options');
    setOptions({
      countries: data.countries || [],
      states: data.states || [],
      districts: data.districts || [],
      offices: (data.offices || []).map((office) => ({ id: office.ofc_id, name: `${office.office_name}${office.office_code ? ` (${office.office_code})` : ''}` })),
      modules: data.modules || [],
      actions: data.actions || ['read', 'create', 'edit', 'delete']
    });
  };

  const fetchRows = async () => {
    try {
      const { data } = await apiClient.get('/users', {
        params: {
          ...filters,
          role: filters.role || undefined,
          status: filters.status || undefined,
          page,
          per_page: rowsPerPage
        }
      });
      setRows(data.data || []);
      setTotalRows(data.total || 0);
    } catch (error) {
      dispatch(showNotification({ message: getApiError(error), severity: 'error' }));
    }
  };

  useEffect(() => {
    fetchOptions().catch((error) => dispatch(showNotification({ message: getApiError(error), severity: 'error' })));
  }, [dispatch]);

  useEffect(() => {
    fetchRows();
  }, [filters, page, rowsPerPage]);

  const handleFilterChange = (field) => (event) => {
    setFilters((current) => ({ ...current, [field]: event.target.value }));
    setPage(1);
  };

  const handleOpenCreate = () => {
    setForm(baseForm);
    setModal({ open: true, mode: 'create', row: null });
  };

  const handleOpenEdit = (row) => {
    const raw = row.access_raw || {};
    setForm({
      ...baseForm,
      ...row,
      password: '',
    });
    setModal({ open: true, mode: 'edit', row });
  };

  const handleOpenAccess = (row) => {
    const raw = row.access_raw || {};
    setAccessForm({
      ...baseAccessForm,
      country_ids: raw.country_ids || [],
      state_ids: raw.state_ids || [],
      district_ids: raw.district_ids || [],
      office_ids: raw.office_ids || [],
      permissions: raw.permissions || {}
    });
    setAccessModal({ open: true, row });
  };

  const handleDropAccess = (type, data) => {
    if (data.type !== type) return;

    if (type === 'state') {
      const state = options.states.find((item) => Number(item.id) === Number(data.id));

      if (!accessForm.country_ids.length) {
        dispatch(showNotification({ message: 'Please select the related Country first.', severity: 'error' }));
        return;
      }

      if (!accessForm.country_ids.includes(Number(state?.country_id))) {
        dispatch(showNotification({ message: 'Selected State does not belong to the chosen Country. Please select the correct hierarchy.', severity: 'error' }));
        return;
      }
    }

    if (type === 'district') {
      const district = options.districts.find((item) => Number(item.id) === Number(data.id));

      if (!accessForm.state_ids.length) {
        dispatch(showNotification({ message: 'Please select the related State first.', severity: 'error' }));
        return;
      }

      if (!accessForm.state_ids.includes(Number(district?.state_id))) {
        dispatch(showNotification({ message: 'Selected District does not belong to the chosen State. Please select the correct hierarchy.', severity: 'error' }));
        return;
      }
    }

    const field = `${type}_ids`;
    setAccessForm((current) => ({ ...current, [field]: Array.from(new Set([...(current[field] || []), Number(data.id)])) }));
  };

  const removeAccess = (field, id) => {
    setAccessForm((current) => ({ ...current, [field]: current[field].filter((value) => Number(value) !== Number(id)) }));
  };

  const handlePermissionChange = (moduleKey, action) => (event) => {
    setAccessForm((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        [moduleKey]: {
          ...(current.permissions?.[moduleKey] || {}),
          [action]: event.target.checked
        }
      }
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = { ...form };
    if (!payload.password) delete payload.password;

    try {
      if (modal.mode === 'edit') {
        await apiClient.put(`/users/${modal.row.id}`, payload);
      } else {
        await apiClient.post('/users', payload);
      }
      dispatch(showNotification({ message: 'User access saved successfully.' }));
      setModal({ open: false, mode: 'create', row: null });
      await fetchRows();
    } catch (error) {
      dispatch(showNotification({ message: getApiError(error), severity: 'error' }));
    }
  };

  const handleAccessSubmit = async (event) => {
    event.preventDefault();
    if (!accessModal.row) return;

    try {
      await apiClient.put(`/users/${accessModal.row.id}/access`, accessForm);
      dispatch(showNotification({ message: 'Access updated successfully.' }));
      setAccessModal({ open: false, row: null });
      await fetchRows();
    } catch (error) {
      dispatch(showNotification({ message: getApiError(error), severity: 'error' }));
    }
  };

  const handleDelete = async () => {
    if (!deleteRow) return;
    try {
      await apiClient.delete(`/users/${deleteRow.id}`);
      dispatch(showNotification({ message: 'User deleted successfully.' }));
      setDeleteRow(null);
      await fetchRows();
    } catch (error) {
      dispatch(showNotification({ message: getApiError(error), severity: 'error' }));
    }
  };

  return (
    <Stack sx={{ gap: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h2">Access Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Create users and assign state, district and office access.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={handleOpenCreate} sx={{ bgcolor: '#103c5c', '&:hover': { bgcolor: '#0c314b' } }}>
          Create User
        </Button>
      </Stack>

      <MainCard sx={{ borderRadius: 2, boxShadow: '0 10px 30px rgba(16, 60, 92, 0.08)' }} contentSX={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
            <TextField fullWidth label="Name" value={filters.name} onChange={handleFilterChange('name')} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
            <TextField fullWidth label="Mobile Number" value={filters.mobile} onChange={handleFilterChange('mobile')} slotProps={{ input: { startAdornment: <InputAdornment position="start"><PhoneIphoneOutlined fontSize="small" /></InputAdornment> } }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
            <TextField fullWidth label="User ID" value={filters.user_code} onChange={handleFilterChange('user_code')} slotProps={{ input: { startAdornment: <InputAdornment position="start"><BadgeOutlined fontSize="small" /></InputAdornment> } }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
            <FormControl fullWidth>
              <Select value={filters.role} onChange={handleFilterChange('role')} displayEmpty>
                <MenuItem value="">All Roles</MenuItem>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
            <FormControl fullWidth>
              <Select value={filters.status} onChange={handleFilterChange('status')} displayEmpty>
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </MainCard>

      <MainCard title={`User Records (${totalRows})`} sx={{ borderRadius: 2, boxShadow: '0 10px 30px rgba(16, 60, 92, 0.08)' }} headerSX={{ p: 2, '& .MuiCardHeader-title': { fontSize: '1rem' } }} contentSX={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'flex-end', mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <Select value={rowsPerPage} onChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(1); }}>
              {[10, 50, 100, 200, 500].map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        <TableContainer>
          <Table sx={{ minWidth: 1060 }}>
            <TableHead>
              <TableRow>
                <TableCell>S.No</TableCell>
                <TableCell>User</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={row.id} hover>
                  <TableCell>{(page - 1) * rowsPerPage + index + 1}</TableCell>
                  <TableCell>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(16,60,92,0.08)', color: '#103c5c' }}>
                        <AdminPanelSettingsOutlined fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">{row.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>{row.user_code || `USR-${row.id}`}</TableCell>
                  <TableCell>{row.mobile}</TableCell>
                  <TableCell>{ROLE_LABELS[row.role] || row.role}</TableCell>
                  <TableCell>
                    <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap' }}>
                      {row.access?.is_super_admin ? (
                        <Chip label="Full Access" size="small" variant="outlined" color="success" />
                      ) : (
                        <Chip label={`${Object.values(row.access?.permissions || {}).filter((item) => item?.read).length} modules`} size="small" variant="outlined" />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip label={statusLabel(row.is_active)} size="small" color={Number(row.is_active) === 1 ? 'success' : 'error'} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary" aria-label="assign access" onClick={() => handleOpenAccess(row)}>
                      <LockOpenOutlined fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="success" aria-label="edit user" onClick={() => handleOpenEdit(row)}>
                      <EditOutlined fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" aria-label="delete user" onClick={() => setDeleteRow(row)}>
                      <DeleteOutlineOutlined fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <PaginationFooter page={page} rowsPerPage={rowsPerPage} totalRows={totalRows} onPageChange={setPage} />
      </MainCard>

      <Dialog open={modal.open} onClose={() => setModal({ open: false, mode: 'create', row: null })} fullWidth maxWidth="lg">
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle component="div" sx={{ pb: 1 }}>
            <Typography variant="h3" component="h2">{modal.mode === 'edit' ? 'Update' : 'Create'} User</Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ pt: 0.5 }}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Full Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="User ID" value={form.user_code || ''} onChange={(event) => setForm({ ...form, user_code: event.target.value })} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Email Address" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Mobile Number" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <Select value={form.role} onChange={(event) => setForm({ ...form, role: Number(event.target.value) })}>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => <MenuItem key={value} value={Number(value)}>{label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Department" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Designation" value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Temporary Password" type="password" value={form.password || ''} onChange={(event) => setForm({ ...form, password: event.target.value })} /></Grid>
              <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth required label="Country" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} /></Grid>
              <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth required label="State" value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} /></Grid>
              <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth required label="District" value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} /></Grid>
              <Grid size={12}><TextField fullWidth multiline minRows={2} label="Address" value={form.address || ''} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <Select value={form.is_active} onChange={(event) => setForm({ ...form, is_active: Number(event.target.value) })}>
                    <MenuItem value={1}>Active</MenuItem>
                    <MenuItem value={0}>Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button variant="outlined" color="inherit" onClick={() => setModal({ open: false, mode: 'create', row: null })}>Cancel</Button>
            <Button type="submit" variant="contained" startIcon={<SaveOutlined />} sx={{ bgcolor: '#103c5c', '&:hover': { bgcolor: '#0c314b' } }}>Save User</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={accessModal.open} onClose={() => setAccessModal({ open: false, row: null })} fullWidth maxWidth="lg">
        <Box component="form" onSubmit={handleAccessSubmit}>
          <DialogTitle component="div" sx={{ pb: 1 }}>
            <Typography variant="h3" component="h2">
              Access: {accessModal.row?.name}
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ pt: 0.5 }}>
              {Number(accessModal.row?.role) !== 1 && (
                <>
                  <Grid size={{ xs: 12, md: 4 }}><DraggableList title="Countries" type="country" items={availableCountries} /></Grid>
                  <Grid size={{ xs: 12, md: 4 }}><DraggableList title="States" type="state" items={availableStates} /></Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    {accessForm.state_ids.length ? (
                      <DraggableList title="Districts" type="district" items={availableDistricts} />
                    ) : (
                      <Box sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1, minHeight: 92 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Districts
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Select State Access first.
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}><AccessDropZone title="Country Access" selected={accessForm.country_ids} items={options.countries} onDropItem={(data) => handleDropAccess('country', data)} onRemove={(id) => removeAccess('country_ids', id)} /></Grid>
                  <Grid size={{ xs: 12, md: 4 }}><AccessDropZone title="State Access" selected={accessForm.state_ids} items={options.states} onDropItem={(data) => handleDropAccess('state', data)} onRemove={(id) => removeAccess('state_ids', id)} /></Grid>
                  <Grid size={{ xs: 12, md: 4 }}><AccessDropZone title="District Access" selected={accessForm.district_ids} items={options.districts} onDropItem={(data) => handleDropAccess('district', data)} onRemove={(id) => removeAccess('district_ids', id)} /></Grid>
                  <Grid size={12}><DraggableList title="Offices" type="office" items={availableOffices} /></Grid>
                  <Grid size={12}><AccessDropZone title="Office Access" selected={accessForm.office_ids} items={options.offices} onDropItem={(data) => handleDropAccess('office', data)} onRemove={(id) => removeAccess('office_ids', id)} /></Grid>
                </>
              )}

              <Grid size={12}>
                <MainCard title="Permissions" headerSX={{ p: 2, '& .MuiCardHeader-title': { fontSize: '1rem' } }} contentSX={{ p: 0, '&:last-child': { pb: 0 } }}>
                  <TableContainer>
                    <Table sx={{ minWidth: 720 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Module</TableCell>
                          {options.actions.map((action) => (
                            <TableCell key={action} align="center">
                              {action.charAt(0).toUpperCase() + action.slice(1)}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {options.modules.map((module) => (
                          <TableRow key={module.key} hover>
                            <TableCell>{module.label}</TableCell>
                            {options.actions.map((action) => (
                              <TableCell key={`${module.key}-${action}`} align="center">
                                <Checkbox checked={Boolean(accessForm.permissions?.[module.key]?.[action]) || Number(accessModal.row?.role) === 1} disabled={Number(accessModal.row?.role) === 1} onChange={handlePermissionChange(module.key, action)} />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </MainCard>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button variant="outlined" color="inherit" onClick={() => setAccessModal({ open: false, row: null })}>Cancel</Button>
            <Button type="submit" variant="contained" startIcon={<SaveOutlined />} sx={{ bgcolor: '#103c5c', '&:hover': { bgcolor: '#0c314b' } }}>Save Access</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(deleteRow)} onClose={() => setDeleteRow(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">This user and access permissions will be deleted.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setDeleteRow(null)}>Cancel</Button>
          <Button variant="contained" color="error" startIcon={<DeleteOutlineOutlined />} onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
