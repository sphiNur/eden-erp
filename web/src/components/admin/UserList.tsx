import { useState, useEffect } from 'react';
import { Loader2, User as UserIcon, Store as StoreIcon, Shield, ShoppingCart } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { User, UserRole } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { usersApi, storesApi } from '../../api/client';

interface StoreOption {
    id: string;
    name: string;
}

export const UserList = () => {
    const { ui } = useLanguage();
    const [users, setUsers] = useState<User[]>([]);
    const [stores, setStores] = useState<StoreOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Form State
    const [role, setRole] = useState<UserRole>('store_manager');
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
                allowed_store_ids: role === 'store_manager' && storeId ? [storeId] : []
            };

            await usersApi.update(selectedUser.id, payload);
            await fetchData();
            setIsSheetOpen(false);
        } catch (err) {
            console.error(err);
            alert(ui('updateFailed'));
        } finally {
            setUpdating(false);
        }
    };

    const getRoleIcon = (role: UserRole) => {
        switch (role) {
            case 'admin': return <Shield className="h-4 w-4 text-purple-600" />;
            case 'store_manager': return <StoreIcon className="h-4 w-4 text-eden-500" />;
            case 'global_purchaser': return <ShoppingCart className="h-4 w-4 text-green-600" />;
            default: return <UserIcon className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <div className="bg-gray-50 flex flex-col">
            <div className="bg-white border-b px-3 py-2 sticky top-header z-toolbar">
                <p className="text-xs text-gray-500">{users.length} {ui('users')}</p>
            </div>

            <main className="p-3">
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
                ) : (
                    <div className="space-y-2">
                        {users.map(user => (
                            <div
                                key={user.id}
                                className="bg-white px-3 py-2.5 rounded-lg border shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
                                onClick={() => {
                                    setSelectedUser(user);
                                    setIsSheetOpen(true);
                                }}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                                        <span className="font-bold text-sm text-gray-500">{user.username?.[0]?.toUpperCase() || 'U'}</span>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-[13px] text-gray-900">{user.username || `User ${user.telegram_id}`}</div>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            {getRoleIcon(user.role)}
                                            <span className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-eden-500 text-xs">{ui('edit')}</Button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

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
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="store_manager">Store Manager</SelectItem>
                                    <SelectItem value="global_purchaser">Global Purchaser</SelectItem>
                                    <SelectItem value="finance">Finance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {role === 'store_manager' && (
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
        </div>
    );
};
