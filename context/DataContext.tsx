/**
 * Data Context
 * Manages legacy data operations: files, schemas, chat, and AI pipelines
 * 
 * @ai-context This context handles:
 * - File uploads and management
 * - Data schema detection and refinement
 * - Chat history with AI consultant
 * - Pipeline recommendations from AI
 * - Business profile management
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type {
    UploadedFile,
    TableSchema,
    Message,
    PipelineRecommendation,
    BusinessProfile,
    CloudConfig
} from '../types';
import { db } from '../services/database';
import { parseCSV, generateSchema, detectRelationships } from '../services/dataService';
import { analyzeDataSchemas } from '../services/geminiService';

// ===== TYPES =====

export interface DataContextType {
    /** Business profile for the current user */
    businessProfile: BusinessProfile;
    /** Update business profile */
    updateBusinessProfile: (data: Partial<BusinessProfile>) => void;

    /** Uploaded files metadata */
    uploadedFiles: UploadedFile[];
    /** Detected data schemas from uploaded files */
    dataSchemas: TableSchema[];
    /** Add a new file */
    addFile: (file: File, description: string) => Promise<void>;
    /** Remove an uploaded file */
    removeFile: (id: string) => Promise<void>;
    /** Update file description */
    updateFileDescription: (id: string, description: string) => void;
    /** Refine schemas using AI */
    refineSchemas: () => Promise<void>;

    /** Chat history with AI consultant */
    chatHistory: Message[];
    /** Add message to chat history */
    addMessage: (message: Message) => void;
    /** Clear chat history */
    clearChatHistory: () => void;

    /** AI-generated pipeline recommendations */
    pipelines: PipelineRecommendation[];
    /** Set pipeline recommendations */
    setPipelines: (pipelines: PipelineRecommendation[]) => void;

    /** Cloud configuration */
    cloudConfig: CloudConfig;
    /** Update cloud configuration */
    updateCloudConfig: (config: Partial<CloudConfig>) => void;
}

const defaultBusinessProfile: BusinessProfile = {
    name: '',
    industry: '',
    description: '',
    challenges: ''
};

const defaultDataContext: DataContextType = {
    businessProfile: defaultBusinessProfile,
    updateBusinessProfile: () => { },
    uploadedFiles: [],
    dataSchemas: [],
    addFile: async () => { },
    removeFile: async () => { },
    updateFileDescription: () => { },
    refineSchemas: async () => { },
    chatHistory: [],
    addMessage: () => { },
    clearChatHistory: () => { },
    pipelines: [],
    setPipelines: () => { },
    cloudConfig: { enabled: false, apiUrl: '', apiKey: '', isConnected: false },
    updateCloudConfig: () => { },
};

// ===== CONTEXT =====

export const DataContext = createContext<DataContextType>(defaultDataContext);

// ===== HOOK =====

/**
 * Hook to access data context
 * @ai-usage Use this hook to:
 * - Get files: const { uploadedFiles, addFile } = useData()
 * - Get schemas: const { dataSchemas, refineSchemas } = useData()
 * - Manage chat: const { chatHistory, addMessage } = useData()
 */
export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

// ===== PROVIDER =====

interface DataProviderProps {
    children: ReactNode;
    /** User email for database operations */
    userEmail?: string;
    /** Initial data to hydrate state */
    initialData?: {
        profile?: BusinessProfile;
        files?: UploadedFile[];
        schemas?: TableSchema[];
        pipelines?: PipelineRecommendation[];
    };
}

export const DataProvider: React.FC<DataProviderProps> = ({
    children,
    userEmail,
    initialData
}) => {
    const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(
        initialData?.profile || defaultBusinessProfile
    );
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(
        initialData?.files || []
    );
    const [dataSchemas, setDataSchemas] = useState<TableSchema[]>(
        initialData?.schemas || []
    );
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [pipelines, setPipelinesState] = useState<PipelineRecommendation[]>(
        initialData?.pipelines || []
    );
    const [cloudConfig, setCloudConfig] = useState<CloudConfig>(db.config);

    const updateBusinessProfile = useCallback((data: Partial<BusinessProfile>) => {
        setBusinessProfile(prev => {
            const updated = { ...prev, ...data };
            if (userEmail) db.updateProfile(userEmail, updated);
            return updated;
        });
    }, [userEmail]);

    const updateCloudConfig = useCallback((config: Partial<CloudConfig>) => {
        db.updateConfig(config);
        setCloudConfig(db.config);
    }, []);

    const addFile = useCallback(async (file: File, description: string) => {
        if (!userEmail) return;

        const rawData = await parseCSV(file);
        const newSchema = generateSchema(file.name, rawData);

        await db.createTable(userEmail, newSchema);

        const rows = rawData.slice(1);
        await db.insertRows(userEmail, newSchema.tableName, rows);

        const newFile: UploadedFile = {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            description
        };

        await db.saveFileRecord(userEmail, newFile);
        setUploadedFiles(prev => [...prev, newFile]);

        const allSchemas = [...dataSchemas, newSchema];
        const resolvedSchemas = detectRelationships(allSchemas);

        for (const s of resolvedSchemas) {
            await db.createTable(userEmail, s);
        }

        setDataSchemas(resolvedSchemas);
    }, [userEmail, dataSchemas]);

    const removeFile = useCallback(async (id: string) => {
        if (!userEmail) return;
        await db.deleteFileRecord(userEmail, id);
        setUploadedFiles(prev => prev.filter(f => f.id !== id));
    }, [userEmail]);

    const updateFileDescription = useCallback((id: string, description: string) => {
        setUploadedFiles(prev =>
            prev.map(f => f.id === id ? { ...f, description } : f)
        );
    }, []);

    const refineSchemas = useCallback(async () => {
        if (!userEmail || dataSchemas.length === 0) return;

        const optimizedSchemas = await analyzeDataSchemas(dataSchemas);
        setDataSchemas(optimizedSchemas);

        for (const s of optimizedSchemas) {
            await db.createTable(userEmail, s);
        }
    }, [userEmail, dataSchemas]);

    const addMessage = useCallback((message: Message) => {
        setChatHistory(prev => [...prev, message]);
    }, []);

    const clearChatHistory = useCallback(() => {
        setChatHistory([]);
    }, []);

    const setPipelines = useCallback(async (pipes: PipelineRecommendation[]) => {
        if (userEmail) {
            await db.savePipelines(userEmail, pipes);
        }
        setPipelinesState(pipes);
    }, [userEmail]);

    const value: DataContextType = {
        businessProfile,
        updateBusinessProfile,
        uploadedFiles,
        dataSchemas,
        addFile,
        removeFile,
        updateFileDescription,
        refineSchemas,
        chatHistory,
        addMessage,
        clearChatHistory,
        pipelines,
        setPipelines,
        cloudConfig,
        updateCloudConfig,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
