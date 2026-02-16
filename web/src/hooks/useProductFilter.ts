import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Product } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export const useProductFilter = (products: Product[]) => {
    const { t, ui, language } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');

    const allLabel = ui('all');
    const otherLabel = ui('other');
    const [activeCategory, setActiveCategory] = useState<string>(allLabel);

    // Reset filtering when language changes (since labels change)
    useMemo(() => {
        setActiveCategory(allLabel);
    }, [allLabel]);

    const categories = useMemo(() => {
        const cats = new Set(products.map(p =>
            p.category ? t(p.category.name_i18n) : otherLabel
        ));
        return [allLabel, ...Array.from(cats).sort()];
    }, [products, language, allLabel, otherLabel, t]);

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
    }, [products, searchTerm, activeCategory, fuse, language, allLabel, otherLabel, t]);

    const groupedProducts = useMemo(() => {
        const groups: Record<string, Product[]> = {};
        filteredProducts.forEach(p => {
            const cat = p.category ? t(p.category.name_i18n) : otherLabel;
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(p);
        });
        return groups;
    }, [filteredProducts, language, otherLabel, t]);

    return {
        searchTerm,
        setSearchTerm,
        activeCategory,
        setActiveCategory,
        categories,
        filteredProducts,
        groupedProducts
    };
};
