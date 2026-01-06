/**
 * Permission Types
 * Role definitions and access control types
 */

export type PipelineAccessLevel = 'none' | 'view' | 'edit' | 'full';

export interface PipelineAccess {
    level: PipelineAccessLevel;
    canCreate?: boolean;
    canDelete?: boolean;
    canMoveStages?: boolean;
    visibleStages?: string[]; // If empty, all stages visible
}

export interface RolePermissions {
    // Global permissions
    canViewAllData: boolean;
    canViewFinancialData: boolean;
    canManageUsers: boolean;
    canManageRoles: boolean;
    canManagePipelines: boolean;
    canManageSettings: boolean;
    canManageIntegrations: boolean;
    canExportData: boolean;
    canDeleteRecords: boolean;

    // Pipeline-specific access
    pipelineAccess: Record<string, PipelineAccess>;
}

export interface RoleDefinition {
    id: string;
    companyId: string;
    name: string;
    description?: string;
    isSystemRole: boolean; // admin, dev are system roles
    permissions: RolePermissions;
    createdAt: number;
    updatedAt: number;
}
