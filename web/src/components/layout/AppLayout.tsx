import { Outlet } from 'react-router-dom';
import { BottomTabBar } from './BottomTabBar';

export const AppLayout = () => {
    return (
        <div className="flex h-[100dvh] w-full flex-col bg-background overflow-hidden relative">
            {/* Main content — top/bottom padding from TMA safe area (no fixed header) */}
            <main
                className="flex-1 flex flex-col min-h-0 relative isolate"
                style={{
                    paddingTop: 'calc(var(--tma-safe-top) + var(--tma-content-top))',
                    paddingBottom: 'var(--nav-h)',
                }}
            >
                <div className="mx-auto w-full max-w-[1400px] flex-1 flex flex-col min-h-0 relative">
                    <Outlet />
                </div>
            </main>

            {/* Universal bottom tab bar — visible for all authenticated users */}
            <div className="lg:hidden shrink-0">
                <BottomTabBar />
            </div>
        </div>
    );
};
