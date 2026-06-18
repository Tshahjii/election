import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { hideNotification } from 'store/slices/notificationSlice';

export default function GlobalSnackbar() {
  const dispatch = useDispatch();
  const { open, message, severity } = useSelector((state: any) => state.notification);

  useEffect(() => {
    if (open && message) {
      if (severity === 'success') {
        toast.success(message, {
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      } else if (severity === 'error') {
        toast.error(message, {
          style: {
            borderRadius: '10px',
            background: '#ef4444',
            color: '#fff',
          },
        });
      } else {
        toast(message, {
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      }
      dispatch(hideNotification());
    }
  }, [open, message, severity, dispatch]);

  return null;
}
