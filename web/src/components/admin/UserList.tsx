import { useState, useEffect, useMemo } from 'react';
import { User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { usersApi } from '../../api/client';
import { haptic } from '../../lib/telegram';
import { PageLayout } from '../layout/PageLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, MoreVertical, Edit, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

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
        <PageLayout toolbar={
            <div className="flex items-center px-4 py-3 bg-card border-b border-border min-h-[50px]">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={ui('search')}
                        value={search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                        className="pl-9 h-9 bg-accent border-transparent focus-visible:ring-1"
                    />
                </div>
            </div>
        }>
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">{ui('noResults')}</div>
            ) : (
                <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden divide-y divide-border m-3">
                    {filteredUsers.map(user => (
                        <div
                            key={user.id}
                            className="px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors"
                        >
                            <div
                                className="flex items-center gap-3 flex-1 cursor-pointer active:opacity-70"
                                onClick={() => {
                                    haptic.impact('light');
                                    navigate(`/admin/users/${user.id}`);
                                }}
                            >
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase ring-1 ring-primary/20">
                                    {user.username?.[0] || 'U'}
                                </div>
                                <div>
                                    <div className="font-semibold text-sm text-foreground leading-none mb-1.5">
                                        {user.username || `User ${user.telegram_id}`}
                                    </div>
                                    <Badge variant={user.role === 'admin' ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 leading-none h-[18px] uppercase tracking-wider">
                                        {user.role}
                                    </Badge>
                                </div>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                        <MoreVertical size={16} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[160px] rounded-xl shadow-lg border-border">
                                    <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}`)} className="gap-2 cursor-pointer font-medium py-2">
                                        <Edit size={14} className="text-muted-foreground" />
                                        <span>{ui('edit')}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}`)} className="gap-2 cursor-pointer font-medium py-2">
                                        <Shield size={14} className="text-muted-foreground" />
                                        <span>Change Role</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))}
                </div>
            )}
        </PageLayout>
    );
};
