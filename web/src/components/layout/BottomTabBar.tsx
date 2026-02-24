import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Package, Store, ShoppingCart, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUser } from '../../contexts/UserContext';
import { SettingsMenu } from './SettingsMenu';
import { haptic } from '../../lib/telegram';
import type { LucideIcon } from 'lucide-react';

interface TabItem {
    key: string;
    icon: LucideIcon;
    path: string;
    shortLabel?: string;  // Override for bottom tab (shorter than i18n)
}

const ADMIN_TABS: TabItem[] = [
    { key: 'inventory', icon: Package, path: '/admin/products' },
    { key: 'teamManagement', icon: Users, path: '/admin/users', shortLabel: 'Team' },
    { key: 'stores', icon: Store, path: '/admin/stores' },
];

const STORE_MANAGER_TABS: TabItem[] = [
    { key: 'storeRequest', icon: ShoppingCart, path: '/store' },
];

const PURCHASER_TABS: TabItem[] = [
    { key: 'marketRun', icon: ShoppingCart, path: '/market' },
];

function getTabsForRole(role?: string): TabItem[] {
    switch (role) {
        case 'admin':
            return ADMIN_TABS;
        case 'store_manager':
            return STORE_MANAGER_TABS;
        case 'global_purchaser':
            return PURCHASER_TABS;
        default:
            return [];
    }
}

export const BottomTabBar = () => {
    const { user } = useUser();
    const { ui } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const [settingsOpen, setSettingsOpen] = useState(false);

    if (!user) return null;

    const tabs = getTabsForRole(user.role);
    // Don't render if somehow no tabs and no settings
    if (tabs.length === 0) return null;

    const handleNav = (path: string) => {
        if (location.pathname !== path) {
            haptic.selection();
            navigate(path);
        }
    };

    const isSingleTab = tabs.length === 1;

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border flex items-center z-nav shadow-[0_-1px_3px_rgba(0,0,0,0.05)]"
            style={{
                height: 'var(--nav-h)',
                paddingBottom: 'var(--tma-safe-bottom)',
            }}
        >
            {/* Navigation tabs */}
            <div className={cn(
                "flex flex-1",
                isSingleTab ? "justify-start pl-4" : "justify-around"
            )}>
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path ||
                        location.pathname.startsWith(tab.path);

                    const tabLabel = tab.shortLabel ?? ui(tab.key as Parameters<typeof ui>[0]);
                    return (
                        <button
                            key={tab.path}
                            onClick={() => handleNav(tab.path)}
                            type="button"
                            className={cn(
                                "flex flex-col items-center justify-center space-y-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md",
                                isSingleTab ? "px-4" : "w-full h-full",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground active:text-foreground/80"
                            )}
                            aria-label={tabLabel}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <tab.icon
                                size={isActive ? 22 : 20}
                                strokeWidth={isActive ? 2.5 : 2}
                                className={cn("transition-all", isActive && "scale-110")}
                            />
                            <span className="text-[10px] font-medium leading-tight text-center max-w-[60px] truncate">
                                {tabLabel}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Settings tab — always present, triggers SettingsMenu */}
            <SettingsMenu open={settingsOpen} onOpenChange={setSettingsOpen}>
                <button
                    onClick={() => {
                        haptic.selection();
                        setSettingsOpen(true);
                    }}
                    className={cn(
                        "flex flex-col items-center justify-center space-y-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md",
                        isSingleTab ? "px-6 pr-4" : "w-16 shrink-0",
                        settingsOpen
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-label="Settings"
                    aria-expanded={settingsOpen}
                >
                    <Settings
                        size={settingsOpen ? 22 : 20}
                        strokeWidth={settingsOpen ? 2.5 : 2}
                        className="transition-all"
                    />
                    <span className="text-[10px] font-medium leading-tight">
                        Settings
                    </span>
                </button>
            </SettingsMenu>
        </nav>
    );
};
