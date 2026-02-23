import { useState, useEffect, useMemo } from 'react';
import { User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { usersApi } from '../../api/client';
import { haptic } from '../../lib/telegram';
import { PageLayout } from '../layout/PageLayout';
import { ListToolbar } from '../shared/ListToolbar';
import { RoleBadge } from '../shared/RoleBadge';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

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

    return (
        <PageLayout toolbar={<ListToolbar search={search} onSearchChange={setSearch} />}>
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">{ui('noResults')}</div>
            ) : (
                <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden divide-y divide-border space-y-0">
                    {filteredUsers.map(user => (
                        <div
                            key={user.id}
                            className="px-3 py-3 flex items-center justify-between cursor-pointer hover:bg-accent active:bg-accent/80 transition-colors"
                            onClick={() => {
                                haptic.impact('light');
                                navigate(`/admin/users/${user.id}`);
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-muted-foreground font-bold text-xs uppercase">
                                    {user.username?.[0] || 'U'}
                                </div>
                                <div>
                                    <div className="font-semibold text-[13px] text-foreground leading-none mb-1">
                                        {user.username || `User ${user.telegram_id}`}
                                    </div>
                                    <RoleBadge role={user.role} />
                                </div>
                            </div>
                            <div className="text-primary">
                                <span className="text-xs font-medium px-2 py-1 bg-primary/10 rounded-full">{ui('edit')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PageLayout>
    );
};

