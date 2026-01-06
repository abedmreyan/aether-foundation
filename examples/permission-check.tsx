// Example: Permission Checks in Components
// Shows how to properly check permissions before rendering data

import { useAuth } from '../context';
import { canAccessPipeline, filterFieldsForRole } from '../services/permissions';
import type { PipelineConfig, FieldDefinition } from '../types';

interface ProtectedComponentProps {
    pipeline: PipelineConfig;
}

export function ProtectedComponent({ pipeline }: ProtectedComponentProps) {
    const { user } = useAuth();

    // Check if user can access this pipeline at all
    if (!user || !canAccessPipeline(user, pipeline.id)) {
        return <div>Access denied</div>;
    }

    // Filter fields based on user role
    const visibleFields = filterFieldsForRole(pipeline.fields, user.role);

    return (
        <div>
            <h1>{pipeline.name}</h1>

            {visibleFields.map((field: FieldDefinition) => (
                <div key={field.id}>
                    <label>{field.label}</label>
                    {/* Field content */}
                </div>
            ))}

            {/* Financial data - only for privileged roles */}
            {user.role === 'admin' || user.role === 'management' ? (
                <div className="financial-section">
                    {/* Financial data here */}
                </div>
            ) : null}
        </div>
    );
}

// Key patterns:
// 1. Always check canAccessPipeline before rendering pipeline content
// 2. Use filterFieldsForRole to get only visible fields
// 3. Use role checks for sensitive sections
// 4. Never expose financial data without checking role
