import { useEffect, ReactNode, Component, type ErrorInfo } from 'react';
import WebApp from '@twa-dev/sdk';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MarketRun } from './components/MarketRun';
import { StoreRequest } from './components/StoreRequest';
import { InventoryMaster } from './components/admin/InventoryMaster';
import { UserList } from './components/admin/UserList';
import { AnalyticsDashboard } from './components/admin/AnalyticsDashboard';
import { StoreList } from './components/admin/StoreList';
import { AppLayout } from './components/layout/AppLayout';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { UserProvider, useUser } from './contexts/UserContext';
import { Loader2 } from 'lucide-react';

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
            } else if (user.role === 'admin' || user.role === 'finance') {
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
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
                <h1 className="text-xl font-bold text-red-600 mb-2">{ui('accessDenied')}</h1>
                <p className="text-gray-600">{ui('accessDeniedMsg')}</p>
                <p className="text-xs text-gray-400 mt-4">Telegram ID: {WebApp.initDataUnsafe?.user?.id}</p>
            </div>
        );
    }

    // Fallback while redirecting
    return <div className="min-h-screen bg-gray-50" />;
};

// --- Error Boundary ---
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
                    <h1 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h1>
                    <p className="text-sm text-gray-500 mb-4">{this.state.error?.message}</p>
                    <button
                        className="px-4 py-2 bg-eden-500 text-white rounded-lg"
                        onClick={() => window.location.reload()}
                    >
                        Reload
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

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
        if (WebApp.initDataUnsafe) {
            WebApp.ready();

            // Try to force full screen / expanded mode
            try {
                WebApp.expand();

                // Check for Mini Apps 2.0 FullScreen API (v8.0+)
                // We use type assertion or checking existence to avoid TS errors on older SDK types
                if (parseFloat(WebApp.version) >= 8.0 && (WebApp as any).requestFullscreen) {
                    (WebApp as any).requestFullscreen();
                }
            } catch (e) {
                console.error("Error setting full screen:", e);
            }
        }
    }, []);

    return (
        <LanguageProvider>
            <UserProvider>
                <ToastProvider>
                    <ErrorBoundary>
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

                                    {/* Admin routes */}
                                    <Route
                                        path="/admin"
                                        element={<Navigate to="/admin/products" replace />}
                                    />
                                    <Route
                                        path="/admin/products"
                                        element={
                                            <ProtectedRoute allowedRoles={['admin', 'finance']}>
                                                <InventoryMaster />
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
                                        path="/admin/analytics"
                                        element={
                                            <ProtectedRoute allowedRoles={['admin', 'finance']}>
                                                <AnalyticsDashboard />
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
                                </Route>

                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </HashRouter>
                    </ErrorBoundary>
                </ToastProvider>
            </UserProvider>
        </LanguageProvider>
    );
}

export default App;
