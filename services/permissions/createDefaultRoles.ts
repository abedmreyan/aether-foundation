/**
 * Create Default Roles
 * Factory function to generate default roles for a company
 */

import type { RoleDefinition } from '../../types';
import { DEFAULT_ROLE_PERMISSIONS } from './roleDefaults';

export const createDefaultRoles = (companyId: string): RoleDefinition[] => {
    const now = Date.now();

    return [
        {
            id: 'admin',
            companyId,
            name: 'Admin',
            description: 'Full access to all features and data',
            isSystemRole: true,
            permissions: DEFAULT_ROLE_PERMISSIONS.admin,
            createdAt: now,
            updatedAt: now
        },
        {
            id: 'dev',
            companyId,
            name: 'Developer',
            description: 'Technical access to pipelines, settings, and integrations',
            isSystemRole: true,
            permissions: DEFAULT_ROLE_PERMISSIONS.dev,
            createdAt: now,
            updatedAt: now
        },
        {
            id: 'management',
            companyId,
            name: 'Management',
            description: 'Access to all pipelines and financial data',
            isSystemRole: false,
            permissions: DEFAULT_ROLE_PERMISSIONS.management,
            createdAt: now,
            updatedAt: now
        },
        {
            id: 'sales',
            companyId,
            name: 'Sales',
            description: 'Access to students and packages pipelines',
            isSystemRole: false,
            permissions: DEFAULT_ROLE_PERMISSIONS.sales,
            createdAt: now,
            updatedAt: now
        },
        {
            id: 'support',
            companyId,
            name: 'Support',
            description: 'View-only access to students pipeline',
            isSystemRole: false,
            permissions: DEFAULT_ROLE_PERMISSIONS.support,
            createdAt: now,
            updatedAt: now
        },
        {
            id: 'team',
            companyId,
            name: 'Team Member',
            description: 'Limited access based on assignment',
            isSystemRole: false,
            permissions: DEFAULT_ROLE_PERMISSIONS.team,
            createdAt: now,
            updatedAt: now
        }
    ];
};
