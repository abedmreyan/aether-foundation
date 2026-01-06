/**
 * Database Types
 * Database connection and cloud configuration types
 */

export type DatabaseType = 'supabase' | 'postgres' | 'mysql' | 'local';

export interface DbConnectionConfig {
    id: string;
    companyId: string;
    type: DatabaseType;
    name: string;
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    apiUrl?: string;
    apiKey?: string;
    sslEnabled?: boolean;
    isActive: boolean;
    lastTestedAt?: number;
    testStatus?: 'success' | 'failed' | 'pending';
}

export interface CloudConfig {
    enabled: boolean;
    apiUrl: string;
    apiKey: string;
    isConnected: boolean;
}
