export type I18nString = Record<string, string>;
export type LanguageCode = 'en' | 'ru' | 'uz' | 'cn';

export interface Category {
    id: string;
    name_i18n: Record<string, string>;
    sort_order: number;
}

export interface Stall {
    id: string;
    name: string;
    location?: string;
    sort_order: number;
    is_active: boolean;
}

export interface StallCreate {
    name: string;
    location?: string;
    sort_order?: number;
}

export interface Product {
    id: string;
    category_id: string;
    default_stall_id?: string;
    category?: Category;
    name_i18n: Record<string, string>;
    unit_i18n: Record<string, string>;
    price_reference?: number;
    is_active: boolean;
}

export interface ProductCreate {
    category_id: string;
    default_stall_id?: string;
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

// --- Stall-based Consolidation ---

export interface StallConsolidatedProduct {
    product_id: string;
    product_name: I18nString;
    unit: I18nString;
    price_reference?: number;
    total_quantity: number;
    breakdown: Array<{ store_name: string; quantity: number }>;
}

export interface StallConsolidation {
    stall: Stall | null;
    stall_name: string;
    items: StallConsolidatedProduct[];
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

export type UserRole = 'admin' | 'store_manager' | 'global_purchaser';

export interface User {
    id: string;
    telegram_id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
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

// --- Shared Expenses ---

export type SplitMethod = 'equal' | 'proportional';

export interface SharedExpenseCreate {
    expense_date: string;
    expense_type: string;
    description?: string;
    amount: number;
    split_method: SplitMethod;
}

export interface SharedExpenseResponse {
    id: string;
    expense_date: string;
    expense_type: string;
    description?: string;
    amount: number;
    split_method: SplitMethod;
    created_by: string;
    created_at: string;
}

// --- Daily Bills ---

export interface BillItemDetail {
    product_name: I18nString;
    unit: I18nString;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

export interface BillExpenseDetail {
    expense_type: string;
    description?: string;
    total_amount: number;
    split_method: string;
    store_share: number;
}

export interface DailyBillResponse {
    id: string;
    store_id: string;
    store_name?: string;
    bill_date: string;
    items_total: number;
    shared_total: number;
    grand_total: number;
    status: string;
    detail?: {
        items: BillItemDetail[];
        expenses: BillExpenseDetail[];
    };
    created_at: string;
}

export interface DailyBillSummary {
    bill_date: string;
    total_stores: number;
    total_items_amount: number;
    total_shared_amount: number;
    grand_total: number;
    bills: DailyBillResponse[];
}

// --- AI Procurement ---
export interface ParsedItem {
    product_id: string | null;
    original_text: string;
    predicted_item_name: string;
    quantity: number;
    unit: string;
}

export interface ParsedOrderResponse {
    items: ParsedItem[];
}


