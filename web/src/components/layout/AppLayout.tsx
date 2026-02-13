import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { BottomTabBar } from './BottomTabBar';
import { useUser } from '../../contexts/UserContext';

export const AppLayout = () => {
    const { user } = useUser();

    return (
        <div className="flex min-h-[100dvh] w-full flex-col bg-background">
            <AppHeader />
            {/* Add padding-top to account for header + safe area */}
            <main className="flex-1 pb-16 pt-[calc(3.5rem+env(safe-area-inset-top))] lg:pb-0 lg:pt-[3.5rem]">
                <div className="mx-auto w-full max-w-[1400px]">
                    <Outlet />
                </div>
            </main>
            {/* Show bottom tab bar only for admin/store_manager */}
            {user?.role && ['admin', 'store_manager', 'global_purchaser'].includes(user.role) && (
                <div className="lg:hidden">
                    <BottomTabBar />
                </div>
            )}
        </div>
    );
};
