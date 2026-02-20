import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface PageLayoutProps {
    children: ReactNode;
    toolbar?: ReactNode;
    floatingAction?: ReactNode;
    bottomBar?: ReactNode;
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
    bottomBar,
    className,
    noPadding = false
}: PageLayoutProps & { header?: ReactNode; bottomBar?: ReactNode }) => {
    return (
        <div className={cn("flex flex-col h-full bg-gray-50", className)}>
            {/* Unified Sticky Header */}
            {(header || toolbar) && (
                <div className="bg-white border-b shadow-sm w-full shrink-0 z-toolbar relative">
                    {header || toolbar}
                </div>
            )}

            {/* Main Content */}
            <main className={cn(
                "flex-1 overflow-y-auto overflow-x-hidden transition-all relative",
                !noPadding && "p-3",
                floatingAction ? (bottomBar ? "pb-24" : "pb-20 pb-safe") : (!noPadding && "pb-safe pb-4")
            )}>
                <div className="mx-auto w-full max-w-screen-xl">
                    {children}
                </div>
            </main>

            {/* Bottom Bar (Fixed/Sticky behavior handled by parent or just stacked) */}
            {bottomBar && (
                <div className="w-full shrink-0 z-drawer bg-white border-t">
                    {bottomBar}
                </div>
            )}

            {/* Floating Action / Bottom Elements */}
            {floatingAction && (
                <div className="fixed bottom-20 right-4 z-fab">
                    {floatingAction}
                </div>
            )}
        </div>
    );
};
