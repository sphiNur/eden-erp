import { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Minus, Loader2, Search, ListFilter, X, Store, CalendarDays } from 'lucide-react';
import { Product, OrderItemInput } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { getLocale } from '../lib/locale';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';

import { productsApi, ordersApi, storesApi } from '../api/client';
import WebApp from '@twa-dev/sdk';
import { Button } from './ui/button';
import Fuse from 'fuse.js';

// Shared components
import { ProductListSkeleton } from './shared/Skeleton';
import { EmptyState } from './shared/EmptyState';
import { ErrorRetry } from './shared/ErrorRetry';
import { SuccessOverlay } from './shared/SuccessOverlay';
import { BottomDrawer } from './shared/BottomDrawer';
import { QuantityControl } from './shared/QuantityControl';

interface StoreOption {
    id: string;
    name: string;
}

export const StoreRequest = () => {
    const { t, ui, language } = useLanguage();
    const { user } = useUser();
    const locale = getLocale(language);

    // --- State ---
    const [products, setProducts] = useState<Product[]>([]);
    const [stores, setStores] = useState<StoreOption[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [selectedStore, setSelectedStore] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('');
    const [showCart, setShowCart] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Default to tomorrow
    const defaultDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    }, []);
    const [deliveryDate, setDeliveryDate] = useState(defaultDate);

    // --- Data Fetching ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [productData, storeData] = await Promise.all([
                productsApi.list(),
                storesApi.list().catch(() => [] as StoreOption[])
            ]);
            setProducts(productData);

            // Filter stores by user permissions
            let filteredStores = storeData;
            if (user?.role === 'store_manager' && user.allowed_store_ids?.length) {
                filteredStores = storeData.filter(s => user.allowed_store_ids!.includes(s.id));
            }
            setStores(filteredStores);
            if (filteredStores.length > 0 && !selectedStore) {
                setSelectedStore(filteredStores[0].id);
            }
        } catch (err) {
            console.error(err);
            setError(ui('errorOccurred'));
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- Categories ---
    const allLabel = ui('all');
    const otherLabel = ui('other');

    const categories = useMemo(() => {
        const cats = new Set(products.map(p =>
            p.category ? t(p.category.name_i18n) : otherLabel
        ));
        return [allLabel, ...Array.from(cats).sort()];
    }, [products, language, allLabel, otherLabel]);

    useEffect(() => { setActiveCategory(allLabel); }, [allLabel]);

    // --- Search + Filter ---
    const fuse = useMemo(() => new Fuse(products, {
        keys: ['name_i18n.en', 'name_i18n.ru', 'name_i18n.uz', 'name_i18n.cn'],
        threshold: 0.3,
        distance: 100,
    }), [products]);

    const filteredProducts = useMemo(() => {
        let result = products;
        if (searchTerm.trim()) {
            result = fuse.search(searchTerm).map(r => r.item);
        }
        if (activeCategory && activeCategory !== allLabel) {
            result = result.filter(p => {
                const catName = p.category ? t(p.category.name_i18n) : otherLabel;
                return catName === activeCategory;
            });
        }
        return result;
    }, [products, searchTerm, activeCategory, fuse, language, allLabel, otherLabel]);

    const groupedProducts = useMemo(() => {
        const groups: Record<string, Product[]> = {};
        filteredProducts.forEach(p => {
            const cat = p.category ? t(p.category.name_i18n) : otherLabel;
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(p);
        });
        return groups;
    }, [filteredProducts, language, otherLabel]);

    // --- Cart computation ---
    const setQty = useCallback((productId: string, val: number) => {
        setQuantities(prev => ({ ...prev, [productId]: val }));
        if (val > 0) WebApp.HapticFeedback.impactOccurred('light');
    }, []);

    const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

    const cartItems = useMemo(
        () => Object.entries(quantities)
            .filter(([_, qty]) => qty > 0)
            .map(([pid, qty]) => ({ product: productMap.get(pid), qty })),
        [quantities, productMap]
    );

    const cartItemCount = cartItems.length;

    // Estimated total based on reference prices
    const estimatedTotal = useMemo(
        () => cartItems.reduce((sum, { product, qty }) =>
            sum + (product?.price_reference || 0) * qty, 0),
        [cartItems]
    );

    // Category selection counts (how many items selected per category)
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        Object.entries(quantities).forEach(([pid, qty]) => {
            if (qty <= 0) return;
            const p = productMap.get(pid);
            if (!p) return;
            const cat = p.category ? t(p.category.name_i18n) : otherLabel;
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    }, [quantities, productMap, language, otherLabel]);

    // Total selection count for "All" badge
    const totalSelectedCount = useMemo(
        () => Object.values(categoryCounts).reduce((a, b) => a + b, 0),
        [categoryCounts]
    );

    // --- Submit ---
    const handleSubmit = async () => {
        if (cartItemCount === 0) { WebApp.showAlert(ui('cartIsEmpty')); return; }
        if (!selectedStore) { WebApp.showAlert(ui('selectStore')); return; }
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
            WebApp.MainButton.showProgress(true);
            await ordersApi.create({ store_id: selectedStore, delivery_date: deliveryDate, items });

            setShowCart(false);
            setShowSuccess(true);
            setTimeout(() => { setShowSuccess(false); setQuantities({}); }, 2000);
            WebApp.HapticFeedback.notificationOccurred('success');
        } catch (err) {
            console.error(err);
            WebApp.showAlert(ui('orderFailed'));
        } finally {
            WebApp.MainButton.hideProgress();
            setSubmitting(false);
        }
    };

    // --- Render: Loading / Error ---
    if (loading) return <ProductListSkeleton />;
    if (error) return <ErrorRetry message={error} onRetry={fetchData} />;

    return (
        <div className="bg-gray-50 relative">
            {/* ─── Toolbar ─── */}
            <div className="sticky top-header z-toolbar bg-white border-b shadow-sm">
                <div className="px-3 pt-2 pb-1">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        {/* Store selector */}
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1.5 rounded-lg flex-1 min-w-0">
                            <Store size={16} className="text-gray-500 shrink-0" />
                            <select
                                className="bg-transparent font-medium text-sm w-full outline-none truncate"
                                value={selectedStore}
                                onChange={(e) => setSelectedStore(e.target.value)}
                            >
                                {stores.length === 0 && <option value="">{ui('selectStore')}</option>}
                                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        {/* Date picker */}
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1.5 rounded-lg shrink-0">
                            <CalendarDays size={14} className="text-gray-500" />
                            <input
                                type="date"
                                className="bg-transparent text-sm font-medium outline-none w-[110px]"
                                value={deliveryDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setDeliveryDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="px-3 pb-1.5 space-y-1.5">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder={ui('search')}
                            className="w-full pl-8 pr-8 py-1.5 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-eden-500 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Category pills with selection counts */}
                    <div className="overflow-x-auto -mx-3 px-3 scrollbar-hide">
                        <div className="flex gap-1.5">
                            {categories.map(cat => {
                                const isAll = cat === allLabel;
                                const count = isAll ? totalSelectedCount : (categoryCounts[cat] || 0);
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={cn(
                                            "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1",
                                            activeCategory === cat
                                                ? "bg-eden-500 text-white shadow-sm"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        )}
                                    >
                                        {cat}
                                        {count > 0 && (
                                            <span className={cn(
                                                "min-w-[16px] h-[16px] rounded-full text-[9px] font-bold inline-flex items-center justify-center",
                                                activeCategory === cat
                                                    ? "bg-white/30 text-white"
                                                    : "bg-eden-50 text-eden-500"
                                            )}>
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Product List ─── */}
            <main className="p-3 space-y-3">
                {Object.keys(groupedProducts).length === 0 ? (
                    <EmptyState
                        title={ui('noProductsFound')}
                        description={searchTerm ? undefined : undefined}
                    />
                ) : (
                    Object.entries(groupedProducts).map(([category, items]) => (
                        <div key={category} className="space-y-1">
                            <h3 className="font-semibold text-gray-500 text-[10px] uppercase tracking-wider py-0.5 pl-1">
                                {category}
                            </h3>
                            <div className="bg-white rounded-md shadow-sm border overflow-hidden divide-y divide-gray-100">
                                {items.map(product => {
                                    const qty = quantities[product.id] || 0;
                                    return (
                                        <div
                                            key={product.id}
                                            className={cn(
                                                "px-3 py-2 flex items-center justify-between transition-colors",
                                                qty > 0 ? "bg-eden-50" : "hover:bg-gray-50"
                                            )}
                                        >
                                            <div className="flex-1 min-w-0 pr-2 flex items-center gap-1.5 overflow-hidden">
                                                <div className="font-semibold text-gray-900 text-[13px] truncate">
                                                    {t(product.name_i18n)}
                                                </div>
                                                <div className="text-[10px] text-gray-400 shrink-0">
                                                    {formatCurrency(product.price_reference || 0, 'UZS', locale)} / {t(product.unit_i18n)}
                                                </div>
                                            </div>

                                            <QuantityControl
                                                value={qty}
                                                onChange={(val) => setQty(product.id, val)}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* ─── Cart FAB ─── */}
            <AnimatePresence>
                {cartItemCount > 0 && !showSuccess && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowCart(true)}
                        className="fixed bottom-20 right-4 w-14 h-14 bg-eden-500 text-white rounded-full shadow-lg flex items-center justify-center z-fab"
                    >
                        <ListFilter size={22} />
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                            {cartItemCount}
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ─── Success Overlay ─── */}
            <SuccessOverlay show={showSuccess} message={ui('orderSubmitted')} />

            {/* ─── Cart Drawer ─── */}
            <BottomDrawer
                open={showCart}
                onClose={() => setShowCart(false)}
                title={ui('selectedItems')}
                badge={cartItemCount}
                footer={
                    <div className="space-y-2">
                        {estimatedTotal > 0 && (
                            <div className="flex justify-between text-sm text-gray-500 px-1">
                                <span>{ui('estimatedTotal')}</span>
                                <span className="font-mono font-bold text-gray-700">
                                    ~{formatCurrency(estimatedTotal, 'UZS', locale)}
                                </span>
                            </div>
                        )}
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || cartItemCount === 0}
                            size="lg"
                            className="w-full text-lg font-bold bg-eden-500 hover:bg-eden-600 h-12 disabled:opacity-50"
                        >
                            {submitting && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
                            {ui('confirmSubmit')}
                        </Button>
                    </div>
                }
            >
                {cartItems.length === 0 ? (
                    <div className="text-center text-gray-400 py-10">{ui('cartEmpty')}</div>
                ) : (
                    <div className="space-y-1 divide-y divide-gray-100">
                        {cartItems.map(({ product, qty }) => (
                            <div key={product?.id} className="flex justify-between items-center py-3">
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-gray-900 truncate">{product ? t(product.name_i18n) : 'Unknown'}</h3>
                                    <p className="text-xs text-gray-500">{product ? t(product.unit_i18n) : ''}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <button
                                        onClick={() => product && setQty(product.id, Math.max(0, qty <= 1 ? 0 : qty - 1))}
                                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="font-bold w-8 text-center tabular-nums">{qty}</span>
                                    <button
                                        onClick={() => product && setQty(product.id, qty + 1)}
                                        className="w-8 h-8 rounded-full bg-eden-50 text-eden-500 flex items-center justify-center active:scale-90 transition-transform"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </BottomDrawer>
        </div>
    );
};
