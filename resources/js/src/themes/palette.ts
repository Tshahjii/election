// ==============================|| DEFAULT - PALETTE ||============================== //

const accents = {
  blue: {
    lighter: '#dbe8f5',
    light: '#4f78a0',
    main: '#24527a',
    dark: '#153b5c',
    darker: '#0e2940',
    contrast: '#ffffff',
    secondary: '#3f6f58'
  },
  green: {
    lighter: '#e0eee7',
    light: '#5f8d76',
    main: '#2f6b4f',
    dark: '#234d3a',
    darker: '#173326',
    contrast: '#ffffff',
    secondary: '#7a5a2e'
  },
  maroon: {
    lighter: '#eee2e4',
    light: '#8f6670',
    main: '#70424d',
    dark: '#4d2c35',
    darker: '#321b22',
    contrast: '#ffffff',
    secondary: '#315f66'
  },
  indigo: {
    lighter: '#e0e7ff',
    light: '#6366f1',
    main: '#4338ca',
    dark: '#312e81',
    darker: '#1e1b4b',
    contrast: '#ffffff',
    secondary: '#0f766e'
  },
  teal: {
    lighter: '#ccfbf1',
    light: '#14b8a6',
    main: '#0f766e',
    dark: '#115e59',
    darker: '#134e4a',
    contrast: '#ffffff',
    secondary: '#7c3aed'
  },
  saffron: {
    lighter: '#ffedd5',
    light: '#f59e0b',
    main: '#b45309',
    dark: '#92400e',
    darker: '#78350f',
    contrast: '#ffffff',
    secondary: '#2563eb'
  }
};

export default function palette(mode, accentColor = 'blue') {
  const isDark = mode === 'dark';
  const accent = accents[accentColor] || accents.blue;
  const lightPalette = {
    common: {
      black: '#232b38'
    },
    primary: {
      lighter: accent.lighter,
      light: accent.light,
      main: accent.main,
      dark: accent.dark,
      darker: accent.darker,
      contrastText: accent.contrast,
      100: accent.light
    },
    secondary: {
      lighter: '#d9f3f0',
      light: '#5fc7bd',
      main: accent.secondary,
      dark: '#134e4a',
      darker: '#0f2f2d'
    },
    error: {
      lighter: '#fde4e2',
      light: '#ff625b',
      main: '#ec4333',
      dark: '#a20e00',
      darker: '#750800'
    },
    warning: {
      lighter: '#fef3d4',
      light: '#f8c256',
      main: '#f4a100',
      dark: '#aa7000',
      darker: '#754c00'
    },
    info: {
      lighter: '#d4f7f8',
      light: '#4de3e8',
      main: '#00cfd5',
      dark: '#009095',
      darker: '#005f63'
    },
    success: {
      lighter: '#d4f2e4',
      light: '#4fd29e',
      main: '#00ac69',
      dark: '#007849',
      darker: '#004e2e'
    },
    grey: {
      300: '#425466'
    },
    bg: {
      100: '#f8f8f9'
    },
    text: {
      primary: '#242c3a',
      secondary: '#a1a1a1',
      dark: '#12171e'
    },
    divider: '#dcdcdc',
    background: {
      paper: '#ffffff',
      default: '#f4f6f8'
    },
    menu: {
      hover: accent.lighter,
      selected: accent.main
    }
  };

  const darkPalette = {
    ...lightPalette,
    common: {
      black: '#050b12',
      white: '#ffffff'
    },
    grey: {
      300: '#8a97a8',
      500: '#65758a'
    },
    bg: {
      100: '#101927'
    },
    text: {
      primary: '#eef4ff',
      secondary: '#aebbd0',
      dark: '#ffffff'
    },
    divider: '#243246',
    background: {
      paper: '#111c2e',
      default: '#08111f'
    },
    menu: {
      hover: 'rgba(203,226,255,0.16)',
      selected: '#8bbcff'
    }
  };

  return {
    mode,
    ...(isDark ? darkPalette : lightPalette)
  };
}
