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
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import FormHelperText from '@mui/material/FormHelperText';

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
  useDeleteMasterMutation,
  useImportMasterMutation
} from 'store/apiSlice';

// assets
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import UploadFileOutlined from '@mui/icons-material/UploadFileOutlined';
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';

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

const csvEscape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

function downloadCsvTemplate(title: string, columns: { key: string; label: string; required?: boolean }[]) {
  const headers = columns.map((column) => column.key);
  const helperRow = columns.map((column) => `${column.label}${column.required ? ' (required)' : ''}`);
  const csv = [headers, helperRow].map((row) => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'import'}-template.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function firstValue(...values: any[]) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

const defaultForm: Record<string, any> = {
  status: 1,
  office_type: 1,
  ofc_parent_id: 0,
  gender: 1,
  city_type: 'urban',
  any_disability: 0
};

export default function Employees() {
  const dispatch = useDispatch();
  const { t, tl } = useAppPreferences();
  const { user } = useSelector((state: any) => state.auth);

  const [filters, setFilters] = useState({ search: '', status: '' });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [modal, setModal] = useState({ open: false, mode: 'create', row: null });
  const [deleteRow, setDeleteRow] = useState(null);
  const [form, setForm] = useState<Record<string, any>>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<any[]>([]);

  const canCreate = hasPermission(user, 'hrms.employees.create');
  const canEdit = hasPermission(user, 'hrms.employees.edit');
  const canDelete = hasPermission(user, 'hrms.employees.delete');

  const { data: optionsData } = useGetOptionsQuery();
  const options = useMemo(() => {
    const rawOptions = optionsData || {
      countries: [], states: [], districts: [], cities: [], np_cities: [], rp_cities: [],
      offices: [], emp_types: [], designations: [], departments: [], pay_levels: []
    };
    return rawOptions;
  }, [optionsData]);

  const debouncedFilters = useDebounce(filters, 400);

  const { data: listData, isFetching: loading } = useGetMastersQuery({
    type: 'employees',
    params: {
      search: debouncedFilters.search || undefined,
      status: debouncedFilters.status === '' ? undefined : debouncedFilters.status,
      page,
      per_page: rowsPerPage
    }
  });

  const [triggerExportQuery] = useLazyGetMastersQuery();
  const [createMaster] = useCreateMasterMutation();
  const [updateMaster] = useUpdateMasterMutation();
  const [deleteMaster] = useDeleteMasterMutation();
  const [importMaster, { isLoading: importing }] = useImportMasterMutation();

  const formStateOptions = useMemo(() => {
    if (!form.country_id) return options.states;
    return options.states.filter((state: any) => Number(state.country_id) === Number(form.country_id));
  }, [form.country_id, options.states]);

  const formDistrictOptions = useMemo(() => {
    if (!form.state_id) return [];
    return options.districts.filter((district: any) => Number(district.state_id) === Number(form.state_id));
  }, [form.state_id, options.districts]);

  const formCityOptions = useMemo(() => {
    if (!form.district_id) return [];
    const citiesList = form.city_type === 'urban' ? options.np_cities : options.rp_cities;
    return (citiesList || []).filter((city: any) => Number(city.district_id) === Number(form.district_id));
  }, [form.district_id, form.city_type, options.np_cities, options.rp_cities]);

  const formOfficeOptions = useMemo(() => {
    if (!form.district_id) return options.offices;
    return options.offices.filter((office: any) => Number(office.district_id) === Number(form.district_id));
  }, [form.district_id, options.offices]);

  const rows = useMemo(() => {
    return listData?.data || [];
  }, [listData]);

  const totalRows = listData?.total || 0;

  const exportTitle = `${t('masters.employees') || 'Employees'} Report`;
  const exportColumns = useMemo(
    () => [
      { key: '__sno', label: t('common.sno') || 'S.No.' },
      { key: 'emp_code', label: tl('NIC Code') },
      { key: 'gov_emp_code', label: tl('Govt. Employee Code') },
      { key: 'name', label: tl('Name') },
      { key: 'mobile', label: tl('Mobile') },
      { key: 'emp_type_name', label: tl('Employee Type') },
      { key: 'department_name', label: tl('Department') },
      { key: 'designation_name', label: tl('Designation') },
      { key: 'pay_level_name', label: tl('Pay Level') },
      { key: 'office_name', label: tl('Office') },
      { key: 'status_label', label: t('common.status') || 'Status' }
    ],
    [t, tl]
  );

  const handleGetRows = async () => {
    const result = await triggerExportQuery({
      type: 'employees',
      params: {
        search: debouncedFilters.search || undefined,
        status: debouncedFilters.status === '' ? undefined : debouncedFilters.status,
        page: 1,
        per_page: Math.max(Number(listData?.total || 0), 10000)
      }
    }).unwrap();

    const rawRows = result?.data || [];
    return rawRows.map((row, index) => ({
      ...row,
      __sno: index + 1,
      status_label: Number(row.status) === 1 ? t('common.active') : t('common.inactive')
    }));
  };

  const handleSearchFilterChange = (value: string) => {
    setFilters((current) => ({ ...current, search: value }));
    setPage(1);
  };

  const handleOpenCreate = () => {
    const next: Record<string, any> = { ...defaultForm };

    const countryVal = firstValue(user?.country_id, user?.country_info?.id, user?.office_info?.country_id);
    const stateVal = firstValue(user?.state_id, user?.state_info?.id, user?.office_info?.state_id);
    const districtVal = firstValue(user?.district_id, user?.district_info?.id, user?.office_info?.district_id);

    if (countryVal) next.country_id = Number(countryVal);
    if (stateVal) next.state_id = Number(stateVal);
    if (districtVal) next.district_id = Number(districtVal);

    const userDeptVal = firstValue(user?.department, user?.office_info?.company_name);
    if (userDeptVal) {
      const dept = options.departments.find(
        (item: any) =>
          Number(item.id) === Number(userDeptVal) ||
          String(item.department).toLowerCase() === String(userDeptVal).toLowerCase()
      );
      if (dept) next.department_id = dept.id;
    }

    const userOfcVal = firstValue(user?.ofc_id, user?.office_info?.ofc_id);
    if (userOfcVal) {
      next.ofc_id = Number(userOfcVal);
    }

    setForm(next);
    setErrors({});
    setModal({ open: true, mode: 'create', row: null });
  };

  const handleOpenEdit = (row) => {
    setForm({
      ...defaultForm,
      ...row,
      status: Number(row.status)
    });
    setErrors({});
    setModal({ open: true, mode: 'edit', row });
  };

  const handleCloseModal = () => {
    setModal({ open: false, mode: 'create', row: null });
    setErrors({});
  };

  const handleFormChange = (field: string) => (event: any) => {
    const value = event.target.value;

    // Restrict basic_pay typing if it exceeds max pay level value
    if (field === 'basic_pay') {
      const payLevelId = form.pay_level_id;
      if (payLevelId) {
        const selectedPayLevel = options.pay_levels.find((pl: any) => Number(pl.id) === Number(payLevelId));
        if (selectedPayLevel) {
          const max = parseFloat(selectedPayLevel.max_amount_pay);
          const val = parseFloat(value);
          if (!isNaN(val) && val > max) {
            setErrors((current) => ({
              ...current,
              basic_pay: `Basic Pay cannot exceed ${max} for the selected Pay Level.`
            }));
            return; // Block the update
          }
        }
      }
    }

    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });

    setForm((current) => {
      const next: Record<string, any> = { ...current, [field]: value };
      if (field === 'title') {
        if (value === 'श्री' || value === 'श्रीमान') {
          next.gender = 1;
        } else if (value === 'श्रीमती' || value === 'सुश्री' || value === 'कुमारी') {
          next.gender = 2;
        }
      }
      if (field === 'pay_level_id' && value) {
        const selectedPayLevel = options.pay_levels.find((pl: any) => Number(pl.id) === Number(value));
        if (selectedPayLevel) {
          const min = parseFloat(selectedPayLevel.min_amount_pay);
          const max = parseFloat(selectedPayLevel.max_amount_pay);
          const currentBasicPay = parseFloat(next.basic_pay);
          if (!isNaN(currentBasicPay)) {
            if (currentBasicPay > max) {
              next.basic_pay = String(max);
            } else if (currentBasicPay < min) {
              next.basic_pay = String(min);
            }
          }
        }
      }
      if (field === 'country_id') {
        next.state_id = '';
        next.district_id = '';
        next.city_id = '';
      }
      if (field === 'state_id') {
        next.district_id = '';
        next.city_id = '';
        next.ofc_id = '';
      }
      if (field === 'district_id') {
        next.city_id = '';
        next.ofc_id = '';
      }
      return next;
    });
  };

  const handleBasicPayBlur = (event: any) => {
    const value = event.target.value;
    const payLevelId = form.pay_level_id;
    if (payLevelId && value) {
      const selectedPayLevel = options.pay_levels.find((pl: any) => Number(pl.id) === Number(payLevelId));
      if (selectedPayLevel) {
        const min = parseFloat(selectedPayLevel.min_amount_pay);
        const val = parseFloat(value);
        if (!isNaN(val) && val < min) {
          setForm((current) => ({
            ...current,
            basic_pay: String(min)
          }));
          setErrors((current) => ({
            ...current,
            basic_pay: `Basic Pay set to minimum limit of ${min} for the selected Pay Level.`
          }));
        }
      }
    }
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    const clientErrors: Record<string, string> = {};
    const requiredFields = [
      { key: 'title', label: 'Title' },
      { key: 'name', label: 'Name' },
      { key: 'gender', label: 'Gender' },
      { key: 'dob', label: 'Date of Birth' },
      { key: 'mobile', label: 'Mobile' },
      { key: 'email', label: 'Email' },
      { key: 'emp_type_id', label: 'Employee Type' },
      { key: 'department_id', label: 'Department' },
      { key: 'designation_id', label: 'Designation' },
      { key: 'pay_level_id', label: 'Pay Level' },
      { key: 'basic_pay', label: 'Basic Pay' },
      { key: 'country_id', label: 'Country' },
      { key: 'state_id', label: 'State' },
      { key: 'district_id', label: 'District' },
      { key: 'city_type', label: 'City Type' },
      { key: 'city_id', label: 'City' }
    ];

    requiredFields.forEach((field) => {
      const value = form[field.key];
      if (value === undefined || value === null || String(value).trim() === '') {
        clientErrors[field.key] = `${field.label} is required.`;
      }
    });

    const payLevelId = form.pay_level_id;
    const basicPay = parseFloat(form.basic_pay);
    if (payLevelId && !isNaN(basicPay)) {
      const selectedPayLevel = options.pay_levels.find((pl: any) => Number(pl.id) === Number(payLevelId));
      if (selectedPayLevel) {
        const min = parseFloat(selectedPayLevel.min_amount_pay);
        const max = parseFloat(selectedPayLevel.max_amount_pay);
        if (basicPay < min || basicPay > max) {
          clientErrors.basic_pay = `Basic Pay must be between ${min} and ${max} for the selected Pay Level.`;
        }
      }
    }

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      dispatch(showNotification({ message: 'Please correct the validation errors in the form.', severity: 'error' }));
      return;
    }

    try {
      if (modal.mode === 'edit') {
        await updateMaster({ type: 'employees', id: modal.row.id, data: form }).unwrap();
      } else {
        await createMaster({ type: 'employees', data: form }).unwrap();
      }
      dispatch(showNotification({ message: `Employee saved successfully.` }));
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

  const handleImportFileChange = (event: any) => {
    const file = event.target.files?.[0] || null;
    if (file && !file.name.toLowerCase().endsWith('.csv')) {
      dispatch(showNotification({ message: 'Please upload a CSV file.', severity: 'error' }));
      event.target.value = '';
      setImportFile(null);
      return;
    }
    setImportErrors([]);
    setImportFile(file);
  };

  const handleDownloadTemplate = () => {
    downloadCsvTemplate(`employees-import`, [
      { key: 'gov_emp_code', label: tl('Govt. Employee Code'), required: false },
      { key: 'title', label: tl('Title'), required: true },
      { key: 'name', label: tl('Name'), required: true },
      { key: 'gender', label: tl('Gender'), required: true },
      { key: 'dob', label: tl('Date of Birth'), required: true },
      { key: 'mobile', label: tl('Mobile'), required: true },
      { key: 'email', label: tl('Email'), required: true },
      { key: 'emp_type_id', label: tl('Employee Type'), required: true },
      { key: 'department_id', label: tl('Department'), required: true },
      { key: 'designation_id', label: tl('Designation'), required: true },
      { key: 'pay_level_id', label: tl('Pay Level'), required: true },
      { key: 'basic_pay', label: tl('Basic Pay'), required: true },
      { key: 'country_id', label: tl('Country'), required: true },
      { key: 'state_id', label: tl('State'), required: true },
      { key: 'district_id', label: tl('District'), required: true },
      { key: 'city_type', label: tl('City Type'), required: true },
      { key: 'city_id', label: tl('City'), required: true },
      { key: 'ofc_id', label: tl('Office'), required: false },
      { key: 'any_disability', label: tl('Any Disability'), required: true },
      { key: 'remark', label: tl('Remark'), required: false },
      { key: 'status', label: t('common.status') || 'Status', required: false }
    ]);
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      dispatch(showNotification({ message: 'Please choose a CSV file to import.', severity: 'error' }));
      return;
    }

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const response = await importMaster({ type: 'employees', data: formData }).unwrap();
      setImportErrors(response.failed || []);
      dispatch(showNotification({ message: response.message || 'Import completed.', severity: response.failed?.length ? 'warning' : 'success' }));
      if (!response.failed?.length) {
        setImportModalOpen(false);
        setImportFile(null);
      }
    } catch (error: any) {
      const errMsg = error?.data?.message || error?.message || 'Import failed.';
      dispatch(showNotification({ message: errMsg, severity: 'error' }));
    }
  };

  const handleDelete = async () => {
    if (!deleteRow) return;

    try {
      await deleteMaster({ type: 'employees', id: deleteRow.id }).unwrap();
      dispatch(showNotification({ message: `Employee deleted successfully.` }));
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
            {t('masters.managePrefix')} {(t('masters.employees') || 'Employees').toLowerCase()} {t('masters.manageSuffix')}
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <DownloadMenu title={exportTitle} columns={exportColumns} getRowsLazy={handleGetRows} disabled={loading} />
          {canCreate && (
            <Button variant="outlined" color="secondary" startIcon={<UploadFileOutlined />} onClick={() => setImportModalOpen(true)} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
              Import
            </Button>
          )}
          {canCreate && (
            <Button variant="contained" color="primary" startIcon={<AddOutlined />} onClick={handleOpenCreate} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
              {t('common.create')} Employee
            </Button>
          )}
        </Stack>
      </Stack>

      <MainCard sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: '0 14px 36px rgba(15, 23, 42, 0.07)' }} contentSX={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <SearchTextField
              fullWidth
              size="small"
              label={`${t('common.search')} Employees`}
              value={filters.search}
              onChange={handleSearchFilterChange}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
            />
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
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <ChosenSelect
                label={t('common.rows') || 'Rows'}
                value={rowsPerPage}
                options={[10, 25, 50, 100].map((value) => ({ value, label: `${value} rows` }))}
                onChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(1); }}
              />
            </FormControl>
          </Grid>
        </Grid>
      </MainCard>

      <MainCard
        title={`Employees (${totalRows})`}
        sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: '0 14px 36px rgba(15, 23, 42, 0.07)', overflow: 'hidden' }}
        headerSX={{ p: 2, '& .MuiCardHeader-title': { fontSize: '1rem' } }}
        contentSX={{ p: 2, '&:last-child': { pb: 2 } }}
      >
        <TableContainer sx={{ '&::-webkit-scrollbar': { height: 8 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 8 } }}>
          <Table sx={{ minWidth: 960 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'bg.100' }}>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{t('common.sno')}</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>NIC Code</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Govt. Employee Code</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Mobile</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Employee Type</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Designation</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Pay Level</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Office</TableCell>
                <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{t('common.status')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{t('common.action')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={`employees-${row.id}`} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell>{(page - 1) * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{row.emp_code || '-'}</TableCell>
                  <TableCell>{row.gov_emp_code || '-'}</TableCell>
                  <TableCell>{row.name || '-'}</TableCell>
                  <TableCell>{row.mobile || '-'}</TableCell>
                  <TableCell>{row.emp_type_name || '-'}</TableCell>
                  <TableCell>{row.department_name || '-'}</TableCell>
                  <TableCell>{row.designation_name || '-'}</TableCell>
                  <TableCell>{row.pay_level_name || '-'}</TableCell>
                  <TableCell>{row.office_name || '-'}</TableCell>
                  <TableCell>
                    <Chip label={Number(row.status) === 1 ? t('common.active') : t('common.inactive')} size="small" color={Number(row.status) === 1 ? 'success' : 'error'} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 0.5 }}>
                      {canEdit && (
                        <IconButton size="small" color="success" aria-label={`edit employee`} onClick={() => handleOpenEdit(row)}>
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton size="small" color="error" aria-label={`delete employee`} onClick={() => setDeleteRow(row)}>
                          <DeleteOutlineOutlined fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    {t('common.noRecords')}
                  </TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    {t('common.loading')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <PaginationFooter page={page} rowsPerPage={rowsPerPage} totalRows={totalRows} onPageChange={setPage} />
      </MainCard>

      <Dialog open={modal.open} onClose={handleCloseModal} fullWidth maxWidth="lg">
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogTitle component="div" sx={{ pb: 1 }}>
            <Typography variant="h3" component="h2">
              {modal.mode === 'edit' ? t('common.update') : t('common.create')} Employee
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ pt: 0.5 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={tl('Govt. Employee Code')}
                  value={form.gov_emp_code ?? ''}
                  onChange={handleFormChange('gov_emp_code')}
                  error={!!errors.gov_emp_code}
                  helperText={errors.gov_emp_code}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl component="fieldset" fullWidth required error={!!errors.title}>
                  <FormLabel component="legend" required sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                    {tl('Title')}
                  </FormLabel>
                  <RadioGroup
                    row
                    value={form.title ?? ''}
                    onChange={handleFormChange('title')}
                    sx={errors.title ? { 
                      border: '1px solid #d32f2f', 
                      borderRadius: '8px', 
                      p: '4px 12px',
                      backgroundColor: 'rgba(211, 47, 47, 0.02)'
                    } : {}}
                  >
                    {[
                      { value: 'श्री', label: 'श्री' },
                      { value: 'श्रीमान', label: 'श्रीमान' },
                      { value: 'श्रीमती', label: 'श्रीमती' },
                      { value: 'सुश्री', label: 'सुश्री' },
                      { value: 'कुमारी', label: 'कुमारी' },
                      { value: 'डॉ', label: 'डॉ' }
                    ].map((opt) => (
                      <FormControlLabel key={opt.value} value={opt.value} control={<Radio size="small" />} label={opt.label} />
                    ))}
                  </RadioGroup>
                  {errors.title && <FormHelperText>{errors.title}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  label={tl('Name')}
                  value={form.name ?? ''}
                  onChange={handleFormChange('name')}
                  error={!!errors.name}
                  helperText={errors.name}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl component="fieldset" fullWidth required error={!!errors.gender}>
                  <FormLabel component="legend" required sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                    {tl('Gender')}
                  </FormLabel>
                  <RadioGroup
                    row
                    value={form.gender !== undefined && form.gender !== null ? String(form.gender) : '1'}
                    onChange={handleFormChange('gender')}
                    sx={errors.gender ? { 
                      border: '1px solid #d32f2f', 
                      borderRadius: '8px', 
                      p: '4px 12px',
                      backgroundColor: 'rgba(211, 47, 47, 0.02)'
                    } : {}}
                  >
                    <FormControlLabel value="1" control={<Radio size="small" />} label="Male" />
                    <FormControlLabel value="2" control={<Radio size="small" />} label="Female" />
                  </RadioGroup>
                  {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  label={tl('Date of Birth')}
                  type="date"
                  value={form.dob ?? ''}
                  onChange={handleFormChange('dob')}
                  error={!!errors.dob}
                  helperText={errors.dob}
                  size="small"
                  slotProps={{
                    inputLabel: { shrink: true }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  label={tl('Mobile')}
                  value={form.mobile ?? ''}
                  onChange={handleFormChange('mobile')}
                  error={!!errors.mobile}
                  helperText={errors.mobile}
                  size="small"
                  slotProps={{
                    input: {
                      inputProps: {
                        maxLength: 10
                      }
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  label={tl('Email')}
                  type="email"
                  value={form.email ?? ''}
                  onChange={handleFormChange('email')}
                  error={!!errors.email}
                  helperText={errors.email}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth required error={!!errors.emp_type_id}>
                  <ChosenSelect
                    required
                    label={tl('Employee Type')}
                    value={form.emp_type_id ?? ''}
                    placeholder={tl('Employee Type')}
                    options={options.emp_types.map((item: any) => ({ value: item.id, label: item.emp_type }))}
                    onChange={handleFormChange('emp_type_id')}
                    error={!!errors.emp_type_id}
                    helperText={errors.emp_type_id}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth required error={!!errors.department_id}>
                  <ChosenSelect
                    required
                    label={tl('Department')}
                    value={form.department_id ?? ''}
                    placeholder={tl('Department')}
                    options={options.departments.map((item: any) => ({ value: item.id, label: item.department }))}
                    onChange={handleFormChange('department_id')}
                    error={!!errors.department_id}
                    helperText={errors.department_id}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth required error={!!errors.designation_id}>
                  <ChosenSelect
                    required
                    label={tl('Designation')}
                    value={form.designation_id ?? ''}
                    placeholder={tl('Designation')}
                    options={options.designations.map((item: any) => ({ value: item.id, label: item.designation }))}
                    onChange={handleFormChange('designation_id')}
                    error={!!errors.designation_id}
                    helperText={errors.designation_id}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth required error={!!errors.pay_level_id}>
                  <ChosenSelect
                    required
                    label={tl('Pay Level')}
                    value={form.pay_level_id ?? ''}
                    placeholder={tl('Pay Level')}
                    options={options.pay_levels.map((item: any) => ({ value: item.id, label: `${item.level} - (${item.min_amount_pay} - ${item.max_amount_pay})` }))}
                    onChange={handleFormChange('pay_level_id')}
                    error={!!errors.pay_level_id}
                    helperText={errors.pay_level_id}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  label={tl('Basic Pay')}
                  value={form.basic_pay ?? ''}
                  onChange={handleFormChange('basic_pay')}
                  onBlur={handleBasicPayBlur}
                  error={!!errors.basic_pay}
                  helperText={errors.basic_pay}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth required error={!!errors.country_id}>
                  <ChosenSelect
                    required
                    label={tl('Country')}
                    value={form.country_id ?? ''}
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
                    value={form.state_id ?? ''}
                    placeholder={t('field.state')}
                    options={formStateOptions.map((state: any) => ({ value: state.id, label: state.name }))}
                    onChange={handleFormChange('state_id')}
                    error={!!errors.state_id}
                    helperText={errors.state_id}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth required error={!!errors.district_id}>
                  <ChosenSelect
                    required
                    label={tl('District')}
                    value={form.district_id ?? ''}
                    placeholder={t('field.district')}
                    options={formDistrictOptions.map((district: any) => ({ value: district.id, label: district.name }))}
                    onChange={handleFormChange('district_id')}
                    error={!!errors.district_id}
                    helperText={errors.district_id}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl component="fieldset" fullWidth required error={!!errors.city_type}>
                  <FormLabel component="legend" required sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                    {tl('City Type')}
                  </FormLabel>
                  <RadioGroup
                    row
                    value={form.city_type || 'urban'}
                    onChange={handleFormChange('city_type')}
                    sx={errors.city_type ? { 
                      border: '1px solid #d32f2f', 
                      borderRadius: '8px', 
                      p: '4px 12px',
                      backgroundColor: 'rgba(211, 47, 47, 0.02)'
                    } : {}}
                  >
                    <FormControlLabel value="urban" control={<Radio size="small" />} label="Urban" />
                    <FormControlLabel value="rural" control={<Radio size="small" />} label="Rural" />
                  </RadioGroup>
                  {errors.city_type && <FormHelperText>{errors.city_type}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth required error={!!errors.city_id}>
                  <ChosenSelect
                    required
                    label={tl('City')}
                    value={form.city_id ?? ''}
                    placeholder={t('field.city')}
                    options={formCityOptions.map((city: any) => ({ value: city.id, label: city.city_name }))}
                    onChange={handleFormChange('city_id')}
                    error={!!errors.city_id}
                    helperText={errors.city_id}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth error={!!errors.ofc_id}>
                  <ChosenSelect
                    label={tl('Office')}
                    value={form.ofc_id ?? ''}
                    placeholder={tl('Office')}
                    options={formOfficeOptions.map((office: any) => ({ value: office.ofc_id, label: office.office_name }))}
                    onChange={handleFormChange('ofc_id')}
                    error={!!errors.ofc_id}
                    helperText={errors.ofc_id}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl component="fieldset" fullWidth required error={!!errors.any_disability}>
                  <FormLabel component="legend" required sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                    {tl('Any Disability')}
                  </FormLabel>
                  <RadioGroup
                    row
                    value={form.any_disability !== undefined && form.any_disability !== null ? String(form.any_disability) : '0'}
                    onChange={handleFormChange('any_disability')}
                    sx={errors.any_disability ? { 
                      border: '1px solid #d32f2f', 
                      borderRadius: '8px', 
                      p: '4px 12px',
                      backgroundColor: 'rgba(211, 47, 47, 0.02)'
                    } : {}}
                  >
                    <FormControlLabel value="0" control={<Radio size="small" />} label="No" />
                    <FormControlLabel value="1" control={<Radio size="small" />} label="Yes" />
                  </RadioGroup>
                  {errors.any_disability && <FormHelperText>{errors.any_disability}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <ChosenSelect
                    label={t('common.status')}
                    value={form.status ?? 1}
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
                <FormControl fullWidth error={!!errors.remark}>
                  <FormLabel component="legend" sx={{ fontSize: '0.75rem', mb: 0.5, color: errors.remark ? 'error.main' : 'text.secondary' }}>
                    {tl('Remark')}
                  </FormLabel>
                  <textarea
                    placeholder={tl('Remark')}
                    value={form.remark ?? ''}
                    onChange={handleFormChange('remark')}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8.5px 14px',
                      borderRadius: '8px',
                      border: errors.remark ? '1px solid #d32f2f' : '1px solid rgba(0, 0, 0, 0.23)',
                      fontFamily: 'inherit',
                      fontSize: '0.875rem',
                      outline: 'none',
                      resize: 'vertical',
                      backgroundColor: 'transparent'
                    }}
                    onFocus={(e: any) => {
                      e.target.style.borderColor = errors.remark ? '#d32f2f' : '#1976d2';
                      e.target.style.borderWidth = '2px';
                      e.target.style.padding = '7.5px 13px';
                    }}
                    onBlur={(e: any) => {
                      e.target.style.borderColor = errors.remark ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)';
                      e.target.style.borderWidth = '1px';
                      e.target.style.padding = '8.5px 14px';
                    }}
                  />
                  {errors.remark && <FormHelperText>{errors.remark}</FormHelperText>}
                </FormControl>
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

      <Dialog open={importModalOpen} onClose={() => setImportModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle component="div" sx={{ pb: 1 }}>
          <Typography variant="h3" component="h2">
            Import Employees
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Upload a CSV file with the template columns. Existing duplicate values will be rejected row-wise.
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack sx={{ gap: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1 }}>
              <Button variant="outlined" startIcon={<InsertDriveFileOutlined />} onClick={handleDownloadTemplate} sx={{ borderRadius: 2, textTransform: 'none' }}>
                Download Template
              </Button>
              <Button component="label" variant="contained" startIcon={<UploadFileOutlined />} sx={{ borderRadius: 2, textTransform: 'none' }}>
                {importFile?.name || 'Choose CSV'}
                <input hidden type="file" accept=".csv,text/csv" onChange={handleImportFileChange} />
              </Button>
            </Stack>
            {importErrors.length > 0 && (
              <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'warning.light', borderRadius: 1.5, bgcolor: 'warning.lighter', maxHeight: 220, overflow: 'auto' }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Rows needing correction
                </Typography>
                <Stack sx={{ gap: 0.75 }}>
                  {importErrors.slice(0, 8).map((item, index) => (
                    <Typography key={`${item.line}-${index}`} variant="caption" color="text.secondary">
                      Line {item.line}: {(item.errors || []).join(', ')}
                    </Typography>
                  ))}
                  {importErrors.length > 8 && (
                    <Typography variant="caption" color="text.secondary">
                      +{importErrors.length - 8} more rows.
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button variant="outlined" color="inherit" onClick={() => setImportModalOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" startIcon={<UploadFileOutlined />} onClick={handleImportSubmit} disabled={importing || !importFile}>
            {importing ? 'Importing...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteRow)} onClose={() => setDeleteRow(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t('common.delete')} Employee</DialogTitle>
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
