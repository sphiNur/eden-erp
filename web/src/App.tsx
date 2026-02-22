import { useEffect, ReactNode } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MarketRun } from './components/MarketRun';
import { StoreRequest } from './components/StoreRequest';
import { StoreBill } from './components/store-request/StoreBill';
import { InventoryMaster } from './components/admin/InventoryMaster';
import { UserList } from './components/admin/UserList';
import { StoreList } from './components/admin/StoreList';
import { StallManager } from './components/admin/StallManager';
import { AppLayout } from './components/layout/AppLayout';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { UserProvider, useUser } from './contexts/UserContext';
import { ToastProvider } from './contexts/ToastContext';
import { Loader2 } from 'lucide-react';
import { ProductFormPage } from './components/admin/ProductFormPage';
import { StoreFormPage } from './components/admin/StoreFormPage';
import { UserFormPage } from './components/admin/UserFormPage';

// Dispatcher Component matches role to route
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
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="h-12 w-12 text-eden-500 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">{ui('authenticating')}</p>
            </div>
        );
    }

    if (!user) {
        let displayId = 'unknown';
        try {
            const lp = retrieveLaunchParams() as any;
            displayId = lp.initData?.user?.id?.toString() || 'unknown';
        } catch (e) {
            console.warn('Failed to retrieve launch params in AppDispatcher:', e);
        }

        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
                <h1 className="text-xl font-bold text-red-600 mb-2">{ui('accessDenied')}</h1>
                <p className="text-gray-600">{ui('accessDeniedMsg')}</p>
                <p className="text-xs text-gray-400 mt-4">Telegram ID: {displayId}</p>
            </div>
        );
    }

    // Fallback while redirecting
    return <div className="min-h-screen bg-gray-50" />;
};


// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }: { children: ReactNode, allowedRoles: string[] }) => {
    const { user, loading } = useUser();

    if (loading) {
        return (
            <div className="flex justify-center items-center p-12">
                <Loader2 className="h-8 w-8 text-eden-500 animate-spin" />
            </div>
        );
    }

    // Admin has access to everything
    if (!user || (user.role !== 'admin' && !allowedRoles.includes(user.role))) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};


function App() {
    useEffect(() => {
        try {
            // Apply platform class for legacy CSS
            const platform = (retrieveLaunchParams() as any).platform || 'unknown';
            document.body.classList.add(`os-${platform}`);
        } catch (e) {
            console.warn('Failed to apply platform class or retrieve parameters:', e);
        }
    }, []);

    return (
        <LanguageProvider>
            <UserProvider>
                <ToastProvider>
                    <HashRouter>
                        <Routes>
                            <Route path="/" element={<AppDispatcher />} />

                            {/* All authenticated pages under AppLayout */}
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

                                {/* Store Bills */}
                                <Route
                                    path="/store/bills"
                                    element={
                                        <ProtectedRoute allowedRoles={['store_manager', 'admin', 'global_purchaser']}>
                                            <StoreBill />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Admin routes */}
                                <Route
                                    path="/admin"
                                    element={<Navigate to="/admin/products" replace />}
                                />
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
                </ToastProvider>
            </UserProvider>
        </LanguageProvider>
    );
}

export default App;
