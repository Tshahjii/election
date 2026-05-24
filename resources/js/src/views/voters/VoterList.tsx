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
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import HowToVoteOutlined from '@mui/icons-material/HowToVoteOutlined';
import PhoneIphoneOutlined from '@mui/icons-material/PhoneIphoneOutlined';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';

const voterRows = [
  { id: 'GJ/082/000145', name: 'Amit Sharma', mobile: '9876543210', age: 42, gender: 'Male', place: 'North Zone', booth: 'Booth 18', ward: 'Ward 05', status: 'Verified' },
  { id: 'GJ/082/000146', name: 'Neha Patel', mobile: '9823417856', age: 36, gender: 'Female', place: 'Central City', booth: 'Booth 44', ward: 'Ward 12', status: 'Pending' },
  { id: 'GJ/082/000147', name: 'Ramesh Verma', mobile: '9756312480', age: 58, gender: 'Male', place: 'River Belt', booth: 'Booth 07', ward: 'Ward 03', status: 'Verified' },
  { id: 'GJ/082/000148', name: 'Farida Khan', mobile: '9900123456', age: 29, gender: 'Female', place: 'Rural East', booth: 'Booth 23', ward: 'Ward 09', status: 'Correction' },
  { id: 'GJ/082/000149', name: 'Suresh Chauhan', mobile: '9811122233', age: 47, gender: 'Male', place: 'West Block', booth: 'Booth 31', ward: 'Ward 15', status: 'Verified' },
  { id: 'GJ/082/000150', name: 'Kavita Joshi', mobile: '9898987654', age: 33, gender: 'Female', place: 'South Circle', booth: 'Booth 56', ward: 'Ward 18', status: 'Pending' }
];

const initialFilters = {
  name: '',
  mobile: '',
  voterId: '',
  place: '',
  booth: ''
};

function getStatusColor(status) {
  if (status === 'Verified') return 'success';
  if (status === 'Pending') return 'warning';
  return 'info';
}

export default function VoterList() {
  const [filters, setFilters] = useState(initialFilters);
  const [selectedRows, setSelectedRows] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredRows = useMemo(
    () =>
      voterRows.filter((row) => {
        const nameMatch = row.name.toLowerCase().includes(filters.name.toLowerCase());
        const mobileMatch = row.mobile.includes(filters.mobile);
        const voterIdMatch = row.id.toLowerCase().includes(filters.voterId.toLowerCase());
        const placeMatch = row.place.toLowerCase().includes(filters.place.toLowerCase());
        const boothMatch = row.booth.toLowerCase().includes(filters.booth.toLowerCase());

        return nameMatch && mobileMatch && voterIdMatch && placeMatch && boothMatch;
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
          <Typography variant="h2">Voter List</Typography>
          <Typography variant="body2" color="text.secondary">
            Search, verify, and manage registered voter records.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={() => setIsCreateModalOpen(true)}
          sx={{ bgcolor: '#103c5c', '&:hover': { bgcolor: '#0c314b' } }}
        >
          Create Voter
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
              label="Voter ID"
              value={filters.voterId}
              onChange={handleFilterChange('voterId')}
              placeholder="Search ID"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><BadgeOutlined fontSize="small" /></InputAdornment> } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
            <TextField
              fullWidth
              label="Place"
              value={filters.place}
              onChange={handleFilterChange('place')}
              placeholder="Search place"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><PlaceOutlined fontSize="small" /></InputAdornment> } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
            <TextField
              fullWidth
              label="Booth"
              value={filters.booth}
              onChange={handleFilterChange('booth')}
              placeholder="Search booth"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><HomeOutlined fontSize="small" /></InputAdornment> } }}
            />
          </Grid>
        </Grid>
      </MainCard>

      <MainCard
        title={`Voter Records (${filteredRows.length})`}
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
                  <Checkbox
                    checked={allCurrentRowsSelected}
                    indeterminate={selectedRows.length > 0 && !allCurrentRowsSelected}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>S.No</TableCell>
                <TableCell>Voter</TableCell>
                <TableCell>Voter ID</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Place</TableCell>
                <TableCell>Booth</TableCell>
                <TableCell>Ward</TableCell>
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
                        <HowToVoteOutlined fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">{row.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.age} yrs, {row.gender}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.mobile}</TableCell>
                  <TableCell>{row.place}</TableCell>
                  <TableCell>{row.booth}</TableCell>
                  <TableCell>{row.ward}</TableCell>
                  <TableCell>
                    <Chip label={row.status} size="small" color={getStatusColor(row.status)} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 0.5 }}>
                      <IconButton size="small" color="primary" aria-label="view voter">
                        <VisibilityOutlined fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="success" aria-label="edit voter">
                        <EditOutlined fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" aria-label="delete voter">
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
                      <HowToVoteOutlined fontSize="small" />
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
                      Place
                    </Typography>
                    <Typography variant="body2">{row.place}</Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">
                      Booth
                    </Typography>
                    <Typography variant="body2">{row.booth}</Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">
                      Ward
                    </Typography>
                    <Typography variant="body2">{row.ward}</Typography>
                  </Grid>
                </Grid>
                <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 0.5 }}>
                  <IconButton size="small" color="primary" aria-label="view voter">
                    <VisibilityOutlined fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="success" aria-label="edit voter">
                    <EditOutlined fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" aria-label="delete voter">
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
          <Typography variant="h3" component="h2">Create Voter</Typography>
          <Typography variant="body2" color="text.secondary">
            Add a new voter record for election office verification.
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Full Name" placeholder="Enter voter name" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Mobile Number" placeholder="Enter mobile number" slotProps={{ input: { inputProps: { autoComplete: 'tel', inputMode: 'numeric' } } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Voter ID" placeholder="Enter voter ID" />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField fullWidth label="Age" placeholder="Age" type="number" />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth>
                <Select defaultValue="" displayEmpty>
                  <MenuItem value="" disabled>
                    Gender
                  </MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Place" placeholder="Enter place/area" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Booth" placeholder="Enter booth number" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Ward" placeholder="Enter ward" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <Select defaultValue="Pending">
                  <MenuItem value="Verified">Verified</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Correction">Correction</MenuItem>
                </Select>
              </FormControl>
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
          <Button type="submit" variant="contained" sx={{ bgcolor: '#103c5c', '&:hover': { bgcolor: '#0c314b' } }}>
            Save Voter
          </Button>
        </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}
