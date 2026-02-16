import { useState, useEffect, useMemo } from 'react';
import { Store as StoreIcon, MapPin, Loader2, Search, Plus, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { useLanguage } from '../../contexts/LanguageContext';
import { storesApi } from '../../api/client';
import type { Store as StoreType } from '../../types';
import WebApp from '@twa-dev/sdk';
import { StoreForm } from './StoreForm';

export const StoreList = () => {
    const { ui } = useLanguage();
    const [stores, setStores] = useState<StoreType[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<StoreType | null>(null);

    const fetchStores = async () => {
        try {
            const data = await storesApi.list();
            setStores(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, []);

    const filteredStores = useMemo(() => {
        const term = search.toLowerCase();
        return stores.filter(s =>
            s.name.toLowerCase().includes(term) ||
            (s.address || '').toLowerCase().includes(term)
        );
    }, [stores, search]);

    const handleAdd = () => {
        WebApp.HapticFeedback.impactOccurred('light');
        setEditingStore(null);
        setIsFormOpen(true);
    };

    const handleEdit = (store: StoreType) => {
        WebApp.HapticFeedback.impactOccurred('light');
        setEditingStore(store);
        setIsFormOpen(true);
    };

    return (
        <div className="bg-gray-50 flex flex-col min-h-[calc(100vh-var(--header-h))]">
            {/* ─── Sticky Toolbar ─── */}
            <div className="sticky top-header z-toolbar bg-white border-b shadow-sm px-3 py-2 flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <Input
                        placeholder={ui('search')}
                        className="w-full pl-8 pr-8 h-9 bg-gray-100 border-transparent focus:bg-white focus:border-eden-500 rounded-lg text-sm transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X size={14} />
                        </button>
                    )}
                </div>
                <Button
                    size="sm"
                    className="h-9 w-9 p-0 rounded-full bg-eden-500 hover:bg-eden-600 text-white shadow-sm shrink-0"
                    onClick={handleAdd}
                >
                    <Plus className="h-5 w-5" />
                </Button>
            </div>

            <main className="flex-1 p-3">
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
                ) : (
                    filteredStores.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-sm">{ui('noResults')}</div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden divide-y divide-gray-100">
                            {filteredStores.map(store => (
                                <div
                                    key={store.id}
                                    className="px-3 py-3 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
                                    onClick={() => handleEdit(store)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                                            <StoreIcon size={18} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-[13px] text-gray-900 leading-none mb-1">{store.name}</div>
                                            <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                                <MapPin size={10} />
                                                <span>{store.address || ui('noAddress')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] text-eden-600 border-eden-200 bg-eden-50">{ui('active')}</Badge>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </main>

            <StoreForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={fetchStores}
                storeToEdit={editingStore}
            />
        </div>
    );
};

