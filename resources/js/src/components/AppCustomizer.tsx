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
  { value: 'maroon', label: 'Maroon', color: '#a21caf' }
];

export default function AppCustomizer({ inverse = false }) {
  const { accentColor, setAccentColor, language, setLanguage, layoutDensity, setLayoutDensity, themeMode, setThemeMode } = useAppPreferences();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="Customize">
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
              <Typography variant="h3">Customizer</Typography>
            </Stack>
            <IconButton onClick={() => setOpen(false)}>
              <CloseOutlined />
            </IconButton>
          </Stack>

          <Stack sx={{ gap: 3 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Theme mode
              </Typography>
              <ToggleButtonGroup value={themeMode} exclusive fullWidth onChange={(_, value) => value && setThemeMode(value)}>
                <ToggleButton value="light">Light</ToggleButton>
                <ToggleButton value="dark">Dark</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Accent color
              </Typography>
              <Stack direction="row" sx={{ gap: 1 }}>
                {accentOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={accentColor === option.value ? 'contained' : 'outlined'}
                    onClick={() => setAccentColor(option.value)}
                    startIcon={<Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: option.color }} />}
                    sx={{ flex: 1 }}
                  >
                    {option.label}
                  </Button>
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Language
              </Typography>
              <ToggleButtonGroup value={language} exclusive fullWidth onChange={(_, value) => value && setLanguage(value)}>
                <ToggleButton value="en">English</ToggleButton>
                <ToggleButton value="hi">Hindi</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Layout density
              </Typography>
              <ToggleButtonGroup value={layoutDensity} exclusive fullWidth onChange={(_, value) => value && setLayoutDensity(value)}>
                <ToggleButton value="comfortable">Comfort</ToggleButton>
                <ToggleButton value="compact">Compact</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}

AppCustomizer.propTypes = {
  inverse: PropTypes.bool
};
