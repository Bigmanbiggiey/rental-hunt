import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { logger } from '@/shared/lib/logger';
import { EmptyState } from './empty-state';

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

/**
 * coding-standards.md §7's "sanctioned class-component exception" — React's
 * error-boundary API (`getDerivedStateFromError`/`componentDidCatch`) has no
 * hook equivalent. One shared instance wraps each top-level layout's
 * `<Outlet/>` (never a bespoke boundary per feature, per §7's own rule),
 * catching render-time errors and rendering the standard empty-state anatomy
 * (`ui-guidelines.md` §19) instead of a blank white screen. Callers key this
 * component by the current route (e.g. `key={location.pathname}`) so
 * navigating away from the failed route remounts it and clears the caught
 * error — a plain error boundary has no built-in reset otherwise.
 */
export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  override state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // No PII in `meta` (coding-standards.md §22) — the error message/stack
    // and component stack only, never route params or user-entered content.
    logger.error('RouteErrorBoundary caught a render error', {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  override render() {
    if (this.state.hasError) {
      return (
        <EmptyState
          icon={AlertTriangle}
          heading="Something went wrong"
          description="This page ran into an unexpected error. Try reloading."
          action={{ label: 'Reload page', onClick: () => window.location.reload() }}
        />
      );
    }
    return this.props.children;
  }
}
