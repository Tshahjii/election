import { useMemo, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
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
import PaginationFooter from 'components/PaginationFooter';

// assets
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import LocalPrintshopOutlinedIcon from '@mui/icons-material/LocalPrintshopOutlined';

const roster = [
  { id: 'EMP1002', name: 'Megha Dwivedi', role: 'Polling Officer 1', station: 'Booth 12 - High School Room 4', dept: 'Revenue', contact: '9123456789' },
  { id: 'EMP1005', name: 'Vikram Singh', role: 'Presiding Officer', station: 'Booth 08 - Panchayat Bhawan Hall', dept: 'Excise', contact: '9988776655' },
  { id: 'EMP1012', name: 'Gopal Krishnan', role: 'Polling Officer 2', station: 'Booth 14 - Primary School East Wing', dept: 'Education', contact: '9876543210' },
  { id: 'EMP1019', name: 'Naveen Rawal', role: 'Micro Observer', station: 'Booth 31 - High School Room 2', dept: 'Treasury', contact: '9800112233' },
  { id: 'EMP1024', name: 'Jyoti Sharma', role: 'Polling Officer 1', station: 'Booth 45 - Community Center Block A', dept: 'Education', contact: '9002233445' }
];

export default function AllocationReport() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredRoster = useMemo(() => {
    return roster.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.station.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter ? item.role === roleFilter : true;
      return matchSearch && matchRole;
    });
  }, [search, roleFilter]);

  return (
    <Stack sx={{ gap: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography variant="h2">Allocation Report</Typography>
          <Typography variant="body2" color="text.secondary">
            Filter, verify, and export official duty orders and deployment lists.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" color="primary" startIcon={<DescriptionOutlinedIcon />}>
            Export CSV
          </Button>
          <Button variant="contained" color="primary" startIcon={<LocalPrintshopOutlinedIcon />}>
            Print Roster
          </Button>
        </Stack>
      </Stack>

      <MainCard sx={{ borderRadius: 2, boxShadow: '0 10px 30px rgba(16, 60, 92, 0.08)' }} contentSX={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Search Booth / Officer"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by booth name or officer name..."
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <ChosenSelect
                value={roleFilter}
                placeholder="All Roles"
                options={[
                  { value: '', label: 'All Roles' },
                  { value: 'Presiding Officer', label: 'Presiding Officer' },
                  { value: 'Polling Officer 1', label: 'Polling Officer 1' },
                  { value: 'Polling Officer 2', label: 'Polling Officer 2' },
                  { value: 'Micro Observer', label: 'Micro Observer' }
                ]}
                onChange={(e) => setRoleFilter(e.target.value)}
              />
            </FormControl>
          </Grid>
        </Grid>
      </MainCard>

      <MainCard title="Active Assignments List" sx={{ borderRadius: 2, boxShadow: '0 10px 30px rgba(16, 60, 92, 0.08)' }} contentSX={{ p: 0, '&:last-child': { pb: 0 } }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>S.No</TableCell>
                <TableCell>Officer Name</TableCell>
                <TableCell>Employee ID</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Station Deployed</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Contact</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRoster.map((item, index) => (
                <TableRow key={item.id} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">{item.name}</Typography>
                  </TableCell>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.role}</TableCell>
                  <TableCell>{item.station}</TableCell>
                  <TableCell>{item.dept}</TableCell>
                  <TableCell>{item.contact}</TableCell>
                </TableRow>
              ))}
              {filteredRoster.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">No allocations found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <PaginationFooter page={page} rowsPerPage={rowsPerPage} totalRows={filteredRoster.length} onPageChange={setPage} />
      </MainCard>
    </Stack>
  );
}
