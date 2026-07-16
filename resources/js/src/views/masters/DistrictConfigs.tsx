import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

// project imports
import MainCard from 'components/cards/MainCard';
import { useAppPreferences } from 'contexts/AppPreferences';
import { useGetDistrictConfigsQuery, useSaveDistrictConfigMutation, useGetOptionsQuery } from 'store/apiSlice';
import { showNotification } from 'store/slices/notificationSlice';

// assets
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import SwapHorizOutlined from '@mui/icons-material/SwapHorizOutlined';

const getSurfaceSx = (theme: any) => ({
  border: '1px solid',
  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(148, 163, 184, 0.18)',
  borderRadius: 3,
  boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 12px 34px rgba(15, 23, 42, 0.05)',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(180deg, rgba(20, 32, 54, 0.95), rgba(15, 24, 40, 0.9))'
    : '#ffffff'
});

export default function DistrictConfigs() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { t, tl } = useAppPreferences();

  const { user } = useSelector((state: any) => state.auth);

  const { data: configs, isFetching: loading, refetch } = useGetDistrictConfigsQuery();
  const { data: optionsData } = useGetOptionsQuery();
  const [saveConfig, { isLoading: saving }] = useSaveDistrictConfigMutation();

  const [selectedCountryId, setSelectedCountryId] = useState<number | ''>('');
  const [selectedStateId, setSelectedStateId] = useState<number | ''>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | ''>('');

  const [formData, setFormData] = useState<{
    dob_from: string;
    dob_to: string;
    same_city_duty_male: boolean;
    same_city_duty_female: boolean;
    rules: { post_name: string; min_salary: string; comparison_operator: 'above' | 'under' }[];
  }>({
    dob_from: '',
    dob_to: '',
    same_city_duty_male: true,
    same_city_duty_female: true,
    rules: []
  });

  const isSuperOrSystemAdmin = useMemo(() => {
    const role = Number(user?.role);
    return role === 1 || role === 2;
  }, [user]);

  // Filtered States based on selected Country
  const filteredStates = useMemo(() => {
    if (!optionsData?.states || selectedCountryId === '') return [];
    return optionsData.states.filter((s: any) => Number(s.country_id) === Number(selectedCountryId));
  }, [optionsData, selectedCountryId]);

  // Mapping configurations to include state and country details from options lookup
  const configsWithLocations = useMemo(() => {
    if (!configs || !optionsData?.districts) return [];
    return configs.map((c: any) => {
      const dOpt = optionsData.districts.find((d: any) => Number(d.id) === Number(c.district_id));
      return {
        ...c,
        country_id: dOpt ? Number(dOpt.country_id) : '',
        state_id: dOpt ? Number(dOpt.state_id) : ''
      };
    });
  }, [configs, optionsData]);

  // District options filtered according to selector hierarchy
  const districtOptions = useMemo(() => {
    if (!configsWithLocations) return [];
    if (!isSuperOrSystemAdmin) {
      return configsWithLocations;
    }
    if (selectedStateId === '') return [];
    return configsWithLocations.filter((c: any) => Number(c.state_id) === Number(selectedStateId));
  }, [configsWithLocations, isSuperOrSystemAdmin, selectedStateId]);

  // Set default selections based on logged-in user's profile or default to India
  useEffect(() => {
    if (user && optionsData) {
      const profileCountryId = user.country_id || user.country_info?.id || user.office_info?.country_id;
      const profileStateId = user.state_id || user.state_info?.id || user.office_info?.state_id;
      const profileDistrictId = user.district_id || user.district_info?.id || user.office_info?.district_id;

      if (selectedCountryId === '') {
        if (profileCountryId) {
          setSelectedCountryId(Number(profileCountryId));
        } else if (optionsData.countries && optionsData.countries.length > 0) {
          const india = optionsData.countries.find((c: any) => c.name.toLowerCase() === 'india');
          setSelectedCountryId(india ? Number(india.id) : Number(optionsData.countries[0].id));
        }
      }

      if (selectedStateId === '' && profileStateId) {
        setSelectedStateId(Number(profileStateId));
      }

      if (selectedDistrictId === '' && profileDistrictId) {
        setSelectedDistrictId(Number(profileDistrictId));
      }
    }
  }, [user, optionsData, selectedCountryId, selectedStateId, selectedDistrictId]);

  // Set default selection fallback when configs load
  useEffect(() => {
    if (configsWithLocations && configsWithLocations.length > 0) {
      if (selectedDistrictId === '') {
        const profileDistrictId = user?.district_id || user?.district_info?.id || user?.office_info?.district_id;
        if (profileDistrictId) {
          const exists = configsWithLocations.some((c: any) => Number(c.district_id) === Number(profileDistrictId));
          if (exists) {
            setSelectedDistrictId(Number(profileDistrictId));
            return;
          }
        }
        setSelectedDistrictId(configsWithLocations[0].district_id);
      }
    }
  }, [configsWithLocations, selectedDistrictId, user]);

  // Sync active district form data
  useEffect(() => {
    if (configs && selectedDistrictId !== '') {
      const selected = configs.find((c: any) => Number(c.district_id) === Number(selectedDistrictId));
      if (selected) {
        setFormData({
          dob_from: selected.dob_from || '',
          dob_to: selected.dob_to || '',
          same_city_duty_male: !!selected.same_city_duty_male,
          same_city_duty_female: !!selected.same_city_duty_female,
          rules: (selected.rules || []).map((rule: any) => ({
            post_name: rule.post_name,
            min_salary: String(rule.min_salary ?? 0),
            comparison_operator: rule.comparison_operator || 'above'
          }))
        });
      }
    }
  }, [configs, selectedDistrictId]);

  const handleDistrictChange = (event: any) => {
    setSelectedDistrictId(Number(event.target.value));
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRuleChange = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const nextRules = [...prev.rules];
      nextRules[index] = { ...nextRules[index], [field]: value };
      return { ...prev, rules: nextRules };
    });
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (selectedDistrictId === '') {
      dispatch(showNotification({ message: 'Please select a district.', severity: 'error' }));
      return;
    }

    try {
      const payload = {
        district_id: selectedDistrictId,
        dob_from: formData.dob_from || null,
        dob_to: formData.dob_to || null,
        same_city_duty_male: formData.same_city_duty_male,
        same_city_duty_female: formData.same_city_duty_female,
        rules: formData.rules.map((r) => ({
          post_name: r.post_name,
          min_salary: parseFloat(r.min_salary) || 0,
          comparison_operator: r.comparison_operator
        }))
      };

      const response = await saveConfig(payload).unwrap();
      dispatch(showNotification({ message: response.message || 'Configuration saved successfully.', severity: 'success' }));
      refetch();
    } catch (error: any) {
      const errMsg = error?.data?.message || error?.message || 'Failed to save configuration.';
      dispatch(showNotification({ message: errMsg, severity: 'error' }));
    }
  };

  const activeDistrict = configs?.find((c: any) => Number(c.district_id) === Number(selectedDistrictId));

  return (
    <Stack sx={{ gap: 3 }}>
      <Box>
        <Typography variant="h2">{tl('District Election Configurations')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {tl('Configure Date of Birth rules, salary thresholds and home-city restrictions district-wise')}
        </Typography>
      </Box>

      <Card sx={{ ...getSurfaceSx(theme), p: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          {isSuperOrSystemAdmin && (
            <>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel sx={{ mb: 1, fontWeight: 700, color: 'text.primary' }}>
                    {tl('Select Country')}
                  </FormLabel>
                  <Select
                    value={selectedCountryId}
                    onChange={(e) => {
                      setSelectedCountryId(Number(e.target.value));
                      setSelectedStateId('');
                      setSelectedDistrictId('');
                    }}
                    size="small"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="">{tl('Select Country')}</MenuItem>
                    {optionsData?.countries?.map((c: any) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth disabled={selectedCountryId === ''}>
                  <FormLabel sx={{ mb: 1, fontWeight: 700, color: 'text.primary' }}>
                    {tl('Select State')}
                  </FormLabel>
                  <Select
                    value={selectedStateId}
                    onChange={(e) => {
                      setSelectedStateId(Number(e.target.value));
                      setSelectedDistrictId('');
                    }}
                    size="small"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="">{tl('Select State')}</MenuItem>
                    {filteredStates.map((s: any) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          <Grid size={{ xs: 12, md: isSuperOrSystemAdmin ? 4 : 6 }}>
            <FormControl fullWidth disabled={isSuperOrSystemAdmin && selectedStateId === ''}>
              <FormLabel sx={{ mb: 1, fontWeight: 700, color: 'text.primary' }}>
                {tl('Select District to Configure')}
              </FormLabel>
              <Select
                value={selectedDistrictId}
                onChange={handleDistrictChange}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">{tl('Select District')}</MenuItem>
                {districtOptions.map((c: any) => (
                  <MenuItem key={c.district_id} value={c.district_id}>
                    {c.district_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {selectedDistrictId !== '' && activeDistrict && (
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* DOB Configuration Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <MainCard
                title={
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                    <ShieldOutlined color="primary" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {tl('Employee Date of Birth Range')}
                    </Typography>
                  </Stack>
                }
                sx={getSurfaceSx}
                headerSX={{ p: 2.5 }}
                contentSX={{ p: 3 }}
              >
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label={tl('From Date')}
                      value={formData.dob_from}
                      onChange={(e) => handleFormChange('dob_from', e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label={tl('To Date')}
                      value={formData.dob_to}
                      onChange={(e) => handleFormChange('dob_to', e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {tl('Employees whose DOB is outside this range will fail validation during creation and import, and will not be assigned duty.')}
                    </Typography>
                  </Grid>
                </Grid>
              </MainCard>
            </Grid>

            {/* Same City Duty Assignment Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <MainCard
                title={
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                    <SwapHorizOutlined color="primary" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {tl('City-wise Duty Restrictions')}
                    </Typography>
                  </Stack>
                }
                sx={getSurfaceSx}
                headerSX={{ p: 2.5 }}
                contentSX={{ p: 3 }}
              >
                <Stack spacing={2.5}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {tl('Male Employees same city duty')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tl('Toggle off to restrict duty allocation in their home city')}
                      </Typography>
                    </Box>
                    <Switch
                      checked={formData.same_city_duty_male}
                      onChange={(e) => handleFormChange('same_city_duty_male', e.target.checked)}
                      color="primary"
                    />
                  </Stack>
                  <Divider />
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {tl('Female Employees same city duty')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tl('Toggle off to restrict duty allocation in their home city')}
                      </Typography>
                    </Box>
                    <Switch
                      checked={formData.same_city_duty_female}
                      onChange={(e) => handleFormChange('same_city_duty_female', e.target.checked)}
                      color="primary"
                    />
                  </Stack>
                </Stack>
              </MainCard>
            </Grid>

            {/* Post Salary Rules Card */}
            <Grid size={{ xs: 12 }}>
              <MainCard
                title={
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                    <SettingsOutlined color="primary" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {tl('Post Salary / Pay Level Mapping Configuration')}
                    </Typography>
                  </Stack>
                }
                sx={getSurfaceSx}
                headerSX={{ p: 2.5 }}
                contentSX={{ p: 3 }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {tl('Define basic salary ranges for auto-determining designations (P0, P1, P2, P3, P4) during team deployments')}
                </Typography>
                <Grid container spacing={3}>
                  {formData.rules.map((rule, index) => (
                    <Grid key={rule.post_name} size={{ xs: 12, md: 4 }}>
                      <MainCard
                        title={
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                            Post {rule.post_name} Rule
                          </Typography>
                        }
                        sx={{ bgcolor: 'bg.100', border: '1px solid', borderColor: 'divider' }}
                        headerSX={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
                        contentSX={{ p: 2 }}
                      >
                        <Stack spacing={2}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label={tl('Salary Threshold')}
                            value={rule.min_salary}
                            onChange={(e) => handleRuleChange(index, 'min_salary', e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                          <FormControl fullWidth size="small">
                            <FormLabel sx={{ mb: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>
                              {tl('Comparison Operator')}
                            </FormLabel>
                            <Select
                              value={rule.comparison_operator}
                              onChange={(e) => handleRuleChange(index, 'comparison_operator', e.target.value)}
                              sx={{ borderRadius: 2 }}
                            >
                              <MenuItem value="above">{tl('Above or Equal (>=)')}</MenuItem>
                              <MenuItem value="under">{tl('Under (<)')}</MenuItem>
                            </Select>
                          </FormControl>
                        </Stack>
                      </MainCard>
                    </Grid>
                  ))}
                </Grid>
              </MainCard>
            </Grid>

            {/* Save Button */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={saving}
                  startIcon={<SaveOutlined />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 4
                  }}
                >
                  {saving ? tl('Saving...') : tl('Save Configurations')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}
    </Stack>
  );
}
