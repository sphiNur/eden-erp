import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Store } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { storesApi } from '../../api/client';
import { haptic } from '../../lib/telegram';
import { PageLayout } from '../layout/PageLayout';
import { ListToolbar } from '../shared/ListToolbar';
import { PageLoading } from '../shared/PageLoading';
import { useNavigate } from 'react-router-dom';

export const StoreList = () => {
    const { ui } = useLanguage();
    const navigate = useNavigate();
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            const data = await storesApi.list();
            setStores(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStores = useMemo(() => {
        const term = search.toLowerCase();
        return stores.filter(s =>
            s.name.toLowerCase().includes(term) ||
            (s.address || '').toLowerCase().includes(term)
        );
    }, [stores, search]);

    const toolbar = (
        <ListToolbar
            search={search}
            onSearchChange={setSearch}
            actions={
                <Button
                    size="sm"
                    className="h-9 w-9 p-0 rounded-full bg-eden-500 hover:bg-eden-600 text-white shadow-sm shrink-0"
                    onClick={() => {
                        haptic.impact('light');
                        navigate('/admin/stores/new');
                    }}
                >
                    <Plus className="h-5 w-5" />
                </Button>
            }
        />
    );

    if (loading) return <PageLoading />;

    return (
        <PageLayout toolbar={toolbar}>
            {filteredStores.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">{ui('noResults')}</div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden divide-y divide-gray-100">
                    {filteredStores.map(store => (
                        <div
                            key={store.id}
                            className="px-3 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                            onClick={() => {
                                haptic.impact('light');
                                navigate(`/admin/stores/${store.id}`);
                            }}
                        >
                            <div>
                                <div className="font-semibold text-gray-900 text-[13px]">{store.name}</div>
                                {store.address && (
                                    <div className="text-xs text-gray-500 mt-0.5">{store.address}</div>
                                )}
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
