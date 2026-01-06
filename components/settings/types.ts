/**
 * Settings Tab Types
 * Shared types and constants for settings sub-components
 * 
 * @ai-context This file contains shared types and interfaces
 * used across all settings tab components.
 */

import type { DatabaseType, CloudConfig } from '../../types';

export type SettingsTab = 'branding' | 'database' | 'defaults' | 'pipelines' | 'roles';

export interface BrandingFormState {
    name: string;
    logo: string;
    primaryColor: string;
    accentColor: string;
}

export interface DatabaseFormState {
    type: DatabaseType;
    name: string;
    host: string;
    port: string;
    database: string;
    username: string;
    password: string;
    apiUrl: string;
    apiKey: string;
    sslEnabled: boolean;
}

export interface DefaultsFormState {
    defaultView: 'kanban' | 'table';
    entriesPerPage: 25 | 50 | 100;
}

export type ConnectionTestStatus = 'idle' | 'testing' | 'success' | 'failed';

export interface SettingsTabProps {
    isSaving: boolean;
    onSave: () => Promise<void>;
}
