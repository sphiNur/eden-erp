import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { usersApi } from '../api/client';
import WebApp from '@twa-dev/sdk';

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
            if (WebApp.initData) {
                const realUser = await usersApi.me();

                // Enhance with Telegram UI data if available
                const tgUser = WebApp.initDataUnsafe?.user;
                if (tgUser) {
                    realUser.first_name = tgUser.first_name;
                    realUser.last_name = tgUser.last_name;
                    realUser.photo_url = tgUser.photo_url;
                    realUser.username = tgUser.username || realUser.username;
                }

                // Allow Admin to simulate other roles
                const mock = localStorage.getItem('dev_mock_user');
                if (mock && realUser.role === 'admin') {
                    const parsed = JSON.parse(mock);
                    console.log("Admin Simulating Role:", parsed.role);
                    setUser({ ...realUser, ...parsed, role: parsed.role }); // Keep real details, override role
                } else {
                    setUser(realUser);
                }
                return;
            }

            // 2. Fallback: Local Mock User (Dev/Admin Simulation only)
            // This path is taken when running locally without Telegram InitData
            const mock = localStorage.getItem('dev_mock_user');
            if (mock) {
                const parsed = JSON.parse(mock);
                console.log("Using Mock User (Local):", parsed);
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
