import { ErrorView } from 'components/RouteError';

export default function ErrorPage() {
  let parsedError = null;

  try {
    const storedError = sessionStorage.getItem('app_last_error');
    parsedError = storedError ? JSON.parse(storedError) : null;
  } catch {
    parsedError = null;
  }

  return <ErrorView message={parsedError?.message} />;
}
