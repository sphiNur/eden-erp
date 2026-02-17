import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { User, UserRole } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { usersApi, storesApi } from '../../api/client';
import WebApp from '@twa-dev/sdk';
import { useToast } from '../../contexts/ToastContext';
import { PageLayout } from '../layout/PageLayout';
import { USER_ROLES, getRoleMetadata } from '../../constants/roles';
import { ListToolbar } from '../shared/ListToolbar';
import { RoleBadge } from '../shared/RoleBadge';

interface StoreOption {
    id: string;
    name: string;
}

export const UserList = () => {
    const { ui } = useLanguage();
    const { success, error } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [stores, setStores] = useState<StoreOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [search, setSearch] = useState('');

    // Form State
    const [role, setRole] = useState<UserRole>(USER_ROLES.STORE_MANAGER);
    const [storeId, setStoreId] = useState<string>('');

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            setRole(selectedUser.role);
            setStoreId(selectedUser.allowed_store_ids?.[0] || '');
        }
    }, [selectedUser]);

    const fetchData = async () => {
        try {
            const [userData, storeData] = await Promise.all([
                usersApi.list(),
                storesApi.list().catch(() => [] as StoreOption[])
            ]);
            setUsers(userData);
            setStores(storeData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedUser) return;
        setUpdating(true);

        try {
            const payload = {
                role,
                allowed_store_ids: role === USER_ROLES.STORE_MANAGER && storeId ? [storeId] : []
            };

            await usersApi.update(selectedUser.id, payload);
            await fetchData();
            setIsSheetOpen(false);
            success(ui('saveChanges'));
        } catch (err) {
            console.error(err);
            error(ui('updateFailed'));
        } finally {
            setUpdating(false);
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
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
            ) : (
                filteredUsers.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">{ui('noResults')}</div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden divide-y divide-gray-100 space-y-0">
                        {filteredUsers.map(user => (
                            <div
                                key={user.id}
                                className="px-3 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                                onClick={() => {
                                    WebApp.HapticFeedback.impactOccurred('light');
                                    setSelectedUser(user);
                                    setIsSheetOpen(true);
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
                )
            )}

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="bg-white w-full sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>{ui('editUser')}</SheetTitle>
                        <SheetDescription>
                            {selectedUser?.username}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="py-6 space-y-6">
                        <div className="space-y-2">
                            <Label>{ui('role')}</Label>
                            <Select value={role} onValueChange={(r: UserRole) => setRole(r)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {Object.values(USER_ROLES).map((r) => (
                                        <SelectItem key={r} value={r}>
                                            {getRoleMetadata(r).label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {role === USER_ROLES.STORE_MANAGER && (
                            <div className="space-y-2">
                                <Label>{ui('assignedStore')}</Label>
                                <Select value={storeId} onValueChange={setStoreId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={ui('selectStore')} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        {stores.map(store => (
                                            <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <SheetFooter>
                        <Button disabled={updating} onClick={handleSave} className="w-full">
                            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {ui('saveChanges')}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </PageLayout>
    );
};

