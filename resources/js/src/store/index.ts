import { configureStore } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import menuReducer from './slices/menuSlice';
import notificationReducer from './slices/notificationSlice';
import { apiSlice } from './apiSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    menu: menuReducer,
    notification: notificationReducer,
    [apiSlice.reducerPath]: apiSlice.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
