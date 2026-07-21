import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import apiClient from 'api/client';
import { showNotification } from './notificationSlice';

const token = localStorage.getItem('auth_token');

const errorMessage = (payload, fallback) =>
  payload?.message ||
  payload?.captcha_token?.[0] ||
  payload?.errors?.captcha_token?.[0] ||
  payload?.mobile?.[0] ||
  payload?.errors?.mobile?.[0] ||
  payload?.old_password?.[0] ||
  payload?.errors?.old_password?.[0] ||
  payload?.password?.[0] ||
  payload?.errors?.password?.[0] ||
  payload?.otp?.[0] ||
  payload?.errors?.otp?.[0] ||
  fallback;

export const sendLoginOtp = createAsyncThunk<any, any>('auth/sendOtp', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await apiClient.post('/auth/send-otp', payload);
    dispatch(showNotification({ message: data.message || 'OTP sent successfully.', severity: 'success' }));
    return data;
  } catch (error) {
    const response = error.response?.data || { message: 'Unable to send OTP.' };
    dispatch(showNotification({ message: errorMessage(response, 'Unable to send OTP.'), severity: 'error' }));
    return rejectWithValue(response);
  }
});

export const verifyLoginOtp = createAsyncThunk<any, any>('auth/verifyOtp', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await apiClient.post('/auth/verify-otp', payload);
    localStorage.setItem('auth_token', data.access_token);
    dispatch(showNotification({ message: 'Login verified successfully.', severity: 'success' }));
    return data;
  } catch (error) {
    const response = error.response?.data || { message: 'Unable to verify OTP.' };
    dispatch(showNotification({ message: errorMessage(response, 'Unable to verify OTP.'), severity: 'error' }));
    return rejectWithValue(response);
  }
});

export const fetchAuthUser = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.get('/auth/me');
    return data.user;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Session expired.' });
  }
});

export const changePassword = createAsyncThunk<any, any>('auth/changePassword', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await apiClient.post('/auth/change-password', payload);
    dispatch(showNotification({ message: data.message || 'Password changed successfully.', severity: 'success' }));
    return data;
  } catch (error) {
    const response = error.response?.data || { message: 'Unable to change password.' };
    dispatch(showNotification({ message: errorMessage(response, 'Unable to change password.'), severity: 'error' }));
    return rejectWithValue(response);
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { dispatch, rejectWithValue }) => {
  try {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('auth_token');
    dispatch(showNotification({ message: 'Logged out successfully.', severity: 'success' }));
    return true;
  } catch (error) {
    localStorage.removeItem('auth_token');
    const response = error.response?.data || { message: 'Logged out locally.' };
    dispatch(showNotification({ message: errorMessage(response, 'Logged out locally.'), severity: 'success' }));
    return rejectWithValue(response);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token,
    user: null,
    isAuthenticated: Boolean(token),
    loading: false,
    error: null,
    otpSent: false,
    otpMessage: null,
    otpExpiresAt: null
  },
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    resetOtpState: (state) => {
      state.otpSent = false;
      state.otpMessage = null;
      state.otpExpiresAt = null;
      state.error = null;
    },
    clearOtpMessage: (state) => {
      state.otpMessage = null;
    },
    expireOtpState: (state) => {
      state.otpMessage = 'OTP expired. Please resend OTP.';
      state.otpExpiresAt = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendLoginOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendLoginOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.otpSent = true;
        state.otpMessage = action.payload.message || 'OTP sent successfully.';
        state.otpExpiresAt = Date.now() + (action.payload.otp_expires_in || 120) * 1000;
      })
      .addCase(sendLoginOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = errorMessage(action.payload, 'Unable to send OTP.');
      })
      .addCase(verifyLoginOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyLoginOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.access_token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.otpSent = false;
        state.otpMessage = null;
        state.otpExpiresAt = null;
      })
      .addCase(verifyLoginOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = errorMessage(action.payload, 'OTP verification failed.');
      })
      .addCase(fetchAuthUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchAuthUser.rejected, (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = errorMessage(action.payload, 'Unable to change password.');
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.otpSent = false;
        state.otpMessage = null;
        state.otpExpiresAt = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.otpSent = false;
        state.otpMessage = null;
        state.otpExpiresAt = null;
      });
  }
});

export const { clearAuthError, resetOtpState, clearOtpMessage, expireOtpState } = authSlice.actions;
export default authSlice.reducer;
