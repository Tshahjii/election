import { useMemo, useState } from 'react';

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
import MainCard from 'components/cards/MainCard';
import PaginationFooter from 'components/PaginationFooter';

// assets
import AddOutlined from '@mui/icons-material/AddOutlined';
import AdminPanelSettingsOutlined from '@mui/icons-material/AdminPanelSettingsOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import PhoneIphoneOutlined from '@mui/icons-material/PhoneIphoneOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';

const userRows = [
  { id: 'USR-1001', name: 'Rajesh Kumar', email: 'rajesh.kumar@gov.in', mobile: '9876543210', role: 'Super Admin', department: 'Election Office', status: 'Active', lastLogin: '10 May 2026' },
  { id: 'USR-1002', name: 'Priya Sharma', email: 'priya.sharma@gov.in', mobile: '9823417856', role: 'Data Entry', department: 'Voter Cell', status: 'Active', lastLogin: '09 May 2026' },
  { id: 'USR-1003', name: 'Imran Khan', email: 'imran.khan@gov.in', mobile: '9756312480', role: 'Booth Officer', department: 'Polling Operations', status: 'Pending', lastLogin: 'Not logged in' },
  { id: 'USR-1004', name: 'Meena Patel', email: 'meena.patel@gov.in', mobile: '9900123456', role: 'Verifier', department: 'Verification Team', status: 'Inactive', lastLogin: '04 May 2026' },
  { id: 'USR-1005', name: 'Sanjay Verma', email: 'sanjay.verma@gov.in', mobile: '9811122233', role: 'Report Viewer', department: 'Reports', status: 'Active', lastLogin: '08 May 2026' },
  { id: 'USR-1006', name: 'Kavita Joshi', email: 'kavita.joshi@gov.in', mobile: '9898987654', role: 'Admin', department: 'Access Management', status: 'Pending', lastLogin: 'Not logged in' }
];

const initialFilters = {
  name: '',
  mobile: '',
  userId: '',
  role: '',
  status: ''
};

function getStatusColor(status) {
  if (status === 'Active') return 'success';
  if (status === 'Pending') return 'warning';
  return 'error';
}

