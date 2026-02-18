import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Product } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { productsApi } from '../../api/client';
import WebApp from '@twa-dev/sdk';
import { PageLayout } from '../layout/PageLayout';
import { PageHeader } from '../layout/PageHeader';
import { PageLoading } from '../shared/PageLoading';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/input';

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
        <PageHeader
            title={<span className="text-xl font-bold">{ui('inventory')}</span>}
            endAction={
                <Button
                    size="sm"
                    className="h-9 w-9 p-0 rounded-full bg-eden-500 hover:bg-eden-600 text-white shadow-sm shrink-0"
                    onClick={() => {
                        navigate('/admin/products/new');
                    }}
                >
                    <Plus className="h-5 w-5" />
                </Button>
            }
        >
            <div className="mt-1">
                <Input
                    placeholder={ui('searchProducts')}
                    className="w-full bg-gray-100 border-none h-9 focus:ring-1 focus:ring-eden-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </PageHeader>
    );

    if (loading) return <PageLoading />;

    return (
        <PageLayout header={header}>
            {Object.keys(groupedProducts).length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">{ui('noProductsFound')}</div>
            ) : (
                Object.entries(groupedProducts).map(([category, items]) => (
                    <div key={category} className="space-y-1 mb-3">
                        <h3 className="font-semibold text-gray-500 text-[10px] uppercase tracking-wider py-0.5 pl-1">
                            {category}
                        </h3>
                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden divide-y divide-gray-100">
                            {items.map(product => (
                                <div
                                    key={product.id}
                                    className="px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100"
                                    onClick={() => {
                                        WebApp.HapticFeedback.impactOccurred('light');
                                        navigate(`/admin/products/${product.id}`);
                                    }}
                                >
                                    <div className="flex-1 min-w-0 pr-3">
                                        {/* Primary: Multi-lang Name */}
                                        <div className="font-semibold text-gray-900 text-[13px] leading-tight mb-0.5 break-words">
                                            {Object.values(product.name_i18n).join(' / ')}
                                        </div>
                                    </div>

                                    {/* Right: Price/Unit */}
                                    <div className="text-right shrink-0">
                                        <div className="font-mono text-xs text-gray-600">
                                            {product.price_reference ? product.price_reference.toLocaleString() : '-'}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-medium">
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
