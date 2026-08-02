import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
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
import { useTheme } from '@mui/material/styles';

// project imports
import MainCard from 'components/cards/MainCard';
import ChosenSelect from 'components/ChosenSelect';
import PaginationFooter from 'components/PaginationFooter';
import apiClient from 'api/client';
import { useAppPreferences } from 'contexts/AppPreferences';
import { useGetOptionsQuery } from 'store/apiSlice';
import { showNotification } from 'store/slices/notificationSlice';

// assets
import AddOutlined from '@mui/icons-material/AddOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';

const copy = {
  en: {
    title: 'Help & Complaints',
    subtitle: 'Tell us about any application issue or question. Our support team can track and resolve it.',
    subject: 'Subject',
    category: 'Category',
    details: 'Describe the issue',
    submit: 'Submit Complaint',
    mine: 'Your Complaints',
    all: 'All Complaints',
    application: 'Application issue',
    login: 'Login or OTP',
    data: 'Data issue',
    other: 'Other',
    search: 'Search complaints...',
    status: 'Status',
    fromDate: 'From Date',
    toDate: 'To Date',
    state: 'State',
    district: 'District',
    resolvedBy: 'Resolved By',
    resolution: 'Resolution Remark',
    actions: 'Actions',
    resolve: 'Resolve',
    editRemark: 'Edit Remark',
    noComplaints: 'No complaints found.',
    loading: 'Loading complaints...',
    createBtn: 'File a Complaint',
    close: 'Close',
    save: 'Save Changes',
    allStatus: 'All Statuses',
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    districtOptional: 'Select District (Optional)',
    allStates: 'All States',
    allDistricts: 'All Districts'
  },
  hi: {
    title: 'सहायता और शिकायतें',
    subtitle: 'एप्लिकेशन से जुड़ी समस्या या प्रश्न दर्ज करें। सहायता टीम इसे ट्रैक और हल करेगी।',
    subject: 'विषय',
    category: 'श्रेणी',
    details: 'समस्या का विवरण',
    submit: 'शिकायत दर्ज करें',
    mine: 'आपकी शिकायतें',
    all: 'सभी शिकायतें',
    application: 'एप्लिकेशन समस्या',
    login: 'लॉगिन या ओटीपी',
    data: 'डेटा समस्या',
    other: 'अन्य',
    search: 'शिकायतें खोजें...',
    status: 'स्थिति',
    fromDate: 'प्रारंभ तिथि',
    toDate: 'अंतिम तिथि',
    state: 'राज्य',
    district: 'जिला',
    resolvedBy: 'द्वारा हल किया गया',
    resolution: 'समाधान विवरण',
    actions: 'कार्रवाई',
    resolve: 'हल करें',
    editRemark: 'रिमार्क बदलें',
    noComplaints: 'कोई शिकायत नहीं मिली।',
    loading: 'शिकायतें लोड हो रही हैं...',
    createBtn: 'नई शिकायत दर्ज करें',
    close: 'बंद करें',
    save: 'सहेजें',
    allStatus: 'सभी स्थितियां',
    open: 'खुला है',
    in_progress: 'प्रगति पर है',
    resolved: 'हल किया गया',
    districtOptional: 'जिला चुनें (वैकल्पिक)',
    allStates: 'सभी राज्य',
    allDistricts: 'सभी जिले'
  }
};

const getSurfaceSx = (theme: any) => ({
  border: '1px solid',
  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(148, 163, 184, 0.18)',
  borderRadius: 3,
  boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 12px 34px rgba(15, 23, 42, 0.05)',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(180deg, rgba(20, 32, 54, 0.95), rgba(15, 24, 40, 0.9))'
    : '#ffffff'
});

