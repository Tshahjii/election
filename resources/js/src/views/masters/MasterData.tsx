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
const MAX_DOB = '2000-05-18';

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
      { key: 'name', label: 'Name' }
    ],
    fields: [
      { key: 'name', label: 'Country Name', required: true }
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
    columns: [
      { key: 'office_code', label: 'Code' },
      { key: 'office_name', label: 'Name' },
      { key: 'department_name', label: 'Department' },
      { key: 'office_type_label', label: 'Type' },
      { key: 'district_name', label: 'District' },
      { key: 'state_name', label: 'State' }
    ],
    fields: [
      { key: 'office_code', label: 'Office Code' },
      { key: 'office_name', label: 'Office Name', required: true },
      { key: 'department_id', label: 'Department', type: 'department', required: true },
      { key: 'office_type', label: 'Office Type', type: 'office_type' },
      { key: 'ofc_parent_id', label: 'Parent Office', type: 'office_parent' },
      { key: 'country_id', label: 'Country', type: 'country', required: true },
      { key: 'state_id', label: 'State', type: 'state', required: true },
      { key: 'district_id', label: 'District', type: 'district', required: true }
    ]
  },
  {
    key: 'np-cities',
    module: 'masters.cities',
    label: 'Nagar Panchayat Cities',
    title: 'Nagar Panchayat City',
    primaryKey: 'id',
    columns: [
      { key: 'city_name', label: 'City Name' },
      { key: 'karyalay_name', label: 'Karyalay Name' },
      { key: 'district_name', label: 'District' },
      { key: 'state_name', label: 'State' }
    ],
    fields: [
      { key: 'state_id', label: 'State', type: 'state', required: true },
      { key: 'district_id', label: 'District', type: 'district', required: true },
      { key: 'city_name', label: 'City Name', required: true },
      { key: 'karyalay_name', label: 'Karyalay Name', required: true }
    ]
  },
  {
    key: 'np-wards',
    module: 'masters.wards',
    label: 'Nagar Panchayat Wards',
    title: 'Nagar Panchayat Ward',
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
    key: 'np-polling-stations',
    module: 'masters.polling_stations',
    label: 'Nagar Panchayat Polling Stations',
    title: 'Nagar Panchayat Polling Station',
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
  },
  {
    key: 'rp-cities',
    module: 'masters.cities',
    label: 'Nagri Nikay Cities',
    title: 'Nagri Nikay City',
    primaryKey: 'id',
    columns: [
      { key: 'city_name', label: 'City Name' },
      { key: 'karyalay_name', label: 'Karyalay Name' },
      { key: 'district_name', label: 'District' },
      { key: 'state_name', label: 'State' }
    ],
    fields: [
      { key: 'state_id', label: 'State', type: 'state', required: true },
      { key: 'district_id', label: 'District', type: 'district', required: true },
      { key: 'city_name', label: 'City Name', required: true },
      { key: 'karyalay_name', label: 'Karyalay Name', required: true }
    ]
  },
  {
    key: 'rp-wards',
    module: 'masters.wards',
    label: 'Nagri Nikay Wards',
    title: 'Nagri Nikay Ward',
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
    key: 'rp-polling-stations',
    module: 'masters.polling_stations',
    label: 'Nagri Nikay Polling Stations',
    title: 'Nagri Nikay Polling Station',
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
  },
  {
    key: 'emp-types',
    module: 'hrms.emp_types',
    label: 'Employee Types',
    labelKey: 'masters.employeeTypes',
    title: 'Employee Type',
    titleKey: 'masters.employeeType',
    primaryKey: 'id',
    columns: [{ key: 'emp_type', label: 'Employee Type' }],
    fields: [{ key: 'emp_type', label: 'Employee Type', required: true }]
  },
  {
    key: 'designations',
    module: 'hrms.designations',
    label: 'Designations',
    labelKey: 'masters.designations',
    title: 'Designation',
    titleKey: 'masters.designation',
    primaryKey: 'id',
    columns: [{ key: 'designation', label: 'Designation' }],
    fields: [{ key: 'designation', label: 'Designation', required: true }]
  },
  {
    key: 'departments',
    module: 'hrms.departments',
    label: 'Departments',
    labelKey: 'masters.departments',
    title: 'Department',
    titleKey: 'masters.department',
    primaryKey: 'id',
    columns: [{ key: 'department', label: 'Department' }],
    fields: [{ key: 'department', label: 'Department', required: true }]
  },
  {
    key: 'pay-levels',
    module: 'hrms.pay_levels',
    label: 'Pay Levels',
    labelKey: 'masters.payLevels',
    title: 'Pay Level',
    titleKey: 'masters.payLevel',
    primaryKey: 'id',
    columns: [
      { key: 'level', label: 'Level' },
      { key: 'min_amount_pay', label: 'Min Amount Pay' },
      { key: 'max_amount_pay', label: 'Max Amount Pay' },
      { key: 'grade_pay', label: 'Grade Pay' }
    ],
    fields: [
      { key: 'level', label: 'Level', required: true },
      { key: 'min_amount_pay', label: 'Min Amount Pay', type: 'number', required: true },
      { key: 'max_amount_pay', label: 'Max Amount Pay', type: 'number', required: true },
      { key: 'grade_pay', label: 'Grade Pay', required: true }
    ]
  },
  {
    key: 'employees',
    module: 'hrms.employees',
    label: 'Employees',
    labelKey: 'masters.employees',
    title: 'Employee',
    titleKey: 'masters.employee',
    primaryKey: 'id',
    columns: [
      { key: 'emp_code', label: 'NIC Code' },
      { key: 'gov_emp_code', label: 'Govt. Employee Code' },
      { key: 'name', label: 'Name' },
      { key: 'mobile', label: 'Mobile' },
      { key: 'emp_type_name', label: 'Employee Type' },
      { key: 'department_name', label: 'Department' },
      { key: 'designation_name', label: 'Designation' },
      { key: 'pay_level_name', label: 'Pay Level' },
      { key: 'office_name', label: 'Office' }
    ],
    fields: [
      { key: 'gov_emp_code', label: 'Govt. Employee Code' },
      { key: 'title', label: 'Title', type: 'select', required: true, options: [
        { value: 'श्री', label: 'श्री' },
        { value: 'श्रीमान', label: 'श्रीमान' },
        { value: 'श्रीमती', label: 'श्रीमती' },
        { value: 'सुश्री', label: 'सुश्री' },
        { value: 'कुमारी', label: 'कुमारी' },
        { value: 'डॉ', label: 'डॉ' }
      ] },
      { key: 'name', label: 'Name', required: true },
      { key: 'gender', label: 'Gender', type: 'gender', required: true },
      { key: 'dob', label: 'Date of Birth', type: 'date', required: true },
      { key: 'mobile', label: 'Mobile', required: true, maxLength: 10 },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'emp_type_id', label: 'Employee Type', type: 'emp_type', required: true },
      { key: 'department_id', label: 'Department', type: 'department', required: true },
      { key: 'designation_id', label: 'Designation', type: 'designation', required: true },
      { key: 'pay_level_id', label: 'Pay Level', type: 'pay_level', required: true },
      { key: 'basic_pay', label: 'Basic Pay', required: true },
      { key: 'country_id', label: 'Country', type: 'country', required: true },
      { key: 'state_id', label: 'State', type: 'state', required: true },
      { key: 'district_id', label: 'District', type: 'district', required: true },
      { key: 'city_type', label: 'City Type', type: 'city_type', required: true },
      { key: 'city_id', label: 'City', type: 'city', required: true },
      { key: 'ofc_id', label: 'Office', type: 'office' },
      { key: 'any_disability', label: 'Any Disability', type: 'boolean', required: true },
      { key: 'remark', label: 'Remark', multiline: true }
    ]
  }
];

