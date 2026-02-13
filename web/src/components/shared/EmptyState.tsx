import { LucideIcon, PackageSearch } from 'lucide-react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

/**
 * Generic empty state with icon, message, and optional action.
 */
export const EmptyState = ({
    icon: Icon = PackageSearch,
    title,
    description,
    action
}: EmptyStateProps) => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <Icon size={48} className="text-gray-300 mb-4" strokeWidth={1.5} />
        <h3 className="text-base font-semibold text-gray-500 mb-1">{title}</h3>
        {description && <p className="text-sm text-gray-400 max-w-xs">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
    </div>
);
