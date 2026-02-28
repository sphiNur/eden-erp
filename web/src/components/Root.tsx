import App from '../App.tsx';
import { ErrorBoundary } from './ErrorBoundary';

function ErrorFallback({ error }: { error: unknown }) {
    return (
        <div className="p-6 bg-destructive/10 text-destructive rounded-lg m-4 shadow-sm border border-destructive/20">
            <h2 className="text-xl font-bold mb-2">Application Error</h2>
            <p className="mb-4 opacity-80">An unexpected error occurred during initialization or runtime.</p>
            <blockquote className="p-3 bg-card/50 rounded text-sm font-mono overflow-auto max-h-40 mb-4 text-foreground">
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
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md font-medium active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    Reload App
                </button>
                <button
                    type="button"
                    onClick={() => window.location.href = '/'}
                    className="px-4 py-2 bg-card text-destructive border border-border rounded-md font-medium active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    Reset
                </button>
            </div>
        </div>
    );
}

export function Root() {
    return (
        <ErrorBoundary fallback={ErrorFallback}>
            <App />
        </ErrorBoundary>
    );
}
