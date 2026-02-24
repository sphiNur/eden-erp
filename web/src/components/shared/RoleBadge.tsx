import { getRoleMetadata } from '../../constants/roles';
import { cn } from '../../lib/utils';

interface RoleBadgeProps {
    role: string;
    showLabel?: boolean;
    className?: string;
}

export const RoleBadge = ({ role, showLabel = true, className }: RoleBadgeProps) => {
    const meta = getRoleMetadata(role);
    const Icon = meta.icon;

    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            <Icon className={cn("h-4 w-4", meta.color)} />
            {showLabel && (
                <span className="text-[11px] text-muted-foreground capitalize">{meta.label}</span>
            )}
        </div>
    );
};
