import {
    backButton,
    viewport,
    themeParams,
    miniApp,
    initData,
    setDebug,
    init as initSDK,
} from '@telegram-apps/sdk-react';

/**
 * Initializes the application and configures its dependencies.
 */
export async function init(options: {
    debug?: boolean;
    eruda?: boolean;
    mockForMacOS?: boolean;
}): Promise<void> {
    const { debug, eruda, mockForMacOS } = options;

    // Set debug mode if requested.
    if (debug) {
        setDebug(true);
    }

    // Initialize special event handlers for Telegram Desktop, Windows 10+, etc.
    try {
        initSDK();
    } catch (e) {
        console.warn('Telegram SDK initialization failed (safely ignored):', e);
    }

    // Check if we should use Eruda.
    if (eruda) {
        try {
            // @ts-ignore
            await import('eruda').then((lib) => lib.default.init());
        } catch (e) {
            console.warn('Eruda not available:', e);
        }
    }

    /**
     * Safe mount helper for v3 components
     */
    const safeMount = async (component: any) => {
        try {
            if (typeof component.mount === 'function' && !component.isMounted()) {
                await component.mount();
            }
        } catch (e) {
            console.warn(`Failed to mount component:`, e);
        }
    };

    // Define components-related to the user interface.
    await safeMount(miniApp);
    if (miniApp.bindCssVars.isAvailable()) miniApp.bindCssVars();

    await safeMount(themeParams);
    if (themeParams.bindCssVars.isAvailable()) themeParams.bindCssVars();

    try {
        if (!viewport.isMounted()) {
            await viewport.mount();
        }
        if (viewport.bindCssVars.isAvailable()) viewport.bindCssVars();

        // Add the viewport expansion if it's not already expanded.
        if (viewport.isMounted() && !viewport.isExpanded()) {
            viewport.expand();
        }
    } catch (e) {
        console.warn('Viewport error:', e);
    }

    // Define components-related to the mini app state.
    try {
        if (initData.restore) {
            initData.restore();
        }
    } catch (e) {
        console.warn('InitData restore error:', e);
    }

    // Define components-related to the navigation.
    await safeMount(backButton);

    // In case, we are running the application on macOS, we should mock the
    // environment.
    if (mockForMacOS) {
        await import('./mockEnv.ts');
    }
}
