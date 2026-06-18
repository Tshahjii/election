import { useMemo, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
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
import { useAppPreferences } from 'contexts/AppPreferences';

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
  const { t } = useAppPreferences();
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

  // Translate roles dynamically
  const getRoleLabel = (role: string) => {
    if (role === 'Presiding Officer') return t('analytics.proDeployed').replace(' Deployed', '').replace(' तैनात', '');
    if (role === 'Polling Officer 1') return t('analytics.po1Deployed').replace(' Deployed', '').replace(' तैनात', '');
    if (role === 'Polling Officer 2') return t('analytics.po2Deployed').replace(' Deployed', '').replace(' तैनात', '');
    if (role === 'Micro Observer') return t('analytics.moDeployed').replace(' Deployed', '').replace(' तैनात', '');
    return role;
  };

  return (
    <Stack sx={{ gap: 2.5 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h2" sx={{ fontWeight: 700, color: 'primary.dark' }}>{t('reports.allocationTitle')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('reports.allocationSubtitle')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}>
          <Button variant="outlined" color="primary" startIcon={<DescriptionOutlinedIcon />} sx={{ borderRadius: 2, textTransform: 'none', px: 2.25 }}>
            {t('reports.exportCsv')}
          </Button>
          <Button variant="contained" color="primary" startIcon={<LocalPrintshopOutlinedIcon />} sx={{ borderRadius: 2, textTransform: 'none', px: 2.25, boxShadow: '0 4px 12px rgba(67, 56, 202, 0.2)' }}>
            {t('reports.printRoster')}
          </Button>
        </Stack>
      </Stack>

      <MainCard sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)' }} contentSX={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 5, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label={t('reports.searchPlaceholder').replace('...', '')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('reports.searchPlaceholder')}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 5, md: 4 }}>
            <FormControl fullWidth>
              <ChosenSelect
                value={roleFilter}
                placeholder={t('access.role')}
                options={[
                  { value: '', label: t('access.role') + ' (सभी)' },
                  { value: 'Presiding Officer', label: getRoleLabel('Presiding Officer') },
                  { value: 'Polling Officer 1', label: getRoleLabel('Polling Officer 1') },
                  { value: 'Polling Officer 2', label: getRoleLabel('Polling Officer 2') },
                  { value: 'Micro Observer', label: getRoleLabel('Micro Observer') }
                ]}
                onChange={(e) => setRoleFilter(e.target.value)}
              />
            </FormControl>
          </Grid>
        </Grid>
      </MainCard>

      <MainCard title={t('reports.activeAssignments')} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)' }} headerSX={{ p: 2.5 }} contentSX={{ p: 0, '&:last-child': { pb: 0 } }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'bg.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>{t('common.sno')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('reports.officerName')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('reports.employeeId')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('access.role')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('reports.stationDeployed')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('reports.department')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('reports.contact')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRoster.map((item, index) => (
                <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{item.name}</Typography>
                  </TableCell>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>
                    <Chip label={getRoleLabel(item.role)} size="small" variant="outlined" color="primary" sx={{ borderRadius: 1.5, fontWeight: 555 }} />
                  </TableCell>
                  <TableCell>{item.station}</TableCell>
                  <TableCell>{item.dept}</TableCell>
                  <TableCell>{item.contact}</TableCell>
                </TableRow>
              ))}
              {filteredRoster.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <Typography variant="subtitle2" color="text.secondary">{t('reports.noAllocations')}</Typography>
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
