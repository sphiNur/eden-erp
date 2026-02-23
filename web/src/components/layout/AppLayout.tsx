import { Outlet } from 'react-router-dom';
import { BottomTabBar } from './BottomTabBar';
import { useSignal, viewport } from '@telegram-apps/sdk-react';
import { useEffect } from 'react';

export const AppLayout = () => {
    // Phase 7: Explicit React binding for TMA Fullscreen Safe Areas.
    // CSS variables often fail to populate in time, causing occlusion. 
    // We explicitly extract them using the SDK here and inject them as high-priority `--dynamic-*` variables.
    const contentSafeAreaInsets = useSignal(viewport.contentSafeAreaInsets);
    const safeAreaInsets = useSignal(viewport.safeAreaInsets);

    useEffect(() => {
        const root = document.documentElement;

        // Content Safe Area (protects against Telegram UI overlapping like the Close button)
        if (contentSafeAreaInsets) {
            root.style.setProperty('--dynamic-safe-content-top', `${contentSafeAreaInsets.top}px`);
            root.style.setProperty('--dynamic-safe-content-bottom', `${contentSafeAreaInsets.bottom}px`);
            root.style.setProperty('--dynamic-safe-content-left', `${contentSafeAreaInsets.left}px`);
            root.style.setProperty('--dynamic-safe-content-right', `${contentSafeAreaInsets.right}px`);
        }

        // Hardware Safe Area (protects against physical OS notches / gesture bars)
        if (safeAreaInsets) {
            root.style.setProperty('--dynamic-safe-top', `${safeAreaInsets.top}px`);
            root.style.setProperty('--dynamic-safe-bottom', `${safeAreaInsets.bottom}px`);
            root.style.setProperty('--dynamic-safe-left', `${safeAreaInsets.left}px`);
            root.style.setProperty('--dynamic-safe-right', `${safeAreaInsets.right}px`);
        }
    }, [contentSafeAreaInsets, safeAreaInsets]);

    return (
        <div className="flex h-[100dvh] w-full flex-col bg-background overflow-hidden relative">
            {/* Main content — top/bottom padding from TMA safe area (no fixed header) */}
            <main
                className="flex-1 flex flex-col min-h-0 relative isolate"
                style={{
                    paddingTop: 'var(--tma-content-top)',
                    paddingBottom: 'var(--nav-h)',
                    paddingLeft: 'var(--tma-safe-left)',
                    paddingRight: 'var(--tma-safe-right)'
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
