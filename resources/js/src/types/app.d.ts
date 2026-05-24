import type { AppDispatch, RootState } from 'store';
import type * as React from 'react';

declare module 'react-redux' {
  export function useDispatch<TDispatch = AppDispatch>(): TDispatch;
  export function useSelector<TSelected = unknown>(
    selector: (state: RootState) => TSelected,
    equalityFn?: (left: TSelected, right: TSelected) => boolean
  ): TSelected;
}

declare global {
  interface Window {
    turnstile?: {
      render: (...args: any[]) => string;
      reset: (...args: any[]) => void;
      remove: (...args: any[]) => void;
    };
  }
}

declare module '@mui/material/styles' {
  interface PaletteColor {
    darker?: string;
  }

  interface TypographyVariants {
    menuCaption: React.CSSProperties;
    subMenuCaption: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    menuCaption?: React.CSSProperties;
    subMenuCaption?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyOwnProps {
    display?: any;
  }
}
