import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// material-ui
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';

// project imports
import apiClient from 'api/client';
import { logoutUser } from 'store/slices/authSlice';
import { useAppPreferences } from 'contexts/AppPreferences';

// assets
import LockOutlined from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function LockScreen() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { tl } = useAppPreferences();

  const { user } = useSelector((state: any) => state.auth);

  const [unlockMethod, setUnlockMethod] = useState<'password' | 'otp'>('password');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP states
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('is_locked') !== 'true') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleUnlockWithPassword = async (event: any) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await apiClient.post('/auth/unlock', { password });
      localStorage.removeItem('is_locked');
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.password?.[0] || 'Incorrect password.';
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendOtp = async () => {
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const response = await apiClient.post('/auth/unlock-send-otp');
      setOtpSent(true);
      setCountdown(120);
      if (response.data?.otp) {
        setDevOtp(response.data.otp);
        setSuccess(`${response.data.message || 'OTP sent.'} (Bypass OTP: ${response.data.otp})`);
      } else {
        setSuccess(response.data?.message || 'OTP sent successfully to registered mobile number.');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to send OTP.';
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlockWithOtp = async (event: any) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await apiClient.post('/auth/unlock-verify-otp', { otp });
      localStorage.removeItem('is_locked');
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.otp?.[0] || 'Invalid or expired OTP.';
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('is_locked');
    dispatch(logoutUser()).finally(() => navigate('/', { replace: true }));
  };

  const nameInitial = user?.name ? user.name[0].toUpperCase() : 'U';
  const maskedMobile = user?.mobile
    ? `${user.mobile.substring(0, 3)}*****${user.mobile.substring(8)}`
    : '';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.palette.mode === 'dark' ? 'grey.950' : 'grey.100',
        background: theme.palette.mode === 'dark'
          ? 'radial-gradient(circle, rgba(15,23,42,1) 0%, rgba(2,6,23,1) 100%)'
          : 'radial-gradient(circle, rgba(241,245,249,1) 0%, rgba(226,232,240,1) 100%)',
        py: 12
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={12}
          sx={{
            p: 4,
            borderRadius: 4,
            border: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center',
            boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 24px 64px rgba(0,0,0,0.08)'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                  fontWeight: 700,
                  boxShadow: '0 8px 24px rgba(67,56,202,0.15)'
                }}
              >
                {nameInitial}
              </Avatar>
              <Avatar
                sx={{
                  position: 'absolute',
                  right: -4,
                  bottom: -4,
                  width: 28,
                  height: 28,
                  bgcolor: 'warning.main',
                  border: '2px solid',
                  borderColor: theme.palette.mode === 'dark' ? '#1e293b' : '#fff'
                }}
              >
                <LockOutlined sx={{ fontSize: '1rem', color: '#fff' }} />
              </Avatar>
            </Box>
          </Box>

          <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
            {user?.name || tl('Locked Session')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            {unlockMethod === 'password'
              ? tl('Enter your password to unlock the screen.')
              : tl('Unlock using verification code sent to your mobile.')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left', borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3, textAlign: 'left', borderRadius: 2 }}>
              {success}
            </Alert>
          )}

          {unlockMethod === 'password' ? (
            <Box component="form" onSubmit={handleUnlockWithPassword}>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  required
                  type={showPassword ? 'text' : 'password'}
                  label={tl('Password')}
                  placeholder={tl('Enter password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2.5,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)'
                    }
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                />

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={submitting}
                  sx={{
                    borderRadius: 2.5,
                    textTransform: 'none',
                    fontWeight: 700,
                    py: 1.25,
                    boxShadow: '0 8px 24px rgba(67,56,202,0.18)'
                  }}
                >
                  {submitting ? <CircularProgress size={24} color="inherit" /> : tl('Unlock')}
                </Button>

                <Button
                  variant="text"
                  color="secondary"
                  onClick={() => {
                    setUnlockMethod('otp');
                    setError('');
                    setSuccess('');
                  }}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  {tl('Unlock using OTP')}
                </Button>
              </Stack>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleUnlockWithOtp}>
              <Stack spacing={2.5}>
                {!otpSent ? (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                      {tl('OTP will be sent to registered mobile')}: <strong>{maskedMobile}</strong>
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      color="secondary"
                      size="large"
                      onClick={handleSendOtp}
                      disabled={submitting}
                      sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700 }}
                    >
                      {submitting ? <CircularProgress size={24} color="inherit" /> : tl('Send OTP')}
                    </Button>
                  </Box>
                ) : (
                  <>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      label={tl('Enter 6 digit OTP')}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      slotProps={{ htmlInput: { maxLength: 6 } }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2.5,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)'
                        }
                      }}
                    />

                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={submitting || otp.length !== 6}
                      sx={{
                        borderRadius: 2.5,
                        textTransform: 'none',
                        fontWeight: 700,
                        py: 1.25,
                        boxShadow: '0 8px 24px rgba(67,56,202,0.18)'
                      }}
                    >
                      {submitting ? <CircularProgress size={24} color="inherit" /> : tl('Verify & Unlock')}
                    </Button>

                    <Button
                      fullWidth
                      variant="outlined"
                      color="secondary"
                      onClick={handleSendOtp}
                      disabled={submitting || countdown > 0}
                      sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600 }}
                    >
                      {countdown > 0 ? `${tl('Resend OTP in')} ${countdown}s` : tl('Resend OTP')}
                    </Button>
                  </>
                )}

                <Button
                  variant="text"
                  color="secondary"
                  onClick={() => {
                    setUnlockMethod('password');
                    setError('');
                    setSuccess('');
                  }}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  {tl('Unlock using Password')}
                </Button>
              </Stack>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Button
            variant="text"
            color="error"
            onClick={handleLogout}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            {tl('Logout / Switch User')}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
