export type I18nString = Record<string, string>;
export type LanguageCode = 'en' | 'ru' | 'uz' | 'cn';

export interface Category {
    id: string;
    name_i18n: Record<string, string>;
    sort_order: number;
}

export interface Product {
    id: string;
    category_id: string;
    category?: Category;
    name_i18n: Record<string, string>;
    unit_i18n: Record<string, string>;
    price_reference?: number;
    is_active: boolean;
}

export interface ProductCreate {
    category_id: string;
    name_i18n: Record<string, string>;
    unit_i18n: Record<string, string>;
    price_reference?: number;
    is_active?: boolean;
}

export interface Store {
    id: string;
    name: string;
    address?: string;
    location?: string;
    config?: Record<string, unknown>;
    is_active?: boolean;
    created_at?: string;
}

export interface OrderItemInput {
    product_id: string;
    quantity_requested: number;
    notes?: Record<string, string>;
}

export interface OrderItemResponse {
    id: string;
    product_id: string;
    quantity_requested: number;
    quantity_approved?: number;
    allocated_cost_uzs?: number;
    quantity_fulfilled?: number;
    notes?: Record<string, string>;
}

export interface OrderResponse {
    id: string;
    store_id: string;
    user_id: string;
    status: string;
    delivery_date: string;
    created_at: string;
    items: OrderItemResponse[];
}

export interface ConsolidatedItem {
    product_id: string;
    product_name: I18nString;
    unit: I18nString;
    category_name: I18nString;
    price_reference?: number;
    total_quantity_needed: number;
    breakdown: Array<{ store_name: string; quantity: number }>;
}

export interface BatchItemInput {
    product_id: string;
    total_quantity_bought: number;
    total_cost_uzs: number;
}

export interface BatchCreate {
    market_location: string;
    items: BatchItemInput[];
}

export interface BatchItemResponse {
    id: string;
    product_id: string;
    total_quantity_bought: number;
    total_cost_uzs: number;
    unit_price_calculated: number;
}

export interface BatchResponse {
    id: string;
    purchaser_id: string;
    purchase_date: string;
    status: string;
    items: BatchItemResponse[];
}

export type UserRole = 'admin' | 'store_manager' | 'global_purchaser' | 'finance';

export interface User {
    id: string;
    telegram_id: number;
    username?: string;
    role: UserRole;
    allowed_store_ids?: string[];
    is_active?: boolean;
}

export interface TemplateItem {
    product_id: string;
    quantity: number;
    notes?: Record<string, string>;
}

export interface OrderTemplate {
    id: string;
    store_id: string;
    name: string;
    items: TemplateItem[];
    created_at: string;
}

export interface TemplateCreate {
    store_id: string;
    name: string;
    items: TemplateItem[];
}

