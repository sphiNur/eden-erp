import { useState, useEffect, useMemo } from 'react';
import { Plus, Store as StoreIcon, MapPin, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Store } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { storesApi } from '../../api/client';
import { haptic } from '../../lib/telegram';
import { PageLayout } from '../layout/PageLayout';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
        <div className="flex items-center gap-2 px-4 py-3 bg-card border-b border-border min-h-[50px]">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={ui('search')}
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    className="pl-9 h-9 bg-accent border-transparent focus-visible:ring-1"
                />
            </div>
            <Button
                size="icon"
                className="h-9 w-9 rounded-full shrink-0 shadow-sm"
                onClick={() => {
                    haptic.impact('light');
                    navigate('/admin/stores/new');
                }}
            >
                <Plus className="h-5 w-5" />
            </Button>
        </div>
    );

    return (
        <PageLayout toolbar={toolbar}>
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : filteredStores.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <StoreIcon size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-sm font-medium">{ui('noResults')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
                    {filteredStores.map(store => (
                        <Card
                            key={store.id}
                            className="cursor-pointer hover:border-primary/50 transition-colors active:scale-[0.98] border-border shadow-sm"
                            onClick={() => {
                                haptic.impact('light');
                                navigate(`/admin/stores/${store.id}`);
                            }}
                        >
                            <CardContent className="p-4 flex items-start gap-4">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 ring-1 ring-primary/20">
                                    <StoreIcon className="text-primary" size={24} />
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <h3 className="font-bold text-foreground text-[15px] truncate tracking-tight">{store.name}</h3>
                                    {store.address ? (
                                        <div className="flex items-center text-xs text-muted-foreground mt-1 bg-accent/50 rounded-md px-1.5 py-0.5 inline-flex max-w-full">
                                            <MapPin size={12} className="mr-1 shrink-0" />
                                            <span className="truncate font-medium">{store.address}</span>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-muted-foreground mt-1 opacity-60">No address</div>
                                    )}
                                </div>
                                <div className="shrink-0 text-muted-foreground">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground">
                                        <MoreVertical size={16} />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </PageLayout>
    );
};
