/**
 * CRM Page
 * Main CRM workspace with pipeline selector, view toggle, and data display
 */

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { GlobalContext } from '../App';
import {
    PipelineConfig,
    CRMEntity,
    QueryFilters,
    RoleDefinition
} from '../types';
import { CustomerDatabase } from '../services/customerDatabase';
import { platformDb } from '../services/platformDatabase';
import { canAccessPipeline, filterFieldsForRole } from '../services/permissions';
import { PipelineKanban } from '../components/PipelineKanban';
import { PipelineTable } from '../components/PipelineTable';
import { ViewToggle, ViewMode } from '../components/ViewToggle';
import { EntityForm } from '../components/EntityForm';
import {
    Users,
    GraduationCap,
    Package,
    RefreshCw,
    AlertCircle
} from 'lucide-react';

interface CRMProps {
    dbConnection: any;
}

export const CRM: React.FC<CRMProps> = ({ dbConnection }) => {
    const { user, company, pipelineConfigs, roleDefinitions } = useContext(GlobalContext);

    const [activePipeline, setActivePipeline] = useState<string>('students');
    const [viewMode, setViewMode] = useState<ViewMode>('kanban');
    const [items, setItems] = useState<CRMEntity[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState<QueryFilters>({
        page: 1,
        limit: 25,
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });

    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<CRMEntity | null>(null);
    const [formInitialStage, setFormInitialStage] = useState<string | undefined>();

    // Related data for displaying relations
    const [relatedData, setRelatedData] = useState<Record<string, CRMEntity[]>>({});

    // Get customer database instance
    const customerDb = dbConnection ? new CustomerDatabase(dbConnection) : null;

    // Get accessible pipelines for current user
    const accessiblePipelines = pipelineConfigs.filter(p =>
        user && canAccessPipeline(user, p.id, roleDefinitions, p)
    );

    const currentPipeline = pipelineConfigs.find(p => p.id === activePipeline);

    // Get icon for pipeline
    const getPipelineIcon = (pipelineId: string) => {
        switch (pipelineId) {
            case 'students': return <GraduationCap className="w-4 h-4" />;
            case 'tutors': return <Users className="w-4 h-4" />;
            case 'packages': return <Package className="w-4 h-4" />;
            default: return <Users className="w-4 h-4" />;
        }
    };

    // Load data
    const loadData = useCallback(async () => {
        if (!customerDb || !currentPipeline) return;

        setIsLoading(true);
        setError(null);

        try {
            if (viewMode === 'table') {
                const result = await customerDb.getAll<CRMEntity>(currentPipeline.entityType, filters);
                setItems(result.items);
                setTotal(result.total);
            } else {
                // For kanban, load all items (no pagination)
                const result = await customerDb.getAll<CRMEntity>(currentPipeline.entityType, {
                    sortBy: 'createdAt',
                    sortOrder: 'desc',
                    limit: 1000
                });
                setItems(result.items);
                setTotal(result.total);
            }

            // Load related data for relation fields
            const relationFields = currentPipeline.fields.filter(f => f.type === 'relation' && f.relationConfig);
            const relatedDataMap: Record<string, CRMEntity[]> = {};

            for (const field of relationFields) {
                if (field.relationConfig && !relatedDataMap[field.relationConfig.entityType]) {
                    const result = await customerDb.getAll<CRMEntity>(field.relationConfig.entityType, { limit: 500 });
                    relatedDataMap[field.relationConfig.entityType] = result.items;
                }
            }

            setRelatedData(relatedDataMap);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    }, [customerDb, currentPipeline, viewMode, filters]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle stage move (drag and drop)
    const handleMoveStage = async (itemId: string, newStage: string) => {
        if (!customerDb || !currentPipeline) return;

        try {
            await customerDb.moveStage(currentPipeline.entityType, itemId, newStage);

            // Optimistic update
            setItems(prev => prev.map(item =>
                item.id === itemId ? { ...item, stage: newStage } : item
            ));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to move item');
            loadData(); // Reload to sync state
        }
    };

    // Handle item click (open details/edit)
    const handleItemClick = (item: CRMEntity) => {
        setEditingItem(item);
        setFormInitialStage(item.stage);
        setShowForm(true);
    };

    // Handle add new item
    const handleAddItem = (stage?: string) => {
        setEditingItem(null);
        setFormInitialStage(stage);
        setShowForm(true);
    };

    // Handle save (create or update)
    const handleSave = async (data: Partial<CRMEntity>) => {
        if (!customerDb || !currentPipeline) return;

        try {
            if (editingItem) {
                await customerDb.update(currentPipeline.entityType, editingItem.id, data);
            } else {
                await customerDb.create(currentPipeline.entityType, data);
            }

            setShowForm(false);
            setEditingItem(null);
            loadData();
        } catch (err) {
            throw err; // Let the form handle the error
        }
    };

    // Handle delete
    const handleDelete = async (item: CRMEntity) => {
        if (!customerDb || !currentPipeline) return;

        if (!confirm(`Are you sure you want to delete this ${currentPipeline.entityType.slice(0, -1)}?`)) {
            return;
        }

        try {
            await customerDb.delete(currentPipeline.entityType, item.id);
            loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete');
        }
    };

    // Get visible fields based on user role
    const visibleFields = currentPipeline && user
        ? filterFieldsForRole(currentPipeline.fields, user, roleDefinitions)
        : [];

    if (!user || !company) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Please log in to access CRM</p>
            </div>
        );
    }

    if (accessiblePipelines.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                <AlertCircle className="w-12 h-12 text-gray-300" />
                <p className="text-gray-500 text-center">
                    You don't have access to any pipelines. Contact your administrator.
                </p>
            </div>
        );
    }

    // If current pipeline isn't accessible, switch to first accessible one
    if (!accessiblePipelines.find(p => p.id === activePipeline) && accessiblePipelines.length > 0) {
        setActivePipeline(accessiblePipelines[0].id);
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    {/* Pipeline Tabs */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        {accessiblePipelines.map(pipeline => (
                            <button
                                key={pipeline.id}
                                onClick={() => {
                                    setActivePipeline(pipeline.id);
                                    setFilters(prev => ({ ...prev, page: 1, stage: undefined, search: undefined }));
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                           ${activePipeline === pipeline.id
                                        ? 'bg-white text-deepBlue shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {getPipelineIcon(pipeline.id)}
                                <span className="hidden sm:inline">{pipeline.name.replace(' Pipeline', '')}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Refresh Button */}
                    <button
                        onClick={loadData}
                        disabled={isLoading}
                        className={`p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors
                       ${isLoading ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>

                    {/* View Toggle */}
                    <ViewToggle value={viewMode} onChange={setViewMode} />
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                    <button
                        onClick={() => setError(null)}
                        className="ml-auto text-red-400 hover:text-red-600"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {isLoading && items.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <RefreshCw className="w-8 h-8 text-teal animate-spin" />
                    </div>
                ) : currentPipeline ? (
                    viewMode === 'kanban' ? (
                        <PipelineKanban
                            pipeline={currentPipeline}
                            items={items}
                            user={user}
                            roles={roleDefinitions}
                            onMoveStage={handleMoveStage}
                            onItemClick={handleItemClick}
                            onAddItem={handleAddItem}
                            relatedData={relatedData}
                        />
                    ) : (
                        <PipelineTable
                            pipeline={currentPipeline}
                            items={items}
                            total={total}
                            page={filters.page || 1}
                            limit={filters.limit || 25}
                            user={user}
                            roles={roleDefinitions}
                            filters={filters}
                            onFiltersChange={setFilters}
                            onItemClick={handleItemClick}
                            onItemDelete={handleDelete}
                            onAddItem={() => handleAddItem()}
                            relatedData={relatedData}
                        />
                    )
                ) : null}
            </div>

            {/* Entity Form Modal */}
            {showForm && currentPipeline && (
                <EntityForm
                    pipeline={currentPipeline}
                    item={editingItem}
                    initialStage={formInitialStage}
                    onSave={handleSave}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingItem(null);
                    }}
                    relatedData={relatedData}
                    visibleFields={visibleFields}
                />
            )}
        </div>
    );
};

export default CRM;
