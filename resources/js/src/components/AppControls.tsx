import PropTypes from 'prop-types';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

// project imports
import AppCustomizer from './AppCustomizer';
import { useAppPreferences } from 'contexts/AppPreferences';

// assets
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LanguageOutlined from '@mui/icons-material/LanguageOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';

export function LanguageToggle({ inverse = false }) {
  const { language, setLanguage, t } = useAppPreferences();
  const isHindi = language === 'hi';

  return (
    <Tooltip title={t('controls.language')}>
      <Button
        size="small"
        variant="outlined"
        startIcon={<LanguageOutlined />}
        onClick={() => setLanguage(isHindi ? 'en' : 'hi')}
        sx={{
          minWidth: { xs: 54, sm: 86 },
          color: inverse ? 'common.white' : 'text.primary',
          borderColor: inverse ? 'rgba(255,255,255,0.55)' : 'divider',
          px: { xs: 0.6, sm: 1.25 },
          '& .MuiButton-startIcon': { mr: { xs: 0.5, sm: 0.5 } },
          '&:hover': { borderColor: inverse ? 'common.white' : 'primary.main' }
        }}
      >
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
          {isHindi ? t('controls.hindi') : t('controls.english')}
        </Box>
        <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
          {isHindi ? 'HI' : 'EN'}
        </Box>
      </Button>
    </Tooltip>
  );
}

LanguageToggle.propTypes = { inverse: PropTypes.bool };

export function ThemeModeToggle({ inverse = false }) {
  const { themeMode, setThemeMode, t } = useAppPreferences();
  const isDark = themeMode === 'dark';

  return (
    <Tooltip title={t('controls.theme')}>
      <Button
        size="small"
        variant="outlined"
        startIcon={isDark ? <DarkModeOutlined /> : <LightModeOutlined />}
        onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
        sx={{
          minWidth: { xs: 36, sm: 78 },
          color: inverse ? 'common.white' : 'text.primary',
          borderColor: inverse ? 'rgba(255,255,255,0.55)' : 'divider',
          px: { xs: 0.6, sm: 1.25 },
          '& .MuiButton-startIcon': { mr: { xs: 0, sm: 0.5 } },
          '&:hover': { borderColor: inverse ? 'common.white' : 'primary.main' }
        }}
      >
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
          {isDark ? t('controls.dark') : t('controls.light')}
        </Box>
      </Button>
    </Tooltip>
  );
}

ThemeModeToggle.propTypes = { inverse: PropTypes.bool };

export default function AppControls({ showTheme = false, inverse = false }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'nowrap' }}>
      <LanguageToggle inverse={inverse} />
      {showTheme && <ThemeModeToggle inverse={inverse} />}
      <AppCustomizer inverse={inverse} />
    </Stack>
  );
}

AppControls.propTypes = {
  showTheme: PropTypes.bool,
  inverse: PropTypes.bool
};
