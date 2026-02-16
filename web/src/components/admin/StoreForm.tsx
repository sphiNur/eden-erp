import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '../ui/sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { storesApi } from '../../api/client';
import { Store } from '../../types';
import { useToast } from '../../contexts/ToastContext';

const storeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    address: z.string().optional(),
    location: z.string().optional(),
});

type StoreFormValues = z.infer<typeof storeSchema>;

interface StoreFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    storeToEdit?: Store | null;
}

export const StoreForm = ({ isOpen, onClose, onSuccess, storeToEdit }: StoreFormProps) => {
    const { ui } = useLanguage();
    const { success, error } = useToast();
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<StoreFormValues>({
        resolver: zodResolver(storeSchema),
        defaultValues: {
            name: '',
            address: '',
            location: '',
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (storeToEdit) {
                form.reset({
                    name: storeToEdit.name,
                    address: storeToEdit.address || '',
                    location: storeToEdit.location || '',
                });
            } else {
                form.reset({
                    name: '',
                    address: '',
                    location: '',
                });
            }
        }
    }, [isOpen, storeToEdit, form]);

    const onSubmit = async (data: StoreFormValues) => {
        setSubmitting(true);
        try {
            if (storeToEdit) {
                await storesApi.update(storeToEdit.id, data);
                success(ui('saveChanges'));
            } else {
                await storesApi.create(data);
                success(ui('addStore'));
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
            <SheetContent className="w-full sm:max-w-md bg-white">
                <SheetHeader>
                    <SheetTitle>{storeToEdit ? ui('edit') : ui('addStore')}</SheetTitle>
                </SheetHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{ui('stores')} {ui('name')} <span className="text-red-500">*</span></Label>
                            <Input id="name" {...form.register('name')} placeholder="e.g. Magic Store" />
                            {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">{ui('locations')}</Label>
                            <Input id="address" {...form.register('address')} placeholder="e.g. 123 Main St" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Map Coordinates (Optional)</Label>
                            <Input id="location" {...form.register('location')} placeholder="olat,long" />
                        </div>
                    </div>

                    <SheetFooter>
                        <Button type="button" variant="outline" onClick={onClose} className="mr-2">{ui('cancel')}</Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {ui('save')}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
};
