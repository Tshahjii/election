import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

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
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

// project imports
import MainCard from 'components/cards/MainCard';
import ChosenSelect from 'components/ChosenSelect';
import DownloadMenu from 'components/DownloadMenu';
import PaginationFooter from 'components/PaginationFooter';
import { showNotification } from 'store/slices/notificationSlice';
import { ROLE_LABELS } from 'utils/access';
import { useAppPreferences } from 'contexts/AppPreferences';
import { useDebounce } from '../../hooks/useDebounce';
import {
    useGetAccessOptionsQuery,
    useGetUsersQuery,
    useLazyGetUsersQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useUpdateAccessMutation,
    useResetPasswordMutation,
    useDeleteUserMutation
} from 'store/apiSlice';

// assets
import AddOutlined from '@mui/icons-material/AddOutlined';
import AdminPanelSettingsOutlined from '@mui/icons-material/AdminPanelSettingsOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import LockOpenOutlined from '@mui/icons-material/LockOpenOutlined';
import PhoneIphoneOutlined from '@mui/icons-material/PhoneIphoneOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
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

const initialFilters = { name: '', mobile: '', user_code: '', role: '', status: '' };
const baseForm = {
    user_code: '',
    name: '',
    email: '',
    mobile: '',
    password: 'Admin@123',
    emp_type: 'Permanent',
    department: 'Election Office',
    designation: '',
    ofc_id: '',
    ofc_code: '',
    country_id: '',
    state_id: '',
    district_id: '',
    address: '',
    role: 3,
    is_active: 1
};

const baseAccessForm = {
    country_ids: [],
    state_ids: [],
    district_ids: [],
    office_ids: [],
    permissions: {}
};

function firstValue(...values) {
    return values.find((value) => value !== undefined && value !== null && value !== '');
}

function getUserFormDefaults(user) {
    return {
        ...baseForm,
        department: firstValue(user?.department, user?.office_info?.company_name, baseForm.department),
        country_id: firstValue(user?.country_id, user?.country_info?.id, user?.office_info?.country_id, ''),
        state_id: firstValue(user?.state_id, user?.state_info?.id, user?.office_info?.state_id, ''),
        district_id: firstValue(user?.district_id, user?.district_info?.id, user?.office_info?.district_id, '')
    };
}

function AccessDropZone({ title, selected, items, onDropItem, onRemove, t }) {
    return (
        <Box
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
                event.preventDefault();
                const data = JSON.parse(event.dataTransfer.getData('application/json') || '{}');
                onDropItem(data);
            }}
            sx={(theme) => ({ minHeight: 116, p: 1.25, border: '1px dashed', borderColor: 'primary.main', borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.05) })}
        >
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                {title}
            </Typography>
            <Stack direction="row" sx={{ gap: 0.75, flexWrap: 'wrap' }}>
                {selected.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                        {t('access.dragHere')}
                    </Typography>
                )}
                {selected.map((id) => {
                    const item = items.find((option) => Number(option.id) === Number(id));
                    return <Chip key={id} label={item?.name || id} onDelete={() => onRemove(id)} size="small" sx={{ bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 1.5 }} />;
                })}
            </Stack>
        </Box>
    );
}

function DraggableList({ title, items, type, t }) {
    return (
        <Box sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, maxHeight: 190, overflow: 'auto' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                {title}
            </Typography>
            <Stack direction="row" sx={{ gap: 0.75, flexWrap: 'wrap' }}>
                {items.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                        {t('access.noRecords')}
                    </Typography>
                )}
                {items.map((item) => (
                    <Chip
                        key={`${type}-${item.id}`}
                        label={item.name}
                        size="small"
                        draggable
                        onDragStart={(event) => event.dataTransfer.setData('application/json', JSON.stringify({ type, id: item.id }))}
                        sx={{ cursor: 'grab', bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1.5 }}
                    />
                ))}
            </Stack>
        </Box>
    );
}

