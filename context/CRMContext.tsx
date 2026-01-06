/**
 * CRM Context
 * Manages CRM-specific state: pipelines, roles, and database connections
 * 
 * @ai-context This context handles:
 * - Pipeline configurations (stages, fields)
 * - Role definitions and permissions
 * - Database connection state
 * - Customer database operations
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type {
    PipelineConfig,
    RoleDefinition,
    DbConnectionConfig,
    CRMEntity,
    QueryFilters,
    PaginatedResult
} from '../types';
import { platformDb } from '../services/platformDatabase';
import { CustomerDatabase } from '../services/customerDatabase';

// ===== TYPES =====

export interface CRMContextType {
    /** All pipeline configurations for current company */
    pipelineConfigs: PipelineConfig[];
    /** All role definitions for current company */
    roleDefinitions: RoleDefinition[];
    /** Current database connection config */
    dbConnection: DbConnectionConfig | null;
    /** Customer database instance */
    customerDb: CustomerDatabase | null;
    /** Whether CRM data is loading */
    isLoading: boolean;

    // Pipeline operations
    /** Load pipelines for a company */
    loadPipelines: (companyId: string) => Promise<void>;
    /** Get a specific pipeline by ID */
    getPipeline: (pipelineId: string) => PipelineConfig | undefined;
    /** Update a pipeline configuration */
    updatePipeline: (pipelineId: string, data: Partial<PipelineConfig>) => Promise<void>;
    /** Create a new pipeline */
    createPipeline: (data: Omit<PipelineConfig, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => Promise<PipelineConfig>;

    // Role operations
    /** Load roles for a company */
    loadRoles: (companyId: string) => Promise<void>;
    /** Get a specific role by ID */
    getRole: (roleId: string) => RoleDefinition | undefined;

    // Entity operations
    /** Get entities from customer database */
    getEntities: <T extends CRMEntity>(entityType: string, filters?: QueryFilters) => Promise<PaginatedResult<T>>;
    /** Create entity in customer database */
    createEntity: <T extends CRMEntity>(entityType: string, data: Partial<T>) => Promise<T>;
    /** Update entity in customer database */
    updateEntity: <T extends CRMEntity>(entityType: string, id: string, data: Partial<T>) => Promise<T>;
    /** Delete entity from customer database */
    deleteEntity: (entityType: string, id: string) => Promise<void>;
    /** Move entity to new stage */
    moveEntityStage: (entityType: string, id: string, newStage: string) => Promise<void>;
}

const defaultCRMContext: CRMContextType = {
    pipelineConfigs: [],
    roleDefinitions: [],
    dbConnection: null,
    customerDb: null,
    isLoading: false,
    loadPipelines: async () => { },
    getPipeline: () => undefined,
    updatePipeline: async () => { },
    createPipeline: async () => ({} as PipelineConfig),
    loadRoles: async () => { },
    getRole: () => undefined,
    getEntities: async () => ({ items: [], total: 0, page: 1, limit: 25, totalPages: 0 }),
    createEntity: async () => ({} as any),
    updateEntity: async () => ({} as any),
    deleteEntity: async () => { },
    moveEntityStage: async () => { },
};

// ===== CONTEXT =====

export const CRMContext = createContext<CRMContextType>(defaultCRMContext);

// ===== HOOK =====

/**
 * Hook to access CRM context
 * @ai-usage Use this hook to:
 * - Get pipelines: const { pipelineConfigs, getPipeline } = useCRM()
 * - Get roles: const { roleDefinitions, getRole } = useCRM()
 * - Perform CRUD: await createEntity('students', { name: 'John' })
 */
export const useCRM = () => {
    const context = useContext(CRMContext);
    if (!context) {
        throw new Error('useCRM must be used within a CRMProvider');
    }
    return context;
};

// ===== PROVIDER =====

interface CRMProviderProps {
    children: ReactNode;
    /** Company ID to load CRM data for */
    companyId?: string;
}

