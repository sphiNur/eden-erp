import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Store } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { storesApi } from '../../api/client';
import { haptic } from '../../lib/telegram';
import { PageLayout } from '../layout/PageLayout';
import { ListToolbar } from '../shared/ListToolbar';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

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
                    className="h-9 w-9 p-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shrink-0"
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

    return (
        <PageLayout toolbar={toolbar}>
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : filteredStores.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">{ui('noResults')}</div>
            ) : (
                <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden divide-y divide-border">
                    {filteredStores.map(store => (
                        <div
                            key={store.id}
                            className="px-3 py-3 flex items-center justify-between cursor-pointer hover:bg-accent active:bg-accent/80 transition-colors"
                            onClick={() => {
                                haptic.impact('light');
                                navigate(`/admin/stores/${store.id}`);
                            }}
                        >
                            <div>
                                <div className="font-semibold text-foreground text-[13px]">{store.name}</div>
                                {store.address && (
                                    <div className="text-xs text-muted-foreground mt-0.5">{store.address}</div>
                                )}
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
