// ==============================|| OVERRIDES - CSS BASELINE ||============================== //

export default function CssBaseline(theme) {
  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          minWidth: 0,
          overflowX: 'hidden'
        },
        '#root': {
          minWidth: 0,
          overflowX: 'hidden'
        },
        '*': {
          boxSizing: 'border-box'
        },
        '.MuiTableCell-root': {
          color: theme.palette.text.primary,
          borderColor: theme.palette.divider
        },
        '.MuiTableContainer-root': {
          width: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        },
        '.MuiCardHeader-root': {
          minWidth: 0
        },
        '.MuiCardHeader-content': {
          minWidth: 0
        },
        '.MuiCardHeader-title': {
          overflowWrap: 'break-word'
        },
        '.MuiInputBase-root, .MuiOutlinedInput-root': {
          color: theme.palette.text.primary
        },
        '.MuiSelect-icon, .MuiSvgIcon-root': {
          color: 'inherit'
        },
        '.apexcharts-text, .apexcharts-legend-text': {
          fill: `${theme.palette.text.secondary} !important`,
          color: `${theme.palette.text.secondary} !important`
        },
        '.apexcharts-tooltip, .apexcharts-tooltip-title': {
          background: `${theme.palette.background.paper} !important`,
          color: `${theme.palette.text.primary} !important`,
          borderColor: `${theme.palette.divider} !important`
        }
      }
    }
  };
}
