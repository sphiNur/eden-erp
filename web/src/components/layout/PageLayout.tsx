import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface PageLayoutProps {
    children: ReactNode;
    toolbar?: ReactNode;
    floatingAction?: ReactNode;
    className?: string;
    /**
     * If true, removes default padding from the main content area.
     * Useful for lists that need to go edge-to-edge.
     */
    noPadding?: boolean;
}

export const PageLayout = ({
    children,
    toolbar,
    floatingAction,
    className,
    noPadding = false
}: PageLayoutProps) => {
    return (
        <div className={cn("flex flex-col min-h-[calc(100vh-var(--header-h))] bg-gray-50", className)}>
            {/* Unified Sticky Toolbar */}
            {toolbar && (
                <div className="sticky top-header z-toolbar bg-white border-b shadow-sm w-full">
                    {toolbar}
                </div>
            )}

            {/* Main Content */}
            <main className={cn(
                "flex-1",
                !noPadding && "p-3 pb-24" // Default padding + bottom space for FAB/Nav
            )}>
                {children}
            </main>

            {/* Floating Action / Bottom Elements */}
            {floatingAction && (
                <div className="fixed bottom-20 right-4 z-fab">
                    {floatingAction}
                </div>
            )}
        </div>
    );
};
