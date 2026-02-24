import { cn } from '../../lib/utils';

interface SkeletonProps {
    className?: string;
}

/**
 * Base shimmer skeleton block.
 */
export const Skeleton = ({ className }: SkeletonProps) => (
    <div className={cn("animate-pulse bg-muted rounded", className)} aria-hidden />
);

/**
 * Skeleton preset for a product list page (toolbar + 8 rows).
 */
export const ProductListSkeleton = () => (
    <div className="bg-secondary">
        {/* Toolbar skeleton */}
        <div className="bg-card border-b border-border p-4 space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <div className="flex gap-2">
                <Skeleton className="h-8 w-16 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-16 rounded-full" />
            </div>
        </div>

        {/* List skeleton */}
        <div className="p-4 space-y-4">
            {/* Category label */}
            <Skeleton className="h-3 w-20" />

            <div className="bg-card rounded-lg border border-border overflow-hidden divide-y divide-border">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="p-3 flex items-center justify-between">
                        <div className="flex-1 flex items-center gap-3">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);
