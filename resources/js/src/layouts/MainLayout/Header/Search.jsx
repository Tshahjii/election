import { useEffect, useMemo, useRef, useState } from 'react';

// material-ui
import { alpha, useMediaQuery, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third party
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// project imports
import apiClient from 'api/client';
import menuItems from 'menu-items';
import { filterMenuByAccess } from 'utils/access';

// assets
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

const fallbackDescriptions = {
  'dashboard-overview': 'Election dashboard, turnout summary, monitoring and priority work overview.',
  'voter-list': 'Search and manage voter records in the voter management module.',
  'master-country': 'Manage country master data used by districts, states and offices.',
  'master-state': 'Manage state names, codes and uploaded state logo images.',
  'master-district': 'Manage district master records and district level setup.',
  'master-office': 'Manage office name, company name, office type and jurisdiction.',
  'access-management': 'Create users, assign roles and manage module permissions.'
};

const color = 'grey.100';

// ==============================|| SEARCH ||============================== //

export default function Search() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const inputRef = useRef(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const [query, setQuery] = useState('');
  const [recordResults, setRecordResults] = useState([]);

  const searchableItems = useMemo(() => {
    const flatten = (items, group = '') =>
      items.flatMap((item) => {
        const title = item.title || item.id;
        const nextGroup = item.type === 'group' || item.type === 'collapse' ? title : group;

        if (item.children) {
          return flatten(item.children, nextGroup);
        }

        if (!item.url) {
          return [];
        }

        return [{
          id: item.id,
          title,
          group,
          url: item.url,
          description: fallbackDescriptions[item.id] || `${title} page in ${group || 'Election Portal'}.`
        }];
      });

    return flatten(filterMenuByAccess(menuItems.items, user));
  }, [user]);

  const menuResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];

    return searchableItems
      .filter((item) => `${item.title} ${item.group} ${item.url} ${item.description}`.toLowerCase().includes(term))
      .slice(0, 5);
  }, [query, searchableItems]);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setRecordResults([]);
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await apiClient.get('/masters/search', {
          params: { q: term },
          signal: controller.signal
        });
        setRecordResults(response.data.data || []);
      } catch (error) {
        if (error.name !== 'CanceledError') {
          setRecordResults([]);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const results = useMemo(() => [...menuResults, ...recordResults].slice(0, 12), [menuResults, recordResults]);

  const open = Boolean(anchorEl) && query.trim() !== '';

  const handleNavigate = (url) => {
    navigate(url);
    setQuery('');
    setAnchorEl(null);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && results[0]) {
      handleNavigate(results[0].url);
    }

    if (event.key === 'Escape') {
      setQuery('');
      setAnchorEl(null);
    }
  };

  const searchField = (
    <TextField
      inputRef={inputRef}
      autoFocus={isMobile}
      placeholder="Search in election portal"
      size="small"
      value={query}
      onChange={(event) => {
        setQuery(event.target.value);
        setAnchorEl(event.currentTarget);
      }}
      onFocus={(event) => setAnchorEl(event.currentTarget)}
      onKeyDown={handleKeyDown}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color }} />
            </InputAdornment>
          ),
          endAdornment: query ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setQuery('')}>
                <CloseIcon sx={{ color }} fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null
        }
      }}
      sx={{
        width: { xs: 1, sm: 250, md: 330 },
        bgcolor: alpha(theme.palette.common.white, 0.14),
        ':hover': { bgcolor: alpha(theme.palette.common.white, 0.2) },
        borderRadius: 1,
        '& .MuiInputBase-input': { color: 'grey.100' },
        '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
      }}
    />
  );

  const resultList = (
    <Paper sx={{ mt: 1, width: { xs: 'calc(100vw - 24px)', sm: 480 }, maxHeight: 440, overflow: 'auto', boxShadow: theme.shadows[10], borderRadius: 1.5 }}>
      <Stack sx={{ py: 0.75 }}>
        {results.length ? results.map((item) => (
          <Box
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => handleNavigate(item.url)}
            onKeyDown={(event) => event.key === 'Enter' && handleNavigate(item.url)}
            sx={{
              px: 2,
              py: 1.25,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <Typography variant="subtitle2" color="primary.main">
              {item.title}
            </Typography>
            <Link component="span" underline="none" sx={{ display: 'block', fontSize: 12, color: 'success.dark', lineHeight: 1.4 }}>
              {window.location.origin}{item.url}
            </Link>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {item.description}
            </Typography>
          </Box>
        )) : (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2">No result found</Typography>
            <Typography variant="body2" color="text.secondary">
              Try searching dashboard, voters, state, district, office or users.
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );

  return (
    <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
      <Box sx={{ mr: { xs: 0, sm: 2 }, width: { xs: 1, sm: 'auto' } }}>
        {isMobile ? (
          <IconButton size="small" onClick={(event) => setAnchorEl(anchorEl ? null : event.currentTarget)}>
            <SearchIcon sx={{ color }} />
          </IconButton>
        ) : searchField}

        {isMobile && anchorEl && (
          <Paper sx={{ position: 'fixed', top: 70, left: 12, right: 12, zIndex: 1300, p: 1.25 }}>
            {searchField}
          </Paper>
        )}

        <Popper open={open} anchorEl={isMobile ? inputRef.current : anchorEl} placement="bottom-start" sx={{ zIndex: 1400 }}>
          {resultList}
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}
