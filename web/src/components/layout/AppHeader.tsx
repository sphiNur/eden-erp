import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { SettingsMenu } from './SettingsMenu';

const ROUTE_TITLES: Record<string, string> = {
    '/store': 'storeRequest',
    '/market': 'marketRun',
    '/admin/products': 'inventory',
    '/admin/users': 'teamManagement',
    '/admin/stores': 'stores',
    '/admin/analytics': 'analytics',
};



export const AppHeader = () => {
    const location = useLocation();
    const { ui } = useLanguage();

    const titleKey = ROUTE_TITLES[location.pathname] || '';
    const title = titleKey ? ui(titleKey as Parameters<typeof ui>[0]) : '';

    return (
        <header className="fixed top-0 z-header w-full border-b bg-background/80 backdrop-blur-md pt-safe transition-all">
            <div className="relative flex h-[var(--header-base)] w-full items-center justify-center px-4">
                {/* Left Placeholer (Close Button Area) */}
                <div className="absolute left-4 w-8" />

                {/* Center Title */}
                <h1 className="text-[17px] font-semibold text-foreground truncate max-w-[60%] text-center">
                    {title}
                </h1>

                {/* Right Settings Button */}
                {/* Positioned to be left of the native 'More' button (approx 44px from right edge) */}
                <div className="absolute right-[50px] flex items-center">
                    <SettingsMenu />
                </div>
            </div>
        </header>
    );
};
