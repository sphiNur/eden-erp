import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useParams } from 'react-router-dom'; // Changed from onClose
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Category } from '../../types';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { productsApi, categoriesApi } from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { PRODUCT_UNITS } from '../../constants/units';
import { PageLayout } from '../layout/PageLayout'; // Added PageLayout

const productSchema = z.object({
    name_cn: z.string().optional(),
    name_ru: z.string().min(1, "Русское название обязательно"),
    name_en: z.string().optional(),
    name_uz: z.string().optional(),
    category_id: z.string().min(1, "Category is required"),
    unit_cn: z.string().optional(),
    unit_ru: z.string().min(1, "Required"),
    price_reference: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export const ProductFormPage = () => {
    const { id } = useParams();
    const isEdit = id && id !== 'new';
    const navigate = useNavigate();
    const { t, ui } = useLanguage();
    const { success, error } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(isEdit ? true : false);

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name_cn: '',
            name_ru: '',
            name_en: '',
            name_uz: '',
            category_id: '',
            unit_cn: '个',
            unit_ru: 'шт',
            price_reference: '0',
        }
    });

    useEffect(() => {
        fetchCategories();
        if (isEdit) {
            fetchProduct(id!);
        }
    }, [id, isEdit]);

    const fetchCategories = async () => {
        try {
            const data = await categoriesApi.list();
            setCategories(data);
        } catch (e) {
            console.error("Failed to fetch categories", e);
        }
    };

    const fetchProduct = async (productId: string) => {
        try {
            const products = await productsApi.list(); // Ideally should be getById
            const product = products.find(p => p.id === productId);
            if (product) {
                form.reset({
                    name_cn: product.name_i18n?.cn || '',
                    name_ru: product.name_i18n?.ru || '',
                    name_en: product.name_i18n?.en || '',
                    name_uz: product.name_i18n?.uz || '',
                    category_id: product.category_id || '',
                    unit_cn: product.unit_i18n?.cn || '个',
                    unit_ru: product.unit_i18n?.ru || 'шт',
                    price_reference: product.price_reference ? String(product.price_reference) : '0',
                });
            }
        } catch (e) {
            console.error(e);
            error(ui('failedLoadItems'));
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: ProductFormValues) => {
        setSubmitting(true);
        try {
            const payload = {
                category_id: data.category_id,
                name_i18n: {
                    cn: data.name_cn || "",
                    ru: data.name_ru,
                    en: data.name_en || "",
                    uz: data.name_uz || "",
                },
                unit_i18n: {
                    cn: data.unit_cn || "",
                    ru: data.unit_ru,
                    en: 'pc',
                    uz: data.unit_ru,
                },
                price_reference: data.price_reference ? parseFloat(data.price_reference) : 0,
                is_active: true,
            };

            if (isEdit) {
                await productsApi.update(id!, payload);
                success(ui('saveChanges'));
            } else {
                await productsApi.create(payload);
                success(ui('addProduct'));
            }
            navigate('/admin/products');
        } catch (err) {
            console.error(err);
            error(ui('saveFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    const toolbar = (
        <div className="flex items-center gap-3 px-3 py-2 min-w-0">
            <Button variant="ghost" size="icon" className="-ml-2 shrink-0" onClick={() => navigate('/admin/products')}>
                <ArrowLeft size={20} className="text-muted-foreground" />
            </Button>
            <h1 className="text-lg font-bold flex-1 min-w-0 truncate">
                {isEdit ? ui('editProduct') : ui('addProduct')}
            </h1>
            <Button size="sm" className="shrink-0" onClick={form.handleSubmit(onSubmit)} disabled={submitting || loading}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={18} />}
                <span className="ml-2 hidden sm:inline">{ui('save')}</span>
            </Button>
        </div>
    );

    if (loading) {
        return (
            <PageLayout toolbar={toolbar}>
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
            </PageLayout>
        )
    }

    return (
        <PageLayout toolbar={toolbar}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto py-2">
                {/* Basic Info Group */}
                <div className="bg-card p-4 rounded-xl shadow-sm border border-border space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">📦 {ui('basicInfo')}</h3>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label>{ui('category')} <span className="text-destructive">*</span></Label>
                        <Select onValueChange={(val: string) => form.setValue('category_id', val)} value={form.watch('category_id')}>
                            <SelectTrigger className="bg-muted/50 border-border">
                                <SelectValue placeholder={ui('select')} />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{t(c.name_i18n)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.formState.errors.category_id && <p className="text-xs text-destructive">{form.formState.errors.category_id.message}</p>}
                    </div>

                    {/* Unit & Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{ui('unit')} <span className="text-destructive">*</span></Label>
                            <Select onValueChange={(val: string) => {
                                const unit = PRODUCT_UNITS.find(u => u.value === val);
                                if (unit) {
                                    form.setValue('unit_cn', unit.label_cn);
                                    form.setValue('unit_ru', unit.label_ru);
                                }
                            }} value={PRODUCT_UNITS.find(u => u.label_ru === form.watch('unit_ru'))?.value}>
                                <SelectTrigger className="bg-muted/50 border-border">
                                    <SelectValue placeholder={ui('select')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRODUCT_UNITS.map(u => (
                                        <SelectItem key={u.value} value={u.value}>
                                            {`${u.label_en} (${u.label_cn}/${u.label_ru})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price">{ui('referencePrice')} (UZS)</Label>
                            <Input id="price" type="number" {...form.register('price_reference')} placeholder="0" className="bg-muted/50 border-border" />
                        </div>
                    </div>
                </div>

                {/* Translations Group */}
                <div className="bg-card p-4 rounded-xl shadow-sm border border-border space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">🌐 {ui('translations')}</h3>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="name_ru">🇷🇺 Русское <span className="text-destructive">*</span></Label>
                            <Input id="name_ru" {...form.register('name_ru')} placeholder="e.g. Картофель (Required)" className="bg-muted/50 border-border" />
                            {form.formState.errors.name_ru && <p className="text-xs text-destructive">{form.formState.errors.name_ru.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="name_cn">🇨🇳 中文 (Optional)</Label>
                            <Input id="name_cn" {...form.register('name_cn')} placeholder="e.g. 土豆" className="bg-muted/50 border-border" />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="name_en">🇬🇧 English (Optional)</Label>
                            <Input id="name_en" {...form.register('name_en')} placeholder="e.g. Potato" className="bg-muted/50 border-border" />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="name_uz">🇺🇿 O'zbekcha (Optional)</Label>
                            <Input id="name_uz" {...form.register('name_uz')} placeholder="e.g. Kartoshka" className="bg-muted/50 border-border" />
                        </div>
                    </div>
                </div>

            </form>
        </PageLayout>
    );
};
