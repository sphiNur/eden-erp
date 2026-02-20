import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { BottomTabBar } from './BottomTabBar';
import { useUser } from '../../contexts/UserContext';

export const AppLayout = () => {
    const { user } = useUser();

    return (
        <div className="flex h-[100dvh] w-full flex-col bg-background overflow-hidden relative">
            <AppHeader />
            {/* Use pt-header which already includes safe-area-inset-top */}
            <main className="flex-1 flex flex-col pt-header min-h-0 relative isolate">
                <div className="mx-auto w-full max-w-[1400px] flex-1 flex flex-col min-h-0 relative">
                    <Outlet />
                </div>
            </main>
            {/* Show bottom tab bar only for admin/store_manager */}
            {user?.role && ['admin', 'store_manager', 'global_purchaser'].includes(user.role) && (
                <div className="lg:hidden shrink-0">
                    <BottomTabBar />
                </div>
            )}
        </div>
    );
};