export default function Complaints() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { language } = useAppPreferences();
  const text = copy[language] || copy.en;

  const user = useSelector((state: any) => state.auth.user);
  const userRole = Number(user?.role);
  const isSuperOrSystem = [1, 2].includes(userRole);
  const isAdmin = [1, 2, 3].includes(userRole);

  const { data: optionsData } = useGetOptionsQuery();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [stateFilter, setStateFilter] = useState<number | ''>('');
  const [districtFilter, setDistrictFilter] = useState<number | ''>('');

  // Submit Complaint Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('application');
  const [complaintDistrictId, setComplaintDistrictId] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  // Resolve Complaint Modal State
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [resolveStatus, setResolveStatus] = useState('resolved');
  const [resolutionRemark, setResolutionRemark] = useState('');
  const [resolving, setResolving] = useState(false);

  const load = () => {
    setLoading(true);
    apiClient
      .get('/complaints')
      .then(({ data }) => {
        setItems(data.data?.data || data.data || []);
      })
      .catch((error) => {
        dispatch(showNotification({ message: 'Unable to load complaints.', severity: 'error' }));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpenCreateModal = () => {
    setSubject('');
    setDescription('');
    setCategory('application');
    setComplaintDistrictId(user?.district_id || '');
    setCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
  };

  const handleSubmitComplaint = async (e: any) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        subject,
        description,
        category,
        district_id: complaintDistrictId || null
      };

      const { data } = await apiClient.post('/complaints', payload);
      dispatch(showNotification({ message: data.message || 'Complaint submitted successfully.', severity: 'success' }));
      setCreateModalOpen(false);
      load();
    } catch (error: any) {
      dispatch(showNotification({ message: error.response?.data?.message || 'Failed to submit complaint.', severity: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenResolveModal = (complaint: any) => {
    setSelectedComplaint(complaint);
    setResolveStatus(complaint.status || 'resolved');
    setResolutionRemark(complaint.resolution || '');
    setResolveModalOpen(true);
  };

  const handleCloseResolveModal = () => {
    setResolveModalOpen(false);
    setSelectedComplaint(null);
  };

  const handleSaveResolution = async (e: any) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      setResolving(true);
      const { data } = await apiClient.put(`/complaints/${selectedComplaint.id}`, {
        status: resolveStatus,
        resolution: resolutionRemark
      });
      dispatch(showNotification({ message: data.message || 'Resolution updated successfully.', severity: 'success' }));
      setResolveModalOpen(false);
      load();
    } catch (error: any) {
      dispatch(showNotification({ message: error.response?.data?.message || 'Failed to resolve complaint.', severity: 'error' }));
    } finally {
      setResolving(false);
    }
  };

  // State dropdown state filter change handler
  const handleStateFilterChange = (e: any) => {
    setStateFilter(e.target.value === '' ? '' : Number(e.target.value));
    setDistrictFilter('');
    setPage(1);
  };

  // Filtered districts list based on state selection
  const filteredDistricts = useMemo(() => {
    if (!optionsData?.districts) return [];
    if (!stateFilter) return optionsData.districts;
    return optionsData.districts.filter((d: any) => Number(d.state_id) === Number(stateFilter));
  }, [optionsData, stateFilter]);

  // Clientside Filtering of data
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Search Query
      if (search.trim()) {
        const query = search.toLowerCase();
        const sub = (item.subject || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const uName = (item.user?.name || '').toLowerCase();
        if (!sub.includes(query) && !desc.includes(query) && !uName.includes(query)) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter && item.status !== statusFilter) {
        return false;
      }

      // 3. Date Filters
      if (item.created_at) {
        const dateStr = item.created_at.substring(0, 10);
        if (fromDate && dateStr < fromDate) return false;
        if (toDate && dateStr > toDate) return false;
      }

      // 4. State Filter
      if (stateFilter) {
        const itemStateId = item.district?.state_id || item.user?.state_id;
        if (Number(itemStateId) !== Number(stateFilter)) return false;
      }

      // 5. District Filter
      if (districtFilter) {
        const itemDistrictId = item.district_id || item.user?.district_id;
        if (Number(itemDistrictId) !== Number(districtFilter)) return false;
      }

      return true;
    });
  }, [items, search, statusFilter, fromDate, toDate, stateFilter, districtFilter]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [filteredItems, page, rowsPerPage]);

  const canResolveItem = (item: any) => {
    if (isSuperOrSystem) return true;
    if (userRole === 3) {
      return Number(item.district_id) === Number(user?.district_id);
    }
    return false;
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'application':
        return text.application;
      case 'login':
        return text.login;
      case 'data':
        return text.data;
      default:
        return text.other;
    }
  };

  return (
    <Stack sx={{ gap: 3 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h2">{text.title}</Typography>
          <Typography color="text.secondary">{text.subtitle}</Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddOutlined />}
          onClick={handleOpenCreateModal}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
        >
          {text.createBtn}
        </Button>
      </Stack>

      {/* Filters Card */}
      <Card sx={{ ...getSurfaceSx(theme), p: 2.5 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label={text.search}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined fontSize="small" />
                    </InputAdornment>
                  )
                }
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <ChosenSelect
                label={text.status}
                value={statusFilter}
                placeholder={text.allStatus}
                options={[
                  { value: '', label: text.allStatus },
                  { value: 'open', label: text.open },
                  { value: 'in_progress', label: text.in_progress },
                  { value: 'resolved', label: text.resolved }
                ]}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label={text.fromDate}
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label={text.toDate}
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <ChosenSelect
                label={text.rows || 'Rows'}
                value={rowsPerPage}
                options={[10, 25, 50, 100].map((value) => ({ value, label: `${value} ${text.rows || 'rows'}` }))}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setPage(1);
                }}
              />
            </FormControl>
          </Grid>

          {/* State & District Filters - Only visible to Admins */}
          {isAdmin && (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <ChosenSelect
                    label={text.state}
                    value={stateFilter}
                    placeholder={text.allStates}
                    options={[
                      { value: '', label: text.allStates },
                      ...(optionsData?.states || []).map((s: any) => ({
                        value: s.id,
                        label: s.name
                      }))
                    ]}
                    onChange={handleStateFilterChange}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <ChosenSelect
                    label={text.district}
                    value={districtFilter}
                    placeholder={text.allDistricts}
                    options={[
                      { value: '', label: text.allDistricts },
                      ...filteredDistricts.map((d: any) => ({
                        value: d.id,
                        label: d.name
                      }))
                    ]}
                    onChange={(e) => {
                      setDistrictFilter(e.target.value === '' ? '' : Number(e.target.value));
                      setPage(1);
                    }}
                  />
                </FormControl>
              </Grid>
            </>
          )}
        </Grid>
      </Card>

      {/* DataTable */}
      <MainCard
        title={isAdmin ? text.all : text.mine}
        sx={getSurfaceSx}
        headerSX={{ p: 2.5 }}
        contentSX={{ p: 0 }}
      >
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'bg.100' }}>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>S.No.</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{text.subject}</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{text.category}</TableCell>
                {isAdmin && <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>User</TableCell>}
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{text.district}</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{text.status}</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{text.resolution}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, whiteSpace: 'nowrap', pr: 3 }}>
                  {text.actions}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 9 : 8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">{text.loading}</Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedRows.length > 0 ? (
                paginatedRows.map((item, index) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{(page - 1) * rowsPerPage + index + 1}</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{item.subject}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, whiteSpace: 'pre-line' }}>
                        {item.description}
                      </Typography>
                    </TableCell>
                    <TableCell>{getCategoryLabel(item.category)}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.user?.name || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.user?.mobile || '-'}</Typography>
                      </TableCell>
                    )}
                    <TableCell>{item.district?.name || '-'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          item.status === 'resolved'
                            ? text.resolved
                            : item.status === 'in_progress'
                            ? text.in_progress
                            : text.open
                        }
                        color={
                          item.status === 'resolved'
                            ? 'success'
                            : item.status === 'in_progress'
                            ? 'warning'
                            : 'error'
                        }
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      {item.resolution ? (
                        <Box>
                          <Typography variant="body2">{item.resolution}</Typography>
                          {item.resolved_by && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              Resolved by: {item.resolver?.name || item.resolver?.username || item.resolved_by}
                            </Typography>
                          )}
                          {item.resolved_at && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              On: {new Date(item.resolved_at).toLocaleString()}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          Not resolved yet
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 3 }}>
                      {canResolveItem(item) && (
                        <Button
                          size="small"
                          color="primary"
                          variant="outlined"
                          startIcon={<EditOutlined fontSize="small" />}
                          onClick={() => handleOpenResolveModal(item)}
                          sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                        >
                          {item.status === 'resolved' ? text.editRemark : text.resolve}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 9 : 8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">{text.noComplaints}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <PaginationFooter
          page={page}
          rowsPerPage={rowsPerPage}
          totalRows={filteredItems.length}
          onPageChange={setPage}
        />
      </MainCard>

      {/* Submit Complaint Dialog Modal */}
      <Dialog
        open={createModalOpen}
        onClose={handleCloseCreateModal}
        fullWidth
        maxWidth="sm"
        sx={{ '& .MuiDialog-paper': { borderRadius: 2.5 } }}
      >
        <Box component="form" onSubmit={handleSubmitComplaint}>
          <DialogTitle sx={{ fontWeight: 700, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            {text.createBtn}
          </DialogTitle>
          <DialogContent sx={{ pt: 2.5 }}>
            <Stack spacing={2.5}>
              <TextField
                label={text.subject}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                fullWidth
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <FormControl fullWidth size="small">
                <ChosenSelect
                  label={text.category}
                  value={category}
                  options={[
                    { value: 'application', label: text.application },
                    { value: 'login', label: text.login },
                    { value: 'data', label: text.data },
                    { value: 'other', label: text.other }
                  ]}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </FormControl>

              {/* District association - Super/System Admins can select, others get it auto-assigned */}
              {isSuperOrSystem ? (
                <FormControl fullWidth size="small">
                  <ChosenSelect
                    label={text.districtOptional}
                    value={complaintDistrictId}
                    options={[
                      { value: '', label: 'Select District' },
                      ...(optionsData?.districts || []).map((d: any) => ({
                        value: d.id,
                        label: d.name
                      }))
                    ]}
                    onChange={(e) => setComplaintDistrictId(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </FormControl>
              ) : null}

              <TextField
                label={text.details}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                multiline
                minRows={4}
                fullWidth
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button onClick={handleCloseCreateModal} color="inherit" disabled={submitting} sx={{ borderRadius: 1.5 }}>
              {text.close}
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting || !subject.trim() || !description.trim()}
              sx={{ borderRadius: 1.5 }}
            >
              {submitting ? 'Submitting...' : text.submit}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Resolve / Edit Remark Dialog Modal */}
      <Dialog
        open={resolveModalOpen}
        onClose={handleCloseResolveModal}
        fullWidth
        maxWidth="sm"
        sx={{ '& .MuiDialog-paper': { borderRadius: 2.5 } }}
      >
        <Box component="form" onSubmit={handleSaveResolution}>
          <DialogTitle sx={{ fontWeight: 700, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            {selectedComplaint?.status === 'resolved' ? text.editRemark : text.resolve}
          </DialogTitle>
          <DialogContent sx={{ pt: 2.5 }}>
            <Stack spacing={2.5}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {selectedComplaint?.subject}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                  {selectedComplaint?.description}
                </Typography>
              </Box>

              <FormControl fullWidth size="small">
                <ChosenSelect
                  label={text.status}
                  value={resolveStatus}
                  options={[
                    { value: 'open', label: text.open },
                    { value: 'in_progress', label: text.in_progress },
                    { value: 'resolved', label: text.resolved }
                  ]}
                  onChange={(e) => setResolveStatus(e.target.value)}
                  required
                />
              </FormControl>

              <TextField
                label={text.resolution}
                value={resolutionRemark}
                onChange={(e) => setResolutionRemark(e.target.value)}
                multiline
                minRows={3}
                fullWidth
                size="small"
                placeholder="Enter details on how this complaint was addressed."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button onClick={handleCloseResolveModal} color="inherit" disabled={resolving} sx={{ borderRadius: 1.5 }}>
              {text.close}
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={resolving}
              sx={{ borderRadius: 1.5 }}
            >
              {resolving ? 'Saving...' : text.save}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}
