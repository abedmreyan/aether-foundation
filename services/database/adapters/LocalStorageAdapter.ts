/**
 * Local Storage Adapter
 * Database adapter for browser localStorage (sandbox/development)
 */

import type {
    DbConnectionConfig,
    CRMEntity,
    QueryFilters,
    PaginatedResult
} from '../../../types';
import { CustomerDatabaseAdapter } from './CustomerDatabaseAdapter';

const CUSTOMER_DATA_PREFIX = 'aether_customer_data_';

export class LocalStorageAdapter extends CustomerDatabaseAdapter {
    constructor(config: DbConnectionConfig) {
        super(config);
    }

    private getStorageKey(entityType: string): string {
        return `${CUSTOMER_DATA_PREFIX}${this.config.companyId}_${entityType}`;
    }

    private getData<T extends CRMEntity>(entityType: string): T[] {
        const key = this.getStorageKey(entityType);
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    }

    private saveData<T extends CRMEntity>(entityType: string, data: T[]): void {
        const key = this.getStorageKey(entityType);
        localStorage.setItem(key, JSON.stringify(data));
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    async testConnection(): Promise<boolean> {
        // Local storage is always available
        return true;
    }

    async getAll<T extends CRMEntity>(
        entityType: string,
        filters?: QueryFilters
    ): Promise<PaginatedResult<T>> {
        let data = this.getData<T>(entityType);

        // Apply filters
        if (filters) {
            // Search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                data = data.filter(item =>
                    Object.values(item).some(val =>
                        String(val).toLowerCase().includes(searchLower)
                    )
                );
            }

            // Stage filter
            if (filters.stage) {
                const stages = Array.isArray(filters.stage) ? filters.stage : [filters.stage];
                data = data.filter(item => stages.includes(item.stage));
            }

            // Date range filter
            if (filters.dateRange) {
                const { field, from, to } = filters.dateRange;
                data = data.filter(item => {
                    const value = item[field];
                    if (!value) return false;
                    if (from && value < from) return false;
                    if (to && value > to) return false;
                    return true;
                });
            }

            // Custom filters
            if (filters.customFilters) {
                for (const [key, value] of Object.entries(filters.customFilters)) {
                    data = data.filter(item => item[key] === value);
                }
            }

            // Sorting
            if (filters.sortBy) {
                const sortField = filters.sortBy;
                const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;
                data.sort((a, b) => {
                    const aVal = a[sortField];
                    const bVal = b[sortField];
                    if (aVal < bVal) return -1 * sortOrder;
                    if (aVal > bVal) return 1 * sortOrder;
                    return 0;
                });
            }
        }

        const total = data.length;
        const page = filters?.page || 1;
        const limit = filters?.limit || 25;
        const totalPages = Math.ceil(total / limit);

        // Pagination
        const startIndex = (page - 1) * limit;
        const items = data.slice(startIndex, startIndex + limit);

        return {
            items,
            total,
            page,
            limit,
            totalPages
        };
    }

    async getById<T extends CRMEntity>(entityType: string, id: string): Promise<T | null> {
        const data = this.getData<T>(entityType);
        return data.find(item => item.id === id) || null;
    }

    async create<T extends CRMEntity>(entityType: string, inputData: Partial<T>): Promise<T> {
        const data = this.getData<T>(entityType);
        const now = Date.now();

        const newItem = {
            id: this.generateId(),
            stage: 'new', // Default stage
            createdAt: now,
            updatedAt: now,
            ...inputData
        } as T;

        data.push(newItem);
        this.saveData(entityType, data);

        return newItem;
    }

    async update<T extends CRMEntity>(entityType: string, id: string, updateData: Partial<T>): Promise<T> {
        const data = this.getData<T>(entityType);
        const index = data.findIndex(item => item.id === id);

        if (index === -1) {
            throw new Error(`${entityType} with id ${id} not found`);
        }

        data[index] = {
            ...data[index],
            ...updateData,
            updatedAt: Date.now()
        };

        this.saveData(entityType, data);
        return data[index];
    }

    async delete(entityType: string, id: string): Promise<void> {
        const data = this.getData<CRMEntity>(entityType);
        const index = data.findIndex(item => item.id === id);

        if (index === -1) {
            throw new Error(`${entityType} with id ${id} not found`);
        }

        data.splice(index, 1);
        this.saveData(entityType, data);
    }

    async moveStage(entityType: string, id: string, newStage: string): Promise<void> {
        await this.update(entityType, id, { stage: newStage } as any);
    }

    async getByStage<T extends CRMEntity>(entityType: string, stage: string): Promise<T[]> {
        const data = this.getData<T>(entityType);
        return data.filter(item => item.stage === stage);
    }

    async getStats(entityType: string): Promise<{ total: number; byStage: Record<string, number> }> {
        const data = this.getData<CRMEntity>(entityType);
        const byStage: Record<string, number> = {};

        for (const item of data) {
            byStage[item.stage] = (byStage[item.stage] || 0) + 1;
        }

        return {
            total: data.length,
            byStage
        };
    }
}
