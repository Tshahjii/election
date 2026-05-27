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
import ChosenSelect from 'components/ChosenSelect';
import PaginationFooter from 'components/PaginationFooter';
import { useAppPreferences } from 'contexts/AppPreferences';
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
    labelKey: 'masters.countries',
    title: 'Country',
    titleKey: 'masters.country',
    primaryKey: 'id',
    supportsAttachment: true,
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
    labelKey: 'masters.states',
    title: 'State',
    titleKey: 'masters.state',
    primaryKey: 'id',
    supportsAttachment: true,
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
    labelKey: 'masters.districts',
    title: 'District',
    titleKey: 'masters.district',
    primaryKey: 'id',
    supportsAttachment: true,
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
    labelKey: 'masters.offices',
    title: 'Office',
    titleKey: 'masters.office',
    primaryKey: 'ofc_id',
    supportsAttachment: true,
    columns: [
      { key: 'office_code', label: 'Code' },
      { key: 'office_name', label: 'Name' },
      { key: 'company_name', label: 'Department' },
      { key: 'office_type_label', label: 'Type' },
      { key: 'district_name', label: 'District' },
      { key: 'state_name', label: 'State' }
    ],
    fields: [
      { key: 'office_code', label: 'Office Code' },
      { key: 'office_name', label: 'Office Name', required: true },
      { key: 'company_name', label: 'Department' },
      { key: 'office_type', label: 'Office Type', type: 'office_type' },
      { key: 'ofc_parent_id', label: 'Parent Office ID', type: 'number' },
      { key: 'country_id', label: 'Country', type: 'country', required: true },
      { key: 'state_id', label: 'State', type: 'state', required: true },
      { key: 'district_id', label: 'District', type: 'district', required: true }
    ]
  },
  {
    key: 'cities',
    module: 'masters.cities',
    label: 'Cities',
    labelKey: 'masters.cities',
    title: 'City',
    titleKey: 'masters.city',
    primaryKey: 'id',
    columns: [
      { key: 'city_name', label: 'City Name' },
      { key: 'district_name', label: 'District' },
      { key: 'state_name', label: 'State' }
    ],
    fields: [
      { key: 'state_id', label: 'State', type: 'state', required: true },
      { key: 'district_id', label: 'District', type: 'district', required: true },
      { key: 'city_name', label: 'City Name', required: true }
    ]
  },
  {
    key: 'wards',
    module: 'masters.wards',
    label: 'Wards',
    labelKey: 'masters.wards',
    title: 'Ward',
    titleKey: 'masters.ward',
    primaryKey: 'id',
    columns: [
      { key: 'ward_no', label: 'Ward No' },
      { key: 'ward_name', label: 'Ward Name' },
      { key: 'city_name_label', label: 'City' },
      { key: 'district_name', label: 'District' },
      { key: 'state_name', label: 'State' }
    ],
    fields: [
      { key: 'state_id', label: 'State', type: 'state', required: true },
      { key: 'district_id', label: 'District', type: 'district', required: true },
      { key: 'city_id', label: 'City', type: 'city', required: true },
      { key: 'ward_no', label: 'Ward No', type: 'number', required: true },
      { key: 'ward_name', label: 'Ward Name', required: true }
    ]
  },
  {
    key: 'polling-stations',
    module: 'masters.polling_stations',
    label: 'Polling Stations',
    labelKey: 'masters.pollingStations',
    title: 'Polling Station',
    titleKey: 'masters.pollingStation',
    primaryKey: 'id',
    columns: [
      { key: 'polling_station_name', label: 'Polling Station Name' },
      { key: 'ward_name_label', label: 'Ward' },
      { key: 'city_name_label', label: 'City' },
      { key: 'district_name', label: 'District' },
      { key: 'state_name', label: 'State' }
    ],
    fields: [
      { key: 'state_id', label: 'State', type: 'state', required: true },
      { key: 'district_id', label: 'District', type: 'district', required: true },
      { key: 'city_id', label: 'City', type: 'city', required: true },
      { key: 'ward_id', label: 'Ward', type: 'ward', required: true },
      { key: 'polling_station_name', label: 'Polling Station Name', required: true }
    ]
  }
];

export { MASTER_TYPES };

