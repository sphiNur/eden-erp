import { AnimatePresence, motion } from 'framer-motion';
import { ListFilter } from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { StoreRequestProvider, useStoreRequestContext } from '../contexts/StoreRequestContext';

import { CategoryFilter } from './store-request/CategoryFilter';
import { ProductListItem } from './store-request/ProductListItem';
import { CartSheet } from './store-request/CartSheet';
import { PageLayout } from './layout/PageLayout';
import { PageHeader } from './layout/PageHeader';
import { Store, CalendarDays, Search, X, CheckCircle2, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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

    // Category selection counts
    const categoryCounts: Record<string, number> = {};
    Object.entries(quantities).forEach(([productId, qty]) => {
        if (qty > 0) {
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
                {/* Top Row: Search + Store + Date */}
                <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2 text-muted-foreground" size={14} />
                        <Input
                            type="text"
                            placeholder={ui('search')}
                            className="w-full pl-8 pr-7 py-1.5 bg-accent border-none rounded-lg focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary text-[13px] transition-all text-foreground placeholder:text-muted-foreground"
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button type="button" onClick={() => setSearchTerm('')} className="absolute right-2 top-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                                <X size={14} />
                            </button>
                        )}
                    </div>

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

                    <div className="flex items-center bg-accent px-2 py-1.5 rounded-lg shrink-0 transition-colors focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/20 w-[100px]">
                        <CalendarDays size={14} className="text-muted-foreground mr-1.5" />
                        <Input
                            type="date"
                            className="h-8 border-none bg-transparent text-[13px] font-medium outline-none focus-visible:ring-0 shadow-none px-0 w-full text-foreground"
                            value={deliveryDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeliveryDate(e.target.value)}
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
                    <div className="space-y-4 px-3">
                        <Skeleton className="h-[20px] w-[100px] rounded" />
                        <Skeleton className="h-[60px] w-full rounded-md" />
                        <Skeleton className="h-[60px] w-full rounded-md" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-xl border border-destructive/20 m-3 shadow-sm">
                        <p className="text-destructive font-medium mb-4 text-sm">{error}</p>
                        <Button variant="outline" onClick={refresh} className="bg-destructive/10 text-destructive border-transparent hover:bg-destructive/20 hover:text-destructive">
                            {ui('retry')}
                        </Button>
                    </div>
                ) : Object.keys(groupedProducts).length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                        <Package size={48} className="mb-4 opacity-20" />
                        <p className="font-semibold">{ui('noProductsFound')}</p>
                    </div>
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

            <Dialog open={showSuccess}>
                <DialogContent className="sm:max-w-md bg-card border-none shadow-2xl flex flex-col items-center justify-center p-8 [&>button]:hidden">
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
                        <CheckCircle2 className="w-20 h-20 text-success mb-4" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-foreground text-center">{ui('orderSubmitted')}</h2>
                </DialogContent>
            </Dialog>

            <Sheet open={showCart} onOpenChange={setShowCart}>
                <SheetContent side="bottom" className="rounded-t-2xl px-4 py-2 flex flex-col max-h-[85dvh] border-border bg-card/95 backdrop-blur-md">
                    <SheetHeader className="shrink-0 pb-2 border-b border-border">
                        <SheetTitle className="text-left font-bold flex items-center justify-between mt-2">
                            <span>{ui('selectedItems')}</span>
                            <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{totalCount} items</span>
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-hidden mt-2 pb-safe">
                        <CartSheet
                            cartItems={cartItems}
                            estimatedTotal={estimatedTotal}
                            submitting={submitting}
                            onSubmit={handleSubmit}
                            onUpdateQty={setQty}
                            isCartOpen={showCart}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </PageLayout>
    );
};
