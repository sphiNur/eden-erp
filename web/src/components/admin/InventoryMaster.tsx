import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Product } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { productsApi } from '../../api/client';
import { haptic } from '../../lib/telegram';
import { PageLayout } from '../layout/PageLayout';
import { PageHeader } from '../layout/PageHeader';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';

export const InventoryMaster = () => {
    const { t, ui } = useLanguage();
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const data = await productsApi.list();
            setProducts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => products.filter(p => {
        const term = search.toLowerCase();
        return Object.values(p.name_i18n).some(val => val.toLowerCase().includes(term));
    }), [products, search]);

    const groupedProducts = useMemo(() => {
        const groups: Record<string, Product[]> = {};
        const otherLabel = ui('other');
        filtered.forEach(p => {
            const cat = p.category ? t(p.category.name_i18n) : otherLabel;
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(p);
        });
        return groups;
    }, [filtered, t, ui]);

    const header = (
        <PageHeader>
            <div className="mt-1">
                <Input
                    placeholder={ui('searchProducts')}
                    className="w-full bg-accent border-none h-9 focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                />
            </div>
        </PageHeader>
    );

    const floatingAction = (
        <button
            onClick={() => {
                haptic.impact('medium');
                navigate('/admin/products/new');
            }}
            className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
        >
            <Plus size={24} />
        </button>
    );

    return (
        <PageLayout header={header} floatingAction={floatingAction} className="bg-secondary">
            {loading ? (
                <div className="space-y-4 px-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-14 w-full rounded-lg" />
                    <Skeleton className="h-14 w-full rounded-lg" />
                </div>
            ) : Object.keys(groupedProducts).length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">{ui('noProductsFound')}</div>
            ) : (
                Object.entries(groupedProducts).map(([category, items]) => (
                    <div key={category} className="space-y-1 mb-3">
                        <h3 className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider py-0.5 pl-1">
                            {category}
                        </h3>
                        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden divide-y divide-border">
                            {items.map(product => (
                                <div
                                    key={product.id}
                                    className="px-3 py-2.5 flex items-center justify-between hover:bg-accent cursor-pointer transition-colors active:bg-accent/80"
                                    onClick={() => {
                                        haptic.impact('light');
                                        navigate(`/admin/products/${product.id}`);
                                    }}
                                >
                                    <div className="flex-1 min-w-0 pr-3">
                                        <div className="font-semibold text-foreground text-[13px] leading-tight mb-0.5 break-words">
                                            {Object.values(product.name_i18n).join(' / ')}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="font-mono text-xs text-muted-foreground">
                                            {product.price_reference ? product.price_reference.toLocaleString() : '-'}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground/70 font-medium">
                                            {t(product.unit_i18n)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </PageLayout>
    );
};
