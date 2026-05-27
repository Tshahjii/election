// material-ui
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

// third-party
import ReactApexChart from 'react-apexcharts';
import { useSelector } from 'react-redux';

// project imports
import MainCard from 'components/cards/MainCard';
import { GRID_SPACING } from 'config';
import { useAppPreferences } from 'contexts/AppPreferences';

// assets
import AssignmentTurnedInOutlined from '@mui/icons-material/AssignmentTurnedInOutlined';
import BallotOutlined from '@mui/icons-material/BallotOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import HowToVoteOutlined from '@mui/icons-material/HowToVoteOutlined';
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined';
import ReportProblemOutlined from '@mui/icons-material/ReportProblemOutlined';
import SecurityOutlined from '@mui/icons-material/SecurityOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';

const overviewCards = [
  { title: 'Registered Voters', titleKey: 'dashboard.registeredVoters', value: '12.48L', caption: 'Across 8 constituencies', captionKey: 'dashboard.registeredVotersCaption', icon: GroupsOutlined, color: '#103c5c' },
  { title: 'Polling Stations', titleKey: 'dashboard.pollingStations', value: '1,284', caption: '1,219 ready for polling', captionKey: 'dashboard.pollingStationsCaption', icon: LocationOnOutlined, color: '#276749' },
  { title: 'Today Turnout', titleKey: 'dashboard.todayTurnout', value: '61.8%', caption: '+7.4% since last update', captionKey: 'dashboard.todayTurnoutCaption', icon: TrendingUpOutlined, color: '#c76a16' },
  { title: 'Open Incidents', titleKey: 'dashboard.openIncidents', value: '18', caption: '4 marked high priority', captionKey: 'dashboard.openIncidentsCaption', icon: ReportProblemOutlined, color: '#b42318' }
];

const constituencyRows = [
  { name: 'North Zone', booths: 182, officers: 364, turnout: 68, status: 'Normal' },
  { name: 'Central City', booths: 246, officers: 492, turnout: 57, status: 'Review' },
  { name: 'River Belt', booths: 154, officers: 308, turnout: 63, status: 'Normal' },
  { name: 'Rural East', booths: 211, officers: 422, turnout: 52, status: 'Attention' }
];

const operations = [
  { label: 'Voter verification queue', labelKey: 'dashboard.verificationQueue', value: 74, color: '#103c5c' },
  { label: 'EVM/VVPAT readiness', labelKey: 'dashboard.evmReadiness', value: 91, color: '#276749' },
  { label: 'Officer attendance', labelKey: 'dashboard.officerAttendance', value: 86, color: '#c76a16' }
];

const tasks = [
  { label: 'Approve pending booth officer replacements', labelKey: 'dashboard.task1' },
  { label: 'Review high-priority incident reports', labelKey: 'dashboard.task2' },
  { label: 'Publish 4 PM turnout bulletin', labelKey: 'dashboard.task3' },
  { label: 'Validate strong room security checklist', labelKey: 'dashboard.task4' }
];

const insightCards = [
  { value: '96%', labelKey: 'dashboard.helpdeskCalls', color: '#103c5c' },
  { value: '3,842', labelKey: 'dashboard.formsProcessed', color: '#276749' },
  { value: '218', labelKey: 'dashboard.teamsDeployed', color: '#c76a16' },
  { value: '99.2%', labelKey: 'dashboard.materialKits', color: '#b42318' }
];

const turnoutChart = {
  series: [
    {
      name: 'Turnout %',
      data: [42, 48, 53, 57, 62, 66, 71, 68]
    }
  ],
  options: {
    chart: { toolbar: { show: false }, sparkline: { enabled: false } },
    colors: ['#276749'],
    dataLabels: { enabled: false },
    grid: { borderColor: '#eef2f6', strokeDashArray: 4 },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '46%' } },
    xaxis: {
      categories: ['North', 'Central', 'River', 'Rural', 'West', 'South', 'Hill', 'Metro'],
      labels: { style: { colors: '#697586' } }
    },
    yaxis: { max: 100, labels: { formatter: (value) => `${value}%`, style: { colors: '#697586' } } },
    tooltip: { y: { formatter: (value) => `${value}% turnout` } }
  }
};

