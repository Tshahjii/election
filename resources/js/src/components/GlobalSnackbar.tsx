import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { hideNotification } from 'store/slices/notificationSlice';

const toastOptions = {
  duration: 3600,
  style: {
    border: '1px solid rgba(15, 23, 42, 0.08)',
    borderRadius: '14px',
    background: '#ffffff',
    boxShadow: '0 18px 45px rgba(15, 23, 42, 0.16)',
    color: '#172033',
    fontFamily: "'Poppins', 'Noto Sans Devanagari', 'Nirmala UI', sans-serif",
    fontSize: '0.9rem',
    lineHeight: 1.55,
    maxWidth: '420px',
    padding: '12px 14px'
  }
};

export default function GlobalSnackbar() {
  const dispatch = useDispatch();
  const { open, message, severity } = useSelector((state: any) => state.notification);

  useEffect(() => {
    if (open && message) {
      if (severity === 'success') {
        toast.success(message, toastOptions);
      } else if (severity === 'error') {
        toast.error(message, toastOptions);
      } else {
        toast(message, toastOptions);
      }
      dispatch(hideNotification());
    }
  }, [open, message, severity, dispatch]);

  return null;
}
