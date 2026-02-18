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
    header,
    // @deprecated use header instead
    toolbar,
    floatingAction,
    className,
    noPadding = false
}: PageLayoutProps & { header?: ReactNode }) => {
    return (
        <div className={cn("flex flex-col h-full bg-gray-50", className)}>
            {/* Unified Sticky Header */}
            {(header || toolbar) && (
                <div className="sticky top-0 z-toolbar bg-white border-b shadow-sm w-full shrink-0">
                    {header || toolbar}
                </div>
            )}

            {/* Main Content */}
            <main className={cn(
                "flex-1 overflow-y-auto overflow-x-hidden",
                !noPadding && "p-3 pb-24" // Default padding + bottom space for FAB/Nav
            )}>
                <div className="mx-auto w-full max-w-screen-xl">
                    {children}
                </div>
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
