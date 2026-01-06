/**
 * Permissions Service
 * Role-based access control utilities for multi-tenant CRM
 * 
 * This file re-exports from the modular permissions directory for backward compatibility.
 */

// Re-export all from permissions module
export {
    DEFAULT_ROLE_PERMISSIONS,
    getUserPermissions,
    canAccessPipeline,
    getPipelineAccessLevel,
    canPerformAction,
    isAdmin,
    isDev,
    isManagement,
    canManageUsers,
    canManageSettings,
    canExportData,
    filterFieldsForRole,
    filterDataForRole,
    getVisibleStages,
    createDefaultRoles
} from './permissions/index';
