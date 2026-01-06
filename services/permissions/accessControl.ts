/**
 * Access Control Functions
 * Permission checking utilities for pipeline and action access
 */

import type {
    User,
    RoleDefinition,
    RolePermissions,
    PipelineConfig,
    PipelineAccessLevel
} from '../../types';
import { DEFAULT_ROLE_PERMISSIONS } from './roleDefaults';

export const getUserPermissions = (user: User, roles: RoleDefinition[]): RolePermissions => {
    // First check for custom role
    if (user.roleId) {
        const customRole = roles.find(r => r.id === user.roleId);
        if (customRole) return customRole.permissions;
    }

    // Fall back to default role permissions
    return DEFAULT_ROLE_PERMISSIONS[user.role] || DEFAULT_ROLE_PERMISSIONS.team;
};

export const canAccessPipeline = (
    user: User,
    pipelineId: string,
    roles: RoleDefinition[],
    pipeline?: PipelineConfig
): boolean => {
    const permissions = getUserPermissions(user, roles);

    // Admin and dev always have access
    if (user.role === 'admin' || user.role === 'dev') return true;

    // Check if user has view all data permission
    if (permissions.canViewAllData) return true;

    // Check pipeline-specific access
    const pipelineAccess = permissions.pipelineAccess[pipelineId];
    if (!pipelineAccess) return false;

    return pipelineAccess.level !== 'none';
};

export const getPipelineAccessLevel = (
    user: User,
    pipelineId: string,
    roles: RoleDefinition[]
): PipelineAccessLevel => {
    const permissions = getUserPermissions(user, roles);

    // Admin and dev have full access
    if (user.role === 'admin' || user.role === 'dev') return 'full';

    // Check if user has view all data permission
    if (permissions.canViewAllData) return 'full';

    // Check pipeline-specific access
    const pipelineAccess = permissions.pipelineAccess[pipelineId];
    return pipelineAccess?.level || 'none';
};

export const canPerformAction = (
    user: User,
    pipelineId: string,
    action: 'create' | 'edit' | 'delete' | 'move',
    roles: RoleDefinition[]
): boolean => {
    const permissions = getUserPermissions(user, roles);
    const accessLevel = getPipelineAccessLevel(user, pipelineId, roles);

    if (accessLevel === 'none' || accessLevel === 'view') return false;
    if (accessLevel === 'full') return true;

    // For 'edit' level, check specific permissions
    const pipelineAccess = permissions.pipelineAccess[pipelineId];
    if (!pipelineAccess) return false;

    switch (action) {
        case 'create':
            return pipelineAccess.canCreate !== false;
        case 'edit':
            return accessLevel === 'edit' || accessLevel === 'full';
        case 'delete':
            return pipelineAccess.canDelete === true || permissions.canDeleteRecords;
        case 'move':
            return pipelineAccess.canMoveStages !== false;
        default:
            return false;
    }
};

// ===== UTILITY FUNCTIONS =====

export const isAdmin = (user: User): boolean => user.role === 'admin';
export const isDev = (user: User): boolean => user.role === 'dev';
export const isManagement = (user: User): boolean => user.role === 'management';

export const canManageUsers = (user: User, roles: RoleDefinition[]): boolean => {
    return getUserPermissions(user, roles).canManageUsers;
};

export const canManageSettings = (user: User, roles: RoleDefinition[]): boolean => {
    return getUserPermissions(user, roles).canManageSettings;
};

export const canExportData = (user: User, roles: RoleDefinition[]): boolean => {
    return getUserPermissions(user, roles).canExportData;
};
