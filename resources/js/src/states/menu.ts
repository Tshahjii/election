import { useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';

import store, { RootState } from 'store';
import { setActiveItem, setDrawerOpen } from 'store/slices/menuSlice';

export function useGetMenuMaster() {
  const menu = useSelector(
    (state: RootState) => ({
      openedItem: state.menu.openedItem,
      isDashboardDrawerOpened: state.menu.isDashboardDrawerOpened
    }),
    shallowEqual
  );

  return useMemo(
    () => ({
      menuMaster: menu,
      menuMasterLoading: false
    }),
    [menu]
  );
}

export function handlerDrawerOpen(isDashboardDrawerOpened: boolean) {
  store.dispatch(setDrawerOpen(isDashboardDrawerOpened));
}

export function handlerActiveItem(openedItem: string) {
  store.dispatch(setActiveItem(openedItem));
}
