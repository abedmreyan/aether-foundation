// Service Template
// Usage: Copy this file to services/<serviceName>.ts
// Replace all instances of "ServiceName" with your service name

import type { /* Import types from types/ */ } from '../types';

// =============================================================================
// TYPES (if service-specific)
// =============================================================================

interface ServiceConfig {
    // Configuration options
}

interface ServiceResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

/**
 * ServiceNameService - Brief description of what this service does
 * 
 * @example
 * const service = new ServiceNameService({ ... });
 * const result = await service.doSomething();
 */
export class ServiceNameService {
    private config: ServiceConfig;

    constructor(config: ServiceConfig) {
        this.config = config;
    }

    // ---------------------------------------------------------------------------
    // PUBLIC METHODS
    // ---------------------------------------------------------------------------

    /**
     * Brief description of method
     */
    async doSomething(): Promise<ServiceResult<void>> {
        try {
            // Implementation
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // ---------------------------------------------------------------------------
    // PRIVATE METHODS
    // ---------------------------------------------------------------------------

    private helperMethod(): void {
        // Internal logic
    }
}

// =============================================================================
// SINGLETON INSTANCE (optional)
// =============================================================================

// export const serviceName = new ServiceNameService({ ... });

// =============================================================================
// REMEMBER TO:
// 1. Export from services/index.ts
// 2. Run: npm run build
// =============================================================================
