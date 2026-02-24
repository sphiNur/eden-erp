import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
    title?: ReactNode;
    startAction?: ReactNode;
    endAction?: ReactNode;
    bottomClass?: string;
    children?: ReactNode;
    className?: string;
}

export const PageHeader = ({
    title,
    startAction,
    endAction,
    children,
    className,
}: PageHeaderProps) => {
    const showTopRow = title || startAction || endAction;

    return (
        <div className={cn("bg-card w-full", className)}>
            {showTopRow && (
                <div className="flex items-center justify-between px-3 py-2 min-h-[50px] min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {startAction && <div className="shrink-0">{startAction}</div>}
                        {title && <div className="font-bold text-lg leading-tight truncate">{title}</div>}
                    </div>
                    {endAction && <div className="flex items-center gap-2 shrink-0 ml-3">{endAction}</div>}
                </div>
            )}
            {children && <div className="px-3 pb-2">{children}</div>}
        </div>
    );
};
