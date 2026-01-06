/**
 * Permissions Module - Barrel Export
 */

// Role defaults
export { DEFAULT_ROLE_PERMISSIONS } from './roleDefaults';

// Access control
export {
    getUserPermissions,
    canAccessPipeline,
    getPipelineAccessLevel,
    canPerformAction,
    isAdmin,
    isDev,
    isManagement,
    canManageUsers,
    canManageSettings,
    canExportData
} from './accessControl';

// Data filtering
export {
    filterFieldsForRole,
    filterDataForRole,
    getVisibleStages
} from './dataFiltering';

// Role creation
export { createDefaultRoles } from './createDefaultRoles';
