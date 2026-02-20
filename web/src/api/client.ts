/**
 * Centralized API client for Eden Core ERP.
 * Single source of truth for all backend communication.
 */
import WebApp from '@twa-dev/sdk';
import type { OrderResponse, BatchResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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
    // Production: send Telegram initData for HMAC validation
    const initData = WebApp.initData;
    if (initData) {
        return { 'X-Telegram-Init-Data': initData };
    }
    // Development / Admin Simulation fallback
    // We allow this in production because the backend validates if the *real* user is an Admin
    // before accepting the X-Dev-Telegram-Id header.
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
    list: () => request<import('../types').Product[]>('/products/'),
    create: (data: import('../types').ProductCreate) =>
        request<import('../types').Product>('/products/', { method: 'POST', body: data }),
    update: (id: string, data: Partial<import('../types').ProductCreate>) =>
        request<import('../types').Product>(`/products/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) =>
        request<void>(`/products/${id}`, { method: 'DELETE' }),
};

// --- Categories ---

export const categoriesApi = {
    list: () => request<import('../types').Category[]>('/categories/'),
};

// --- Orders ---

export const ordersApi = {
    create: (data: { store_id: string; delivery_date: string; items: import('../types').OrderItemInput[] }) =>
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
        request<import('../types').ConsolidatedItem[]>('/purchases/consolidation'),
    submitBatch: (data: import('../types').BatchCreate) =>
        request<BatchResponse>('/purchases/', { method: 'POST', body: data }),
};

// --- Users ---

export const usersApi = {
    me: () => request<import('../types').User>('/users/me'),
    list: () => request<import('../types').User[]>('/users/'),
    update: (id: string, data: { role: string; allowed_store_ids: string[] }) =>
        request<import('../types').User>(`/users/${id}`, { method: 'PUT', body: data }),
    switchRole: (role: string) =>
        request<{ ok: boolean; role: string }>(`/users/switch-role?role=${role}`, { method: 'POST' }),
};

// --- Stores ---

export const storesApi = {
    list: () => request<import('../types').Store[]>('/stores/'),
    create: (data: { name: string; address?: string; location?: string }) =>
        request<import('../types').Store>('/stores/', { method: 'POST', body: data }),
    update: (id: string, data: { name?: string; address?: string; location?: string }) =>
        request<import('../types').Store>(`/stores/${id}`, { method: 'PUT', body: data }),
};

// --- Templates ---

export const templatesApi = {
    list: (store_id: string) => request<import('../types').OrderTemplate[]>(`/templates/?store_id=${store_id}`),
    create: (data: import('../types').TemplateCreate) => request<import('../types').OrderTemplate>('/templates/', { method: 'POST', body: data }),
    delete: (id: string) => request<void>(`/templates/${id}`, { method: 'DELETE' }),
};

export { ApiError };
export default { productsApi, ordersApi, purchasesApi, usersApi, storesApi, categoriesApi, templatesApi };