export default function UserAccessList() {
    const theme = useTheme();
    const dispatch = useDispatch();
    const { t } = useAppPreferences();
    const { user } = useSelector((state: any) => state.auth);
    const [filters, setFilters] = useState(initialFilters);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState({ open: false, mode: 'create', row: null });
    const [accessModal, setAccessModal] = useState({ open: false, row: null });
    const [deleteRow, setDeleteRow] = useState(null);
    const [form, setForm] = useState<any>(baseForm);
    const [accessForm, setAccessForm] = useState<any>(baseAccessForm);
    const [resetPasswordState, setResetPasswordState] = useState(null);

    // RTK Query hooks
    const { data: accessOptionsData } = useGetAccessOptionsQuery();
    const options = useMemo(() => {
        const data = accessOptionsData || {};
        return {
            countries: data.countries || [],
            states: data.states || [],
            districts: data.districts || [],
            offices: (data.offices || []).map((office: any) => ({
                id: office.ofc_id,
                name: `${office.office_name}${office.office_code ? ` (${office.office_code})` : ''}`,
                office_code: office.office_code,
                country_id: office.country_id,
                state_id: office.state_id,
                district_id: office.district_id
            })),
            modules: data.modules || [],
            actions: data.actions || ['read', 'create', 'edit', 'delete']
        };
    }, [accessOptionsData]);

    const debouncedFilters = useDebounce(filters, 400);

    const { data: usersData, isFetching: loading } = useGetUsersQuery({
        name: debouncedFilters.name || undefined,
        mobile: debouncedFilters.mobile || undefined,
        user_code: debouncedFilters.user_code || undefined,
        role: debouncedFilters.role || undefined,
        status: debouncedFilters.status || undefined,
        page,
        per_page: rowsPerPage
    });
    const [triggerExportQuery] = useLazyGetUsersQuery();

    const [createUser] = useCreateUserMutation();
    const [updateUser] = useUpdateUserMutation();
    const [updateAccess] = useUpdateAccessMutation();
    const [resetPassword] = useResetPasswordMutation();
    const [deleteUser] = useDeleteUserMutation();

    const rows = usersData?.data || [];
    const totalRows = usersData?.total || 0;

    const handleGetRows = async () => {
        const result = await triggerExportQuery({
            name: debouncedFilters.name || undefined,
            mobile: debouncedFilters.mobile || undefined,
            user_code: debouncedFilters.user_code || undefined,
            role: debouncedFilters.role || undefined,
            status: debouncedFilters.status || undefined,
            page: 1,
            per_page: Math.max(Number(usersData?.total || 0), 10000)
        }).unwrap();

        const rawRows = result?.data || [];
        return rawRows.map((row, index) => ({
            ...row,
            __sno: index + 1,
            display_user_code: row.user_code || `USR-${row.id}`,
            role_label: translateRole(row.role),
            status_label: Number(row.is_active) === 1 ? t('common.active') : t('common.inactive'),
            permission_count: row.permissions_count || 0
        }));
    };
    const exportColumns = useMemo(
        () => [
            { key: '__sno', label: t('common.sno') || 'S.No.' },
            { key: 'name', label: t('access.user') },
            { key: 'display_user_code', label: t('access.userId') },
            { key: 'mobile', label: t('access.mobile') },
            { key: 'role_label', label: t('access.role') },
            { key: 'permission_count', label: t('access.permissions') },
            { key: 'status_label', label: t('common.status') || 'Status' }
        ],
        [t]
    );

    const availableStates = useMemo(() => {
        const states = accessForm.country_ids.length ? options.states.filter((state) => accessForm.country_ids.includes(state.country_id)) : options.states;
        return states.filter((state) => !accessForm.state_ids.includes(state.id));
    }, [accessForm.country_ids, accessForm.state_ids, options.states]);
    const availableDistricts = useMemo(() => {
        if (!accessForm.state_ids.length) return [];
        const districts = accessForm.state_ids.length ? options.districts.filter((district) => accessForm.state_ids.includes(district.state_id)) : options.districts;
        return districts.filter((district) => !accessForm.district_ids.includes(district.id));
    }, [accessForm.district_ids, accessForm.state_ids, options.districts]);
    const availableCountries = useMemo(() => options.countries.filter((country) => !accessForm.country_ids.includes(country.id)), [accessForm.country_ids, options.countries]);
    const availableOffices = useMemo(() => options.offices.filter((office) => !accessForm.office_ids.includes(office.id)), [accessForm.office_ids, options.offices]);
    const formStates = useMemo(
        () => (form.country_id ? options.states.filter((state) => Number(state.country_id) === Number(form.country_id)) : options.states),
        [form.country_id, options.states]
    );
    const formDistricts = useMemo(
        () => (form.state_id ? options.districts.filter((district) => Number(district.state_id) === Number(form.state_id)) : []),
        [form.state_id, options.districts]
    );
    const formOffices = useMemo(
        () => (form.district_id ? options.offices.filter((office) => Number(office.district_id) === Number(form.district_id)) : options.offices),
        [form.district_id, options.offices]
    );

    const handleFilterChange = (field) => (event) => {
        setFilters((current) => ({ ...current, [field]: event.target.value }));
        setPage(1);
    };

    const handleFilterValueChange = (field: string) => (value: string) => {
        setFilters((current) => ({ ...current, [field]: value }));
        setPage(1);
    };

    const handleOpenCreate = () => {
        setForm(getUserFormDefaults(user));
        setModal({ open: true, mode: 'create', row: null });
    };

    const handleOpenEdit = (row) => {
        setForm({
            ...baseForm,
            ...row,
            password: '',
        });
        setModal({ open: true, mode: 'edit', row });
    };

    const handleOpenAccess = (row) => {
        const raw = row.access_raw || {};
        setAccessForm({
            ...baseAccessForm,
            country_ids: raw.country_ids || [],
            state_ids: raw.state_ids || [],
            district_ids: raw.district_ids || [],
            office_ids: raw.office_ids || [],
            permissions: raw.permissions || {}
        });
        setAccessModal({ open: true, row });
    };

    const handleDropAccess = (type, data) => {
        if (data.type !== type) return;

        if (type === 'state') {
            const state = options.states.find((item) => Number(item.id) === Number(data.id));

            if (!accessForm.country_ids.length) {
                dispatch(showNotification({ message: t('access.errCountryFirst'), severity: 'error' }));
                return;
            }

            if (!accessForm.country_ids.includes(Number(state?.country_id))) {
                dispatch(showNotification({ message: t('access.errStateMismatch'), severity: 'error' }));
                return;
            }
        }

        if (type === 'district') {
            const district = options.districts.find((item) => Number(item.id) === Number(data.id));

            if (!accessForm.state_ids.length) {
                dispatch(showNotification({ message: t('access.errStateFirst'), severity: 'error' }));
                return;
            }

            if (!accessForm.state_ids.includes(Number(district?.state_id))) {
                dispatch(showNotification({ message: t('access.errDistrictMismatch'), severity: 'error' }));
                return;
            }
        }

        const field = `${type}_ids`;
        setAccessForm((current) => ({ ...current, [field]: Array.from(new Set([...(current[field] || []), Number(data.id)])) }));
    };

    const removeAccess = (field, id) => {
        setAccessForm((current) => ({ ...current, [field]: current[field].filter((value) => Number(value) !== Number(id)) }));
    };

    const handlePermissionChange = (moduleKey, action) => (event) => {
        setAccessForm((current) => ({
            ...current,
            permissions: {
                ...current.permissions,
                [moduleKey]: {
                    ...(current.permissions?.[moduleKey] || {}),
                    [action]: event.target.checked
                }
            }
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const payload = { ...form };
        if (!payload.password) delete payload.password;

        try {
            if (modal.mode === 'edit') {
                await updateUser({ id: modal.row.id, data: payload }).unwrap();
            } else {
                await createUser(payload).unwrap();
            }
            dispatch(showNotification({ message: t('translations.saveSuccess') || 'User saved successfully.' }));
            setModal({ open: false, mode: 'create', row: null });
        } catch (error: any) {
            const errMsg = error?.data?.message || error?.message || 'Unable to complete request.';
            dispatch(showNotification({ message: errMsg, severity: 'error' }));
        }
    };

    const handleAccessSubmit = async (event) => {
        event.preventDefault();
        if (!accessModal.row) return;

        // Validate role-specific access rules before submitting
        const roleNum = Number(accessModal.row?.role);
        if (roleNum === 2) {
            // System Admin must have at least one state assigned
            if (!accessForm.state_ids || accessForm.state_ids.length === 0) {
                dispatch(showNotification({ message: t('access.errAdminState'), severity: 'error' }));
                return;
            }
            // Ensure other scopes are cleared for state-scoped role
            accessForm.country_ids = [];
            accessForm.district_ids = [];
            accessForm.office_ids = [];
        }

        try {
            await updateAccess({ id: accessModal.row.id, data: accessForm }).unwrap();
            dispatch(showNotification({ message: t('access.saveAccess') + ' ' + (t('translations.success') || 'success') }));
            setAccessModal({ open: false, row: null });
        } catch (error: any) {
            const errMsg = error?.data?.message || error?.message || 'Unable to complete request.';
            dispatch(showNotification({ message: errMsg, severity: 'error' }));
        }
    };

    const handleDelete = async () => {
        if (!deleteRow) return;
        try {
            await deleteUser({ id: deleteRow.id }).unwrap();
            dispatch(showNotification({ message: t('translations.deleteSuccess') || 'Deleted successfully.' }));
            setDeleteRow(null);
        } catch (error: any) {
            const errMsg = error?.data?.message || error?.message || 'Unable to complete request.';
            dispatch(showNotification({ message: errMsg, severity: 'error' }));
        }
    };

    const handleResetPassword = async () => {
        if (!resetPasswordState) return;
        try {
            await resetPassword({ id: resetPasswordState.id }).unwrap();
            dispatch(showNotification({ message: t('access.resetPassword') + ' ' + (t('translations.success') || 'success') }));
            setResetPasswordState(null);
        } catch (error: any) {
            const errMsg = error?.data?.message || error?.message || 'Unable to complete request.';
            dispatch(showNotification({ message: errMsg, severity: 'error' }));
        }
    };

    function translateRole(roleVal) {
        const defaultLabel = ROLE_LABELS[roleVal] || roleVal;
        if (roleVal === 1) return t('translations.superAdmin') || 'Super Admin';
        if (roleVal === 2) return t('translations.systemAdmin') || 'System Admin';
        if (roleVal === 3) return t('translations.operator') || 'Operator';
        return defaultLabel;
    }

    const filtersCard = useMemo(() => {
        return (
            <MainCard sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)' }} contentSX={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                        <SearchTextField fullWidth size="small" label={t('field.name')} value={filters.name} onChange={handleFilterValueChange('name')} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                        <SearchTextField fullWidth size="small" label={t('access.mobile')} value={filters.mobile} onChange={handleFilterValueChange('mobile')} slotProps={{ input: { startAdornment: <InputAdornment position="start"><PhoneIphoneOutlined fontSize="small" /></InputAdornment> } }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                        <SearchTextField fullWidth size="small" label={t('access.userId')} value={filters.user_code} onChange={handleFilterValueChange('user_code')} slotProps={{ input: { startAdornment: <InputAdornment position="start"><BadgeOutlined fontSize="small" /></InputAdornment> } }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                        <FormControl fullWidth>
                            <ChosenSelect
                                value={filters.role}
                                placeholder={t('access.role') + ' (सभी)'}
                                options={[{ value: '', label: t('access.role') + ' (सभी)' }, ...Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label: translateRole(Number(value)) } as any))]}
                                onChange={handleFilterChange('role')}
                            />
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                        <FormControl fullWidth>
                            <ChosenSelect
                                value={filters.status}
                                placeholder={t('common.status') + ' (सभी)'}
                                options={[
                                    { value: '', label: t('common.status') + ' (सभी)' },
                                    { value: 'Active', label: t('common.active') },
                                    { value: 'Inactive', label: t('common.inactive') }
                                ]}
                                onChange={handleFilterChange('status')}
                            />
                        </FormControl>
                    </Grid>
                </Grid>
            </MainCard>
        );
    }, [filters, translateRole, t]);

    const tableCard = useMemo(() => {
        return (
            <MainCard title={`${t('access.userRecords')} (${totalRows})`} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)' }} headerSX={{ p: 2.5 }} contentSX={{ p: 0, '&:last-child': { pb: 0 } }}>
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'flex-end', p: 2, gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 110 }}>
                        <ChosenSelect
                            size="small"
                            value={rowsPerPage}
                            options={[10, 50, 100, 200, 500].map((value) => ({ value, label: `${value} ${t('common.rows')}` }))}
                            onChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(1); }}
                        />
                    </FormControl>
                </Stack>
                <TableContainer>
                    <Table sx={{ minWidth: 1060 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'bg.100' }}>
                                <TableCell sx={{ fontWeight: 700 }}>{t('common.sno')}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{t('access.user')}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{t('access.userId')}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{t('access.mobile')}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{t('access.role')}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{t('access.permissions')}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{t('common.status')}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{t('access.reset')}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>{t('common.action')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row, index) => (
                                <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell>{(page - 1) * rowsPerPage + index + 1}</TableCell>
                                    <TableCell>
                                        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25 }}>
                                            <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main', borderRadius: 1.5 }}>
                                                <AdminPanelSettingsOutlined fontSize="small" />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{row.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {row.email}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>{row.user_code || `USR-${row.id}`}</TableCell>
                                    <TableCell>{row.mobile}</TableCell>
                                    <TableCell>{translateRole(row.role)}</TableCell>
                                    <TableCell>
                                        <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap' }}>
                                            {row.access?.is_super_admin ? (
                                                <Chip label={t('translations.fullAccess') || 'Full Access'} size="small" variant="outlined" color="success" sx={{ borderRadius: 1.5 }} />
                                            ) : (
                                                <Chip label={`${Object.values(row.access?.permissions || {}).filter((item: any) => item?.read).length} modules`} size="small" variant="outlined" sx={{ borderRadius: 1.5 }} />
                                            )}
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={Number(row.is_active) === 1 ? t('common.active') : t('common.inactive')} size="small" color={Number(row.is_active) === 1 ? 'success' : 'error'} variant="outlined" sx={{ borderRadius: 1.5 }} />
                                    </TableCell>
                                    <TableCell>
                                        <Button size="small" variant="outlined" startIcon={<LockOpenOutlined fontSize="small" />} onClick={() => setResetPasswordState(row)} sx={{ borderRadius: 1.5, textTransform: 'none' }}>
                                            {t('access.reset')}
                                        </Button>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" sx={{ gap: 0.5, justifyContent: 'flex-end' }}>
                                            <Button size="small" variant="outlined" startIcon={<LockOpenOutlined fontSize="small" />} onClick={() => handleOpenAccess(row)} sx={{ borderRadius: 1.5, textTransform: 'none' }}>
                                                {t('access.title').includes('प्रबंधन') ? 'एक्सेस' : 'Access'}
                                            </Button>
                                            <IconButton size="small" color="success" aria-label="edit user" onClick={() => handleOpenEdit(row)}>
                                                <EditOutlined fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error" aria-label="delete user" onClick={() => setDeleteRow(row)}>
                                                <DeleteOutlineOutlined fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                                        {t('common.loading')}
                                    </TableCell>
                                </TableRow>
                            )}
                            {!loading && rows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                                        {t('common.noRecords')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <PaginationFooter page={page} rowsPerPage={rowsPerPage} totalRows={totalRows} onPageChange={setPage} />
            </MainCard>
        );
    }, [rows, loading, page, rowsPerPage, totalRows, theme, t, translateRole]);

    return (
        <Stack sx={{ gap: 2.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
                <Box>
                    <Typography variant="h2" sx={{ fontWeight: 700, color: 'primary.dark' }}>{t('access.title')}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {t('access.subtitle')}
                    </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1, alignItems: { xs: 'stretch', sm: 'center' } }}>
                    <DownloadMenu title={`${t('access.userRecords')} Report`} columns={exportColumns} getRowsLazy={handleGetRows} disabled={loading} />
                    <Button variant="contained" color="primary" startIcon={<AddOutlined />} onClick={handleOpenCreate} sx={{ borderRadius: 2, textTransform: 'none', px: 2.5, boxShadow: '0 4px 12px rgba(67, 56, 202, 0.15)' }}>
                        {t('access.createUser')}
                    </Button>
                </Stack>
            </Stack>

            {filtersCard}

            {tableCard}

            {modal.open && (
                <Dialog open={modal.open} onClose={() => setModal({ open: false, mode: 'create', row: null })} fullWidth maxWidth="lg" sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
                    <Box component="form" onSubmit={handleSubmit}>
                        <DialogTitle component="div" sx={{ pb: 1, pt: 2.5 }}>
                            <Typography variant="h3" component="h2" sx={{ fontWeight: 700 }}>{modal.mode === 'edit' ? t('common.update') : t('common.create')} {t('access.user')}</Typography>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Grid container spacing={2} sx={{ pt: 0.5 }}>
                                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label={t('access.fullName')} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('access.userId')} value={form.user_code || ''} onChange={(event) => setForm({ ...form, user_code: event.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label={t('access.email')} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label={t('access.mobile')} value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth>
                                        <ChosenSelect
                                            value={form.role}
                                            options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value: Number(value), label: translateRole(Number(value)) } as any))}
                                            onChange={(event) => setForm({ ...form, role: Number(event.target.value) })}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label={t('reports.department')} value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label={t('masters.designation')} value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required={modal.mode !== 'edit'} label={t('access.tempPassword')} type="password" value={form.password || ''} onChange={(event) => setForm({ ...form, password: event.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} /></Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <FormControl fullWidth required>
                                        <ChosenSelect
                                            value={form.country_id || ''}
                                            required
                                            placeholder={t('access.selectCountry')}
                                            options={options.countries.map((country) => ({ value: country.id, label: country.name }))}
                                            onChange={(event) => setForm({ ...form, country_id: Number(event.target.value), state_id: '', district_id: '', ofc_id: '', ofc_code: '' })}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <FormControl fullWidth required>
                                        <ChosenSelect
                                            value={form.state_id || ''}
                                            required
                                            placeholder={t('access.selectState')}
                                            options={formStates.map((state) => ({ value: state.id, label: state.name }))}
                                            onChange={(event) => setForm({ ...form, state_id: Number(event.target.value), district_id: '', ofc_id: '', ofc_code: '' })}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <FormControl fullWidth required>
                                        <ChosenSelect
                                            value={form.district_id || ''}
                                            required
                                            placeholder={t('access.selectDistrict')}
                                            options={formDistricts.map((district) => ({ value: district.id, label: district.name }))}
                                            onChange={(event) => setForm({ ...form, district_id: Number(event.target.value), ofc_id: '', ofc_code: '' })}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth>
                                        <ChosenSelect
                                            value={form.ofc_id || ''}
                                            placeholder={t('access.noOffice')}
                                            options={[{ value: '', label: t('access.noOffice') }, ...formOffices.map((office) => ({ value: office.id, label: office.name }))]}
                                            onChange={(event) => {
                                                const office = options.offices.find((item) => Number(item.id) === Number(event.target.value));
                                                setForm({ ...form, ofc_id: event.target.value ? Number(event.target.value) : '', ofc_code: office?.office_code || '' });
                                            }}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid size={12}><TextField fullWidth multiline minRows={2} label={t('access.address')} value={form.address || ''} onChange={(event) => setForm({ ...form, address: event.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth>
                                        <ChosenSelect
                                            value={form.is_active}
                                            options={[
                                                { value: 1, label: t('common.active') },
                                                { value: 0, label: t('common.inactive') }
                                            ]}
                                            onChange={(event) => setForm({ ...form, is_active: Number(event.target.value) })}
                                        />
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, py: 2 }}>
                            <Button variant="outlined" color="inherit" onClick={() => setModal({ open: false, mode: 'create', row: null })} sx={{ borderRadius: 1.5, textTransform: 'none' }}>{t('common.cancel')}</Button>
                            <Button type="submit" variant="contained" color="primary" startIcon={<SaveOutlined />} sx={{ borderRadius: 1.5, textTransform: 'none', boxShadow: '0 4px 12px rgba(67, 56, 202, 0.15)' }}>{t('access.saveUser')}</Button>
                        </DialogActions>
                    </Box>
                </Dialog>
            )}

            {accessModal.open && (
                <Dialog open={accessModal.open} onClose={() => setAccessModal({ open: false, row: null })} fullWidth maxWidth="lg" sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
                    <Box component="form" onSubmit={handleAccessSubmit}>
                        <DialogTitle component="div" sx={{ pb: 1, pt: 2.5 }}>
                            <Typography variant="h3" component="h2" sx={{ fontWeight: 700 }}>
                                {t('access.title').includes('प्रबंधन') ? 'एक्सेस सीमाएं' : 'Access Scope'}: {accessModal.row?.name}
                            </Typography>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Grid container spacing={2} sx={{ pt: 0.5 }}>
                                {Number(accessModal.row?.role) !== 1 && (() => {
                                    const roleNum = Number(accessModal.row?.role);
                                    if (roleNum === 2) {
                                        return (
                                            <>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <AccessDropZone title={t('access.stateAccess')} selected={accessForm.state_ids} items={options.states} onDropItem={(data) => handleDropAccess('state', data)} onRemove={(id) => removeAccess('state_ids', id)} t={t} />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, minHeight: 92, bgcolor: 'bg.100' }}>
                                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'warning.dark' }}>
                                                            {t('election.timeline').includes('विवरण') ? 'विशेष ध्यान दें' : 'Important Note'}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {t('access.sysAdminNote')}
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            </>
                                        );
                                    }

                                    return (
                                        <>
                                            <Grid size={{ xs: 12, md: 4 }}><DraggableList title={t('masters.countries')} type="country" items={availableCountries} t={t} /></Grid>
                                            <Grid size={{ xs: 12, md: 4 }}><DraggableList title={t('masters.states')} type="state" items={availableStates} t={t} /></Grid>
                                            <Grid size={{ xs: 12, md: 4 }}>
                                                {accessForm.state_ids.length ? (
                                                    <DraggableList title={t('masters.districts')} type="district" items={availableDistricts} t={t} />
                                                ) : (
                                                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, minHeight: 92, bgcolor: 'bg.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                            {t('access.errStateFirst')}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 4 }}><AccessDropZone title={t('access.countryAccess')} selected={accessForm.country_ids} items={options.countries} onDropItem={(data) => handleDropAccess('country', data)} onRemove={(id) => removeAccess('country_ids', id)} t={t} /></Grid>
                                            <Grid size={{ xs: 12, md: 4 }}><AccessDropZone title={t('access.stateAccess')} selected={accessForm.state_ids} items={options.states} onDropItem={(data) => handleDropAccess('state', data)} onRemove={(id) => removeAccess('state_ids', id)} t={t} /></Grid>
                                            <Grid size={{ xs: 12, md: 4 }}><AccessDropZone title={t('access.districtAccess')} selected={accessForm.district_ids} items={options.districts} onDropItem={(data) => handleDropAccess('district', data)} onRemove={(id) => removeAccess('district_ids', id)} t={t} /></Grid>
                                            <Grid size={12}><DraggableList title={t('masters.offices')} type="office" items={availableOffices} t={t} /></Grid>
                                            <Grid size={12}><AccessDropZone title={t('access.officeAccess')} selected={accessForm.office_ids} items={options.offices} onDropItem={(data) => handleDropAccess('office', data)} onRemove={(id) => removeAccess('office_ids', id)} t={t} /></Grid>
                                        </>
                                    );
                                })()}

                                <Grid size={12}>
                                    <MainCard title={t('access.permissions')} headerSX={{ p: 2, '& .MuiCardHeader-title': { fontSize: '1rem', fontWeight: 700 } }} contentSX={{ p: 0, '&:last-child': { pb: 0 } }} sx={{ borderRadius: 2 }}>
                                        <TableContainer>
                                            <Table sx={{ minWidth: 720 }}>
                                                <TableHead>
                                                    <TableRow sx={{ bgcolor: 'bg.100' }}>
                                                        <TableCell sx={{ fontWeight: 700 }}>Module</TableCell>
                                                        {options.actions.map((action) => (
                                                            <TableCell key={action} align="center" sx={{ fontWeight: 700 }}>
                                                                {action.charAt(0).toUpperCase() + action.slice(1)}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {options.modules.map((module) => (
                                                        <TableRow key={module.key} hover>
                                                            <TableCell sx={{ fontWeight: 550 }}>{module.label}</TableCell>
                                                            {options.actions.map((action) => (
                                                                <TableCell key={`${module.key}-${action}`} align="center">
                                                                    <Checkbox checked={Boolean(accessForm.permissions?.[module.key]?.[action]) || Number(accessModal.row?.role) === 1} disabled={Number(accessModal.row?.role) === 1} onChange={handlePermissionChange(module.key, action)} />
                                                                </TableCell>
                                                            ))}
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </MainCard>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, py: 2 }}>
                            <Button variant="outlined" color="inherit" onClick={() => setAccessModal({ open: false, row: null })} sx={{ borderRadius: 1.5, textTransform: 'none' }}>{t('common.cancel')}</Button>
                            <Button type="submit" variant="contained" color="primary" startIcon={<SaveOutlined />} sx={{ borderRadius: 1.5, textTransform: 'none', boxShadow: '0 4px 12px rgba(67, 56, 202, 0.15)' }}>{t('access.saveAccess')}</Button>
                        </DialogActions>
                    </Box>
                </Dialog>
            )}

            {Boolean(deleteRow) && (
                <Dialog open={Boolean(deleteRow)} onClose={() => setDeleteRow(null)} fullWidth maxWidth="xs" sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
                    <DialogTitle sx={{ pt: 2.5, fontWeight: 700 }}>{t('access.deleteUser')}</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary">
                            {t('access.confirmDelete')}
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button variant="outlined" color="inherit" onClick={() => setDeleteRow(null)} sx={{ borderRadius: 1.5, textTransform: 'none' }}>{t('common.cancel')}</Button>
                        <Button variant="contained" color="error" startIcon={<DeleteOutlineOutlined />} onClick={handleDelete} sx={{ borderRadius: 1.5, textTransform: 'none' }}>{t('common.delete')}</Button>
                    </DialogActions>
                </Dialog>
            )}

            {Boolean(resetPasswordState) && (
                <Dialog open={Boolean(resetPasswordState)} onClose={() => setResetPasswordState(null)} fullWidth maxWidth="xs" sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
                    <DialogTitle sx={{ pt: 2.5, fontWeight: 700 }}>{t('access.resetPassword')}</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary">
                            {t('access.confirmReset')} ({resetPasswordState?.name})?
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button variant="outlined" color="inherit" onClick={() => setResetPasswordState(null)} sx={{ borderRadius: 1.5, textTransform: 'none' }}>{t('common.cancel')}</Button>
                        <Button variant="contained" color="primary" startIcon={<LockOpenOutlined fontSize="small" />} onClick={handleResetPassword} sx={{ borderRadius: 1.5, textTransform: 'none', boxShadow: '0 4px 12px rgba(67, 56, 202, 0.15)' }}>{t('access.reset')}</Button>
                    </DialogActions>
                </Dialog>
            )}
        </Stack>
    );
}
