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

    // Find the matching route title
    const titleKey = ROUTE_TITLES[location.pathname] || '';
    const title = titleKey ? ui(titleKey as Parameters<typeof ui>[0]) : '';

    return (
        <header className="fixed top-0 z-header flex h-[var(--header-h)] w-full flex-col justify-end border-b bg-background/80 backdrop-blur-md transition-all">
            <div className="flex h-[var(--header-base)] w-full items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
                </div>

                {/* Right — Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <SettingsMenu />
                </div>
            </div>
        </header>
    );
};
