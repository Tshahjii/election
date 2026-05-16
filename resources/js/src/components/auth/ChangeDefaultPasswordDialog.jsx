import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormHelperText from '@mui/material/FormHelperText';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// project imports
import { changePassword, clearAuthError } from 'store/slices/authSlice';
import { strengthColor, strengthIndicator } from 'utils/passwordStrength';

const defaultPassword = 'Admin@123';

export default function ChangeDefaultPasswordDialog() {
  const dispatch = useDispatch();
  const { error, loading, user } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState({
    old_password: defaultPassword,
    password: '',
    password_confirmation: ''
  });
  const [formError, setFormError] = useState('');
  const passwordScore = strengthIndicator(form.password);
  const passwordLevel = strengthColor(passwordScore);
  const passwordProgress = Math.min(passwordScore * 20, 100);

  useEffect(() => {
    if (user?.must_change_password) {
      setOpen(true);
    }
  }, [user?.must_change_password]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setFormError('');
    dispatch(clearAuthError());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage('');

    if (form.password !== form.password_confirmation) {
      setFormError('New password and confirm password must match.');
      return;
    }

    if (form.password === defaultPassword) {
      setFormError('New password must be different from the default password.');
      return;
    }

    if (passwordScore < 5) {
      setFormError('Password must be strong: 8+ characters with uppercase, lowercase, number and special character.');
      return;
    }

    try {
      const response = await dispatch(changePassword(form)).unwrap();
      setSuccessMessage(response.message || 'Password changed successfully.');
      setOpen(false);
      setForm({
        old_password: defaultPassword,
        password: '',
        password_confirmation: ''
      });
    } catch {
      // Error is already handled by Redux alert/toast state.
    }
  };

  return (
    <Dialog open={open} maxWidth="xs" fullWidth disableEscapeKeyDown>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Change Default Password</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, pt: 1 }}>
            <Alert severity="warning">Your account is using the default password. Please change it to continue securely.</Alert>
            {successMessage && <Alert severity="success">{successMessage}</Alert>}
            {(formError || error) && <Alert severity="error">{formError || error}</Alert>}

            <TextField
              name="old_password"
              label="Old Password"
              type="password"
              value={form.old_password}
              onChange={handleChange}
              fullWidth
              required
              inputProps={{ autoComplete: 'current-password' }}
            />
            <TextField
              name="password"
              label="New Password"
              type="password"
              value={form.password}
              onChange={handleChange}
              fullWidth
              required
              inputProps={{ autoComplete: 'new-password' }}
            />
            <Box>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                <Typography variant="caption" color="text.secondary">
                  Password strength
                </Typography>
                <Typography variant="caption" sx={{ color: passwordLevel.color, fontWeight: 600 }}>
                  {passwordLevel.label}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={passwordProgress}
                sx={{
                  height: 8,
                  borderRadius: 1,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': { bgcolor: passwordLevel.color }
                }}
              />
              <FormHelperText>
                Use at least 8 characters with uppercase, lowercase, number and special character.
              </FormHelperText>
            </Box>
            <TextField
              name="password_confirmation"
              label="Confirm Password"
              type="password"
              value={form.password_confirmation}
              onChange={handleChange}
              fullWidth
              required
              inputProps={{ autoComplete: 'new-password' }}
            />
            <FormHelperText>Password change ke baad aap dashboard par logged in rahenge.</FormHelperText>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button type="submit" variant="contained" disabled={loading} endIcon={loading ? <CircularProgress color="secondary" size={16} /> : null}>
            Change Password
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
