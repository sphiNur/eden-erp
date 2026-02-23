import App from '../App.tsx';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * Root fallback UI
 */
function ErrorFallback({ error }: { error: unknown }) {
    return (
        <div className="p-6 bg-destructive/10 text-destructive rounded-lg m-4 shadow-sm border border-border">
            <h2 className="text-xl font-bold mb-2">Application Error</h2>
            <p className="mb-4 opacity-80 underline">An unexpected error occurred during initialization or runtime.</p>
            <blockquote className="p-3 bg-muted/50 rounded code text-sm font-mono overflow-auto max-h-40 mb-4 text-foreground">
                <code>
                    {error instanceof Error
                        ? error.message
                        : typeof error === 'string'
                            ? error
                            : JSON.stringify(error)}
                </code>
            </blockquote>
            <div className="flex gap-2">
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md font-medium active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    Reload App
                </button>
                <button
                    onClick={() => (window.location.href = '/')}
                    className="px-4 py-2 bg-card text-destructive border border-border rounded-md font-medium active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    Reset
                </button>
            </div>
        </div>
    );
}

/**
 * Root component that wraps the app with required providers and boundaries.
 * Note: SDKProvider removed in v3.x in favor of direct init() call in main.tsx.
 */
export function Root() {
    return (
        <ErrorBoundary fallback={ErrorFallback}>
            <App />
        </ErrorBoundary>
    );
}
