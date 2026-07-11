import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

// project imports
import MainCard from 'components/cards/MainCard';
import { showNotification } from 'store/slices/notificationSlice';
import { useAppPreferences } from 'contexts/AppPreferences';
import { useGetAuthSettingsQuery, useUpdateAuthSettingsMutation } from 'store/apiSlice';

// assets
import SecurityOutlined from '@mui/icons-material/SecurityOutlined';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';

export default function AuthSettings() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { t } = useAppPreferences();

  // RTK Query hooks
  const { data: currentSettings, isLoading: loadingFetch } = useGetAuthSettingsQuery();
  const [updateAuthSettings, { isLoading: loadingSave }] = useUpdateAuthSettingsMutation();

  const [formState, setFormState] = useState({
    password_login_enabled: true,
    default_otp_enabled: false
  });

  useEffect(() => {
    if (currentSettings) {
      setFormState({
        password_login_enabled: Boolean(currentSettings.password_login_enabled),
        default_otp_enabled: Boolean(currentSettings.default_otp_enabled)
      });
    }
  }, [currentSettings]);

  const handleToggle = (key: 'password_login_enabled' | 'default_otp_enabled') => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      [key]: event.target.checked
    }));
  };

  const handleSave = async () => {
    try {
      await updateAuthSettings(formState).unwrap();
      dispatch(
        showNotification({
          message: t('authSettings.saveSuccess') || 'Authentication settings updated successfully.',
          severity: 'success'
        })
      );
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || t('authSettings.saveError') || 'Failed to update authentication settings.';
      dispatch(
        showNotification({
          message: errMsg,
          severity: 'error'
        })
      );
    }
  };

  if (loadingFetch) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Stack sx={{ gap: 2.5 }}>
      <Box>
        <Typography variant="h2" sx={{ fontWeight: 700, color: 'primary.dark' }}>
          {t('authSettings.title') || 'Authentication Settings'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t('authSettings.subtitle') || 'Manage login flow, password requirements, and default OTP bypass modes.'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8, lg: 6 }}>
          <MainCard
            sx={{
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)'
            }}
            contentSX={{ p: 3 }}
          >
            <Stack spacing={4}>
              {/* Password toggle card */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: formState.password_login_enabled
                    ? alpha(theme.palette.primary.main, 0.04)
                    : alpha(theme.palette.action.disabled, 0.04),
                  border: '1px solid',
                  borderColor: formState.password_login_enabled
                    ? alpha(theme.palette.primary.main, 0.12)
                    : theme.palette.divider,
                  transition: 'all 0.3s ease'
                }}
              >
                <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                  <Stack direction="row" sx={{ gap: 2 }}>
                    <VpnKeyOutlined
                      color={formState.password_login_enabled ? 'primary' : 'disabled'}
                      sx={{ mt: 0.25 }}
                    />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {t('authSettings.passwordVerifyTitle') || 'Password Verification'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                        {t('authSettings.passwordVerifyDesc') ||
                          'When enabled, users must provide their account password to request an OTP. When disabled, OTP can be requested using only the registered mobile number.'}
                      </Typography>
                    </Box>
                  </Stack>
                  <Switch
                    checked={formState.password_login_enabled}
                    onChange={handleToggle('password_login_enabled')}
                    color="primary"
                  />
                </Stack>
              </Box>

              {/* Default OTP toggle card */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: formState.default_otp_enabled
                    ? alpha(theme.palette.warning.main, 0.04)
                    : alpha(theme.palette.action.disabled, 0.04),
                  border: '1px solid',
                  borderColor: formState.default_otp_enabled
                    ? alpha(theme.palette.warning.main, 0.16)
                    : theme.palette.divider,
                  transition: 'all 0.3s ease'
                }}
              >
                <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                  <Stack direction="row" sx={{ gap: 2 }}>
                    <SecurityOutlined
                      color={formState.default_otp_enabled ? 'warning' : 'disabled'}
                      sx={{ mt: 0.25 }}
                    />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {t('authSettings.defaultOtpTitle') || 'Default OTP Mode (Bypass SMS)'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                        {t('authSettings.defaultOtpDesc') ||
                          'When enabled, the system will use "123456" as the OTP for all logins. SMS delivery is bypassed.'}
                      </Typography>
                    </Box>
                  </Stack>
                  <Switch
                    checked={formState.default_otp_enabled}
                    onChange={handleToggle('default_otp_enabled')}
                    color="warning"
                  />
                </Stack>
              </Box>

              {/* Actions */}
              <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={loadingSave ? <CircularProgress color="inherit" size={16} /> : <SaveOutlined />}
                  disabled={loadingSave}
                  onClick={handleSave}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(67, 56, 202, 0.15)'
                  }}
                >
                  {t('common.save') || 'Save Settings'}
                </Button>
              </Stack>
            </Stack>
          </MainCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