const defaultForm: Record<string, any> = {
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
  const { t, tl } = useAppPreferences();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const { user } = useSelector((state) => state.auth);
  const [rows, setRows] = useState<any[]>([]);
  const [options, setOptions] = useState<{ countries: any[]; states: any[]; districts: any[]; cities: any[]; wards: any[] }>({
    countries: [],
    states: [],
    districts: [],
    cities: [],
    wards: []
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: searchQuery, status: '', country_id: '', state_id: '', district_id: '', city_id: '', ward_id: '' });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [modal, setModal] = useState({ open: false, mode: 'create', row: null });
  const [deleteRow, setDeleteRow] = useState(null);
  const [form, setForm] = useState<Record<string, any>>(defaultForm);
  const [attachment, setAttachment] = useState(null);

  const master = MASTER_TYPES.find((item) => item.key === masterKey) || MASTER_TYPES[0];
  const tableColumnCount = master.columns.length + (master.supportsAttachment ? 4 : 3);
  const canCreate = hasPermission(user, `${master.module}.create`);
  const canEdit = hasPermission(user, `${master.module}.edit`);
  const canDelete = hasPermission(user, `${master.module}.delete`);

  const countriesById = useMemo(() => new Map(options.countries.map((country) => [Number(country.id), country.name])), [options.countries]);
  const statesById = useMemo(() => new Map(options.states.map((state) => [Number(state.id), state.name])), [options.states]);
  const filteredStateOptions = useMemo(() => {
    if (!form.country_id) return options.states;
    return options.states.filter((state) => Number(state.country_id) === Number(form.country_id));
  }, [form.country_id, options.states]);
  const filteredDistrictOptions = useMemo(() => {
    if (!form.state_id) return [];
    return options.districts.filter((district) => Number(district.state_id) === Number(form.state_id));
  }, [form.state_id, options.districts]);
  const filteredCityOptions = useMemo(() => {
    if (!form.district_id) return [];
    return options.cities.filter((city) => Number(city.district_id) === Number(form.district_id));
  }, [form.district_id, options.cities]);
  const filteredWardOptions = useMemo(() => {
    if (!form.city_id) return [];
    return options.wards.filter((ward) => Number(ward.city_id) === Number(form.city_id));
  }, [form.city_id, options.wards]);

  const filterDistrictOptions = useMemo(() => {
    if (!filters.state_id) return options.districts;
    return options.districts.filter((district) => Number(district.state_id) === Number(filters.state_id));
  }, [filters.state_id, options.districts]);
  const filterStateOptions = useMemo(() => {
    if (!filters.country_id) return options.states;
    return options.states.filter((state) => Number(state.country_id) === Number(filters.country_id));
  }, [filters.country_id, options.states]);
  const filterCityOptions = useMemo(() => {
    if (!filters.district_id) return options.cities;
    return options.cities.filter((city) => Number(city.district_id) === Number(filters.district_id));
  }, [filters.district_id, options.cities]);
  const filterWardOptions = useMemo(() => {
    if (!filters.city_id) return options.wards;
    return options.wards.filter((ward) => Number(ward.city_id) === Number(filters.city_id));
  }, [filters.city_id, options.wards]);

  const decoratedRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        country_name: row.country_name || countriesById.get(Number(row.country_id)) || '-',
        state_name: row.state_name || statesById.get(Number(row.state_id)) || '-',
        office_type_label: Number(row.office_type) === 2 ? t('data.branchOffice') : t('data.headOffice')
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
          country_id: filters.country_id || undefined,
          state_id: filters.state_id || undefined,
          district_id: filters.district_id || undefined,
          city_id: filters.city_id || undefined,
          ward_id: filters.ward_id || undefined,
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
  }, [master.key, filters.search, filters.status, filters.country_id, filters.state_id, filters.district_id, filters.city_id, filters.ward_id, page, rowsPerPage]);

  useEffect(() => {
    setFilters({ search: searchQuery, status: '', country_id: '', state_id: '', district_id: '', city_id: '', ward_id: '' });
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
      const next: Record<string, any> = { ...current, [field]: value };
      if (field === 'country_id') {
        next.state_id = '';
        next.district_id = '';
        next.city_id = '';
        next.ward_id = '';
      }
      if (field === 'state_id') {
        next.district_id = '';
        next.city_id = '';
        next.ward_id = '';
      }
      if (field === 'district_id') {
        next.city_id = '';
        next.ward_id = '';
      }
      if (field === 'city_id') {
        next.ward_id = '';
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
        formData.append(field.key, value instanceof Blob ? value : String(value));
      }
    });
    formData.append('status', String(form.status ?? 1));

    if (attachment) {
      formData.append('attachment', attachment);
    }

    try {
      const url = modal.mode === 'edit' ? `/masters/${master.key}/${modal.row[master.primaryKey]}` : `/masters/${master.key}`;
      await apiClient.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      dispatch(showNotification({ message: `${t(master.titleKey || '') || master.title} saved successfully.` }));
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
      dispatch(showNotification({ message: `${t(master.titleKey || '') || master.title} deleted successfully.` }));
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
          <ChosenSelect
            required={field.required}
            value={form[field.key] || ''}
            placeholder={t('field.country')}
            options={options.countries.map((country) => ({ value: country.id, label: country.name }))}
            onChange={handleFormChange(field.key)}
          />
        </FormControl>
      );
    }

    if (field.type === 'state') {
      return (
        <FormControl fullWidth required={field.required}>
          <ChosenSelect
            required={field.required}
            value={form[field.key] || ''}
            placeholder={t('field.state')}
            options={filteredStateOptions.map((state) => ({ value: state.id, label: state.name }))}
            onChange={handleFormChange(field.key)}
          />
        </FormControl>
      );
    }

    if (field.type === 'district') {
      return (
        <FormControl fullWidth required={field.required}>
          <ChosenSelect
            required={field.required}
            value={form[field.key] || ''}
            placeholder={t('field.district')}
            options={filteredDistrictOptions.map((district) => ({ value: district.id, label: district.name }))}
            onChange={handleFormChange(field.key)}
          />
        </FormControl>
      );
    }

    if (field.type === 'city') {
      return (
        <FormControl fullWidth required={field.required}>
          <ChosenSelect
            required={field.required}
            value={form[field.key] || ''}
            placeholder={t('field.city')}
            options={filteredCityOptions.map((city) => ({ value: city.id, label: city.city_name }))}
            onChange={handleFormChange(field.key)}
          />
        </FormControl>
      );
    }

    if (field.type === 'ward') {
      return (
        <FormControl fullWidth required={field.required}>
          <ChosenSelect
            required={field.required}
            value={form[field.key] || ''}
            placeholder={t('field.ward')}
            options={filteredWardOptions.map((ward) => ({ value: ward.id, label: `${ward.ward_no} - ${ward.ward_name}` }))}
            onChange={handleFormChange(field.key)}
          />
        </FormControl>
      );
    }

    if (field.type === 'office_type') {
      return (
        <FormControl fullWidth>
          <ChosenSelect
            value={form[field.key] || 1}
            options={[
              { value: 1, label: t('data.headOffice') },
              { value: 2, label: t('data.branchOffice') }
            ]}
            onChange={handleFormChange(field.key)}
          />
        </FormControl>
      );
    }

    return (
      <TextField
        fullWidth
        required={field.required}
        label={tl(field.label)}
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
          <Typography variant="h2">{t('masters.master')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('masters.managePrefix')} {(t(master.labelKey || '') || master.label).toLowerCase()} {t('masters.manageSuffix')}
          </Typography>
        </Box>
        {canCreate && (
          <Button variant="contained" color="primary" startIcon={<AddOutlined />} onClick={handleOpenCreate}>
            {t('common.create')} {t(master.titleKey || '') || master.title}
          </Button>
        )}
      </Stack>

      <MainCard sx={{ borderRadius: 2, boxShadow: '0 10px 30px rgba(16, 60, 92, 0.08)' }} contentSX={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              label={`${t('common.search')} ${t(master.labelKey || '') || master.label}`}
              value={filters.search}
              onChange={handleSearchFilterChange}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <ChosenSelect
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
          {master.fields.some((field) => field.type === 'state') && (
            master.fields.some((field) => field.type === 'country') && (
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <ChosenSelect
                    value={filters.country_id}
                    placeholder={t('field.country')}
                    options={[{ value: '', label: t('field.country') }, ...options.countries.map((country) => ({ value: country.id, label: country.name }))]}
                    onChange={(event) => {
                      setFilters((current) => ({ ...current, country_id: event.target.value, state_id: '', district_id: '', city_id: '', ward_id: '' }));
                      setPage(1);
                    }}
                  />
                </FormControl>
              </Grid>
            )
          )}
          {master.fields.some((field) => field.type === 'state') && (
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <ChosenSelect
                  value={filters.state_id}
                  placeholder={t('common.allStates')}
                  options={[{ value: '', label: t('common.allStates') }, ...filterStateOptions.map((state) => ({ value: state.id, label: state.name }))]}
                  onChange={(event) => {
                    setFilters((current) => ({ ...current, state_id: event.target.value, district_id: '', city_id: '', ward_id: '' }));
                    setPage(1);
                  }}
                />
              </FormControl>
            </Grid>
          )}
          {master.fields.some((field) => field.type === 'district') && (
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <ChosenSelect
                  value={filters.district_id}
                  placeholder={t('common.allDistricts')}
                  options={[{ value: '', label: t('common.allDistricts') }, ...filterDistrictOptions.map((district) => ({ value: district.id, label: district.name }))]}
                  onChange={(event) => {
                    setFilters((current) => ({ ...current, district_id: event.target.value, city_id: '', ward_id: '' }));
                    setPage(1);
                  }}
                />
              </FormControl>
            </Grid>
          )}
          {master.fields.some((field) => field.type === 'city') && (
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <ChosenSelect
                  value={filters.city_id}
                  placeholder={t('common.allCities')}
                  options={[{ value: '', label: t('common.allCities') }, ...filterCityOptions.map((city) => ({ value: city.id, label: city.city_name }))]}
                  onChange={(event) => {
                    setFilters((current) => ({ ...current, city_id: event.target.value, ward_id: '' }));
                    setPage(1);
                  }}
                />
              </FormControl>
            </Grid>
          )}
          {master.fields.some((field) => field.type === 'ward') && (
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <ChosenSelect
                  value={filters.ward_id}
                  placeholder={t('common.allWards')}
                  options={[{ value: '', label: t('common.allWards') }, ...filterWardOptions.map((ward) => ({ value: ward.id, label: `${ward.ward_no} - ${ward.ward_name}` }))]}
                  onChange={(event) => {
                    setFilters((current) => ({ ...current, ward_id: event.target.value }));
                    setPage(1);
                  }}
                />
              </FormControl>
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <ChosenSelect
                value={rowsPerPage}
                options={[10, 25, 50, 100].map((value) => ({ value, label: `${value} ${t('common.rows') || 'rows'}` }))}
                onChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(1); }}
              />
            </FormControl>
          </Grid>
        </Grid>
      </MainCard>

      <MainCard
        title={`${t(master.labelKey || '') || master.label} (${totalRows})`}
        sx={{ borderRadius: 2, boxShadow: '0 10px 30px rgba(16, 60, 92, 0.08)' }}
        headerSX={{ p: 2, '& .MuiCardHeader-title': { fontSize: '1rem' } }}
        contentSX={{ p: 2, '&:last-child': { pb: 2 } }}
      >
        <TableContainer>
          <Table sx={{ minWidth: 960 }}>
            <TableHead>
              <TableRow>
                <TableCell>{t('common.sno')}</TableCell>
                {master.columns.map((column) => (
                  <TableCell key={column.key}>{tl(column.label)}</TableCell>
                ))}
                {master.supportsAttachment && <TableCell>{t('common.attachment')}</TableCell>}
                <TableCell>{t('common.status')}</TableCell>
                <TableCell align="right">{t('common.action')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {decoratedRows.map((row, index) => (
                <TableRow key={`${master.key}-${row[master.primaryKey]}`} hover>
                  <TableCell>{(page - 1) * rowsPerPage + index + 1}</TableCell>
                  {master.columns.map((column) => (
                    <TableCell key={column.key}>{row[column.key] || '-'}</TableCell>
                  ))}
                  {master.supportsAttachment && <TableCell>
                    {row.attachment_url ? (
                      <Button component="a" href={row.attachment_url} target="_blank" rel="noreferrer" size="small" startIcon={<InsertDriveFileOutlined />}>
                        {t('common.view')}
                      </Button>
                    ) : (
                      '-'
                    )}
                  </TableCell>}
                  <TableCell>
                    <Chip label={Number(row.status) === 1 ? t('common.active') : t('common.inactive')} size="small" color={Number(row.status) === 1 ? 'success' : 'error'} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 0.5 }}>
                      {canEdit && (
                        <IconButton size="small" color="success" aria-label={`edit ${t(master.titleKey || '') || master.title}`} onClick={() => handleOpenEdit(row)}>
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton size="small" color="error" aria-label={`delete ${t(master.titleKey || '') || master.title}`} onClick={() => setDeleteRow(row)}>
                          <DeleteOutlineOutlined fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && decoratedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={tableColumnCount} align="center">
                    {t('common.noRecords')}
                  </TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow>
                  <TableCell colSpan={tableColumnCount} align="center">
                    {t('common.loading')}
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
              {modal.mode === 'edit' ? t('common.update') : t('common.create')} {t(master.titleKey || '') || master.title}
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
                  <ChosenSelect
                    value={form.status ?? 1}
                    options={[
                      { value: 1, label: t('common.active') },
                      { value: 0, label: t('common.inactive') }
                    ]}
                    onChange={handleFormChange('status')}
                  />
                </FormControl>
              </Grid>
              {master.supportsAttachment && <Grid size={{ xs: 12, sm: 6 }}>
                <Button component="label" fullWidth variant="outlined" startIcon={<FileUploadOutlined />} sx={{ minHeight: 48, justifyContent: 'flex-start' }}>
                  {attachment?.name || t('common.uploadLogo')}
                  <input hidden type="file" accept={IMAGE_MIME_TYPES.join(',')} onChange={handleAttachmentChange} />
                </Button>
                {modal.row?.attachment_url && !attachment && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                    {t('common.existingFile')}
                  </Typography>
                )}
              </Grid>}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button variant="outlined" color="inherit" onClick={handleCloseModal}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="contained" color="primary" startIcon={<AddOutlined />}>
              {t('common.save')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(deleteRow)} onClose={() => setDeleteRow(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t('common.delete')} {t(master.titleKey || '') || master.title}</DialogTitle>
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
