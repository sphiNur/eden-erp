import { AnimatePresence, motion } from 'framer-motion';
import { ListFilter } from 'lucide-react';
import { useState } from 'react';

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
import { AIPasteModal } from './store-request/AIPasteModal';
import { PageLayout } from './layout/PageLayout';
import { PageHeader } from './layout/PageHeader';
import { Store, CalendarDays, Search, X, Zap, Sparkles } from 'lucide-react';

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
        stores, templates, groupedProducts, categories,
        searchTerm, setSearchTerm,
        activeCategory, setActiveCategory,
        selectedStore, setSelectedStore,
        deliveryDate, setDeliveryDate,
        quantities, setQty, cartItems, totalCount, estimatedTotal,
        showCart, setShowCart,
        submitting, showSuccess,
        handleLoadTemplate, handleDeleteTemplate, handleSaveTemplate, handleSubmit,
        showTemplatePrompt, setShowTemplatePrompt, templatePromptResolver
    } = useStoreRequestContext();

    const [showAIModal, setShowAIModal] = useState(false);

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
                        <input
                            type="text"
                            placeholder={ui('search')}
                            className="w-full pl-8 pr-7 py-1.5 bg-accent rounded-lg outline-none focus:bg-card focus:ring-2 focus:ring-primary text-[13px] transition-all text-foreground placeholder:text-muted-foreground"
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
                        <input
                            type="date"
                            className="bg-transparent text-[13px] font-medium outline-none w-full text-foreground"
                            value={deliveryDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* ─── Quick Order Templates ─── */}
                {templates.length > 0 && (
                    <div className="overflow-x-auto -mx-3 px-3 scrollbar-hide py-1">
                        <div className="flex gap-2">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center shrink-0">
                                <Zap size={12} className="mr-1" aria-hidden /> Quick:
                            </div>
                            {templates.map(tmpl => (
                                <div
                                    key={tmpl.id}
                                    onClick={() => handleLoadTemplate(tmpl)}
                                    className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 active:bg-primary/20 active:scale-95 transition-all cursor-pointer select-none"
                                >
                                    {tmpl.name}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTemplate(tmpl.id);
                                        }}
                                        className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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

                {/* AI Paste Button */}
                <button
                    onClick={() => setShowAIModal(true)}
                    className="ml-2 shrink-0 bg-primary/10 text-primary border border-primary/20 pl-2 pr-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 active:bg-primary/20 transition-all shadow-sm"
                >
                    <Sparkles size={14} className="animate-pulse" />
                    AI Auto-Fill
                </button>
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
                    onSaveTemplate={handleSaveTemplate}
                    onUpdateQty={setQty}
                />
            </BottomDrawer>

            {/* Template Name Prompt Modal */}
            <AnimatePresence>
                {showTemplatePrompt && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black z-overlay"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-overlay flex items-center justify-center p-4"
                        >
                            <div className="bg-card rounded-xl shadow-xl p-5 w-full max-w-sm">
                                <h3 className="font-bold text-lg mb-2 text-foreground">Save Template</h3>
                                <p className="text-muted-foreground text-sm mb-4">Enter a name for this template (e.g., 'Daily Veggies')</p>
                                <input
                                    id="template-name-input"
                                    type="text"
                                    className="w-full bg-accent rounded-lg px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-primary font-medium text-foreground"
                                    placeholder="Template name"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = (e.target as HTMLInputElement).value.trim();
                                            templatePromptResolver?.(val || null);
                                            setShowTemplatePrompt(false);
                                        }
                                    }}
                                />
                                <div className="flex gap-3">
                                    <button
                                        className="flex-1 py-2.5 rounded-lg bg-accent text-foreground font-semibold active:scale-95 transition-transform"
                                        onClick={() => {
                                            templatePromptResolver?.(null);
                                            setShowTemplatePrompt(false);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold active:scale-95 transition-transform"
                                        onClick={() => {
                                            const val = (document.getElementById('template-name-input') as HTMLInputElement).value.trim();
                                            templatePromptResolver?.(val || null);
                                            setShowTemplatePrompt(false);
                                        }}
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AIPasteModal
                open={showAIModal}
                onClose={() => setShowAIModal(false)}
            />
        </PageLayout>
    );
};

