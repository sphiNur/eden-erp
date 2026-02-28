import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { productsApi, storesApi } from '../api/client';
import { useUser } from '../contexts/UserContext';
import { useLanguage } from '../contexts/LanguageContext';

interface StoreOption {
    id: string;
    name: string;
}

export const useStoreCatalog = () => {
    const { user } = useUser();
    const { ui } = useLanguage();

    const [products, setProducts] = useState<Product[]>([]);
    const [stores, setStores] = useState<StoreOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [productData, storeData] = await Promise.all([
                productsApi.list(),
                storesApi.list().catch(() => [] as StoreOption[])
            ]);
            setProducts(productData);

            let filteredStores = storeData;
            if (user?.role === 'store_manager' && user.allowed_store_ids?.length) {
                filteredStores = storeData.filter(s => user.allowed_store_ids!.includes(s.id));
            }
            setStores(filteredStores);
        } catch (err) {
            console.error(err);
            setError(ui('errorOccurred'));
        } finally {
            setLoading(false);
        }
    }, [user, ui]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        products,
        stores,
        loading,
        error,
        refresh: fetchData
    };
};
