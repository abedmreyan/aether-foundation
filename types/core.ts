/**
 * Core Types
 * Base types for messaging, state, and data schemas
 */

// ===== CORE MESSAGE TYPE =====

export interface Message {
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

// ===== DATABASE SCHEMA TYPES =====

export type ColumnType = 'UUID' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'DATE' | 'VARCHAR' | 'TEXT';

export interface ColumnDefinition {
    name: string;
    type: ColumnType;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    references?: {
        table: string;
        column: string;
    };
    sampleValue: string;
}

export interface TableSchema {
    tableName: string;
    columns: ColumnDefinition[];
    rowCount: number;
    rawData: string[][];
}

export interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    description: string;
}

export interface BusinessProfile {
    name: string;
    industry: string;
    description: string;
    challenges: string;
}

export interface PipelineRecommendation {
    title: string;
    description: string;
    steps: string[];
    efficiencyGain: string;
}

export enum AppState {
    LANDING = 'LANDING',
    ONBOARDING = 'ONBOARDING',
    DASHBOARD = 'DASHBOARD'
}
