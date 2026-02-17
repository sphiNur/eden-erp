import WebApp from '@twa-dev/sdk';

export type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

export const getPlatform = (): Platform => {
    // 1. Try Telegram WebApp Platform
    const tgPlatform = WebApp.platform;
    if (tgPlatform === 'ios') return 'ios';
    if (tgPlatform === 'android') return 'android';
    if (['macos', 'tdesktop', 'weba', 'webk', 'unigram'].includes(tgPlatform)) return 'desktop';

    // 2. Fallback to User Agent
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    if (/windows|macintosh|linux/.test(ua)) return 'desktop';

    return 'unknown';
};

export const isIOS = () => getPlatform() === 'ios';
export const isAndroid = () => getPlatform() === 'android';
