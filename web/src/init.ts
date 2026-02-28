import {
    backButton,
    viewport,
    themeParams,
    miniApp,
    mainButton,
    initData,
    setDebug,
    init as initSDK,
} from '@telegram-apps/sdk-react';

/**
 * Initializes the Telegram Mini App and configures its dependencies.
 */
export async function init(options: {
    debug?: boolean;
    eruda?: boolean;
}): Promise<void> {
    const { debug, eruda } = options;

    if (debug) {
        setDebug(true);
    }

    // Initialize SDK event handlers
    try {
        initSDK();
    } catch (e) {
        console.warn('[TMA] SDK init failed (safe):', e);
    }

    // Eruda mobile debugger
    if (eruda) {
        try {
            await import('eruda').then((lib) => lib.default.init());
        } catch (e) {
            console.warn('[TMA] Eruda not available:', e);
        }
    }

    // Safe mount helper
    const safeMount = async (component: any) => {
        try {
            if (typeof component.mount === 'function' && !component.isMounted()) {
                await component.mount();
            }
        } catch (e) {
            console.warn('[TMA] Mount failed:', e);
        }
    };

    // Mount and bind CSS vars for mini app & theme
    await safeMount(miniApp);
    try { if (miniApp.bindCssVars.isAvailable()) miniApp.bindCssVars(); } catch { /* noop */ }

    await safeMount(themeParams);
    try { if (themeParams.bindCssVars.isAvailable()) themeParams.bindCssVars(); } catch { /* noop */ }

    // Viewport: mount, bind CSS vars, expand, fullscreen
    try {
        if (!viewport.isMounted()) {
            await viewport.mount();
        }
        if (viewport.bindCssVars.isAvailable()) viewport.bindCssVars();

        if (viewport.isMounted()) {
            if (!viewport.isExpanded()) {
                viewport.expand();
            }
            try {
                // @ts-ignore - requestFullscreen may not be typed yet
                if (typeof viewport.requestFullscreen === 'function') {
                    viewport.requestFullscreen();
                }
            } catch (e) {
                console.warn('[TMA] Fullscreen request failed:', e);
            }
        }
    } catch (e) {
        console.warn('[TMA] Viewport error:', e);
    }

    // Restore init data
    try {
        if (initData.restore) {
            initData.restore();
        }
    } catch (e) {
        console.warn('[TMA] InitData restore error:', e);
    }

    // Mount navigation components
    await safeMount(backButton);
    await safeMount(mainButton);

    // Signal app is ready
    try {
        if (miniApp.isMounted()) {
            miniApp.ready();
        }
    } catch (e) {
        console.warn('[TMA] MiniApp ready failed:', e);
    }
}
