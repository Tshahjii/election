import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { Box, Button, Container, Typography } from '@mui/material';

export default function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error?.message || 'Unable to load this page. Please try again.';

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', py: 4, px: 3, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 3 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {message}
        </Typography>
        <Button component={Link} to="/" variant="contained" color="primary">
          Go to login
        </Button>
      </Box>
    </Container>
  );
}
