import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface SegmentOption<T extends string> {
    value: T;
    label: string;
    icon?: ReactNode;
}

interface SegmentControlProps<T extends string> {
    options: SegmentOption<T>[];
    value: T;
    onChange: (value: T) => void;
    className?: string;
    /** Accessibility label for the group */
    'aria-label'?: string;
}

/**
 * Two-or-more option segment control (e.g. Shopping / Distribution, By Store / By Vendor).
 * Uses design tokens and focus-visible ring.
 */
export function SegmentControl<T extends string>({
    options,
    value,
    onChange,
    className,
    'aria-label': ariaLabel = 'Options',
}: SegmentControlProps<T>) {
    return (
        <div
            className={cn('flex bg-accent/50 p-1 rounded-xl', className)}
            role="tablist"
            aria-label={ariaLabel}
        >
            {options.map((opt) => {
                const isActive = value === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            'flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-[13px] font-semibold transition-all',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            isActive
                                ? 'bg-card text-primary shadow-sm ring-1 ring-border'
                                : 'text-muted-foreground hover:bg-accent'
                        )}
                    >
                        {opt.icon}
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}
