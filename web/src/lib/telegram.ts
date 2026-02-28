/**
 * Centralized safe wrapper around Telegram WebApp APIs.
 * All Telegram interactions should go through this module to prevent
 * crashes when running outside the Telegram WebView.
 */

// ─── WebApp Instance ───

function getWebApp() {
    try {
        return (window as any).Telegram?.WebApp || null;
    } catch {
        return null;
    }
}

/** Lazily-evaluated Telegram WebApp instance (may be null outside TG) */
export const tg = () => getWebApp();

// ─── Init Data ───

export function getInitData(): string {
    return tg()?.initData || '';
}

export function getInitDataUnsafe(): any {
    return tg()?.initDataUnsafe || {};
}

export function getTelegramUser(): any {
    return getInitDataUnsafe()?.user || null;
}

export function getTelegramUserId(): number | undefined {
    return getTelegramUser()?.id;
}

// ─── Platform ───

export type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

export function getPlatform(): Platform {
    const wa = tg();
    if (wa) {
        const p = wa.platform;
        if (p === 'ios') return 'ios';
        if (p === 'android') return 'android';
        if (['macos', 'tdesktop', 'weba', 'webk', 'unigram'].includes(p)) return 'desktop';
    }
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    if (/windows|macintosh|linux/.test(ua)) return 'desktop';
    return 'unknown';
}

export const isIOS = () => getPlatform() === 'ios';
export const isAndroid = () => getPlatform() === 'android';

// ─── Version & Capability ───

export function getVersion(): string {
    return tg()?.version || '0.0';
}

export function isFullscreenSupported(): boolean {
    try {
        return parseFloat(getVersion()) >= 8.0;
    } catch {
        return false;
    }
}

// ─── Lifecycle ───

export function ready() {
    try { tg()?.ready(); } catch { /* noop */ }
}

export function expand() {
    try { tg()?.expand(); } catch { /* noop */ }
}

export function requestFullscreen() {
    try {
        const wa = tg();
        if (wa && isFullscreenSupported() && wa.requestFullscreen) {
            wa.requestFullscreen();
        }
    } catch { /* noop */ }
}

export function exitFullscreen() {
    try {
        const wa = tg();
        if (wa && isFullscreenSupported() && wa.exitFullscreen) {
            wa.exitFullscreen();
        }
    } catch { /* noop */ }
}

// ─── Haptic Feedback ───

export const haptic = {
    impact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') {
        try { tg()?.HapticFeedback?.impactOccurred(style); } catch { /* noop */ }
    },
    notification(type: 'success' | 'error' | 'warning') {
        try { tg()?.HapticFeedback?.notificationOccurred(type); } catch { /* noop */ }
    },
    selection() {
        try { tg()?.HapticFeedback?.selectionChanged(); } catch { /* noop */ }
    },
};

// ─── UI Methods ───

export function tgAlert(message: string): void {
    try {
        const wa = tg();
        if (wa?.showAlert) {
            wa.showAlert(message);
        } else {
            alert(message);
        }
    } catch {
        alert(message);
    }
}

export function tgConfirm(message: string, callback: (confirmed: boolean) => void): void {
    try {
        const wa = tg();
        if (wa?.showConfirm) {
            wa.showConfirm(message, callback);
        } else {
            callback(confirm(message));
        }
    } catch {
        callback(confirm(message));
    }
}

// ─── Main Button (safe proxy) ───

export const tgMainButton = {
    showProgress(leaveActive?: boolean) {
        try { tg()?.MainButton?.showProgress(leaveActive); } catch { /* noop */ }
    },
    hideProgress() {
        try { tg()?.MainButton?.hideProgress(); } catch { /* noop */ }
    },
};
