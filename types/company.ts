/**
 * Company Types
 * Multi-tenant company and subscription types
 */

export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'enterprise';

export interface CompanySettings {
    branding?: {
        logo?: string;
        primaryColor?: string;
        accentColor?: string;
    };
    features?: {
        maxUsers?: number;
        maxPipelines?: number;
        customFields?: boolean;
        apiAccess?: boolean;
    };
    defaults?: {
        defaultView?: 'kanban' | 'table';
        entriesPerPage?: 25 | 50 | 100;
    };
}

export interface Company {
    id: string;
    name: string;
    slug: string;
    plan: SubscriptionPlan;
    settings: CompanySettings;
    createdAt: number;
    updatedAt: number;
}
