// Type Definition Template
// Usage: Copy this file to types/<typeName>.ts
// Replace all instances of "TypeName" with your type name

// =============================================================================
// ENUMS / CONSTANTS
// =============================================================================

/**
 * Brief description of this enum
 */
export type TypeNameStatus = 'active' | 'inactive' | 'pending';

// =============================================================================
// BASE INTERFACES
// =============================================================================

/**
 * TypeName - Brief description of what this type represents
 */
export interface TypeName {
    /** Unique identifier */
    id: string;

    /** When this was created */
    createdAt: number;

    /** When this was last updated */
    updatedAt: number;

    // Add your fields here
}

// =============================================================================
// EXTENDED INTERFACES
// =============================================================================

/**
 * Extended version with additional fields
 */
export interface TypeNameWithDetails extends TypeName {
    // Additional fields
}

// =============================================================================
// INPUT / OUTPUT TYPES
// =============================================================================

/**
 * Data required to create a new TypeName
 */
export interface CreateTypeNameInput {
    // Required fields for creation (omit id, createdAt, updatedAt)
}

/**
 * Data for updating an existing TypeName
 */
export interface UpdateTypeNameInput {
    id: string;
    // Partial fields that can be updated
}

// =============================================================================
// REMEMBER TO:
// 1. Export from types/index.ts
// 2. Run: npm run build
// =============================================================================
