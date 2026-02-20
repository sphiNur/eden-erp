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
import { Store, CalendarDays, Search, X, Zap } from 'lucide-react';

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

    // --- Render ---
    if (loading) return <ProductListSkeleton />;
    if (error) return <ErrorRetry message={error} onRetry={refresh} />;

    const categoryCounts: Record<string, number> = {};

    const header = (
        <PageHeader>
            <div className="space-y-3 pb-1">
                {/* ─── Top Row: Store & Date ─── */}
                <div className="flex items-center gap-2">
                    {/* Store selector */}
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg flex-1 min-w-0 transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-eden-500/20">
                        <Store size={18} className="text-gray-500 shrink-0" />
                        <select
                            className="bg-transparent font-medium text-sm w-full outline-none truncate appearance-none"
                            value={selectedStore}
                            onChange={(e) => setSelectedStore(e.target.value)}
                        >
                            {stores.length === 0 && <option value="">{ui('selectStore')}</option>}
                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    {/* Date picker */}
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg shrink-0 transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-eden-500/20">
                        <CalendarDays size={18} className="text-gray-500" />
                        <input
                            type="date"
                            className="bg-transparent text-sm font-medium outline-none w-[120px]"
                            value={deliveryDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* ─── Search ─── */}
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder={ui('search')}
                        className="w-full pl-9 pr-9 py-2 bg-gray-100 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-eden-500 text-sm transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* ─── Quick Order Templates ─── */}
                {templates.length > 0 && (
                    <div className="overflow-x-auto -mx-3 px-3 scrollbar-hide py-1">
                        <div className="flex gap-2">
                            <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center shrink-0">
                                <Zap size={12} className="mr-1" /> Quick:
                            </div>
                            {templates.map(tmpl => (
                                <div
                                    key={tmpl.id}
                                    onClick={() => handleLoadTemplate(tmpl)}
                                    className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 active:bg-indigo-100 active:scale-95 transition-all cursor-pointer select-none"
                                >
                                    {tmpl.name}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTemplate(tmpl.id);
                                        }}
                                        className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center hover:bg-indigo-200"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="pt-1">
                <CategoryFilter
                    categories={categories}
                    activeCategory={activeCategory}
                    onSelectCategory={setActiveCategory}
                    categoryCounts={categoryCounts}
                    totalSelectedCount={totalCount}
                    allLabel={ui('all')}
                />
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
                    className="w-14 h-14 bg-eden-500 text-white rounded-full shadow-lg flex items-center justify-center"
                >
                    <ListFilter size={22} />
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                        {totalCount}
                    </span>
                </motion.button>
            )}
        </AnimatePresence>
    );

    return (
        <PageLayout header={header} floatingAction={floatingAction} className="bg-gray-50">
            <div className="space-y-3 pb-24">
                {Object.keys(groupedProducts).length === 0 ? (
                    <EmptyState
                        title={ui('noProductsFound')}
                        description={undefined}
                    />
                ) : (
                    Object.entries(groupedProducts).map(([category, items]) => (
                        <div key={category} className="space-y-1">
                            <h3 className="font-semibold text-gray-500 text-[10px] uppercase tracking-wider py-0.5 pl-1">
                                {category}
                            </h3>
                            <div className="bg-white rounded-md shadow-sm border overflow-hidden divide-y divide-gray-100">
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

            {/* Template Name Prompt Overlay */}
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
                            <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-sm">
                                <h3 className="font-bold text-lg mb-2">Save Template</h3>
                                <p className="text-gray-500 text-sm mb-4">Enter a name for this template (e.g., 'Daily Veggies')</p>
                                <input
                                    id="template-name-input"
                                    type="text"
                                    className="w-full bg-gray-100 rounded-lg px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-eden-500 font-medium"
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
                                        className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-semibold active:scale-95 transition-transform"
                                        onClick={() => {
                                            templatePromptResolver?.(null);
                                            setShowTemplatePrompt(false);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="flex-1 py-2.5 rounded-lg bg-eden-500 text-white font-bold active:scale-95 transition-transform"
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
        </PageLayout>
    );
};

