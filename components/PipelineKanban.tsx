/**
 * Pipeline Kanban Component
 * Dynamic kanban board that renders based on PipelineConfig
 */

import React, { useState, useCallback } from 'react';
import {
    PipelineConfig,
    CRMEntity,
    FieldDefinition,
    StageDefinition,
    User,
    RoleDefinition
} from '../types';
import { canPerformAction, filterFieldsForRole } from '../services/permissions';
import { Plus, MoreVertical, GripVertical, Phone, Mail, ChevronRight } from 'lucide-react';

interface PipelineKanbanProps {
    pipeline: PipelineConfig;
    items: CRMEntity[];
    user: User;
    roles: RoleDefinition[];
    onMoveStage: (itemId: string, newStage: string) => void;
    onItemClick: (item: CRMEntity) => void;
    onAddItem: (stage: string) => void;
    onRefresh?: () => void;
    relatedData?: Record<string, CRMEntity[]>;
}

interface KanbanCardProps {
    item: CRMEntity;
    fields: FieldDefinition[];
    stage: StageDefinition;
    onClick: () => void;
    onDragStart: (e: React.DragEvent) => void;
    relatedData?: Record<string, CRMEntity[]>;
}

const KanbanCard: React.FC<KanbanCardProps> = ({
    item,
    fields,
    stage,
    onClick,
    onDragStart,
    relatedData
}) => {
    const visibleFields = fields.filter(f => f.showInKanban && f.name !== 'stage');

    const getDisplayValue = (field: FieldDefinition, value: any): string => {
        if (!value) return '-';

        if (field.type === 'relation' && field.relationConfig && relatedData) {
            const relatedItems = relatedData[field.relationConfig.entityType] || [];
            const relatedItem = relatedItems.find(r => r.id === value);
            if (relatedItem) {
                return relatedItem[field.relationConfig.displayField] || value;
            }
        }

        if (field.type === 'currency') {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
        }

        if (field.type === 'date' || field.type === 'datetime') {
            return new Date(value).toLocaleDateString();
        }

        if (field.type === 'select' && field.options) {
            const option = field.options.find(o => o.value === value);
            return option?.label || value;
        }

        return String(value);
    };

    const primaryField = visibleFields[0];
    const secondaryFields = visibleFields.slice(1, 3);

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onClick={onClick}
            className="group bg-white rounded-lg border border-gray-200 p-4 cursor-pointer 
                 hover:shadow-md hover:border-teal/30 transition-all duration-200
                 active:scale-[0.98]"
        >
            {/* Drag Handle */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity">
                <GripVertical className="w-4 h-4 text-gray-400" />
            </div>

            {/* Primary Field (Name) */}
            {primaryField && (
                <div className="font-semibold text-deepBlue mb-2 truncate">
                    {getDisplayValue(primaryField, item[primaryField.name])}
                </div>
            )}

            {/* Secondary Fields */}
            <div className="space-y-1">
                {secondaryFields.map(field => (
                    <div key={field.id} className="flex items-center gap-2 text-xs text-gray-500">
                        {field.type === 'phone' && <Phone className="w-3 h-3 text-gray-400" />}
                        {field.type === 'email' && <Mail className="w-3 h-3 text-gray-400" />}
                        <span className="truncate">{getDisplayValue(field, item[field.name])}</span>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                <span className="text-[10px] text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-teal transition-colors" />
            </div>
        </div>
    );
};

interface KanbanColumnProps {
    stage: StageDefinition;
    items: CRMEntity[];
    fields: FieldDefinition[];
    canAdd: boolean;
    canMove: boolean;
    onAddItem: () => void;
    onItemClick: (item: CRMEntity) => void;
    onDrop: (itemId: string) => void;
    relatedData?: Record<string, CRMEntity[]>;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
    stage,
    items,
    fields,
    canAdd,
    canMove,
    onAddItem,
    onItemClick,
    onDrop,
    relatedData
}) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        if (!canMove) return;
        e.preventDefault();
        setIsDragOver(true);
    }, [canMove]);

    const handleDragLeave = useCallback(() => {
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        if (!canMove) return;
        e.preventDefault();
        setIsDragOver(false);
        const itemId = e.dataTransfer.getData('itemId');
        if (itemId) {
            onDrop(itemId);
        }
    }, [canMove, onDrop]);

    return (
        <div
            className={`flex flex-col min-w-[300px] max-w-[300px] bg-gray-50/50 rounded-xl transition-all duration-200
                  ${isDragOver ? 'bg-teal/5 ring-2 ring-teal/20' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200/50">
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="font-semibold text-deepBlue text-sm">{stage.name}</h3>
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                        {items.length}
                    </span>
                </div>

                {canAdd && (
                    <button
                        onClick={onAddItem}
                        className="p-1.5 text-gray-400 hover:text-teal hover:bg-teal/10 rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px]">
                {items.map(item => (
                    <KanbanCard
                        key={item.id}
                        item={item}
                        fields={fields}
                        stage={stage}
                        onClick={() => onItemClick(item)}
                        onDragStart={(e) => {
                            e.dataTransfer.setData('itemId', item.id);
                            e.dataTransfer.effectAllowed = 'move';
                        }}
                        relatedData={relatedData}
                    />
                ))}

                {items.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        No items in this stage
                    </div>
                )}
            </div>
        </div>
    );
};

export const PipelineKanban: React.FC<PipelineKanbanProps> = ({
    pipeline,
    items,
    user,
    roles,
    onMoveStage,
    onItemClick,
    onAddItem,
    relatedData
}) => {
    const sortedStages = [...pipeline.stages].sort((a, b) => a.order - b.order);
    const visibleFields = filterFieldsForRole(pipeline.fields, user, roles);

    const canAdd = canPerformAction(user, pipeline.id, 'create', roles);
    const canMove = canPerformAction(user, pipeline.id, 'move', roles);

    // Group items by stage
    const itemsByStage: Record<string, CRMEntity[]> = {};
    for (const stage of sortedStages) {
        itemsByStage[stage.id] = items.filter(item => item.stage === stage.id);
    }

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-280px)]">
            {sortedStages.map(stage => (
                <KanbanColumn
                    key={stage.id}
                    stage={stage}
                    items={itemsByStage[stage.id] || []}
                    fields={visibleFields}
                    canAdd={canAdd}
                    canMove={canMove}
                    onAddItem={() => onAddItem(stage.id)}
                    onItemClick={onItemClick}
                    onDrop={(itemId) => onMoveStage(itemId, stage.id)}
                    relatedData={relatedData}
                />
            ))}
        </div>
    );
};

export default PipelineKanban;
