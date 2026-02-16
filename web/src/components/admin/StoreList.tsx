import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, MapPin, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Store } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { storesApi } from '../../api/client';
import WebApp from '@twa-dev/sdk';

import { StoreForm } from './StoreForm';
import { PageLayout } from '../layout/PageLayout';

export const StoreList = () => {
    const { ui } = useLanguage();
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<Store | null>(null);

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

    const filtered = useMemo(() => stores.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.address || '').toLowerCase().includes(search.toLowerCase())
    ), [stores, search]);

    const toolbar = (
        <div className="px-3 py-2 flex items-center gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <Input
                    placeholder={ui('search')}
                    className="w-full pl-8 pr-8 h-9 bg-gray-100 border-transparent focus:bg-white focus:border-eden-500 rounded-lg text-sm transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <Button
                size="sm"
                className="h-9 w-9 p-0 rounded-full bg-eden-500 hover:bg-eden-600 text-white shadow-sm shrink-0"
                onClick={() => {
                    WebApp.HapticFeedback.impactOccurred('light');
                    setEditingStore(null);
                    setIsAddOpen(true);
                }}
            >
                <Plus className="h-5 w-5" />
            </Button>
        </div>
    );

    return (
        <PageLayout toolbar={toolbar}>
            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
            ) : (
                filtered.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">{ui('noResults')}</div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden divide-y divide-gray-100">
                        {filtered.map(store => (
                            <div
                                key={store.id}
                                className="px-4 py-3 flex justify-between items-center hover:bg-gray-50 cursor-pointer active:bg-gray-100"
                                onClick={() => {
                                    WebApp.HapticFeedback.impactOccurred('light');
                                    setEditingStore(store);
                                    setIsAddOpen(true);
                                }}
                            >
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{store.name}</h3>
                                    <div className="flex items-center text-xs text-gray-500">
                                        <MapPin size={12} className="mr-1" />
                                        {store.address || ui('noAddress')}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">
                                        {ui('active')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            <StoreForm
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={fetchStores}
                storeToEdit={editingStore}
            />
        </PageLayout>
    );
};
