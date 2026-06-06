import { useMemo, useState } from 'react';

// material-ui
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

// project imports
import MainCard from 'components/cards/MainCard';

// assets
import HowToVoteOutlined from '@mui/icons-material/HowToVoteOutlined';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import AssignmentTurnedInOutlined from '@mui/icons-material/AssignmentTurnedInOutlined';

interface ElectionDashboardProps {
  type: 'Nagar Panchayat' | 'Nagari Nikay';
}

const mockCandidates = {
  'Nagar Panchayat': [
    { id: 'CAN101', name: 'Ram Kumar Patwa', ward: 'Ward 03 - Sadar', party: 'Independent', status: 'Approved' },
    { id: 'CAN102', name: 'Savita Devi Sahu', ward: 'Ward 05 - Harijan Basti', party: 'BJP', status: 'Approved' },
    { id: 'CAN103', name: 'Mohammad Yusuf', ward: 'Ward 08 - Station Road', party: 'INC', status: 'Approved' },
    { id: 'CAN104', name: 'Rakesh Verma', ward: 'Ward 12 - Purana Bazar', party: 'BSP', status: 'Pending Review' }
  ],
  'Nagari Nikay': [
    { id: 'CAN201', name: 'Amit Shahji', ward: 'Ward 14 - Civil Lines', party: 'BJP', status: 'Approved' },
    { id: 'CAN202', name: 'Rajendra Prasad Dixit', ward: 'Ward 22 - Subhash Nagar', party: 'INC', status: 'Approved' },
    { id: 'CAN203', name: 'Vikash Kumar Pal', ward: 'Ward 35 - Shastri Nagar', party: 'SP', status: 'Pending Review' },
    { id: 'CAN204', name: 'Nisha Siddiqui', ward: 'Ward 44 - Azad Nagar', party: 'AAP', status: 'Disqualified' }
  ]
};

export default function ElectionDashboard({ type }: ElectionDashboardProps) {
  const theme = useTheme();

  // State hooks for Team Schedule form
  const [showForm, setShowForm] = useState(false);
  const totalEmployees = type === 'Nagar Panchayat' ? 4 : 5;
  const [maleCount, setMaleCount] = useState(0);

  // Dynamic statistics based on election type
  const stats = useMemo(() => {
    if (type === 'Nagari Nikay') {
      return {
        wards: 45,
        booths: 120,
        candidates: 184,
        voters: '1,45,280',
        deployed: 480
      };
    }
    return {
      wards: 15,
      booths: 30,
      candidates: 54,
      voters: '24,850',
      deployed: 120
    };
  }, [type]);

  const candidatesList = mockCandidates[type] || [];

  const getStatusChip = (status) => {
    if (status === 'Approved') return <Chip label="Verified" color="success" size="small" variant="filled" />;
    if (status === 'Disqualified') return <Chip label="Disqualified" color="error" size="small" variant="filled" />;
    return <Chip label="Pending" color="warning" size="small" variant="outlined" />;
  };

  return (
    <Stack sx={{ gap: 3 }}>
      <Box>
        <Typography variant="h2">{type} Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor wards, polling booths, candidate verifications, and voter counts for local {type} elections.
        </Typography>
      </Box>

      {/* KPI Cards Grid */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.25, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Total Wards</Typography>
                <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 700 }}>{stats.wards}</Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', bgcolor: 'primary.lighter', color: 'primary.main' }}>
                <PlaceOutlined />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.25, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Polling Booths</Typography>
                <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 700 }}>{stats.booths}</Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', bgcolor: 'success.lighter', color: 'success.main' }}>
                <HowToVoteOutlined />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.25, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Registered Voters</Typography>
                <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 700 }}>{stats.voters}</Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', bgcolor: 'info.lighter', color: 'info.main' }}>
                <PeopleAltOutlined />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.25, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Deployed Officers</Typography>
                <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 700 }}>{stats.deployed}</Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', bgcolor: 'warning.lighter', color: 'warning.main' }}>
                <AssignmentTurnedInOutlined />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Create Team Schedule Card */}
      <Grid item xs={12} md={6} lg={4}>
        <Card sx={{ p: 2.5, borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" component="div" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Team Scheduling</Typography>
            <Button variant="contained" color="primary" onClick={() => setShowForm((prev) => !prev)}>
              Create Team Schedule
            </Button>
          </Stack>
          <Collapse in={showForm} timeout="auto" unmountOnExit>
            <Stack spacing={2} sx={{ mt: 1 }} component="div">
              <TextField variant="outlined" label="Date of Birth" type="date" InputLabelProps={{ shrink: true }} />
              <TextField variant="outlined" label="Number of Employees" type="number" value={totalEmployees} InputProps={{ readOnly: true }} />
              <Stack direction="row" spacing={2} component="div" sx={{ alignItems: 'center' }}>
                <TextField
                  variant="outlined"
                  label="Male"
                  type="number"
                  value={maleCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 0;
                    if (val >= 0 && val <= totalEmployees) setMaleCount(val);
                  }}
                  InputProps={{ inputProps: { min: 0, max: totalEmployees } }}
                />
                <Typography variant="body1">Female: {totalEmployees - maleCount}</Typography>
              </Stack>
            </Stack>
          </Collapse>
        </Card>
      </Grid>

      {/* Candidates & Zones Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <MainCard title="Candidate Nomination Log" sx={{ borderRadius: 2, boxShadow: '0 10px 30px rgba(16, 60, 92, 0.08)' }} contentSX={{ p: 0, '&:last-child': { pb: 0 } }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Candidate</TableCell>
                    <TableCell>ID</TableCell>
                    <TableCell>Ward / Area</TableCell>
                    <TableCell>Affiliation / Party</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {candidatesList.map((cand) => (
                    <TableRow key={cand.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{cand.name}</TableCell>
                      <TableCell>{cand.id}</TableCell>
                      <TableCell>{cand.ward}</TableCell>
                      <TableCell>
                        <Chip label={cand.party} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">{getStatusChip(cand.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </MainCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <MainCard title="Election Overview & Details" sx={{ borderRadius: 2, boxShadow: '0 10px 30px rgba(16, 60, 92, 0.08)' }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2">Nomination Stage</Typography>
                <Typography variant="subtitle2" sx={{ color: 'success.main', fontWeight: 700 }}>Open</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2">Verification Checks</Typography>
                <Typography variant="subtitle2">Active</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2">Security Staff Deployed</Typography>
                <Typography variant="subtitle2">Yes</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography variant="body2">Polling Date</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>15th June 2026</Typography>
              </Box>
            </Stack>
          </MainCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