const voterPieChart = {
  series: [74, 16, 7, 3],
  options: {
    labels: ['Verified', 'Pending', 'Correction', 'Rejected'],
    colors: ['#276749', '#c76a16', '#103c5c', '#b42318'],
    legend: { position: 'bottom', fontSize: '13px', markers: { size: 8 } },
    dataLabels: { enabled: true, formatter: (value) => `${Math.round(value)}%` },
    plotOptions: {
      pie: {
        donut: {
          size: '62%',
          labels: {
            show: true,
            total: { show: true, label: 'Verified', formatter: () => '74%' }
          }
        }
      }
    },
    stroke: { width: 0 }
  }
};

// ==============================|| DASHBOARD DEFAULT ||============================== //

export default function Default() {
  const theme = useTheme();
  const user = useSelector((state) => state.auth.user);
  const { t } = useAppPreferences();
  const stateName = user?.state_info?.name || user?.office_info?.state || 'State';
  const officeName = user?.office_info?.office_name || 'Election Office';

  return (
    <Stack sx={{ gap: GRID_SPACING }}>
      <Box
        sx={{
          p: { xs: 2.5, md: 4 },
          borderRadius: 2,
          color: 'common.white',
          overflow: 'hidden',
          position: 'relative',
          bgcolor: 'primary.dark',
          backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.darker} 0%, ${theme.palette.primary.dark} 48%, ${theme.palette.secondary.main} 100%)`,
          boxShadow: `0 18px 48px ${alpha(theme.palette.primary.dark, 0.22)}`
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.12,
            backgroundImage: 'radial-gradient(circle at 18% 18%, #ffffff 0 2px, transparent 2px)',
            backgroundSize: '34px 34px'
          }}
        />
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          sx={{ position: 'relative', gap: 3, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack sx={{ gap: 1.5, maxWidth: 650 }}>
            <Chip label={`${stateName} - ${officeName}`} sx={{ width: 'fit-content', color: 'primary.dark', bgcolor: 'common.white', fontWeight: 700 }} />
            <Typography variant="h1" sx={{ color: 'common.white' }}>
              {t('dashboard.title')}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.78)' }}>
              {t('dashboard.subtitle')}
            </Typography>
          </Stack>
          <Avatar
            variant="rounded"
            sx={{
              width: { xs: 64, sm: 88 },
              height: { xs: 64, sm: 88 },
              bgcolor: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.24)',
              boxShadow: 'inset 0 0 24px rgba(255,255,255,0.12)'
            }}
          >
            <HowToVoteOutlined sx={{ fontSize: { xs: 36, sm: 48 } }} />
          </Avatar>
        </Stack>
      </Box>

      <Grid container spacing={GRID_SPACING}>
        {overviewCards.map((item) => {
          const Icon = item.icon;
          return (
            <Grid key={item.title} size={{ xs: 12, sm: 6, lg: 3 }}>
              <MainCard
                sx={{
                  height: 1,
                  borderRadius: 2,
                  border: `1px solid ${alpha(item.color, 0.16)}`,
                  boxShadow: `0 12px 34px ${alpha(item.color, 0.1)}`,
                  background: `linear-gradient(180deg, ${alpha(item.color, 0.08)} 0%, ${theme.palette.background.paper} 58%)`
                }}
              >
                <Stack sx={{ gap: 2 }}>
                  <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {item.titleKey ? t(item.titleKey) : item.title}
                    </Typography>
                    <Avatar sx={{ width: 42, height: 42, bgcolor: `${item.color}14`, color: item.color }}>
                      <Icon />
                    </Avatar>
                  </Stack>
                  <Box>
                    <Typography variant="h2">{item.value}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.captionKey ? t(item.captionKey) : item.caption}
                    </Typography>
                  </Box>
                </Stack>
              </MainCard>
            </Grid>
          );
        })}

        <Grid size={{ xs: 12 }}>
          <MainCard
            title={t('dashboard.quickInsights')}
            sx={{ borderRadius: 2, boxShadow: `0 12px 34px ${alpha(theme.palette.primary.dark, 0.08)}` }}
            headerSX={{ '& .MuiCardHeader-title': { fontSize: '1rem' } }}
          >
            <Grid container spacing={2}>
              {insightCards.map((item) => (
                <Grid key={item.labelKey} size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Box sx={{ p: 1.5, border: `1px solid ${alpha(item.color, 0.2)}`, borderRadius: 1, bgcolor: alpha(item.color, 0.05) }}>
                    <Typography variant="h3" sx={{ color: item.color }}>
                      {item.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t(item.labelKey)}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </MainCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <MainCard
            title={t('dashboard.turnoutGraph')}
            sx={{ borderRadius: 2, boxShadow: `0 12px 34px ${alpha(theme.palette.primary.dark, 0.08)}` }}
            headerSX={{ '& .MuiCardHeader-title': { fontSize: '1rem' } }}
          >
            <Box sx={{ minHeight: { xs: 260, md: 330 } }}>
              <ReactApexChart options={turnoutChart.options} series={turnoutChart.series} type="bar" height={320} />
            </Box>
          </MainCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <MainCard
            title={t('dashboard.voterPieChart')}
            sx={{ height: 1, borderRadius: 2, boxShadow: `0 12px 34px ${alpha(theme.palette.primary.dark, 0.08)}` }}
            headerSX={{ '& .MuiCardHeader-title': { fontSize: '1rem' } }}
          >
            <Box sx={{ minHeight: { xs: 280, md: 320 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ReactApexChart options={voterPieChart.options as any} series={voterPieChart.series} type="donut" height={310} />
            </Box>
          </MainCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <MainCard
            title={t('dashboard.monitoring')}
            sx={{ borderRadius: 2, boxShadow: `0 12px 34px ${alpha(theme.palette.primary.dark, 0.08)}` }}
            headerSX={{ '& .MuiCardHeader-title': { fontSize: '1rem' } }}
          >
            <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
              <Table sx={{ minWidth: 620 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('dashboard.constituency')}</TableCell>
                    <TableCell align="right">{t('dashboard.booths')}</TableCell>
                    <TableCell align="right">{t('dashboard.officers')}</TableCell>
                    <TableCell>{t('dashboard.turnout')}</TableCell>
                    <TableCell>{t('dashboard.status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {constituencyRows.map((row) => (
                    <TableRow key={row.name} hover>
                      <TableCell>
                        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25 }}>
                          <Avatar sx={{ width: 34, height: 34, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                            <BallotOutlined fontSize="small" />
                          </Avatar>
                          <Typography variant="subtitle2">{row.name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{row.booths}</TableCell>
                      <TableCell align="right">{row.officers}</TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        <Stack sx={{ gap: 0.75 }}>
                          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">
                              {t('dashboard.current')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {row.turnout}%
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={row.turnout}
                            sx={{ height: 7, borderRadius: 5, bgcolor: alpha(theme.palette.primary.main, 0.08), '& .MuiLinearProgress-bar': { bgcolor: 'secondary.main' } }}
                          />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={t(`data.${row.status.toLowerCase()}`)}
                          size="small"
                          color={row.status === 'Normal' ? 'success' : row.status === 'Review' ? 'warning' : 'error'}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Stack sx={{ display: { xs: 'flex', md: 'none' }, gap: 1.5 }}>
              {constituencyRows.map((row) => (
                <Box key={row.name} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                  <Stack sx={{ gap: 1.25 }}>
                    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main' }}>
                          <BallotOutlined fontSize="small" />
                        </Avatar>
                        <Typography variant="subtitle2">{row.name}</Typography>
                      </Stack>
                      <Chip
                        label={t(`data.${row.status.toLowerCase()}`)}
                        size="small"
                        color={row.status === 'Normal' ? 'success' : row.status === 'Review' ? 'warning' : 'error'}
                        variant="outlined"
                      />
                    </Stack>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('dashboard.booths')}: {row.booths}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('dashboard.officers')}: {row.officers}
                      </Typography>
                    </Stack>
                    <Stack sx={{ gap: 0.75 }}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          {t('dashboard.turnout')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.turnout}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={row.turnout}
                        sx={{ height: 7, borderRadius: 5, bgcolor: alpha(theme.palette.primary.main, 0.1), '& .MuiLinearProgress-bar': { bgcolor: 'success.main' } }}
                      />
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </MainCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack sx={{ gap: GRID_SPACING }}>
            <MainCard
              title={t('dashboard.operationsReadiness')}
              sx={{ borderRadius: 2, boxShadow: `0 12px 34px ${alpha(theme.palette.primary.dark, 0.08)}` }}
              headerSX={{ '& .MuiCardHeader-title': { fontSize: '1rem' } }}
            >
              <Stack sx={{ gap: 2.25 }}>
                {operations.map((item) => (
                  <Stack key={item.label} sx={{ gap: 0.85 }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
                      <Typography variant="body2">{item.labelKey ? t(item.labelKey) : item.label}</Typography>
                      <Typography variant="subtitle2">{item.value}%</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={item.value}
                      sx={{ height: 8, borderRadius: 5, bgcolor: alpha(theme.palette.primary.main, 0.1), '& .MuiLinearProgress-bar': { bgcolor: item.color } }}
                    />
                  </Stack>
                ))}
              </Stack>
            </MainCard>

            <MainCard
              title={t('dashboard.priorityTasks')}
              sx={{ borderRadius: 2, boxShadow: `0 12px 34px ${alpha(theme.palette.primary.dark, 0.08)}` }}
              headerSX={{ '& .MuiCardHeader-title': { fontSize: '1rem' } }}
            >
              <Stack sx={{ gap: 1.5 }}>
                {tasks.map((task, index) => (
                  <Stack key={task.labelKey} direction="row" sx={{ alignItems: 'flex-start', gap: 1.25 }}>
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        fontSize: 13,
                        bgcolor: index < 2 ? alpha(theme.palette.warning.main, 0.14) : alpha(theme.palette.success.main, 0.14),
                        color: index < 2 ? 'warning.dark' : 'success.dark'
                      }}
                    >
                      {index + 1}
                    </Avatar>
                    <Typography variant="body2">{t(task.labelKey)}</Typography>
                  </Stack>
                ))}
              </Stack>
            </MainCard>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <MainCard sx={{ borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.08), border: `1px solid ${alpha(theme.palette.warning.main, 0.24)}` }}>
            <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center' }}>
              <AssignmentTurnedInOutlined sx={{ color: 'warning.dark' }} />
              <Box>
                <Typography variant="h4">1,032</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('dashboard.boothChecklists')}
                </Typography>
              </Box>
            </Stack>
          </MainCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MainCard sx={{ borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.08), border: `1px solid ${alpha(theme.palette.success.main, 0.24)}` }}>
            <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center' }}>
              <SecurityOutlined sx={{ color: 'success.dark' }} />
              <Box>
                <Typography variant="h4">98.6%</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('dashboard.securityCompliance')}
                </Typography>
              </Box>
            </Stack>
          </MainCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MainCard sx={{ borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.08), border: `1px solid ${alpha(theme.palette.primary.main, 0.24)}` }}>
            <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center' }}>
              <HowToVoteOutlined sx={{ color: 'primary.main' }} />
              <Box>
                <Typography variant="h4">24 min</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('dashboard.fieldUpdateInterval')}
                </Typography>
              </Box>
            </Stack>
          </MainCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
