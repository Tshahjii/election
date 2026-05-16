import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useDispatch, useSelector } from 'react-redux';

import { hideNotification } from 'store/slices/notificationSlice';

export default function GlobalSnackbar() {
  const dispatch = useDispatch();
  const { open, message, severity } = useSelector((state) => state.notification);

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return;
    dispatch(hideNotification());
  };

  return (
    <Snackbar open={open} autoHideDuration={3500} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <Alert
        onClose={handleClose}
        severity={severity}
        variant="filled"
        sx={{ width: '100%', color: 'common.white', '& .MuiAlert-icon, & .MuiAlert-action': { color: 'common.white' } }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
