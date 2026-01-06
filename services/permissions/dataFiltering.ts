/**
 * Data Filtering Functions
 * Filter data based on user role and permissions
 */

import type {
    User,
    RoleDefinition,
    PipelineConfig,
    FieldDefinition,
    CRMEntity
} from '../../types';
import { getUserPermissions } from './accessControl';

export const filterFieldsForRole = (
    fields: FieldDefinition[],
    user: User,
    roles: RoleDefinition[]
): FieldDefinition[] => {
    const permissions = getUserPermissions(user, roles);

    if (permissions.canViewFinancialData) {
        return fields;
    }

    // Filter out financial fields
    return fields.filter(field => !field.isFinancial);
};

export const filterDataForRole = <T extends CRMEntity>(
    data: T[],
    fields: FieldDefinition[],
    user: User,
    roles: RoleDefinition[]
): T[] => {
    const permissions = getUserPermissions(user, roles);

    if (permissions.canViewFinancialData) {
        return data;
    }

    // Get list of financial field names
    const financialFields = fields
        .filter(f => f.isFinancial)
        .map(f => f.name);

    if (financialFields.length === 0) {
        return data;
    }

    // Remove financial fields from each record
    return data.map(item => {
        const filtered = { ...item };
        financialFields.forEach(fieldName => {
            delete (filtered as any)[fieldName];
        });
        return filtered;
    });
};

export const getVisibleStages = (
    user: User,
    pipelineId: string,
    pipeline: PipelineConfig,
    roles: RoleDefinition[]
): string[] => {
    const permissions = getUserPermissions(user, roles);
    const pipelineAccess = permissions.pipelineAccess[pipelineId];

    // If no restrictions or full access, return all stages
    if (user.role === 'admin' || user.role === 'dev' || permissions.canViewAllData) {
        return pipeline.stages.map(s => s.id);
    }

    // Check for stage-specific restrictions
    if (pipelineAccess?.visibleStages && pipelineAccess.visibleStages.length > 0) {
        return pipelineAccess.visibleStages;
    }

    // Default: all stages visible
    return pipeline.stages.map(s => s.id);
};
