import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { usersApi } from '../api/client';
import { getInitData, getTelegramUser } from '../lib/telegram';

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
            // Priority 1: Real Telegram user
            if (getInitData()) {
                const realUser = await usersApi.me();

                // Enhance with Telegram UI data
                const tgUser = getTelegramUser();
                if (tgUser) {
                    realUser.first_name = tgUser.first_name;
                    realUser.last_name = tgUser.last_name;
                    realUser.photo_url = tgUser.photo_url;
                    realUser.username = tgUser.username || realUser.username;
                }

                // Admin role simulation
                const mock = localStorage.getItem('dev_mock_user');
                if (mock && realUser.role === 'admin') {
                    const parsed = JSON.parse(mock);
                    setUser({ ...realUser, ...parsed, role: parsed.role });
                } else {
                    setUser(realUser);
                }
                return;
            }

            // Priority 2: Local mock user (dev only)
            const mock = localStorage.getItem('dev_mock_user');
            if (mock) {
                const parsed = JSON.parse(mock);
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
