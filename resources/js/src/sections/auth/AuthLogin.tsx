import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// material-ui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// third party
import { useForm } from 'react-hook-form';

// project imports
import { useAppPreferences } from 'contexts/AppPreferences';
import { clearAuthError, clearOtpMessage, expireOtpState, resetOtpState, sendLoginOtp, verifyLoginOtp } from 'store/slices/authSlice';
import { otpSchema } from 'utils/validationSchema';

// assets
import PhoneIphoneOutlined from '@mui/icons-material/PhoneIphoneOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined';

const turnstileSiteKey = document.querySelector('meta[name="turnstile-site-key"]')?.getAttribute('content');

function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getTimerColor(seconds) {
  if (seconds <= 30) return 'error.main';
  if (seconds <= 75) return 'warning.main';
  return 'success.main';
}

// ==============================|| AUTH - LOGIN ||============================== //

export default function AuthLogin({ inputSx = {} }: any = {}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useAppPreferences();
  const { error, isAuthenticated, loading, otpExpiresAt, otpMessage, otpSent } = useSelector((state) => state.auth);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaReady, setCaptchaReady] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const turnstileRef = useRef(null);
  const widgetIdRef = useRef(null);
  const lastPasswordRef = useRef('');
  const otpExpiredHandledRef = useRef(false);
  const isOtpExpired = otpSent && remainingSeconds <= 0;

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors }
  } = useForm();

  const mobileSchema = {
    required: 'Mobile number is required',
    pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10 digit mobile number' }
  };
  const passwordSchema = { required: 'Password is required' };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!otpSent || !turnstileSiteKey || !turnstileRef.current || widgetIdRef.current !== null) return;

    const renderTurnstile = () => {
      if (!window.turnstile || widgetIdRef.current !== null) return;

      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: turnstileSiteKey,
        callback: (token) => {
          setCaptchaToken(token);
          setCaptchaReady(true);
        },
        'expired-callback': () => {
          setCaptchaToken('');
          setCaptchaReady(false);
        },
        'error-callback': () => {
          setCaptchaToken('');
          setCaptchaReady(false);
        }
      });
    };

    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      if (window.turnstile) {
        renderTurnstile();
        clearInterval(interval);
      }

      if (attempts >= 40) {
        clearInterval(interval);
      }
    }, 250);

    renderTurnstile();

    return () => clearInterval(interval);
  }, [otpSent, turnstileRef.current]);

  useEffect(() => {
    if (!otpSent || !otpExpiresAt) {
      setRemainingSeconds(0);
      return undefined;
    }

    otpExpiredHandledRef.current = false;

    const updateTimer = () => {
      const nextSeconds = Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000));
      setRemainingSeconds(nextSeconds);

      if (nextSeconds === 0 && !otpExpiredHandledRef.current) {
        otpExpiredHandledRef.current = true;
        setCaptchaToken('');
        setCaptchaReady(false);
        dispatch(expireOtpState());

        if (window.turnstile && widgetIdRef.current !== null) {
          window.turnstile.reset(widgetIdRef.current);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [dispatch, otpExpiresAt, otpSent]);

  const onSubmit = (values) => {
    dispatch(clearAuthError());

    if (!otpSent) {
      lastPasswordRef.current = values.password || '';
      dispatch(sendLoginOtp({ mobile: values.mobile, password: values.password }));
      return;
    }

    if (!captchaToken || isOtpExpired) return;

    dispatch(verifyLoginOtp({ mobile: values.mobile, otp: values.otp, captcha_token: captchaToken }))
      .unwrap()
      .catch(() => {
        setCaptchaToken('');
        setCaptchaReady(false);

        if (window.turnstile && widgetIdRef.current !== null) {
          window.turnstile.reset(widgetIdRef.current);
        }
      });
  };

  const handleChangeMobile = () => {
    dispatch(resetOtpState());
    setCaptchaToken('');
    setCaptchaReady(false);
    lastPasswordRef.current = '';

    if (window.turnstile && widgetIdRef.current !== null) {
      window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }
  };

  const handleResendOtp = () => {
    dispatch(clearAuthError());
    dispatch(clearOtpMessage());

    setCaptchaToken('');
    setCaptchaReady(false);
    if (window.turnstile && widgetIdRef.current !== null) {
      window.turnstile.reset(widgetIdRef.current);
    }

    const password = getValues('password') || lastPasswordRef.current;

    if (!password) {
      setError('password', { type: 'required', message: t('auth.passwordLabel') });
      dispatch(resetOtpState());
      return;
    }

    lastPasswordRef.current = password;
    dispatch(sendLoginOtp({ mobile: getValues('mobile'), password }));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
        <Stack sx={{ gap: 3 }}>
        <Box sx={{ px: 2, py: 1.5, borderRadius: 1, bgcolor: 'rgba(16, 60, 92, 0.05)', border: '1px solid rgba(16, 60, 92, 0.12)' }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25 }}>
            <LockOutlined fontSize="small" sx={{ color: '#103c5c' }} />
            <Typography variant="body2" color="text.secondary">
              {t('auth.otpIntro')}
            </Typography>
          </Stack>
        </Box>

        <Box>
          <TextField
            id="outlined-mobile"
            variant="outlined"
            {...register('mobile', mobileSchema)}
            placeholder={t('auth.mobilePlaceholder')}
            fullWidth
            label={t('auth.mobileLabel')}
            error={Boolean(errors.mobile)}
            disabled={otpSent}
            slotProps={{
              input: {
                inputProps: { maxLength: 10, inputMode: 'numeric', autoComplete: 'username' },
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIphoneOutlined fontSize="small" />
                  </InputAdornment>
                )
              }
            }}
            sx={inputSx}
          />
          {errors.mobile?.message && <FormHelperText error>{String(errors.mobile.message)}</FormHelperText>}
          {otpSent && (
            <Button size="small" variant="text" onClick={handleChangeMobile} sx={{ minWidth: 'auto', mt: 1, px: 0 }}>
              {t('auth.changeMobile')}
            </Button>
          )}
        </Box>

        {!otpSent && (
          <Box>
            <TextField
              id="outlined-password"
              variant="outlined"
              {...register('password', passwordSchema)}
              placeholder={t('auth.passwordPlaceholder')}
              fullWidth
              label={t('auth.passwordLabel')}
              type={isPasswordVisible ? 'text' : 'password'}
              error={Boolean(errors.password)}
              slotProps={{
                input: {
                  inputProps: { autoComplete: 'current-password' },
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end" sx={{ cursor: 'pointer' }} onClick={() => setIsPasswordVisible((visible) => !visible)}>
                      {isPasswordVisible ? <Visibility /> : <VisibilityOff />}
                    </InputAdornment>
                  )
                }
              }}
              sx={inputSx}
            />
            {errors.password?.message && <FormHelperText error>{String(errors.password.message)}</FormHelperText>}
          </Box>
        )}

        {otpSent && (
          <Box>
            <TextField
              id="outlined-otp"
              variant="outlined"
              {...register('otp', {
                ...otpSchema,
                maxLength: { value: 6, message: 'OTP must be exactly 6 characters' },
                pattern: { value: /^\d{6}$/, message: 'Enter a valid 6 digit OTP' }
              })}
              placeholder={t('auth.otpPlaceholder')}
              fullWidth
              label={t('auth.otpLabel')}
              error={Boolean(errors.otp)}
              disabled={isOtpExpired}
              slotProps={{ input: { inputProps: { maxLength: 6, inputMode: 'numeric', autoComplete: 'one-time-code' } } }}
              sx={inputSx}
            />
            {errors.otp?.message && <FormHelperText error>{String(errors.otp.message)}</FormHelperText>}
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              <Button size="small" variant="text" onClick={handleResendOtp} sx={{ minWidth: 'auto', p: 0 }}>
                {t('auth.resendOtp')}
              </Button>
              <Typography
                variant="caption"
                sx={{
                  color: isOtpExpired ? 'error.main' : getTimerColor(remainingSeconds),
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
              >
                {isOtpExpired ? t('auth.otpExpired') : `${t('auth.otpExpiresIn')} ${formatTimer(remainingSeconds)}`}
              </Typography>
            </Stack>
          </Box>
        )}

        {otpSent && (
          <Box>
            <Box
              ref={turnstileRef}
              sx={{
                minHeight: 65,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid',
                borderColor: captchaReady ? 'success.light' : 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper'
              }}
            />
            {!turnstileSiteKey && <FormHelperText error>Turnstile site key is missing. Add TURNSTILE_SITE_KEY in .env.</FormHelperText>}
            {turnstileSiteKey && !captchaToken && !isOtpExpired && <FormHelperText>{t('auth.humanPending')}</FormHelperText>}
            {captchaToken && (
              <FormHelperText sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} component="div">
                <VerifiedUserOutlined fontSize="small" color="success" /> {t('auth.humanDone')}
              </FormHelperText>
            )}
          </Box>
        )}

        {isOtpExpired && <Alert severity="warning">{t('auth.otpExpiredFull')}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        </Stack>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading || (otpSent && (!captchaToken || isOtpExpired))}
          endIcon={loading ? <CircularProgress color="secondary" size={16} /> : null}
          sx={{
            minWidth: 120,
            mt: { xs: 2, sm: 3 },
            bgcolor: '#103c5c',
            '&:hover': { bgcolor: '#0c314b' },
            '& .MuiButton-endIcon': { ml: 1 }
          }}
        >
          {otpSent ? t('auth.verifyOtp') : t('auth.sendOtp')}
        </Button>
    </form>
  );
}

AuthLogin.propTypes = { inputSx: PropTypes.any };
