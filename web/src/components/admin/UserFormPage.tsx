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

    const [role, setRole] = useState<UserRole>(USER_ROLES.STORE_MANAGER as UserRole);
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
                <ArrowLeft size={20} className="text-muted-foreground" />
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
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
            </PageLayout>
        );
    }

    return (
        <PageLayout toolbar={toolbar}>
            <div className="max-w-lg mx-auto py-2 space-y-6">
                {/* User Info Card */}
                <div className="bg-card p-4 rounded-xl shadow-sm border border-border flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-xl">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div className="font-bold text-foreground text-lg">{user?.username || `User ${user?.telegram_id}`}</div>
                        <div className="text-sm text-muted-foreground">ID: {user?.telegram_id}</div>
                    </div>
                </div>

                {/* Settings Card */}
                <div className="bg-card p-4 rounded-xl shadow-sm border border-border space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">🔐 Permissions</h3>

                    <div className="space-y-2">
                        <Label>{ui('role')}</Label>
                        <Select value={role} onValueChange={(r: string) => setRole(r as UserRole)}>
                            <SelectTrigger className="bg-muted/50 border-border">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
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
                                <SelectTrigger className="bg-muted/50 border-border">
                                    <SelectValue placeholder={ui('selectStore')} />
                                </SelectTrigger>
                                <SelectContent className="bg-card">
                                    {stores.map(store => (
                                        <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
};
