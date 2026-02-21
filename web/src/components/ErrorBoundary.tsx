import { Component, type GetDerivedStateFromError, type ReactNode } from 'react';

export interface ErrorBoundaryProps {
    children: ReactNode;
    fallback: (props: { error: unknown }) => ReactNode;
}

interface ErrorBoundaryState {
    error: unknown;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { error: null };

    static getDerivedStateFromError: GetDerivedStateFromError<ErrorBoundaryProps, ErrorBoundaryState> = (error) => ({ error });

    componentDidCatch(error: unknown) {
        this.setState({ error });
    }

    render() {
        const { state, props } = this;

        return state.error ? props.fallback({ error: state.error }) : props.children;
    }
}
