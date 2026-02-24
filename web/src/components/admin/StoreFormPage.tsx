import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { storesApi } from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { PageLayout } from '../layout/PageLayout';

const storeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    address: z.string().optional(),
    location: z.string().optional(),
});

type StoreFormValues = z.infer<typeof storeSchema>;

export const StoreFormPage = () => {
    const { id } = useParams();
    const isEdit = id && id !== 'new';
    const navigate = useNavigate();
    const { ui } = useLanguage();
    const { success, error } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(isEdit ? true : false);

    const form = useForm<StoreFormValues>({
        resolver: zodResolver(storeSchema),
        defaultValues: {
            name: '',
            address: '',
            location: '',
        }
    });

    useEffect(() => {
        if (isEdit) {
            fetchStore(id!);
        }
    }, [id, isEdit]);

    const fetchStore = async (storeId: string) => {
        try {
            const stores = await storesApi.list();
            const store = stores.find(s => s.id === storeId);
            if (store) {
                form.reset({
                    name: store.name,
                    address: store.address || '',
                    location: store.location || '',
                });
            }
        } catch (e) {
            console.error(e);
            error(ui('failedLoadItems'));
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: StoreFormValues) => {
        setSubmitting(true);
        try {
            if (isEdit) {
                await storesApi.update(id!, data);
                success(ui('saveChanges'));
            } else {
                await storesApi.create(data);
                success(ui('addStore'));
            }
            navigate('/admin/stores');
        } catch (err) {
            console.error(err);
            error(ui('saveFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    const toolbar = (
        <div className="flex items-center gap-3 px-3 py-2">
            <Button variant="ghost" size="icon" className="-ml-2" onClick={() => navigate('/admin/stores')}>
                <ArrowLeft size={20} className="text-muted-foreground" />
            </Button>
            <h1 className="text-lg font-bold flex-1">
                {isEdit ? ui('edit') : ui('addStore')}
            </h1>
            <Button size="sm" onClick={form.handleSubmit(onSubmit)} disabled={submitting || loading}>
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg mx-auto py-2">
                <div className="bg-card p-4 rounded-xl shadow-sm border border-border space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{ui('stores')} {ui('name')} <span className="text-destructive">*</span></Label>
                        <Input id="name" {...form.register('name')} placeholder="e.g. Magic Store" className="bg-muted/50 border-border" />
                        {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">{ui('locations')}</Label>
                        <Input id="address" {...form.register('address')} placeholder="e.g. 123 Main St" className="bg-muted/50 border-border" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Map Coordinates (Optional)</Label>
                        <Input id="location" {...form.register('location')} placeholder="olat,long" className="bg-muted/50 border-border" />
                    </div>
                </div>

                <div className="fixed right-4 z-fab sm:hidden" style={{ bottom: 'calc(var(--nav-h) + 12px)' }}>
                    <Button
                        size="icon"
                        className="h-14 w-14 rounded-full shadow-lg bg-eden-500 hover:bg-eden-600"
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={submitting}
                    >
                        {submitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                    </Button>
                </div>
            </form>
        </PageLayout>
    );
};