export { MASTER_TYPES };

const defaultForm: Record<string, any> = {
  status: 1,
  office_type: 1,
  ofc_parent_id: 0,
  gender: 1,
  city_type: 'urban',
  any_disability: 0
};

const USER_DEFAULT_SKIP_MASTERS = ['countries', 'states', 'districts', 'departments'];

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function getUserLocationDefaults(user) {
  return {
    country_id: firstValue(user?.country_id, user?.country_info?.id, user?.office_info?.country_id),
    state_id: firstValue(user?.state_id, user?.state_info?.id, user?.office_info?.state_id),
    district_id: firstValue(user?.district_id, user?.district_info?.id, user?.office_info?.district_id)
  };
}

function getCreateFormDefaults(masterKey, user, options) {
  const next: Record<string, any> = { ...defaultForm };

  if (!USER_DEFAULT_SKIP_MASTERS.includes(masterKey)) {
    const location = getUserLocationDefaults(user);
    if (location.country_id) next.country_id = Number(location.country_id);
    if (location.state_id) next.state_id = Number(location.state_id);
    if (location.district_id) next.district_id = Number(location.district_id);
  }

  const userDepartment = firstValue(user?.department, user?.office_info?.company_name);
  if (userDepartment) {
    if (masterKey === 'employees' || masterKey === 'offices') {
      const department = options.departments.find(
        (item) =>
          Number(item.id) === Number(userDepartment) ||
          String(item.department).toLowerCase() === String(userDepartment).toLowerCase()
      );
      if (department) next.department_id = department.id;
    }
  }

  if (masterKey === 'employees') {
    const userOfcId = firstValue(user?.ofc_id, user?.office_info?.ofc_id);
    if (userOfcId) {
      next.ofc_id = Number(userOfcId);
    }
  }

  return next;
}

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
  const { user } = useSelector((state) => state.auth);
  const [rows, setRows] = useState<any[]>([]);
  const [options, setOptions] = useState<{
    countries: any[];
    states: any[];
    districts: any[];
    cities: any[];
    wards: any[];
    np_cities: any[];
    rp_cities: any[];
    np_wards: any[];
    rp_wards: any[];
    offices: any[];
    emp_types: any[];
    designations: any[];
    departments: any[];
    pay_levels: any[];
  }>({
    countries: [],
    states: [],
    districts: [],
    cities: [],
    wards: [],
    np_cities: [],
    rp_cities: [],
    np_wards: [],
    rp_wards: [],
    offices: [],
    emp_types: [],
    designations: [],
    departments: [],
    pay_levels: []
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '', country_id: '', state_id: '', district_id: '', city_id: '', ward_id: '' });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [modal, setModal] = useState({ open: false, mode: 'create', row: null });
  const [deleteRow, setDeleteRow] = useState(null);
  const [form, setForm] = useState<Record<string, any>>(defaultForm);
  const [attachment, setAttachment] = useState(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const master = MASTER_TYPES.find((item) => item.key === masterKey) || MASTER_TYPES[0];
  const tableColumnCount = master.columns.length + (master.supportsAttachment ? 4 : 3);
  const canCreate = hasPermission(user, `${master.module}.create`);
  const canEdit = hasPermission(user, `${master.module}.edit`);
  const canDelete = hasPermission(user, `${master.module}.delete`);
  const createFormDefaults = useMemo(() => getCreateFormDefaults(master.key, user, options), [master.key, options, user]);

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
    
    let citiesList = options.cities || [];
    if (master.key === 'np-wards' || master.key === 'np-polling-stations') {
      citiesList = options.np_cities || [];
    } else if (master.key === 'rp-wards' || master.key === 'rp-polling-stations') {
      citiesList = options.rp_cities || [];
    } else if (master.key === 'employees') {
      citiesList = form.city_type === 'urban' ? options.np_cities : options.rp_cities;
    }
    
    return (citiesList || []).filter((city) => Number(city.district_id) === Number(form.district_id));
  }, [form.district_id, form.city_type, options.cities, options.np_cities, options.rp_cities, master.key]);

  const filteredWardOptions = useMemo(() => {
    if (!form.city_id) return [];
    
    let wardsList = options.wards || [];
    if (master.key === 'np-polling-stations') {
      wardsList = options.np_wards || [];
    } else if (master.key === 'rp-polling-stations') {
      wardsList = options.rp_wards || [];
    }
    
    return (wardsList || []).filter((ward) => Number(ward.city_id) === Number(form.city_id));
  }, [form.city_id, options.wards, options.np_wards, options.rp_wards, master.key]);

  const filteredOfficeOptions = useMemo(() => {
    if (!form.district_id) return options.offices;
    return options.offices.filter((office) => Number(office.district_id) === Number(form.district_id));
  }, [form.district_id, options.offices]);

  const filterDistrictOptions = useMemo(() => {
    if (!filters.state_id) return options.districts;
    return options.districts.filter((district) => Number(district.state_id) === Number(filters.state_id));
  }, [filters.state_id, options.districts]);
  const filterStateOptions = useMemo(() => {
    if (!filters.country_id) return options.states;
    return options.states.filter((state) => Number(state.country_id) === Number(filters.country_id));
  }, [filters.country_id, options.states]);
  
  const filterCityOptions = useMemo(() => {
    let citiesList = options.cities || [];
    if (master.key.startsWith('np-')) {
      citiesList = options.np_cities || [];
    } else if (master.key.startsWith('rp-')) {
      citiesList = options.rp_cities || [];
    }
    if (!filters.district_id) return citiesList;
    return (citiesList || []).filter((city) => Number(city.district_id) === Number(filters.district_id));
  }, [filters.district_id, options.cities, options.np_cities, options.rp_cities, master.key]);
  
  const filterWardOptions = useMemo(() => {
    let wardsList = options.wards || [];
    if (master.key.startsWith('np-')) {
      wardsList = options.np_wards || [];
    } else if (master.key.startsWith('rp-')) {
      wardsList = options.rp_wards || [];
    }
    if (!filters.city_id) return wardsList;
    return (wardsList || []).filter((ward) => Number(ward.city_id) === Number(filters.city_id));
  }, [filters.city_id, options.wards, options.np_wards, options.rp_wards, master.key]);

  const decoratedRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        country_name: row.country_name || countriesById.get(Number(row.country_id)) || '-',
        state_name: row.state_name || statesById.get(Number(row.state_id)) || '-',
        city_type_label: row.city_type ? row.city_type.charAt(0).toUpperCase() + row.city_type.slice(1) : '-',
        office_type_label: Number(row.office_type) === 2 ? t('data.branchOffice') : t('data.headOffice')
      })),
    [countriesById, rows, statesById]
  );

  const fetchOptions = async () => {
    const response = await apiClient.get('/masters/options');
    const sortedCountries = (response.data.countries || []).slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    setOptions({ ...response.data, countries: sortedCountries });
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
      let rowsData = response.data.data || [];

      if (master.key === 'departments' || master.key === 'designations' || master.key === 'emp-types') {
        rowsData = rowsData.slice().sort((a, b) => Number(b.id) - Number(a.id));
      }
      if (master.key === 'countries') {
        rowsData = rowsData.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      }
      setRows(rowsData);
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
    setFilters({ search: '', status: '', country_id: '', state_id: '', district_id: '', city_id: '', ward_id: '' });
    setPage(1);
    setRows([]);
    setTotalRows(0);
  }, [master.key]);

  const handleSearchFilterChange = (event) => {
    const value = event.target.value;
    setFilters((current) => ({ ...current, search: value }));
    setPage(1);
  };

  const handleOpenCreate = () => {
    setForm(createFormDefaults);
    setAttachment(null);
    setErrors({});
    setModal({ open: true, mode: 'create', row: null });
  };

  const handleOpenEdit = (row) => {
    setForm({
      ...defaultForm,
      ...row,
      status: Number(row.status)
    });
    setAttachment(null);
    setErrors({});
    setModal({ open: true, mode: 'edit', row });
  };

  const handleCloseModal = () => {
    setModal({ open: false, mode: 'create', row: null });
    setAttachment(null);
    setErrors({});
  };

  const handleFormChange = (field) => (event) => {
    const value = event.target.value;
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
        next.ofc_id = '';
      }
      if (field === 'district_id') {
        next.city_id = '';
        next.ward_id = '';
        next.ofc_id = '';
      }
      if (field === 'city_id') {
        next.ward_id = '';
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Client-side validation
    const clientErrors: Record<string, string> = {};
    master.fields.forEach((field) => {
      if (field.required) {
        const value = form[field.key];
        if (value === undefined || value === null || String(value).trim() === '') {
          clientErrors[field.key] = `${tl(field.label)} is required.`;
        }
      }
    });

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      dispatch(showNotification({ message: 'Please correct the validation errors in the form.', severity: 'error' }));
      setTimeout(() => {
        const firstErrorInput = document.querySelector('.Mui-error input, [aria-invalid="true"], .Mui-error input[type="radio"]') as HTMLElement;
        if (firstErrorInput) {
          firstErrorInput.focus();
        }
      }, 100);
      return;
    }

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
        dispatch(fetchAuthUser()).catch(() => { });
      }
    } catch (error: any) {
      if (error.response?.status === 422) {
        const responseErrors = error.response.data.errors || {};
        const formattedErrors: Record<string, string> = {};
        Object.keys(responseErrors).forEach((key) => {
          formattedErrors[key] = Array.isArray(responseErrors[key]) ? responseErrors[key][0] : String(responseErrors[key]);
        });
        setErrors(formattedErrors);
        dispatch(showNotification({ message: 'Validation failed. Please check the marked fields.', severity: 'error' }));
        setTimeout(() => {
          const firstErrorInput = document.querySelector('.Mui-error input, [aria-invalid="true"], .Mui-error input[type="radio"]') as HTMLElement;
          if (firstErrorInput) {
            firstErrorInput.focus();
          }
        }, 100);
      } else {
        dispatch(showNotification({ message: getApiError(error), severity: 'error' }));
      }
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
    const label = tl(field.label);
    const hasError = !!errors[field.key];
    const errText = errors[field.key];

    if (field.type === 'country') {
      return (
        <FormControl fullWidth required={field.required} error={hasError}>
          <ChosenSelect
            required={field.required}
            label={label}
            value={form[field.key] || ''}
            placeholder={t('field.country')}
            options={options.countries.map((country) => ({ value: country.id, label: country.name }))}
            onChange={handleFormChange(field.key)}
            error={hasError}
            helperText={errText}
          />
        </FormControl>
      );
    }

    if (field.type === 'state') {
      return (
        <FormControl fullWidth required={field.required} error={hasError}>
          <ChosenSelect
            required={field.required}
            label={label}
            value={form[field.key] || ''}
            placeholder={t('field.state')}
            options={filteredStateOptions.map((state) => ({ value: state.id, label: state.name }))}
            onChange={handleFormChange(field.key)}
            error={hasError}
            helperText={errText}
          />
        </FormControl>
      );
    }

    if (field.type === 'district') {
      return (
        <FormControl fullWidth required={field.required} error={hasError}>
          <ChosenSelect
            required={field.required}
            label={label}
            value={form[field.key] || ''}
            placeholder={t('field.district')}
            options={filteredDistrictOptions.map((district) => ({ value: district.id, label: district.name }))}
            onChange={handleFormChange(field.key)}
            error={hasError}
            helperText={errText}
          />
        </FormControl>
      );
    }

    if (field.type === 'city') {
      return (
        <FormControl fullWidth required={field.required} error={hasError}>
          <ChosenSelect
            required={field.required}
            label={label}
            value={form[field.key] || ''}
            placeholder={t('field.city')}
            options={filteredCityOptions.map((city) => ({ value: city.id, label: city.city_name }))}
            onChange={handleFormChange(field.key)}
            error={hasError}
            helperText={errText}
          />
        </FormControl>
      );
    }

    if (field.type === 'ward') {
      return (
        <FormControl fullWidth required={field.required} error={hasError}>
          <ChosenSelect
            required={field.required}
            label={label}
            value={form[field.key] || ''}
            placeholder={t('field.ward')}
            options={filteredWardOptions.map((ward) => ({ value: ward.id, label: `${ward.ward_no} - ${ward.ward_name}` }))}
            onChange={handleFormChange(field.key)}
            error={hasError}
            helperText={errText}
          />
        </FormControl>
      );
    }

    if (field.type === 'office_type') {
      return (
        <FormControl fullWidth error={hasError}>
          <ChosenSelect
            label={label}
            value={form[field.key] || 1}
            options={[
              { value: 1, label: t('data.headOffice') },
              { value: 2, label: t('data.branchOffice') }
            ]}
            onChange={handleFormChange(field.key)}
            error={hasError}
            helperText={errText}
          />
        </FormControl>
      );
    }

    if (field.type === 'office_parent') {
      // Determine accessible offices based on user role
      const isSuperAdmin = Number(user?.role) === 1 || Number(user?.role) === 2 || user?.access?.is_super_admin;
      const accessibleOffices = isSuperAdmin ? options.offices : options.offices.filter((office) => Number(office.ofc_id) === Number(user?.ofc_id));
      return (
        <FormControl fullWidth required={field.required} error={hasError}>
          <ChosenSelect
            required={field.required}
            label={label}
            value={form[field.key] || ''}
            placeholder={tl(field.label)}
            options={accessibleOffices.map((office) => ({ value: office.ofc_id, label: office.office_name }))}
            onChange={handleFormChange(field.key)}
            error={hasError}
            helperText={errText}
          />
        </FormControl>
      );
    }
    if (field.type === 'office') {
      return (
        <FormControl fullWidth required={field.required} error={hasError}>
          <ChosenSelect
            required={field.required}
            label={label}
            value={form[field.key] || ''}
            placeholder={tl(field.label)}
            options={filteredOfficeOptions.map((office) => ({ value: office.ofc_id, label: office.office_name }))}
            onChange={handleFormChange(field.key)}
            error={hasError}
            helperText={errText}
          />
        </FormControl>
      );
    }

    if (field.type === 'emp_type') {
      return (
        <FormControl fullWidth required={field.required} error={hasError}>
          <ChosenSelect
            required={field.required}
            label={label}
            value={form[field.key] || ''}
            placeholder={tl(field.label)}
            options={options.emp_types.map((item) => ({ value: item.id, label: item.emp_type }))}
            onChange={handleFormChange(field.key)}
            error={hasError}
            helperText={errText}
          />
        </FormControl>
      );
    }

    if (field.type === 'department') {
      return (
        <FormControl fullWidth required={field.required} error={hasError}>
          <ChosenSelect
            required={field.required}
            label={label}
            value={form[field.key] || ''}
            placeholder={tl(field.label)}
            options={options.departments.map((item) => ({ value: item.id, label: item.department }))}
            onChange={handleFormChange(field.key)}
            error={hasError}
            helperText={errText}
          />
        </FormControl>
      );
    }

    if (field.type === 'department_name') {
      return (
        <FormControl fullWidth required={field.required} error={hasError}>
          <ChosenSelect
            required={field.required}
            label={label}
            value={form[field.key] || ''}
            placeholder={tl(field.label)}
            options={options.departments.map((item) => ({ value: item.department, label: item.department }))}
            onChange={handleFormChange(field.key)}
            error={hasError}
            helperText={errText}
          />
        </FormControl>
      );
    }

    if (field.type === 'designation') {
      return (
        <FormControl fullWidth required={field.required} error={hasError}>
          <ChosenSelect
            required={field.required}
            label={label}
            value={form[field.key] || ''}
            placeholder={tl(field.label)}
            options={options.designations.map((item) => ({ value: item.id, label: item.designation }))}
            onChange={handleFormChange(field.key)}
            error={hasError}
            helperText={errText}
          />
        </FormControl>
      );
    }

    if (field.type === 'pay_level') {
      return (
        <FormControl fullWidth required={field.required} error={hasError}>
          <ChosenSelect
            required={field.required}
            label={label}
            value={form[field.key] || ''}
            placeholder={tl(field.label)}
            options={options.pay_levels.map((item) => ({ value: item.id, label: `${item.level} - (${item.min_amount_pay} - ${item.max_amount_pay})` }))}
            onChange={handleFormChange(field.key)}
            error={hasError}
            helperText={errText}
          />
        </FormControl>
      );
    }

    if (field.type === 'gender') {
      return (
        <FormControl component="fieldset" fullWidth error={hasError}>
          <FormLabel component="legend" required={field.required} sx={{ fontSize: '0.75rem', mb: 0.5 }}>
            {label}
          </FormLabel>
          <RadioGroup
            row
            value={form[field.key] !== undefined && form[field.key] !== null ? String(form[field.key]) : '1'}
            onChange={handleFormChange(field.key)}
            sx={hasError ? { 
              border: '1px solid #d32f2f', 
              borderRadius: '8px', 
              p: '4px 12px',
              backgroundColor: 'rgba(211, 47, 47, 0.02)'
            } : {}}
          >
            <FormControlLabel value="1" control={<Radio size="small" />} label="Male" />
            <FormControlLabel value="2" control={<Radio size="small" />} label="Female" />
          </RadioGroup>
          {hasError && <FormHelperText>{errText}</FormHelperText>}
        </FormControl>
      );
    }

    if (field.type === 'city_type') {
      return (
        <FormControl component="fieldset" fullWidth error={hasError}>
          <FormLabel component="legend" required={field.required} sx={{ fontSize: '0.75rem', mb: 0.5 }}>
            {label}
          </FormLabel>
          <RadioGroup
            row
            value={form[field.key] || 'urban'}
            onChange={handleFormChange(field.key)}
            sx={hasError ? { 
              border: '1px solid #d32f2f', 
              borderRadius: '8px', 
              p: '4px 12px',
              backgroundColor: 'rgba(211, 47, 47, 0.02)'
            } : {}}
          >
            <FormControlLabel value="urban" control={<Radio size="small" />} label="Urban" />
            <FormControlLabel value="rural" control={<Radio size="small" />} label="Rural" />
          </RadioGroup>
          {hasError && <FormHelperText>{errText}</FormHelperText>}
        </FormControl>
      );
    }

    if (field.type === 'select') {
      return (
        <FormControl component="fieldset" fullWidth error={hasError}>
          <FormLabel component="legend" required={field.required} sx={{ fontSize: '0.75rem', mb: 0.5 }}>
            {label}
          </FormLabel>
          <RadioGroup
            row
            value={form[field.key] || ''}
            onChange={handleFormChange(field.key)}
            sx={hasError ? { 
              border: '1px solid #d32f2f', 
              borderRadius: '8px', 
              p: '4px 12px',
              backgroundColor: 'rgba(211, 47, 47, 0.02)'
            } : {}}
          >
            {(field.options || []).map((option) => (
              <FormControlLabel key={option.value} value={option.value} control={<Radio size="small" />} label={option.label} />
            ))}
          </RadioGroup>
          {hasError && <FormHelperText>{errText}</FormHelperText>}
        </FormControl>
      );
    }

    if (field.type === 'boolean') {
      return (
        <FormControl component="fieldset" fullWidth error={hasError}>
          <FormLabel component="legend" required={field.required} sx={{ fontSize: '0.75rem', mb: 0.5 }}>
            {label}
          </FormLabel>
          <RadioGroup
            row
            value={form[field.key] !== undefined && form[field.key] !== null ? String(form[field.key]) : '0'}
            onChange={handleFormChange(field.key)}
            sx={hasError ? { 
              border: '1px solid #d32f2f', 
              borderRadius: '8px', 
              p: '4px 12px',
              backgroundColor: 'rgba(211, 47, 47, 0.02)'
            } : {}}
          >
            <FormControlLabel value="0" control={<Radio size="small" />} label="No" />
            <FormControlLabel value="1" control={<Radio size="small" />} label="Yes" />
          </RadioGroup>
          {hasError && <FormHelperText>{errText}</FormHelperText>}
        </FormControl>
      );
    }

    if (field.key === 'remark') {
      return (
        <FormControl fullWidth error={hasError}>
          <FormLabel component="legend" required={field.required} sx={{ fontSize: '0.75rem', mb: 0.5, color: hasError ? 'error.main' : 'text.secondary' }}>
            {label}
          </FormLabel>
          <textarea
            required={field.required}
            placeholder={tl(field.placeholder || field.label)}
            value={form[field.key] ?? ''}
            onChange={handleFormChange(field.key)}
            rows={3}
            style={{
              width: '100%',
              padding: '8.5px 14px',
              borderRadius: '8px',
              border: hasError ? '1px solid #d32f2f' : '1px solid rgba(0, 0, 0, 0.23)',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              outline: 'none',
              resize: 'vertical',
              backgroundColor: 'transparent'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = hasError ? '#d32f2f' : '#1976d2';
              e.target.style.borderWidth = '2px';
              e.target.style.padding = '7.5px 13px';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = hasError ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)';
              e.target.style.borderWidth = '1px';
              e.target.style.padding = '8.5px 14px';
            }}
          />
          {hasError && <FormHelperText>{errText}</FormHelperText>}
        </FormControl>
      );
    }

    return (
      <TextField
        fullWidth
        required={field.required}
        label={tl(field.label)}
        type={field.type || 'text'}
        multiline={field.multiline}
        minRows={field.multiline ? 3 : undefined}
        value={form[field.key] ?? ''}
        onChange={handleFormChange(field.key)}
        onKeyDown={field.key === 'dob' ? (event) => event.preventDefault() : undefined}
        onPaste={field.key === 'dob' ? (event) => event.preventDefault() : undefined}
        error={hasError}
        helperText={errText}
        size="small"
        slotProps={{
          inputLabel: { shrink: field.type === 'date' ? true : undefined },
          input: {
            inputProps: {
              max: field.key === 'dob' ? MAX_DOB : undefined,
              maxLength: field.maxLength
            }
          }
        }}
      />
    );
  };

  const renderSafeField = (key: string) => {
    const field = master.fields.find((f) => f.key === key);
    return field ? renderField(field) : null;
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
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label={`${t('common.search')} ${t(master.labelKey || '') || master.label}`}
              value={filters.search}
              onChange={handleSearchFilterChange}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
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
          {master.fields.some((field) => field.type === 'state') && (
            master.fields.some((field) => field.type === 'country') && (
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <ChosenSelect
                    label={t('field.country')}
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
                  label={t('common.allStates')}
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
                  label={t('common.allDistricts')}
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
                  label={t('common.allCities')}
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
                  label={t('common.allWards')}
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
                label={t('common.rows') || 'Rows'}
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

      <Dialog open={modal.open} onClose={handleCloseModal} fullWidth maxWidth={masterKey === 'employees' ? 'lg' : 'md'}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogTitle component="div" sx={{ pb: 1 }}>
            <Typography variant="h3" component="h2">
              {modal.mode === 'edit' ? t('common.update') : t('common.create')} {t(master.titleKey || '') || master.title}
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ pt: 0.5 }}>
              {master.fields.map((field) => (
                <Grid key={field.key} size={{ xs: 12, sm: 4 }}>
                  {renderField(field)}
                </Grid>
              ))}
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
              {master.supportsAttachment && <Grid size={{ xs: 12, sm: 4 }}>
                <Button component="label" fullWidth variant="outlined" size="small" startIcon={<FileUploadOutlined />} sx={{ minHeight: 40, justifyContent: 'flex-start' }}>
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
