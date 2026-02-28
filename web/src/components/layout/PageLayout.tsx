import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface PageLayoutProps {
    children: ReactNode;
    toolbar?: ReactNode;
    header?: ReactNode;
    floatingAction?: ReactNode;
    bottomBar?: ReactNode;
    className?: string;
    noPadding?: boolean;
}

export const PageLayout = ({
    children,
    header,
    toolbar,
    floatingAction,
    bottomBar,
    className,
    noPadding = false
}: PageLayoutProps) => {
    return (
        <div className={cn("flex flex-col h-full bg-secondary", className)}>
            {/* Sticky Header */}
            {(header || toolbar) && (
                <div className="bg-card border-b border-border shadow-sm w-full shrink-0 z-toolbar relative pt-tma-safe">
                    {header || toolbar}
                </div>
            )}

            {/* Main Content */}
            <main className={cn(
                "flex-1 overflow-y-auto overflow-x-hidden transition-all relative",
                !noPadding && "p-3",
                !noPadding && "pb-4"
            )}>
                <div className="mx-auto w-full max-w-screen-xl relative">
                    {children}
                </div>
            </main>

            {/* Bottom Bar */}
            {bottomBar && (
                <div className="w-full shrink-0 z-drawer bg-card border-t border-border pb-tma-safe">
                    {bottomBar}
                </div>
            )}

            {/* Floating Action */}
            {floatingAction && (
                <div
                    className="fixed right-4 z-fab"
                    style={{ bottom: 'calc(var(--nav-h) + 24px + var(--tma-safe-bottom))' }}
                >
                    {floatingAction}
                </div>
            )}
        </div>
    );
};
