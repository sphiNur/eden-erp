/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            fontFamily: {
                sans: ['var(--font-sans)'],
            },
            colors: {
                border: "var(--tg-theme-section-separator-color, hsl(var(--border)))",
                input: "var(--tg-theme-section-separator-color, hsl(var(--input)))",
                ring: "var(--tg-theme-button-color, hsl(var(--ring)))",
                background: "var(--tg-theme-bg-color, hsl(var(--background)))",
                foreground: "var(--tg-theme-text-color, hsl(var(--foreground)))",
                primary: {
                    DEFAULT: "var(--tg-theme-button-color, hsl(var(--primary)))",
                    foreground: "var(--tg-theme-button-text-color, hsl(var(--primary-foreground)))",
                },
                secondary: {
                    DEFAULT: "var(--tg-theme-secondary-bg-color, hsl(var(--secondary)))",
                    foreground: "var(--tg-theme-text-color, hsl(var(--secondary-foreground)))",
                },
                destructive: {
                    DEFAULT: "var(--tg-theme-destructive-text-color, hsl(var(--destructive)))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "var(--tg-theme-hint-color, hsl(var(--muted)))",
                    foreground: "var(--tg-theme-subtitle-text-color, hsl(var(--muted-foreground)))",
                },
                accent: {
                    DEFAULT: "var(--tg-theme-secondary-bg-color, hsl(var(--accent)))",
                    foreground: "var(--tg-theme-accent-text-color, hsl(var(--accent-foreground)))",
                },
                popover: {
                    DEFAULT: "var(--tg-theme-bg-color, hsl(var(--popover)))",
                    foreground: "var(--tg-theme-text-color, hsl(var(--popover-foreground)))",
                },
                card: {
                    DEFAULT: "var(--tg-theme-section-bg-color, hsl(var(--card)))",
                    foreground: "var(--tg-theme-text-color, hsl(var(--card-foreground)))",
                },
                // ─── Eden Brand ───
                eden: {
                    50: "hsl(var(--eden-50))",
                    500: "hsl(var(--eden-500))",
                    600: "hsl(var(--eden-600))",
                    700: "hsl(var(--eden-700))",
                },
                success: "hsl(var(--success))",
                warning: "hsl(var(--warning))",
                danger: "hsl(var(--danger))",
            },
            spacing: {
                'nav': 'var(--nav-h)',
            },
            zIndex: {
                'toolbar': 'var(--z-toolbar)',
                'fab': 'var(--z-fab)',
                'header': 'var(--z-header)',
                'nav': 'var(--z-nav)',
                'drawer': 'var(--z-drawer)',
                'overlay': 'var(--z-overlay)',
                'alert': 'var(--z-alert)',
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
                xs: "calc(var(--radius) - 6px)",
            },
            transitionTimingFunction: {
                'out-expo': 'var(--ease-out)',
            },
            keyframes: {
                "accordion-down": {
                    from: { height: 0 },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: 0 },
                },
                "shimmer": {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "shimmer": "shimmer 1.5s ease-in-out infinite",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
