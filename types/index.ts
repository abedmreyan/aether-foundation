/**
 * Types Barrel Export
 * Re-exports all types for backward compatibility
 */

// Core types
export {
    type Message,
    type ColumnType,
    type ColumnDefinition,
    type TableSchema,
    type UploadedFile,
    type BusinessProfile,
    type PipelineRecommendation,
    AppState
} from './core';

// Company types
export {
    type SubscriptionPlan,
    type Company,
    type CompanySettings
} from './company';

// User types
export {
    type UserRole,
    type User,
    type AuthResult
} from './user';

// Database types
export {
    type DatabaseType,
    type DbConnectionConfig,
    type CloudConfig
} from './database';

// Pipeline types
export {
    type StageAction,
    type StageDefinition,
    type FieldType,
    type SelectOption,
    type RelationConfig,
    type ValidationRule,
    type ValidationResult,
    type FieldDefinition,
    type PipelineConfig
} from './pipeline';

// Permission types
export {
    type PipelineAccessLevel,
    type PipelineAccess,
    type RolePermissions,
    type RoleDefinition
} from './permissions';

// CRM types
export {
    type CRMEntity,
    type Student,
    type Tutor,
    type Package,
    type QueryFilters,
    type PaginatedResult
} from './crm';

// Context types
export { type GlobalContextType } from './context';
