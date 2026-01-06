/**
 * Services - Barrel Export
 * 
 * @ai-context Central export point for all services.
 * Services are organized into logical groups:
 * - database/ - Database adapters and operations
 * - permissions/ - RBAC and access control
 * - validation - Field and entity validation
 * - dataService - Data processing utilities
 * - geminiService - AI integration
 */

// Database services
export { CustomerDatabase, CustomerDatabaseFactory, CustomerDatabaseAdapter } from './customerDatabase';

// Permissions services
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
} from './permissions';

// Validation services (export only what exists)
export { validateField } from './validation';

// Note: DataService and GeminiService are used via direct imports
// They don't have class exports, only function exports
