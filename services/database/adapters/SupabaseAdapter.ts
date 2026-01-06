/**
 * Supabase Adapter
 * Database adapter for Supabase REST API
 */

import type {
    DbConnectionConfig,
    CRMEntity,
    QueryFilters,
    PaginatedResult
} from '../../../types';
import { CustomerDatabaseAdapter } from './CustomerDatabaseAdapter';

export class SupabaseAdapter extends CustomerDatabaseAdapter {
    private baseUrl: string;
    private headers: HeadersInit;

    constructor(config: DbConnectionConfig) {
        super(config);
        this.baseUrl = (config.apiUrl || '').replace(/\/$/, '');
        this.headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
            'apikey': config.apiKey || ''
        };
    }

    private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: { ...this.headers, ...options.headers }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return response.json();
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.fetch('/rest/v1/', { method: 'GET' });
            return true;
        } catch {
            return false;
        }
    }

    async getAll<T extends CRMEntity>(
        entityType: string,
        filters?: QueryFilters
    ): Promise<PaginatedResult<T>> {
        const params = new URLSearchParams();

        if (filters?.stage) {
            const stages = Array.isArray(filters.stage) ? filters.stage : [filters.stage];
            params.append('stage', `in.(${stages.join(',')})`);
        }

        if (filters?.sortBy) {
            params.append('order', `${filters.sortBy}.${filters.sortOrder || 'asc'}`);
        }

        const page = filters?.page || 1;
        const limit = filters?.limit || 25;
        const offset = (page - 1) * limit;

        params.append('offset', String(offset));
        params.append('limit', String(limit));

        const items = await this.fetch<T[]>(`/rest/v1/${entityType}?${params.toString()}`);

        // Get total count
        const countResponse = await fetch(`${this.baseUrl}/rest/v1/${entityType}?select=count`, {
            headers: { ...this.headers, 'Prefer': 'count=exact' }
        });
        const total = parseInt(countResponse.headers.get('content-range')?.split('/')[1] || '0', 10);

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getById<T extends CRMEntity>(entityType: string, id: string): Promise<T | null> {
        try {
            const items = await this.fetch<T[]>(`/rest/v1/${entityType}?id=eq.${id}&limit=1`);
            return items[0] || null;
        } catch {
            return null;
        }
    }

    async create<T extends CRMEntity>(entityType: string, data: Partial<T>): Promise<T> {
        const now = Date.now();
        const payload = {
            ...data,
            stage: data.stage || 'new',
            createdAt: now,
            updatedAt: now
        };

        const items = await this.fetch<T[]>(`/rest/v1/${entityType}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Prefer': 'return=representation' }
        });

        return items[0];
    }

    async update<T extends CRMEntity>(entityType: string, id: string, data: Partial<T>): Promise<T> {
        const payload = {
            ...data,
            updatedAt: Date.now()
        };

        const items = await this.fetch<T[]>(`/rest/v1/${entityType}?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
            headers: { 'Prefer': 'return=representation' }
        });

        return items[0];
    }

    async delete(entityType: string, id: string): Promise<void> {
        await this.fetch(`/rest/v1/${entityType}?id=eq.${id}`, {
            method: 'DELETE'
        });
    }

    async moveStage(entityType: string, id: string, newStage: string): Promise<void> {
        await this.update(entityType, id, { stage: newStage } as any);
    }

    async getByStage<T extends CRMEntity>(entityType: string, stage: string): Promise<T[]> {
        return this.fetch<T[]>(`/rest/v1/${entityType}?stage=eq.${stage}`);
    }

    async getStats(entityType: string): Promise<{ total: number; byStage: Record<string, number> }> {
        const items = await this.fetch<{ stage: string }[]>(`/rest/v1/${entityType}?select=stage`);

        const byStage: Record<string, number> = {};
        for (const item of items) {
            byStage[item.stage] = (byStage[item.stage] || 0) + 1;
        }

        return {
            total: items.length,
            byStage
        };
    }
}
