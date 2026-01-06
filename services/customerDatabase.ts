/**
 * Customer Database Service
 * Dynamic database adapter for per-tenant CRM data storage
 */

import type {
    DbConnectionConfig,
    CRMEntity,
    QueryFilters,
    PaginatedResult
} from '../types';
import { CustomerDatabaseAdapter, LocalStorageAdapter, SupabaseAdapter } from './database/adapters';

// ===== DATABASE FACTORY =====

export class CustomerDatabaseFactory {
    private static adapters: Map<string, CustomerDatabaseAdapter> = new Map();

    static createAdapter(config: DbConnectionConfig): CustomerDatabaseAdapter {
        // Check cache
        const cacheKey = `${config.companyId}_${config.type}_${config.id}`;
        if (this.adapters.has(cacheKey)) {
            return this.adapters.get(cacheKey)!;
        }

        let adapter: CustomerDatabaseAdapter;

        switch (config.type) {
            case 'supabase':
                adapter = new SupabaseAdapter(config);
                break;
            case 'postgres':
                // For direct PostgreSQL, we'd need a backend proxy
                // Fall back to local for now
                console.warn('Direct PostgreSQL not supported in browser. Using local storage.');
                adapter = new LocalStorageAdapter(config);
                break;
            case 'mysql':
                // Same as postgres
                console.warn('Direct MySQL not supported in browser. Using local storage.');
                adapter = new LocalStorageAdapter(config);
                break;
            case 'local':
            default:
                adapter = new LocalStorageAdapter(config);
                break;
        }

        this.adapters.set(cacheKey, adapter);
        return adapter;
    }

    static clearCache(): void {
        this.adapters.clear();
    }
}

// ===== CUSTOMER DATABASE SERVICE =====

export class CustomerDatabase {
    private adapter: CustomerDatabaseAdapter;

    constructor(config: DbConnectionConfig) {
        this.adapter = CustomerDatabaseFactory.createAdapter(config);
    }

    async testConnection(): Promise<boolean> {
        return this.adapter.testConnection();
    }

    // Generic methods exposed to the UI
    async getAll<T extends CRMEntity>(entityType: string, filters?: QueryFilters): Promise<PaginatedResult<T>> {
        return this.adapter.getAll<T>(entityType, filters);
    }

    async getById<T extends CRMEntity>(entityType: string, id: string): Promise<T | null> {
        return this.adapter.getById<T>(entityType, id);
    }

    async create<T extends CRMEntity>(entityType: string, data: Partial<T>): Promise<T> {
        return this.adapter.create<T>(entityType, data);
    }

    async update<T extends CRMEntity>(entityType: string, id: string, data: Partial<T>): Promise<T> {
        return this.adapter.update<T>(entityType, id, data);
    }

    async delete(entityType: string, id: string): Promise<void> {
        return this.adapter.delete(entityType, id);
    }

    async moveStage(entityType: string, id: string, newStage: string): Promise<void> {
        return this.adapter.moveStage(entityType, id, newStage);
    }

    async getByStage<T extends CRMEntity>(entityType: string, stage: string): Promise<T[]> {
        return this.adapter.getByStage<T>(entityType, stage);
    }

    async getStats(entityType: string): Promise<{ total: number; byStage: Record<string, number> }> {
        return this.adapter.getStats(entityType);
    }
}

// Re-export adapter types for external use
export { CustomerDatabaseAdapter } from './database/adapters';
