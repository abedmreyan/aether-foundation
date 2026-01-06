/**
 * Pipeline Types
 * Configurable pipeline, stage, and field definitions
 */

export interface StageAction {
    type: 'notify' | 'email' | 'webhook' | 'assign';
    config: Record<string, any>;
}

export interface StageDefinition {
    id: string;
    name: string;
    color: string;
    order: number;
    description?: string;
    allowedTransitions?: string[]; // Stage IDs that can transition to this stage
    autoActions?: StageAction[];
}

export type FieldType = 'text' | 'email' | 'phone' | 'number' | 'currency' | 'date' | 'datetime' | 'select' | 'multiselect' | 'boolean' | 'textarea' | 'url' | 'relation';

export interface SelectOption {
    value: string;
    label: string;
    color?: string;
}

export interface RelationConfig {
    entityType: string;
    displayField: string;
    multiple?: boolean;
}

export interface ValidationRule {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export interface FieldDefinition {
    id: string;
    name: string;
    type: FieldType;
    label: string;
    placeholder?: string;
    required: boolean;
    isFinancial?: boolean; // Hidden from restricted roles
    isSearchable?: boolean;
    isSortable?: boolean;
    showInKanban?: boolean;
    showInTable?: boolean;
    options?: SelectOption[]; // For select/multiselect types
    relationConfig?: RelationConfig; // For relation type
    validation?: ValidationRule;
    defaultValue?: any;
    order: number;
}

export interface PipelineConfig {
    id: string;
    companyId: string;
    name: string;
    description?: string;
    entityType: string; // 'students' | 'tutors' | 'packages' | custom
    stages: StageDefinition[];
    fields: FieldDefinition[];
    allowedRoles: string[];
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
}
