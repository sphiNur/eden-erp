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
        <header className="fixed top-0 z-header w-full border-b bg-white/95 backdrop-blur-md pt-safe transition-all">
            <div className="relative flex h-[52px] w-full items-center justify-center px-4">

                {/* Center Title & Settings Trigger Merged */}
                <SettingsMenu>
                    <button className="flex items-center justify-center gap-1 px-4 py-1.5 rounded-full hover:bg-gray-100 transition-colors active:bg-gray-200">
                        <h1 className="text-[17px] font-semibold text-gray-900 leading-none tracking-tight truncate max-w-[200px]">
                            {title}
                        </h1>
                        <SettingsMenuIcon className="w-4 h-4 text-gray-400 mt-[1px]" />
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
