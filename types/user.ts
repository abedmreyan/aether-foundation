/**
 * User Types
 * User authentication and role types
 */

import type { Company } from './company';

export type UserRole = 'admin' | 'dev' | 'management' | 'sales' | 'support' | 'team';

export interface User {
    id: string;
    companyId: string;
    email: string;
    name: string;
    role: UserRole;
    roleId?: string; // For custom roles
    avatar?: string;
    createdAt: number;
    lastLogin?: number;
}

export interface AuthResult {
    success: boolean;
    user?: User;
    company?: Company;
    token?: string;
    error?: string;
}
