import { Shield, Store, ShoppingCart, Briefcase, User } from 'lucide-react';

export const USER_ROLES = {
    ADMIN: 'admin',
    STORE_MANAGER: 'store_manager',
    GLOBAL_PURCHASER: 'global_purchaser',
    FINANCE: 'finance',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const ROLE_METADATA = {
    [USER_ROLES.ADMIN]: {
        label: 'Admin',
        icon: Shield,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
    },
    [USER_ROLES.STORE_MANAGER]: {
        label: 'Store Manager',
        icon: Store,
        color: 'text-eden-500',
        bg: 'bg-eden-50',
    },
    [USER_ROLES.GLOBAL_PURCHASER]: {
        label: 'Global Purchaser',
        icon: ShoppingCart,
        color: 'text-green-600',
        bg: 'bg-green-50',
    },
    [USER_ROLES.FINANCE]: {
        label: 'Finance',
        icon: Briefcase,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
    },
} as const;

export const getRoleMetadata = (role: string) => {
    return ROLE_METADATA[role as UserRole] || {
        label: role,
        icon: User,
        color: 'text-gray-500',
        bg: 'bg-gray-50',
    };
};
