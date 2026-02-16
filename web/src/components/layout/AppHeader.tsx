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

                {/* Center Title & Settings Trigger Merged */}
                {/* Since the title is now the button, we don't need absolute positioning for settings.
                    The whole central element is clickable.
                */}
                <SettingsMenu>
                    <button className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full hover:bg-gray-100/50 active:bg-gray-100 transition-colors max-w-[70%]">
                        <h1 className="text-[17px] font-semibold text-foreground truncate">
                            {title}
                        </h1>
                        <SettingsMenuIcon className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                    </button>
                </SettingsMenu>

            </div>
        </header>
    );
};

// Internal icon component to avoid name conflict if we import Settings as Icon
const SettingsMenuIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m6 9 6 6 6-6" />
    </svg>
);
