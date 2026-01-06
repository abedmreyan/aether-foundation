/**
 * Customer Database Adapter - Abstract Base Class
 * Base class for all database adapters
 */

import type {
    DbConnectionConfig,
    CRMEntity,
    QueryFilters,
    PaginatedResult
} from '../../../types';

export abstract class CustomerDatabaseAdapter {
    protected config: DbConnectionConfig;

    constructor(config: DbConnectionConfig) {
        this.config = config;
    }

    abstract testConnection(): Promise<boolean>;

    // Generic CRUD operations
    abstract getAll<T extends CRMEntity>(
        entityType: string,
        filters?: QueryFilters
    ): Promise<PaginatedResult<T>>;

    abstract getById<T extends CRMEntity>(
        entityType: string,
        id: string
    ): Promise<T | null>;

    abstract create<T extends CRMEntity>(
        entityType: string,
        data: Partial<T>
    ): Promise<T>;

    abstract update<T extends CRMEntity>(
        entityType: string,
        id: string,
        data: Partial<T>
    ): Promise<T>;

    abstract delete(
        entityType: string,
        id: string
    ): Promise<void>;

    abstract moveStage(
        entityType: string,
        id: string,
        newStage: string
    ): Promise<void>;

    abstract getByStage<T extends CRMEntity>(
        entityType: string,
        stage: string
    ): Promise<T[]>;

    abstract getStats(entityType: string): Promise<{
        total: number;
        byStage: Record<string, number>;
    }>;
}