export default function UserAccessList() {
  const [filters, setFilters] = useState(initialFilters);
  const [selectedRows, setSelectedRows] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredRows = useMemo(
    () =>
      userRows.filter((row) => {
        const nameMatch = row.name.toLowerCase().includes(filters.name.toLowerCase());
        const mobileMatch = row.mobile.includes(filters.mobile);
        const userIdMatch = row.id.toLowerCase().includes(filters.userId.toLowerCase());
        const roleMatch = row.role.toLowerCase().includes(filters.role.toLowerCase());
        const statusMatch = !filters.status || row.status === filters.status;

        return nameMatch && mobileMatch && userIdMatch && roleMatch && statusMatch;
      }),
    [filters]
  );

  const handleFilterChange = (field) => (event) => {
    setFilters((current) => ({ ...current, [field]: event.target.value }));
    setPage(1);
  };

  const paginatedRows = filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const allCurrentRowsSelected = paginatedRows.length > 0 && paginatedRows.every((row) => selectedRows.includes(row.id));

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows((current) => Array.from(new Set([...current, ...paginatedRows.map((row) => row.id)])));
      return;
    }

    setSelectedRows((current) => current.filter((id) => !paginatedRows.some((row) => row.id === id)));
  };

  const handleSelectRow = (id) => (event) => {
    setSelectedRows((current) => (event.target.checked ? [...current, id] : current.filter((rowId) => rowId !== id)));
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(Number(event.target.value));
    setPage(1);
  };

  return (
    <Stack sx={{ gap: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h2">Access Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Search and manage user access for election operations.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={() => setIsCreateModalOpen(true)}
          sx={{ bgcolor: '#103c5c', '&:hover': { bgcolor: '#0c314b' } }}
        >
          Create User
        </Button>
      </Stack>

      <MainCard sx={{ borderRadius: 2, boxShadow: '0 10px 30px rgba(16, 60, 92, 0.08)' }} contentSX={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
            <TextField
              fullWidth
              label="Name"
              value={filters.name}
              onChange={handleFilterChange('name')}
              placeholder="Search name"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
            <TextField
              fullWidth
              label="Mobile Number"
              value={filters.mobile}
              onChange={handleFilterChange('mobile')}
              placeholder="Search number"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><PhoneIphoneOutlined fontSize="small" /></InputAdornment> } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
            <TextField
              fullWidth
              label="User ID"
              value={filters.userId}
              onChange={handleFilterChange('userId')}
              placeholder="Search ID"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><BadgeOutlined fontSize="small" /></InputAdornment> } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
            <TextField
              fullWidth
              label="Role"
              value={filters.role}
              onChange={handleFilterChange('role')}
              placeholder="Search role"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><AdminPanelSettingsOutlined fontSize="small" /></InputAdornment> } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
            <FormControl fullWidth>
              <Select value={filters.status} onChange={handleFilterChange('status')} displayEmpty>
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </MainCard>

      <MainCard
        title={`User Records (${filteredRows.length})`}
        sx={{ borderRadius: 2, boxShadow: '0 10px 30px rgba(16, 60, 92, 0.08)' }}
        headerSX={{ p: 2, '& .MuiCardHeader-title': { fontSize: '1rem' } }}
        contentSX={{ p: 2, '&:last-child': { pb: 2 } }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ gap: 2, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', mb: 2 }}
        >
          <Typography variant="body2" color="text.secondary">
            {selectedRows.length} selected
          </Typography>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              Rows per page
            </Typography>
            <FormControl size="small" sx={{ minWidth: 92 }}>
              <Select value={rowsPerPage} onChange={handleRowsPerPageChange}>
                {[10, 50, 100, 200, 500].map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
          <Table sx={{ minWidth: 1060 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox checked={allCurrentRowsSelected} indeterminate={selectedRows.length > 0 && !allCurrentRowsSelected} onChange={handleSelectAll} />
                </TableCell>
                <TableCell>S.No</TableCell>
                <TableCell>User</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row, index) => (
                <TableRow key={row.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selectedRows.includes(row.id)} onChange={handleSelectRow(row.id)} />
                  </TableCell>
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
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.mobile}</TableCell>
                  <TableCell>{row.role}</TableCell>
                  <TableCell>{row.department}</TableCell>
                  <TableCell>{row.lastLogin}</TableCell>
                  <TableCell>
                    <Chip label={row.status} size="small" color={getStatusColor(row.status)} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 0.5 }}>
                      <IconButton size="small" color="primary" aria-label="view user">
                        <VisibilityOutlined fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="success" aria-label="edit user">
                        <EditOutlined fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" aria-label="delete user">
                        <DeleteOutlineOutlined fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack sx={{ display: { xs: 'flex', md: 'none' }, gap: 1.5 }}>
          {paginatedRows.map((row, index) => (
            <Box key={row.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
              <Stack sx={{ gap: 1.25 }}>
                <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                    <Checkbox checked={selectedRows.includes(row.id)} onChange={handleSelectRow(row.id)} sx={{ p: 0.25 }} />
                    <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(16,60,92,0.08)', color: '#103c5c' }}>
                      <AdminPanelSettingsOutlined fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {(page - 1) * rowsPerPage + index + 1}. {row.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.id}
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip label={row.status} size="small" color={getStatusColor(row.status)} variant="outlined" />
                </Stack>
                <Grid container spacing={1}>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">
                      Mobile
                    </Typography>
                    <Typography variant="body2">{row.mobile}</Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">
                      Role
                    </Typography>
                    <Typography variant="body2">{row.role}</Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">
                      Department
                    </Typography>
                    <Typography variant="body2">{row.department}</Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">
                      Last Login
                    </Typography>
                    <Typography variant="body2">{row.lastLogin}</Typography>
                  </Grid>
                </Grid>
                <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 0.5 }}>
                  <IconButton size="small" color="primary" aria-label="view user">
                    <VisibilityOutlined fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="success" aria-label="edit user">
                    <EditOutlined fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" aria-label="delete user">
                    <DeleteOutlineOutlined fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            </Box>
          ))}
        </Stack>

        <PaginationFooter page={page} rowsPerPage={rowsPerPage} totalRows={filteredRows.length} onPageChange={setPage} />
      </MainCard>

      <Dialog open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} fullWidth maxWidth="md">
        <Box component="form" onSubmit={(event) => { event.preventDefault(); setIsCreateModalOpen(false); }}>
        <DialogTitle component="div" sx={{ pb: 1 }}>
          <Typography variant="h3" component="h2">Create User</Typography>
          <Typography variant="body2" color="text.secondary">
            Add a user and assign access for election portal operations.
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Full Name" placeholder="Enter user name" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="User ID" placeholder="Enter user ID" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Email Address" placeholder="Enter email address" type="email" slotProps={{ input: { inputProps: { autoComplete: 'email' } } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Mobile Number" placeholder="Enter mobile number" slotProps={{ input: { inputProps: { autoComplete: 'tel', inputMode: 'numeric' } } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <Select defaultValue="" displayEmpty>
                  <MenuItem value="" disabled>
                    Select Role
                  </MenuItem>
                  <MenuItem value="Super Admin">Super Admin</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Data Entry">Data Entry</MenuItem>
                  <MenuItem value="Verifier">Verifier</MenuItem>
                  <MenuItem value="Booth Officer">Booth Officer</MenuItem>
                  <MenuItem value="Report Viewer">Report Viewer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <Select defaultValue="" displayEmpty>
                  <MenuItem value="" disabled>
                    Select Department
                  </MenuItem>
                  <MenuItem value="Election Office">Election Office</MenuItem>
                  <MenuItem value="Voter Cell">Voter Cell</MenuItem>
                  <MenuItem value="Polling Operations">Polling Operations</MenuItem>
                  <MenuItem value="Verification Team">Verification Team</MenuItem>
                  <MenuItem value="Reports">Reports</MenuItem>
                  <MenuItem value="Access Management">Access Management</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <Select defaultValue="Active">
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Temporary Password"
                placeholder="Enter temporary password"
                type="password"
                slotProps={{ input: { inputProps: { autoComplete: 'new-password' } } }}
              />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth multiline minRows={3} label="Address" placeholder="Enter complete address" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setIsCreateModalOpen(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveOutlined />}
            sx={{ bgcolor: '#103c5c', '&:hover': { bgcolor: '#0c314b' } }}
          >
            Save User
          </Button>
        </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}
