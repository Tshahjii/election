// ==============================|| OVERRIDES - CSS BASELINE ||============================== //

export default function CssBaseline(theme) {
  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary
        },
        '.MuiTableCell-root': {
          color: theme.palette.text.primary,
          borderColor: theme.palette.divider
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
