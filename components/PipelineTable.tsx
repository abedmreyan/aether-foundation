/**
 * Pipeline Table Component
 * Dynamic table view with pagination, sorting, and filtering
 */

import React, { useState, useMemo } from 'react';
import {
    PipelineConfig,
    CRMEntity,
    FieldDefinition,
    User,
    RoleDefinition,
    QueryFilters
} from '../types';
import { canPerformAction, filterFieldsForRole } from '../services/permissions';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Search,
    Filter,
    MoreVertical,
    Trash2,
    Edit2,
    Eye,
    Plus
} from 'lucide-react';

interface PipelineTableProps {
    pipeline: PipelineConfig;
    items: CRMEntity[];
    total: number;
    page: number;
    limit: number;
    user: User;
    roles: RoleDefinition[];
    filters: QueryFilters;
    onFiltersChange: (filters: QueryFilters) => void;
    onItemClick: (item: CRMEntity) => void;
    onItemDelete?: (item: CRMEntity) => void;
    onAddItem: () => void;
    relatedData?: Record<string, CRMEntity[]>;
}

const ENTRIES_OPTIONS = [25, 50, 100];

export const PipelineTable: React.FC<PipelineTableProps> = ({
    pipeline,
    items,
    total,
    page,
    limit,
    user,
    roles,
    filters,
    onFiltersChange,
    onItemClick,
    onItemDelete,
    onAddItem,
    relatedData
}) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStage, setSelectedStage] = useState<string>(filters.stage as string || '');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const visibleFields = filterFieldsForRole(pipeline.fields, user, roles)
        .filter(f => f.showInTable);

    const canAdd = canPerformAction(user, pipeline.id, 'create', roles);
    const canEdit = canPerformAction(user, pipeline.id, 'edit', roles);
    const canDelete = canPerformAction(user, pipeline.id, 'delete', roles);

    const totalPages = Math.ceil(total / limit);

    const getDisplayValue = (field: FieldDefinition, value: any): React.ReactNode => {
        if (value === undefined || value === null) return <span className="text-gray-300">-</span>;

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

        if (field.type === 'date') {
            return new Date(value).toLocaleDateString();
        }

        if (field.type === 'datetime') {
            return new Date(value).toLocaleString();
        }

        if (field.type === 'boolean') {
            return value ? (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Yes</span>
            ) : (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">No</span>
            );
        }

        if (field.type === 'select' && field.options) {
            const option = field.options.find(o => o.value === value);
            if (option) {
                return (
                    <span
                        className="px-2 py-0.5 text-xs rounded-full font-medium"
                        style={{
                            backgroundColor: option.color ? `${option.color}20` : '#f3f4f6',
                            color: option.color || '#6b7280'
                        }}
                    >
                        {option.label}
                    </span>
                );
            }
        }

        if (field.type === 'email') {
            return (
                <a href={`mailto:${value}`} className="text-teal hover:underline" onClick={e => e.stopPropagation()}>
                    {value}
                </a>
            );
        }

        if (field.type === 'phone') {
            return (
                <a href={`tel:${value}`} className="text-teal hover:underline" onClick={e => e.stopPropagation()}>
                    {value}
                </a>
            );
        }

        return String(value);
    };

    const getStageDisplay = (stageId: string) => {
        const stage = pipeline.stages.find(s => s.id === stageId);
        if (!stage) return stageId;

        return (
            <span
                className="px-2 py-1 text-xs rounded-full font-medium"
                style={{
                    backgroundColor: `${stage.color}20`,
                    color: stage.color
                }}
            >
                {stage.name}
            </span>
        );
    };

    const handleSearch = () => {
        onFiltersChange({ ...filters, search: searchTerm, page: 1 });
    };

    const handleStageFilter = (stage: string) => {
        setSelectedStage(stage);
        onFiltersChange({ ...filters, stage: stage || undefined, page: 1 });
    };

    const handleSort = (field: string) => {
        const newOrder = filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc';
        onFiltersChange({ ...filters, sortBy: field, sortOrder: newOrder });
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            onFiltersChange({ ...filters, page: newPage });
        }
    };

    const handleLimitChange = (newLimit: number) => {
        onFiltersChange({ ...filters, limit: newLimit, page: 1 });
    };

    const getSortIcon = (field: string) => {
        if (filters.sortBy !== field) {
            return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
        }
        return filters.sortOrder === 'asc'
            ? <ArrowUp className="w-3 h-3 text-teal" />
            : <ArrowDown className="w-3 h-3 text-teal" />;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 gap-4">
                <div className="flex items-center gap-3 flex-1">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20"
                        />
                    </div>

                    {/* Stage Filter */}
                    <div className="relative">
                        <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            value={selectedStage}
                            onChange={(e) => handleStageFilter(e.target.value)}
                            className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal appearance-none bg-white cursor-pointer"
                        >
                            <option value="">All Stages</option>
                            {pipeline.stages.map(stage => (
                                <option key={stage.id} value={stage.id}>{stage.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Add Button */}
                {canAdd && (
                    <button
                        onClick={onAddItem}
                        className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg text-sm font-medium hover:bg-teal/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add New
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Stage
                            </th>
                            {visibleFields.map(field => (
                                <th
                                    key={field.id}
                                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider
                              ${field.isSortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}`}
                                    onClick={() => field.isSortable && handleSort(field.name)}
                                >
                                    <div className="flex items-center gap-1">
                                        {field.label}
                                        {field.isSortable && getSortIcon(field.name)}
                                    </div>
                                </th>
                            ))}
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Created
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.map(item => (
                            <tr
                                key={item.id}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => onItemClick(item)}
                            >
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {getStageDisplay(item.stage)}
                                </td>
                                {visibleFields.map(field => (
                                    <td key={field.id} className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">
                                        {getDisplayValue(field, item[field.name])}
                                    </td>
                                ))}
                                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === item.id ? null : item.id);
                                            }}
                                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>

                                        {openMenuId === item.id && (
                                            <div
                                                className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={() => {
                                                        onItemClick(item);
                                                        setOpenMenuId(null);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <Eye className="w-4 h-4" /> View
                                                </button>
                                                {canEdit && (
                                                    <button
                                                        onClick={() => {
                                                            onItemClick(item);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        <Edit2 className="w-4 h-4" /> Edit
                                                    </button>
                                                )}
                                                {canDelete && onItemDelete && (
                                                    <button
                                                        onClick={() => {
                                                            onItemDelete(item);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Delete
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {items.length === 0 && (
                            <tr>
                                <td colSpan={visibleFields.length + 3} className="px-4 py-12 text-center text-gray-500">
                                    No items found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Show</span>
                    <select
                        value={limit}
                        onChange={(e) => handleLimitChange(Number(e.target.value))}
                        className="px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:border-teal"
                    >
                        {ENTRIES_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                    <span className="text-sm text-gray-500">entries</span>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                        Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} entries
                    </span>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={page === 1}
                            className="p-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                        >
                            <ChevronsLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            className="p-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <span className="px-3 py-1 text-sm font-medium text-deepBlue">
                            Page {page} of {totalPages || 1}
                        </span>

                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page >= totalPages}
                            className="p-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={page >= totalPages}
                            className="p-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                        >
                            <ChevronsRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PipelineTable;
