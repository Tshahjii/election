import PropTypes from 'prop-types';

import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import CalendarMonthTwoToneIcon from '@mui/icons-material/CalendarMonthTwoTone';

export default function HeaderCalendar({ inverse = true, onOpen }) {
  return (
    <Box>
      <Tooltip title="Calendar">
        <IconButton size="small" onClick={onOpen} aria-label="open calendar">
          <Badge color="error" variant="dot" overlap="circular">
            <CalendarMonthTwoToneIcon sx={{ fontSize: { xs: 22, sm: 24 }, color: inverse ? 'common.white' : 'text.primary' }} />
          </Badge>
        </IconButton>
      </Tooltip>
    </Box>
  );
}

HeaderCalendar.propTypes = { inverse: PropTypes.bool, onOpen: PropTypes.func };
