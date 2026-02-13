import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'UZS', locale?: string) {
    return new Intl.NumberFormat(locale || 'en-US', { style: 'currency', currency }).format(amount);
}
