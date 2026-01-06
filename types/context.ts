/**
 * Context Types
 * Global application context type definition
 */

import type { AppState, Message, UploadedFile, TableSchema, BusinessProfile, PipelineRecommendation } from './core';
import type { Company, CompanySettings } from './company';
import type { User } from './user';
import type { CloudConfig } from './database';
import type { PipelineConfig } from './pipeline';
import type { RoleDefinition } from './permissions';

export interface GlobalContextType {
    currentView: AppState;
    setView: (view: AppState) => void;
    businessProfile: BusinessProfile;
    updateBusinessProfile: (data: Partial<BusinessProfile>) => void;

    // Data Management (legacy)
    uploadedFiles: UploadedFile[];
    dataSchemas: TableSchema[];
    addFile: (file: File, description: string) => Promise<void>;
    removeFile: (id: string) => void;
    updateFileDescription: (id: string, desc: string) => void;
    refineSchemas: () => Promise<void>;

    chatHistory: Message[];
    addMessage: (msg: Message) => void;

    pipelines: PipelineRecommendation[];
    setPipelines: (pipelines: PipelineRecommendation[]) => void;

    // Multi-tenant Auth
    user: User | null;
    company: Company | null;
    login: (email: string, password: string) => Promise<boolean>;
    register?: (name: string, email: string, password: string) => Promise<boolean>;
    logout: () => void;

    // CRM Configurations
    pipelineConfigs: PipelineConfig[];
    roleDefinitions: RoleDefinition[];

    // Infrastructure
    cloudConfig: CloudConfig;
    updateCloudConfig: (config: Partial<CloudConfig>) => void;
}
