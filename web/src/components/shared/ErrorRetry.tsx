import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

interface ErrorRetryProps {
    message: string;
    onRetry: () => void;
    retrying?: boolean;
}

/**
 * Error state with message and retry button.
 */
export const ErrorRetry = ({ message, onRetry, retrying }: ErrorRetryProps) => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <AlertTriangle size={48} className="text-red-300 mb-4" strokeWidth={1.5} />
        <h3 className="text-base font-semibold text-gray-700 mb-1">{message}</h3>
        <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-2"
            onClick={onRetry}
            disabled={retrying}
        >
            <RefreshCw size={14} className={retrying ? 'animate-spin' : ''} />
            {retrying ? '...' : 'Retry'}
        </Button>
    </div>
);
