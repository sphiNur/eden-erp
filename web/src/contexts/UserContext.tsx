import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { usersApi } from '../api/client';

interface UserContextType {
    user: User | null;
    role: UserRole | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Priority: Production/Real Telegram User
            // If we have initData, we ALWAYS use the API and ignore mocks
            if (WebApp.initData) {
                const data = await usersApi.me();
                setUser(data);
                return;
            }

            // 2. Fallback: Local Mock User (Dev/Admin Simulation only)
            const mock = localStorage.getItem('dev_mock_user');
            if (mock) {
                const parsed = JSON.parse(mock);
                console.log("Using Mock User:", parsed);
                setUser(parsed);
                setLoading(false);
                return;
            }

            const data = await usersApi.me();
            setUser(data);
        } catch (err: unknown) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to load user');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const role = user?.role || null;

    return (
        <UserContext.Provider value={{ user, role, loading, error, refetch: fetchUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
