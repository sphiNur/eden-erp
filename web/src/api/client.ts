/**
 * Centralized API client for Eden Core ERP.
 * Single source of truth for all backend communication.
 */
import { getInitData } from '../lib/telegram';
import type {
    Product,
    ProductCreate,
    Category,
    OrderResponse,
    OrderItemInput,
    ConsolidatedItem,
    StallConsolidation,
    BatchCreate,
    BatchResponse,
    User,
    Store,
    OrderTemplate,
    TemplateCreate,
    Stall,
    StallCreate,
    SharedExpenseResponse,
    SharedExpenseCreate,
    DailyBillSummary,
    DailyBillResponse,
    ParsedOrderResponse,
} from '../types';

// If VITE_API_URL isn't injected at build time (e.g., standard Docker build),
// use a placeholder that will be replaced by docker-entrypoint.sh at container startup.
// In local dev, it falls back to '/api' which Vite proxies.
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '__RUNTIME_VITE_API_URL__' : '/api');

type RequestOptions = {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
};

class ApiError extends Error {
    status: number;
    detail: string;

    constructor(status: number, detail: string) {
        super(`API Error ${status}: ${detail}`);
        this.status = status;
        this.detail = detail;
    }
}

function getAuthHeaders(): Record<string, string> {
    const initData = getInitData();
    if (initData) {
        return { 'X-Telegram-Init-Data': initData };
    }
    // Development / Admin Simulation fallback
    const mock = localStorage.getItem('dev_mock_user');
    if (mock) {
        try {
            const parsed = JSON.parse(mock);
            if (parsed.telegram_id) {
                return { 'X-Dev-Telegram-Id': String(parsed.telegram_id) };
            }
        } catch { /* ignore */ }
    }
    return {};
}

let globalToast: ((msg: string, type?: 'success' | 'error' | 'info') => void) | null = null;

export const setApiToast = (toastFn: typeof globalToast) => {
    globalToast = toastFn;
};

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const config: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
            ...headers,
        },
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    const res = await fetch(`${API_URL}${endpoint}`, config);

    if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
            const err = await res.json();
            detail = err.detail || detail;
        } catch {
            // ignore parse errors
        }
        if (globalToast && res.status >= 400) {
            globalToast(detail, 'error');
        }
        throw new ApiError(res.status, detail);
    }

    return res.json();
}

// --- Products ---

export const productsApi = {
    list: () => request<Product[]>('/products/'),
    create: (data: ProductCreate) =>
        request<Product>('/products/', { method: 'POST', body: data }),
    update: (id: string, data: Partial<ProductCreate>) =>
        request<Product>(`/products/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) =>
        request<void>(`/products/${id}`, { method: 'DELETE' }),
};

// --- Categories ---

export const categoriesApi = {
    list: () => request<Category[]>('/categories/'),
};

// --- Orders ---

export const ordersApi = {
    create: (data: { store_id: string; delivery_date: string; items: OrderItemInput[] }) =>
        request<OrderResponse>('/orders/', { method: 'POST', body: data }),
    list: (params?: { status?: string; store_id?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.set('status', params.status);
        if (params?.store_id) searchParams.set('store_id', params.store_id);
        const qs = searchParams.toString();
        return request<OrderResponse[]>(`/orders/${qs ? '?' + qs : ''}`);
    },
    get: (id: string) =>
        request<OrderResponse>(`/orders/${id}`),
};

// --- Purchases ---

export const purchasesApi = {
    getConsolidation: () =>
        request<ConsolidatedItem[]>('/purchases/consolidation'),
    getConsolidationByStall: (targetDate?: string) => {
        const qs = targetDate ? `?target_date=${targetDate}` : '';
        return request<StallConsolidation[]>(`/purchases/by-stall${qs}`);
    },
    submitBatch: (data: BatchCreate) =>
        request<BatchResponse>('/purchases/', { method: 'POST', body: data }),
};

// --- Users ---

export const usersApi = {
    me: () => request<User>('/users/me'),
    list: () => request<User[]>('/users/'),
    update: (id: string, data: { role: string; allowed_store_ids: string[] }) =>
        request<User>(`/users/${id}`, { method: 'PUT', body: data }),
    switchRole: (role: string) =>
        request<{ ok: boolean; role: string }>(`/users/switch-role?role=${role}`, { method: 'POST' }),
};

// --- Stores ---

export const storesApi = {
    list: () => request<Store[]>('/stores/'),
    create: (data: { name: string; address?: string; location?: string }) =>
        request<Store>('/stores/', { method: 'POST', body: data }),
    update: (id: string, data: { name?: string; address?: string; location?: string }) =>
        request<Store>(`/stores/${id}`, { method: 'PUT', body: data }),
};

// --- Templates ---

export const templatesApi = {
    list: (store_id: string) => request<OrderTemplate[]>(`/templates/?store_id=${store_id}`),
    create: (data: TemplateCreate) => request<OrderTemplate>('/templates/', { method: 'POST', body: data }),
    delete: (id: string) => request<void>(`/templates/${id}`, { method: 'DELETE' }),
};

// --- Stalls ---

export const stallsApi = {
    list: () => request<Stall[]>('/stalls/'),
    create: (data: StallCreate) =>
        request<Stall>('/stalls/', { method: 'POST', body: data }),
    update: (id: string, data: Partial<StallCreate & { is_active?: boolean }>) =>
        request<Stall>(`/stalls/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) => request<{ ok: boolean }>(`/stalls/${id}`, { method: 'DELETE' }),
};

// --- Shared Expenses ---

export const expensesApi = {
    list: (date?: string) => {
        const qs = date ? `?expense_date=${date}` : '';
        return request<SharedExpenseResponse[]>(`/expenses/${qs}`);
    },
    create: (data: SharedExpenseCreate) =>
        request<SharedExpenseResponse>('/expenses/', { method: 'POST', body: data }),
    delete: (id: string) => request<{ ok: boolean }>(`/expenses/${id}`, { method: 'DELETE' }),
};

// --- Daily Bills ---

export const billsApi = {
    generate: (date: string) =>
        request<DailyBillSummary>(`/bills/generate?bill_date=${date}`, { method: 'POST' }),
    list: (params?: { bill_date?: string; store_id?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.bill_date) searchParams.set('bill_date', params.bill_date);
        if (params?.store_id) searchParams.set('store_id', params.store_id);
        const qs = searchParams.toString();
        return request<DailyBillResponse[]>(`/bills/${qs ? '?' + qs : ''}`);
    },
    get: (id: string) => request<DailyBillResponse>(`/bills/${id}`),
};

// --- AI Tools ---

export const aiApi = {
    parseOrder: (raw_text: string) =>
        request<ParsedOrderResponse>('/ai/parse-order', { method: 'POST', body: { raw_text } }),
};

export { ApiError };
export default { productsApi, ordersApi, purchasesApi, usersApi, storesApi, categoriesApi, templatesApi, stallsApi, expensesApi, billsApi, aiApi };
