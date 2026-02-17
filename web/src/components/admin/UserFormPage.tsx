import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { User, UserRole } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { usersApi, storesApi } from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { PageLayout } from '../layout/PageLayout';
import { USER_ROLES, getRoleMetadata } from '../../constants/roles';

interface StoreOption {
    id: string;
    name: string;
}

export const UserFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { ui } = useLanguage();
    const { success, error } = useToast();

    const [user, setUser] = useState<User | null>(null);
    const [stores, setStores] = useState<StoreOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [role, setRole] = useState<UserRole>(USER_ROLES.STORE_MANAGER);
    const [storeId, setStoreId] = useState<string>('');

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        try {
            const [usersData, storeData] = await Promise.all([
                usersApi.list(),
                storesApi.list().catch(() => [] as StoreOption[])
            ]);

            setStores(storeData);
            const foundUser = usersData.find(u => u.id === id);

            if (foundUser) {
                setUser(foundUser);
                setRole(foundUser.role);
                setStoreId(foundUser.allowed_store_ids?.[0] || '');
            } else {
                error("User not found");
                navigate('/admin/users');
            }
        } catch (err) {
            console.error(err);
            error(ui('failedLoadItems'));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSubmitting(true);

        try {
            const payload = {
                role,
                allowed_store_ids: role === USER_ROLES.STORE_MANAGER && storeId ? [storeId] : []
            };

            await usersApi.update(user.id, payload);
            success(ui('saveChanges'));
            navigate('/admin/users');
        } catch (err) {
            console.error(err);
            error(ui('updateFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    const toolbar = (
        <div className="flex items-center gap-3 px-3 py-2">
            <Button variant="ghost" size="icon" className="-ml-2" onClick={() => navigate('/admin/users')}>
                <ArrowLeft size={20} className="text-gray-500" />
            </Button>
            <h1 className="text-lg font-bold flex-1">
                {ui('editUser')}
            </h1>
            <Button size="sm" onClick={handleSave} disabled={submitting || loading}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={18} />}
                <span className="ml-2 hidden sm:inline">{ui('save')}</span>
            </Button>
        </div>
    );

    if (loading) {
        return (
            <PageLayout toolbar={toolbar}>
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
            </PageLayout>
        );
    }

    return (
        <PageLayout toolbar={toolbar}>
            <div className="max-w-lg mx-auto py-2 space-y-6">
                {/* User Info Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xl">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div className="font-bold text-gray-900 text-lg">{user?.username || `User ${user?.telegram_id}`}</div>
                        <div className="text-sm text-gray-500">ID: {user?.telegram_id}</div>
                    </div>
                </div>

                {/* Settings Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">🔐 Permissions</h3>

                    <div className="space-y-2">
                        <Label>{ui('role')}</Label>
                        <Select value={role} onValueChange={(r: UserRole) => setRole(r)}>
                            <SelectTrigger className="bg-gray-50 border-gray-200">
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
                                <SelectTrigger className="bg-gray-50 border-gray-200">
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
            </div>

            <div className="fixed bottom-6 right-6 z-fab sm:hidden">
                <Button
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-lg bg-eden-500 hover:bg-eden-600"
                    onClick={handleSave}
                    disabled={submitting}
                >
                    {submitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                </Button>
            </div>
        </PageLayout>
    );
};
