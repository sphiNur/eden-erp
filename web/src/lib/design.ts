/**
 * Eden Design System — JS constants
 * For values needed in component logic (Framer Motion, inline styles).
 */

export const LAYOUT = {
    HEADER_HEIGHT: 56,  // --header-h = 3.5rem
    NAV_HEIGHT: 64,     // --nav-h = 4rem
} as const;

export const SPRING = {
    /** Snappy — drawers, sheets, panels */
    snappy: { type: 'spring' as const, damping: 25, stiffness: 200 },
    /** Bouncy — success overlays, celebrations */
    bouncy: { type: 'spring' as const, damping: 10, stiffness: 200 },
} as const;
