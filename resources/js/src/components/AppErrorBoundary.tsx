import { Component, ReactNode } from 'react';
import { ErrorView } from './RouteError';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Application render error', error);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorView />;
    }

    return this.props.children;
  }
}
