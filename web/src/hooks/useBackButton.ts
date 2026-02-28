import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { backButton } from '@telegram-apps/sdk-react';

export function useBackButton() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleBackClick = () => {
            navigate(-1);
        };

        if (backButton.isSupported()) {
            backButton.onClick(handleBackClick);
        }

        return () => {
            if (backButton.isSupported()) {
                backButton.offClick(handleBackClick);
            }
        };
    }, [navigate]);

    useEffect(() => {
        const path = location.pathname;
        const isMainTab = ['/store', '/market', '/admin/products', '/admin/users', '/admin/stores'].includes(path);

        if (backButton.isSupported()) {
            if (path !== '/' && !isMainTab) {
                if (!backButton.isVisible()) {
                    backButton.show();
                }
            } else {
                if (backButton.isVisible()) {
                    backButton.hide();
                }
            }
        }
    }, [location.pathname]);
}
