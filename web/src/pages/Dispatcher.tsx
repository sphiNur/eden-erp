import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';

/**
 * Role-based dispatcher: redirects authenticated user to the correct entry route.
 */
export function Dispatcher() {
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
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-medium">{ui('authenticating')}</p>
            </div>
        );
    }

    if (!user) {
        let displayId = 'unknown';
        try {
            const lp = retrieveLaunchParams() as { initData?: { user?: { id?: unknown } } };
            displayId = lp.initData?.user?.id?.toString() ?? 'unknown';
        } catch (e) {
            console.warn('Failed to retrieve launch params in Dispatcher:', e);
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
}
