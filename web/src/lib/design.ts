/**
 * Eden Design System — JS constants
 * For values needed in component logic (Framer Motion, inline styles).
 */

export const LAYOUT = {
    NAV_HEIGHT: 56,     // base nav height (bottom safe area added via CSS)
} as const;

export const SPRING = {
    /** Snappy — drawers, sheets, panels */
    snappy: { type: 'spring' as const, damping: 25, stiffness: 200 },
    /** Bouncy — success overlays, celebrations */
    bouncy: { type: 'spring' as const, damping: 10, stiffness: 200 },
} as const;