export const CRMProvider: React.FC<CRMProviderProps> = ({ children, companyId }) => {
    const [pipelineConfigs, setPipelineConfigs] = useState<PipelineConfig[]>([]);
    const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>([]);
    const [dbConnection, setDbConnection] = useState<DbConnectionConfig | null>(null);
    const [customerDb, setCustomerDb] = useState<CustomerDatabase | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load CRM data when companyId changes
    useEffect(() => {
        if (companyId) {
            loadPipelines(companyId);
            loadRoles(companyId);
            loadDbConnection(companyId);
        }
    }, [companyId]);

    const loadDbConnection = async (cId: string) => {
        const connection = await platformDb.getDbConnection(cId);
        setDbConnection(connection);
        if (connection) {
            setCustomerDb(new CustomerDatabase(connection));
        }
    };

    const loadPipelines = useCallback(async (cId: string) => {
        setIsLoading(true);
        const configs = await platformDb.getPipelineConfigs(cId);
        setPipelineConfigs(configs);
        setIsLoading(false);
    }, []);

    const loadRoles = useCallback(async (cId: string) => {
        const roles = await platformDb.getRoleDefinitions(cId);
        setRoleDefinitions(roles);
    }, []);

    const getPipeline = useCallback((pipelineId: string) => {
        return pipelineConfigs.find(p => p.id === pipelineId);
    }, [pipelineConfigs]);

    const updatePipeline = useCallback(async (pipelineId: string, data: Partial<PipelineConfig>) => {
        await platformDb.updatePipelineConfig(pipelineId, data);
        setPipelineConfigs(prev =>
            prev.map(p => p.id === pipelineId ? { ...p, ...data, updatedAt: Date.now() } : p)
        );
    }, []);

    const createPipeline = useCallback(async (
        data: Omit<PipelineConfig, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>
    ): Promise<PipelineConfig> => {
        if (!companyId) throw new Error('No company context');
        const newPipeline = await platformDb.savePipelineConfig(companyId, data);
        setPipelineConfigs(prev => [...prev, newPipeline]);
        return newPipeline;
    }, [companyId]);

    const getRole = useCallback((roleId: string) => {
        return roleDefinitions.find(r => r.id === roleId);
    }, [roleDefinitions]);

    // Entity operations using customer database
    const getEntities = useCallback(async <T extends CRMEntity>(
        entityType: string,
        filters?: QueryFilters
    ): Promise<PaginatedResult<T>> => {
        if (!customerDb) {
            return { items: [], total: 0, page: 1, limit: 25, totalPages: 0 };
        }
        return customerDb.getAll<T>(entityType, filters);
    }, [customerDb]);

    const createEntity = useCallback(async <T extends CRMEntity>(
        entityType: string,
        data: Partial<T>
    ): Promise<T> => {
        if (!customerDb) throw new Error('No database connection');
        return customerDb.create<T>(entityType, data);
    }, [customerDb]);

    const updateEntity = useCallback(async <T extends CRMEntity>(
        entityType: string,
        id: string,
        data: Partial<T>
    ): Promise<T> => {
        if (!customerDb) throw new Error('No database connection');
        return customerDb.update<T>(entityType, id, data);
    }, [customerDb]);

    const deleteEntity = useCallback(async (entityType: string, id: string): Promise<void> => {
        if (!customerDb) throw new Error('No database connection');
        return customerDb.delete(entityType, id);
    }, [customerDb]);

    const moveEntityStage = useCallback(async (
        entityType: string,
        id: string,
        newStage: string
    ): Promise<void> => {
        if (!customerDb) throw new Error('No database connection');
        return customerDb.moveStage(entityType, id, newStage);
    }, [customerDb]);

    const value: CRMContextType = {
        pipelineConfigs,
        roleDefinitions,
        dbConnection,
        customerDb,
        isLoading,
        loadPipelines,
        getPipeline,
        updatePipeline,
        createPipeline,
        loadRoles,
        getRole,
        getEntities,
        createEntity,
        updateEntity,
        deleteEntity,
        moveEntityStage,
    };

    return (
        <CRMContext.Provider value={value}>
            {children}
        </CRMContext.Provider>
    );
};
