import { useState } from 'react';
import PropTypes from 'prop-types';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// project imports
import { useAppPreferences } from 'contexts/AppPreferences';

// assets
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import PaletteOutlined from '@mui/icons-material/PaletteOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';

const accentOptions = [
  { value: 'blue', label: 'Blue', color: '#1f6feb' },
  { value: 'green', label: 'Green', color: '#15803d' },
  { value: 'maroon', label: 'Maroon', color: '#70424d' },
  { value: 'indigo', label: 'Indigo', color: '#4338ca' },
  { value: 'teal', label: 'Teal', color: '#0f766e' },
  { value: 'saffron', label: 'Saffron', color: '#b45309' }
];

export default function AppCustomizer({ inverse = false }) {
  const {
    accentColor,
    setAccentColor,
    language,
    setLanguage,
    layoutDensity,
    setLayoutDensity,
    themeMode,
    setThemeMode,
    fontScale,
    setFontScale,
    resetPreferences,
    t
  } = useAppPreferences();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title={t('customizer.title')}>
        <IconButton
          size="small"
          onClick={() => setOpen(true)}
          sx={{
            color: inverse ? 'common.white' : 'text.primary',
            border: '1px solid',
            borderColor: inverse ? 'rgba(255,255,255,0.45)' : 'divider'
          }}
        >
          <TuneOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: { xs: 300, sm: 360 }, p: 2.5 }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
              <PaletteOutlined color="primary" />
              <Typography variant="h3">{t('customizer.title')}</Typography>
            </Stack>
            <IconButton onClick={() => setOpen(false)}>
              <CloseOutlined />
            </IconButton>
          </Stack>

          <Stack sx={{ gap: 3 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('customizer.themeMode')}
              </Typography>
              <ToggleButtonGroup value={themeMode} exclusive fullWidth onChange={(_, value) => value && setThemeMode(value)}>
                <ToggleButton value="light">{t('controls.light')}</ToggleButton>
                <ToggleButton value="dark">{t('controls.dark')}</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('customizer.accentColor')}
              </Typography>
              <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                {accentOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={accentColor === option.value ? 'contained' : 'outlined'}
                    onClick={() => setAccentColor(option.value)}
                    startIcon={<Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: option.color }} />}
                    sx={{ minWidth: 104, flex: '1 1 30%' }}
                  >
                    {option.label}
                  </Button>
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('customizer.language')}
              </Typography>
              <ToggleButtonGroup value={language} exclusive fullWidth onChange={(_, value) => value && setLanguage(value)}>
                <ToggleButton value="en">{t('controls.english')}</ToggleButton>
                <ToggleButton value="hi">{t('controls.hindi')}</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('customizer.layoutDensity')}
              </Typography>
              <ToggleButtonGroup value={layoutDensity} exclusive fullWidth onChange={(_, value) => value && setLayoutDensity(value)}>
                <ToggleButton value="comfortable">{t('customizer.comfort')}</ToggleButton>
                <ToggleButton value="compact">{t('customizer.compact')}</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('customizer.fontSize')}
              </Typography>
              <ToggleButtonGroup value={fontScale} exclusive fullWidth onChange={(_, value) => value && setFontScale(value)}>
                <ToggleButton value="normal">{t('customizer.normal')}</ToggleButton>
                <ToggleButton value="large">{t('customizer.large')}</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Button variant="outlined" color="inherit" onClick={resetPreferences}>
              {t('customizer.reset')}
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}

AppCustomizer.propTypes = {
  inverse: PropTypes.bool
};
