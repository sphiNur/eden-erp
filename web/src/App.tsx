import { useEffect, ReactNode } from 'react';
import { retrieveLaunchParams, themeParams, useSignal } from '@telegram-apps/sdk-react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import {
    StoreRequest,
    MarketRun,
    StoreBill,
    InventoryMaster,
    UserList,
    StoreList,
    StallManager,
    ProductFormPage,
    StoreFormPage,
    UserFormPage,
} from './pages';
import { AppLayout } from './components/layout/AppLayout';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { UserProvider, useUser } from './contexts/UserContext';
import { ToastProvider } from './contexts/ToastContext';
import { Loader2 } from 'lucide-react';

// ─── Dispatcher: match role to route ───

const AppDispatcher = () => {
    const { user, loading } = useUser();
    const { ui } = useLanguage();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            if (user.role === 'store_manager') {
                navigate('/store', { replace: true });
            } else if (user.role === 'global_purchaser') {
                navigate('/market', { replace: true });
            } else if (user.role === 'admin') {
                navigate('/admin/products', { replace: true });
            }
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" aria-hidden />
                <p className="text-muted-foreground font-medium">{ui('authenticating')}</p>
            </div>
        );
    }

    if (!user) {
        let displayId = 'unknown';
        try {
            const lp = retrieveLaunchParams() as any;
            displayId = lp.initData?.user?.id?.toString() || 'unknown';
        } catch (e) {
            console.warn('Failed to retrieve launch params:', e);
        }

        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
                <h1 className="text-xl font-bold text-destructive mb-2">{ui('accessDenied')}</h1>
                <p className="text-foreground">{ui('accessDeniedMsg')}</p>
                <p className="text-xs text-muted-foreground mt-4">Telegram ID: {displayId}</p>
            </div>
        );
    }

    return <div className="min-h-screen bg-background" />;
};

// ─── Protected Route ───

const ProtectedRoute = ({ children, allowedRoles }: { children: ReactNode; allowedRoles: string[] }) => {
    const { user, loading } = useUser();

    if (loading) {
        return (
            <div className="flex justify-center items-center p-12 bg-background">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!user || (user.role !== 'admin' && !allowedRoles.includes(user.role))) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

// ─── App ───

function App() {
    useEffect(() => {
        try {
            const platform = (retrieveLaunchParams() as { platform?: string })?.platform ?? 'unknown';
            document.body.classList.add(`os-${platform}`);
        } catch (e) {
            console.warn('Failed to apply platform class:', e);
        }
    }, []);

    const isDark = useSignal(themeParams.isDark);
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    return (
        <LanguageProvider>
            <UserProvider>
                <ToastProvider>
                    <HashRouter>
                        <Routes>
                            <Route path="/" element={<AppDispatcher />} />

                            <Route element={<AppLayout />}>
                                <Route
                                    path="/store"
                                    element={
                                        <ProtectedRoute allowedRoles={['store_manager', 'admin']}>
                                            <StoreRequest />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/market"
                                    element={
                                        <ProtectedRoute allowedRoles={['global_purchaser', 'admin']}>
                                            <MarketRun />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/store/bills"
                                    element={
                                        <ProtectedRoute allowedRoles={['store_manager', 'admin', 'global_purchaser']}>
                                            <StoreBill />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
                                <Route
                                    path="/admin/products"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <InventoryMaster />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/products/:id"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <ProductFormPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/users"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <UserList />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/users/:id"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <UserFormPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/stores"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <StoreList />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/stores/:id"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <StoreFormPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/stalls"
                                    element={
                                        <ProtectedRoute allowedRoles={['admin']}>
                                            <StallManager />
                                        </ProtectedRoute>
                                    }
                                />
                            </Route>

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </HashRouter>
                    <Toaster
                        position="bottom-center"
                        toastOptions={{
                            className: 'bg-card text-card-foreground border-border shadow-lg',
                        }}
                    />
                </ToastProvider>
            </UserProvider>
        </LanguageProvider>
    );
}

export default App;
