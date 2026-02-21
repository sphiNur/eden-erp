import { useState, useEffect, useMemo } from 'react';
import { User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { usersApi } from '../../api/client';
import { haptic } from '../../lib/telegram';
import { PageLayout } from '../layout/PageLayout';
import { ListToolbar } from '../shared/ListToolbar';
import { RoleBadge } from '../shared/RoleBadge';
import { PageLoading } from '../shared/PageLoading';
import { useNavigate } from 'react-router-dom';

export const UserList = () => {
    const { ui } = useLanguage();
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const userData = await usersApi.list();
            setUsers(userData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = useMemo(() => {
        const term = search.toLowerCase();
        return users.filter(u =>
            (u.username || '').toLowerCase().includes(term) ||
            u.telegram_id.toString().includes(term)
        );
    }, [users, search]);

    if (loading) return <PageLoading />;

    return (
        <PageLayout toolbar={<ListToolbar search={search} onSearchChange={setSearch} />}>
            {filteredUsers.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">{ui('noResults')}</div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden divide-y divide-gray-100 space-y-0">
                    {filteredUsers.map(user => (
                        <div
                            key={user.id}
                            className="px-3 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                            onClick={() => {
                                haptic.impact('light');
                                navigate(`/admin/users/${user.id}`);
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                                    {user.username?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <div className="font-semibold text-[13px] text-gray-900 leading-none mb-1">
                                        {user.username || `User ${user.telegram_id}`}
                                    </div>
                                    <RoleBadge role={user.role} />
                                </div>
                            </div>
                            <div className="text-eden-500">
                                <span className="text-xs font-medium px-2 py-1 bg-eden-50 rounded-full">{ui('edit')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PageLayout>
    );
};

