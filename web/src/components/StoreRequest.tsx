import { AnimatePresence, motion } from 'framer-motion';
import { ListFilter } from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { StoreRequestProvider, useStoreRequestContext } from '../contexts/StoreRequestContext';

// Shared components
import { ProductListSkeleton } from './shared/Skeleton';
import { EmptyState } from './shared/EmptyState';
import { ErrorRetry } from './shared/ErrorRetry';
import { SuccessOverlay } from './shared/SuccessOverlay';
import { BottomDrawer } from './shared/BottomDrawer';

// Sub-components
import { CategoryFilter } from './store-request/CategoryFilter';
import { ProductListItem } from './store-request/ProductListItem';
import { CartSheet } from './store-request/CartSheet';
import { PageLayout } from './layout/PageLayout';
import { PageHeader } from './layout/PageHeader';
import { Store, CalendarDays, Search, X } from 'lucide-react';
import { Input } from './ui/input';

export const StoreRequest = () => {
    return (
        <StoreRequestProvider>
            <StoreRequestContent />
        </StoreRequestProvider>
    );
};

const StoreRequestContent = () => {
    const { ui } = useLanguage();

    const {
        loading, error, refresh,
        stores, groupedProducts, categories,
        searchTerm, setSearchTerm,
        activeCategory, setActiveCategory,
        selectedStore, setSelectedStore,
        deliveryDate, setDeliveryDate,
        quantities, setQty, cartItems, totalCount, estimatedTotal,
        showCart, setShowCart,
        submitting, showSuccess,
        handleSubmit
    } = useStoreRequestContext();

    // Calculate category selection counts
    const categoryCounts: Record<string, number> = {};
    Object.entries(quantities).forEach(([productId, qty]) => {
        if (qty > 0) {
            // Find the product to get its category name
            const product = groupedProducts &&
                Object.values(groupedProducts).flat().find(p => p.id === productId);

            if (product && product.category) {
                const catName = product.category.name_i18n.en || product.category.name_i18n.uz || 'Unknown';
                categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
            }
        }
    });

    const header = (
        <PageHeader>
            <div className="space-y-3 pb-1">
                {/* ─── Compact Top Row: Search + Store + Date ─── */}
                <div className="flex gap-2 items-center">
                    {/* Search (Expands) */}
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2 text-muted-foreground" size={14} />
                        <Input
                            type="text"
                            placeholder={ui('search')}
                            className="w-full pl-8 pr-7 py-1.5 bg-accent border-none rounded-lg focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary text-[13px] transition-all text-foreground placeholder:text-muted-foreground"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button type="button" onClick={() => setSearchTerm('')} className="absolute right-2 top-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Store (Compact Icon Only or Small Select) */}
                    <div className="flex items-center bg-accent px-2 py-1.5 rounded-lg shrink-0 transition-colors focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/20 w-[100px]">
                        <Store size={14} className="text-muted-foreground shrink-0 mr-1.5" />
                        <select
                            className="bg-transparent font-medium text-[13px] w-full outline-none truncate appearance-none text-foreground"
                            value={selectedStore}
                            onChange={(e) => setSelectedStore(e.target.value)}
                        >
                            {stores.length === 0 && <option value="">{ui('selectStore')}</option>}
                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    {/* Date picker (Compact) */}
                    <div className="flex items-center bg-accent px-2 py-1.5 rounded-lg shrink-0 transition-colors focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/20 w-[100px]">
                        <CalendarDays size={14} className="text-muted-foreground mr-1.5" />
                        <Input
                            type="date"
                            className="h-8 border-none bg-transparent text-[13px] font-medium outline-none focus-visible:ring-0 shadow-none px-0 w-full text-foreground"
                            value={deliveryDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                        />
                    </div>
                </div>

            </div>
            <div className="pt-1 flex items-center justify-between">
                <div className="flex-1 overflow-x-auto scrollbar-hide">
                    <CategoryFilter
                        categories={categories}
                        activeCategory={activeCategory}
                        onSelectCategory={setActiveCategory}
                        categoryCounts={categoryCounts}
                        totalSelectedCount={totalCount}
                        allLabel={ui('all')}
                    />
                </div>
            </div>
        </PageHeader>
    );

    const floatingAction = (
        <AnimatePresence>
            {totalCount > 0 && !showSuccess && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowCart(true)}
                    className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center"
                >
                    <ListFilter size={22} />
                    <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-card">
                        {totalCount}
                    </span>
                </motion.button>
            )}
        </AnimatePresence>
    );

    return (
        <PageLayout header={header} floatingAction={floatingAction} className="bg-secondary">
            <div className="space-y-3 pb-24">
                {loading ? (
                    <ProductListSkeleton />
                ) : error ? (
                    <ErrorRetry message={error} onRetry={refresh} />
                ) : Object.keys(groupedProducts).length === 0 ? (
                    <EmptyState
                        title={ui('noProductsFound')}
                        description={undefined}
                    />
                ) : (
                    Object.entries(groupedProducts).map(([category, items]) => (
                        <div key={category} className="space-y-1">
                            <h3 className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider py-0.5 pl-1">
                                {category}
                            </h3>
                            <div className="bg-card rounded-md shadow-sm border border-border overflow-hidden divide-y divide-border">
                                {items.map(product => (
                                    <ProductListItem
                                        key={product.id}
                                        product={product}
                                        quantity={quantities[product.id] || 0}
                                        onChange={(val) => setQty(product.id, val)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <SuccessOverlay show={showSuccess} message={ui('orderSubmitted')} />

            <BottomDrawer
                open={showCart}
                onClose={() => setShowCart(false)}
                title={ui('selectedItems')}
                badge={totalCount}
            >
                <CartSheet
                    cartItems={cartItems}
                    estimatedTotal={estimatedTotal}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    onUpdateQty={setQty}
                />
            </BottomDrawer>
        </PageLayout>
    );
};

