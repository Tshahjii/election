import PropTypes from 'prop-types';

// material-ui
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const visiblePages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

  if (currentPage <= 4) {
    [2, 3, 4, 5].forEach((value) => visiblePages.add(value));
  }

  if (currentPage >= totalPages - 3) {
    [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1].forEach((value) => visiblePages.add(value));
  }

  const sortedPages = Array.from(visiblePages)
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((first, second) => first - second);

  return sortedPages.reduce((items, value, index) => {
    if (index > 0 && value - sortedPages[index - 1] > 1) {
      items.push(`ellipsis-${value}`);
    }

    items.push(value);
    return items;
  }, []);
}

export default function PaginationFooter({ page, rowsPerPage, totalRows, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const paginationItems = getPaginationItems(page, totalPages);
  const firstEntry = totalRows === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const lastEntry = Math.min(page * rowsPerPage, totalRows);

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: 1.5, mt: 2 }}
    >
      <Typography variant="body2" color="text.secondary">
        Showing {firstEntry} to {lastEntry} of {totalRows} entries
      </Typography>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-end' }, gap: 0.5, flexWrap: 'wrap' }}>
        <Button size="small" variant="outlined" color="inherit" disabled={page === 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
          Previous
        </Button>
        {paginationItems.map((item) =>
          typeof item === 'number' ? (
            <Button
              key={item}
              size="small"
              variant={page === item ? 'contained' : 'outlined'}
              color={page === item ? 'primary' : 'inherit'}
              onClick={() => onPageChange(item)}
              sx={{ minWidth: 34, width: 34, px: 0 }}
            >
              {item}
            </Button>
          ) : (
            <Typography key={item} variant="body2" color="text.secondary" sx={{ px: 0.5, minWidth: 18, textAlign: 'center' }}>
              ...
            </Typography>
          )
        )}
        <Button size="small" variant="outlined" color="inherit" disabled={page === totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))}>
          Next
        </Button>
      </Stack>
    </Stack>
  );
}

PaginationFooter.propTypes = {
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  totalRows: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired
};
