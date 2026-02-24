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
        color: 'text-primary',
        bg: 'bg-primary/10',
    },
    [USER_ROLES.STORE_MANAGER]: {
        label: 'Store Manager',
        icon: Store,
        color: 'text-primary',
        bg: 'bg-primary/10',
    },
    [USER_ROLES.GLOBAL_PURCHASER]: {
        label: 'Global Purchaser',
        icon: ShoppingCart,
        color: 'text-success',
        bg: 'bg-success/10',
    },
    [USER_ROLES.FINANCE]: {
        label: 'Finance',
        icon: Briefcase,
        color: 'text-warning',
        bg: 'bg-warning/10',
    },
} as const;

export const getRoleMetadata = (role: string) => {
    return ROLE_METADATA[role as UserRole] || {
        label: role,
        icon: User,
        color: 'text-muted-foreground',
        bg: 'bg-muted',
    };
};
