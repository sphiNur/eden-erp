import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '../ui/sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Category, Product } from '../../types';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { productsApi, categoriesApi } from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { PRODUCT_UNITS } from '../../constants/units';

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

interface ProductFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    productToEdit?: Product | null;
}

export const ProductForm = ({ isOpen, onClose, onSuccess, productToEdit }: ProductFormProps) => {
    const { t, ui } = useLanguage();
    const { success, error } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [submitting, setSubmitting] = useState(false);

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
        if (isOpen) {
            fetchCategories();
            if (productToEdit) {
                form.reset({
                    name_cn: productToEdit.name_i18n?.cn || '',
                    name_ru: productToEdit.name_i18n?.ru || '',
                    name_en: productToEdit.name_i18n?.en || '',
                    name_uz: productToEdit.name_i18n?.uz || '',
                    category_id: productToEdit.category_id || '',
                    unit_cn: productToEdit.unit_i18n?.cn || '个',
                    unit_ru: productToEdit.unit_i18n?.ru || 'шт',
                    price_reference: productToEdit.price_reference ? String(productToEdit.price_reference) : '0',
                });
            } else {
                form.reset({
                    name_cn: '',
                    name_ru: '',
                    name_en: '',
                    name_uz: '',
                    category_id: '',
                    unit_cn: '个',
                    unit_ru: 'шт',
                    price_reference: '',
                });
            }
        }
    }, [isOpen, productToEdit]);

    const fetchCategories = async () => {
        try {
            const data = await categoriesApi.list();
            setCategories(data);
        } catch (e) {
            console.error("Failed to fetch categories", e);
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

            if (productToEdit) {
                await productsApi.update(productToEdit.id, payload);
                success(ui('saveChanges'));
            } else {
                await productsApi.create(payload);
                success(ui('addProduct'));
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            error(ui('saveFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-md bg-background overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{productToEdit ? ui('editProduct') : ui('addProduct')}</SheetTitle>
                </SheetHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">

                    {/* Basic Info Group */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">📦 {ui('basicInfo')}</h3>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label>{ui('category')} <span className="text-red-500">*</span></Label>
                            <Select onValueChange={(val: string) => form.setValue('category_id', val)} value={form.watch('category_id')}>
                                <SelectTrigger>
                                    <SelectValue placeholder={ui('select')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{t(c.name_i18n)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.formState.errors.category_id && <p className="text-xs text-red-500">{form.formState.errors.category_id.message}</p>}
                        </div>

                        {/* Unit & Price */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{ui('unit')} <span className="text-red-500">*</span></Label>
                                <Select onValueChange={(val: string) => {
                                    const unit = PRODUCT_UNITS.find(u => u.value === val);
                                    if (unit) {
                                        form.setValue('unit_cn', unit.label_cn);
                                        form.setValue('unit_ru', unit.label_ru);
                                    }
                                }}>
                                    <SelectTrigger>
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
                                <p className="text-[10px] text-muted-foreground">{ui('baseUnitDesc')}</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="price">{ui('referencePrice')} (UZS)</Label>
                                <Input id="price" type="number" {...form.register('price_reference')} placeholder="0" />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-border" />

                    {/* Translations Group */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">🌐 {ui('translations')}</h3>

                        <div className="space-y-3">
                            {/* Russian (Required) */}
                            <div className="space-y-1">
                                <Label htmlFor="name_ru">🇷🇺 Русское <span className="text-red-500">*</span></Label>
                                <Input id="name_ru" {...form.register('name_ru')} placeholder={`e.g. Картофель (${ui('required')})`} />
                                {form.formState.errors.name_ru && <p className="text-xs text-red-500">{form.formState.errors.name_ru.message}</p>}
                            </div>

                            {/* Chinese */}
                            <div className="space-y-1">
                                <Label htmlFor="name_cn">🇨🇳 中文 ({ui('optional')})</Label>
                                <Input id="name_cn" {...form.register('name_cn')} placeholder="e.g. 土豆" />
                            </div>

                            {/* English */}
                            <div className="space-y-1">
                                <Label htmlFor="name_en">🇬🇧 English ({ui('optional')})</Label>
                                <Input id="name_en" {...form.register('name_en')} placeholder="e.g. Potato" />
                            </div>

                            {/* Uzbek */}
                            <div className="space-y-1">
                                <Label htmlFor="name_uz">🇺🇿 O'zbekcha ({ui('optional')})</Label>
                                <Input id="name_uz" {...form.register('name_uz')} placeholder="e.g. Kartoshka" />
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={onClose} className="mr-2">{ui('cancel')}</Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {productToEdit ? ui('update') : ui('save')}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
};
