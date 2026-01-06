/**
 * CRM Types
 * Entity types and query/pagination utilities
 */

// ===== CRM ENTITY TYPES (Generic) =====

export interface CRMEntity {
    id: string;
    stage: string;
    createdAt: number;
    updatedAt: number;
    createdBy?: string;
    updatedBy?: string;
    metadata?: Record<string, any>;
    [key: string]: any; // Dynamic fields
}

// Specific entity types for Ajnabi (first customer)
export interface Student extends CRMEntity {
    name: string;
    email: string;
    phone: string;
    notes?: string;
}

export interface Tutor extends CRMEntity {
    name: string;
    email: string;
    phone: string;
    tier?: 'one' | 'two' | 'three';
    specializations?: string[];
    notes?: string;
}

export interface Package extends CRMEntity {
    studentId: string;
    tutorId?: string;
    subject?: string;
    totalLessons?: number;
    completedLessons?: number;
    price?: number; // Financial - restricted
    paidAmount?: number; // Financial - restricted
    startDate?: number;
    endDate?: number;
    notes?: string;
}

// ===== QUERY & FILTER TYPES =====

export interface QueryFilters {
    search?: string;
    stage?: string | string[];
    dateRange?: {
        field: string;
        from?: number;
        to?: number;
    };
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
    customFilters?: Record<string, any>;
}

export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
