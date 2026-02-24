import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { haptic, tgAlert, tgMainButton } from '../lib/telegram';
import { useLanguage } from './LanguageContext';
import { useStoreCatalog } from '../hooks/useStoreCatalog';
import { useProductFilter } from '../hooks/useProductFilter';
import { useCart } from '../hooks/useCart';
import { Product, Store, OrderItemInput } from '../types';
import { ordersApi } from '../api/client';

interface StoreRequestContextProps {
    products: Product[];
    stores: Store[];
    loading: boolean;
    error: string | null;
    refresh: () => void;

    groupedProducts: Record<string, Product[]>;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    activeCategory: string;
    setActiveCategory: (cat: string) => void;
    categories: string[];

    quantities: Record<string, number>;
    setQty: (productId: string, qty: number) => void;
    cartItems: Array<{ product: Product | undefined; qty: number }>;
    totalCount: number;
    estimatedTotal: number;

    selectedStore: string;
    setSelectedStore: (storeId: string) => void;
    showCart: boolean;
    setShowCart: (show: boolean) => void;
    submitting: boolean;
    showSuccess: boolean;
    deliveryDate: string;
    setDeliveryDate: (date: string) => void;

    handleSubmit: () => void;
}

const StoreRequestContext = createContext<StoreRequestContextProps | undefined>(undefined);

export const StoreRequestProvider = ({ children }: { children: ReactNode }) => {
    const { ui } = useLanguage();

    // Data Hooks
    const { products, stores, loading, error, refresh } = useStoreCatalog();
    const { groupedProducts, searchTerm, setSearchTerm, activeCategory, setActiveCategory, categories } = useProductFilter(products);
    const { quantities, setQty, cartItems, totalCount, estimatedTotal, reset: resetCart } = useCart(products);

    // Local State
    const [selectedStore, setSelectedStore] = useState('');
    const [showCart, setShowCart] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Default Date (Tomorrow)
    const defaultDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    }, []);
    const [deliveryDate, setDeliveryDate] = useState(defaultDate);

    // Auto-select first store if none selected
    useMemo(() => {
        if (stores.length > 0 && !selectedStore) {
            setSelectedStore(stores[0].id);
        }
    }, [stores, selectedStore]);

    const handleSubmit = async () => {
        if (totalCount === 0) { tgAlert(ui('cartIsEmpty')); return; }
        if (!selectedStore) { tgAlert(ui('selectStore')); return; }
        if (submitting) return;

        setSubmitting(true);
        const noteText = ui('dailyRequest');
        const allNotes = { en: noteText, ru: noteText, uz: noteText, cn: noteText };

        const items: OrderItemInput[] = Object.entries(quantities)
            .filter(([_, qty]) => qty > 0)
            .map(([pid, qty]) => ({
                product_id: pid,
                quantity_requested: qty,
                notes: allNotes
            }));

        try {
            tgMainButton.showProgress(true);
            await ordersApi.create({ store_id: selectedStore, delivery_date: deliveryDate, items });

            setShowCart(false);
            setShowSuccess(true);
            setTimeout(() => { setShowSuccess(false); resetCart(); }, 2000);
            haptic.notification('success');
        } catch (err) {
            console.error(err);
            tgAlert(ui('orderFailed'));
        } finally {
            tgMainButton.hideProgress();
            setSubmitting(false);
        }
    };

    const value = {
        products, stores, loading, error, refresh,
        groupedProducts, searchTerm, setSearchTerm, activeCategory, setActiveCategory, categories,
        quantities, setQty, cartItems, totalCount, estimatedTotal,
        selectedStore, setSelectedStore, showCart, setShowCart,
        submitting, showSuccess, deliveryDate, setDeliveryDate,
        handleSubmit
    };

    return (
        <StoreRequestContext.Provider value={value}>
            {children}
        </StoreRequestContext.Provider>
    );
};

export const useStoreRequestContext = () => {
    const context = useContext(StoreRequestContext);
    if (context === undefined) {
        throw new Error('useStoreRequestContext must be used within a StoreRequestProvider');
    }
    return context;
};
