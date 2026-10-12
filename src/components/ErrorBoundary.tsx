import { Alert, AlertActions, AlertButton, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Component, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  /** Plural noun for what this guards, used in the error copy (e.g. "files"). */
  label: string;
  /** When this changes, a shown error is cleared and the children are tried again (e.g. the selected asset). */
  resetKey?: string;
  children: ReactNode;
};

type ErrorBoundaryState = { failed: boolean };

/**
 * Keeps a render error in one part of the page from blanking the whole app. React only supports
 * this as a class component. The error itself is logged by React; this only decides what to show.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidUpdate(previous: ErrorBoundaryProps) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.reset();
  }

  private reset = () => this.setState({ failed: false });

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <Alert variant="error">
        <AlertTitle>Something went wrong in {this.props.label}</AlertTitle>
        <AlertDescription>This part of the page could not be shown. The rest of the app still works.</AlertDescription>
        <AlertActions>
          <AlertButton onClick={this.reset}>Try again</AlertButton>
        </AlertActions>
      </Alert>
    );
  }
}
