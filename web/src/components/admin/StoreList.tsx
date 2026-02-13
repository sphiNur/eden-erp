import { useState, useEffect } from 'react';
import { Store as StoreIcon, MapPin, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { storesApi } from '../../api/client';
import type { Store as StoreType } from '../../types';

export const StoreList = () => {
    const { ui } = useLanguage();
    const [stores, setStores] = useState<StoreType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchStores();
    }, []);

    return (
        <div className="bg-gray-50 flex flex-col">
            <div className="bg-white border-b px-3 py-2 flex items-center gap-2 sticky top-header z-toolbar">
                <div className="flex-1">
                    <p className="text-xs text-gray-500">{stores.length} {ui('locations')}</p>
                </div>
                <Button size="sm" variant="outline">
                    {ui('addStore')}
                </Button>
            </div>

            <main className="p-3 space-y-2">
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
                ) : (
                    stores.map(store => (
                        <div key={store.id} className="bg-white px-3 py-2.5 rounded-lg border shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                    <StoreIcon size={18} />
                                </div>
                                <div>
                                    <div className="font-semibold text-[13px] text-gray-900">{store.name}</div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <MapPin size={12} />
                                        <span>{store.address || ui('noAddress')}</span>
                                    </div>
                                </div>
                            </div>
                            <Badge variant="secondary">{ui('active')}</Badge>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
};
