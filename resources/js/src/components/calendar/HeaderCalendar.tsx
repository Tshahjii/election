import { useState } from 'react';
import PropTypes from 'prop-types';

import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import CalendarMonthTwoToneIcon from '@mui/icons-material/CalendarMonthTwoTone';

import CalendarDialog from './CalendarDialog';

export default function HeaderCalendar({ inverse = true }) {
  const [open, setOpen] = useState(false);

  return (
    <Box>
      <Tooltip title="Calendar">
        <IconButton size="small" onClick={() => setOpen(true)} aria-label="open calendar">
          <Badge color="error" variant="dot" overlap="circular">
            <CalendarMonthTwoToneIcon sx={{ fontSize: { xs: 22, sm: 24 }, color: inverse ? 'common.white' : 'text.primary' }} />
          </Badge>
        </IconButton>
      </Tooltip>
      <CalendarDialog open={open} onClose={() => setOpen(false)} />
    </Box>
  );
}

HeaderCalendar.propTypes = { inverse: PropTypes.bool };
