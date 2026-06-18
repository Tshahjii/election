import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MenuState {
  openedItem: string;
  isDashboardDrawerOpened: boolean;
}

const initialState: MenuState = {
  openedItem: '',
  isDashboardDrawerOpened: false
};

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    setDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.isDashboardDrawerOpened = action.payload;
    },
    setActiveItem: (state, action: PayloadAction<string>) => {
      state.openedItem = action.payload;
    }
  }
});

export const { setDrawerOpen, setActiveItem } = menuSlice.actions;
export default menuSlice.reducer;
