/**
 * Default Role Permissions
 * Pre-configured permission sets for standard roles
 */

import type { RolePermissions } from '../../types';

export const DEFAULT_ROLE_PERMISSIONS: Record<string, RolePermissions> = {
    admin: {
        canViewAllData: true,
        canViewFinancialData: true,
        canManageUsers: true,
        canManageRoles: true,
        canManagePipelines: true,
        canManageSettings: true,
        canManageIntegrations: true,
        canExportData: true,
        canDeleteRecords: true,
        pipelineAccess: {}  // Full access to all
    },
    dev: {
        canViewAllData: true,
        canViewFinancialData: true,
        canManageUsers: false,
        canManageRoles: false,
        canManagePipelines: true,
        canManageSettings: true,
        canManageIntegrations: true,
        canExportData: true,
        canDeleteRecords: true,
        pipelineAccess: {}  // Full access to all
    },
    management: {
        canViewAllData: true,
        canViewFinancialData: true,
        canManageUsers: false,
        canManageRoles: false,
        canManagePipelines: true,
        canManageSettings: false,
        canManageIntegrations: false,
        canExportData: true,
        canDeleteRecords: false,
        pipelineAccess: {}  // Full access to all
    },
    sales: {
        canViewAllData: false,
        canViewFinancialData: false,
        canManageUsers: false,
        canManageRoles: false,
        canManagePipelines: false,
        canManageSettings: false,
        canManageIntegrations: false,
        canExportData: false,
        canDeleteRecords: false,
        pipelineAccess: {
            students: { level: 'edit', canCreate: true, canDelete: false, canMoveStages: true },
            packages: { level: 'edit', canCreate: true, canDelete: false, canMoveStages: true },
            tutors: { level: 'none' }
        }
    },
    support: {
        canViewAllData: false,
        canViewFinancialData: false,
        canManageUsers: false,
        canManageRoles: false,
        canManagePipelines: false,
        canManageSettings: false,
        canManageIntegrations: false,
        canExportData: false,
        canDeleteRecords: false,
        pipelineAccess: {
            students: { level: 'view', canCreate: false, canDelete: false, canMoveStages: false },
            packages: { level: 'none' },
            tutors: { level: 'none' }
        }
    },
    team: {
        canViewAllData: false,
        canViewFinancialData: false,
        canManageUsers: false,
        canManageRoles: false,
        canManagePipelines: false,
        canManageSettings: false,
        canManageIntegrations: false,
        canExportData: false,
        canDeleteRecords: false,
        pipelineAccess: {}  // Configured per user
    }
};
